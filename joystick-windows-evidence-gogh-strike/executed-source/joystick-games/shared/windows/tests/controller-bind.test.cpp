#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#endif
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>
#include "ControllerBind.hpp"

static void require(bool condition,const char* message){if(!condition)throw std::runtime_error(message);}
static void policy(){
 const auto run=[](const std::vector<int>& errors,const std::vector<std::uint16_t>& expected,bool success,bool fallback){
  std::vector<std::uint16_t> calls;
  const auto result=puretv::bindControllerPort([&](std::uint16_t port){calls.push_back(port);require(calls.size()<=errors.size(),"Unexpected extra bind attempt");return errors[calls.size()-1];});
  require(calls==expected,"Wrong port order or retry count");require(result.succeeded==success&&result.fallbackAttempted==fallback,"Wrong bind result");
  require(result.defaultError==errors[0],"First error was not preserved");require(result.fallbackError==(fallback?errors[1]:0),"Fallback error was not preserved");
 };
 run({0},{63485},true,false);
 run({10013,0},{63485,0},true,true);
 run({10048,0},{63485,0},true,true);
 run({10013,10013},{63485,0},false,true);
 run({10048,10022},{63485,0},false,true);
 run({10022},{63485},false,false);
 run({10038},{63485},false,false);
 std::cout<<"synthetic-policy-cases=7 passed; default=63485; fallback-at-most-once\n";
}

#ifdef _WIN32
struct Wsa {
 Wsa(){WSADATA data{};require(WSAStartup(MAKEWORD(2,2),&data)==0,"WSAStartup failed");}
 ~Wsa(){WSACleanup();}
};
struct Socket {
 SOCKET value=INVALID_SOCKET;
 Socket(){value=socket(AF_INET,SOCK_STREAM,IPPROTO_TCP);require(value!=INVALID_SOCKET,"socket failed");}
 ~Socket(){if(value!=INVALID_SOCKET)closesocket(value);}
 Socket(const Socket&)=delete;Socket& operator=(const Socket&)=delete;
 void exclusive(){BOOL on=TRUE;require(setsockopt(value,SOL_SOCKET,SO_EXCLUSIVEADDRUSE,reinterpret_cast<const char*>(&on),sizeof(on))==0,"SO_EXCLUSIVEADDRUSE failed");}
 int bindPort(std::uint16_t port,std::uint32_t interfaceAddress=INADDR_ANY){sockaddr_in address{};address.sin_family=AF_INET;address.sin_addr.s_addr=htonl(interfaceAddress);address.sin_port=htons(port);return bind(value,reinterpret_cast<sockaddr*>(&address),sizeof(address))==SOCKET_ERROR?WSAGetLastError():0;}
 std::uint16_t port(){sockaddr_in address{};int size=sizeof(address);require(getsockname(value,reinterpret_cast<sockaddr*>(&address),&size)==0,"getsockname failed");return ntohs(address.sin_port);}
};
static void ready(SOCKET socket,bool read){
 fd_set set;FD_ZERO(&set);FD_SET(socket,&set);timeval limit{2,0};
 require(select(0,read?&set:nullptr,read?nullptr:&set,nullptr,&limit)==1,"Timed out waiting for local socket");
}
static void nativeBoundSocket(bool listening,bool specific){
 Socket blocker;blocker.exclusive();require(blocker.bindPort(0)==0,"Cannot create isolated exclusive port fixture");
 const auto occupied=blocker.port();require(occupied>0,"Fixture port not assigned");
 if(listening)require(listen(blocker.value,4)==0,"Fixture listen failed");
 BOOL accepting=FALSE;int optionSize=sizeof(accepting);require(getsockopt(blocker.value,SOL_SOCKET,SO_ACCEPTCONN,reinterpret_cast<char*>(&accepting),&optionSize)==0,"Cannot inspect fixture listening state");
 require(!!accepting==listening,"Fixture listening state differs from requested mode");
 Socket server;server.exclusive();std::vector<std::uint16_t> attempts;
 // The documented same-user Windows matrix distinguishes wildcard/wildcard
 // (WSAEADDRINUSE) from wildcard/specific (WSAEACCES), even when both sockets
 // use SO_EXCLUSIVEADDRUSE. Keep the production-like wildcard cases and use
 // loopback as the specific interface to exercise the exact 10013 path.
 const auto interfaceAddress=specific?INADDR_LOOPBACK:INADDR_ANY;
 const auto result=puretv::bindControllerPort([&](std::uint16_t requested){attempts.push_back(requested);return server.bindPort(requested,interfaceAddress);},occupied);
 const int expectedError=specific?WSAEACCES:WSAEADDRINUSE;
 std::cout<<"actual-windows-observation blocker=exclusive-wildcard accepting="<<!!accepting<<" candidate="<<(specific?"exclusive-loopback":"exclusive-wildcard")<<" preferred="<<occupied<<" firstError="<<result.defaultError<<" fallbackError="<<result.fallbackError<<" succeeded="<<result.succeeded<<" fallbackAttempted="<<result.fallbackAttempted<<" bindAttempts="<<attempts.size()<<std::endl;
 const auto chosen=result.succeeded?server.port():0;
 std::cout<<"actual-windows-endpoint fallback="<<chosen<<" expectedFirstError="<<expectedError<<std::endl;
 require(result.succeeded&&result.fallbackAttempted&&result.defaultError==expectedError&&result.fallbackError==0,"Actual exclusive port did not exercise its exact expected fallback error");
 require(attempts==std::vector<std::uint16_t>{occupied,0},"Actual fallback did not bind exactly twice");
 require(chosen>0&&chosen!=occupied,"Fallback port is not an independently assigned endpoint");
 require(listen(server.value,4)==0,"Fallback server cannot listen");
 for(int i=0;i<3;++i){
  Socket client;sockaddr_in address{};address.sin_family=AF_INET;address.sin_addr.s_addr=htonl(INADDR_LOOPBACK);address.sin_port=htons(chosen);
  u_long nonblocking=1;require(ioctlsocket(client.value,FIONBIO,&nonblocking)==0,"Cannot bound connect wait");
  const int connected=connect(client.value,reinterpret_cast<sockaddr*>(&address),sizeof(address));
  if(connected==SOCKET_ERROR){require(WSAGetLastError()==WSAEWOULDBLOCK,"Local connect failed");ready(client.value,false);int error=0,size=sizeof(error);require(getsockopt(client.value,SOL_SOCKET,SO_ERROR,reinterpret_cast<char*>(&error),&size)==0&&error==0,"Asynchronous local connect failed");}
  ready(server.value,true);const SOCKET peer=accept(server.value,nullptr,nullptr);require(peer!=INVALID_SOCKET,"Fallback accept failed");
  closesocket(peer);require(server.port()==chosen,"Connection changed the listener port");
 }
 require(attempts.size()==2,"Connections caused a new bind attempt");
 std::cout<<"actual-windows-case="<<(listening?"exclusive-listening":"exclusive-bound-not-listening")<<" candidate="<<(specific?"exclusive-loopback":"exclusive-wildcard")<<" preferred="<<occupied<<" firstError="<<result.defaultError<<" fallback="<<chosen<<" bindAttempts="<<attempts.size()<<" stableConnections=3 passed\n";
}
static void nativeOtherError(){
 int attempts=0;
  const auto result=puretv::bindControllerPort([&](std::uint16_t port){++attempts;sockaddr_in address{};address.sin_family=AF_INET;address.sin_port=htons(port);const int status=bind(INVALID_SOCKET,reinterpret_cast<sockaddr*>(&address),sizeof(address));const int error=status==SOCKET_ERROR?WSAGetLastError():0;require(status==SOCKET_ERROR,"Invalid socket unexpectedly bound");return error;});
 std::cout<<"actual-windows-observation invalid-socket firstError="<<result.defaultError<<" fallbackError="<<result.fallbackError<<" succeeded="<<result.succeeded<<" fallbackAttempted="<<result.fallbackAttempted<<" bindAttempts="<<attempts<<std::endl;
 require(attempts==1&&!result.succeeded&&!result.fallbackAttempted&&result.defaultError==WSAENOTSOCK,"Other actual bind error was retried or hidden");
 std::cout<<"actual-windows-case=invalid-socket firstError="<<result.defaultError<<" bindAttempts=1 fatal-preserved passed\n";
}
#endif
int main(){
 try{
  policy();
#ifdef _WIN32
  Wsa wsa;nativeBoundSocket(false,false);nativeBoundSocket(true,false);nativeBoundSocket(false,true);nativeBoundSocket(true,true);nativeOtherError();
#else
  std::cout<<"actual-windows-cases=NOT-RUN (non-Windows platform); policy result is not native validation\n";
#endif
  return 0;
 }catch(const std::exception& error){std::cerr<<"controller-bind-test failed: "<<error.what()<<'\n';return 1;}
}
