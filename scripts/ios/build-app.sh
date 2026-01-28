#!/bin/bash
set -euo pipefail

echo "=== Build iOS App для Simulator ==="

# Шлях до iOS source проекту
IOS_SOURCE_DIR="${IOS_SOURCE_DIR:-./ios-diia}"
BUILD_DIR="./ios-build"
OUTPUT_DIR="./ios-app"
OUTPUT_APP="$OUTPUT_DIR/DiiaOpenSource.app"

echo "iOS Source Dir: $IOS_SOURCE_DIR"

# Перевірка чи існує source директорія
if [ ! -d "$IOS_SOURCE_DIR" ]; then
    echo "❌ iOS source директорія не знайдена: $IOS_SOURCE_DIR"
    echo "Перевірте що iOS repo було checkout'нуто"
    exit 1
fi

# Перехід до source директорії для пошуку проекту
cd "$IOS_SOURCE_DIR"

# Автоматичне визначення workspace або project
WORKSPACE_FILE=$(find . -maxdepth 2 -name "*.xcworkspace" -type d | head -1)
PROJECT_FILE=$(find . -maxdepth 2 -name "*.xcodeproj" -type d | head -1)

if [ -n "$WORKSPACE_FILE" ]; then
    echo "✅ Знайдено workspace: $WORKSPACE_FILE"
    BUILD_TYPE="workspace"
    BUILD_PATH="$WORKSPACE_FILE"
elif [ -n "$PROJECT_FILE" ]; then
    echo "✅ Знайдено project: $PROJECT_FILE"
    BUILD_TYPE="project"
    BUILD_PATH="$PROJECT_FILE"
else
    echo "❌ Не знайдено .xcworkspace або .xcodeproj файлів"
    echo "Знайдені файли в $IOS_SOURCE_DIR:"
    ls -la
    exit 1
fi

# Автоматичне визначення scheme
echo "Визначаємо доступні schemes..."
if [ "$BUILD_TYPE" = "workspace" ]; then
    SCHEMES=$(xcodebuild -workspace "$BUILD_PATH" -list -json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    workspace = data.get('workspace', {})
    schemes = workspace.get('schemes', [])
    for scheme in schemes:
        print(scheme)
except:
    pass
" 2>/dev/null || xcodebuild -workspace "$BUILD_PATH" -list 2>/dev/null | grep -A 100 "Schemes:" | grep -v "Schemes:" | sed 's/^[[:space:]]*//' | head -20)
else
    SCHEMES=$(xcodebuild -project "$BUILD_PATH" -list -json 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    project = data.get('project', {})
    schemes = project.get('schemes', [])
    for scheme in schemes:
        print(scheme)
except:
    pass
" 2>/dev/null || xcodebuild -project "$BUILD_PATH" -list 2>/dev/null | grep -A 100 "Schemes:" | grep -v "Schemes:" | sed 's/^[[:space:]]*//' | head -20)
fi

# Визначаємо scheme (пріоритет: Diia в назві, потім перший доступний)
SCHEME=""
if [ -n "$SCHEMES" ]; then
    # Шукаємо scheme з "Diia" в назві
    SCHEME=$(echo "$SCHEMES" | grep -i "diia" | head -1 || echo "")
    
    # Якщо не знайдено, беремо перший доступний
    if [ -z "$SCHEME" ]; then
        SCHEME=$(echo "$SCHEMES" | head -1)
    fi
fi

if [ -z "$SCHEME" ]; then
    echo "❌ Не вдалося визначити scheme"
    echo "Доступні schemes:"
    echo "$SCHEMES"
    exit 1
fi

echo "✅ Використовуємо scheme: $SCHEME"

# Повертаємося до root директорії проекту
cd "$(dirname "$0")/../.."

# Створюємо директорії для build
mkdir -p "$BUILD_DIR/DerivedData"
mkdir -p "$OUTPUT_DIR"

# Абсолютні шляхи
ABS_SOURCE_DIR=$(cd "$IOS_SOURCE_DIR" && pwd)
ABS_BUILD_DIR=$(cd "$BUILD_DIR" && pwd)
ABS_OUTPUT_DIR=$(cd "$OUTPUT_DIR" && pwd)

echo "Building app для iOS Simulator..."
echo "Source: $ABS_SOURCE_DIR"
echo "Build: $ABS_BUILD_DIR"
echo "Output: $ABS_OUTPUT_DIR"

# Build для simulator
cd "$ABS_SOURCE_DIR"

if [ "$BUILD_TYPE" = "workspace" ]; then
    xcodebuild \
        -workspace "$BUILD_PATH" \
        -scheme "$SCHEME" \
        -configuration Debug \
        -sdk iphonesimulator \
        -derivedDataPath "$ABS_BUILD_DIR/DerivedData" \
        clean build \
        2>&1 | tee "$ABS_BUILD_DIR/xcodebuild.log" || {
        echo "❌ Помилка build iOS app"
        echo "Останні 100 рядків логу:"
        tail -100 "$ABS_BUILD_DIR/xcodebuild.log"
        exit 1
    }
else
    xcodebuild \
        -project "$BUILD_PATH" \
        -scheme "$SCHEME" \
        -configuration Debug \
        -sdk iphonesimulator \
        -derivedDataPath "$ABS_BUILD_DIR/DerivedData" \
        clean build \
        2>&1 | tee "$ABS_BUILD_DIR/xcodebuild.log" || {
        echo "❌ Помилка build iOS app"
        echo "Останні 100 рядків логу:"
        tail -100 "$ABS_BUILD_DIR/xcodebuild.log"
        exit 1
    }
fi

# Знаходимо зібраний app bundle
BUILT_APP=$(find "$ABS_BUILD_DIR/DerivedData" -name "*.app" -type d -path "*/Build/Products/*-iphonesimulator/*.app" | head -1)

if [ -z "$BUILT_APP" ]; then
    echo "❌ Зібраний app bundle не знайдено"
    echo "Шукаємо в: $ABS_BUILD_DIR/DerivedData"
    echo "Знайдені .app файли:"
    find "$ABS_BUILD_DIR/DerivedData" -name "*.app" -type d | head -10
    echo ""
    echo "Останні 50 рядків build логу:"
    tail -50 "$ABS_BUILD_DIR/xcodebuild.log"
    exit 1
fi

echo "✅ App зібрано: $BUILT_APP"

# Видаляємо старий app bundle якщо існує
if [ -d "$ABS_OUTPUT_DIR/DiiaOpenSource.app" ] || [ -L "$ABS_OUTPUT_DIR/DiiaOpenSource.app" ]; then
    echo "Видаляємо старий app bundle..."
    rm -rf "$ABS_OUTPUT_DIR/DiiaOpenSource.app"
fi

# Копіюємо app bundle до output директорії
echo "Копіюємо app bundle до $ABS_OUTPUT_DIR/DiiaOpenSource.app..."
cp -R "$BUILT_APP" "$ABS_OUTPUT_DIR/DiiaOpenSource.app"

echo "✅ App bundle готово: $ABS_OUTPUT_DIR/DiiaOpenSource.app"

# Перевірка bundleId
BUNDLE_ID=$(defaults read "$ABS_OUTPUT_DIR/DiiaOpenSource.app/Info.plist" CFBundleIdentifier 2>/dev/null || echo "невідомо")
echo "Bundle ID: $BUNDLE_ID"

# Перевірка розміру
APP_SIZE=$(du -sh "$ABS_OUTPUT_DIR/DiiaOpenSource.app" | cut -f1)
echo "Розмір app: $APP_SIZE"
