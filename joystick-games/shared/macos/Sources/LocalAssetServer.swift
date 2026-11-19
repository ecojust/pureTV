import Foundation
import Network
import CoreFoundation
import Darwin

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
        let relativePath: String
        let size: Int
        let mime: String
    }
    private final class Client {
        let socket: NWConnection
        var input = Data()
        var lastActivity = ProcessInfo.processInfo.systemUptime
        var responding = false
        var file: FileHandle?
        var remaining = 0
        init(_ socket: NWConnection) { self.socket = socket }
    }
    private let root: URL
    private let policy: Any?
    private var rootDescriptor: Int32?
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
    private static let chunkSize = 64 * 1024
    private static let queryLimit = 4096
    private static let mimeTypes: [String: String] = [
        "html": "text/html; charset=utf-8", "js": "application/javascript; charset=utf-8",
        "css": "text/css; charset=utf-8", "json": "application/json; charset=utf-8",
        "webmanifest": "application/manifest+json",
        "txt": "text/plain; charset=utf-8", "md": "text/plain; charset=utf-8", "svg": "image/svg+xml",
        "png": "image/png", "webp": "image/webp", "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "ico": "image/x-icon", "woff": "font/woff", "woff2": "font/woff2",
        "ttf": "font/ttf", "otf": "font/otf", "ogg": "audio/ogg", "wav": "audio/wav",
        "mp3": "audio/mpeg", "opus": "audio/ogg", "m4a": "audio/mp4",
        "glb": "model/gltf-binary", "gltf": "model/gltf+json",
        "bin": "application/octet-stream", "wasm": "application/wasm",
        "hdr": "application/octet-stream", "ktx2": "image/ktx2"
    ]

    init(root: URL, policy: Any? = Bundle.main.object(forInfoDictionaryKey: "PureTVAssetPolicy")) {
        self.root = root
        self.policy = policy
    }

    deinit { if let descriptor = rootDescriptor { Darwin.close(descriptor) } }

    private func limits() throws -> (asset: Int, total: Int) {
        guard let raw = policy else { return (Self.assetLimit, Self.totalAssetLimit) }
        guard let value = raw as? [String: Any],
              Set(value.keys) == Set(["schemaVersion", "maxAssetBytes", "maxTotalBytes", "maxApkBytes"]) else {
            throw Failure.assetBudget
        }
        func number(_ key: String, maximum: Int) throws -> Int {
            guard let n = value[key] as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID(),
                  ["c", "s", "i", "l", "q", "C", "S", "I", "L", "Q"].contains(String(cString: n.objCType)),
                  n.doubleValue.isFinite, n.doubleValue.rounded(.towardZero) == n.doubleValue,
                  n.doubleValue > 0, n.doubleValue <= Double(maximum) else { throw Failure.assetBudget }
            return n.intValue
        }
        guard try number("schemaVersion", maximum: 1) == 1 else { throw Failure.assetBudget }
        let asset = try number("maxAssetBytes", maximum: 64 * 1024 * 1024)
        let total = try number("maxTotalBytes", maximum: 256 * 1024 * 1024)
        _ = try number("maxApkBytes", maximum: 128_000_000)
        guard asset <= total else { throw Failure.assetBudget }
        return (asset, total)
    }

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
        for client in clients.values { try? client.file?.close(); client.socket.cancel() }
        clients.removeAll()
        entryURL = nil
        assets.removeAll()
        if let descriptor = rootDescriptor { Darwin.close(descriptor); rootDescriptor = nil }
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

    private static func safePath(_ path: String, nested: Bool) -> Bool {
        let parts = path.split(separator: "/", omittingEmptySubsequences: false)
        guard !parts.isEmpty, parts.count <= 16, path.utf8.count <= 1024,
              nested || parts.count == 1 else { return false }
        return parts.allSatisfy { part in
            let name = String(part), stem = part.split(separator: ".").first.map(String.init)?.uppercased() ?? ""
            let reserved = ["CON", "PRN", "AUX", "NUL"] + (1...9).flatMap { ["COM\($0)", "LPT\($0)"] }
            let bytes = Array(name.utf8)
            func alphanumeric(_ c: UInt8) -> Bool { (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) }
            return bytes.first.map(alphanumeric) == true && bytes.allSatisfy { alphanumeric($0) || $0 == 95 || $0 == 46 || $0 == 45 }
                && !name.hasSuffix(".") && !reserved.contains(stem)
                && !["node_modules", "__pycache__"].contains(name)
        }
    }

    // Resolve every component relative to the already opened root. O_NOFOLLOW
    // on only the final file would permit a replaced parent directory to escape.
    private static func openAsset(_ path: String, root descriptor: Int32) -> Int32? {
        let parts = path.split(separator: "/").map(String.init)
        var current = dup(descriptor)
        guard current >= 0 else { return nil }
        for (index, part) in parts.enumerated() {
            let flags = O_RDONLY | O_NOFOLLOW | (index == parts.count - 1 ? 0 : O_DIRECTORY)
            let next = openat(current, part, flags)
            Darwin.close(current)
            guard next >= 0 else { return nil }
            current = next
        }
        return current
    }

    private func loadAssets() throws {
        let budget = try limits()
        guard root.isFileURL else { throw Failure.invalidRoot }
        guard try root.resourceValues(forKeys: [.isSymbolicLinkKey]).isSymbolicLink != true else {
            throw Failure.invalidRoot
        }
        let canonical = root.standardizedFileURL.resolvingSymlinksInPath()
        let rootValues = try canonical.resourceValues(forKeys: [.isDirectoryKey])
        guard rootValues.isDirectory == true else { throw Failure.invalidRoot }
        let descriptor = open(canonical.path, O_RDONLY | O_DIRECTORY | O_NOFOLLOW)
        guard descriptor >= 0 else { throw Failure.invalidRoot }
        var keepDescriptor = false
        defer { if !keepDescriptor { Darwin.close(descriptor) } }
        var loaded: [String: Asset] = [:]
        var total = 0, nodes = 0, indexBytes = 2
        var seen = Set<String>()
        func visit(_ directory: URL, prefix: String) throws {
            let files = try FileManager.default.contentsOfDirectory(at: directory,
                includingPropertiesForKeys: [.isRegularFileKey, .isDirectoryKey, .isSymbolicLinkKey, .fileSizeKey], options: [])
            for file in files {
                let name = prefix + file.lastPathComponent
                nodes += 1
                guard nodes <= 4096 else { throw Failure.assetBudget }
                guard Self.safePath(name, nested: policy != nil), seen.insert(name.lowercased()).inserted else { throw Failure.invalidRoot }
                let values = try file.resourceValues(forKeys: [.isRegularFileKey, .isDirectoryKey, .isSymbolicLinkKey, .fileSizeKey])
                guard values.isSymbolicLink != true,
                      file.resolvingSymlinksInPath().path == file.standardizedFileURL.path else { throw Failure.invalidRoot }
                if values.isDirectory == true {
                    guard policy != nil else { throw Failure.invalidRoot }
                    try visit(file, prefix: name + "/")
                    continue
                }
                let ext = file.pathExtension.lowercased()
                let notice = policy != nil && file.lastPathComponent.range(of: "^(?:[A-Za-z0-9][A-Za-z0-9_-]*_)?(?:LICENSE|NOTICE|COPYING)$", options: .regularExpression) != nil
                guard let mime = notice ? "text/plain; charset=utf-8" : Self.mimeTypes[ext], values.isRegularFile == true else { throw Failure.invalidRoot }
                if policy == nil && ["glb", "gltf", "bin", "wasm", "hdr", "ktx2", "opus", "m4a", "md", "webmanifest"].contains(ext) { throw Failure.invalidRoot }
                guard let handle = Self.openAsset(name, root: descriptor) else { throw Failure.invalidRoot }
                var info = stat()
                let valid = fstat(handle, &info) == 0 && (info.st_mode & mode_t(S_IFMT)) == mode_t(S_IFREG)
                Darwin.close(handle)
                guard valid else { throw Failure.invalidRoot }
                guard let size = values.fileSize, size >= 0, size <= budget.asset, info.st_size == Int64(size) else { throw Failure.assetBudget }
                total += size
                indexBytes += name.utf8.count + 2 + (loaded.isEmpty ? 0 : 1)
                guard total <= budget.total, loaded.count < 2048, indexBytes <= 65536 else { throw Failure.assetBudget }
                loaded[name] = Asset(relativePath: name, size: size, mime: mime)
            }
        }
        try visit(canonical, prefix: "")
        guard loaded["tv.html"] != nil else { throw Failure.missingEntry }
        assets = loaded
        rootDescriptor = descriptor
        keepDescriptor = true
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
        guard let path = Self.requestPath(request[1]) else {
            respond(id, status: 400, message: "Bad Request"); return
        }
        let name = String(path.dropFirst())
        guard Self.safePath(name, nested: policy != nil) else {
            respond(id, status: 404, message: "Not Found"); return
        }
        guard let asset = assets[name] else { respond(id, status: 404, message: "Not Found"); return }
        // A single byte range is enough for local audio/video seek requests.
        // Range applies to GET only. Without validators If-Range falls back to
        // the complete representation, as required by its conditional meaning.
        var lower = 0, length = asset.size, status = 200
        if method == "GET", headers["if-range"] == nil, let range = headers["range"] {
            guard let selected = Self.byteRange(range, size: asset.size) else {
                respond(id, status: 416, message: "Range Not Satisfiable",
                        extraHeaders: "Content-Range: bytes */\(asset.size)\r\n"); return
            }
            lower = selected.lowerBound; length = selected.count; status = 206
        }
        stream(id, asset: asset, offset: lower, length: length, status: status, head: method == "HEAD")
    }

    // Queries are cache keys and client-side navigation state, never filesystem
    // paths. Keep their encoded bytes for the browser; only route the path.
    static func requestPath(_ target: String) -> String? {
        guard target.hasPrefix("/"), !target.contains("#") else { return nil }
        let parts = target.split(separator: "?", maxSplits: 1, omittingEmptySubsequences: false)
        let path = String(parts[0])
        guard let decoded = path.removingPercentEncoding, decoded == path else { return nil }
        if parts.count == 2 {
            let query = Array(parts[1].utf8)
            guard query.count <= queryLimit else { return nil }
            func hex(_ value: UInt8) -> UInt8? {
                if value >= 48 && value <= 57 { return value - 48 }
                if value >= 65 && value <= 70 { return value - 65 + 10 }
                if value >= 97 && value <= 102 { return value - 97 + 10 }
                return nil
            }
            let punctuation = Set("-._~!$&'()*+,;=:@/?".utf8)
            var index = 0
            while index < query.count {
                let byte = query[index]
                if byte == 37 {
                    guard index + 2 < query.count, let high = hex(query[index + 1]),
                          let low = hex(query[index + 2]) else { return nil }
                    let value = high * 16 + low
                    guard value >= 32, value != 127, value != 92 else { return nil }
                    index += 3
                } else {
                    guard (byte >= 48 && byte <= 57) || (byte >= 65 && byte <= 90)
                        || (byte >= 97 && byte <= 122) || punctuation.contains(byte) else { return nil }
                    index += 1
                }
            }
        }
        return path
    }

    static func allowsEntryNavigation(_ url: URL, entry: URL, isMainFrame: Bool) -> Bool {
        guard isMainFrame, url.user == nil, url.password == nil,
              url.scheme == entry.scheme, url.host == entry.host, url.port == entry.port,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let original = URLComponents(url: entry, resolvingAgainstBaseURL: false),
              original.percentEncodedPath == "/tv.html" else { return false }
        let target = components.percentEncodedPath + (components.percentEncodedQuery.map { "?" + $0 } ?? "")
        return requestPath(target) == original.percentEncodedPath
    }

    static func byteRange(_ value: String, size: Int) -> Range<Int>? {
        guard size > 0, value.hasPrefix("bytes=") else { return nil }
        let parts = value.dropFirst(6).split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2, parts.allSatisfy({ $0.utf8.allSatisfy({ $0 >= 48 && $0 <= 57 }) }) else { return nil }
        if parts[0].isEmpty {
            guard let suffix = Int(parts[1]), suffix > 0 else { return nil }
            return max(0, size - min(size, suffix))..<size
        }
        guard let lower = Int(parts[0]), lower < size else { return nil }
        if parts[1].isEmpty { return lower..<size }
        guard let upper = Int(parts[1]), upper >= lower else { return nil }
        return lower..<(min(upper, size - 1) + 1)
    }

    private func stream(_ id: UUID, asset: Asset, offset: Int, length: Int, status: Int, head: Bool) {
        guard let client = clients[id], !client.responding else { return }
        guard let root = rootDescriptor, let descriptor = Self.openAsset(asset.relativePath, root: root) else {
            respond(id, status: 404, message: "Not Found"); return
        }
        var info = stat()
        guard fstat(descriptor, &info) == 0, (info.st_mode & mode_t(S_IFMT)) == mode_t(S_IFREG),
              info.st_size == Int64(asset.size) else {
            Darwin.close(descriptor); respond(id, status: 404, message: "Not Found"); return
        }
        let file = FileHandle(fileDescriptor: descriptor, closeOnDealloc: true)
        do { try file.seek(toOffset: UInt64(offset)) }
        catch { try? file.close(); respond(id, status: 500, message: "Read Error"); return }
        client.file = file; client.remaining = head ? 0 : length
        client.responding = true; client.input.removeAll()
        let message = status == 206 ? "Partial Content" : "OK"
        var extra = "Accept-Ranges: bytes\r\n"
        if status == 206 { extra += "Content-Range: bytes \(offset)-\(offset + length - 1)/\(asset.size)\r\n" }
        send(id, bytes: responseHeader(status: status, message: message, mime: asset.mime, length: length, extra: extra)) {
            [weak self] in self?.sendChunk(id)
        }
    }

    private func sendChunk(_ id: UUID) {
        guard let client = clients[id], let file = client.file else { return }
        guard client.remaining > 0 else { close(id); return }
        do {
            let count = min(client.remaining, Self.chunkSize)
            guard let bytes = try file.read(upToCount: count), bytes.count == count else { close(id); return }
            client.remaining -= bytes.count
            send(id, bytes: bytes) { [weak self] in self?.sendChunk(id) }
        } catch { close(id) }
    }

    private func responseHeader(status: Int, message: String, mime: String, length: Int, extra: String = "") -> Data {
        var header = "HTTP/1.1 \(status) \(message)\r\nContent-Type: \(mime)\r\nContent-Length: \(length)\r\n"
        header += "Cache-Control: no-store\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n"
        header += "Cross-Origin-Resource-Policy: same-origin\r\nReferrer-Policy: no-referrer\r\n"
        if status == 405 { header += "Allow: GET, HEAD\r\n" }
        return Data((header + extra + "\r\n").utf8)
    }

    private func send(_ id: UUID, bytes: Data, then completion: @escaping () -> Void) {
        guard let client = clients[id] else { return }
        client.lastActivity = ProcessInfo.processInfo.systemUptime
        let expected = generation
        client.socket.send(content: bytes, completion: .contentProcessed { [weak self, weak client] error in
            guard let self = self, let client = client, self.generation == expected,
                  self.clients[id] === client else { return }
            if error != nil { self.close(id) } else { completion() }
        })
    }

    private func respond(_ id: UUID, status: Int, message: String, body: Data? = nil,
                         mime: String = "text/plain; charset=utf-8", head: Bool = false,
                         extraHeaders: String = "") {
        guard let client = clients[id], !client.responding else { return }
        client.responding = true
        client.input.removeAll()
        let bytes = body ?? Data((message + "\n").utf8)
        var response = responseHeader(status: status, message: message, mime: mime, length: bytes.count, extra: extraHeaders)
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
        if let client = clients.removeValue(forKey: id) {
            try? client.file?.close()
            client.socket.cancel()
        }
    }
}
