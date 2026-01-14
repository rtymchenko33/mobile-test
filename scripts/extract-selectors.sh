#!/bin/bash

# Скрипт для витягування селекторів з open-source проєкту
# Використання: ./extract-selectors.sh <path-to-app-source> [ios|android|both]

SOURCE_PATH="${1:-.}"
PLATFORM="${2:-both}"

echo "🔍 Витягування селекторів з: $SOURCE_PATH"
echo "📱 Платформа: $PLATFORM"
echo ""

# Перевіряємо наявність Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Помилка: Node.js не встановлено"
    exit 1
fi

# Запускаємо Node.js скрипт
node "$(dirname "$0")/extract-selectors.js" "$SOURCE_PATH" --platform "$PLATFORM"
