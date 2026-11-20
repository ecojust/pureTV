
import AppKit
import WebKit
import Foundation
import Darwin

final class Fixture: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
    let server: LocalAssetServer
    let output: URL
    var entry: URL!
    var web: WKWebView!
    var window: NSWindow!
    var phase = 0
    var loaded = false
    var observed: [String: Any]?
    var observations = [[String: Any]]()
    var finishedURLs = [String]()
    var blocked = [String]()
    var rejected = [[String: Any]]()
    var ended = false
    let searches = ["", "?mode=quick&stage=finland&car=swift&cond=stage&weather=clear", ""]
    init(root: URL, output: URL) { server = LocalAssetServer(root: root, policy: nil); self.output = output; super.init() }
    func finish(_ error: String? = nil) {
        guard !ended else { return }; ended = true
        var report: [String: Any] = ["status": error == nil ? "passed" : "failed",
            "actualWKWebViewNavigation": true, "productionDecisionHelperUsed": true,
            "nativeAppDelegateExecuted": false, "gameAssetsChanged": false,
            "observations": observations, "finishedURLs": finishedURLs,
            "blockedNavigations": rejected, "processArchitecture": ProcessInfo.processInfo.machineArchitecture]
        if let error = error { report["error"] = error }
        if let data = try? JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys]) {
            try? data.write(to: output); print(String(data: data, encoding: .utf8)!); fflush(stdout)
        }
        exit(error == nil ? 0 : 1)
    }
    func start() {
        server.start { result in
            switch result {
            case .failure(let error): self.finish("server: " + error.localizedDescription)
            case .success(let entry): self.open(entry)
            }
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 40) { self.finish("WK navigation fixture timed out") }
    }
    func open(_ url: URL) {
        entry = url
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.userContentController.add(self, name: "fixture")
        web = WKWebView(frame: NSRect(x: 0, y: 0, width: 640, height: 400), configuration: configuration)
        web.navigationDelegate = self
        window = NSWindow(contentRect: web.frame, styleMask: [.titled], backing: .buffered, defer: false)
        window.contentView = web; window.makeKeyAndOrderFront(nil)
        let port = url.port!
        blocked = ["http://localhost:\(port)/tv.html?mode=quick",
            "http://127.0.0.1:\(port == 65535 ? port - 1 : port + 1)/tv.html?mode=quick",
            "https://127.0.0.1:\(port)/tv.html?mode=quick",
            "http://127.0.0.1:\(port)/other.html?mode=quick",
            "http://127.0.0.1:\(port)/missing.html?mode=quick",
            "http://127.0.0.1:\(port)/%74v.html?mode=quick",
            url.absoluteString + "?x=%0d%0a"]
        guard !LocalAssetServer.allowsEntryNavigation(url, entry: url, isMainFrame: false),
              !LocalAssetServer.allowsEntryNavigation(URL(string: "http://user@127.0.0.1:\(port)/tv.html")!, entry: url, isMainFrame: true),
              LocalAssetServer.allowsEntryNavigation(URL(string: url.absoluteString + "?value=%2F..%2F#fragment")!, entry: url, isMainFrame: true)
        else { finish("Production navigation boundary check failed"); return }
        web.load(URLRequest(url: url))
    }
    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url else { decisionHandler(.cancel); finish("Missing navigation URL"); return }
        let allow = LocalAssetServer.allowsEntryNavigation(url, entry: entry, isMainFrame: action.targetFrame?.isMainFrame == true)
        if phase < searches.count {
            decisionHandler(allow ? .allow : .cancel)
            if !allow { finish("Original query navigation rejected: " + url.absoluteString) }
        } else {
            decisionHandler(.cancel)
            guard !allow, rejected.count < blocked.count,
                  url.absoluteString == URL(string: blocked[rejected.count])!.absoluteString else {
                finish("Unexpected navigation boundary decision: " + url.absoluteString); return
            }
            rejected.append(["url": url.absoluteString, "allowed": allow])
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { self.rejectNext() }
        }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard phase < searches.count, let url = webView.url,
              (url.query.map { "?" + $0 } ?? "") == searches[phase] else { finish("Unexpected completed navigation"); return }
        finishedURLs.append(url.absoluteString); loaded = true; advance()
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { finish("Provisional navigation: " + error.localizedDescription) }
    }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code != NSURLErrorCancelled { finish("Navigation: " + error.localizedDescription) }
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, phase < searches.count,
              let body = message.body as? [String: Any], body["status"] as? String == "ready",
              body["search"] as? String == searches[phase], body["path"] as? String == "/tv.html",
              let data = body["data"] as? [String: Any], data["original"] as? String == "menu fixture"
        else { finish("Unexpected page/cache-query observation: " + String(describing: message.body)); return }
        observed = body; advance()
    }
    func advance() {
        guard loaded, let body = observed, phase < searches.count else { return }
        observations.append(body); loaded = false; observed = nil; phase += 1
        if phase < searches.count {
            let button = phase == 1 ? "race" : "return"
            web.evaluateJavaScript("document.getElementById('\(button)').click()", completionHandler: nil)
        } else { rejectNext() }
    }
    func rejectNext() {
        if rejected.count == blocked.count {
            web.evaluateJavaScript("location.search") { value, error in
                guard error == nil, value as? String == "", self.finishedURLs.count == 3 else {
                    self.finish("Rejected navigation changed the original page"); return
                }
                self.finish()
            }
            return
        }
        let data = try! JSONSerialization.data(withJSONObject: [blocked[rejected.count]])
        let literal = String(data: data, encoding: .utf8)!.dropFirst().dropLast()
        web.evaluateJavaScript("(()=>{const a=document.createElement('a');a.href=\(literal);document.body.append(a);a.click();a.remove();})()", completionHandler: nil)
    }
}
extension ProcessInfo {
    var machineArchitecture: String {
        #if arch(arm64)
        return "arm64"
        #else
        return "x86_64"
        #endif
    }
}
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let fixture = Fixture(root: URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true),
                      output: URL(fileURLWithPath: CommandLine.arguments[2]))
fixture.start()
app.run()
