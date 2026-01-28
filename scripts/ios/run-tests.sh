#!/bin/bash
set -e

echo "========================================"
echo "  iOS Test Runner"
echo "========================================"
echo ""

# Перехід до root директорії проекту
cd "$(dirname "$0")/../.."

# 1. Перевірка Appium
bash scripts/ios/ensure-appium.sh
echo ""

# 2. Підготовка app bundle
bash scripts/ios/setup-app.sh
echo ""

# 3. Boot simulator
bash scripts/ios/boot-sim.sh
echo ""

# 4. Запуск тестів
echo "=== Запуск iOS тестів ==="
npx wdio run wdio.ios.conf.js "$@"
