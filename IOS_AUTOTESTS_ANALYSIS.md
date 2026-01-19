# Технічний опис iOS-проєкту автотестів

## 1. Загальна інформація про проєкт

### Назва проєкту
**diia_app_tests** — проєкт автоматизованого тестування мобільного застосунку Дія для iOS та Android.

### Тип iOS-застосунку
**Native iOS** (Swift/Objective-C)
- Bundle ID: `ua.gov.diia.opensource.app`
- Шлях до зібраного .app: `/Users/romantimchenko/diia-open-source/ios-diia/build/Build/Products/Debug-iphonesimulator/DiiaOpenSource.app`
- Схема збірки: `DiiaDev` (Debug-iphonesimulator)

### Підтримувані версії iOS
- **iOS 17.4** (основна версія для тестування)
- Симулятор: **iPhone 15 Pro** (за замовчуванням)
- Також підтримується: iPhone 17 Pro Max (в конфігурації Appium Inspector)

### Ціль автотестів
- **E2E (End-to-End) тестування** критичних бізнес-процесів
- **Smoke-тести** для швидкої перевірки основних функцій
- **Regression-тести** для перевірки стабільності після змін
- **Critical path** — покриття найважливіших користувацьких сценаріїв

### Роль автотестів у релізному процесі
- Перевірка стабільності основних функцій перед релізом
- Валідація критичних сценаріїв авторизації та роботи з документами
- Забезпечення якості користувацького досвіду

---

## 2. Технологічний стек (iOS)

### Фреймворк
**Appium** з драйвером **XCUITest** для iOS

### Мова програмування
**JavaScript (Node.js)** — CommonJS модулі

### Інструменти та залежності

#### Основні пакети (package.json):
- `@wdio/cli`: ^9.23.0 — CLI для WebdriverIO
- `@wdio/local-runner`: ^9.23.0 — локальний раннер
- `@wdio/mocha-framework`: ^9.23.0 — інтеграція з Mocha
- `@wdio/appium-service`: ^9.23.0 — сервіс для Appium
- `webdriverio`: ^9.23.0 — WebdriverIO фреймворк
- `appium`: ^3.1.2 — Appium сервер
- `appium-xcuitest-driver`: ^10.14.10 — драйвер для iOS XCUITest

#### Інструменти розробки:
- **Xcode** — для збірки iOS додатку та роботи з симуляторами
- **XCTest** — нативний фреймворк тестування iOS (використовується через Appium)
- **WebDriverAgent** — автоматично встановлюється та запускається Appium XCUITest драйвером
- **Appium Inspector** — для інспекції елементів UI (є конфігураційні файли)

### Репорти
- **Spec Reporter** (`@wdio/spec-reporter`) — стандартний консольний репортер
- **Screenshots** — автоматичне збереження скріншотів при падінні тестів
- **Page Sources** — збереження XML page source при падінні тестів
- Артефакти зберігаються в `./artifacts/screenshots/` та `./artifacts/pagesources/`

---

## 3. Архітектура автотестів

### Структура проєкту

```
mobile-test/
├── helpers/
│   └── helper-iOS.js          # iOS-специфічні хелпери та утиліти
├── test/
│   └── specs/
│       └── iOS/
│           ├── authentication.e2e.js  # Тести авторизації
│           └── documents.e2e.js      # Тести роботи з документами
├── wdio.ios.conf.js           # Конфігурація WebdriverIO для iOS
├── package.json               # Залежності та скрипти
└── artifacts/                 # Артефакти тестів (screenshots, pagesources)
```

### Патерни архітектури

#### 1. Helper Functions Pattern
- Централізовані хелпери в `helper-iOS.js`
- Функції для роботи з селекторами, флоу, асертами
- Логування кроків з кольоровим виводом

#### 2. Flow Objects (неявний патерн)
- Функції-флоу: `authorize()`, `login()`, `forgotCode()`, `restart()`
- Інкапсулюють послідовність дій для складних сценаріїв

#### 3. Page Object (частково)
- Використовується частково через helper-функції
- Немає окремих Page Object класів, але є функції для роботи з екранами

### Робота з селекторами

#### Пріоритет використання селекторів (згідно з документацією в helper-iOS.js):

1. **✅ Accessibility ID** (`accessibilityIdentifier`) — найкращий варіант
   - Найшвидший та найстабільніший
   - Не залежить від UI змін
   - Приклад: `getElementByAccessibilityId('checkbox_conditions_bordered_auth')`

2. **✅ Class Chain** (`-ios class chain`) — рекомендовано для iOS
   - Швидкий, нативний для iOS
   - Краще за XPath для iOS
   - Приклад: `getElementByClassChain('Button', 'name == "Далі"')`

3. **✅ Predicate String** (`-ios predicate string`) — для складних умов
   - Швидкий, гнучкий
   - Приклад: `getElementByPredicate('type == "XCUIElementTypeTextField" AND enabled == true')`

4. **⚠️ XPath** — використовується як fallback
   - Повільний, менш стабільний
   - Використовується тільки коли інші не підходять
   - Приклад: `getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")]')`

5. **❌ Прямий пошук по типу** — не використовується
   - `XCUIElementTypeTextField` — це тип, а не селектор

### Конфігурація середовищ

#### Поточна конфігурація (wdio.ios.conf.js):
- **Середа**: Debug (симулятор)
- **Bundle ID**: `ua.gov.diia.opensource.app`
- **Схема**: `DiiaDev` (з назви шляху збірки)
- **Reset поведінка**: `noReset: false`, `fullReset: false`
- **Timeout для WDA**: `wdaLaunchTimeout: 60000` (60 секунд)

#### Відсутнє:
- Конфігурація для різних середовищ (dev/stage/prod)
- Змінні середовища для динамічної зміни конфігурації
- Окремі конфігурації для реальних девайсів

---

## 4. Робота з iOS-специфікою

### Налаштування симуляторів

#### Поточна конфігурація:
- **Device**: iPhone 15 Pro
- **iOS Version**: 17.4
- **Automation**: XCUITest

#### Команди для роботи з симуляторами:
```bash
# Список доступних симуляторів
xcrun simctl list devices available

# Запуск симулятора
xcrun simctl boot "iPhone 15 Pro"

# Відкриття Simulator.app
open -a Simulator
```

### Налаштування реальних девайсів
**Не налаштовано** — поточна конфігурація працює тільки з симуляторами.

Для реальних девайсів потрібно:
- Provisioning profiles
- Code signing сертифікати
- UDID пристрою
- Налаштування WebDriverAgent на реальному пристрої

### Сертифікати, provisioning, signing
**Не налаштовано** — використовується Debug-збірка для симулятора, яка не потребує сертифікатів.

### Permissions handling
**Неявне оброблення** через Appium:
- Дозволи надаються автоматично через `autoGrantPermissions` (для Android)
- Для iOS в Debug-збірці дозволи можуть бути попередньо налаштовані

**Відсутнє явне оброблення:**
- Push notifications
- Camera
- Biometrics (Touch ID / Face ID)
- Location services

### Alerts / system dialogs
**Обробляються через селектори:**
- Використовуються Class Chain або Predicate String для пошуку кнопок в діалогах
- Приклад: `getElementByClassChain('Button', 'name == "Авторизуватися"')`

**Відсутнє:**
- Спеціальні функції для обробки системних алертів
- Автоматичне закриття алертів

---

## 5. Покриття автотестами

### Покриті бізнес-процеси

#### 1. Авторизація та аутентифікація (`authentication.e2e.js`)

**Тести:**
1. ✅ **Первинна авторизація** — повний флоу з BankID НБУ
   - Вибір BankID НБУ
   - Вибір банку (Банк НаДія)
   - Введення токену
   - Створення PIN коду (двічі)

2. ✅ **Логін** — вхід з існуючим PIN кодом
   - Введення PIN коду
   - Перевірка привітання

3. ✅ **"Забув код"** — відновлення доступу
   - Клік на "Не пам'ятаю код для входу"
   - Підтвердження повторної авторизації
   - Повна авторизація з новим PIN

4. ✅ **Логін з новим кодом** — після відновлення
   - Вхід з новим PIN кодом

5. ✅ **Зміна PIN коду** — через Налаштування
   - Відкриття Налаштувань
   - Зміна PIN коду
   - Підтвердження зміни

6. ✅ **Логін після зміни PIN** — з новим кодом

7. ✅ **Вихід з додатку** — Sign out
   - Відкриття меню
   - Прокрутка до кнопки "Вийти"
   - Підтвердження виходу

8. ✅ **Авторизація після виходу** — повна авторизація

9. ✅ **Блокування після 3 невдалих спроб** — security сценарій
   - 3 невдалі спроби входу
   - Поява поп-апу з попередженням
   - Повторна авторизація

#### 2. Робота з документами (`documents.e2e.js`)

**Тести:**
1. ✅ **Перегляд посвідчення водія**
   - Авторизація
   - Перехід на вкладку "Документи"
   - Перевірка наявності документа
   - Перевірка полів документа:
     - Дата народження
     - Категорія
     - Номер документа
     - ПІБ

### Критичні сценарії (happy path)
✅ **Покриті:**
- Первинна авторизація через BankID
- Логін з PIN кодом
- Перегляд документів
- Зміна PIN коду
- Вихід та повторна авторизація

### Smoke-набір
**Не виділено окремо**, але можна вважати smoke-тестами:
- `user should be able to authorize in the app for the first time`
- `user should be able to log in to the app`
- `user should be able to observe driver license document`

### Regression-набір
Весь набір тестів можна вважати regression-набором, оскільки покриває основні функції.

### Орієнтовна кількість тестів
- **Авторизація**: 9 тестів
- **Документи**: 1 тест
- **Всього**: **10 тестів**

---

## 6. Запуск автотестів

### Локальний запуск

#### Через npm скрипти:
```bash
# Запуск всіх iOS тестів
npm run wdio:ios

# Запуск тільки тестів авторизації
npm run wdio:ios:auth

# Запуск конкретного тесту (первинна авторизація)
npm run wdio:ios:auth:first

# Запуск двох тестів (первинна авторизація + логін)
npm run wdio:ios:auth:two
```

#### Через CLI:
```bash
# Всі iOS тести
npx wdio run ./wdio.ios.conf.js

# Конкретний spec файл
npx wdio run ./wdio.ios.conf.js --spec ./test/specs/iOS/authentication.e2e.js

# З grep фільтром
npx wdio run ./wdio.ios.conf.js --spec ./test/specs/iOS/authentication.e2e.js --mochaOpts.grep "user should be able to authorize"
```

### Запуск у CI
**Не налаштовано** — відсутні файли CI конфігурації:
- Немає `.gitlab-ci.yml`
- Немає `.github/workflows/*.yml`
- Немає `Jenkinsfile`

**Для налаштування CI потрібно:**
- macOS runner (обов'язково для iOS тестів)
- Xcode встановлений на runner
- iOS симулятори налаштовані
- Appium встановлений
- Збірка iOS додатку перед тестами

### Паралельність
- **maxInstances: 1** — тести запускаються послідовно
- **Паралельність не використовується** — один симулятор, один екземпляр тестів

**Обмеження:**
- Неможливо запускати тести паралельно на різних симуляторах
- Немає конфігурації для паралельного запуску

### Timeouts та retry-механізми

#### Timeouts:
- **waitforTimeout**: 10000 (10 секунд) — стандартний timeout для waitFor*
- **connectionRetryTimeout**: 120000 (120 секунд) — timeout для підключення
- **connectionRetryCount**: 2 — кількість спроб підключення
- **mochaOpts.timeout**: 90000 (90 секунд) — timeout для одного тесту
- **wdaLaunchTimeout**: 60000 (60 секунд) — timeout для запуску WebDriverAgent

#### Retry-механізми:
- **connectionRetryCount**: 2 — автоматичні retry для підключення
- **specFileRetries**: не налаштовано — немає автоматичного retry для павших тестів
- **Retry логіка в коді**: відсутня — немає явних retry для нестабільних операцій

---

## 7. Стабільність і флаки

### Найчастіші причини падінь

#### 1. Анімації
**Проблема**: Елементи можуть бути не готові через анімації переходів.

**Рішення в проєкті:**
- Використання `waitForDisplayed()` з timeout
- Явні паузи `driver.pause()` в критичних місцях:
  - Після кліку на BankID НБУ: `await driver.pause(2000)`
  - Після обробки авторизації: `await driver.pause(2000)`
  - Після виходу: `await driver.pause(3000)`

**Проблеми:**
- Хардкоджені паузи (`driver.pause()`) — нестабільне рішення
- Немає очікування завершення анімацій

#### 2. Wait'и
**Використання explicit waits:**
- `waitForDisplayed({ timeout: 10000 })` — широко використовується
- `driver.waitUntil()` — використовується в `assertTextView()`

**Проблеми:**
- Різні timeout значення в різних місцях (5s, 10s, 15s, 30s)
- Немає централізованої конфігурації timeout'ів
- Деякі елементи очікуються з дуже довгими timeout'ами (30s для привітання)

#### 3. Нестабільні локатори
**Проблеми:**
- Використання XPath з `contains()` для пошуку по тексту — може знайти неправильний елемент
- Fallback логіка з кількома спробами різних селекторів (наприклад, в `assertGreeting()`)
- Пошук елементів в WebView (BankID авторизація) — нестабільний

**Приклади нестабільних локаторів:**
```javascript
// Пошук по тексту через XPath
const bankNadiia = getElementByText('Банк НаДія');

// Fallback логіка з кількома спробами
try {
    tokenInput = getElementByAccessibilityId('tokenInputField');
} catch (e) {
    tokenInput = getElementByPredicate('type == "XCUIElementTypeTextField" AND enabled == true');
}
```

### Використання explicit waits
✅ **Використовується:**
- `waitForDisplayed()` — для очікування появи елементів
- `driver.waitUntil()` — для очікування умов
- `expect().toBeDisplayed()` — з неявним wait

### Retry / rerun failed tests
❌ **Не налаштовано:**
- Немає `specFileRetries` в конфігурації
- Немає автоматичного rerun павших тестів
- Немає retry логіки в коді для нестабільних операцій

### Debug інструменти
✅ **Використовується:**
- `driver.debug()` — для зупинки виконання та інспекції стану
- Збереження screenshots при падінні
- Збереження page source при падінні

**Приклад використання:**
```javascript
await driver.debug(); // DEBUG: Після restart() - перевірте, який екран відображається
```

---

## 8. CI/CD для iOS автотестів

### macOS runners
**Не налаштовано** — відсутня CI конфігурація.

**Вимоги для CI:**
- macOS runner (обов'язково)
- Xcode встановлений
- iOS симулятори доступні
- Appium встановлений
- Node.js та npm

### Кешування залежностей
**Не налаштовано** — немає CI конфігурації.

**Рекомендації:**
- Кешування `node_modules`
- Кешування зібраного iOS додатку (якщо можливо)
- Кешування iOS симуляторів

### Збірка логів та артефактів

#### Поточна реалізація:
- **Screenshots**: автоматично зберігаються в `./artifacts/screenshots/` при падінні тестів
- **Page Sources**: автоматично зберігаються в `./artifacts/pagesources/` при падінні тестів
- Формат імені: `{test_title}-{timestamp}.png/xml`

#### Обмеження:
- Артефакти зберігаються тільки при падінні тестів
- Немає збереження артефактів для успішних тестів
- Немає відео запису виконання тестів
- Немає інтеграції з Allure або іншими репортерами

---

## 9. Відомі обмеження і технічний борг

### Що ускладнює підтримку

#### 1. Хардкоджені шляхи та значення
- **Шлях до .app файлу**: хардкоджений в `wdio.ios.conf.js`
  ```javascript
  'appium:app': path.resolve('/Users/romantimchenko/diia-open-source/ios-diia/build/...')
  ```
- **Токен авторизації**: хардкоджений в `helper-iOS.js`
  ```javascript
  await tokenInput.setValue('B7B5908CFBA2DBDA1BE9');
  ```
- **PIN коди**: використовуються різні цифри ('0', '1', '2', '3', '4') для різних тестів, але без централізованого управління

#### 2. Відсутність Page Object Pattern
- Всі селектори та логіка розкидані по helper-функціях
- Важко підтримувати при зміні UI
- Немає чіткої структури для різних екранів

#### 3. Нестабільні селектори
- Використання XPath з `contains()` для пошуку по тексту
- Fallback логіка з кількома спробами — ускладнює дебагінг
- Пошук елементів в WebView (BankID) — нестабільний

#### 4. Хардкоджені паузи
- `driver.pause(2000)`, `driver.pause(3000)` — нестабільне рішення
- Залежить від швидкості пристрою та навантаження

#### 5. Відсутність конфігурації середовищ
- Немає розділення dev/stage/prod
- Немає змінних середовища
- Важко переключатися між середовищами

### Що застаріло

#### 1. Використання застарілих функцій
- `getElementByTypeAndText()` — позначена як застаріла, але все ще експортується
- Коментарі про застарілість є, але функція не видалена

#### 2. Відсутність сучасних практик
- Немає використання TypeScript
- Немає використання сучасних репортерів (Allure)
- Немає використання тестових даних з файлів

### Які місця потребують рефакторингу

#### 1. Helper-функції
- **Проблема**: Великий файл `helper-iOS.js` (504 рядки) змішує різні відповідальності
- **Рішення**: Розділити на модулі:
  - `selectors.js` — функції для роботи з селекторами
  - `flows.js` — функції-флоу (authorize, login, тощо)
  - `assertions.js` — функції для асертів
  - `utils.js` — утиліти (scroll, find, тощо)

#### 2. Тести
- **Проблема**: Тести містять багато дублювання коду
- **Рішення**: Винести загальні кроки в before/after hooks

#### 3. Конфігурація
- **Проблема**: Хардкоджені значення
- **Рішення**: Використовувати змінні середовища або конфігураційні файли

#### 4. Селектори
- **Проблема**: Нестабільні селектори, fallback логіка
- **Рішення**: Додати accessibility identifiers в iOS додаток, використовувати тільки стабільні селектори

#### 5. Timeout'и
- **Проблема**: Різні timeout'и в різних місцях
- **Рішення**: Централізувати timeout'и в конфігурації

---

## 10. Рекомендації

### Як підвищити стабільність iOS-тестів

#### 1. Замінити хардкоджені паузи на explicit waits
```javascript
// Замість:
await driver.pause(2000);

// Використовувати:
await driver.waitUntil(
    async () => await element.isDisplayed(),
    { timeout: 5000, timeoutMsg: 'Element not visible' }
);
```

#### 2. Додати retry механізм для нестабільних операцій
```javascript
// Додати в конфігурацію:
specFileRetries: 1,
specFileRetriesDelay: 2,
```

#### 3. Покращити селектори
- Попросити iOS розробників додати `accessibilityIdentifier` для всіх важливих елементів
- Уникати XPath, використовувати Class Chain або Predicate String
- Видалити fallback логіку, використовувати тільки стабільні селектори

#### 4. Додати очікування завершення анімацій
```javascript
// Очікування завершення анімації
await driver.waitUntil(
    async () => {
        const location = await element.getLocation();
        const prevLocation = await element.getLocation();
        await driver.pause(100);
        const currentLocation = await element.getLocation();
        return location.x === currentLocation.x && location.y === currentLocation.y;
    },
    { timeout: 5000 }
);
```

#### 5. Централізувати timeout'и
```javascript
// В конфігурації:
const TIMEOUTS = {
    SHORT: 5000,
    MEDIUM: 10000,
    LONG: 30000,
    VERY_LONG: 60000
};
```

### Як масштабувати покриття

#### 1. Додати Page Object Pattern
```javascript
// pages/LoginPage.js
class LoginPage {
    get checkbox() { return getElementByAccessibilityId('checkbox_conditions_bordered_auth'); }
    get bankIdButton() { return getElementByClassChain('Button', 'name == "BankID НБУ  . "'); }
    
    async authorize(token, pin) {
        await this.checkbox.waitForDisplayed();
        await this.bankIdButton.click();
        // ...
    }
}
```

#### 2. Додати тестові дані
```javascript
// data/testData.js
module.exports = {
    auth: {
        token: process.env.AUTH_TOKEN || 'B7B5908CFBA2DBDA1BE9',
        pins: {
            default: '0',
            new: '1',
            changed: '2'
        }
    }
};
```

#### 3. Додати більше тестів
- Тести для інших документів (паспорт, ID карта, тощо)
- Тести для інших функцій додатку
- Негативні тести (неправильний PIN, невірний токен, тощо)
- Тести для різних iOS версій

#### 4. Додати тести для реальних девайсів
- Налаштувати provisioning profiles
- Додати конфігурацію для реальних девайсів
- Тести на різних моделях iPhone

### Що оптимізувати в архітектурі

#### 1. Розділити helper-функції на модулі
```
helpers/
├── selectors.js      # Функції для роботи з селекторами
├── flows.js          # Функції-флоу (authorize, login, тощо)
├── assertions.js    # Функції для асертів
├── utils.js         # Утиліти (scroll, find, тощо)
└── constants.js     # Константи (timeouts, селектори)
```

#### 2. Додати конфігурацію середовищ
```javascript
// config/environments.js
module.exports = {
    dev: {
        bundleId: 'ua.gov.diia.opensource.app.dev',
        appPath: './app/diia-dev.app'
    },
    stage: {
        bundleId: 'ua.gov.diia.opensource.app.stage',
        appPath: './app/diia-stage.app'
    },
    prod: {
        bundleId: 'ua.gov.diia.opensource.app',
        appPath: './app/diia-prod.app'
    }
};
```

#### 3. Додати CI/CD конфігурацію
```yaml
# .github/workflows/ios-tests.yml
name: iOS Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run wdio:ios
      - uses: actions/upload-artifact@v2
        with:
          name: test-artifacts
          path: artifacts/
```

#### 4. Додати кращі репорти
- Allure репортер для детальних звітів
- HTML репорти з screenshots
- Інтеграція з тест-трекінг системами

#### 5. Додати паралельність
```javascript
// В конфігурації:
maxInstances: 3,
capabilities: [
    { deviceName: 'iPhone 15 Pro', platformVersion: '17.4' },
    { deviceName: 'iPhone 14', platformVersion: '17.0' },
    { deviceName: 'iPhone 13', platformVersion: '16.0' }
]
```

---

## Підсумок

### Поточний стан проєкту
- ✅ **Базові iOS тести працюють** — 10 тестів покривають основні сценарії
- ✅ **Використовується сучасний стек** — Appium + WebdriverIO + XCUITest
- ✅ **Є базові хелпери** — централізовані функції для роботи з елементами
- ⚠️ **Технічний борг** — хардкоджені значення, нестабільні селектори, хардкоджені паузи
- ❌ **Відсутня CI/CD** — немає автоматизації запуску тестів
- ❌ **Обмежене покриття** — тільки авторизація та один документ

### Пріоритетні напрямки для покращення
1. **Стабільність** — замінити паузи на explicit waits, покращити селектори
2. **Архітектура** — розділити helper-функції, додати Page Object Pattern
3. **CI/CD** — налаштувати автоматичний запуск тестів
4. **Покриття** — додати більше тестів для інших функцій додатку
5. **Документація** — покращити документацію для онбордингу нових QA

---

**Дата аналізу**: 2024  
**Версія документа**: 1.0  
**Автор аналізу**: AI Assistant
