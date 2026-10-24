# Build and install without disabling the stock launcher.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not $env:TV_HOST) { throw 'Set TV_HOST to the TV IP address or IP:port.' }
function Invoke-Checked {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed ($LASTEXITCODE)" }
}
Invoke-Checked './gradlew.bat' @('--console=plain', 'assembleDebug')
$tvSerial = $env:TV_HOST
if ($tvSerial -notmatch ':') { $tvSerial += ':5555' }
Invoke-Checked 'adb' @('connect', $tvSerial)
Invoke-Checked 'adb' @('-s', $tvSerial, 'install', '-r', 'app/build/outputs/apk/debug/app-debug.apk')
Invoke-Checked 'adb' @('-s', $tvSerial, 'shell', 'cmd', 'package', 'set-home-activity', '--user', '0', 'com.ecojust.puretv/.MainActivity')
Invoke-Checked 'adb' @('-s', $tvSerial, 'shell', 'am', 'start', '-n', 'com.ecojust.puretv/.MainActivity')
