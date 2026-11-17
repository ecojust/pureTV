#!/usr/bin/env bash
# 用法: ./tools/set-wallpaper.sh <电视IP或IP:端口> <图片路径>
set -euo pipefail
TV_HOST="${1:-}"
IMG="${2:-}"
[ -n "$TV_HOST" ] && [ -n "$IMG" ] || { echo "用法: $0 <电视IP或IP:端口> <图片路径>" >&2; exit 1; }
[ -f "$IMG" ] || { echo "找不到图片: $IMG" >&2; exit 1; }
command -v adb >/dev/null || { echo "请安装 Android platform-tools (adb)" >&2; exit 1; }
TV_SERIAL="$TV_HOST"
[[ "$TV_SERIAL" == *:* ]] || TV_SERIAL="$TV_SERIAL:5555"
adb_tv() { adb -s "$TV_SERIAL" "$@"; }
case "$IMG" in
  *.[jJ][pP][gG]|*.[jJ][pP][eE][gG]|*.[pP][nN][gG]|*.[wW][eE][bB][pP]) ;;
  *) echo "只支持 jpg / png / webp" >&2; exit 1 ;;
esac
DIR="/sdcard/Android/data/com.ecojust.puretv/files"
adb connect "$TV_SERIAL"
adb_tv shell "mkdir -p $DIR"
# BitmapFactory 按文件内容解码，固定文件名与桌面内的壁纸管理保持一致。
adb_tv push "$IMG" "$DIR/wallpaper.jpg"
adb_tv shell am force-stop com.ecojust.puretv
adb_tv shell am start -n com.ecojust.puretv/.MainActivity
echo "壁纸已更新。可在桌面设置中移除壁纸。"
