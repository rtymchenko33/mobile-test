#!/bin/bash
set -e

echo "=== Перевірка Appium та XCUITest driver ==="

# Перехід до root директорії проекту
cd "$(dirname "$0")/../.."

# Використовуємо локальний Appium через npx
APPIUM="npx appium"

# Перевірка чи встановлено Appium (через node_modules)
if [ ! -d "node_modules/appium" ]; then
    echo "❌ Appium не знайдено в node_modules. Встановлюємо залежності..."
    npm install
fi

echo "✅ Appium знайдено: $($APPIUM --version 2>/dev/null || echo 'version unknown')"

# Перевірка XCUITest driver
# Встановлюємо APPIUM_HOME щоб уникнути проблем з permissions
export APPIUM_HOME="${APPIUM_HOME:-$HOME/.appium}"
mkdir -p "$APPIUM_HOME"

# Перевіряємо чи driver встановлений через npm пакет (найнадійніший спосіб)
if [ -d "node_modules/appium-xcuitest-driver" ]; then
    echo "✅ XCUITest driver знайдено в node_modules"
    DRIVER_CHECK="xcuitest"
else
    DRIVER_CHECK=""
fi

# Якщо не знайдено в node_modules, перевіряємо через appium команду
if [ -z "$DRIVER_CHECK" ]; then
    DRIVER_CHECK=$($APPIUM driver list --installed 2>&1 | grep -o "xcuitest" | head -1 || echo "")
fi
if [ -z "$DRIVER_CHECK" ]; then
    echo "⚠️  XCUITest driver не знайдено в node_modules"
    echo "Перевіряємо чи він встановлений через npm пакет..."
    
    # Перевіряємо package.json
    if grep -q "appium-xcuitest-driver" package.json; then
        echo "✅ appium-xcuitest-driver знайдено в package.json"
        echo "Перевіряємо node_modules..."
        if [ ! -d "node_modules/appium-xcuitest-driver" ]; then
            echo "❌ Driver не встановлено. Встановлюємо залежності..."
            npm install
        fi
    else
        echo "❌ appium-xcuitest-driver не знайдено в package.json"
        echo "Встановлюємо..."
        npm install --save-dev appium-xcuitest-driver
    fi
    
    # Фінальна перевірка
    if [ -d "node_modules/appium-xcuitest-driver" ]; then
        echo "✅ XCUITest driver готовий"
    else
        echo "❌ XCUITest driver не вдалося встановити"
        exit 1
    fi
else
    echo "✅ XCUITest driver встановлено"
fi

echo "✅ Appium готово до роботи"
