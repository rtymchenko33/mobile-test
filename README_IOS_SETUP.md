# Підсумок налаштування iOS інфраструктури

## ✅ Виконано

1. **Встановлено npm залежності**
   - Всі необхідні пакети з `package.json` встановлено
   - `appium-xcuitest-driver` додано та встановлено

2. **Встановлено Appium XCUITest Driver**
   - Драйвер для iOS тестування встановлено та готовий до використання

3. **Перевірено Xcode**
   - Xcode знайдено в `/Applications/Xcode.app`

4. **Додано iOS конфігурацію**
   - Приклад iOS capability додано в `wdio.conf.js` (закоментований, готовий до використання)

5. **Створено документацію**
   - `SETUP_IOS.md` - детальні інструкції з налаштування
   - `setup-ios.sh` - скрипт для автоматичного налаштування

## 🔧 Наступні кроки (потрібно виконати вручну)

### 1. Налаштувати Xcode Command Line Tools

Виконайте в терміналі (потрібен пароль адміністратора):

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

### 2. Перевірити налаштування

Запустіть скрипт налаштування:

```bash
./setup-ios.sh
```

Або вручну перевірте:

```bash
xcodebuild -version
xcrun simctl list devices available
```

### 3. Встановити CocoaPods (опціонально, для iOS проекту)

```bash
brew install cocoapods
# або
sudo gem install cocoapods
```

### 4. Збудувати iOS додаток

Відкрийте iOS проект в Xcode та збудуйте для симулятора:

```bash
cd /Users/romantimchenko/diia-open-source/ios-diia
open DiiaOpenSource.xcodeproj
```

В Xcode:
- Виберіть симулятор (наприклад, iPhone 15)
- Натисніть Product → Build (⌘B)

Або через командний рядок:

```bash
xcodebuild -project DiiaOpenSource.xcodeproj \
           -scheme DiiaDev \
           -sdk iphonesimulator \
           -configuration Debug \
           -derivedDataPath ./build
```

Шлях до зібраного .app файлу буде приблизно:
`./build/Build/Products/Debug-iphonesimulator/DiiaOpenSource.app`

### 5. Налаштувати wdio.conf.js для iOS

Розкоментуйте iOS capability в `wdio.conf.js` та вкажіть правильний шлях до .app файлу:

```javascript
capabilities: [{
    platformName: 'iOS',
    'appium:deviceName': 'iPhone 15',
    'appium:platformVersion': '17.0',
    'appium:automationName': 'XCUITest',
    'appium:app': path.resolve('/повний/шлях/до/DiiaOpenSource.app'),
    'appium:bundleId': 'ua.gov.diia.opensource.app',
    'appium:noReset': false
}],
```

### 6. Запустити тести

```bash
npm run wdio
```

## 📚 Документація

- Детальні інструкції: `SETUP_IOS.md`
- Скрипт налаштування: `setup-ios.sh`
- iOS проект: `/Users/romantimchenko/diia-open-source/ios-diia`

## ⚠️ Важливо

- Xcode Command Line Tools **обов'язково** потрібно налаштувати через `sudo xcode-select`
- Потрібно прийняти ліцензію Xcode
- iOS додаток потрібно збудувати перед тестуванням
- Bundle ID: `ua.gov.diia.opensource.app` (з DiiaDev.xcconfig)
