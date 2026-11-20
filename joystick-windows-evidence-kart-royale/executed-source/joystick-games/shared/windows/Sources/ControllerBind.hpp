#pragma once
#include <cstdint>

namespace puretv {
inline constexpr std::uint16_t DefaultControllerPort=63485;
// Winsock error values, kept platform-independent for the policy tests.
inline constexpr int BindAccessDenied=10013, BindAddressInUse=10048;
struct ControllerBindResult {
 bool succeeded=false;
 bool fallbackAttempted=false;
 int defaultError=0;
 int fallbackError=0;
};

// tryBind returns zero on success or the immediate WSAGetLastError() value.
// The preferred argument is testable with an independently reserved socket;
// production always uses DefaultControllerPort and calls this only at startup.
template<class TryBind>
ControllerBindResult bindControllerPort(TryBind tryBind,std::uint16_t preferred=DefaultControllerPort){
 ControllerBindResult result;
 result.defaultError=tryBind(preferred);
 if(!result.defaultError){result.succeeded=true;return result;}
 if(result.defaultError!=BindAccessDenied&&result.defaultError!=BindAddressInUse)return result;
 result.fallbackAttempted=true;
 result.fallbackError=tryBind(0);
 result.succeeded=result.fallbackError==0;
 return result;
}
}
