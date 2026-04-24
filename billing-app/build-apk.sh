#!/bin/bash

# ============================================
# Script Build APK Release - Buroq Manager
# Cara pakai: bash build-apk.sh
# Untuk langsung install ke device: bash build-apk.sh --install
# ============================================
# Script ini akan:
# 1. Bundle JS dengan Expo (tanpa Metro)
# 2. Build APK release dengan Gradle
# Output: android/app/build/outputs/apk/release/app-release.apk

# Path ADB - sesuaikan jika berbeda
ADB="/home/hudi/Android/Sdk/platform-tools/adb"
INSTALL=false

# Cek argumen
if [ "$1" == "--install" ]; then
    INSTALL=true
fi

set -e

echo "======================================"
echo "  BUILD APK RELEASE - Buroq Manager"
echo "======================================"

# Pastikan di direktori yang benar
cd "$(dirname "$0")"

# Step 1: Cek Node dan dependencies
echo ""
echo ">> Mengecek dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   node_modules tidak ada, menjalankan npm install..."
    npm install
fi

# Step 2: Bundle JS dengan Expo export:embed
echo ""
echo ">> Membuat JS bundle (Expo export:embed)..."
mkdir -p android/app/src/main/assets

npx expo export:embed \
    --platform android \
    --entry-file index.ts \
    --bundle-output android/app/src/main/assets/index.android.bundle \
    --assets-dest android/app/src/main/res \
    --dev false

echo "   Bundle berhasil dibuat!"

# Step 3: Build APK Release dengan Gradle
echo ""
echo ">> Building APK Release dengan Gradle..."
cd android

./gradlew assembleRelease --stacktrace

cd ..

# Step 4: Cek hasil
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

echo ""
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -sh "$APK_PATH" | cut -f1)
    echo "======================================"
    echo "  BUILD BERHASIL!"
    echo "======================================"
    echo "  APK: $APK_PATH"
    echo "  Ukuran: $APK_SIZE"
    echo ""

    if [ "$INSTALL" == "true" ]; then
        echo ">> Installing ke device Android..."
        if $ADB devices | grep -q "device$"; then
            $ADB install -r "$APK_PATH"
            echo "  Instalasi berhasil!"
        else
            echo "  PERINGATAN: Tidak ada device yang terhubung!"
            echo "  Pastikan device terhubung via USB dengan USB Debugging aktif."
        fi
    else
        echo "  Install manual ke device:"
        echo "  $ADB install -r $APK_PATH"
        echo ""
        echo "  Atau salin APK ke device:"
        echo "  cp $APK_PATH ~/Desktop/buroq-manager.apk"
    fi
    echo "======================================"
else
    echo "  BUILD GAGAL - APK tidak ditemukan"
    exit 1
fi
