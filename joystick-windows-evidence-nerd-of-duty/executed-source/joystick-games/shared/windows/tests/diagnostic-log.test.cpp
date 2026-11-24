#include "../Sources/DiagnosticLog.hpp"
#include <chrono>
#include <iostream>
#include <stdexcept>
namespace fs=std::filesystem;
void require(bool value,const char* reason){if(!value)throw std::runtime_error(reason);}
std::string read(const fs::path& path){std::ifstream stream(path,std::ios::binary);return {std::istreambuf_iterator<char>(stream),{}};}
int main(){
 const auto dir=fs::temp_directory_path()/fs::path("puretv-diagnostic-test-"+std::to_string(std::chrono::steady_clock::now().time_since_epoch().count()));
 try {
  fs::create_directory(dir);puretv::DiagnosticLog log;const auto file=dir/"events.jsonl";
  require(!log.append({},"{}")&&!fs::exists(file),"Disabled diagnostics wrote a file");
  require(log.append(file,"{\"phase\":\"first\"}")&&log.append(file,"{\"phase\":\"second\"}"),"Append failed");
  require(read(file)=="{\"phase\":\"first\"}\n{\"phase\":\"second\"}\n","Original event bytes changed");
  auto bytes=read(file);require(!log.append(file,"{}\n{}")&&!log.append(file,"\r")&&read(file)==bytes,"Multiline event accepted");
  require(!log.append(file,std::string(log.MaxLineBytes+1,'x'))&&read(file)==bytes,"Oversized event accepted");
  require(log.append(file,std::string(log.MaxLineBytes,'x')),"Exact line boundary rejected");
  while(log.entries<log.MaxEntries)require(log.append(file,"{}"),"Entry boundary reached early");
  bytes=read(file);require(!log.append(file,"{}")&&read(file)==bytes,"Entry limit changed evidence");
  const auto full=dir/"full.jsonl";{std::ofstream stream(full,std::ios::binary);stream<<std::string(log.MaxFileBytes-3,'x');}
  puretv::DiagnosticLog next;require(next.append(full,"{}")&&fs::file_size(full)==log.MaxFileBytes,"Exact file boundary rejected");
  require(!next.append(full,"{}")&&fs::file_size(full)==log.MaxFileBytes,"File byte limit exceeded");
  require(!next.append(dir,"{}")&&!next.append(dir/"missing"/"events.jsonl","{}"),"I/O error escaped or falsely succeeded");
  fs::remove_all(dir);std::cout<<"8 bounded diagnostic log groups passed (portable C++, not Win32 startup)\n";return 0;
 }catch(const std::exception& error){fs::remove_all(dir);std::cerr<<error.what()<<'\n';return 1;}
}
