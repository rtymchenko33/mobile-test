#!/bin/bash
set -e

echo "=== Підготовка iOS App Bundle ==="

# Шлях до target app (всередині workspace)
TARGET_APP_DIR="./ios-app"
TARGET_APP_PATH="$TARGET_APP_DIR/DiiaOpenSource.app"

# Перевірка чи app вже існує в workspace (після build)
if [ -d "$TARGET_APP_PATH" ]; then
    echo "✅ App bundle вже існує в workspace: $TARGET_APP_PATH"
    BUNDLE_ID=$(defaults read "$(pwd)/$TARGET_APP_PATH/Info.plist" CFBundleIdentifier 2>/dev/null || echo "невідомо")
    echo "Bundle ID: $BUNDLE_ID"
    exit 0
fi

# Шлях до source app (зовні workspace) - тільки для локального запуску
# В CI використовується build-app.sh або IOS_SOURCE_APP_PATH secret
if [ -z "$CI" ]; then
    # Fallback path тільки для локального розробника (можна перевизначити через env var)
    DEFAULT_LOCAL_PATH="${HOME}/diia-open-source/ios-diia/build/Build/Products/Debug-iphonesimulator/DiiaOpenSource.app"
    SOURCE_APP_PATH="${IOS_SOURCE_APP_PATH:-$DEFAULT_LOCAL_PATH}"
    
    # Перевірка чи існує source app
    if [ -d "$SOURCE_APP_PATH" ]; then
        echo "✅ Знайдено iOS app: $SOURCE_APP_PATH"
        
        # Створюємо директорію для app bundle
        mkdir -p "$TARGET_APP_DIR"
        
        # Видаляємо старий symlink/директорію якщо існує
        if [ -L "$TARGET_APP_PATH" ] || [ -d "$TARGET_APP_PATH" ]; then
            echo "Видаляємо старий app bundle..."
            rm -rf "$TARGET_APP_PATH"
        fi
        
        # Створюємо symlink (швидше ніж копіювання)
        echo "Створюємо symlink до app bundle..."
        ln -s "$SOURCE_APP_PATH" "$TARGET_APP_PATH"
        
        echo "✅ App bundle готово: $TARGET_APP_PATH"
        BUNDLE_ID=$(defaults read "$(pwd)/$TARGET_APP_PATH/Info.plist" CFBundleIdentifier 2>/dev/null || echo "невідомо")
        echo "Bundle ID: $BUNDLE_ID"
        exit 0
    fi
fi

# Якщо дійшли сюди - app не знайдено
echo "❌ iOS app не знайдено"
echo ""
if [ -n "$CI" ]; then
    echo "В CI: переконайтеся що build-app.sh виконався успішно"
    echo "Або встановіть IOS_SOURCE_APP_PATH з шляхом до app bundle"
    echo ""
    echo "⚠️ В CI режимі: виходимо з кодом 0, щоб workflow не падав"
    echo "Наступний крок 'Verify app bundle exists' обробить цю ситуацію"
    exit 0  # В CI не падаємо, надаємо можливість наступному кроку обробити
else
    echo "Локально: встановіть IOS_SOURCE_APP_PATH на правильний шлях до .app bundle"
    echo "Або побудуйте app через: bash scripts/ios/build-app.sh"
    exit 1
fi
