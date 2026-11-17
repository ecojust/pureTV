import AppKit
import WebKit

private func option(_ name: String) -> String? {
    guard let index = CommandLine.arguments.firstIndex(of: name), index + 1 < CommandLine.arguments.count else { return nil }
    return CommandLine.arguments[index + 1]
}

private func jsonText(_ value: Any) -> String? {
    guard JSONSerialization.isValidJSONObject(value), let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]), let text = String(data: data, encoding: .utf8) else { return nil }
    return text
}

final class NeonApplication: NSObject, NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    private let preferences = option("--preferences-domain").flatMap { UserDefaults(suiteName: $0) } ?? .standard
    private let diagnostics = option("--diagnostics-dir").map { URL(fileURLWithPath: $0, isDirectory: true) }
    private var window: NSWindow!
    private var webView: WKWebView!
    private var loading: NSTextField!
    private var assetServer: LocalAssetServer?
    private let controller = ControllerServer()
    private var pageURL: URL?
    private var bridgeSource = ""
    private var ready = false
    private var terminating = false
    private var sleeping = false
    private var pushing = false
    private var diagnosing = false
    private var takingScreenshot = false
    private var inputTimer: Timer?
    private var diagnosticTimer: Timer?
    private var lastJavaScriptError: String?
    private var observers: [NSObjectProtocol] = []

    private var foreground: Bool { NSApp.isActive && window != nil && window.isKeyWindow && !window.isMiniaturized && window.isVisible && !terminating && !sleeping }
    private var english: Bool {
        if let saved = preferences.string(forKey: "neon-rush.language") { return saved == "en" }
        return !(Locale.preferredLanguages.first ?? "zh").lowercased().hasPrefix("zh")
    }
    private func text(_ zh: String, _ en: String) -> String { english ? en : zh }

    func applicationDidFinishLaunching(_ notification: Notification) {
        if let language = option("--language"), ["zh", "en"].contains(language) { preferences.set(language, forKey: "neon-rush.language") }
        if let diagnostics = diagnostics { try? FileManager.default.createDirectory(at: diagnostics, withIntermediateDirectories: true) }
        buildMenu()
        let configuration = WKWebViewConfiguration()
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.userContentController.add(self, name: "neonHost")
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.allowsBackForwardNavigationGestures = false
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1280, height: 720), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = text("霓虹飞车", "Neon Rush")
        window.contentMinSize = NSSize(width: 960, height: 540)
        window.collectionBehavior = [.fullScreenPrimary]
        window.isReleasedWhenClosed = false
        window.delegate = self
        window.contentView = webView
        loading = NSTextField(labelWithString: text("正在准备霓虹飞车…", "Preparing Neon Rush…"))
        loading.textColor = .secondaryLabelColor
        loading.translatesAutoresizingMaskIntoConstraints = false
        webView.addSubview(loading)
        NSLayoutConstraint.activate([loading.centerXAnchor.constraint(equalTo: webView.centerXAnchor), loading.centerYAnchor.constraint(equalTo: webView.centerYAnchor)])
        window.center()
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        window.makeFirstResponder(webView)
        controller.setInputEnabled(false)
        controller.onChange = { [weak self] in self?.pushInput() }
        let center = NSWorkspace.shared.notificationCenter
        observers.append(center.addObserver(forName: NSWorkspace.willSleepNotification, object: nil, queue: .main) { [weak self] _ in self?.sleeping = true; self?.suspend() })
        observers.append(center.addObserver(forName: NSWorkspace.didWakeNotification, object: nil, queue: .main) { [weak self] _ in self?.sleeping = false; self?.synchronizeForeground() })
        guard let resources = Bundle.main.resourceURL else { fail("Missing application resources"); return }
        let root = resources.appendingPathComponent("Web", isDirectory: true)
        do { bridgeSource = try String(contentsOf: root.appendingPathComponent("bridge.js"), encoding: .utf8) }
        catch { fail(error.localizedDescription); return }
        let server = LocalAssetServer(root: root)
        assetServer = server
        server.start { [weak self] result in
            guard let self = self, !self.terminating else { return }
            switch result {
            case .success(let url):
                self.pageURL = url
                self.configureBootstrap()
                self.webView.load(URLRequest(url: url))
            case .failure(let error): self.fail(error.localizedDescription)
            }
        }
        inputTimer = Timer(timeInterval: 1.0 / 60.0, repeats: true) { [weak self] _ in self?.pushInput() }
        RunLoop.main.add(inputTimer!, forMode: .common)
        if diagnostics != nil {
            diagnosticTimer = Timer(timeInterval: 0.1, repeats: true) { [weak self] _ in self?.writeDiagnostics() }
            RunLoop.main.add(diagnosticTimer!, forMode: .common)
        }
    }

    private func buildMenu() {
        let bar = NSMenu()
        let application = NSMenuItem()
        bar.addItem(application)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: text("关于霓虹飞车", "About Neon Rush"), action: #selector(showAbout), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: text("隐藏霓虹飞车", "Hide Neon Rush"), action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(withTitle: text("退出霓虹飞车", "Quit Neon Rush"), action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        application.submenu = appMenu
        let gameItem = NSMenuItem(title: text("游戏", "Game"), action: nil, keyEquivalent: "")
        let gameMenu = NSMenu(title: gameItem.title)
        let pause = gameMenu.addItem(withTitle: text("暂停／继续", "Pause / Resume"), action: #selector(pauseRace), keyEquivalent: "p")
        pause.target = self
        let retry = gameMenu.addItem(withTitle: text("重开比赛", "Restart Race"), action: #selector(restartRace), keyEquivalent: "r")
        retry.target = self
        gameItem.submenu = gameMenu
        bar.addItem(gameItem)
        let viewItem = NSMenuItem(title: text("显示", "View"), action: nil, keyEquivalent: "")
        let viewMenu = NSMenu(title: viewItem.title)
        let fullScreen = viewMenu.addItem(withTitle: text("进入／退出全屏", "Toggle Full Screen"), action: #selector(toggleFullScreen), keyEquivalent: "f")
        fullScreen.keyEquivalentModifierMask = [.control, .command]
        fullScreen.target = self
        viewItem.submenu = viewMenu
        bar.addItem(viewItem)
        NSApp.mainMenu = bar
        appMenu.items.first?.target = self
    }

    @objc private func showAbout() {
        NSApp.orderFrontStandardAboutPanel(options: [.applicationName: text("霓虹飞车", "Neon Rush"), .applicationVersion: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "", .version: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "", .credits: NSAttributedString(string: text("pureTV 原创竞速 · 支持 pureTV Wi-Fi 手柄\nThree.js · MIT", "pureTV original racing · pureTV Wi-Fi controller support\nThree.js · MIT"))])
    }
    @objc private func toggleFullScreen() { window.toggleFullScreen(nil) }
    @objc private func pauseRace() { gameKey("p") }
    @objc private func restartRace() { gameKey("r") }
    private func gameKey(_ key: String) {
        guard ready else { return }
        webView.evaluateJavaScript("window.PureGame?.key('\(key)',true);setTimeout(()=>window.PureGame?.key('\(key)',false),60)", completionHandler: nil)
    }

    private func information() -> [String: Any] {
        var info = controller.info()
        info["language"] = english ? "en" : "zh"
        info["platform"] = "macos"
        info["appVersion"] = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? ""
        info["url"] = ""
        info["qr"] = ""
        info["preferences"] = ["neon-rush.language": english ? "en" : "zh", "puretv.neon-rush.best": preferences.string(forKey: "puretv.neon-rush.best") ?? "0"]
        return info
    }
    private func configureBootstrap() {
        guard !bridgeSource.isEmpty, let info = jsonText(information()), let snapshot = jsonText(controller.snapshot()) else { return }
        let content = webView.configuration.userContentController
        content.removeAllUserScripts()
        content.addUserScript(WKUserScript(source: bridgeSource + "\nwindow.NeonDesktop.receive(\(info),\(snapshot));", injectionTime: .atDocumentStart, forMainFrameOnly: true))
    }
    private func pushInput() {
        guard ready, !pushing, !terminating, let info = jsonText(information()), let snapshot = jsonText(controller.snapshot()) else { return }
        pushing = true
        webView.evaluateJavaScript("window.NeonDesktop?.receive(\(info),\(snapshot));") { [weak self] _, error in
            self?.pushing = false
            if let error = error { self?.lastJavaScriptError = error.localizedDescription }
        }
    }
    private func synchronizeForeground() {
        // Focus changes and macOS permission dialogs must not change the endpoint
        // that the controller just discovered. Only gameplay input is suspended.
        if ready {
            controller.setInputEnabled(foreground)
            controller.start()
        }
        if ready && foreground { pushInput() }
        else { suspend() }
    }
    private func suspend() {
        controller.setInputEnabled(false)
        guard ready else { return }
        webView.evaluateJavaScript("window.NeonDesktop?.suspend();", completionHandler: nil)
        pushInput()
    }
    func applicationDidBecomeActive(_ notification: Notification) { synchronizeForeground() }
    func applicationDidResignActive(_ notification: Notification) { suspend() }
    func applicationDidHide(_ notification: Notification) { suspend() }
    func applicationDidUnhide(_ notification: Notification) { synchronizeForeground() }
    func windowDidResignKey(_ notification: Notification) { suspend() }
    func windowDidBecomeKey(_ notification: Notification) { synchronizeForeground() }
    func windowDidMiniaturize(_ notification: Notification) { suspend() }
    func windowDidDeminiaturize(_ notification: Notification) { synchronizeForeground() }
    func windowWillClose(_ notification: Notification) { NSApp.terminate(nil) }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
    func applicationWillTerminate(_ notification: Notification) {
        terminating = true
        inputTimer?.invalidate()
        diagnosticTimer?.invalidate()
        controller.stop()
        assetServer?.stop()
        for observer in observers { NSWorkspace.shared.notificationCenter.removeObserver(observer) }
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "neonHost")
        preferences.synchronize()
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let pageURL = pageURL,
              message.frameInfo.request.url?.scheme == pageURL.scheme,
              message.frameInfo.request.url?.host == pageURL.host,
              message.frameInfo.request.url?.port == pageURL.port,
              let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "ready":
            ready = true
            loading.isHidden = true
            synchronizeForeground()
        case "preference":
            guard let key = body["key"] as? String, let value = body["value"] as? String else { return }
            if key == "neon-rush.language" && ["zh", "en"].contains(value) { preferences.set(value, forKey: key) }
            else if key == "puretv.neon-rush.best", let score = Double(value), score.isFinite, score >= 0, score < 1e9 { preferences.set(String(Int(score)), forKey: key) }
        case "publish": break
        default: break
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url, let pageURL = pageURL,
              url.scheme == pageURL.scheme, url.host == pageURL.host, url.port == pageURL.port,
              url.path == pageURL.path, url.query == nil, navigationAction.targetFrame?.isMainFrame == true else { decisionHandler(.cancel); return }
        if ready { suspend(); ready = false; loading.isHidden = false }
        configureBootstrap()
        decisionHandler(.allow)
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        ready = true
        loading.isHidden = true
        window.makeFirstResponder(webView)
        synchronizeForeground()
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail(error.localizedDescription) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail(error.localizedDescription) }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        ready = false
        controller.stop()
        loading.stringValue = text("游戏画面已停止。请退出后重新打开。", "The game view stopped. Quit and reopen the app.")
        loading.isHidden = false
    }
    private func fail(_ detail: String) {
        lastJavaScriptError = detail
        ready = false
        controller.stop()
        loading?.stringValue = text("无法打开游戏：", "Unable to open game: ") + detail
        loading?.isHidden = false
        NSLog("Neon Rush: %@", detail)
    }

    private func writeDiagnostics() {
        guard let directory = diagnostics, !diagnosing, !terminating else { return }
        diagnosing = true
        let script = """
        (()=>({game:window.PureTVQA?.snapshot()||null,document:{url:location.href,title:document.title,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,webglError:document.body.classList.contains('rush-webgl-error'),primaryText:document.getElementById('primary')?.textContent||'',language:document.documentElement.lang}}))()
        """
        webView.evaluateJavaScript(script) { [weak self] value, error in
            guard let self = self else { return }
            defer { self.diagnosing = false }
            var state = value as? [String: Any] ?? [:]
            state["timestamp"] = Date().timeIntervalSince1970
            state["ready"] = self.ready
            state["server"] = self.information()
            state["input"] = self.controller.snapshot()
            state["active"] = self.foreground
            if let front = NSWorkspace.shared.frontmostApplication { state["frontmostApplication"] = ["name": front.localizedName ?? "", "bundleIdentifier": front.bundleIdentifier ?? ""] }
            #if arch(arm64)
            state["processArchitecture"] = "arm64"
            #else
            state["processArchitecture"] = "x86_64"
            #endif
            if let error = error { state["diagnosticError"] = error.localizedDescription }
            if let error = self.lastJavaScriptError { state["lastJavaScriptError"] = error }
            if let data = try? JSONSerialization.data(withJSONObject: state, options: [.sortedKeys]) { try? data.write(to: directory.appendingPathComponent("state.json"), options: .atomic) }
            self.captureRequestedScreenshot(directory)
        }
    }
    private func captureRequestedScreenshot(_ directory: URL) {
        guard ready, !takingScreenshot else { return }
        let request = directory.appendingPathComponent("screenshot-request.txt")
        guard let raw = try? String(contentsOf: request, encoding: .utf8) else { return }
        try? FileManager.default.removeItem(at: request)
        let name = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard name.range(of: "^[A-Za-z0-9][A-Za-z0-9_-]{0,70}\\.png$", options: .regularExpression) != nil else { return }
        takingScreenshot = true
        let configuration = WKSnapshotConfiguration()
        configuration.rect = webView.bounds
        webView.takeSnapshot(with: configuration) { [weak self] image, error in
            defer { self?.takingScreenshot = false }
            if let tiff = image?.tiffRepresentation, let bitmap = NSBitmapImageRep(data: tiff), let data = bitmap.representation(using: .png, properties: [:]) { try? data.write(to: directory.appendingPathComponent(name), options: .atomic) }
            else if let error = error { self?.lastJavaScriptError = error.localizedDescription }
        }
    }
}

let application = NSApplication.shared
let delegate = NeonApplication()
application.delegate = delegate
application.setActivationPolicy(.regular)
application.run()
