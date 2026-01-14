# 🔍 Витягування селекторів з Open-Source проєкту

Цей скрипт дозволяє автоматично витягти всі селектори (accessibility identifiers, content descriptions, test IDs тощо) з open-source мобільного додатку.

## 📋 Що витягується

### iOS (Swift/Objective-C)
- ✅ **Accessibility Identifiers** - найкращі для тестування
- 📝 Accessibility Labels
- 💡 Accessibility Hints

### Android (Kotlin/Java/XML)
- ✅ **Content Descriptions** - найкращі для тестування
- 🆔 Resource IDs (`android:id`)
- 🏷️ Test Tags (для React Native)

### React Native (JS/TS/JSX/TSX)
- ✅ **Test IDs** - найкращі для тестування
- 📝 Accessibility Labels

## 🚀 Використання

### Варіант 1: Node.js скрипт

```bash
# Витягти селектори для iOS
node scripts/extract-selectors.js /path/to/ios-app --platform ios

# Витягти селектори для Android
node scripts/extract-selectors.js /path/to/android-app --platform android

# Витягти для обох платформ
node scripts/extract-selectors.js /path/to/app --platform both
```

### Варіант 2: Bash скрипт

```bash
# Витягти селектори
./scripts/extract-selectors.sh /path/to/app ios
./scripts/extract-selectors.sh /path/to/app android
./scripts/extract-selectors.sh /path/to/app both
```

## 📝 Приклади

### Приклад 1: Дія Android проєкт

```bash
# Якщо ви клонували репозиторій поруч з mobile-test
cd mobile-test
node scripts/extract-selectors.js ../android-diia --platform android
```

### Приклад 2: Дія iOS проєкт

```bash
cd mobile-test
node scripts/extract-selectors.js ../ios-diia --platform ios
```

### Приклад 3: React Native проєкт

```bash
cd mobile-test
node scripts/extract-selectors.js ../react-native-app --platform both
```

## 📊 Результати

Скрипт створює два файли:

1. **`extracted-selectors.json`** - JSON файл з усіма знайденими селекторами
2. **`selectors.js`** - JavaScript модуль з селекторами для використання в тестах

### Структура JSON файлу:

```json
{
  "sourcePath": "/path/to/app",
  "platform": "android",
  "extractedAt": "2024-01-15T10:30:00.000Z",
  "ios": {
    "accessibilityIdentifiers": ["button_login", "input_email"],
    "accessibilityLabels": ["Sign In", "Email"]
  },
  "android": {
    "contentDescriptions": ["Login button", "Email input"],
    "resourceIds": ["btn_login", "et_email"],
    "testTags": []
  },
  "reactNative": {
    "testIDs": ["loginButton", "emailInput"],
    "accessibilityLabels": []
  }
}
```

## 💡 Використання в тестах

Після витягування селекторів, ви можете використовувати їх у ваших тестах:

```javascript
// В helper-iOS.js або helper.js
const SELECTORS = require('./selectors');

// Використання
const loginButton = getElementByAccessibilityId(SELECTORS.ios.accessibilityIdentifiers[0]);
```

## ⚙️ Налаштування

Скрипт автоматично пропускає:
- `.git` директорії
- `node_modules`
- `build` та `dist` директорії
- Файли, що починаються з `.`

## 🔧 Розширення функціональності

Якщо потрібно додати підтримку інших фреймворків або форматів, відредагуйте `extract-selectors.js`:

1. Додайте нові регулярні вирази для пошуку селекторів
2. Додайте нові типи файлів у функцію `findFiles`
3. Створіть нову функцію `extract<Framework>Selectors`

## 📚 Додаткові ресурси

- [Appium Selectors Best Practices](https://appium.io/docs/en/2.1/guides/selectors/)
- [iOS Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

## ⚠️ Важливо

1. **Accessibility Identifiers/Content Descriptions** - найкращі для тестування, оскільки:
   - Не залежать від UI змін
   - Швидкі та стабільні
   - Призначені саме для автоматизації

2. **Labels/Text** - менш надійні, оскільки:
   - Можуть змінюватися при локалізації
   - Залежать від UI дизайну

3. **XPath** - уникайте, якщо можливо:
   - Повільні
   - Менш стабільні
   - Складні у підтримці

## 🐛 Troubleshooting

### Помилка: "Шлях не існує"
Переконайтеся, що ви вказали правильний шлях до проєкту.

### Не знайдено селекторів
- Перевірте, чи проєкт містить файли з підтримуваними розширеннями
- Переконайтеся, що селектори дійсно присутні в коді
- Деякі селектори можуть генеруватися динамічно

### Повільна робота
Скрипт обробляє всі файли рекурсивно. Для великих проєктів це може зайняти час.
