import Foundation

@main enum ControllerServerTests {
    static var count = 0
    static func check(_ name: String, _ body: () throws -> Void) rethrows {
        try body()
        count += 1
        print("PASS \(count): \(name)")
    }
    static func require(_ condition: @autoclosure () -> Bool, _ message: String = "assertion failed", file: StaticString = #file, line: UInt = #line) {
        if !condition() { fatalError(message, file: file, line: line) }
    }
    static func player(_ state: ControllerProtocol) -> [String: Any] {
        (state.snapshot()["players"] as! [[String: Any]])[0]
    }
    static func counter(_ state: ControllerProtocol, _ key: String) -> Int64 {
        (player(state)["pulseCounters"] as! [String: Int64])[key]!
    }
    static func send(_ state: ControllerProtocol, _ peer: UUID, _ seq: Int64, _ type: String = "button", _ key: String = "A", _ action: String = "down", _ identity: String = "test-pad", at time: TimeInterval = 1) -> ControllerProtocol.Reply {
        var object: [String: Any] = ["type": type, "seq": seq, "controller_id": identity]
        if type == "button" {
            object["key"] = key; object["action"] = action
            object["pressed"] = action == "down" || action == "long_press"
            object["duration_ms"] = action == "down" || action == "sync" ? 0 : 600
        }
        return state.receive(try! JSONSerialization.data(withJSONObject: object), from: peer, at: time)
    }
    static func setup() -> (ControllerProtocol, UUID) {
        let state = ControllerProtocol(), id = UUID()
        require(state.add(id, at: 0))
        require(send(state, id, 0, "hello").object["type"] as? String == "ack")
        return (state, id)
    }
    static func main() throws {
        if CommandLine.arguments.contains("--serve") {
            let server = ControllerServer(preferredPort: UInt16(ProcessInfo.processInfo.environment["PURETV_TEST_PORT"] ?? "0") ?? 0)
            let output = ProcessInfo.processInfo.environment["PURETV_TEST_STATE"]
            func publish() {
                let value: [String: Any] = ["info": server.info(), "snapshot": server.snapshot()]
                if let path = output, let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]) { try? data.write(to: URL(fileURLWithPath: path), options: .atomic) }
            }
            server.onChange = publish
            server.start()
            print("Controller test service started")
            RunLoop.main.run()
            return
        }
        check("hello and all nine sync messages ACK their sequence without action pulses") {
            let (s, id) = setup()
            for (index, key) in ControllerProtocol.keys.enumerated() {
                let seq = Int64(index + 1), result = send(s, id, seq, "button", key, "sync")
                require(result.object["type"] as? String == "ack")
                require(result.object["seq"] as? Int64 == seq)
            }
            require(counter(s, "a") == 0 && counter(s, "b") == 0 && counter(s, "start") == 0)
        }
        check("direction pairs cancel while independent axes remain") {
            let (s, id) = setup()
            _ = send(s, id, 1, "button", "LEFT"); _ = send(s, id, 2, "button", "DOWN")
            require(player(s)["x"] as? Int == -1 && player(s)["y"] as? Int == 1)
            _ = send(s, id, 3, "button", "RIGHT")
            require(player(s)["x"] as? Int == 0)
            _ = send(s, id, 4, "button", "LEFT", "tap")
            require(player(s)["x"] as? Int == 1)
        }
        check("quick taps survive snapshots as cumulative counters") {
            let (s, id) = setup()
            _ = send(s, id, 1); _ = send(s, id, 2, "button", "A", "tap")
            require(player(s)["a"] as? Bool == false)
            require(counter(s, "a") == 1)
            _ = s.snapshot(); _ = s.snapshot()
            require(counter(s, "a") == 1)
        }
        check("A/X aliases keep a hold until both release and do not double-pulse") {
            let (s, id) = setup()
            _ = send(s, id, 1); _ = send(s, id, 2, "button", "X")
            _ = send(s, id, 3, "button", "A", "tap")
            require(player(s)["a"] as? Bool == true && counter(s, "a") == 1)
            _ = send(s, id, 4, "button", "X", "long_release")
            require(player(s)["a"] as? Bool == false)
        }
        check("B/Y aliases aggregate without a duplicate nitro edge") {
            let (s, id) = setup()
            _ = send(s, id, 1, "button", "B"); _ = send(s, id, 2, "button", "Y")
            _ = send(s, id, 3, "button", "B", "tap")
            require(player(s)["b"] as? Bool == true && counter(s, "b") == 1)
            _ = send(s, id, 4, "button", "Y", "tap")
            require(player(s)["b"] as? Bool == false)
        }
        check("held START and action sync require release before a new action") {
            let (s, id) = setup()
            for (i, key) in ["START", "A", "B", "X", "Y"].enumerated() {
                let data = try! JSONSerialization.data(withJSONObject: ["type": "button", "seq": i + 1, "controller_id": "test-pad", "key": key, "action": "sync", "pressed": true, "duration_ms": 0])
                require(!s.receive(data, from: id, at: 1).close)
            }
            require(player(s)["start"] as? Bool == false && player(s)["a"] as? Bool == false && player(s)["b"] as? Bool == false)
            _ = send(s, id, 6, "button", "START", "long_press")
            require(counter(s, "start") == 0)
            _ = send(s, id, 7, "button", "START", "long_release")
            _ = send(s, id, 8, "button", "START", "down")
            require(counter(s, "start") == 1 && player(s)["start"] as? Bool == true)
        }
        check("long_press without down is a continuation, not a fresh action") {
            let (s, id) = setup()
            _ = send(s, id, 1, "button", "A", "long_press")
            require(counter(s, "a") == 0 && player(s)["a"] as? Bool == false)
            _ = send(s, id, 2, "button", "A", "long_release")
            _ = send(s, id, 3)
            _ = send(s, id, 4, "button", "A", "long_press")
            require(counter(s, "a") == 1 && player(s)["a"] as? Bool == true)
        }
        check("duplicate and stale sequence acknowledge but never replay") {
            let (s, id) = setup()
            _ = send(s, id, 5); _ = send(s, id, 6, "button", "A", "tap")
            let duplicate = send(s, id, 5), stale = send(s, id, 1)
            require(duplicate.object["type"] as? String == "ack" && stale.object["type"] as? String == "ack")
            require(counter(s, "a") == 1 && player(s)["a"] as? Bool == false)
        }
        check("repeated hello and ping preserve held controls and refresh heartbeat") {
            let (s, id) = setup()
            _ = send(s, id, 1); _ = send(s, id, 2, "hello", at: 10); _ = send(s, id, 3, "ping", at: 19)
            require(player(s)["a"] as? Bool == true && counter(s, "a") == 1)
            require(s.expired(at: 38).isEmpty && s.expired(at: 40) == [id])
        }
        check("background cancellation quarantines held keys without new pulses") {
            let (s, id) = setup()
            _ = send(s, id, 1); _ = send(s, id, 2, "button", "LEFT")
            let prior = player(s)["cancelSeq"] as! Int64
            s.releaseInputs()
            require(player(s)["a"] as? Bool == false && player(s)["x"] as? Int == 0)
            require((player(s)["cancelSeq"] as! Int64) > prior && counter(s, "a") == 1)
            _ = send(s, id, 3, "button", "A", "tap"); _ = send(s, id, 4)
            require(counter(s, "a") == 2)
        }
        check("same ID reconnect replaces old peer with new session and clean sequence") {
            let (s, id) = setup()
            _ = send(s, id, 10)
            let session = player(s)["session"] as! String, next = UUID()
            require(s.add(next, at: 2))
            let result = send(s, next, 0, "hello")
            require(result.replaced == id && s.peers[id] == nil)
            require(player(s)["session"] as? String != session && player(s)["a"] as? Bool == false)
            _ = send(s, next, 1)
            require(counter(s, "a") == 1)
            s.disconnect(id)
            require(player(s)["connected"] as? Bool == true)
        }
        check("different ID cannot steal occupied controller seat") {
            let (s, id) = setup(), other = UUID()
            require(s.add(other, at: 1))
            let result = send(s, other, 0, "hello", "A", "down", "other-pad")
            require(result.close && result.object["message"] as? String == "controller_busy" && s.owner == id)
        }
        check("identity changes on an existing socket are rejected") {
            let (s, id) = setup()
            let result = send(s, id, 1, "ping", "A", "down", "changed-pad")
            require(result.close && result.object["message"] as? String == "controller_id_changed")
        }
        check("disconnect neutralizes every control and advances cancellation") {
            let (s, id) = setup()
            _ = send(s, id, 1); _ = send(s, id, 2, "button", "LEFT")
            let revision = s.revision
            s.disconnect(id)
            require(player(s)["connected"] as? Bool == false && player(s)["a"] as? Bool == false && player(s)["x"] as? Int == 0)
            require(s.revision > revision)
        }
        check("bounded peers and unauthenticated handshake deadline") {
            let s = ControllerProtocol()
            let ids = (0..<5).map { _ in UUID() }
            for id in ids.prefix(4) { require(s.add(id, at: 0)) }
            require(!s.add(ids[4], at: 0))
            require(s.expired(at: 4).isEmpty && Set(s.expired(at: 6)) == Set(ids.prefix(4)))
        }
        check("invalid JSON, UTF-8 and top-level arrays fail closed") {
            let (s, id) = setup()
            for data in [Data("{".utf8), Data("[]".utf8), Data([0xff, 0xfe]), Data("{} {}".utf8)] { require(s.receive(data, from: id, at: 1).close) }
        }
        check("strict JSON scalar types and safe integer sequence") {
            let (s, id) = setup()
            var base: [String: Any] = ["type": "button", "seq": 1, "controller_id": "test-pad", "key": "A", "pressed": true, "action": "down", "duration_ms": 0]
            let mutations: [(String, Any)] = [("seq", true), ("seq", 1.5), ("seq", -1), ("seq", 9_007_199_254_740_992 as Int64), ("pressed", 1), ("duration_ms", false), ("key", "a"), ("controller_id", "test-pad\n"), ("controller_id", String(repeating: "x", count: 97)), ("action", "other")]
            for (key, value) in mutations {
                var invalid = base; invalid[key] = value
                require(s.receive(try! JSONSerialization.data(withJSONObject: invalid), from: id, at: 1).close, "Rejected \(key)=\(value)")
            }
            base["seq"] = ControllerProtocol.maxInteger
            require(!s.receive(try! JSONSerialization.data(withJSONObject: base), from: id, at: 1).close)
        }
        try check("TCP framing accepts split frames, batched lines and CRLF") {
            var decoder = ControllerLines()
            let first = try decoder.append(Data("{\"a\":".utf8))
            require(first.isEmpty)
            let frames = try decoder.append(Data("1}\r\n{}\n{\"b\":".utf8))
            require(frames == [Data("{\"a\":1}".utf8), Data("{}".utf8)])
            let last = try decoder.append(Data("2}\n".utf8))
            require(last == [Data("{\"b\":2}".utf8)])
        }
        check("TCP framing rejects oversized terminated and partial frames") {
            for suffix in [Data(), Data([10])] {
                var decoder = ControllerLines(), rejected = false
                do { _ = try decoder.append(Data(repeating: 65, count: 1025) + suffix) } catch { rejected = true }
                require(rejected)
            }
        }
        check("stop releases owner and preserves monotonic snapshot revision") {
            let (s, id) = setup()
            _ = send(s, id, 1)
            let revision = s.revision
            s.stop()
            require(s.peers.isEmpty && s.owner == nil && s.revision > revision)
            require(player(s)["connected"] as? Bool == false)
        }
        print("\(count) controller protocol tests passed")
    }
}
