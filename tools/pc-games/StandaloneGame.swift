import AppKit
import Darwin
import WebKit

// All titles use the same host binary. Each signed bundle supplies its own
// application identity, web storage namespace, game.json and offline APK.
let helper = Bundle.main.bundleURL.appendingPathComponent("Contents/Helpers/player")
if CommandLine.arguments.dropFirst().first?.hasPrefix("--") == true {
    let args = ([helper.path] + Array(CommandLine.arguments.dropFirst())).map { strdup($0) } + [nil]
    args.withUnsafeBufferPointer { argv in
        _ = execv(helper.path, argv.baseAddress!)
    }
    perror("player")
    exit(1)
}

final class GameWindow: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    let name = Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? "pureTV"
    let worker = Process()
    let output = Pipe()
    var window: NSWindow!
    var web: WKWebView!
    var stopping = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        let mainMenu = NSMenu()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Quit " + name, action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        let item = mainMenu.addItem(withTitle: name, action: nil, keyEquivalent: "")
        item.submenu = appMenu
        NSApp.mainMenu = mainMenu

        let config = WKWebViewConfiguration()
        config.mediaTypesRequiringUserActionForPlayback = []
        web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1100, height: 620),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.isReleasedWhenClosed = false
        window.title = name + "…"
        window.contentView = web
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        worker.executableURL = helper
        worker.arguments = ["--no-browser"]
        worker.standardOutput = output
        worker.terminationHandler = { process in
            DispatchQueue.main.async {
                if !self.stopping {
                    self.fail("Game host exited (" + String(process.terminationStatus) + ").")
                }
            }
        }
        do {
            try worker.run()
        } catch {
            fail(error.localizedDescription)
            return
        }
        // The host chooses another loopback port when its preferred one is in use.
        let read = output.fileHandleForReading
        DispatchQueue.global().async {
            var buffer = Data()
            while true {
                let next = read.availableData
                if next.isEmpty { break }
                buffer.append(next)
                while let end = buffer.firstIndex(of: 10) {
                    let line = String(decoding: buffer[..<end], as: UTF8.self)
                    buffer.removeSubrange(...end)
                    guard line.hasPrefix("Game: "), let url = URL(string: String(line.dropFirst(6))),
                          url.scheme == "http", url.host == "127.0.0.1" else { continue }
                    DispatchQueue.main.async {
                        self.web.load(URLRequest(url: url))
                    }
                }
            }
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        window.title = name
        window.makeFirstResponder(webView)
        FileHandle.standardError.write(Data("WKWebView ready\n".utf8))
        if ProcessInfo.processInfo.environment["PURETV_GAME_VERIFY"] == "1" {
            reportGameState(until: Date().addingTimeInterval(60))
        }
    }

    // The CI check observes the same WebView and gameplay state as the user.
    func reportGameState(until deadline: Date) {
        let expression = """
            (() => {
                const state = window.PureTVQA?.snapshot?.() ?? window.JoystickGameQA?.snapshot?.();
                return state?.phase || state?.stage || "";
            })()
            """
        web.evaluateJavaScript(expression) { result, _ in
            if let stage = result as? String, !stage.isEmpty, stage.lowercased() != "loading" {
                FileHandle.standardError.write(Data(("WK game ready: " + stage + "\n").utf8))
            } else if !self.stopping && Date() < deadline {
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                    self.reportGameState(until: deadline)
                }
            }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        if !stopping { fail(error.localizedDescription) }
    }

    func fail(_ message: String) {
        stopping = true
        let alert = NSAlert()
        alert.messageText = name
        alert.informativeText = message
        alert.runModal()
        NSApp.terminate(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationWillTerminate(_ notification: Notification) {
        stopping = true
        if worker.isRunning {
            worker.terminate()
            worker.waitUntilExit()
        }
    }
}

let app = NSApplication.shared
let controller = GameWindow()
app.delegate = controller
app.setActivationPolicy(.regular)
app.run()
