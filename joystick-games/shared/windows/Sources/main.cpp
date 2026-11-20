#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <windns.h>
#include <iphlpapi.h>
#include <shlobj.h>
#include <shellapi.h>
#include <shlwapi.h>
#include <wrl.h>
#include <WebView2.h>
#include <WebView2EnvironmentOptions.h>
#include <algorithm>
#include <filesystem>
#include <fstream>
#include <functional>
#include <map>
#include <regex>
#include <sstream>
#include <vector>
#include "ControllerProtocol.hpp"
#include "Preferences.hpp"
#include "EntryURL.hpp"
#include "DiagnosticLog.hpp"
#include "ControllerBind.hpp"
using Microsoft::WRL::Callback;
using Microsoft::WRL::ComPtr;
using puretv::Json;
namespace fs=std::filesystem;
static constexpr UINT SocketMessage=WM_APP+1, DiscoveryMessage=WM_APP+2;
static constexpr wchar_t PageURL[]=L"https://puretv.local/tv.html";
static HWND mainWindow=nullptr;
static HANDLE discoveryEvent=nullptr;
static PDNS_SERVICE_INSTANCE registrationInstance=nullptr;
// Only a read-only JSON snapshot is exposed. No storage writer, arbitrary
// property access, evaluation or file operation is available through this COM
// object. Navigation and bootstrap both restrict it to the local main entry.
class BootstrapSnapshot final:public Microsoft::WRL::RuntimeClass<Microsoft::WRL::RuntimeClassFlags<Microsoft::WRL::ClassicCom>,IDispatch> {
public:
 std::function<std::wstring()> snapshot;
 HRESULT STDMETHODCALLTYPE GetTypeInfoCount(UINT* count) override {if(!count)return E_POINTER;*count=0;return S_OK;}
 HRESULT STDMETHODCALLTYPE GetTypeInfo(UINT,LCID,ITypeInfo**) override {return E_NOTIMPL;}
 HRESULT STDMETHODCALLTYPE GetIDsOfNames(REFIID iid,LPOLESTR* names,UINT count,LCID,DISPID* ids) override {
  if(iid!=IID_NULL)return DISP_E_UNKNOWNINTERFACE;if(!names||!ids)return E_POINTER;
  if(count!=1||!names[0]||_wcsicmp(names[0],L"snapshot")!=0)return DISP_E_UNKNOWNNAME;ids[0]=1;return S_OK;
 }
 HRESULT STDMETHODCALLTYPE Invoke(DISPID id,REFIID iid,LCID,WORD flags,DISPPARAMS* args,VARIANT* result,EXCEPINFO*,UINT*) override {
  if(iid!=IID_NULL)return DISP_E_UNKNOWNINTERFACE;
  if(id!=1||flags!=DISPATCH_PROPERTYGET)return DISP_E_MEMBERNOTFOUND;
  if(!args||args->cArgs||args->cNamedArgs)return DISP_E_BADPARAMCOUNT;
  if(!result)return E_POINTER;VariantInit(result);
  try{const auto text=snapshot();result->bstrVal=SysAllocStringLen(text.data(),static_cast<UINT>(text.size()));if(!result->bstrVal)return E_OUTOFMEMORY;result->vt=VT_BSTR;return S_OK;}catch(...){return E_FAIL;}
 }
};
std::wstring wide(const std::string& s) { if(s.empty())return {};int n=MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,s.data(),int(s.size()),nullptr,0);if(!n)throw std::runtime_error("Invalid UTF-8");std::wstring v(n,0);MultiByteToWideChar(CP_UTF8,MB_ERR_INVALID_CHARS,s.data(),int(s.size()),v.data(),n);return v; }
std::string utf8(const std::wstring& s) {int n=WideCharToMultiByte(CP_UTF8,0,s.data(),int(s.size()),nullptr,0,nullptr,nullptr);std::string v(n,0);WideCharToMultiByte(CP_UTF8,0,s.data(),int(s.size()),v.data(),n,nullptr,nullptr);return v;}
std::string read(const fs::path& p,size_t limit=16*1024*1024) {std::ifstream f(p,std::ios::binary);if(!f)throw std::runtime_error("Missing file: "+p.u8string());if(fs::file_size(p)>limit)throw std::runtime_error("File too large");return std::string(std::istreambuf_iterator<char>(f),{});}
void write(const fs::path& p,const std::string& data) {
 fs::create_directories(p.parent_path());auto tmp=p;tmp+=L".tmp";
 {std::ofstream f(tmp,std::ios::binary|std::ios::trunc);f.write(data.data(),data.size());if(!f)throw std::runtime_error("Cannot save file");}
 const ULONGLONG started=GetTickCount64();
 for(;;){
  if(MoveFileExW(tmp.c_str(),p.c_str(),MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH))return;
  const DWORD error=GetLastError();
  // Win32 can temporarily deny replacement even when the reader permits
  // deletion. Retain the complete temporary file and retry only contention;
  // persistent failures must never be reported as a successful save.
  if((error!=ERROR_ACCESS_DENIED&&error!=ERROR_SHARING_VIOLATION&&error!=ERROR_LOCK_VIOLATION)||GetTickCount64()-started>=500)
   throw std::runtime_error("Cannot replace saved file (Windows error "+std::to_string(error)+")");
  Sleep(1);
 }
}
double now(){return GetTickCount64()/1000.0;}
UINT windowDpi(HWND window){UINT dpi=window?GetDpiForWindow(window):GetDpiForSystem();return dpi?dpi:96;}
RECT clientSizeForDpi(int width,int height,DWORD style,DWORD extended,UINT dpi){RECT rect={0,0,MulDiv(width,int(dpi),96),MulDiv(height,int(dpi),96)};if(!AdjustWindowRectExForDpi(&rect,style,FALSE,extended,dpi))throw std::runtime_error("Cannot calculate DPI-aware window size");return rect;}
Json addresses(){ULONG size=16000;std::vector<unsigned char>b(size);auto a=reinterpret_cast<IP_ADAPTER_ADDRESSES*>(b.data());auto result=GetAdaptersAddresses(AF_INET,GAA_FLAG_SKIP_ANYCAST|GAA_FLAG_SKIP_MULTICAST|GAA_FLAG_SKIP_DNS_SERVER,nullptr,a,&size);if(result==ERROR_BUFFER_OVERFLOW){b.resize(size);a=reinterpret_cast<IP_ADAPTER_ADDRESSES*>(b.data());result=GetAdaptersAddresses(AF_INET,GAA_FLAG_SKIP_ANYCAST|GAA_FLAG_SKIP_MULTICAST|GAA_FLAG_SKIP_DNS_SERVER,nullptr,a,&size);}Json values=Json::array();if(result==NO_ERROR)for(auto x=a;x;x=x->Next)if(x->OperStatus==IfOperStatusUp&&x->IfType!=IF_TYPE_SOFTWARE_LOOPBACK)for(auto u=x->FirstUnicastAddress;u;u=u->Next){char text[INET_ADDRSTRLEN]={};inet_ntop(AF_INET,&reinterpret_cast<sockaddr_in*>(u->Address.lpSockaddr)->sin_addr,text,sizeof(text));if(*text)values.push_back(text);}return values;}
void WINAPI discoveryComplete(DWORD status,PVOID,PDNS_SERVICE_INSTANCE instance){if(discoveryEvent)SetEvent(discoveryEvent);if(instance&&instance!=registrationInstance)DnsServiceFreeInstance(instance);if(mainWindow)PostMessageW(mainWindow,DiscoveryMessage,status,0);}
class Application {
public:
 HWND window=nullptr;fs::path root,data,diagnostics;Json metadata,preferences=Json::object();puretv::ControllerProtocol protocol;
 ComPtr<ICoreWebView2Environment> environment;ComPtr<ICoreWebView2Controller> controller;ComPtr<ICoreWebView2> browser;
 ComPtr<BootstrapSnapshot> bootstrapHost;uint64_t documentEpoch=0,bootstrappedEpoch=0,navigationId=0;std::wstring documentURL;
 SOCKET listener=INVALID_SOCKET;unsigned short port=0;bool ready=false,pushing=false,diagnosing=false,capturing=false,closed=false,fullscreen=false;
 int64_t pushedRevision=-1;double pushedAt=0;int defaultPortError=0;std::string lastError,discoveryState="registering";std::wstring serviceName;DNS_SERVICE_REGISTER_REQUEST dnsRequest={};DNS_SERVICE_CANCEL dnsCancel={};bool dnsStarted=false;
 struct Peer {std::string incoming,outgoing;double partialSince=0,writeSince=0,closeSince=0;bool closing=false,sendShutdown=false,receivedEOF=false;};std::map<SOCKET,Peer> peers;
 WINDOWPLACEMENT placement={sizeof(placement)};
 puretv::DiagnosticLog diagnosticLog;bool firstDiagnosticCompleted=false;unsigned diagnosticFailures=0;
 void trace(const char* event,Json detail=Json::object()) noexcept {
  if(diagnostics.empty())return;
  try{diagnosticLog.append(diagnostics/L"startup-events.jsonl",Json{{"event",event},{"detail",detail},{"timestamp",now()},{"processId",GetCurrentProcessId()},{"documentEpoch",documentEpoch},{"ready",ready},{"foreground",GetForegroundWindow()==window},{"minimized",!!IsIconic(window)}}.dump());}catch(...){}
 }
 void initialize(){
  wchar_t module[32768];DWORD count=GetModuleFileNameW(nullptr,module,32768);if(!count||count>=32768)throw std::runtime_error("Invalid executable location");root=fs::path(std::wstring(module,count)).parent_path();metadata=Json::parse(read(root/L"game.json",65536));
  auto package=metadata.at("packageName").get<std::string>();if(!std::regex_match(package,std::regex("[A-Za-z0-9_.-]{1,160}")))throw std::runtime_error("Invalid game package identity");
  PWSTR appData=nullptr;if(FAILED(SHGetKnownFolderPath(FOLDERID_LocalAppData,0,nullptr,&appData)))throw std::runtime_error("Cannot find user data folder");data=fs::path(appData)/L"pureTV"/wide(package);CoTaskMemFree(appData);
  int argc=0;LPWSTR* argv=CommandLineToArgvW(GetCommandLineW(),&argc);for(int i=1;i<argc;++i){if(std::wstring(argv[i])==L"--diagnostics"&&i+1<argc)diagnostics=fs::absolute(argv[++i]);else if(std::wstring(argv[i])==L"--profile"&&i+1<argc)data=fs::absolute(argv[++i]);else throw std::runtime_error("Unknown launch argument");}LocalFree(argv);fs::create_directories(data);if(!diagnostics.empty())fs::create_directories(diagnostics);
  trace("initialize");
  if(fs::exists(data/L"preferences.json")){try{auto saved=Json::parse(read(data/L"preferences.json",puretv::PreferencesByteLimit));for(const auto& key:metadata.at("storageKeys")){std::string k=key.get<std::string>();if(saved.contains(k)&&saved[k].is_string()&&saved[k].get<std::string>().size()<=puretv::PreferenceValueByteLimit)preferences[k]=saved[k];}}catch(...){lastError="Previous preferences file could not be read";trace("preferences_read_failed");}}
  protocol.setInputEnabled(false);SetWindowTextW(window,wide(metadata.at("name").get<std::string>()).c_str());trace("server_start_requested");startServer();trace("server_start_returned",{{"port",port}});startWebView();SetTimer(window,1,16,nullptr);SetTimer(window,2,250,nullptr);if(!diagnostics.empty())SetTimer(window,3,100,nullptr);trace("initialize_returned");
 }
 void fail(const std::string& reason){lastError=reason;ready=false;protocol.setInputEnabled(false);trace("fatal_error_before_dialog");MessageBoxW(window,wide("无法启动游戏 / Cannot open game\n\n"+reason).c_str(),L"pureTV",MB_OK|MB_ICONERROR);DestroyWindow(window);}
 void startServer(){
  listener=socket(AF_INET,SOCK_STREAM,IPPROTO_TCP);if(listener==INVALID_SOCKET)throw std::runtime_error("Cannot create controller socket");BOOL exclusive=TRUE;setsockopt(listener,SOL_SOCKET,SO_EXCLUSIVEADDRUSE,reinterpret_cast<const char*>(&exclusive),sizeof(exclusive));
  sockaddr_in address={};address.sin_family=AF_INET;address.sin_addr.s_addr=htonl(INADDR_ANY);
  const auto binding=puretv::bindControllerPort([&](std::uint16_t requested){address.sin_port=htons(requested);return bind(listener,reinterpret_cast<sockaddr*>(&address),sizeof(address))==SOCKET_ERROR?WSAGetLastError():0;});
  defaultPortError=binding.defaultError;
  if(defaultPortError)trace("controller_default_port_unavailable",{{"reason","default-port-unavailable"},{"defaultPort",puretv::DefaultControllerPort},{"winsockError",defaultPortError},{"fallbackAttempted",binding.fallbackAttempted},{"fallbackError",binding.fallbackError}});
  if(!binding.succeeded)throw std::runtime_error("Cannot bind controller TCP port: "+std::to_string(defaultPortError)+(binding.fallbackAttempted?"; fallback TCP port: "+std::to_string(binding.fallbackError):""));
  int length=sizeof(address);if(getsockname(listener,reinterpret_cast<sockaddr*>(&address),&length)==SOCKET_ERROR)throw std::runtime_error("Cannot read controller TCP port: "+std::to_string(WSAGetLastError()));
  if(length!=sizeof(address)||address.sin_family!=AF_INET||!address.sin_port)throw std::runtime_error("Invalid bound controller TCP endpoint");
  port=ntohs(address.sin_port);if(listen(listener,4)==SOCKET_ERROR||WSAAsyncSelect(listener,window,SocketMessage,FD_ACCEPT)==SOCKET_ERROR)throw std::runtime_error("Cannot listen for controller");
  wchar_t host[256];DWORD chars=256;if(!GetComputerNameExW(ComputerNameDnsHostname,host,&chars))throw std::runtime_error("Cannot read computer hostname");std::wstring hostName=std::wstring(host)+L".local";
  serviceName=wide(metadata.at("name").get<std::string>());for(auto& c:serviceName)if(c==L'.'||c==L'\\')c=L'-';if(serviceName.size()>40)serviceName.resize(40);serviceName+=L"-"+std::to_wstring(GetCurrentProcessId());auto fullName=serviceName+L"._puretv._tcp.local";
  PCWSTR key=L"version",value=L"1";registrationInstance=DnsServiceConstructInstance(fullName.c_str(),hostName.c_str(),nullptr,nullptr,port,0,0,1,&key,&value);if(!registrationInstance){discoveryState="unavailable";lastError="DNS-SD instance unavailable";return;}
  dnsRequest.Version=DNS_QUERY_REQUEST_VERSION1;dnsRequest.pServiceInstance=registrationInstance;dnsRequest.pRegisterCompletionCallback=discoveryComplete;dnsRequest.unicastEnabled=FALSE;
  discoveryEvent=CreateEventW(nullptr,TRUE,FALSE,nullptr);trace("dns_register_requested");DWORD status=DnsServiceRegister(&dnsRequest,&dnsCancel);trace("dns_register_returned",{{"status",status}});dnsStarted=status==DNS_REQUEST_PENDING||status==ERROR_SUCCESS;if(!dnsStarted){discoveryState="unavailable";lastError="DNS-SD registration: "+std::to_string(status);}
 }
 void disconnect(SOCKET s){protocol.disconnect(uint64_t(s));if(peers.erase(s)){WSAAsyncSelect(s,window,0,0);shutdown(s,SD_BOTH);closesocket(s);}}
 void beginClose(SOCKET s){auto i=peers.find(s);if(i==peers.end())return;protocol.disconnect(uint64_t(s));auto& p=i->second;if(!p.closing){p.closing=true;p.closeSince=now();}p.incoming.clear();p.partialSince=0;}
 void flush(SOCKET s){auto i=peers.find(s);if(i==peers.end())return;auto& p=i->second;while(!p.outgoing.empty()){int n=send(s,p.outgoing.data(),int(p.outgoing.size()),0);if(n==SOCKET_ERROR){if(WSAGetLastError()==WSAEWOULDBLOCK)return;disconnect(s);return;}if(n<=0){disconnect(s);return;}p.outgoing.erase(0,n);}p.writeSince=0;
  // Preserve the rejection frame while the official SDK finishes its nine
  // initial syncs. Closing with unread incoming data can reset a Winsock TCP
  // stream and discard controller_busy before the SDK observes it.
  if(p.closing){if(!p.sendShutdown){if(shutdown(s,SD_SEND)==SOCKET_ERROR){disconnect(s);return;}p.sendShutdown=true;}if(p.receivedEOF)disconnect(s);}
 }
 void socketEvent(SOCKET s,LPARAM event){
  if(WSAGETSELECTERROR(event)){if(s==listener){lastError="Controller listener failed";discoveryState="unavailable";}else disconnect(s);return;}
  if(s==listener){if(WSAGETSELECTEVENT(event)==FD_ACCEPT){for(;;){SOCKET client=accept(listener,nullptr,nullptr);if(client==INVALID_SOCKET)break;if(peers.size()>=4||!protocol.add(uint64_t(client),now())){closesocket(client);continue;}BOOL one=TRUE;setsockopt(client,IPPROTO_TCP,TCP_NODELAY,reinterpret_cast<char*>(&one),sizeof(one));peers.emplace(client,Peer{});if(WSAAsyncSelect(client,window,SocketMessage,FD_READ|FD_WRITE|FD_CLOSE)==SOCKET_ERROR)disconnect(client);}}return;}
  if(!peers.count(s))return;
  if(WSAGETSELECTEVENT(event)==FD_WRITE){flush(s);return;}
  if(WSAGETSELECTEVENT(event)==FD_READ){char buffer[4096];int reads=0;for(;reads<16;++reads){int n=recv(s,buffer,sizeof(buffer),0);if(n==SOCKET_ERROR){if(WSAGetLastError()!=WSAEWOULDBLOCK)disconnect(s);break;}if(n==0){beginClose(s);if(peers.count(s)){peers[s].receivedEOF=true;flush(s);}break;}auto& p=peers[s];if(p.closing)continue;if(p.incoming.empty())p.partialSince=now();p.incoming.append(buffer,n);
   while(peers.count(s)){auto& current=peers[s];auto end=current.incoming.find('\n');if(end==std::string::npos)break;if(end>1024){disconnect(s);break;}auto line=current.incoming.substr(0,end);current.incoming.erase(0,end+1);current.partialSince=current.incoming.empty()?0:now();if(!line.empty()&&line.back()=='\r')line.pop_back();auto reply=protocol.receive(line,uint64_t(s),now());if(reply.replaced)disconnect(SOCKET(*reply.replaced));if(current.outgoing.empty())current.writeSince=now();current.outgoing+=reply.object.dump()+"\n";if(reply.close)beginClose(s);if(current.outgoing.size()>8192){disconnect(s);break;}flush(s);if(reply.close)break;}
   if(!peers.count(s))break;if(peers[s].incoming.size()>1024){disconnect(s);break;}
  }if(reads==16&&peers.count(s))PostMessageW(window,SocketMessage,WPARAM(s),WSAMAKESELECTREPLY(FD_READ,0));return;}
  if(WSAGETSELECTEVENT(event)==FD_CLOSE){beginClose(s);peers[s].receivedEOF=true;flush(s);}
 }
 void watchdog(){for(auto id:protocol.expired(now()))disconnect(SOCKET(id));std::vector<SOCKET> dead;for(auto& [s,p]:peers)if((p.partialSince&&now()-p.partialSince>5)||(p.writeSince&&now()-p.writeSince>5)||(p.closing&&now()-p.closeSince>2))dead.push_back(s);for(auto s:dead)disconnect(s);}
 Json info(){Json result={{"platform","windows"},{"language","zh"},{"appVersion",metadata.at("version")},{"url",""},{"qr",""},{"storageKeys",metadata.at("storageKeys")},{"storageMaxBytes",puretv::PreferenceValueByteLimit},{"storageMaxTotalBytes",puretv::PreferencesByteLimit},{"preferences",preferences},{"wifiController",{{"state",discoveryState},{"serviceName",utf8(serviceName)},{"port",port},{"addresses",addresses()},{"inputEnabled",protocol.inputEnabled}}}};if(defaultPortError)result["wifiController"]["portSelection"]={{"reason","default-port-unavailable"},{"defaultPort",puretv::DefaultControllerPort},{"defaultBindError",defaultPortError},{"fallbackPort",port}};if(!lastError.empty())result["wifiController"]["error"]=lastError;return result;}
 void requestSuspend(const char* cause){
  if(!browser)return;
  if(diagnostics.empty()){browser->ExecuteScript(L"window.JoystickDesktop?.suspend();",nullptr);return;}
  const auto requestedEpoch=documentEpoch;const std::string reason=cause;
  // Observe the document on which this asynchronous cancellation actually ran.
  // Never sample/consume controller input or resume the game for diagnostics.
  HRESULT requested=browser->ExecuteScript(L"(()=>{let state;try{state={documentEpoch:window.__puretvDocumentEpoch??null,readyState:document.readyState,hidden:document.hidden,focused:document.hasFocus(),hasPureGame:!!window.PureGame};}catch(_){state={observationFailed:true};}window.JoystickDesktop?.suspend();return state;})()",Callback<ICoreWebView2ExecuteScriptCompletedHandler>([this,requestedEpoch,reason](HRESULT status,LPCWSTR value)->HRESULT{
   Json observed=nullptr;try{if(SUCCEEDED(status)&&value)observed=Json::parse(utf8(value));}catch(...){}
   trace("suspend_script_completed",{{"cause",reason},{"requestedEpoch",requestedEpoch},{"hresult",status},{"observedDocument",observed}});return S_OK;
  }).Get());if(FAILED(requested))trace("suspend_script_request_failed",{{"cause",reason},{"requestedEpoch",requestedEpoch},{"hresult",requested}});
 }
 void foreground(const char* cause){bool active=ready&&!IsIconic(window)&&GetForegroundWindow()==window;const bool previous=protocol.inputEnabled;if(previous!=active||!active)trace("foreground_update",{{"cause",cause},{"previousInputEnabled",previous},{"nextInputEnabled",active},{"suspendRequested",!active&&!!browser}});protocol.setInputEnabled(active);if(!active)requestSuspend(cause);push();}
 void push(){if(!ready||pushing||closed||!browser)return;auto snapshot=protocol.snapshot();int64_t revision=snapshot.at("revision").get<int64_t>();if(revision==pushedRevision&&now()-pushedAt<1)return;pushing=true;pushedRevision=revision;pushedAt=now();auto code=wide("window.JoystickDesktop?.receive("+info().dump()+","+snapshot.dump()+");");HRESULT hr=browser->ExecuteScript(code.c_str(),Callback<ICoreWebView2ExecuteScriptCompletedHandler>([this](HRESULT status,LPCWSTR)->HRESULT{pushing=false;if(FAILED(status))lastError="Web input bridge failed";return S_OK;}).Get());if(FAILED(hr))pushing=false;}
 void resize(){if(controller){RECT r;GetClientRect(window,&r);controller->put_Bounds(r);}}
 std::wstring bootstrapSnapshot(){
  if(closed||!documentEpoch||!puretv::allowsEntryURL(documentURL))throw std::runtime_error("Bootstrap outside local entry");
  auto value=Json{{"info",info()},{"input",protocol.snapshot()},{"documentEpoch",documentEpoch},{"diagnosticsEnabled",!diagnostics.empty()}};
  bootstrappedEpoch=documentEpoch;trace("document_bootstrap_snapshot",{{"inputEnabled",protocol.inputEnabled}});return wide(value.dump());
 }
 void startWebView(){
  trace("webview_runtime_lookup");LPWSTR version=nullptr;HRESULT found=GetAvailableCoreWebView2BrowserVersionString(nullptr,&version);trace("webview_runtime_found",{{"hresult",found},{"version",version?utf8(version):""}});CoTaskMemFree(version);if(FAILED(found)){if(MessageBoxW(window,L"需要 Microsoft Edge WebView2 Runtime 才能运行游戏。是否打开微软官方下载页面？\n\nMicrosoft Edge WebView2 Runtime is required. Open the official download page?",L"pureTV",MB_YESNO|MB_ICONINFORMATION)==IDYES)ShellExecuteW(window,L"open",L"https://developer.microsoft.com/microsoft-edge/webview2/",nullptr,nullptr,SW_SHOWNORMAL);DestroyWindow(window);return;}
  auto options=Microsoft::WRL::Make<CoreWebView2EnvironmentOptions>();options->put_AdditionalBrowserArguments(L"--autoplay-policy=no-user-gesture-required");
  trace("webview_environment_requested");
  HRESULT hr=CreateCoreWebView2EnvironmentWithOptions(nullptr,(data/L"WebView2").c_str(),options.Get(),Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>([this](HRESULT status,ICoreWebView2Environment* value)->HRESULT{
   trace("webview_environment_callback",{{"hresult",status},{"hasEnvironment",value!=nullptr}});if(closed)return S_OK;if(FAILED(status)||!value){fail("Cannot initialize WebView2");return S_OK;}environment=value;
   trace("webview_controller_requested");HRESULT requested=environment->CreateCoreWebView2Controller(window,Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>([this](HRESULT result,ICoreWebView2Controller* value)->HRESULT{
    trace("webview_controller_callback",{{"hresult",result},{"hasController",value!=nullptr}});if(closed)return S_OK;if(FAILED(result)||!value){fail("Cannot create game view");return S_OK;}controller=value;
    HRESULT acquired=controller->get_CoreWebView2(&browser);trace("webview_acquired",{{"hresult",acquired},{"hasBrowser",!!browser}});resize();configureWebView();return S_OK;
   }).Get());trace("webview_controller_request_returned",{{"hresult",requested}});return S_OK;
  }).Get());trace("webview_environment_request_returned",{{"hresult",hr}});if(FAILED(hr))throw std::runtime_error("Cannot start WebView2 environment");
 }
 void configureWebView(){
  trace("webview_configure");ComPtr<ICoreWebView2_3> mapping;if(FAILED(browser.As(&mapping))){fail("Please update Microsoft Edge WebView2 Runtime");return;}HRESULT mapped=mapping->SetVirtualHostNameToFolderMapping(L"puretv.local",(root/L"Web").c_str(),COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND_DENY_CORS);trace("webview_local_mapping",{{"hresult",mapped}});
  ComPtr<ICoreWebView2Settings> settings;HRESULT configured=browser->get_Settings(&settings);trace("webview_settings_acquired",{{"hresult",configured},{"hasSettings",!!settings}});settings->put_AreDevToolsEnabled(FALSE);settings->put_AreDefaultContextMenusEnabled(FALSE);settings->put_IsStatusBarEnabled(FALSE);settings->put_IsZoomControlEnabled(FALSE);
  EventRegistrationToken token={};controller->add_AcceleratorKeyPressed(Callback<ICoreWebView2AcceleratorKeyPressedEventHandler>([this](ICoreWebView2Controller*,ICoreWebView2AcceleratorKeyPressedEventArgs* args)->HRESULT{UINT key=0;COREWEBVIEW2_KEY_EVENT_KIND kind;args->get_VirtualKey(&key);args->get_KeyEventKind(&kind);if(key==VK_F11&&kind==COREWEBVIEW2_KEY_EVENT_KIND_KEY_DOWN){COREWEBVIEW2_PHYSICAL_KEY_STATUS status={};args->get_PhysicalKeyStatus(&status);if(!status.WasKeyDown)toggleFullscreen();args->put_Handled(TRUE);}return S_OK;}).Get(),&token);browser->add_NavigationStarting(Callback<ICoreWebView2NavigationStartingEventHandler>([this](ICoreWebView2*,ICoreWebView2NavigationStartingEventArgs* args)->HRESULT{LPWSTR uri=nullptr;args->get_Uri(&uri);std::wstring target=uri?uri:L"";CoTaskMemFree(uri);if(!puretv::allowsEntryURL(target)){args->put_Cancel(TRUE);return S_OK;}if(documentEpoch>=9007199254740991ULL){args->put_Cancel(TRUE);fail("Document epoch exhausted");return S_OK;}UINT64 id=0;if(FAILED(args->get_NavigationId(&id))){args->put_Cancel(TRUE);fail("Cannot identify game navigation");return S_OK;}navigationId=id;documentURL=target;++documentEpoch;ready=false;pushedRevision=-1;trace("navigation_start",{{"navigationId",navigationId},{"previousInputEnabled",protocol.inputEnabled}});protocol.setInputEnabled(false);return S_OK;}).Get(),&token);
  browser->add_NewWindowRequested(Callback<ICoreWebView2NewWindowRequestedEventHandler>([](ICoreWebView2*,ICoreWebView2NewWindowRequestedEventArgs* args)->HRESULT{args->put_Handled(TRUE);return S_OK;}).Get(),&token);
  browser->add_PermissionRequested(Callback<ICoreWebView2PermissionRequestedEventHandler>([](ICoreWebView2*,ICoreWebView2PermissionRequestedEventArgs* args)->HRESULT{args->put_State(COREWEBVIEW2_PERMISSION_STATE_DENY);return S_OK;}).Get(),&token);
  browser->add_ProcessFailed(Callback<ICoreWebView2ProcessFailedEventHandler>([this](ICoreWebView2*,ICoreWebView2ProcessFailedEventArgs* args)->HRESULT{COREWEBVIEW2_PROCESS_FAILED_KIND kind={};HRESULT result=args->get_ProcessFailedKind(&kind);trace("webview_process_failed",{{"kind",static_cast<int>(kind)},{"hresult",result}});ready=false;protocol.setInputEnabled(false);lastError="The game rendering process stopped. Close and reopen the game.";SetWindowTextW(window,wide(lastError).c_str());return S_OK;}).Get(),&token);
  browser->add_NavigationCompleted(Callback<ICoreWebView2NavigationCompletedEventHandler>([this](ICoreWebView2*,ICoreWebView2NavigationCompletedEventArgs* args)->HRESULT{UINT64 id=0;args->get_NavigationId(&id);if(id!=navigationId)return S_OK;BOOL ok=FALSE;args->get_IsSuccess(&ok);trace("navigation_completed",{{"navigationId",id},{"success",!!ok}});if(!ok){COREWEBVIEW2_WEB_ERROR_STATUS error;args->get_WebErrorStatus(&error);if(error==COREWEBVIEW2_WEB_ERROR_STATUS_OPERATION_CANCELED)return S_OK;fail("Game page could not be loaded");return S_OK;}if(bootstrappedEpoch!=documentEpoch){fail("Game document bootstrap did not complete");return S_OK;}ready=true;trace("navigation_ready");foreground("navigation_completed");return S_OK;}).Get(),&token);
  browser->add_WebMessageReceived(Callback<ICoreWebView2WebMessageReceivedEventHandler>([this](ICoreWebView2*,ICoreWebView2WebMessageReceivedEventArgs* args)->HRESULT{LPWSTR source=nullptr;args->get_Source(&source);bool valid=source&&puretv::allowsEntryURL(source);CoTaskMemFree(source);if(!valid)return S_OK;LPWSTR raw=nullptr;args->get_WebMessageAsJson(&raw);try{auto text=raw?utf8(raw):"";if(text.size()<=puretv::PreferenceMessageByteLimit){auto message=Json::parse(text);auto type=message.value("type","");if(type=="exit")PostMessageW(window,WM_CLOSE,0,0);else if(type=="preference"){std::string key=message.value("key","");auto keys=metadata.at("storageKeys");if(std::find(keys.begin(),keys.end(),key)!=keys.end()&&message.contains("value")){auto next=preferences;auto v=message["value"];if(v.is_null())next.erase(key);else if(v.is_string()&&v.get<std::string>().size()<=puretv::PreferenceValueByteLimit)next[key]=v;else throw std::runtime_error("Invalid preference");auto encoded=puretv::serializePreferences(next);write(data/L"preferences.json",encoded);preferences=std::move(next);}}}}catch(const std::exception& e){lastError=e.what();}CoTaskMemFree(raw);return S_OK;}).Get(),&token);
  browser->AddWebResourceRequestedFilter(L"*",COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL);browser->add_WebResourceRequested(Callback<ICoreWebView2WebResourceRequestedEventHandler>([this](ICoreWebView2*,ICoreWebView2WebResourceRequestedEventArgs* args)->HRESULT{ComPtr<ICoreWebView2WebResourceRequest> request;args->get_Request(&request);LPWSTR uri=nullptr;request->get_Uri(&uri);std::wstring url=uri?uri:L"";CoTaskMemFree(uri);if(url.rfind(L"https://puretv.local/",0)!=0&&url.rfind(L"data:",0)!=0&&url.rfind(L"blob:https://puretv.local/",0)!=0){ComPtr<ICoreWebView2WebResourceResponse> response;environment->CreateWebResourceResponse(nullptr,403,L"Offline game assets only",L"Content-Type: text/plain",&response);args->put_Response(response.Get());}return S_OK;}).Get(),&token);
  bootstrapHost=Microsoft::WRL::Make<BootstrapSnapshot>();bootstrapHost->snapshot=[this](){return bootstrapSnapshot();};
  VARIANT host={};host.vt=VT_DISPATCH;host.pdispVal=bootstrapHost.Get();
  HRESULT hostAdded=browser->AddHostObjectToScript(L"puretvBootstrap",&host);trace("webview_bootstrap_host_added",{{"hresult",hostAdded}});if(FAILED(hostAdded)){fail("Cannot install read-only document bootstrap");return;}
  const auto bootstrap=read(root/L"Web"/L"bridge.js")+"\n"+read(root/L"Web"/L"bootstrap.js");
  trace("webview_bootstrap_script_requested");HRESULT added=browser->AddScriptToExecuteOnDocumentCreated(wide(bootstrap).c_str(),Callback<ICoreWebView2AddScriptToExecuteOnDocumentCreatedCompletedHandler>([this](HRESULT status,LPCWSTR)->HRESULT{trace("webview_bootstrap_script_callback",{{"hresult",status}});if(FAILED(status)){fail("Cannot install input bridge");return S_OK;}
   // Focus the controller before game scripts register their blur handlers.
   // Query navigation and reload keep the same WebView2 controller.
   if(GetForegroundWindow()==window&&!IsIconic(window))controller->MoveFocus(COREWEBVIEW2_MOVE_FOCUS_REASON_PROGRAMMATIC);
   HRESULT navigated=browser->Navigate(PageURL);trace("webview_navigation_requested",{{"hresult",navigated}});return S_OK;}).Get());trace("webview_bootstrap_script_request_returned",{{"hresult",added}});
 }
 void diagnose(){if(diagnostics.empty()||!browser||diagnosing||closed)return;diagnosing=true;
  const auto epoch=documentEpoch;const auto script=wide(read(root/L"Web"/L"diagnostics.js"));
  HRESULT requested=browser->ExecuteScript(script.c_str(),Callback<ICoreWebView2ExecuteScriptCompletedHandler>([this,epoch](HRESULT status,LPCWSTR value)->HRESULT{diagnosing=false;if(epoch!=documentEpoch)return S_OK;try{if(FAILED(status)&&diagnosticFailures++<8)trace("diagnostic_script_callback_failed",{{"hresult",status}});Json state=SUCCEEDED(status)&&value?Json::parse(utf8(value)):Json::object();if(!state.is_object())state=Json::object();state["documentEpoch"]=epoch;state["ready"]=ready;state["active"]=GetForegroundWindow()==window&&!IsIconic(window);state["timestamp"]=now();state["server"]=info();state["input"]=protocol.snapshot();state["processArchitecture"]="x86_64";state["windowDpi"]=windowDpi(window);RECT pixels;GetClientRect(window,&pixels);state["clientPixels"]={{"width",pixels.right-pixels.left},{"height",pixels.bottom-pixels.top}};state["lastJavaScriptError"]=lastError;write(diagnostics/L"state.json",state.dump());if(!firstDiagnosticCompleted){firstDiagnosticCompleted=true;trace("first_diagnostic_written");}}catch(const Json::exception& error){if(diagnosticFailures++<8)trace("diagnostic_write_failed",{{"category","json"},{"jsonExceptionId",error.id}});}catch(const std::exception&){if(diagnosticFailures++<8)trace("diagnostic_write_failed",{{"category","standard_exception"}});}catch(...){if(diagnosticFailures++<8)trace("diagnostic_write_failed",{{"category","unknown_exception"}});}capture();return S_OK;}).Get());
  if(FAILED(requested)&&diagnosticFailures++<8)trace("diagnostic_script_request_failed",{{"hresult",requested}});
 }
 void capture(){auto request=diagnostics/L"screenshot-request.txt";if(capturing||!ready||!fs::exists(request))return;try{std::string name=read(request,100);fs::remove(request);while(!name.empty()&&(name.back()=='\r'||name.back()=='\n'))name.pop_back();if(!std::regex_match(name,std::regex("[A-Za-z0-9][A-Za-z0-9_-]{0,70}\\.png")))return;ComPtr<IStream> stream;if(FAILED(SHCreateStreamOnFileEx((diagnostics/wide(name)).c_str(),STGM_CREATE|STGM_WRITE|STGM_SHARE_EXCLUSIVE,FILE_ATTRIBUTE_NORMAL,TRUE,nullptr,&stream)))return;capturing=true;browser->CapturePreview(COREWEBVIEW2_CAPTURE_PREVIEW_IMAGE_FORMAT_PNG,stream.Get(),Callback<ICoreWebView2CapturePreviewCompletedHandler>([this,stream](HRESULT)->HRESULT{stream->Commit(STGC_DEFAULT);capturing=false;return S_OK;}).Get());}catch(...) {capturing=false;}}
 void toggleFullscreen(){if(!fullscreen){GetWindowPlacement(window,&placement);SetWindowLongPtrW(window,GWL_STYLE,WS_POPUP|WS_VISIBLE);MONITORINFO mi={sizeof(mi)};GetMonitorInfoW(MonitorFromWindow(window,MONITOR_DEFAULTTONEAREST),&mi);SetWindowPos(window,HWND_TOP,mi.rcMonitor.left,mi.rcMonitor.top,mi.rcMonitor.right-mi.rcMonitor.left,mi.rcMonitor.bottom-mi.rcMonitor.top,SWP_FRAMECHANGED);}else{SetWindowLongPtrW(window,GWL_STYLE,WS_OVERLAPPEDWINDOW|WS_VISIBLE);SetWindowPlacement(window,&placement);SetWindowPos(window,nullptr,0,0,0,0,SWP_NOMOVE|SWP_NOSIZE|SWP_NOZORDER|SWP_FRAMECHANGED);}fullscreen=!fullscreen;resize();}
 void close(){if(closed)return;trace("close");closed=true;ready=false;for(int i=1;i<=3;i++)KillTimer(window,i);protocol.stop();for(auto& [s,p]:peers){shutdown(s,SD_BOTH);closesocket(s);}peers.clear();if(listener!=INVALID_SOCKET)closesocket(listener);listener=INVALID_SOCKET;if(dnsStarted){if(discoveryEvent)ResetEvent(discoveryEvent);DWORD result=DnsServiceDeRegister(&dnsRequest,nullptr);if(result==DNS_REQUEST_PENDING&&discoveryEvent)WaitForSingleObject(discoveryEvent,2000);}if(controller)controller->Close();browser.Reset();controller.Reset();environment.Reset();bootstrapHost.Reset();}
};
static Application app;
LRESULT CALLBACK windowProc(HWND window,UINT message,WPARAM w,LPARAM l){try{switch(message){case WM_CREATE:app.window=window;mainWindow=window;return 0;case WM_SIZE:app.resize();app.foreground("window_size");return 0;case WM_ACTIVATE:app.foreground("window_activate");return 0;case WM_POWERBROADCAST:if(w==PBT_APMSUSPEND){app.trace("power_suspend");app.protocol.setInputEnabled(false);app.requestSuspend("power_suspend");}else if(w==PBT_APMRESUMEAUTOMATIC)app.foreground("power_resume");return TRUE;case WM_KEYDOWN:if(w==VK_F11){app.toggleFullscreen();return 0;}break;case SocketMessage:app.socketEvent(SOCKET(w),l);return 0;case DiscoveryMessage:app.discoveryState=w==ERROR_SUCCESS?"available":"unavailable";if(w)app.lastError="DNS-SD: "+std::to_string(w);app.push();return 0;case WM_TIMER:if(w==1)app.push();else if(w==2)app.watchdog();else if(w==3)app.diagnose();return 0;case WM_DPICHANGED:{auto* bounds=reinterpret_cast<RECT*>(l);SetWindowPos(window,nullptr,bounds->left,bounds->top,bounds->right-bounds->left,bounds->bottom-bounds->top,SWP_NOACTIVATE|SWP_NOZORDER);app.resize();return 0;}case WM_GETMINMAXINFO:{auto* size=reinterpret_cast<MINMAXINFO*>(l);RECT rect=clientSizeForDpi(960,540,DWORD(GetWindowLongPtrW(window,GWL_STYLE)),DWORD(GetWindowLongPtrW(window,GWL_EXSTYLE)),windowDpi(window));size->ptMinTrackSize={rect.right-rect.left,rect.bottom-rect.top};return 0;}case WM_DESTROY:app.close();mainWindow=nullptr;PostQuitMessage(0);return 0;}}catch(const std::exception& e){app.fail(e.what());}return DefWindowProcW(window,message,w,l);}
int WINAPI wWinMain(HINSTANCE instance,HINSTANCE,LPWSTR,int show){
 if(FAILED(CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED)))return 1;
 WSADATA winsock={};if(WSAStartup(MAKEWORD(2,2),&winsock)!=0){CoUninitialize();return 1;}
 int result=0;
 try{
  WNDCLASSW cls={};cls.lpfnWndProc=windowProc;cls.hInstance=instance;cls.lpszClassName=L"PureTVGameWindow";cls.hCursor=LoadCursorW(nullptr,IDC_ARROW);cls.hIcon=LoadIconW(nullptr,IDI_APPLICATION);
  if(!RegisterClassW(&cls))throw std::runtime_error("Cannot register game window");
  RECT initial=clientSizeForDpi(1280,720,WS_OVERLAPPEDWINDOW,0,windowDpi(nullptr));
  HWND window=CreateWindowExW(0,cls.lpszClassName,L"pureTV",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,initial.right-initial.left,initial.bottom-initial.top,nullptr,nullptr,instance,nullptr);
  if(!window)throw std::runtime_error("Cannot create game window");
  ShowWindow(window,show);app.initialize();MSG message={};
  while(GetMessageW(&message,nullptr,0,0)>0){TranslateMessage(&message);DispatchMessageW(&message);}
  result=int(message.wParam);
 }catch(const std::exception& e){app.fail(e.what());result=1;}
 WSACleanup();CoUninitialize();return result;
}
