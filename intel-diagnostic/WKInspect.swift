import AppKit
import WebKit

final class Inspector: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    let address = URL(string: CommandLine.arguments[1])!
    let file = URL(fileURLWithPath: CommandLine.arguments[2])
    var window: NSWindow!
    var web: WKWebView!
    var records = [[String:Any]]()
    var observations = [[String:Any]]()
    var elapsed = 0, keyCount = 0
    var busy = false, finished = false
    var timer: Timer?
    func note(_ kind: String, _ message: String) {
        guard records.count < 500 else {return}
        records.append(["seconds": elapsed, "kind":kind, "message":String(message.prefix(5000))])
    }
    func save(_ outcome:String) {
        guard !finished else {return}; finished=true; timer?.invalidate()
        let result:[String:Any]=["url":address.absoluteString, "outcome":outcome, "system":ProcessInfo.processInfo.operatingSystemVersionString, "records":records, "snapshots":observations, "keysSent":keyCount]
        do {try JSONSerialization.data(withJSONObject:result,options:[.sortedKeys,.prettyPrinted]).write(to:file,options:.atomic)}
        catch {fputs("Save failed: \(error)\n",stderr)}
        NSApp.terminate(nil)
    }
    func applicationDidFinishLaunching(_ event: Notification) {
        let config=WKWebViewConfiguration()
        config.userContentController.add(self,name:"trace")
        let source="""
        (() => {
          const emit=(kind,message)=>{try{window.webkit.messageHandlers.trace.postMessage(JSON.stringify({kind,message:String(message)}))}catch(e){}};
          const text=v=>{if(v instanceof Error)return v.name+': '+v.message+' '+v.stack;try{return typeof v==='string'?v:JSON.stringify(v)}catch{return String(v)}};
          window.addEventListener('error',e=>emit('error',text(e.error||e.message||e.target?.src||e.target?.href)),true);
          window.addEventListener('unhandledrejection',e=>emit('rejection',text(e.reason)));
          for(const name of ['error','warn']){const original=console[name];console[name]=function(...args){emit('console.'+name,args.map(text).join(' '));return original.apply(console,args)}}
          const get=HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext=function(kind,...args){
            const context=get.call(this,kind,...args);
            if (kind.startsWith('webgl')) {
              const observe=phase=>{try{const p=context?.getShaderPrecisionFormat(context.VERTEX_SHADER,context.HIGH_FLOAT);const ext=context?.getExtension('WEBGL_debug_renderer_info');
                emit('context',JSON.stringify({kind,phase,canvas:this.id,created:!!context,lost:context?.isContextLost(),version:context?.getParameter(context.VERSION),renderer:ext?context.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,vertexHighFloat:p?{precision:p.precision,rangeMin:p.rangeMin,rangeMax:p.rangeMax}:null}))}catch(e){emit('context-telemetry',text(e))}};
              observe('returned');setTimeout(()=>observe('later'),200);
              this.addEventListener('webglcontextlost',e=>emit('lost',this.id+' '+e.statusMessage));
            }
            return context;
          };
          emit('script-start',navigator.userAgent);
        })()
        """
        config.userContentController.addUserScript(WKUserScript(source:source,injectionTime:.atDocumentStart,forMainFrameOnly:true))
        web=WKWebView(frame:NSRect(x:0,y:0,width:1000,height:600),configuration:config)
        window=NSWindow(contentRect:web.frame,styleMask:[.titled,.closable,.resizable],backing:.buffered,defer:false)
        window.contentView=web;window.center();window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(web);NSApp.activate(ignoringOtherApps:true)
        web.navigationDelegate=self;web.load(URLRequest(url:address))
        timer=Timer.scheduledTimer(withTimeInterval:2,repeats:true){[weak self] _ in self?.tick()}
    }
    func userContentController(_ c:WKUserContentController,didReceive m:WKScriptMessage){if let text=m.body as? String {note("javascript",text)}}
    func webView(_ v:WKWebView,didFinish nav:WKNavigation!){note("navigation","finished")}
    func webView(_ v:WKWebView,didFail nav:WKNavigation!,withError error:Error){note("navigation",String(describing:error))}
    func webViewWebContentProcessDidTerminate(_ view:WKWebView) {note("process","WebContent terminated")}
    func tick() {
        elapsed += 2
        if elapsed>=68 {save("deadline");return}
        if busy {return};busy=true
        let code="""
        JSON.stringify((()=>{let q=null;try{q=window.JoystickGameQA?.snapshot?.();}catch(e){q={error:String(e)}}
        const fatal=document.getElementById('fatal'), guardEl=document.getElementById('glGuard');
        return {title:document.title,language:document.documentElement.lang,body:document.body?.innerText.slice(-640),fatal:fatal?.innerText,fatalVisible:fatal&&getComputedStyle(fatal).display!=='none',guard:guardEl?.innerText,guardKind:window.__glGuard?.kind,
        readyState:document.readyState,stage:q?.stage,ready:q?.ready,frames:q?.frames,errors:q?.errors||q?.error,gameplay:q?.gameplay,webgl:q?.webglVersion,
        storage:Object.keys(localStorage),canvases:Array.from(document.querySelectorAll('canvas')).slice(0,8).map(c=>[c.id,c.width,c.height])};})())
        """
        web.evaluateJavaScript(code){ [weak self] value,error in
            guard let self=self else{return}
            self.busy=false
            if let error=error {self.note("evaluation",String(describing:error));return}
            guard let s=value as? String,let data=s.data(using:.utf8),var obs=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any] else {self.note("evaluation","no serializable result");return}
            obs["seconds"]=self.elapsed;self.observations.append(obs)
            guard let phase=obs["stage"] as? String, let frames=obs["frames"] as? Int, frames>0 else{return}
            if phase=="menu" && self.keyCount==0 && (obs["ready"] as? Bool) != false {self.keyCount += 1;self.key(35)}
            else if phase=="playing" && self.keyCount==1 {self.keyCount += 1;self.key(126)}
            else if phase=="playing" && self.keyCount>=2 && self.elapsed>16 {self.save("observed-gameplay")}
        }
    }
    func key(_ key:CGKeyCode) {
        let destination=ProcessInfo.processInfo.processIdentifier
        CGEvent(keyboardEventSource:nil,virtualKey:key,keyDown:true)?.postToPid(destination)
        DispatchQueue.main.asyncAfter(deadline:.now()+0.45){CGEvent(keyboardEventSource:nil,virtualKey:key,keyDown:false)?.postToPid(destination)}
    }
}
let app=NSApplication.shared;let inspector=Inspector();app.delegate=inspector;app.setActivationPolicy(.regular);app.run()
