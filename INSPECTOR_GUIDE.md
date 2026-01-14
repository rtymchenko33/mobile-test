# Як використовувати Appium Inspector

## ⚠️ Важливо: Потрібно запустити Appium сервер!

**Так, Appium сервер обов'язково потрібен для роботи Inspector!**

Appium Inspector - це клієнт, який підключається до Appium сервера. Сервер виконує роль посередника між Inspector та вашим мобільним пристроєм/симулятором.

### Як запустити Appium сервер:

Відкрийте новий термінал і виконайте:

```bash
npx appium
```

Або якщо Appium встановлено глобально:

```bash
appium
```

Сервер запуститься на: `http://127.0.0.1:4723`

**Залиште цей термінал відкритим** поки використовуєте Inspector. Сервер повинен працювати весь час роботи з Inspector.

### Чому це потрібно?

- Appium сервер керує зв'язком між Inspector та пристроєм
- Він виконує команди автоматизації (tap, swipe, тощо)
- Без сервера Inspector не зможе підключитися до пристрою

## Варіанти використання Appium Inspector:

### Варіант 1: Appium Desktop (рекомендовано)

1. Завантажте та встановіть Appium Desktop:
   - https://github.com/appium/appium-desktop/releases
   - Або через Homebrew: `brew install --cask appium`

2. Відкрийте Appium Desktop
3. **Варіант А:** Якщо ви вже запустили сервер через термінал (`npx appium`), залиште поле "Start Server" порожнім
   **Варіант Б:** Якщо сервер не запущено, натисніть "Start Server" в Appium Desktop
4. Натисніть "Start Inspector Session"
5. Вставте capabilities з файлу `appium-inspector-capabilities.json`:

```json
{
  "platformName": "iOS",
  "appium:deviceName": "iPhone 15 Pro",
  "appium:platformVersion": "17.4",
  "appium:automationName": "XCUITest",
  "appium:app": "/Users/romantimchenko/diia-open-source/ios-diia/build/Build/Products/Debug-iphonesimulator/DiiaOpenSource.app",
  "appium:bundleId": "ua.gov.diia.opensource.app",
  "appium:noReset": false,
  "appium:fullReset": false,
  "appium:wdaLaunchTimeout": 60000
}
```

6. Натисніть "Start Session"

### Варіант 2: Веб-інтерфейс Appium Inspector (найновіший)

1. Відкрийте в браузері: https://inspector.appiumpro.com/
2. В полі "Remote Host" введіть: `127.0.0.1`
3. В полі "Remote Port" введіть: `4723`
4. Вставте capabilities з файлу `appium-inspector-capabilities.json`
5. Натисніть "Start Session"

### Варіант 3: Через командний рядок (appium-inspector)

```bash
npm install -g appium-inspector
appium-inspector
```

Потім введіть:
- Remote Host: `127.0.0.1`
- Remote Port: `4723`
- Capabilities: (скопіюйте з `appium-inspector-capabilities.json`)

## Важливо:

1. **Симулятор повинен бути запущений** перед підключенням Inspector:
   ```bash
   xcrun simctl boot "iPhone 15 Pro"
   open -a Simulator
   ```

2. **Шлях до .app файлу** повинен бути правильним (вже налаштовано в capabilities)

3. **Appium сервер** повинен бути запущений на порту 4723:
   ```bash
   npx appium
   ```
   Перевірити, чи працює сервер:
   ```bash
   curl http://127.0.0.1:4723/status
   ```
   Якщо сервер працює, ви побачите JSON з інформацією про статус

## ❌ Помилка: "address already in use" (порт 4723 зайнятий)

Якщо при спробі запустити `npx appium` ви бачите помилку:
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:4723
```

Це означає, що порт 4723 вже зайнятий іншим процесом Appium сервера.

### Як вирішити:

**Крок 1:** Знайдіть процес, який займає порт:
```bash
lsof -ti:4723
```

**Крок 2:** Зупиніть процес:
```bash
# М'яке завершення
lsof -ti:4723 | xargs kill

# Або примусове завершення (якщо перший спосіб не спрацював)
lsof -ti:4723 | xargs kill -9
```

**Крок 3:** Перевірте, що порт вільний:
```bash
lsof -ti:4723 || echo "✅ Порт 4723 вільний"
```

**Крок 4:** Тепер запустіть Appium сервер знову:
```bash
npx appium
```

## Зупинити Appium сервер:

Якщо потрібно зупинити сервер, знайдіть процес:
```bash
lsof -ti:4723 | xargs kill
```

Або використайте `Ctrl+C` в терміналі, де запущено сервер.

## Примітки:

- Inspector дозволяє переглядати структуру UI елементів додатку
- Можна отримувати локатори для XPath, accessibility ID, тощо
- Можна виконувати дії (tap, swipe, input) прямо з Inspector
