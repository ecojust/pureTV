import AppKit
import WebKit

final class Probe: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    let url = URL(string: CommandLine.arguments[1])!
    let out = URL(fileURLWithPath: CommandLine.arguments[2])
    let script = try! String(contentsOfFile: CommandLine.arguments[3], encoding: .utf8)
    let raw = CommandLine.arguments[4] == "raw"
    let started = Date()
    var saved = false
    var last: [String: Any] = [:]
    func save(_ result: [String: Any]) {
        guard !saved else { return }; saved = true
        var value = result
        value["url"] = url.absoluteString
        value["systemVersion"] = ProcessInfo.processInfo.operatingSystemVersionString
        value["elapsed"] = Date().timeIntervalSince(started)
        #if arch(x86_64)
        value["arch"] = "x86_64"
        #else
        value["arch"] = "arm64"
        #endif
        let data = try! JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted, .sortedKeys])
        try! data.write(to: out, options: .atomic)
        NSApp.terminate(nil)
    }
    func applicationDidFinishLaunching(_ note: Notification) {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.userContentController.addUserScript(WKUserScript(source: script, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let bounds = NSRect(x:0,y:0,width:1280,height:720)
        web = WKWebView(frame: bounds, configuration: config)
        web.navigationDelegate = self
        window = NSWindow(contentRect: bounds, styleMask: [.titled,.closable,.resizable], backing: .buffered,defer: false)
        window.contentView = web
        window.center();window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
        web.load(URLRequest(url:url))
        DispatchQueue.main.asyncAfter(deadline:.now()+0.4) { self.poll() }
        DispatchQueue.main.asyncAfter(deadline:.now()+80) { self.save(["status":"timeout","last":self.last]) }
    }
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { save(["status":"webContentProcessTerminated","last":last]) }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { save(["status":"navigationError","error":error.localizedDescription]) }
    func poll() {
        guard !saved else { return }
        web.evaluateJavaScript("typeof window.__probeRead==='function' ? JSON.stringify(window.__probeRead()) : null") { value,error in
            guard !self.saved else {return}
            if let str=value as? String, let obj=(try? JSONSerialization.jsonObject(with: Data(str.utf8))) as? [String:Any] {
                self.last=obj
                if let done=obj["done"] as? Bool,done {self.save(obj);return}
            } else if let err=error {self.last=["readError":err.localizedDescription]}
            DispatchQueue.main.asyncAfter(deadline:.now()+0.25){self.poll()}
        }
    }
}
let app=NSApplication.shared
let probe=Probe()
app.delegate=probe
app.setActivationPolicy(.regular)
app.run()
