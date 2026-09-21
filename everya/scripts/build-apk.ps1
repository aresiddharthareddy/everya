$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Www = Join-Path $Root "apk\www"
$Assets = Join-Path $Root "apk\android\app\src\main\assets\www"
New-Item -ItemType Directory -Force -Path $Assets | Out-Null
Copy-Item -Path (Join-Path $Www "*") -Destination $Assets -Recurse -Force

Push-Location (Join-Path $Root "apk\android")
& .\gradlew.bat assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Gradle build failed (exit $LASTEXITCODE). Install Android SDK and set sdk.dir in apk/android/local.properties." }
Pop-Location

$Out = Join-Path $Root "apk\android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $Out)) { throw "APK not found at $Out" }
$Dest = Join-Path $Root "apk\EVERYA-offline.apk"
$Public = Join-Path $Root "public\EVERYA-offline.apk"
Copy-Item $Out $Dest -Force
Copy-Item $Out $Public -Force
Write-Host "APK: $Dest"
Write-Host "Public: $Public"
