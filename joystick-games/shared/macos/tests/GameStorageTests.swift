import Foundation

@main enum GameStorageTests {
    static func require(_ value: @autoclosure () -> Bool) { precondition(value()) }
    static func main() {
        let domain = "com.ecojust.joystick.storage-tests." + UUID().uuidString
        let defaults = UserDefaults(suiteName: domain)!
        defer { defaults.removePersistentDomain(forName: domain) }
        let first = GameStorage(defaults: defaults, declaredKeys: ["save", "options"], bundleIdentifier: "game.one")
        let second = GameStorage(defaults: defaults, declaredKeys: ["save"], bundleIdentifier: "game.two")
        require(first.receive(key: "save", value: "{\"tick\":123,\"label\":\"存档\"}"))
        require(first.receive(key: "options", value: ""))
        require(second.snapshot().isEmpty)
        defaults.synchronize()
        let reopened = GameStorage(defaults: UserDefaults(suiteName: domain)!, declaredKeys: ["save", "options"], bundleIdentifier: "game.one")
        require(reopened.snapshot() == first.snapshot())
        require(reopened.receive(key: "save", value: NSNull()))
        require(first.snapshot() == ["options": ""])
        require(!first.receive(key: "undeclared", value: "no"))
        require(!first.receive(key: "save", value: 42))
        require(!first.receive(key: "save", value: String(repeating: "界", count: 349526)))
        require(GameStorage(defaults: defaults, declaredKeys: [], bundleIdentifier: "game.one").snapshot().isEmpty)
        defaults.set("old", forKey: "cf_ship_opts")
        let legacy = GameStorage(defaults: defaults, declaredKeys: nil, bundleIdentifier: "legacy")
        require(legacy.snapshot()["cf_ship_opts"] == "old")
        require(legacy.receive(key: "cf_ship_opts", value: NSNull()))
        require(defaults.string(forKey: "cf_ship_opts") == nil)
        require(legacy.maxBytes == 65536 && first.maxBytes == 1048576)
        let ghostKeys = (0..<367).map { "backroad-rally.ghost.fixture:\($0)" }
        let ghosts = GameStorage(defaults: defaults, declaredKeys: ghostKeys, bundleIdentifier: "com.ecojust.joystick.backroadrally")
        require(ghosts.keys == ghostKeys && ghosts.maxBytes == 1048576)
        require(ghosts.receive(key: ghostKeys.last!, value: "original ghost record"))
        require(!ghosts.receive(key: "backroad-rally.ghost.fixture:367", value: "not enumerated"))
        require(!ghosts.receive(key: "backroad-rally.ghost.*", value: "wildcard"))
        require(!ghosts.receive(key: ghostKeys[0], value: String(repeating: "x", count: 1048577)))
        let anotherGame = GameStorage(defaults: defaults, declaredKeys: ghostKeys, bundleIdentifier: "com.ecojust.joystick.othergame")
        require(anotherGame.snapshot().isEmpty)
        require(anotherGame.receive(key: ghostKeys.last!, value: "separate namespace"))
        require(ghosts.snapshot()[ghostKeys.last!] == "original ghost record")
        print("PASS: real UserDefaults reopening, deletion, bundle isolation, allowlist, UTF-8 bounds and legacy keys")
    }
}
