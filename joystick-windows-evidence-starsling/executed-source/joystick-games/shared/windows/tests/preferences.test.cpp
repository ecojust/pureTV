#include "../Sources/Preferences.hpp"
#include <iostream>
#include <stdexcept>
int main(){
 using nlohmann::json;
 try {
  json original={{"key","value"}};
  if(puretv::serializePreferences(original,original.dump().size())!=original.dump())throw std::runtime_error("Exact serialized boundary rejected");
  json escaped={{"key",std::string(30,'\n')}};auto snapshot=escaped;
  bool rejected=false;try{puretv::serializePreferences(escaped,40);}catch(const std::runtime_error&){rejected=true;}
  if(!rejected||escaped!=snapshot)throw std::runtime_error("Escaped-byte budget not enforced without mutation");
  json unicode={{"key",std::string("\xe8\xbd\xa6")}};rejected=false;try{puretv::serializePreferences(unicode,unicode.dump().size()-1);}catch(const std::runtime_error&){rejected=true;}
  if(!rejected)throw std::runtime_error("UTF-8 byte boundary ignored");
  rejected=false;try{puretv::serializePreferences(json::array());}catch(const std::runtime_error&){rejected=true;}
  if(!rejected)throw std::runtime_error("Non-object store accepted");
  json maximalMessage={{"type","preference"},{"key",std::string(128,'k')},{"value",std::string(puretv::PreferenceValueByteLimit,'\1')}};
  if(maximalMessage.dump().size()>puretv::PreferenceMessageByteLimit)throw std::runtime_error("Valid escaped 1 MiB value exceeds bridge envelope");
  std::cout<<"5 serialized native preference boundary groups passed\n";return 0;
 }catch(const std::exception& e){std::cerr<<e.what()<<'\n';return 1;}
}
