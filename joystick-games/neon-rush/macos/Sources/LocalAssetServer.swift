import Foundation
import Network

/// A private origin for the bundled game. It never listens on LAN interfaces.
/// All public methods and Network callbacks execute on the main queue.
final class LocalAssetServer {
    private enum Failure: LocalizedError {
        case invalidRoot, missingEntry, assetBudget, invalidPort, cancelled
        var errorDescription: String? {
            switch self {
            case .invalidRoot: return "The bundled game resource directory is invalid."
            case .missingEntry: return "The bundled game entry page is missing."
            case .assetBudget: return "The bundled game exceeds its resource size limit."
            case .invalidPort: return "The local game server did not acquire a port."
            case .cancelled: return "The local game server was stopped."
            }
        }
    }
    private struct Asset {
        let bytes: Data
        let mime: String
    }
    private final class Client {
        let socket: NWConnection
        var input = Data()
        var lastActivity = ProcessInfo.processInfo.systemUptime
        var responding = false
        init(_ socket: NWConnection) { self.socket = socket }
    }
    private let root: URL
    private var listener: NWListener?
    private var generation = 0
    private var entryURL: URL?
    private var assets: [String: Asset] = [:]
    private var clients: [UUID: Client] = [:]
    private var pendingStarts: [(Result<URL, Error>) -> Void] = []
    private var watchdog: Timer?
    private static let headerLimit = 8 * 1024
    private static let assetLimit = 10 * 1024 * 1024
    private static let totalAssetLimit = 32 * 1024 * 1024
    private static let mimeTypes: [String: String] = [
        "html": "text/html; charset=utf-8", "js": "application/javascript; charset=utf-8",
        "css": "text/css; charset=utf-8", "json": "application/json; charset=utf-8",
        "txt": "text/plain; charset=utf-8", "svg": "image/svg+xml",
        "png": "image/png", "webp": "image/webp", "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "ico": "image/x-icon", "woff": "font/woff", "woff2": "font/woff2",
        "ttf": "font/ttf", "otf": "font/otf", "ogg": "audio/ogg", "wav": "audio/wav",
        "mp3": "audio/mpeg"
    ]

    init(root: URL) { self.root = root }

    func start(completion: @escaping (Result<URL, Error>) -> Void) {
        precondition(Thread.isMainThread)
        if let url = entryURL { completion(.success(url)); return }
        pendingStarts.append(completion)
        if listener != nil { return }
        do {
            try loadAssets()
            generation += 1
            let expected = generation
            let parameters = NWParameters.tcp
            (parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options)?.version = .v4
            parameters.requiredLocalEndpoint = .hostPort(host: "127.0.0.1", port: .any)
            parameters.includePeerToPeer = false
            let candidate = try NWListener(using: parameters)
            listener = candidate
            candidate.newConnectionHandler = { [weak self, weak candidate] connection in
                guard let self = self, self.generation == expected, self.listener === candidate else {
                    connection.cancel(); return
                }
                self.accept(connection, generation: expected)
            }
            candidate.stateUpdateHandler = { [weak self, weak candidate] state in
                guard let self = self, self.generation == expected, self.listener === candidate else { return }
                switch state {
                case .ready:
                    guard let port = candidate?.port?.rawValue, port > 0,
                          let url = URL(string: "http://127.0.0.1:\(port)/tv.html") else {
                        self.fail(Failure.invalidPort); return
                    }
                    self.entryURL = url
                    self.completeStarts(.success(url))
                case .failed(let error): self.fail(error)
                default: break
                }
            }
            watchdog = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
                guard let self = self else { return }
                let cutoff = ProcessInfo.processInfo.systemUptime - 10
                for (id, client) in Array(self.clients) where client.lastActivity < cutoff { self.close(id) }
            }
            candidate.start(queue: .main)
        } catch { fail(error) }
    }

    func stop() {
        precondition(Thread.isMainThread)
        teardown()
        completeStarts(.failure(Failure.cancelled))
    }

    private func teardown() {
        generation += 1
        watchdog?.invalidate(); watchdog = nil
        listener?.cancel(); listener = nil
        for client in clients.values { client.socket.cancel() }
        clients.removeAll()
        entryURL = nil
        assets.removeAll()
    }

    private func fail(_ error: Error) {
        teardown()
        completeStarts(.failure(error))
    }

    private func completeStarts(_ result: Result<URL, Error>) {
        let callbacks = pendingStarts
        pendingStarts.removeAll()
        for callback in callbacks { callback(result) }
    }

    private func loadAssets() throws {
        guard root.isFileURL else { throw Failure.invalidRoot }
        let canonical = root.standardizedFileURL.resolvingSymlinksInPath()
        let rootValues = try canonical.resourceValues(forKeys: [.isDirectoryKey])
        guard rootValues.isDirectory == true else { throw Failure.invalidRoot }
        let files = try FileManager.default.contentsOfDirectory(at: canonical,
            includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey],
            options: [.skipsHiddenFiles])
        var loaded: [String: Asset] = [:]
        var total = 0
        for file in files {
            let name = file.lastPathComponent
            guard !name.isEmpty, !name.contains("/"), !name.contains("\\"),
                  let mime = Self.mimeTypes[file.pathExtension.lowercased()] else { continue }
            let values = try file.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
            guard values.isRegularFile == true, values.isSymbolicLink != true,
                  file.resolvingSymlinksInPath().deletingLastPathComponent().path == canonical.path else {
                throw Failure.invalidRoot
            }
            guard let size = values.fileSize, size >= 0, size <= Self.assetLimit else { throw Failure.assetBudget }
            let bytes = try Data(contentsOf: file)
            guard bytes.count == size, bytes.count <= Self.assetLimit else { throw Failure.assetBudget }
            total += bytes.count
            guard total <= Self.totalAssetLimit else { throw Failure.assetBudget }
            loaded[name] = Asset(bytes: bytes, mime: mime)
        }
        guard loaded["tv.html"] != nil else { throw Failure.missingEntry }
        assets = loaded
    }

    private func accept(_ socket: NWConnection, generation expected: Int) {
        guard clients.count < 16, entryURL != nil else { socket.cancel(); return }
        let id = UUID()
        clients[id] = Client(socket)
        socket.stateUpdateHandler = { [weak self, weak socket] state in
            guard let self = self, self.generation == expected,
                  let current = self.clients[id], current.socket === socket else { return }
            switch state {
            case .ready: self.receive(id, generation: expected)
            case .failed, .cancelled: self.close(id)
            default: break
            }
        }
        socket.start(queue: .main)
    }

    private func receive(_ id: UUID, generation expected: Int) {
        guard let client = clients[id], !client.responding else { return }
        client.socket.receive(minimumIncompleteLength: 1, maximumLength: Self.headerLimit + 1) {
            [weak self, weak client] data, _, complete, error in
            guard let self = self, let client = client, self.generation == expected,
                  self.clients[id] === client, !client.responding else { return }
            if let data = data, !data.isEmpty {
                client.lastActivity = ProcessInfo.processInfo.systemUptime
                client.input.append(data)
                if client.input.count > Self.headerLimit {
                    self.respond(id, status: 431, message: "Request Header Fields Too Large"); return
                }
                if let terminator = client.input.range(of: Data([13, 10, 13, 10])) {
                    let header = client.input.subdata(in: 0..<terminator.lowerBound)
                    // No request bodies or pipelining are supported on this private origin.
                    guard terminator.upperBound == client.input.count else {
                        self.respond(id, status: 400, message: "Bad Request"); return
                    }
                    self.handle(id, header: header); return
                }
            }
            if complete || error != nil { self.close(id) }
            else { self.receive(id, generation: expected) }
        }
    }

    private func handle(_ id: UUID, header: Data) {
        guard let text = String(data: header, encoding: .ascii) else {
            respond(id, status: 400, message: "Bad Request"); return
        }
        let lines = text.components(separatedBy: "\r\n")
        guard !lines.isEmpty, lines.count <= 64 else { respond(id, status: 400, message: "Bad Request"); return }
        let request = lines[0].components(separatedBy: " ")
        guard request.count == 3, request[2] == "HTTP/1.1" || request[2] == "HTTP/1.0" else {
            respond(id, status: 400, message: "Bad Request"); return
        }
        let method = request[0]
        guard method == "GET" || method == "HEAD" else { respond(id, status: 405, message: "Method Not Allowed"); return }
        var headers: [String: String] = [:]
        for line in lines.dropFirst() {
            guard let colon = line.firstIndex(of: ":"), colon != line.startIndex,
                  line.first != " ", line.first != "\t" else {
                respond(id, status: 400, message: "Bad Request"); return
            }
            let name = line[..<colon].lowercased()
            guard name.utf8.allSatisfy({ ($0 >= 97 && $0 <= 122) || ($0 >= 48 && $0 <= 57) || $0 == 45 }),
                  headers[name] == nil else { respond(id, status: 400, message: "Bad Request"); return }
            let value = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespaces)
            guard !value.utf8.contains(where: { $0 < 32 && $0 != 9 || $0 == 127 }) else {
                respond(id, status: 400, message: "Bad Request"); return
            }
            headers[name] = value
        }
        guard let port = entryURL?.port, headers["host"] == "127.0.0.1:\(port)" else {
            respond(id, status: 403, message: "Forbidden"); return
        }
        guard headers["transfer-encoding"] == nil,
              headers["content-length"] == nil || headers["content-length"] == "0" else {
            respond(id, status: 400, message: "Bad Request"); return
        }
        let target = request[1]
        guard target.hasPrefix("/"), !target.contains("?"), !target.contains("#"),
              let decoded = target.removingPercentEncoding else {
            respond(id, status: 400, message: "Bad Request"); return
        }
        let name = String(decoded.dropFirst())
        guard !name.isEmpty, name != ".", name != "..", !name.hasPrefix("."),
              !name.contains("/"), !name.contains("\\"),
              !name.unicodeScalars.contains(where: { $0.value < 32 || $0.value == 127 }) else {
            respond(id, status: 404, message: "Not Found"); return
        }
        guard let asset = assets[name] else { respond(id, status: 404, message: "Not Found"); return }
        respond(id, status: 200, message: "OK", body: asset.bytes, mime: asset.mime, head: method == "HEAD")
    }

    private func respond(_ id: UUID, status: Int, message: String, body: Data? = nil,
                         mime: String = "text/plain; charset=utf-8", head: Bool = false) {
        guard let client = clients[id], !client.responding else { return }
        client.responding = true
        client.input.removeAll()
        let bytes = body ?? Data((message + "\n").utf8)
        var header = "HTTP/1.1 \(status) \(message)\r\nContent-Type: \(mime)\r\nContent-Length: \(bytes.count)\r\n"
        header += "Cache-Control: no-store\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n"
        header += "Cross-Origin-Resource-Policy: same-origin\r\nReferrer-Policy: no-referrer\r\n"
        if status == 405 { header += "Allow: GET, HEAD\r\n" }
        header += "\r\n"
        var response = Data(header.utf8)
        if !head { response.append(bytes) }
        client.lastActivity = ProcessInfo.processInfo.systemUptime
        let expected = generation
        client.socket.send(content: response, completion: .contentProcessed { [weak self, weak client] _ in
            guard let self = self, let client = client, self.generation == expected,
                  self.clients[id] === client else { return }
            self.close(id)
        })
    }

    private func close(_ id: UUID) {
        clients.removeValue(forKey: id)?.socket.cancel()
    }
}
