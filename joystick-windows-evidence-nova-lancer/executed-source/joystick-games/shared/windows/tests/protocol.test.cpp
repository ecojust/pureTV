#include "../Sources/ControllerProtocol.hpp"
#include <functional>
#include <iostream>
#include <stdexcept>

using puretv::ControllerProtocol;
using puretv::Json;
#define REQUIRE(condition) do { if (!(condition)) throw std::runtime_error(std::string(__FILE__) + ":" + std::to_string(__LINE__) + " " #condition); } while (false)

static Json player(const ControllerProtocol& s) { return s.snapshot().at("players").at(0); }
static std::uint64_t pulse(const ControllerProtocol& s, const std::string& key) {
    return player(s).at("pulseCounters").at(key).get<std::uint64_t>();
}
static Json message(std::uint64_t seq, const std::string& type = "hello", const std::string& identity = "test-pad") {
    return {{"type", type}, {"seq", seq}, {"controller_id", identity}};
}
static Json button(std::uint64_t seq, const std::string& key, const std::string& action = "down", bool pressedSync = false) {
    auto value = message(seq, "button");
    value["key"] = key; value["action"] = action;
    value["pressed"] = action == "sync" ? pressedSync : action == "down" || action == "long_press";
    value["duration_ms"] = action == "down" || action == "sync" ? 0 : 600;
    return value;
}
static ControllerProtocol::Reply send(ControllerProtocol& s, const Json& value, std::uint64_t id = 1, double now = 1) {
    return s.receive(value.dump(), id, now);
}
static void setup(ControllerProtocol& s) {
    REQUIRE(s.add(1, 0));
    REQUIRE(send(s, message(0)).object == Json({{"type", "ack"}, {"seq", 0}}));
}
static void accepted(const ControllerProtocol::Reply& reply, std::uint64_t sequence) {
    REQUIRE(!reply.close);
    REQUIRE(reply.object == Json({{"type", "ack"}, {"seq", sequence}}));
}
static void neutral(const ControllerProtocol& s) {
    const auto p = player(s);
    REQUIRE(p["x"] == 0 && p["y"] == 0);
    REQUIRE(p["a"] == false && p["b"] == false && p["start"] == false);
    for (const auto* key : ControllerProtocol::keys) REQUIRE(p["buttons"][key] == false);
}

int main() {
    unsigned checks = 0;
    auto check = [&](const std::string& name, const std::function<void()>& body) {
        body(); std::cout << "PASS " << ++checks << ": " << name << '\n';
    };
    try {
        check("all nine buttons have independent states and non-consuming pulse counters", [] {
            ControllerProtocol s; setup(s);
            unsigned seq = 1;
            for (const auto* key : ControllerProtocol::keys) {
                accepted(send(s, button(seq, key)), seq); ++seq;
                const auto p = player(s);
                for (const auto* other : ControllerProtocol::keys) REQUIRE(p["buttons"][other] == (std::string(key) == other));
                accepted(send(s, button(seq, key, "tap")), seq); ++seq;
                REQUIRE(player(s)["buttonCounters"][key] == 1);
                const Json first = s.snapshot();
                REQUIRE(first == s.snapshot() && first == s.snapshot());
                neutral(s);
            }
        });
        check("initial hello and nine neutral sync frames ACK exact sequences without actions", [] {
            ControllerProtocol s; setup(s); unsigned seq = 1;
            for (const auto* key : ControllerProtocol::keys) { accepted(send(s, button(seq, key, "sync")), seq); ++seq; }
            neutral(s);
            const auto current = player(s);
            for (const auto& c : current["pulseCounters"].items()) REQUIRE(c.value() == 0);
        });
        check("axes cancel opposing directions without merging independent buttons", [] {
            ControllerProtocol s; setup(s);
            send(s, button(1, "LEFT")); send(s, button(2, "DOWN"));
            REQUIRE(player(s)["x"] == -1 && player(s)["y"] == 1);
            send(s, button(3, "RIGHT")); REQUIRE(player(s)["x"] == 0);
            send(s, button(4, "LEFT", "tap")); REQUIRE(player(s)["x"] == 1);
            send(s, button(5, "UP")); REQUIRE(player(s)["y"] == 0);
        });
        check("short down/up between snapshots retains exactly one pulse", [] {
            ControllerProtocol s; setup(s);
            send(s, button(1, "A")); send(s, button(2, "A", "tap"));
            neutral(s); REQUIRE(pulse(s, "a") == 1);
            const auto first = s.snapshot(); REQUIRE(first == s.snapshot());
        });
        check("legacy A/X and B/Y aggregates never alias physical keys or double-pulse", [] {
            for (const auto& pair : std::array<std::array<const char*, 3>, 2>{{{{"A", "X", "a"}}, {{"B", "Y", "b"}}}}) {
                ControllerProtocol s; setup(s);
                send(s, button(1, pair[0])); send(s, button(2, pair[1]));
                REQUIRE(player(s)["buttonCounters"][pair[0]] == 1 && player(s)["buttonCounters"][pair[1]] == 1);
                REQUIRE(pulse(s, pair[2]) == 1);
                send(s, button(3, pair[0], "tap"));
                REQUIRE(player(s)[pair[2]] == true && pulse(s, pair[2]) == 1);
                send(s, button(4, pair[1], "long_release")); REQUIRE(player(s)[pair[2]] == false);
            }
        });
        check("action-key held sync is quarantined until physical release", [] {
            ControllerProtocol s; setup(s); unsigned seq = 1;
            for (const auto* key : {"START", "A", "B", "X", "Y"}) {
                accepted(send(s, button(seq, key, "sync", true)), seq); ++seq;
            }
            neutral(s); REQUIRE(pulse(s, "a") == 0 && pulse(s, "b") == 0 && pulse(s, "start") == 0);
            send(s, button(seq++, "START", "long_press")); REQUIRE(pulse(s, "start") == 0);
            send(s, button(seq++, "START", "long_release")); send(s, button(seq++, "START"));
            REQUIRE(pulse(s, "start") == 1 && player(s)["start"] == true);
        });
        check("foreground directional sync supplies continuous input without action pulses", [] {
            ControllerProtocol s; setup(s);
            send(s, button(1, "RIGHT", "sync", true));
            REQUIRE(player(s)["x"] == 1 && pulse(s, "right") == 0 && player(s)["buttonCounters"]["RIGHT"] == 0);
        });
        check("unpaired long_press is not a new press for any key", [] {
            for (const auto* key : ControllerProtocol::keys) {
                ControllerProtocol s; setup(s);
                send(s, button(1, key, "long_press")); neutral(s);
                REQUIRE(player(s)["buttonCounters"][key] == 0);
                send(s, button(2, key, "long_release")); send(s, button(3, key)); send(s, button(4, key, "long_press"));
                REQUIRE(player(s)["buttons"][key] == true && player(s)["buttonCounters"][key] == 1);
            }
        });
        check("duplicate downs while held do not increment either counter", [] {
            ControllerProtocol s; setup(s);
            send(s, button(1, "A")); send(s, button(2, "A")); send(s, button(3, "A", "long_press"));
            REQUIRE(pulse(s, "a") == 1 && player(s)["buttonCounters"]["A"] == 1);
        });
        check("duplicate and stale sequences ACK but cannot replay down or release", [] {
            ControllerProtocol s; setup(s);
            send(s, button(5, "A")); send(s, button(6, "A", "tap"));
            accepted(send(s, button(5, "A")), 5); accepted(send(s, button(1, "A")), 1);
            REQUIRE(pulse(s, "a") == 1); neutral(s);
            send(s, button(7, "A")); accepted(send(s, button(6, "A", "tap")), 6);
            REQUIRE(player(s)["a"] == true && pulse(s, "a") == 2);
        });
        check("hello, ping, and stale valid frames refresh heartbeat without dropping held state", [] {
            ControllerProtocol s; setup(s);
            send(s, button(1, "A")); send(s, message(2), 1, 10); send(s, message(3, "ping"), 1, 19);
            REQUIRE(player(s)["a"] == true && pulse(s, "a") == 1);
            REQUIRE(s.expired(39).empty() && s.expired(39.001) == std::vector<std::uint64_t>{1});
            send(s, message(0, "ping"), 1, 40); REQUIRE(s.expired(60).empty());
        });
        check("explicit cancellation neutralizes holds and increments cancellation without a reward", [] {
            ControllerProtocol s; setup(s); send(s, button(1, "A")); send(s, button(2, "LEFT"));
            const auto before = player(s)["cancelSeq"].get<std::uint64_t>();
            s.releaseInputs(); neutral(s);
            REQUIRE(player(s)["cancelSeq"] == before + 1 && pulse(s, "a") == 1);
            send(s, button(3, "A", "long_press")); REQUIRE(pulse(s, "a") == 1); neutral(s);
            send(s, button(4, "A", "long_release")); send(s, button(5, "A")); REQUIRE(pulse(s, "a") == 2);
        });
        check("focus gate transitions cancel once while retaining identity and session", [] {
            ControllerProtocol s; setup(s);
            const auto original = player(s); s.setInputEnabled(false);
            const auto disabled = s.snapshot(); s.setInputEnabled(false); REQUIRE(disabled == s.snapshot());
            REQUIRE(!s.inputEnabled && disabled["inputEnabled"] == false);
            REQUIRE(player(s)["cancelSeq"] == original["cancelSeq"].get<std::uint64_t>() + 1);
            s.setInputEnabled(true); const auto enabled = s.snapshot(); s.setInputEnabled(true); REQUIRE(enabled == s.snapshot());
            REQUIRE(player(s)["session"] == original["session"] && player(s)["controllerId"] == original["controllerId"]);
            REQUIRE(player(s)["connected"] == true);
        });
        check("all background messages ACK but never move, pulse, or implicitly resume", [] {
            ControllerProtocol s; setup(s); s.setInputEnabled(false); unsigned seq = 1;
            for (const auto* key : ControllerProtocol::keys) {
                for (const auto* action : {"down", "long_press", "long_release", "down", "tap"}) {
                    accepted(send(s, button(seq, key, action)), seq); ++seq; neutral(s);
                    REQUIRE(player(s)["buttonCounters"][key] == 0);
                }
            }
            s.setInputEnabled(true); neutral(s);
            const auto current = player(s);
            for (const auto& c : current["pulseCounters"].items()) REQUIRE(c.value() == 0);
        });
        check("every held key begun in the background stays blocked after refocus until release", [] {
            ControllerProtocol s; setup(s); s.setInputEnabled(false); unsigned seq = 1;
            for (const auto* key : ControllerProtocol::keys) send(s, button(seq++, key));
            s.setInputEnabled(true);
            for (const auto* key : ControllerProtocol::keys) { send(s, button(seq++, key, "long_press")); neutral(s); }
            for (const auto* key : ControllerProtocol::keys) send(s, button(seq++, key, "long_release"));
            send(s, button(seq++, "RIGHT")); REQUIRE(player(s)["x"] == 1 && pulse(s, "right") == 1);
        });
        check("background sync also quarantines directions", [] {
            ControllerProtocol s; setup(s); s.setInputEnabled(false); unsigned seq = 1;
            for (const auto* key : ControllerProtocol::keys) send(s, button(seq++, key, "sync", true));
            s.setInputEnabled(true); neutral(s);
            for (const auto* key : ControllerProtocol::keys) REQUIRE(player(s)["buttonCounters"][key] == 0);
            for (const auto* key : ControllerProtocol::keys) send(s, button(seq++, key, "tap"));
            send(s, button(seq++, "START")); REQUIRE(pulse(s, "start") == 1);
        });
        check("release during background clears quarantine without a new action pulse", [] {
            ControllerProtocol s; setup(s); send(s, button(1, "A")); s.setInputEnabled(false);
            send(s, button(2, "A", "long_release")); s.setInputEnabled(true); neutral(s);
            REQUIRE(pulse(s, "a") == 1); send(s, button(3, "A")); REQUIRE(pulse(s, "a") == 2);
        });
        check("first connection in background cannot queue START for later", [] {
            ControllerProtocol s; s.setInputEnabled(false); setup(s);
            send(s, button(1, "START")); send(s, button(2, "START", "tap"));
            s.setInputEnabled(true); REQUIRE(pulse(s, "start") == 0); neutral(s);
            send(s, button(3, "START")); REQUIRE(pulse(s, "start") == 1);
        });
        check("same identity reconnect replaces old peer and resets counters, session, and sequence", [] {
            ControllerProtocol s; setup(s); send(s, button(10, "A")); const auto previous = player(s);
            REQUIRE(s.add(2, 2)); const auto reply = send(s, message(0), 2, 2);
            accepted(reply, 0); REQUIRE(reply.replaced == 1);
            REQUIRE(player(s)["session"] != previous["session"] && player(s)["controllerId"] == previous["controllerId"]);
            REQUIRE(player(s)["cancelSeq"].get<std::uint64_t>() > previous["cancelSeq"].get<std::uint64_t>());
            neutral(s); REQUIRE(pulse(s, "a") == 0);
            s.disconnect(1); REQUIRE(player(s)["connected"] == true);
            accepted(send(s, button(1, "A"), 2), 1); REQUIRE(pulse(s, "a") == 1);
            REQUIRE(send(s, message(11), 1).object["message"] == "connection_closed");
        });
        check("background reconnect retains input gate and quarantines new held keys", [] {
            ControllerProtocol s; setup(s); s.setInputEnabled(false); const auto old = player(s)["session"];
            REQUIRE(s.add(2, 2)); REQUIRE(send(s, message(0), 2).replaced == 1);
            send(s, button(1, "Y"), 2); REQUIRE(!s.inputEnabled && player(s)["session"] != old);
            s.setInputEnabled(true); neutral(s); REQUIRE(pulse(s, "b") == 0);
            send(s, button(2, "Y", "tap"), 2); send(s, button(3, "Y"), 2); REQUIRE(pulse(s, "b") == 1);
        });
        check("a different controller cannot steal the occupied seat", [] {
            ControllerProtocol s; setup(s); send(s, button(1, "A")); REQUIRE(s.add(2, 1));
            const auto before = s.snapshot(); const auto reply = send(s, message(0, "hello", "other-pad"), 2);
            REQUIRE(reply.close && reply.object["message"] == "controller_busy" && reply.object["seq"] == 0);
            REQUIRE(before == s.snapshot()); s.disconnect(2); REQUIRE(before == s.snapshot());
        });
        check("identity change on a socket fails without mutating active input", [] {
            ControllerProtocol s; setup(s); send(s, button(1, "A")); const auto before = s.snapshot();
            const auto reply = send(s, message(2, "ping", "changed-pad"));
            REQUIRE(reply.close && reply.object["message"] == "controller_id_changed"); REQUIRE(before == s.snapshot());
        });
        check("disconnect clears controls but retains last ID for explicit disconnect observation", [] {
            ControllerProtocol s; setup(s); send(s, button(1, "A")); send(s, button(2, "LEFT"));
            const auto before = player(s); s.disconnect(1); neutral(s);
            REQUIRE(s.snapshot()["connections"] == 0 && player(s)["connected"] == false);
            REQUIRE(player(s)["controllerId"] == "test-pad" && player(s)["session"] == before["session"]);
            REQUIRE(player(s)["cancelSeq"].get<std::uint64_t>() > before["cancelSeq"].get<std::uint64_t>());
            const auto once = s.snapshot(); s.disconnect(1); REQUIRE(once == s.snapshot());
        });
        check("four-peer admission and exact 5-second unannounced deadline", [] {
            ControllerProtocol s;
            for (unsigned id = 1; id <= 4; ++id) REQUIRE(s.add(id, 0));
            REQUIRE(!s.add(1, 0) && !s.add(5, 0)); REQUIRE(s.expired(5).empty());
            REQUIRE(s.expired(5.001) == std::vector<std::uint64_t>({1, 2, 3, 4}));
            s.disconnect(2); REQUIRE(s.add(5, 6));
        });
        check("valid button-first connection matches existing protocol without requiring hello", [] {
            ControllerProtocol s; REQUIRE(s.add(1, 0)); accepted(send(s, button(0, "A")), 0);
            REQUIRE(player(s)["a"] == true && pulse(s, "a") == 1);
        });
        check("invalid JSON, UTF-8, arrays, scalar roots, and concatenated documents fail closed", [] {
            ControllerProtocol s; setup(s); const auto before = s.snapshot();
            for (const auto& raw : {std::string("{"), std::string("[]"), std::string("null"), std::string("5"),
                                   std::string("{} {}"), std::string("\xff\xfe", 2), std::string("{\"x\":\"\xc0\xaf\"}", 10)}) {
                const auto reply = s.receive(raw, 1, 1); REQUIRE(reply.close && reply.object["message"] == "invalid_json");
                REQUIRE(before == s.snapshot());
            }
        });
        check("all required fields use strict scalar types and safe integer numbers", [] {
            ControllerProtocol s; setup(s); const auto base = button(1, "A");
            const std::vector<std::pair<std::string, Json>> mutations = {
                {"seq", true}, {"seq", 1.0}, {"seq", 1.5}, {"seq", -1}, {"seq", "1"}, {"seq", nullptr},
                {"seq", 9007199254740992ULL}, {"seq", 18446744073709551615ULL},
                {"pressed", 1}, {"pressed", "true"}, {"duration_ms", false}, {"duration_ms", -1}, {"duration_ms", 0.0},
                {"type", 1}, {"type", "other"}, {"key", "a"}, {"key", nullptr}, {"controller_id", nullptr},
                {"controller_id", "test-pad\n"}, {"controller_id", "_bad"}, {"controller_id", ""},
                {"controller_id", "tést"}, {"controller_id", std::string(97, 'x')}, {"action", "other"}
            };
            const auto before = s.snapshot();
            for (const auto& m : mutations) { auto invalid = base; invalid[m.first] = m.second; REQUIRE(send(s, invalid).close); REQUIRE(before == s.snapshot()); }
            for (const auto* field : {"seq", "type", "controller_id", "key", "pressed", "action", "duration_ms"}) {
                auto invalid = base; invalid.erase(field); REQUIRE(send(s, invalid).close); REQUIRE(before == s.snapshot());
            }
            auto boundary = base; boundary["seq"] = ControllerProtocol::maxInteger;
            accepted(send(s, boundary), ControllerProtocol::maxInteger);
        });
        check("action/pressed/duration combinations are validated before state changes", [] {
            ControllerProtocol s; setup(s); const auto before = s.snapshot();
            for (const auto* action : {"down", "sync", "long_press", "tap", "long_release"}) {
                auto invalid = button(1, "A", action);
                if (std::string(action) == "sync") invalid["duration_ms"] = 1;
                else invalid["pressed"] = !invalid["pressed"].get<bool>();
                REQUIRE(send(s, invalid).close); REQUIRE(before == s.snapshot());
            }
            auto invalid = button(1, "A"); invalid["duration_ms"] = 1; REQUIRE(send(s, invalid).close);
        });
        check("ID permits full ASCII protocol alphabet and the 96-byte boundary", [] {
            ControllerProtocol s; REQUIRE(s.add(1, 0));
            const std::string identity = "A:._-" + std::string(91, 'z');
            accepted(send(s, message(0, "hello", identity)), 0);
            REQUIRE(player(s)["controllerId"] == identity);
        });
        check("oversized receive fails without changing active state", [] {
            ControllerProtocol s; setup(s); const auto before = s.snapshot();
            const auto reply = s.receive(std::string(1025, ' '), 1, 1);
            REQUIRE(reply.close && reply.object["message"] == "invalid_message"); REQUIRE(before == s.snapshot());
        });
        check("stop drops every peer and leaves monotonically newer cancellation state", [] {
            ControllerProtocol s; setup(s); send(s, button(1, "A")); const auto before = s.snapshot();
            s.stop(); neutral(s); REQUIRE(player(s)["connected"] == false);
            REQUIRE(s.snapshot()["revision"].get<std::uint64_t>() > before["revision"].get<std::uint64_t>());
            REQUIRE(s.expired(100).empty() && s.add(1, 100));
        });
        check("independent protocol instances produce different connection sessions", [] {
            ControllerProtocol a, b; setup(a); setup(b);
            REQUIRE(player(a)["session"] != player(b)["session"]);
        });
        std::cout << checks << " portable controller protocol tests passed\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "FAIL after " << checks << " tests: " << e.what() << '\n';
        return 1;
    }
}
