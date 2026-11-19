#pragma once

#include <array>
#include <cstdint>
#include <iomanip>
#include <map>
#include <optional>
#include <random>
#include <set>
#include <sstream>
#include <string>
#include <vector>
#include <utility>
#include "json.hpp"

namespace puretv {
using Json = nlohmann::json;

// Transport-independent state machine. The window thread owns every call.
// Mirrors the macOS ControllerProtocol; snapshots never consume input pulses.
class ControllerProtocol {
public:
    inline static constexpr std::array<const char*, 9> keys{
        "UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"};
    inline static constexpr std::uint64_t maxInteger = 9007199254740991ULL;
    struct Reply {
        Json object;
        bool close = false;
        std::optional<std::uint64_t> replaced;
    };

    bool inputEnabled = true;

    bool add(std::uint64_t id, double now) {
        if (peers_.size() >= 4 || peers_.count(id)) return false;
        Peer peer;
        peer.createdAt = peer.lastMessageAt = now;
        peers_.emplace(id, std::move(peer));
        return true;
    }

    void disconnect(std::uint64_t id) {
        if (!peers_.erase(id)) return;
        if (owner_ == id) {
            owner_.reset();
            ++cancelSequence_;
            changed();
        }
    }

    void releaseInputs() {
        if (Peer* p = ownerPeer()) p->blocked.insert(p->held.begin(), p->held.end());
        ++cancelSequence_;
        changed();
    }

    void setInputEnabled(bool enabled) {
        if (inputEnabled == enabled) return;
        inputEnabled = enabled;
        releaseInputs();
    }

    void stop() {
        peers_.clear();
        owner_.reset();
        ++cancelSequence_;
        changed();
    }

    std::vector<std::uint64_t> expired(double now) const {
        std::vector<std::uint64_t> result;
        for (const auto& entry : peers_) {
            const Peer& p = entry.second;
            if (p.identity ? now - p.lastMessageAt > 20.0 : now - p.createdAt > 5.0)
                result.push_back(entry.first);
        }
        return result;
    }

    Reply receive(const std::string& line, std::uint64_t id, double now) {
        if (!peers_.count(id)) return error("connection_closed");
        // The socket framer independently bounds partial and terminated frames.
        if (line.size() > 1024) return error("invalid_message");
        const Json value = Json::parse(line, nullptr, false);
        if (!value.is_object()) return error("invalid_json");
        const auto sequence = integer(field(value, "seq"));
        const Json* typeValue = field(value, "type");
        const Json* identityValue = field(value, "controller_id");
        if (!sequence || !typeValue || !typeValue->is_string() ||
            !identityValue || !identityValue->is_string()) return error("invalid_message", sequence);
        const auto type = typeValue->get<std::string>();
        const auto identity = identityValue->get<std::string>();
        if (!validIdentity(identity)) return error("invalid_message", sequence);

        std::string key, action;
        bool pressed = false;
        if (type == "button") {
            const Json* k = field(value, "key");
            const Json* a = field(value, "action");
            const Json* p = field(value, "pressed");
            const auto duration = integer(field(value, "duration_ms"));
            if (!k || !k->is_string() || !a || !a->is_string() ||
                !p || !p->is_boolean() || !duration) return error("invalid_message", sequence);
            key = k->get<std::string>(); action = a->get<std::string>(); pressed = p->get<bool>();
            if (!isKey(key)) return error("invalid_message", sequence);
            if (action == "down") {
                if (!pressed || *duration != 0) return error("invalid_message", sequence);
            } else if (action == "sync") {
                if (*duration != 0) return error("invalid_message", sequence);
            } else if (action == "long_press") {
                if (!pressed) return error("invalid_message", sequence);
            } else if (action == "tap" || action == "long_release") {
                if (pressed) return error("invalid_message", sequence);
            } else return error("invalid_message", sequence);
        } else if (type != "hello" && type != "ping") return error("invalid_message", sequence);

        Peer& peer = peers_.at(id);
        if (peer.identity && *peer.identity != identity) return error("controller_id_changed", sequence);
        const Peer* active = ownerPeer();
        if (owner_ && *owner_ != id && active && active->identity != identity)
            return error("controller_busy", sequence);
        std::optional<std::uint64_t> replaced;
        if (!peer.identity) {
            if (owner_ && *owner_ != id) {
                replaced = owner_;
                disconnect(*owner_);
            }
            // std::map erasing another peer does not invalidate this reference.
            peer.identity = identity;
            owner_ = id;
            lastIdentity_ = identity;
            session_ = "wifi-" + instance_ + "-" + std::to_string(++sessionNumber_);
            ++cancelSequence_;
        }
        peer.lastMessageAt = now;
        if (!peer.lastSequence || *sequence > *peer.lastSequence) {
            if (type == "button") {
                const bool wasHeld = peer.held.count(key) != 0;
                std::map<std::string, bool> before;
                for (const auto& entry : peer.counters) before[entry.first] = peer.action(entry.first);
                if (!pressed) {
                    peer.held.erase(key);
                    peer.blocked.erase(key);
                } else {
                    peer.held.insert(key);
                    if (!inputEnabled) peer.blocked.insert(key);
                    else if (action == "sync" && isActionKey(key) && !wasHeld) peer.blocked.insert(key);
                    else if (action == "long_press" && !wasHeld) peer.blocked.insert(key);
                    if (inputEnabled && action == "down" && !wasHeld && !peer.blocked.count(key)) {
                        for (const auto& entry : before)
                            if (!entry.second && peer.action(entry.first)) ++peer.counters[entry.first];
                        ++peer.buttonCounters[key];
                    }
                }
            }
            peer.lastSequence = sequence;
        }
        changed();
        return {Json{{"type", "ack"}, {"seq", *sequence}}, false, replaced};
    }

    Json snapshot() const {
        const Peer* p = ownerPeer();
        const Peer* input = inputEnabled ? p : nullptr;
        const auto held = [input](const std::string& key) { return input && input->input(key); };
        const auto action = [input](const std::string& name) { return input && input->action(name); };
        Json buttons = Json::object(), buttonCounters = Json::object();
        for (const auto* key : keys) {
            buttons[key] = held(key);
            buttonCounters[key] = p ? p->buttonCounters.at(key) : std::uint64_t{0};
        }
        Json player = {
            {"id", 1}, {"transport", "wifi"}, {"controllerId", lastIdentity_}, {"session", session_},
            {"connected", p != nullptr}, {"cancelSeq", cancelSequence_},
            {"x", int(held("RIGHT")) - int(held("LEFT"))},
            {"y", int(held("DOWN")) - int(held("UP"))},
            {"aimX", 0}, {"aimY", 0}, {"a", action("a")}, {"b", action("b")},
            {"start", action("start")}, {"select", false}, {"buttons", buttons},
            {"buttonCounters", buttonCounters}, {"pulseCounters", p ? p->counters : emptyCounters()}
        };
        return {{"revision", revision_}, {"inputEnabled", inputEnabled},
                {"players", Json::array({player})}, {"connections", p ? 1 : 0}};
    }

private:
    static std::map<std::string, std::uint64_t> emptyCounters() {
        return {{"a", 0}, {"b", 0}, {"start", 0}, {"left", 0}, {"right", 0}, {"up", 0}, {"down", 0}};
    }
    struct Peer {
        double createdAt = 0, lastMessageAt = 0;
        std::optional<std::string> identity;
        std::optional<std::uint64_t> lastSequence;
        std::set<std::string> held, blocked;
        std::map<std::string, std::uint64_t> buttonCounters = [] {
            std::map<std::string, std::uint64_t> result;
            for (const auto* key : keys) result[key] = 0;
            return result;
        }();
        std::map<std::string, std::uint64_t> counters = emptyCounters();
        bool input(const std::string& key) const { return held.count(key) && !blocked.count(key); }
        bool action(const std::string& name) const {
            if (name == "a") return input("A") || input("X");
            if (name == "b") return input("B") || input("Y");
            if (name == "start") return input("START");
            if (name == "left") return input("LEFT");
            if (name == "right") return input("RIGHT");
            if (name == "up") return input("UP");
            if (name == "down") return input("DOWN");
            return false;
        }
    };
    std::map<std::uint64_t, Peer> peers_;
    std::optional<std::uint64_t> owner_;
    std::uint64_t revision_ = 0, cancelSequence_ = 0, sessionNumber_ = 0;
    std::string lastIdentity_, session_;
    const std::string instance_ = [] {
        std::random_device random;
        std::ostringstream text;
        text << std::hex << std::setfill('0');
        for (int i = 0; i < 4; ++i) text << std::setw(8) << static_cast<std::uint32_t>(random());
        return text.str();
    }();

    void changed() { ++revision_; }
    Peer* ownerPeer() {
        const auto found = owner_ ? peers_.find(*owner_) : peers_.end();
        return found == peers_.end() ? nullptr : &found->second;
    }
    const Peer* ownerPeer() const {
        const auto found = owner_ ? peers_.find(*owner_) : peers_.end();
        return found == peers_.end() ? nullptr : &found->second;
    }
    static const Json* field(const Json& value, const char* name) {
        const auto found = value.find(name);
        return found == value.end() ? nullptr : &*found;
    }
    static std::optional<std::uint64_t> integer(const Json* value) {
        if (!value || !value->is_number_integer()) return std::nullopt;
        if (value->is_number_unsigned()) {
            const auto number = value->get<std::uint64_t>();
            return number <= maxInteger ? std::optional<std::uint64_t>{number} : std::nullopt;
        }
        const auto number = value->get<std::int64_t>();
        if (number < 0 || static_cast<std::uint64_t>(number) > maxInteger) return std::nullopt;
        return static_cast<std::uint64_t>(number);
    }
    static bool isKey(const std::string& key) {
        for (const auto* candidate : keys) if (key == candidate) return true;
        return false;
    }
    static bool isActionKey(const std::string& key) {
        return key == "START" || key == "A" || key == "B" || key == "X" || key == "Y";
    }
    static bool validIdentity(const std::string& identity) {
        if (identity.empty() || identity.size() > 96) return false;
        const auto alphanumeric = [](unsigned char c) {
            return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9');
        };
        if (!alphanumeric(static_cast<unsigned char>(identity.front()))) return false;
        for (const unsigned char c : identity)
            if (!alphanumeric(c) && c != ':' && c != '.' && c != '_' && c != '-') return false;
        return true;
    }
    static Reply error(const std::string& code, std::optional<std::uint64_t> sequence = {}) {
        Json object{{"type", "error"}, {"message", code}};
        if (sequence) object["seq"] = *sequence;
        return {object, true, std::nullopt};
    }
};
} // namespace puretv
