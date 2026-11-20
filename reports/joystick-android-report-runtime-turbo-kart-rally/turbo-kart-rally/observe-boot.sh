set -u
adb="$ANDROID_HOME/platform-tools/adb"
seen=''
unchanged=0
while (( SECONDS < 180 )); do
  # After BOOT_COMPLETED the Play Store may still be replacing GMS packages.
  state=$(timeout 8 "$adb" -s emulator-5554 shell 'getprop sys.boot_completed; pm path com.android.vending | head -n 1; pm path com.google.android.gms | head -n 1; pidof com.google.android.gms.persistent')
  if [[ "$state" != "$seen" ]]; then unchanged=$SECONDS; seen=$state; fi
  printf '%ss\n%s\n' "$SECONDS" "$state"
  mapfile -t services <<< "$state"
  if (( SECONDS >= 75 && SECONDS - unchanged >= 30 && ${#services[@]} == 4 )); then
    if [[ ${services[0]} == 1 && ${services[1]} == package:/* &&
          ${services[2]} == package:/* && ${services[3]} =~ ^[0-9]+$ ]]; then break; fi
  fi
  sleep 5
done
