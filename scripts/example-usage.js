/**
 * ПРИКЛАД ВИКОРИСТАННЯ ВИТЯГНУТИХ СЕЛЕКТОРІВ У ТЕСТАХ
 * 
 * Цей файл показує, як використовувати автоматично витягнуті селектори
 * у ваших тестах для покращення підтримуваності та стабільності.
 */

const { driver, expect } = require('@wdio/globals');

// Імпортуємо витягнуті селектори (якщо файл selectors.js існує)
let SELECTORS = {};
try {
    SELECTORS = require('../selectors');
} catch (e) {
    console.warn('⚠️  Файл selectors.js не знайдено. Запустіть extract-selectors.js спочатку.');
}

// Helper функції (з вашого helper-iOS.js або helper.js)
function getElementByAccessibilityId(accessibilityId) {
    return driver.$(`~${accessibilityId}`);
}

function getElementByText(text) {
    return $(`//XCUIElementTypeStaticText[contains(@label, "${text}")] | //XCUIElementTypeButton[contains(@label, "${text}")]`);
}

// ============================================
// ПРИКЛАД 1: Використання з константами
// ============================================

// Створюємо константи з селекторів для зручності
const SELECTOR_IDS = {
    // iOS
    ios: {
        LOGIN_BUTTON: SELECTORS.ios?.accessibilityIdentifiers?.find(id => id.includes('login')) || 'loginButton',
        EMAIL_INPUT: SELECTORS.ios?.accessibilityIdentifiers?.find(id => id.includes('email')) || 'emailInput',
        PASSWORD_INPUT: SELECTORS.ios?.accessibilityIdentifiers?.find(id => id.includes('password')) || 'passwordInput',
    },
    // Android
    android: {
        LOGIN_BUTTON: SELECTORS.android?.contentDescriptions?.find(desc => desc.includes('login')) || 'Login',
        EMAIL_INPUT: SELECTORS.android?.resourceIds?.find(id => id.includes('email')) || 'et_email',
        PASSWORD_INPUT: SELECTORS.android?.resourceIds?.find(id => id.includes('password')) || 'et_password',
    }
};

// Використання в тестах
async function loginExample(platform = 'ios') {
    const selectors = SELECTOR_IDS[platform];
    
    if (platform === 'ios') {
        const loginBtn = getElementByAccessibilityId(selectors.LOGIN_BUTTON);
        await expect(loginBtn).toBeDisplayed();
        await loginBtn.click();
    } else {
        const loginBtn = getElementByAccessibilityId(selectors.LOGIN_BUTTON);
        await expect(loginBtn).toBeDisplayed();
        await loginBtn.click();
    }
}

// ============================================
// ПРИКЛАД 2: Динамічне використання
// ============================================

/**
 * Знаходить елемент за частиною назви селектора
 */
function findSelectorByPartialName(partialName, platform = 'ios') {
    const selectors = platform === 'ios' 
        ? SELECTORS.ios?.accessibilityIdentifiers || []
        : SELECTORS.android?.contentDescriptions || [];
    
    const found = selectors.find(selector => 
        selector.toLowerCase().includes(partialName.toLowerCase())
    );
    
    return found || null;
}

// Використання
async function clickButtonByPartialName(partialName, platform = 'ios') {
    const selectorId = findSelectorByPartialName(partialName, platform);
    
    if (!selectorId) {
        throw new Error(`Селектор з "${partialName}" не знайдено`);
    }
    
    const element = getElementByAccessibilityId(selectorId);
    await expect(element).toBeDisplayed();
    await element.click();
}

// ============================================
// ПРИКЛАД 3: Створення Page Object з селекторами
// ============================================

class LoginPage {
    constructor(platform = 'ios') {
        this.platform = platform;
        this.selectors = this._loadSelectors();
    }
    
    _loadSelectors() {
        if (this.platform === 'ios') {
            return {
                loginButton: this._findSelector('login', SELECTORS.ios?.accessibilityIdentifiers),
                emailInput: this._findSelector('email', SELECTORS.ios?.accessibilityIdentifiers),
                passwordInput: this._findSelector('password', SELECTORS.ios?.accessibilityIdentifiers),
            };
        } else {
            return {
                loginButton: this._findSelector('login', SELECTORS.android?.contentDescriptions),
                emailInput: this._findSelector('email', SELECTORS.android?.resourceIds),
                passwordInput: this._findSelector('password', SELECTORS.android?.resourceIds),
            };
        }
    }
    
    _findSelector(keyword, selectorList) {
        if (!selectorList || selectorList.length === 0) {
            return null;
        }
        
        return selectorList.find(selector => 
            selector.toLowerCase().includes(keyword.toLowerCase())
        ) || null;
    }
    
    async clickLoginButton() {
        if (!this.selectors.loginButton) {
            throw new Error('Login button selector not found');
        }
        
        const button = getElementByAccessibilityId(this.selectors.loginButton);
        await expect(button).toBeDisplayed();
        await button.click();
    }
    
    async enterEmail(email) {
        if (!this.selectors.emailInput) {
            throw new Error('Email input selector not found');
        }
        
        const input = getElementByAccessibilityId(this.selectors.emailInput);
        await expect(input).toBeDisplayed();
        await input.setValue(email);
    }
}

// Використання Page Object
async function loginWithPageObject(platform = 'ios') {
    const loginPage = new LoginPage(platform);
    await loginPage.enterEmail('test@example.com');
    await loginPage.clickLoginButton();
}

// ============================================
// ПРИКЛАД 4: Валідація наявності селекторів
// ============================================

/**
 * Перевіряє, чи всі необхідні селектори присутні
 */
function validateRequiredSelectors(requiredSelectors, platform = 'ios') {
    const availableSelectors = platform === 'ios'
        ? SELECTORS.ios?.accessibilityIdentifiers || []
        : SELECTORS.android?.contentDescriptions || [];
    
    const missing = requiredSelectors.filter(required => 
        !availableSelectors.some(available => 
            available.toLowerCase().includes(required.toLowerCase())
        )
    );
    
    if (missing.length > 0) {
        console.warn(`⚠️  Відсутні селектори: ${missing.join(', ')}`);
        return false;
    }
    
    return true;
}

// Використання перед запуском тестів
const requiredSelectors = ['login', 'email', 'password'];
if (!validateRequiredSelectors(requiredSelectors, 'ios')) {
    console.error('❌ Деякі необхідні селектори відсутні!');
}

// ============================================
// ЕКСПОРТ для використання в тестах
// ============================================

module.exports = {
    SELECTOR_IDS,
    findSelectorByPartialName,
    clickButtonByPartialName,
    LoginPage,
    loginWithPageObject,
    validateRequiredSelectors
};
