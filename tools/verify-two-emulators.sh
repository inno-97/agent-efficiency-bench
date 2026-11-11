#!/usr/bin/env bash
set -euo pipefail
# Called by android-emulator-runner after the primary API35 emulator is booted.
echo no | avdmanager create avd --force -n benchmark-peer -k 'system-images;android-35;google_apis;x86_64'
"$ANDROID_HOME/emulator/emulator" -avd benchmark-peer -port 5556 -no-window -no-audio -no-snapshot -gpu swiftshader_indirect -memory 1536 -cores 2 > "$RUNNER_TEMP/peer-emulator.log" 2>&1 &
peer_pid=$!
trap 'adb -s emulator-5556 emu kill >/dev/null 2>&1 || true; kill "$peer_pid" 2>/dev/null || true' EXIT
timeout 120 adb -s emulator-5556 wait-for-device
ready=0
for attempt in $(seq 1 90); do
  if [ "$(adb -s emulator-5556 shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; then ready=1; break; fi
  sleep 2
done
[ "$ready" = 1 ] || { tail -50 "$RUNNER_TEMP/peer-emulator.log"; exit 2; }
adb -s emulator-5556 shell input keyevent 82
BENCH_PEER_EMULATOR=emulator-5556 npm run verify:android:advanced -- emulator-5554 "$RUNNER_TEMP/mobile-advanced.json"
