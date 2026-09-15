#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WWW="$ROOT/apk/www"
ASSETS="$ROOT/apk/android/app/src/main/assets/www"
mkdir -p "$ASSETS"
cp -R "$WWW/." "$ASSETS/"

export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/android-sdk}"
export ANDROID_HOME="$ANDROID_SDK_ROOT"
mkdir -p "$ANDROID_SDK_ROOT"

if [ ! -x "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
  echo "Android cmdline-tools missing at $ANDROID_SDK_ROOT"
  exit 1
fi

yes | "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$ANDROID_SDK_ROOT" \
  "platform-tools" "platforms;android-34" "build-tools;34.0.0" >/tmp/sdkmanager.log || true

cd "$ROOT/apk/android"
if [ ! -f gradlew ]; then
  gradle wrapper --gradle-version 8.7 || true
fi

if [ -f gradlew ]; then
  chmod +x gradlew
  ./gradlew assembleDebug --no-daemon
else
  gradle assembleDebug --no-daemon
fi

OUT="$ROOT/apk/android/app/build/outputs/apk/debug/app-debug.apk"
DEST="$ROOT/apk/EVERYA-offline.apk"
cp "$OUT" "$DEST"
echo "APK: $DEST"
