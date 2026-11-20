#!/usr/bin/env python3
"""Exercise real WKWebView navigation with the production entry URL policy."""
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[4]
SERVER = ROOT / 'joystick-games/shared/macos/Sources/LocalAssetServer.swift'
APP = ROOT / 'joystick-games/shared/macos/Sources/main.swift'
RACE_QUERY = '?mode=quick&stage=finland&car=swift&cond=stage&weather=clear'
PAGE = '''<!doctype html><meta charset="utf-8"><title>Original entry query fixture</title>
<a id="race" href="./tv.html?mode=quick&amp;stage=finland&amp;car=swift&amp;cond=stage&amp;weather=clear">Race</a>
<a id="return" href="./tv.html">Return</a>
<script>
(async()=>{try{
 const response=await fetch('./menu.json?v=198988baa6');
 if(!response.ok)throw new Error('HTTP '+response.status);
 const data=await response.json();
 window.webkit.messageHandlers.fixture.postMessage({status:'ready',search:location.search,path:location.pathname,data});
}catch(error){window.webkit.messageHandlers.fixture.postMessage({status:'failed',error:String(error)});}})();
</script>'''
HARNESS = r'''
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
'''


@unittest.skipUnless(platform.system() == 'Darwin', 'Requires actual macOS AppKit/WebKit and Swift')
class ActualEntryNavigation(unittest.TestCase):
    def test_real_wk_menu_race_return_and_rejected_navigation(self):
        with tempfile.TemporaryDirectory(prefix='native-entry-navigation-') as temporary:
            work = Path(temporary); web = work / 'Web'; web.mkdir()
            (web / 'tv.html').write_text(PAGE)
            (web / 'menu.json').write_text('{"original":"menu fixture"}')
            (web / 'other.html').write_text('<title>Indexed but not a permitted main entry</title>')
            harness = work / 'main.swift'; harness.write_text(HARNESS)
            binary = work / 'entry-navigation-test'; output = work / 'report.json'
            source_files = {str(p.relative_to(ROOT)): {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
                            for p in (SERVER, APP, Path(__file__).resolve())}
            evidence = None
            if os.environ.get('PURETV_ASSET_TEST_EVIDENCE'):
                evidence = Path(os.environ['PURETV_ASSET_TEST_EVIDENCE']).parent / 'entry-navigation-compile'
                evidence.mkdir(exist_ok=False)
                for name in source_files:
                    data = (ROOT / name).read_bytes()
                    if os.environ.get('GITHUB_SHA'):
                        self.assertEqual(data, subprocess.check_output(['git', '-C', str(ROOT), 'show', os.environ['GITHUB_SHA'] + ':' + name]))
                    target = evidence / 'executed-source' / name; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
                (evidence / 'main.swift').write_text(HARNESS)
                (evidence / 'fixture.json').write_text(json.dumps({'tv.html': PAGE, 'menu.json': '{"original":"menu fixture"}', 'raceQuery': RACE_QUERY}, indent=2) + '\n')
            self.assertIn('LocalAssetServer.allowsEntryNavigation(url, entry: pageURL,', APP.read_text())
            command = ['xcrun', 'swiftc', '-swift-version', '5', str(SERVER), str(harness),
                       '-framework', 'Network', '-framework', 'AppKit', '-framework', 'WebKit', '-o', str(binary)]
            context = {'status': 'compiling', 'sourceCommit': os.environ.get('GITHUB_SHA'), 'architecture': platform.machine(),
                       'command': command, 'sourceFiles': source_files, 'harnessSha256': hashlib.sha256(HARNESS.encode()).hexdigest(),
                       'nativeAppDelegateExecuted': False, 'method': 'Real WKWebView clicks with the shared production URL decision helper'}
            if evidence: (evidence / 'compile-context.json').write_text(json.dumps(context, indent=2) + '\n')
            compiled = subprocess.run(command, capture_output=True)
            context.update(status='compiled' if compiled.returncode == 0 else 'compile_failed', returncode=compiled.returncode)
            if compiled.returncode == 0: context['binarySha256'] = hashlib.sha256(binary.read_bytes()).hexdigest()
            if evidence:
                (evidence / 'compile-context.json').write_text(json.dumps(context, indent=2) + '\n')
                (evidence / 'compile-stdout.log').write_bytes(compiled.stdout); (evidence / 'compile-stderr.log').write_bytes(compiled.stderr)
            self.assertEqual(compiled.returncode, 0, compiled.stderr.decode(errors='replace'))
            sign_command = ['/usr/bin/codesign', '--force', '--sign', '-', '--timestamp=none', str(binary)]
            signed = subprocess.run(sign_command, capture_output=True)
            if evidence:
                (evidence / 'sign-command.json').write_text(json.dumps({'command': sign_command, 'returncode': signed.returncode}, indent=2) + '\n')
                (evidence / 'sign-stdout.log').write_bytes(signed.stdout); (evidence / 'sign-stderr.log').write_bytes(signed.stderr)
            self.assertEqual(signed.returncode, 0, signed.stderr.decode(errors='replace'))
            context.update(binarySha256=hashlib.sha256(binary.read_bytes()).hexdigest(), signature='ad-hoc')
            if evidence: (evidence / 'compile-context.json').write_text(json.dumps(context, indent=2) + '\n')
            argv = [str(binary), str(web), str(output)]
            process = subprocess.Popen(argv, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            timed_out = False
            try: stdout, stderr = process.communicate(timeout=55)
            except subprocess.TimeoutExpired:
                timed_out = True; process.kill(); stdout, stderr = process.communicate()
            if evidence:
                (evidence / 'process.json').write_text(json.dumps({'command': argv, 'returncode': process.returncode, 'timedOut': timed_out}, indent=2) + '\n')
                (evidence / 'stdout.log').write_bytes(stdout); (evidence / 'stderr.log').write_bytes(stderr)
                if output.exists(): (evidence / 'report.json').write_bytes(output.read_bytes())
            self.assertEqual(process.returncode, 0, (stdout + stderr).decode(errors='replace'))
            report = json.loads(output.read_text()); self.assertEqual(report['status'], 'passed')
            self.assertEqual([row['search'] for row in report['observations']], ['', RACE_QUERY, ''])
            self.assertEqual(len(report['finishedURLs']), 3); self.assertEqual(len(report['blockedNavigations']), 7)
            self.assertTrue(all(row['allowed'] is False for row in report['blockedNavigations']))


if __name__ == '__main__':
    unittest.main(verbosity=2)
