#pragma once
#include <string>

namespace puretv {
// Query values are client navigation state, never file paths. Match the exact
// offline origin and entry before accepting the same bounded query grammar as
// the local Mac asset server. Fragments are not entry documents.
inline bool allowsEntryURL(const std::wstring& url) {
    const std::wstring entry=L"https://puretv.local/tv.html";
    if(url==entry)return true;
    if(url.size()<=entry.size()||url.compare(0,entry.size(),entry)!=0||url[entry.size()]!=L'?')return false;
    const auto start=entry.size()+1;
    if(url.size()-start>4096)return false;
    const std::wstring punctuation=L"-._~!$&'()*+,;=:@/?";
    auto hex=[](wchar_t c)->int {if(c>=L'0'&&c<=L'9')return c-L'0';if(c>=L'A'&&c<=L'F')return c-L'A'+10;if(c>=L'a'&&c<=L'f')return c-L'a'+10;return -1;};
    for(auto i=start;i<url.size();++i){
        const auto c=url[i];
        if(c==L'%'){
            if(i+2>=url.size())return false;
            const int high=hex(url[i+1]),low=hex(url[i+2]);
            if(high<0||low<0)return false;
            const int decoded=high*16+low;
            if(decoded<32||decoded==127||decoded==92)return false;
            i+=2;
        }else if(!((c>=L'0'&&c<=L'9')||(c>=L'A'&&c<=L'Z')||(c>=L'a'&&c<=L'z')||punctuation.find(c)!=std::wstring::npos))return false;
    }
    return true;
}
}
