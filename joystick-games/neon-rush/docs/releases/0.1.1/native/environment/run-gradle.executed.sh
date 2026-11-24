#!/bin/bash
set -eu
export JAVA_HOME=/workspace/scratch/neon-rush-toolchain/jdk17
export ANDROID_HOME=/workspace/scratch/neon-rush-toolchain/sdk
export GRADLE_USER_HOME=/workspace/scratch/neon-rush-wifi-native/gradle-cache
exec /workspace/scratch/neon-rush-wifi-native/gradle-8.9/bin/gradle \
  --no-daemon --max-workers=2 \
  -Dhttps.proxyHost=proxy -Dhttps.proxyPort=8080 \
  -Dhttp.proxyHost=proxy -Dhttp.proxyPort=8080 \
  -Djavax.net.ssl.trustStore=/workspace/scratch/neon-rush-wifi-native/test-cacerts \
  -I /workspace/scratch/neon-rush-wifi-native/test-network.init.gradle "$@"
