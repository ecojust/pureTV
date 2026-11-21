#pragma once
#include <filesystem>
#include <fstream>
#include <string>

namespace puretv {
// Optional evidence only: errors and limits never alter the application flow.
// The caller supplies JSON escaped fields, not environment or command-line data.
class DiagnosticLog {
public:
 static constexpr size_t MaxEntries=256,MaxLineBytes=8192,MaxFileBytes=1048576;
 size_t entries=0;
 bool append(const std::filesystem::path& path,const std::string& line) noexcept {
  try {
   if(path.empty()||entries>=MaxEntries||line.size()>MaxLineBytes||line.find_first_of("\r\n")!=std::string::npos)return false;
   const auto old=std::filesystem::exists(path)?std::filesystem::file_size(path):0;
   if(old>MaxFileBytes||line.size()+1>MaxFileBytes-old)return false;
   std::ofstream stream(path,std::ios::binary|std::ios::app);
   stream.write(line.data(),static_cast<std::streamsize>(line.size()));stream.put('\n');stream.flush();
   if(!stream)return false;
   ++entries;return true;
  }catch(...){return false;}
 }
};
}
