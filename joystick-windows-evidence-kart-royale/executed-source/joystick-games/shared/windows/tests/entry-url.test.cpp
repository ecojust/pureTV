#include "EntryURL.hpp"
#include <iostream>
#include <stdexcept>
#include <vector>
int main(){
 const std::wstring base=L"https://puretv.local/tv.html";
 const std::vector<std::wstring> accepted={base,base+L"?",base+L"?mode=quick&stage=finland&car=rapier&cond=sunset&weather=clear",base+L"?return=menu&value=%2F..%2F&name=%E9%9B%AA",base+L"?"+std::wstring(4096,L'x')};
 const std::vector<std::wstring> rejected={L"http://puretv.local/tv.html",L"https://user@puretv.local/tv.html",L"https://puretv.local:443/tv.html",L"https://puretv.local.evil/tv.html",L"https://puretv.local/other.html",L"https://puretv.local/x/../tv.html",L"https://puretv.local/%74v.html",base+L"/",base+L"#x",base+L"?x=#x",base+L"?x=%",base+L"?x=%0",base+L"?x=%GG",base+L"?x=%00",base+L"?x=%0d%0a",base+L"?x=%7f",base+L"?x=%5c",base+L"?x=\\",base+L"?x=\n",base+L"?x=<tag>",base+L"?x=雪",base+L"?"+std::wstring(4097,L'x')};
 for(const auto& url:accepted)if(!puretv::allowsEntryURL(url))throw std::runtime_error("Valid local entry rejected");
 for(const auto& url:rejected)if(puretv::allowsEntryURL(url))throw std::runtime_error("Unsafe entry accepted");
 std::cout<<accepted.size()+rejected.size()<<" exact local entry/query cases passed\n";
}
