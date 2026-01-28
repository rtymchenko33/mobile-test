#!/bin/bash
set -e

echo "=== Build iOS App для Simulator ==="

# Шлях до iOS source проекту (може бути submodule або checkout)
IOS_SOURCE_DIR="${IOS_SOURCE_DIR:-../ios-diia}"
IOS_PROJECT_PATH="${IOS_PROJECT_PATH:-$IOS_SOURCE_DIR/DiiaOpenSource.xcodeproj}"
IOS_SCHEME="${IOS_SCHEME:-DiiaOpenSource}"
BUILD_DIR="${BUILD_DIR:-./ios-build}"
OUTPUT_DIR="${OUTPUT_DIR:-./ios-app}"

echo "iOS Source Dir: $IOS_SOURCE_DIR"
echo "Project Path: $IOS_PROJECT_PATH"
echo "Scheme: $IOS_SCHEME"

# Перевірка чи існує проект
if [ ! -d "$IOS_PROJECT_PATH" ]; then
    echo "⚠️  iOS проект не знайдено за адресою: $IOS_PROJECT_PATH"
    echo "Пропускаємо build. Очікуємо що app bundle вже існує або буде надано через IOS_SOURCE_APP_PATH"
    exit 0
fi

echo "✅ Знайдено iOS проект"

# Створюємо директорії
mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

# Build для simulator
echo "Будуємо app для iOS Simulator..."
xcodebuild \
    -project "$IOS_PROJECT_PATH" \
    -scheme "$IOS_SCHEME" \
    -configuration Debug \
    -sdk iphonesimulator \
    -derivedDataPath "$BUILD_DIR" \
    -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
    clean build \
    2>&1 | tee "$BUILD_DIR/xcodebuild.log" || {
    echo "❌ Помилка build iOS app"
    echo "Лог build:"
    tail -50 "$BUILD_DIR/xcodebuild.log"
    exit 1
}

# Знаходимо зібраний app bundle
BUILT_APP=$(find "$BUILD_DIR" -name "DiiaOpenSource.app" -type d | head -1)

if [ -z "$BUILT_APP" ]; then
    echo "❌ Зібраний app bundle не знайдено"
    echo "Шукаємо в: $BUILD_DIR"
    find "$BUILD_DIR" -name "*.app" -type d | head -5
    exit 1
fi

echo "✅ App зібрано: $BUILT_APP"

# Копіюємо або створюємо symlink до output директорії
OUTPUT_APP="$OUTPUT_DIR/DiiaOpenSource.app"
if [ -L "$OUTPUT_APP" ] || [ -d "$OUTPUT_APP" ]; then
    rm -rf "$OUTPUT_APP"
fi

# В CI краще копіювати (symlink може не працювати)
if [ -n "$CI" ]; then
    echo "Копіюємо app bundle (CI mode)..."
    cp -R "$BUILT_APP" "$OUTPUT_APP"
else
    echo "Створюємо symlink до app bundle..."
    ln -s "$(realpath "$BUILT_APP")" "$OUTPUT_APP"
fi

echo "✅ App bundle готово: $OUTPUT_APP"

# Перевірка bundleId
BUNDLE_ID=$(defaults read "$(pwd)/$OUTPUT_APP/Info.plist" CFBundleIdentifier 2>/dev/null || echo "невідомо")
echo "Bundle ID: $BUNDLE_ID"
