const { driver, expect } = require('@wdio/globals')

const LOG_PREFIX = '[iOS]';
const COLOR_GREEN = '\x1b[32m';
const COLOR_RED = '\x1b[31m';
const COLOR_RESET = '\x1b[0m';

function logStep(name, details = '') {
    const suffix = details ? ` | ${details}` : '';
    console.log(`${LOG_PREFIX} ${name}${suffix}`);
}

function logSuccess(name, details = '') {
    const suffix = details ? ` | ${details}` : '';
    console.log(`${COLOR_GREEN}${LOG_PREFIX} ${name} OK${suffix}${COLOR_RESET}`);
}

function logError(name, details = '', error) {
    const suffix = details ? ` | ${details}` : '';
    const message = error && error.message ? ` | ${error.message}` : '';
    console.log(`${COLOR_RED}${LOG_PREFIX} ${name} FAILED${suffix}${message}${COLOR_RESET}`);
}

async function withLog(name, details, fn) {
    logStep(name, details);
    try {
        const result = await fn();
        logSuccess(name, details);
        return result;
    } catch (error) {
        logError(name, details, error);
        throw error;
    }
}

/**
 * НАЙКРАЩІ ПРАКТИКИ ДЛЯ СЕЛЕКТОРІВ iOS/XCUITest (Appium)
 * 
 * Пріоритет використання (від найкращого до найгіршого):
 * 
 * 1. ✅ Accessibility ID (accessibilityIdentifier)
 *    - Найшвидший та найстабільніший
 *    - Не залежить від UI змін
 *    - Приклад: getElementByAccessibilityId('myButtonId')
 * 
 * 2. ✅ Class Chain (-ios class chain)
 *    - Швидкий, нативний для iOS
 *    - Краще за XPath для iOS
 *    - Приклад: getElementByClassChain('Button', 'name == "SignIn"')
 * 
 * 3. ✅ Predicate String (-ios predicate string)
 *    - Швидкий, гнучкий для складних умов
 *    - Приклад: getElementByPredicate('name == "tokenInputField" AND type == "XCUIElementTypeTextField"')
 * 
 * 4. ⚠️ XPath
 *    - Повільний, менш стабільний
 *    - Використовуйте тільки якщо інші не підходять
 *    - Приклад: getElementByXPath('//XCUIElementTypeButton[@name="SignIn"]')
 * 
 * ⚠️ НЕ використовуйте XCUIElementTypeTextField як селектор напряму!
 *    Це тип елемента, а не селектор. Використовуйте Accessibility ID або Class Chain.
 */

// SELECTOR OPTIONS для iOS (XCUITest)

/**
 * Отримати елемент по тексту (XCUIElementTypeStaticText або XCUIElementTypeButton)
 * Використовує contains для більш гнучкого пошуку
 */
function getElementByText(text) {
    logStep('getElementByText', `text="${text}"`);
    // Використовуємо XPath з contains для пошуку по label або value (нечутливо до пробілів)
    const normalizedText = text.trim();
    return $(`//XCUIElementTypeStaticText[contains(@label, "${normalizedText}")] | //XCUIElementTypeButton[contains(@label, "${normalizedText}")]`);
}

/**
 * Отримати елемент по Accessibility ID
 */
function getElementByAccessibilityId(accessibilityId) {
    logStep('getElementByAccessibilityId', `id="${accessibilityId}"`);
    return driver.$(`~${accessibilityId}`);
}

/**
 * Отримати елемент по XPath
 * ⚠️ Уникайте XPath, використовуйте Class Chain або Predicate String замість цього
 */
function getElementByXPath(xpath) {
    logStep('getElementByXPath', `xpath="${xpath}"`);
    return driver.$(xpath);
}

/**
 * Отримати елемент по Class Chain (рекомендовано для iOS)
 * Швидший та стабільніший за XPath
 */
function getElementByClassChain(elementType, predicate = '') {
    logStep('getElementByClassChain', `type="${elementType}" predicate="${predicate}"`);
    if (predicate) {
        return driver.$(`-ios class chain:**/XCUIElementType${elementType}[\`${predicate}\`]`);
    }
    return driver.$(`-ios class chain:**/XCUIElementType${elementType}`);
}

/**
 * Отримати елемент по Predicate String (рекомендовано для iOS)
 * Швидший та гнучкіший за XPath
 */
function getElementByPredicate(predicate) {
    logStep('getElementByPredicate', `predicate="${predicate}"`);
    return driver.$(`-ios predicate string:${predicate}`);
}

/**
 * Отримати елемент по типу та тексту
 * ⚠️ Застаріло - використовуйте getElementByClassChain замість цього
 */
function getElementByTypeAndText(elementType, text) {
    logStep('getElementByTypeAndText', `type="${elementType}" text="${text}"`);
    return driver.$(`//XCUIElementType${elementType}[@label="${text}"]`);
}

// FLOWS

/**
 * Авторизація в додатку
 */
async function authorize(codeDigit) {
    return withLog('authorize', `codeDigit=${codeDigit}`, async () => {
        // Очікуємо повного завантаження екрану авторизації
        // Спочатку пробуємо знайти чекбокс, якщо не виходить - пробуємо кнопку BankID
        let checkbox;
        try {
            checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
            await checkbox.waitForDisplayed({ timeout: 20000 });
        } catch (e) {
            // Якщо чекбокс не знайдено, пробуємо знайти кнопку BankID (екран може бути вже завантажений)
            const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
            await loginWithNBU.waitForDisplayed({ timeout: 20000 });
            // Якщо знайшли кнопку, пробуємо знайти чекбокс ще раз
            checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
            await checkbox.waitForDisplayed({ timeout: 5000 });
        }

        // Спочатку активуємо чекбокс згоди з обробкою персональних даних
        await expect(checkbox).toBeDisplayed();

        const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
        await expect(loginWithNBU).toBeDisplayed();
        await loginWithNBU.click();
        
        // Очікуємо завантаження WebView - перевіряємо появу кнопки "Банк НаДія"
        const bankNadiia = getElementByText('Банк НаДія');
        await bankNadiia.waitForDisplayed({ timeout: 15000 });
        await expect(bankNadiia).toBeDisplayed();
        await bankNadiia.click();

        // Вводимо токен в поле вводу
        const TOKEN = 'B7B5908CFBA2DBDA1BE9';
        console.log(`[DEBUG] authorize() | Початок введення токену: ${TOKEN} (довжина: ${TOKEN.length})`);
        
        let tokenInput;
        try {
            // Спочатку спробуємо знайти по accessibilityIdentifier (якщо буде додано)
            tokenInput = getElementByAccessibilityId('tokenInputField');
            await tokenInput.waitForDisplayed({ timeout: 200 });
            console.log(`[DEBUG] authorize() | Знайдено поле по accessibilityIdentifier: tokenInputField`);
        } catch (e) {
            // Fallback: використовуємо Predicate String
            tokenInput = getElementByPredicate('type == "XCUIElementTypeTextField" AND enabled == true AND visible == true');
            await tokenInput.waitForDisplayed({ timeout: 1500 });
            console.log(`[DEBUG] authorize() | Знайдено поле по Predicate String (fallback)`);
        }
        await expect(tokenInput).toBeDisplayed();
        
        // Перевіряємо початковий стан поля
        try {
            const initialValue = await tokenInput.getValue();
            console.log(`[DEBUG] authorize() | Початкове значення поля: "${initialValue}"`);
        } catch (e) {
            console.log(`[DEBUG] authorize() | Не вдалося отримати початкове значення поля: ${e.message}`);
        }
        
        // Очищаємо поле перед введенням
        try {
            await tokenInput.click();
            await driver.pause(100);
            // Для iOS clear() може не працювати, використовуємо альтернативний метод
            try {
                await tokenInput.clear();
                console.log(`[DEBUG] authorize() | Поле очищено через clear()`);
            } catch (clearError) {
                // Альтернативний метод: встановлюємо порожнє значення
                await tokenInput.setValue('');
                await driver.pause(100);
                console.log(`[DEBUG] authorize() | Поле очищено через setValue('')`);
            }
        } catch (e) {
            console.log(`[DEBUG] authorize() | Помилка при очищенні поля: ${e.message}`);
        }
        
        // Вводимо токен
        console.log(`[DEBUG] authorize() | Введення токену через setValue(): ${TOKEN}`);
        await tokenInput.setValue(TOKEN);
        
        // Очікуємо, що токен введено - перевіряємо значення поля
        await driver.waitUntil(
            async () => {
                try {
                    const enteredValue = await tokenInput.getValue();
                    return enteredValue && enteredValue.length > 0;
                } catch (e) {
                    return false;
                }
            },
            { timeout: 5000, timeoutMsg: 'Token was not entered' }
        );
        
        // Перевіряємо, що саме введено в поле
        try {
            const enteredValue = await tokenInput.getValue();
            console.log(`[DEBUG] authorize() | Значення після setValue(): "${enteredValue}" (довжина: ${enteredValue ? enteredValue.length : 0})`);
            
            if (enteredValue !== TOKEN) {
                console.log(`[WARNING] authorize() | Токен обрізано! Очікувано: "${TOKEN}", отримано: "${enteredValue}"`);
                console.log(`[WARNING] authorize() | Відсутні символи: "${TOKEN.replace(enteredValue, '')}"`);
                
                // Спробуємо ввести токен посимвольно
                console.log(`[DEBUG] authorize() | Спроба введення посимвольно...`);
                await tokenInput.clear();
                await driver.pause(200);
                
                for (let i = 0; i < TOKEN.length; i++) {
                    await tokenInput.addValue(TOKEN[i]);
                    await driver.pause(50);
                }
                await driver.pause(500);
                
                const valueAfterCharByChar = await tokenInput.getValue();
                console.log(`[DEBUG] authorize() | Значення після посимвольного введення: "${valueAfterCharByChar}" (довжина: ${valueAfterCharByChar ? valueAfterCharByChar.length : 0})`);
            } else {
                console.log(`[DEBUG] authorize() | Токен введено коректно!`);
            }
        } catch (e) {
            console.log(`[DEBUG] authorize() | Помилка при отриманні значення після введення: ${e.message}`);
        }

        // Знаходимо кнопку SignIn
        const signinBtn = getElementByAccessibilityId('SignIn');
        await expect(signinBtn).toBeDisplayed();
        await signinBtn.click();
        
        // Очікуємо завершення обробки авторизації - перевіряємо появу кнопки "Далі"
        const nextBtn = getElementByClassChain('Button', 'name == "Далі"');
        await nextBtn.waitForDisplayed({ timeout: 60000 });
        await expect(nextBtn).toBeDisplayed();
        await nextBtn.click();
        
        // Перевіряємо екран введення коду
        const codeScreenHeader = getElementByAccessibilityId('title_pincreate');
        await expect(codeScreenHeader).toBeDisplayed();
        await enterPinCode(codeDigit);
        
        // Чекаємо на екран повторного введення коду
        // У page source: name="title_pinconfirm" (не title_pinrepeat!)
        const repeatCodeScreenHeader = getElementByAccessibilityId('title_pinconfirm');
        await repeatCodeScreenHeader.waitForDisplayed({ timeout: 1000 });
        await expect(repeatCodeScreenHeader).toBeDisplayed();
        await enterPinCode(codeDigit);
    });
}

/**
 * Функція "Забув код"
 * Перевіряє, чи є екран введення PIN коду, і якщо ні - спочатку авторизується
 */
async function forgotCode() {
    return withLog('forgotCode', '', async () => {
        // Перевіряємо, чи є екран введення PIN коду
        // Якщо ні, то виконуємо restart() і чекаємо на появу екрану введення PIN коду
        try {
            const codeScreenHeader = getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")] | //XCUIElementTypeStaticText[contains(@label, "код з 4 цифр")]');
            await codeScreenHeader.waitForDisplayed({ timeout: 500 });
        } catch (e) {
            // Якщо екран введення PIN коду не з'явився, виконуємо restart() і чекаємо на екран
            await restart();
            const codeScreenHeaderAfterRestart = getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")] | //XCUIElementTypeStaticText[contains(@label, "код з 4 цифр")]');
            await codeScreenHeaderAfterRestart.waitForDisplayed({ timeout: 1500 });
        }

        const forgotCodeBtn = getElementByText("Не пам'ятаю код для входу");
        await forgotCodeBtn.waitForDisplayed({ timeout: 10000 });
        await forgotCodeBtn.click();

        // Використовуємо Class Chain для надійного пошуку кнопки "Авторизуватися"
        // Кнопка має type: XCUIElementTypeButton, name: "Авторизуватися"
        // Спочатку пробуємо з простим пошуком по name
        let confirmAuthorize;
        try {
            confirmAuthorize = getElementByClassChain('Button', 'name == "Авторизуватися"');
            await confirmAuthorize.waitForDisplayed({ timeout: 15000 });
        } catch (e) {
            // Fallback: використовуємо Predicate String якщо Class Chain не спрацював
            confirmAuthorize = getElementByPredicate('type == "XCUIElementTypeButton" AND name == "Авторизуватися" AND enabled == true');
            await confirmAuthorize.waitForDisplayed({ timeout: 15000 });
        }
        console.log(`[DEBUG] forgotCode() | Клік на кнопку "Авторизуватися"`);
        await confirmAuthorize.click();
        
        // Очікуємо перехід на екран авторизації - спочатку пробуємо знайти чекбокс
        try {
            const checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
            await checkbox.waitForDisplayed({ timeout: 10000 });
            console.log(`[DEBUG] forgotCode() | Екран авторизації завантажено (знайдено чекбокс)`);
        } catch (e) {
            // Якщо чекбокс не знайдено, пробуємо знайти кнопку BankID
            try {
                const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
                await loginWithNBU.waitForDisplayed({ timeout: 10000 });
                console.log(`[DEBUG] forgotCode() | Екран авторизації завантажено (знайдено кнопку BankID)`);
            } catch (e2) {
                // Якщо нічого не знайдено, це не критично - authorize() сам перевірить
                console.log(`[DEBUG] forgotCode() | Елементи екрану авторизації не знайдено, але це нормально`);
            }
        }
        
        // Перевіряємо, чи є поле вводу токену на екрані (можливо воно вже відкрите)
        try {
            const tokenInputCheck = getElementByAccessibilityId('tokenInputField');
            const isTokenFieldVisible = await tokenInputCheck.isDisplayed();
            console.log(`[DEBUG] forgotCode() | Поле tokenInputField видиме: ${isTokenFieldVisible}`);
            if (isTokenFieldVisible) {
                const tokenValue = await tokenInputCheck.getValue();
                console.log(`[DEBUG] forgotCode() | Поточне значення в полі токену: "${tokenValue}"`);
            }
        } catch (e) {
            console.log(`[DEBUG] forgotCode() | Поле tokenInputField не знайдено (це нормально, воно з'явиться після кліку на BankID)`);
        }
    });
}

/**
 * Логін в додаток
 */
async function login(codeDigit) {
    return withLog('login', `codeDigit=${codeDigit}`, async () => {
        // Використовуємо accessibility identifier або XPath для пошуку заголовка
        const codeScreenHeader = getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")] | //XCUIElementTypeStaticText[contains(@label, "код з 4 цифр")]');
        await codeScreenHeader.waitForDisplayed({ timeout: 10000 });
        await expect(codeScreenHeader).toBeDisplayed();

        await enterPinCode(codeDigit);
    });
}

/**
 * Перезапуск додатку
 */
async function restart() {
    return withLog('restart', '', async () => {
        await driver.execute('mobile: terminateApp', {
            bundleId: 'ua.gov.diia.opensource.app'
        });

        // Невелика пауза для закриття додатку
        await driver.pause(1000);

        await driver.execute('mobile: activateApp', { 
            bundleId: 'ua.gov.diia.opensource.app'
        });

        // Очікуємо завантаження додатку - перевіряємо появу стартового екрану
        // Може бути або екран авторизації (з чекбоксом), або екран введення PIN
        // Використовуємо waitUntil для більш гнучкого очікування
        await driver.waitUntil(
            async () => {
                // Спочатку пробуємо знайти екран введення PIN (частіший випадок після restart)
                try {
                    const pinScreen = getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")] | //XCUIElementTypeStaticText[contains(@label, "код з 4 цифр")]');
                    if (await pinScreen.isDisplayed()) {
                        return true;
                    }
                } catch (e) {
                    // Якщо екран PIN не знайдено, пробуємо знайти екран авторизації
                    try {
                        const checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
                        if (await checkbox.isDisplayed()) {
                            return true;
                        }
                    } catch (e2) {
                        // Якщо і це не спрацювало, пробуємо кнопку BankID
                        try {
                            const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
                            return await loginWithNBU.isDisplayed();
                        } catch (e3) {
                            return false;
                        }
                    }
                }
                return false;
            },
            { timeout: 20000, timeoutMsg: 'App did not load after restart' }
        );
    });
}

/**
 * Введення PIN коду
 */
async function enterPinCode(codeDigit) {
    return withLog('enterPinCode', `codeDigit=${codeDigit}`, async () => {
        // Перевіряємо, що екран введення PIN активний
        // Можемо перевірити наявність заголовка екрану
        try {
            const pinCreateHeader = getElementByAccessibilityId('title_pincreate');
            await pinCreateHeader.waitForDisplayed({ timeout: 2000 });
        } catch (e) {
            // Можливо це екран підтвердження або входу
            try {
                const pinConfirmHeader = getElementByAccessibilityId('title_pinconfirm');
                await pinConfirmHeader.waitForDisplayed({ timeout: 2000 });
            } catch (e2) {
                // Або екран входу
                const pinLoginHeader = getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")] | //XCUIElementTypeStaticText[contains(@label, "код з 4 цифр")]');
                await pinLoginHeader.waitForDisplayed({ timeout: 2000 });
            }
        }

        // Для iOS шукаємо кнопку з текстом цифри
        const codeButton = getElementByText(`${codeDigit}`);
        await codeButton.waitForDisplayed({ timeout: 5000 });
        
        for (let i = 0; i < 4; i++) {
            await codeButton.click();
            // Невелика пауза між кліками для стабільності
            await driver.pause(100);
        }
    });
}

// ASSERTIONS

/**
 * Перевірка привітання
 */
async function assertGreeting() {
    return withLog('assertGreeting', '', async () => {
        // Спочатку перевіряємо, що головний екран завантажився
        // Використовуємо waitUntil для гнучкого очікування появи будь-якого елемента головного екрану
        let greetingFound = false;
        await driver.waitUntil(
            async () => {
                // Перевіряємо наявність меню (якщо меню є, головний екран завантажився)
                try {
                    const menuBtn = getElementByAccessibilityId('menuSettingsInactive');
                    if (await menuBtn.isDisplayed()) {
                        return true;
                    }
                } catch (e) {
                    // Якщо меню не знайдено, пробуємо знайти привітання
                    try {
                        const greeting = getElementByAccessibilityId('Привіт, Віктор 👋');
                        if (await greeting.isDisplayed()) {
                            greetingFound = true;
                            return true;
                        }
                    } catch (e2) {
                        // Спробуємо знайти привітання через predicate
                        try {
                            const greetingPredicate = getElementByPredicate('label CONTAINS "Привіт" OR name CONTAINS "Привіт"');
                            if (await greetingPredicate.isDisplayed()) {
                                greetingFound = true;
                                return true;
                            }
                        } catch (e3) {
                            return false;
                        }
                    }
                }
                return false;
            },
            { timeout: 30000, timeoutMsg: 'Main screen did not load after authorization' }
        );

        // Якщо привітання вже знайдено в waitUntil, просто перевіряємо його
        if (greetingFound) {
            const greeting = getElementByAccessibilityId('Привіт, Віктор 👋');
            try {
                await expect(greeting).toBeDisplayed();
                return;
            } catch (e) {
                // Якщо не знайдено по accessibilityId, пробуємо predicate
                const greetingPredicate = getElementByPredicate('label CONTAINS "Привіт" OR name CONTAINS "Привіт"');
                await expect(greetingPredicate).toBeDisplayed();
                return;
            }
        }

        // Якщо привітання не знайдено в waitUntil, шукаємо його явно
        const greeting = getElementByAccessibilityId('Привіт, Віктор 👋');
        try {
            await greeting.waitForDisplayed({ timeout: 10000 });
            await expect(greeting).toBeDisplayed();
            return;
        } catch (e) {
            // Фолбек: точний match по name/label/value
            try {
                const greetingExact = getElementByPredicate(
                    'label == "Привіт, Віктор 👋" OR name == "Привіт, Віктор 👋" OR value == "Привіт, Віктор 👋"'
                );
                await greetingExact.waitForDisplayed({ timeout: 10000 });
                await expect(greetingExact).toBeDisplayed();
                return;
            } catch (err) {
                // Фолбек: шукаємо будь-який текст з "Привіт"
                const greetingPredicate = getElementByPredicate('label CONTAINS "Привіт" OR name CONTAINS "Привіт"');
                await greetingPredicate.waitForDisplayed({ timeout: 10000 });
                await expect(greetingPredicate).toBeDisplayed();
            }
        }
    });
}

/**
 * Перевірка popup
 */
async function assertPopup(title = '', msg = '') {
    return withLog('assertPopup', `title="${title}" msg="${msg}"`, async () => {
        if (title) {
            // First try accessibility id
            try {
                const popupTitleById = getElementByAccessibilityId(title);
                await popupTitleById.waitForDisplayed({ timeout: 5000 });
                await expect(popupTitleById).toBeDisplayed();
            } catch (e) {
                // Fallback to exact match on name/label/value
                const popupTitle = getElementByPredicate(
                    `label == "${title}" OR name == "${title}" OR value == "${title}"`
                );
                try {
                    await popupTitle.waitForDisplayed({ timeout: 10000 });
                    await expect(popupTitle).toBeDisplayed();
                } catch (e2) {
                    const popupTitleFallback = getElementByText(title);
                    await popupTitleFallback.waitForDisplayed({ timeout: 10000 });
                    await expect(popupTitleFallback).toBeDisplayed();
                }
            }
        }

        if (msg) {
            // First try accessibility id
            try {
                const popupMsgById = getElementByAccessibilityId(msg);
                await popupMsgById.waitForDisplayed({ timeout: 5000 });
                await expect(popupMsgById).toBeDisplayed();
            } catch (e) {
                // Fallback to exact match on name/label/value
                const popupMsg = getElementByPredicate(
                    `label == "${msg}" OR name == "${msg}" OR value == "${msg}"`
                );
                try {
                    await popupMsg.waitForDisplayed({ timeout: 10000 });
                    await expect(popupMsg).toBeDisplayed();
                } catch (e2) {
                    const popupMsgFallback = getElementByText(msg);
                    await popupMsgFallback.waitForDisplayed({ timeout: 10000 });
                    await expect(popupMsgFallback).toBeDisplayed();
                }
            }
        }
    });
}

// OTHER

/**
 * Прокрутка до елемента (для iOS)
 */
async function scrollToElement(element, direction = 'down') {
    return withLog('scrollToElement', `direction="${direction}"`, async () => {
        await driver.execute('mobile: scroll', {
            direction: direction,
            element: element
        });
    });
}

/**
 * Знайти TextView по тексту (для iOS)
 */
async function findTextViewByText(container, expectedText, normalizeNewlines = true) {
    return withLog('findTextViewByText', `expectedText="${expectedText}" normalizeNewlines=${normalizeNewlines}`, async () => {
        const textViews = await container.$$('XCUIElementTypeStaticText');
        
        for (const textView of textViews) {
            const text = await textView.getText();
            const normalizedText = normalizeNewlines ? text.replace(/\n/g, ' ').trim() : text.trim();
            const normalizedExpected = normalizeNewlines ? expectedText.replace(/\n/g, ' ').trim() : expectedText.trim();
            
            if (normalizedText === normalizedExpected) {
                return textView;
            }
        }
        
        throw new Error(`No StaticText found with text "${expectedText}" in container`);
    });
}

/**
 * Прокрутка контейнера до видимості елемента
 */
async function scrollContainerIntoView(accessibilityId) {
    return withLog('scrollContainerIntoView', `id="${accessibilityId}"`, async () => {
        // Для iOS спочатку спробуємо знайти елемент
        const container = getElementByAccessibilityId(accessibilityId);
        
        // Якщо не видимий, прокручуємо
        try {
            await container.waitForDisplayed({ timeout: 2000 });
        } catch (e) {
            // Прокручуємо вниз до знаходження елемента
            await driver.execute('mobile: scroll', {
                direction: 'down',
                predicateString: `name == "${accessibilityId}"`
            });
        }

        await container.waitForDisplayed({
            timeout: 30000,
            timeoutMsg: `Container ${accessibilityId} not visible`
        });

        return container;
    });
}

/**
 * Перевірка TextView з текстом
 */
async function assertTextView(accessibilityId, expectedText, normalizeNewlines = true) {
    return withLog('assertTextView', `id="${accessibilityId}" expectedText="${expectedText}" normalizeNewlines=${normalizeNewlines}`, async () => {
        const container = await scrollContainerIntoView(accessibilityId);

        await driver.waitUntil(
            async () => {
                const textViews = await container.$$('XCUIElementTypeStaticText');

                for (const tv of textViews) {
                    const actual = await tv.getText();

                    const a = normalizeNewlines
                        ? actual.replace(/\n/g, '').trim()
                        : actual.trim();

                    const e = normalizeNewlines
                        ? expectedText.replace(/\n/g, '').trim()
                        : expectedText.trim();

                    if (a === e) {
                        return await tv.isDisplayed();
                    }
                }
                return false;
            },
            {
                timeout: 20000,
                interval: 500,
                timeoutMsg: `Text "${expectedText}" not found in ${accessibilityId}`
            }
        );
    });
}

/**
 * Отримати контейнер по Accessibility ID
 */
async function getContainer(accessibilityId) {
    return withLog('getContainer', `id="${accessibilityId}"`, async () => {
        const container = getElementByAccessibilityId(accessibilityId);

        await container.waitForDisplayed({ 
            timeout: 10000,
            timeoutMsg: `Container ${accessibilityId} not found`
        });
        
        return container;
    });
}

module.exports = {
    getElementByText,
    getElementByAccessibilityId,
    getElementByXPath,
    getElementByClassChain,
    getElementByPredicate,
    getElementByTypeAndText,
    authorize,
    forgotCode,
    login,
    restart,
    enterPinCode,
    assertGreeting,
    assertPopup,
    scrollToElement,
    findTextViewByText,
    scrollContainerIntoView,
    assertTextView,
    getContainer
};
