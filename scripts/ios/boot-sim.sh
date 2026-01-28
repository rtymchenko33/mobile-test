#!/bin/bash
set -e

DEVICE_NAME="${IOS_DEVICE_NAME:-iPhone 15 Pro}"
PLATFORM_VERSION="${IOS_PLATFORM_VERSION:-17.4}"

echo "=== Boot iOS Simulator ==="
echo "Шукаємо пристрій: $DEVICE_NAME (iOS $PLATFORM_VERSION)"

# Отримуємо список доступних simulators
AVAILABLE_DEVICES=$(xcrun simctl list devices available -j)

# Шукаємо UDID для потрібного пристрою
DEVICE_UDID=$(echo "$AVAILABLE_DEVICES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for device in devices:
        if device.get('name') == '$DEVICE_NAME' and device.get('isAvailable', False):
            print(device['udid'])
            sys.exit(0)
print('')
" 2>/dev/null || echo "")

if [ -z "$DEVICE_UDID" ]; then
    echo "⚠️  Пристрій '$DEVICE_NAME' не знайдено."
    echo "Доступні пристрої:"
    xcrun simctl list devices available | grep -i "iphone" | head -10
    
    # Fallback: використовуємо перший доступний iPhone
    DEVICE_UDID=$(echo "$AVAILABLE_DEVICES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for runtime, devices in data.get('devices', {}).items():
    for device in devices:
        if 'iPhone' in device.get('name', '') and device.get('isAvailable', False):
            print(device['udid'])
            print(f\"Використовуємо: {device['name']}\", file=sys.stderr)
            sys.exit(0)
" 2>&1)
    
    if [ -z "$DEVICE_UDID" ]; then
        echo "❌ Не знайдено жодного доступного iPhone simulator"
        exit 1
    fi
fi

echo "✅ Знайдено пристрій UDID: $DEVICE_UDID"

# Перевіряємо статус пристрою
DEVICE_STATE=$(xcrun simctl list devices | grep "$DEVICE_UDID" | awk -F'[()]' '{print $2}')
echo "Поточний стан: $DEVICE_STATE"

# Boot пристрою якщо він не Booted
if [ "$DEVICE_STATE" != "Booted" ]; then
    echo "Запускаємо simulator..."
    xcrun simctl boot "$DEVICE_UDID" 2>/dev/null || true
    
    # Відкриваємо Simulator.app (тільки якщо не в CI або якщо потрібно)
    if [ -z "$CI" ] || [ "${OPEN_SIMULATOR:-false}" = "true" ]; then
        open -a Simulator 2>/dev/null || true
    fi
    
    # Чекаємо поки simulator завантажиться
    echo "Очікуємо завантаження simulator..."
    xcrun simctl bootstatus "$DEVICE_UDID" -b || true
    
    echo "✅ Simulator запущено"
else
    echo "✅ Simulator вже запущено"
fi

# Експортуємо UDID для використання в тестах
export IOS_DEVICE_UDID="$DEVICE_UDID"
echo "Експортовано: IOS_DEVICE_UDID=$DEVICE_UDID"
