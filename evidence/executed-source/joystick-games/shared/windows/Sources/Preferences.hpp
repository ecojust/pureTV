#pragma once
#include "json.hpp"
#include <stdexcept>
#include <string>

namespace puretv {
inline constexpr std::size_t PreferenceValueByteLimit=1024*1024;
inline constexpr std::size_t PreferenceMessageByteLimit=8*1024*1024;
inline constexpr std::size_t PreferencesByteLimit=64*1024*1024;
inline std::string serializePreferences(const nlohmann::json& values,std::size_t limit=PreferencesByteLimit) {
    if(!values.is_object())throw std::runtime_error("Invalid native preferences object");
    auto encoded=values.dump();
    if(encoded.size()>limit)throw std::runtime_error("Native preferences exceed the 64 MiB serialized storage limit");
    return encoded;
}
}
