set -euxo pipefail
{
  test "$(id -u)" -ne 0
  command -v gdb || true
  sudo apt-get update
  sudo apt-get install -y --no-install-recommends gdb
  command -v gdb
  test -x /usr/bin/gdb
  /usr/bin/gdb --version
  sha256sum /usr/bin/gdb
} 2>&1 | tee "$RUNNER_TEMP/qemu-debugger-setup.log"
