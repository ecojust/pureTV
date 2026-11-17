import Foundation

// The asset server chooses a new port on launch, so browser origins cannot own
// durable saves. Only the game's declared keys cross the native boundary.
final class GameStorage {
    let keys: [String]
    let maxBytes: Int
    private let defaults: UserDefaults
    private let namespace: String?

    init(defaults: UserDefaults, declaredKeys: [String]?, bundleIdentifier: String) {
        self.defaults = defaults
        keys = declaredKeys ?? ["cf_ship_opts", "feiche3d.v1"]
        namespace = declaredKeys == nil ? nil : "joystick.storage." + bundleIdentifier
        maxBytes = declaredKeys == nil ? 65536 : 1048576
    }

    func snapshot() -> [String: String] {
        let saved = namespace.flatMap { defaults.dictionary(forKey: $0) } ?? [:]
        return Dictionary(uniqueKeysWithValues: keys.compactMap { key -> (String, String)? in
            let value = namespace == nil ? defaults.string(forKey: key) : saved[key] as? String
            guard let text = value, text.utf8.count <= maxBytes else { return nil }
            return (key, text)
        })
    }

    @discardableResult func receive(key: String, value: Any) -> Bool {
        guard keys.contains(key), value is NSNull || value is String else { return false }
        let text = value as? String
        guard text == nil || text!.utf8.count <= maxBytes else { return false }
        if let namespace = namespace {
            var saved = snapshot()
            saved[key] = text
            defaults.set(saved, forKey: namespace)
        } else if let text = text {
            defaults.set(text, forKey: key)
        } else {
            defaults.removeObject(forKey: key)
        }
        return true
    }
}
