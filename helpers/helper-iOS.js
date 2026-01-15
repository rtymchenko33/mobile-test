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
        // Спочатку активуємо чекбокс згоди з обробкою персональних даних
        const checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
        await checkbox.waitForDisplayed({ timeout: 15000 });
        await expect(checkbox).toBeDisplayed();

        const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
        await expect(loginWithNBU).toBeDisplayed();
        await loginWithNBU.click();
        
        // Даємо час на завантаження WebView
        await driver.pause(2000);

        // Знаходимо кнопку Банк НаДія
        // ⚠️ У кнопки немає accessibilityIdentifier, використовуємо пошук по тексту
        // Кнопка з'являється в WebView після кліку на BankID НБУ
        const bankNadiia = getElementByText('Банк НаДія');
        // await bankNadiia.waitForDisplayed({ timeout: 15000 });
        await expect(bankNadiia).toBeDisplayed();
        await bankNadiia.click();

        // Вводимо токен в поле вводу
        let tokenInput;
        try {
            // Спочатку спробуємо знайти по accessibilityIdentifier (якщо буде додано)
            tokenInput = getElementByAccessibilityId('tokenInputField');
            await tokenInput.waitForDisplayed({ timeout: 2000 });
        } catch (e) {
            // Fallback: використовуємо Predicate String
            tokenInput = getElementByPredicate('type == "XCUIElementTypeTextField" AND enabled == true AND visible == true');
            await tokenInput.waitForDisplayed({ timeout: 15000 });
        }
        await expect(tokenInput).toBeDisplayed();
        await tokenInput.click();
        await tokenInput.setValue('B7B5908CFBA2DBDA1BE9');

        // Знаходимо кнопку SignIn
        const signinBtn = getElementByAccessibilityId('SignIn');
        await expect(signinBtn).toBeDisplayed();
        await signinBtn.click();
        
        // Даємо час на обробку авторизації
        await driver.pause(2000);

        // Знаходимо кнопку Далі
        // Використовуємо Class Chain по name, оскільки це XCUIElementTypeButton з name="Далі"
        const nextBtn = getElementByClassChain('Button', 'name == "Далі"');
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
            await codeScreenHeader.waitForDisplayed({ timeout: 5000 });
        } catch (e) {
            // Якщо екран введення PIN коду не з'явився, виконуємо restart() і чекаємо на екран
            await restart();
            const codeScreenHeaderAfterRestart = getElementByXPath('//XCUIElementTypeStaticText[contains(@label, "Код для входу")] | //XCUIElementTypeStaticText[contains(@label, "код з 4 цифр")]');
            await codeScreenHeaderAfterRestart.waitForDisplayed({ timeout: 15000 });
        }

        const forgotCodeBtn = getElementByText("Не пам'ятаю код для входу");
        await forgotCodeBtn.waitForDisplayed({ timeout: 10000 });
        await forgotCodeBtn.click();

        // Додаємо невелику паузу для появи діалогового вікна
        await driver.pause(2000);

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
        await confirmAuthorize.click();
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

        // Даємо час на закриття додатку
        await driver.pause(1000);

        await driver.execute('mobile: activateApp', { 
            bundleId: 'ua.gov.diia.opensource.app'
        });

        // Даємо час на запуск додатку
        await driver.pause(2000);
    });
}

/**
 * Введення PIN коду
 */
async function enterPinCode(codeDigit) {
    return withLog('enterPinCode', `codeDigit=${codeDigit}`, async () => {
        // Для iOS шукаємо кнопку з текстом цифри
        const codeButton = getElementByText(`${codeDigit}`);
        await codeButton.waitForDisplayed({ timeout: 5000 });
        
        for (let i = 0; i < 4; i++) {
            await codeButton.click();
        }
    });
}

// ASSERTIONS

/**
 * Перевірка привітання
 */
async function assertGreeting() {
    return withLog('assertGreeting', '', async () => {
        // Спочатку шукаємо по accessibilityId
        const greeting = getElementByAccessibilityId('Привіт, Віктор 👋');
        try {
            await greeting.waitForDisplayed({ timeout: 30000 });
            await expect(greeting).toBeDisplayed();
            return;
        } catch (e) {
            // Фолбек: точний match по name/label/value зі скріншоту інспектора
            try {
                const greetingExact = getElementByPredicate(
                    'label == "Привіт, Віктор 👋" OR name == "Привіт, Віктор 👋" OR value == "Привіт, Віктор 👋"'
                );
                await greetingExact.waitForDisplayed({ timeout: 30000 });
                await expect(greetingExact).toBeDisplayed();
                return;
            } catch (err) {
                // Фолбек: шукаємо будь-який текст з "Привіт" (інше ім'я/емодзі/пробіли)
                const greetingPredicate = getElementByPredicate('label CONTAINS "Привіт" OR name CONTAINS "Привіт"');
                await greetingPredicate.waitForDisplayed({ timeout: 30000 });
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
