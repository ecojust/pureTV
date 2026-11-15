import Foundation
import CoreFoundation
import Network
import Darwin

/// The protocol state is independent of sockets, Bonjour and the game renderer.
/// All callers (including Network callbacks) use the main queue.
final class ControllerProtocol {
    static let keys = ["UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"]
    static let maxInteger: Int64 = 9_007_199_254_740_991
    struct Peer {
        let createdAt: TimeInterval
        var lastMessageAt: TimeInterval
        var identity: String?
        var lastSequence: Int64 = -1
        var held = Set<String>()
        var blocked = Set<String>()
        var counters: [String: Int64] = ["a": 0, "b": 0, "start": 0, "left": 0, "right": 0, "up": 0, "down": 0]
        func input(_ key: String) -> Bool { held.contains(key) && !blocked.contains(key) }
        func action(_ name: String) -> Bool {
            switch name {
            case "a": return input("A") || input("X")
            case "b": return input("B") || input("Y")
            case "start": return input("START")
            default: return input(name.uppercased())
            }
        }
    }
    struct Reply {
        let object: [String: Any]
        var close = false
        var replaced: UUID?
    }
    private(set) var peers: [UUID: Peer] = [:]
    private(set) var owner: UUID?
    private(set) var revision: Int64 = 0
    private(set) var cancelSequence: Int64 = 0
    private var lastIdentity = ""
    private var session = ""
    private let instance = UUID().uuidString
    private var sessionNumber: Int64 = 0
    var onChange: (() -> Void)?

    @discardableResult func add(_ id: UUID, at time: TimeInterval) -> Bool {
        guard peers.count < 4, peers[id] == nil else { return false }
        peers[id] = Peer(createdAt: time, lastMessageAt: time)
        return true
    }
    private func changed() { revision += 1; onChange?() }
    func disconnect(_ id: UUID) {
        guard peers.removeValue(forKey: id) != nil else { return }
        if owner == id { owner = nil; cancelSequence += 1; changed() }
    }
    func releaseInputs() {
        if let id = owner, var peer = peers[id] {
            peer.blocked.formUnion(peer.held)
            peers[id] = peer
        }
        cancelSequence += 1
        changed()
    }
    func stop() {
        peers.removeAll()
        owner = nil
        cancelSequence += 1
        changed()
    }
    func expired(at time: TimeInterval) -> [UUID] {
        peers.compactMap { id, peer in
            let expired = peer.identity == nil ? time - peer.createdAt > 5 : time - peer.lastMessageAt > 20
            return expired ? id : nil
        }
    }
    static func integer(_ value: Any?) -> Int64? {
        guard let number = value as? NSNumber, CFGetTypeID(number) != CFBooleanGetTypeID() else { return nil }
        let d = number.doubleValue
        guard d.isFinite, d >= 0, d <= Double(maxInteger), d.rounded(.down) == d else { return nil }
        return Int64(d)
    }
    static func boolean(_ value: Any?) -> Bool? {
        guard let number = value as? NSNumber, CFGetTypeID(number) == CFBooleanGetTypeID() else { return nil }
        return number.boolValue
    }
    func receive(_ line: Data, from id: UUID, at time: TimeInterval) -> Reply {
        func error(_ code: String, _ sequence: Int64? = nil) -> Reply {
            var value: [String: Any] = ["type": "error", "message": code]
            if let sequence = sequence { value["seq"] = sequence }
            return Reply(object: value, close: true)
        }
        guard peers[id] != nil else { return error("connection_closed") }
        guard String(data: line, encoding: .utf8) != nil,
              let value = try? JSONSerialization.jsonObject(with: line) as? [String: Any] else { return error("invalid_json") }
        let sequence = Self.integer(value["seq"])
        guard let seq = sequence, let type = value["type"] as? String,
              let identity = value["controller_id"] as? String,
              identity.range(of: "^[A-Za-z0-9][A-Za-z0-9:._-]{0,95}\\z", options: .regularExpression) != nil else { return error("invalid_message", sequence) }
        var key = "", action = "", pressed = false
        if type == "button" {
            guard let k = value["key"] as? String, Self.keys.contains(k),
                  let a = value["action"] as? String,
                  let p = Self.boolean(value["pressed"]),
                  let duration = Self.integer(value["duration_ms"]) else { return error("invalid_message", seq) }
            switch a {
            case "down": guard p && duration == 0 else { return error("invalid_message", seq) }
            case "sync": guard duration == 0 else { return error("invalid_message", seq) }
            case "long_press": guard p else { return error("invalid_message", seq) }
            case "tap", "long_release": guard !p else { return error("invalid_message", seq) }
            default: return error("invalid_message", seq)
            }
            key = k; action = a; pressed = p
        } else if type != "hello" && type != "ping" { return error("invalid_message", seq) }
        guard var peer = peers[id] else { return error("connection_closed", seq) }
        if let existing = peer.identity, existing != identity { return error("controller_id_changed", seq) }
        if let active = owner, active != id, let other = peers[active], other.identity != identity { return error("controller_busy", seq) }
        var replaced: UUID?
        if peer.identity == nil {
            if let active = owner, active != id { replaced = active; disconnect(active) }
            peer.identity = identity
            owner = id
            lastIdentity = identity
            sessionNumber += 1
            session = "wifi-\(instance)-\(sessionNumber)"
            cancelSequence += 1
        }
        peer.lastMessageAt = time
        if seq > peer.lastSequence {
            if type == "button" {
                let wasHeld = peer.held.contains(key)
                let before = peer.counters.keys.map { ($0, peer.action($0)) }
                if !pressed { peer.held.remove(key); peer.blocked.remove(key) }
                else {
                    peer.held.insert(key)
                    if action == "sync" && ["START", "A", "B", "X", "Y"].contains(key) && !wasHeld { peer.blocked.insert(key) }
                    else if action == "long_press" && !wasHeld { peer.blocked.insert(key) }
                    if action == "down" && !wasHeld && !peer.blocked.contains(key) {
                        for (name, previously) in before where !previously && peer.action(name) { peer.counters[name, default: 0] += 1 }
                    }
                }
            }
            peer.lastSequence = seq
        }
        peers[id] = peer
        changed()
        return Reply(object: ["type": "ack", "seq": seq], replaced: replaced)
    }
    func snapshot() -> [String: Any] {
        let p = owner.flatMap { peers[$0] }
        let active = p != nil
        let player: [String: Any] = [
            "id": 1, "transport": "wifi", "controllerId": lastIdentity, "session": session,
            "connected": active, "cancelSeq": cancelSequence,
            "x": (p?.input("RIGHT") == true ? 1 : 0) - (p?.input("LEFT") == true ? 1 : 0),
            "y": (p?.input("DOWN") == true ? 1 : 0) - (p?.input("UP") == true ? 1 : 0),
            "aimX": 0, "aimY": 0, "a": p?.action("a") ?? false,
            "b": p?.action("b") ?? false, "start": p?.action("start") ?? false, "select": false,
            "pulseCounters": p?.counters ?? ["a": 0, "b": 0, "start": 0, "left": 0, "right": 0, "up": 0, "down": 0]
        ]
        return ["revision": revision, "players": [player], "connections": active ? 1 : 0]
    }
}

struct ControllerLines {
    enum Failure: Error { case oversized }
    private(set) var pending = Data()
    mutating func append(_ chunk: Data) throws -> [Data] {
        pending.append(chunk)
        var result: [Data] = []
        while let end = pending.firstIndex(of: 10) {
            let count = pending.distance(from: pending.startIndex, to: end)
            guard count <= 1024 else { throw Failure.oversized }
            var line = Data(pending.prefix(count))
            if line.last == 13 { line.removeLast() }
            result.append(line)
            pending.removeSubrange(pending.startIndex...end)
        }
        guard pending.count <= 1024 else { throw Failure.oversized }
        return result
    }
}

final class ControllerServer: NSObject, NetServiceDelegate {
    var onChange: (() -> Void)?
    private let preferredPort: UInt16
    private let protocolState = ControllerProtocol()
    private var listener: NWListener?
    private var discovery: NetService?
    private var watchdog: Timer?
    private var running = false
    private var generation = 0
    private var serviceState = "stopped"
    private var serviceError: String?
    private var serviceName = "Neon Rush"
    private var port: UInt16 = 0
    private final class Connection {
        let socket: NWConnection
        var lines = ControllerLines()
        var partialSince: TimeInterval?
        var writes = 0
        var writeBytes = 0
        var firstWrite: TimeInterval?
        var closing = false
        init(_ socket: NWConnection) { self.socket = socket }
    }
    private var connections: [UUID: Connection] = [:]
    private var now: TimeInterval { ProcessInfo.processInfo.systemUptime }
    init(onChange: (() -> Void)? = nil, preferredPort: UInt16 = 8765) {
        self.onChange = onChange
        self.preferredPort = preferredPort
        super.init()
        protocolState.onChange = { [weak self] in self?.onChange?() }
    }
    func start() {
        precondition(Thread.isMainThread)
        guard !running else { return }
        running = true; generation += 1; serviceError = nil
        serviceState = "registering"
        listen(port: preferredPort, generation: generation, fallback: preferredPort != 0)
        guard running else { return }
        watchdog = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in self?.expireConnections() }
        onChange?()
    }
    private func listen(port wanted: UInt16, generation expected: Int, fallback: Bool) {
        do {
            let parameters = NWParameters.tcp
            (parameters.defaultProtocolStack.internetProtocol as? NWProtocolIP.Options)?.version = .v4
            let candidate = try NWListener(using: parameters, on: wanted == 0 ? .any : NWEndpoint.Port(rawValue: wanted)!)
            listener = candidate
            candidate.newConnectionHandler = { [weak self, weak candidate] connection in
                guard let self = self, self.running, self.generation == expected, self.listener === candidate else { connection.cancel(); return }
                self.accept(connection)
            }
            candidate.stateUpdateHandler = { [weak self, weak candidate] state in
                guard let self = self, self.running, self.generation == expected, self.listener === candidate else { return }
                switch state {
                case .ready:
                    guard let actual = candidate?.port?.rawValue else { self.fail("TCP listener has no port"); return }
                    self.port = actual
                    self.publishDiscovery()
                case .failed(let error):
                    if fallback, case .posix(let code) = error, code == .EADDRINUSE {
                        candidate?.cancel(); self.listener = nil
                        self.listen(port: 0, generation: expected, fallback: false)
                    } else { self.fail("TCP: \(error)") }
                default: break
                }
            }
            candidate.start(queue: .main)
        } catch {
            if fallback, let networkError = error as? NWError, case .posix(let code) = networkError, code == .EADDRINUSE {
                listen(port: 0, generation: expected, fallback: false)
            } else { fail("TCP: \(error)") }
        }
    }
    private func publishDiscovery() {
        discovery?.stop()
        let service = NetService(domain: "local.", type: "_puretv._tcp.", name: "Neon Rush", port: Int32(port))
        service.setTXTRecord(NetService.data(fromTXTRecord: ["version": Data("1".utf8)]))
        service.delegate = self
        discovery = service
        service.publish()
        onChange?()
    }
    func netServiceDidPublish(_ sender: NetService) {
        guard running, discovery === sender else { sender.stop(); return }
        serviceName = sender.name; serviceState = "available"; serviceError = nil; onChange?()
    }
    func netService(_ sender: NetService, didNotPublish errorDict: [String: NSNumber]) {
        guard running, discovery === sender else { sender.stop(); return }
        serviceState = "unavailable"; serviceError = "Bonjour: \(errorDict)"; onChange?()
    }
    private func fail(_ error: String) {
        stop()
        serviceState = "unavailable"; serviceError = error; onChange?()
    }
    func stop() {
        precondition(Thread.isMainThread)
        running = false; generation += 1
        watchdog?.invalidate(); watchdog = nil
        discovery?.delegate = nil; discovery?.stop(); discovery = nil
        listener?.cancel(); listener = nil
        for connection in connections.values { connection.socket.cancel() }
        connections.removeAll()
        port = 0; serviceState = "stopped"; serviceError = nil
        protocolState.stop()
        onChange?()
    }
    func releaseInputs() { precondition(Thread.isMainThread); protocolState.releaseInputs() }
    func snapshot() -> [String: Any] { precondition(Thread.isMainThread); return protocolState.snapshot() }
    func info() -> [String: Any] {
        precondition(Thread.isMainThread)
        var wifi: [String: Any] = ["state": serviceState, "serviceName": serviceName, "port": Int(port), "addresses": Self.localAddresses()]
        if let error = serviceError { wifi["error"] = error }
        return ["wifiController": wifi]
    }
    private func accept(_ socket: NWConnection) {
        let id = UUID()
        guard connections.count < 4, protocolState.add(id, at: now) else { socket.cancel(); return }
        let connection = Connection(socket)
        connections[id] = connection
        socket.stateUpdateHandler = { [weak self] state in
            if case .failed = state { self?.close(id) }
            if case .cancelled = state { self?.close(id) }
        }
        socket.start(queue: .main)
        receive(id)
    }
    private func receive(_ id: UUID) {
        guard let connection = connections[id], !connection.closing else { return }
        connection.socket.receive(minimumIncompleteLength: 1, maximumLength: 4096) { [weak self, weak connection] data, _, complete, error in
            guard let self = self, let connection = connection, self.connections[id] === connection else { return }
            if let data = data, !data.isEmpty {
                do {
                    let wasEmpty = connection.lines.pending.isEmpty
                    let lines = try connection.lines.append(data)
                    if connection.lines.pending.isEmpty { connection.partialSince = nil }
                    else if wasEmpty || !lines.isEmpty { connection.partialSince = self.now }
                    for line in lines {
                        guard self.connections[id] === connection, !connection.closing else { break }
                        let reply = self.protocolState.receive(line, from: id, at: self.now)
                        if let replaced = reply.replaced { self.close(replaced) }
                        self.send(reply.object, id: id, closing: reply.close)
                    }
                } catch { self.close(id); return }
            }
            if error != nil { self.close(id) }
            else if complete {
                // A peer can half-close its write side and still read its final ACK.
                // Release gameplay state immediately, but do not cancel queued ACKs.
                self.protocolState.disconnect(id)
                connection.closing = true
                if !connection.lines.pending.isEmpty || connection.writes == 0 { self.close(id) }
            } else { self.receive(id) }
        }
    }
    private func send(_ object: [String: Any], id: UUID, closing: Bool) {
        guard let connection = connections[id], var data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]) else { close(id); return }
        data.append(10)
        guard connection.writeBytes + data.count <= 8192 else { close(id); return }
        connection.closing = closing
        if connection.writes == 0 { connection.firstWrite = now }
        connection.writes += 1; connection.writeBytes += data.count
        let count = data.count
        connection.socket.send(content: data, completion: .contentProcessed { [weak self, weak connection] error in
            guard let self = self, let connection = connection, self.connections[id] === connection else { return }
            connection.writes -= 1; connection.writeBytes -= count
            if connection.writes == 0 { connection.firstWrite = nil }
            if error != nil || closing || (connection.closing && connection.writes == 0) { self.close(id) }
        })
    }
    private func close(_ id: UUID) {
        guard let connection = connections.removeValue(forKey: id) else { return }
        connection.socket.cancel()
        protocolState.disconnect(id)
    }
    private func expireConnections() {
        let time = now
        var expired = Set(protocolState.expired(at: time))
        for (id, connection) in connections {
            if let partial = connection.partialSince, time - partial > 5 { expired.insert(id) }
            if let write = connection.firstWrite, time - write > 5 { expired.insert(id) }
        }
        for id in expired { close(id) }
    }
    static func localAddresses() -> [String] {
        var pointer: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&pointer) == 0 else { return [] }
        defer { freeifaddrs(pointer) }
        var addresses = Set<String>()
        var current = pointer
        while let item = current {
            defer { current = item.pointee.ifa_next }
            let flags = Int32(item.pointee.ifa_flags)
            guard flags & IFF_UP != 0, flags & IFF_LOOPBACK == 0,
                  let address = item.pointee.ifa_addr, address.pointee.sa_family == UInt8(AF_INET) else { continue }
            var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            if getnameinfo(address, socklen_t(address.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 { addresses.insert(String(cString: host)) }
        }
        return addresses.sorted()
    }
}
