// Independent QA window. It never opens or changes the game or its diagnostics.
import AppKit
import WebKit
final class Probe: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var web: WKWebView!
    let output = URL(fileURLWithPath: CommandLine.arguments[1])
    var finished = false
    func save(_ value: [String: Any]) {
        guard !finished else { return }; finished = true
        var result = value
        #if arch(arm64)
        result["processArchitecture"] = "arm64"
        #else
        result["processArchitecture"] = "x86_64"
        #endif
        result["method"] = "Independent default WKWebView; three animation-frame samples; no game state access"
        result["systemVersion"] = ProcessInfo.processInfo.operatingSystemVersionString
        do {
            let data = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
            try data.write(to: output, options: .atomic)
        } catch { fputs("Probe save error: \(error)\n", stderr) }
        NSApp.terminate(nil)
    }
    func applicationDidFinishLaunching(_ notification: Notification) {
        let configuration = WKWebViewConfiguration()
        configuration.mediaTypesRequiringUserActionForPlayback = []
        web = WKWebView(frame: .zero, configuration: configuration); web.navigationDelegate = self
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 640, height: 360), styleMask: [.titled, .closable], backing: .buffered, defer: false)
        window.title = "pureTV independent WebGL capability probe"; window.contentView = web
        window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
        web.loadHTMLString("<html><body><p>Independent WebGL capability observation</p><canvas id='probe' width='64' height='64'></canvas></body></html>", baseURL: URL(string: "http://127.0.0.1/"))
        DispatchQueue.main.asyncAfter(deadline: .now() + 30) { self.save(["status":"timeout"]) }
    }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let script = """
        (() => {
          const canvas=document.getElementById('probe'), samples=[];
          const result={status:'running',url:location.href,userAgent:navigator.userAgent,samples};
          window.__probeResult=result;
          let gl;
          try { gl=canvas.getContext('webgl'); } catch(error) { result.contextError=String(error); }
          result.webgl1ContextCreated=!!gl;
          if(!gl){result.status='complete';return;}
          const sample=()=>{
            const value={};
            try{
              value.version=gl.getParameter(gl.VERSION);value.renderer=gl.getParameter(gl.RENDERER);value.vendor=gl.getParameter(gl.VENDOR);value.contextLost=gl.isContextLost();
              const ext=gl.getExtension('WEBGL_debug_renderer_info');
              if(ext){value.unmaskedRenderer=gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);value.unmaskedVendor=gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);}
              value.vertexHighFloat=null;
              const p=gl.getShaderPrecisionFormat(gl.VERTEX_SHADER,gl.HIGH_FLOAT);
              if(p)value.vertexHighFloat={rangeMin:p.rangeMin,rangeMax:p.rangeMax,precision:p.precision};
              const f=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
              value.fragmentHighFloat=f?{rangeMin:f.rangeMin,rangeMax:f.rangeMax,precision:f.precision}:null;
              value.glError=gl.getError();
            }catch(error){value.error=String(error);}
            samples.push(value);
            if(samples.length<3)requestAnimationFrame(sample);else result.status='complete';
          };
          requestAnimationFrame(sample);
        })();
        """
        web.evaluateJavaScript(script) { _, error in
            if let error = error { self.save(["status":"script_error","error":error.localizedDescription]) }
            else { self.poll() }
        }
    }
    func poll() {
        guard !finished else { return }
        web.evaluateJavaScript("window.__probeResult") { value, error in
            if let error = error { self.save(["status":"read_error","error":error.localizedDescription]); return }
            if let result = value as? [String: Any], result["status"] as? String == "complete" { self.save(result) }
            else { DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { self.poll() } }
        }
    }
}
let app=NSApplication.shared
let delegate=Probe()
app.delegate=delegate
app.setActivationPolicy(.regular)
app.run()
