# Buroq Manager Build Helper Script
# This script helps you build the Android APK locally.

Write-Host "--- Buroq Manager APK Build Helper ---" -ForegroundColor Cyan

# 1. Navigate to android directory
$androidPath = "android"
if (Test-Path $androidPath) {
    Set-Location $androidPath
} else {
    Write-Error "Could not find android directory. Please run this script from the project root."
    exit
}

# 2. Run Gradle Build (Debug)
Write-Host "Building Debug APK... (This may take several minutes)" -ForegroundColor Yellow
./gradlew assembleDebug

if ($LASTEXITCODE -eq 0) {
    $apkPath = "app/build/outputs/apk/debug/app-debug.apk"
    if (Test-Path $apkPath) {
        Write-Host "`n[SUCCESS] APK built successfully!" -ForegroundColor Green
        Write-Host "Location: $(Get-Item $apkPath | Select-Object -ExpandProperty FullName)" -ForegroundColor Cyan
        
        # Open the folder
        ii "app/build/outputs/apk/debug/"
    } else {
        Write-Error "APK file not found after build."
    }
} else {
    Write-Host "`n[ERROR] Build failed. Please ensure you have JAVA_HOME and ANDROID_HOME configured." -ForegroundColor Red
}

# Return to root
Set-Location ..
