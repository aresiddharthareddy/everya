#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WWW="$ROOT/apk/www"
ASSETS="$ROOT/apk/android/app/src/main/assets/www"
mkdir -p "$ASSETS"
cp -R "$WWW/." "$ASSETS/"

if [ -n "${EVERYA_APP_URL:-}" ]; then
  export ORG_GRADLE_PROJECT_EVERYA_APP_URL="$EVERYA_APP_URL"
fi

cd "$ROOT/apk/android"
chmod +x gradlew 2>/dev/null || true
./gradlew assembleDebug --no-daemon

OUT="$ROOT/apk/android/app/build/outputs/apk/debug/app-debug.apk"
DEST="$ROOT/apk/EVERYA-offline.apk"
PUBLIC="$ROOT/public/EVERYA-offline.apk"
cp "$OUT" "$DEST"
cp "$OUT" "$PUBLIC"
echo "APK: $DEST"
echo "Public: $PUBLIC"
