export function snapshot() {
  return {
    localNetwork:{addresses:[{interfaceName:'Wi-Fi',ip:'192.168.0.2',prefixLength:24},{interfaceName:'Ethernet',ip:'10.0.0.2',prefixLength:24},{interfaceName:'Test LAN',ip:'192.168.1.2',prefixLength:24}],error:null},
    systemInfo:{manufacturer:'Test Maker',brand:'Test',sdkVersion:'33',securityPatch:'2026-10-01',cpu:'test-cpu',cpuAbi:'arm64-v8a',memoryTotalBytes:4294967296,memoryAvailableBytes:1073741824,storageTotalBytes:34359738368,storageAvailableBytes:8589934592,displayResolution:'1920x1080',uptimeSeconds:3600,queriedAt:1},
    revision: 0, adbPath: 'C:\\platform-tools\\adb.exe', adbAvailable: true,
    device: { serial: '192.168.1.50:5555', model: '测试电视', androidVersion: '12', userId: 0, status: 'device' },
    packages: [
      { packageName: 'com.vendor.recommendations', label: '厂商推荐', system: true, enabled: true, installed: true, protectedReason: null },
      { packageName: 'com.vendor.disabled', label: '已停用示例', system: true, enabled: false, installed: true, protectedReason: null },
      { packageName: 'com.vendor.removed', label: '可恢复示例', system: true, enabled: false, installed: false, protectedReason: null },
      { apkSizeBytes: 12582912, packageName: 'com.ecojust.webtv', label: 'WebTV', system: false, enabled: true, installed: true, protectedReason: null },
      { packageName: 'com.ecojust.puretv', label: 'pureTV', system: false, enabled: true, installed: true, protectedReason: null },
      { packageName: 'com.vendor.home', label: '原厂桌面', system: true, enabled: true, installed: true, protectedReason: '当前默认启动器' },
      { packageName: 'com.android.settings', label: '系统设置', system: true, enabled: true, installed: true, protectedReason: '关键系统组件' },
    ],
    launchers: [
      { packageName: 'com.vendor.home', component: 'com.vendor.home/.Main', label: '原厂桌面', isDefault: true },
      { packageName: 'com.ecojust.puretv', component: 'com.ecojust.puretv/.MainActivity', label: 'pureTV', isDefault: false },
    ],
    defaultHome: 'com.vendor.home/.Main', originalHome: null, history: [], message: '',
  };
}

export async function mockBridge(page, initial = snapshot(), options = {}) {
  await page.addInitScript(({initial, options}) => {
    const state = structuredClone(initial);
    const defaultLayout=options.layout || {version:2,home:{columns:4,items:[{action:'music',icon:'music',color:'#303338'},{action:'files',icon:'files',color:'#3B4C46'},{action:'apps',icon:'apps',color:'#374959'}]},apps:{columns:3,items:[]}};
    let launcherLayout=structuredClone(defaultLayout), customLayout=false;
    window.__interfacePreferences={};
    window.__launcherRequests=[];let covers=structuredClone(options.covers || {});
    window.__setMockState=value=>Object.assign(state,structuredClone(value));
    window.__setMockLayout=value=>{launcherLayout=structuredClone(value);};
    window.__homeBackgrounds=structuredClone(options.homeBackgrounds || {});window.__homeBackgroundColors=structuredClone(options.homeBackgroundColors || {});
    window.__failedBackgroundComponents=structuredClone(options.failedBackgroundComponents || []);
    const callbacks = new Map(); let nextCallback = 1, downloadCancelled = false, toolsInstalled = !!options.toolsInstalled;
    window.__emitMcp = (event, payload) => { for (const callback of (window.__eventListeners?.[event] || [])) callbacks.get(callback)?.({event, payload, id:callback}); };
    window.__eventListeners = {};
    window.__networkReads=0; window.__requests = []; window.__pickerCalls = 0; window.__xss = false; window.__toolsInstalls = 0; window.__resources = [];
    window.__TAURI_INTERNALS__ = {
      transformCallback: callback => { const id = nextCallback++; callbacks.set(id, callback); return id; },
      unregisterCallback: id => { callbacks.delete(id); },
      invoke: async (command, args = {}) => {
        if (command === 'plugin:event|listen') { (window.__eventListeners[args.event] ||= []).push(args.handler); return args.handler; }
        if (command === 'plugin:event|unlisten') return;
        if(command==='get_local_network'){window.__networkReads++;return structuredClone(options.preflightNetwork || state.localNetwork || {addresses:[],error:null});}
        if(command==='get_interface_preferences')return structuredClone(window.__interfacePreferences);
        if(command==='set_interface_preferences'){Object.assign(window.__interfacePreferences,args.preferences);window.__emitMcp('interface-preferences',structuredClone(window.__interfacePreferences));return structuredClone(window.__interfacePreferences);}
        if (command === 'mcp_info') return {config:{mcpServers:{puretv:{command:'/Applications/pureTV Manager.app/Contents/MacOS/puretv-desktop',args:['--mcp','/Users/test/mcp-session.json']}}},sessionPath:'/Users/test/mcp-session.json'};
        if(command==='get_launcher_covers')return structuredClone(covers);
        if(command==='choose_launcher_cover'){if(args.remove)delete covers[args.key];else covers[args.key]='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII=';return structuredClone(covers);}
        if(command==='choose_launcher_apks')return options.launcherApks || [{path:'/tmp/pureTV.apk',cover:options.thumbnail?'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII=':null}];
        if (command === 'choose_launcher_json') return JSON.stringify({version:2,home:{columns:2,items:[{packageName:'com.ecojust.webtv',icon:'app'}]},apps:{columns:3,items:[]}});
        if (command === 'launcher_execute') {
          window.__launcherRequests.push(structuredClone(args.request));
          if(args.request.action==='getBackgrounds'){
            const backgrounds=structuredClone(window.__homeBackgrounds),backgroundColors=structuredClone(window.__homeBackgroundColors);
            const home=options.layoutSupported?([4,5].includes(launcherLayout.version)?launcherLayout.home.background:launcherLayout.home.scene?.background):null;
            if(home){backgroundColors[state.defaultHome]=home.color;if(home.image)backgrounds[state.defaultHome]=home.image;else delete backgrounds[state.defaultHome];}
            const failedComponents=structuredClone(window.__failedBackgroundComponents);
            for(const component of failedComponents){delete backgrounds[component];delete backgroundColors[component];}
            const result={supported:true,serial:state.device?.serial,userId:state.device?.userId,backgrounds,backgroundColors,failedComponents};
            await new Promise(resolve=>setTimeout(resolve,options.backgroundDelay || 70));return result;
          }
          await new Promise(resolve=>setTimeout(resolve,70));
          if (!options.layoutSupported) return {supported:false,component:state.defaultHome,message:'此启动器尚未接入可验证的布局接口，请使用它自身的设置。'};
          if (args.request.action === 'applyLayout') {launcherLayout=structuredClone(args.request.layout);customLayout=true;}
          if (args.request.action === 'resetLayout') {launcherLayout=structuredClone(defaultLayout);customLayout=false;}
          return {supported:true,serial:state.device?.serial,userId:state.device?.userId,version:launcherLayout.version,systemBasis:[4,5].includes(launcherLayout.version)?{screen:defaultLayout.screen,home:defaultLayout.home.system,apps:defaultLayout.apps.system}:undefined,component:state.defaultHome,custom:customLayout,layout:structuredClone(launcherLayout),apps:options.layoutApps || [...(state.packages.some(p=>p.packageName==='com.imported.app')?[{packageName:'com.imported.app',label:'新安装应用'}]:[]),{packageName:'com.ecojust.webtv',label:'WebTV',iconPng:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZCksAAAAASUVORK5CYII='},{packageName:'com.vendor.home',label:'系统启动器'},{packageName:'com.not.installed',label:'未安装应用'}],message:args.request.action === 'getLayout' ? '布局已读取' : '布局已应用并复查'};
        }
        if (command === 'choose_apks') {
          if (options.apkPaths) return options.apkPaths;
          window.__pickerCalls++;
          return window.__pickerCalls === 1 ? ['C:\\我的安装包\\custom music.apk'] : ['C:\\我的安装包\\custom music.apk','C:\\Downloads\\second.apk'];
        }
        if (command === 'choose_adb') return 'C:\\platform-tools\\adb.exe';
        if (command === 'cancel') { window.__requests.push({action:'cancel'}); downloadCancelled = true; return; }
        if (command === 'open_resource') { window.__resources.push(args.resource); return; }
        if (command === 'platform_tools_info') return {version:'37.0.1',platform:'macos',downloadBytes:16110554,installed:toolsInstalled,supported:!options.unsupportedTools,message:options.unsupportedTools ? '此系统请手动配置 ADB' : ''};
        if (command === 'install_platform_tools') {
          if (args.acceptedLicense !== true) throw new Error('必须先同意 Android SDK 许可协议');
          if (state.device) throw new Error('请先断开电视');
          window.__toolsInstalls++; window.__requests.push({action:'installPlatformTools',acceptedLicense:args.acceptedLicense,...(args.forceDownload?{forceDownload:true}:{})});
          downloadCancelled = false; let index = 0;
          const emit = (stage,downloaded) => callbacks.get(args.onProgress.id)?.({index:index++,message:{stage,downloaded,total:16110554}});
          try {
            emit(toolsInstalled && !args.forceDownload ? 'checking' : 'downloading', 8055277);
            await new Promise(resolve => setTimeout(resolve, options.slowDownload ? 900 : 180));
            if (downloadCancelled) throw new Error('下载已取消，临时文件已清理');
            if (options.failDownloadOnce && window.__toolsInstalls === 1) throw new Error('下载失败，请检查网络后重试');
            emit('verifying',16110554); emit('extracting',16110554); emit('checking',16110554);
            state.adbPath = args.forceDownload?'/Users/test/Library/Application Support/com.ecojust.puretv.manager/tools/platform-tools-37.0.1-fresh-'+window.__toolsInstalls+'/platform-tools/adb':'/Users/test/Library/Application Support/com.ecojust.puretv.manager/tools/platform-tools-37.0.1/platform-tools/adb';
            state.adbAvailable = true; toolsInstalled = true; state.message = 'ADB 已就绪，可以连接电视';
            return structuredClone(state);
          } finally { callbacks.get(args.onProgress.id)?.({index,end:true}); }
        }
        if (command !== 'execute') throw new Error('Unexpected command: '+command);
        const r = args.request;
        if (r.action === 'getState') return structuredClone(state);
        window.__requests.push(structuredClone(r));
        if(r.action==='refreshLocalNetwork'){state.localNetwork=options.localNetworkAfterRefresh || state.localNetwork;state.message='本机局域网地址已刷新';return structuredClone(state);}
        if(r.action==='connect') {state.lastConnection={host:r.host,port:r.port};if(options.connectError){state.device=null;state.message=options.connectError;throw new Error(options.connectError);}}
        if (options.failAction === r.action) throw new Error('电视拒绝了操作，请检查授权');
        if (r.action === 'scan' && options.slowScan) await new Promise(resolve => setTimeout(resolve,600));
        if (options.partialFailure && r.action === 'setEnabled') {
          state.history.unshift({id:'partial',timestamp:1,action:r.action,target:r.packages[0],device:state.device.serial,userId:0,success:false,message:'固件拒绝停用'});
          state.message = '成功 0 项，失败 1 项'; return structuredClone(state);
        }
        if (r.action === 'setEnabled' || r.action === 'uninstall' || r.action === 'restore') {
          for (const name of r.packages) {
            const p = state.packages.find(p => p.packageName === name);
            if (!p || p.protectedReason) throw new Error('受保护');
            if (r.action === 'setEnabled') p.enabled = r.enabled;
            else if (r.action === 'uninstall') p.installed = false;
            else { p.installed = true; p.enabled = true; }
          }
        }
        if (r.action === 'install') {
          state.installResults=r.paths.map((path,index)=>({path,success:!(options.partialInstall && index===1),message:options.partialInstall && index===1?'安装失败':'已安装'}));
          if(options.partialInstall){
            for(const [index,result] of state.installResults.entries())state.history.unshift({id:'install-'+index,timestamp:1,action:'install',target:result.path,device:state.device.serial,userId:0,success:result.success,message:result.message});
            state.message='安装完成：成功 1 项，失败 1 项';return structuredClone(state);
          }
          if(!state.packages.some(p=>p.packageName==='com.imported.app'))state.packages.push({packageName:'com.imported.app',label:'新安装应用',installed:true,enabled:true,system:false,protectedReason:null,apkSizeBytes:1048576});
        }
        if (r.action === 'connect') state.device={serial:`${r.host}:${r.port}`,model:'测试电视',androidVersion:'12',userId:0,status:'device'};
        if (r.action === 'setHome') { state.originalHome ??= state.defaultHome; state.defaultHome = r.component; }
        if (r.action === 'restoreHome') state.defaultHome = state.originalHome;
        if (r.action === 'setHome' || r.action === 'restoreHome') {
          for (const p of state.packages) {
            if (p.protectedReason === '当前默认启动器') p.protectedReason = null;
            if (p.packageName === state.defaultHome?.split('/')[0]) p.protectedReason = '当前默认启动器';
          }
          state.launchers.forEach(l => l.isDefault = l.component === state.defaultHome);
        }
        if (r.action === 'disconnect') { state.device = null; state.packages = []; state.launchers = []; }
        if (r.action === 'clearHistory') state.history = [];
        else state.history.unshift({id: String(Date.now()), timestamp: Math.floor(Date.now()/1000), action:r.action, target:(r.packages||r.paths||[r.component||'电视']).join(', '), device:initial.device?.serial||'',userId:0,success:true,message:'执行后状态已核对'});
        state.message = '操作完成，状态已核对';
        return structuredClone(state);
      },
    };
  }, {initial, options});
}
