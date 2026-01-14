#!/bin/bash

# Скрипт для налаштування iOS інфраструктури для тестування
# Використання: ./setup-ios.sh

set -e

echo "🚀 Налаштування iOS інфраструктури для автотестів..."
echo ""

# Кольори для виводу
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Перевірка Xcode
echo "📱 Перевірка Xcode..."
if [ -d "/Applications/Xcode.app" ]; then
    echo -e "${GREEN}✓${NC} Xcode знайдено в /Applications/Xcode.app"
else
    echo -e "${RED}✗${NC} Xcode не знайдено. Будь ласка, встановіть Xcode з App Store."
    exit 1
fi

# 2. Налаштування xcode-select
echo ""
echo "🔧 Налаштування Xcode Command Line Tools..."
if sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer 2>/dev/null; then
    echo -e "${GREEN}✓${NC} xcode-select налаштовано"
else
    echo -e "${YELLOW}⚠${NC} Помилка налаштування xcode-select. Спробуйте вручну:"
    echo "   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
fi

# 3. Прийняття ліцензії Xcode
echo ""
echo "📜 Прийняття ліцензії Xcode..."
if sudo xcodebuild -license accept 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Ліцензія Xcode прийнята"
else
    echo -e "${YELLOW}⚠${NC} Не вдалося прийняти ліцензію автоматично. Спробуйте вручну:"
    echo "   sudo xcodebuild -license accept"
fi

# 4. Перевірка xcodebuild
echo ""
echo "🔨 Перевірка xcodebuild..."
if xcodebuild -version > /dev/null 2>&1; then
    VERSION=$(xcodebuild -version | head -1)
    echo -e "${GREEN}✓${NC} $VERSION"
else
    echo -e "${RED}✗${NC} xcodebuild не працює. Переконайтесь, що Xcode налаштовано правильно."
fi

# 5. Перевірка симуляторів
echo ""
echo "📱 Перевірка iOS симуляторів..."
if xcrun simctl list devices available > /dev/null 2>&1; then
    DEVICE_COUNT=$(xcrun simctl list devices available | grep -c "iPhone" || echo "0")
    echo -e "${GREEN}✓${NC} Знайдено $DEVICE_COUNT доступних iPhone симуляторів"
    echo "   Для перегляду списку: xcrun simctl list devices available"
else
    echo -e "${YELLOW}⚠${NC} Не вдалося перевірити симулятори. Можливо, Xcode не налаштовано."
fi

# 6. Перевірка/встановлення CocoaPods
echo ""
echo "🍫 Перевірка CocoaPods..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo -e "${GREEN}✓${NC} CocoaPods встановлено (версія $POD_VERSION)"
else
    echo -e "${YELLOW}⚠${NC} CocoaPods не встановлено."
    echo "   Встановлення через Homebrew (рекомендовано)..."
    if command -v brew &> /dev/null; then
        if brew install cocoapods 2>/dev/null; then
            echo -e "${GREEN}✓${NC} CocoaPods встановлено через Homebrew"
        else
            echo -e "${YELLOW}⚠${NC} Не вдалося встановити через Homebrew. Спробуйте вручну:"
            echo "   sudo gem install cocoapods"
        fi
    else
        echo "   Встановіть вручну: sudo gem install cocoapods"
    fi
fi

# 7. Перевірка Appium драйверів
echo ""
echo "🤖 Перевірка Appium драйверів..."
cd "$(dirname "$0")"
if npx appium driver list 2>/dev/null | grep -q "xcuitest.*installed"; then
    echo -e "${GREEN}✓${NC} Appium XCUITest driver встановлено"
else
    echo -e "${YELLOW}⚠${NC} XCUITest driver не знайдено. Встановлення..."
    if npx appium driver install xcuitest 2>/dev/null; then
        echo -e "${GREEN}✓${NC} XCUITest driver встановлено"
    else
        echo -e "${RED}✗${NC} Не вдалося встановити XCUITest driver"
    fi
fi

# 8. Перевірка npm залежностей
echo ""
echo "📦 Перевірка npm залежностей..."
if [ -f "package.json" ]; then
    if npm list appium-xcuitest-driver > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} appium-xcuitest-driver в package.json"
    else
        echo -e "${YELLOW}⚠${NC} appium-xcuitest-driver не знайдено в package.json"
        echo "   Встановлення..."
        npm install --save-dev appium-xcuitest-driver
    fi
else
    echo -e "${RED}✗${NC} package.json не знайдено"
fi

echo ""
echo -e "${GREEN}✅ Налаштування завершено!${NC}"
echo ""
echo "📝 Наступні кроки:"
echo "   1. Прочитайте SETUP_IOS.md для детальних інструкцій"
echo "   2. Збудуйте iOS додаток в Xcode"
echo "   3. Налаштуйте wdio.conf.js для iOS тестування"
echo "   4. Запустіть тести: npm run wdio"
echo ""
