const { expect, driver } = require('@wdio/globals');
const path = require('path');

const { 
    getElementByText,
    getElementByAccessibilityId,
    getElementByClassChain,
    authorize,
    forgotCode,
    login,
    assertGreeting,
    assertPopup,
    restart,
    enterPinCode
} = require(path.resolve(__dirname, '../../../helpers/helper-iOS.js'));

describe('Auth test suite', () => {
    it('user should be able to authorize in the app for the first time', async () => {
        await authorize('0');
        await assertGreeting();
    });

    it('user should be able to log in to the app', async () => {
        await restart();
        await login('0');
        await assertGreeting();
    });

    it('user should be able to use "Forgot code" feature', async () => {
        await restart();
        await forgotCode();
        await authorize('1');
        await assertGreeting();
    });

    it('user should be able to log in with new code after changing it (via "Forgot code" feature)', async () => {
        await restart();

        await login('1');

        await assertGreeting();
    });

    it('user should be able to change pin code (via Settings)', async () => {
        // Перевіряємо, що користувач авторизований - чекаємо на появу меню
        // Можливо, попередній тест ще не завершився повністю
        await driver.waitUntil(
            async () => {
                try {
                    const menuBtn = getElementByAccessibilityId('menuSettingsInactive');
                    return await menuBtn.isDisplayed();
                } catch (e) {
                    return false;
                }
            },
            { timeout: 15000, timeoutMsg: 'Menu button not found - user may not be authorized' }
        );

        const menuBtn = getElementByAccessibilityId('menuSettingsInactive');
        await menuBtn.waitForDisplayed({ timeout: 10000 });
        await menuBtn.click();

        const settingsBtn = getElementByAccessibilityId('Налаштування .');
        await settingsBtn.waitForDisplayed({ timeout: 10000 });
        await settingsBtn.click();

        const changePinBtn = getElementByAccessibilityId('Змінити код для входу');
        await changePinBtn.waitForDisplayed({ timeout: 10000 });
        await changePinBtn.click();

        const repeatCodeScreenHeader = getElementByAccessibilityId('Повторіть\nкод з 4 цифр');
        await expect(repeatCodeScreenHeader).toBeDisplayed();

        await enterPinCode('1');

        const codeScreenHeader = getElementByAccessibilityId('Новий\nкод з 4 цифр');
        await expect(codeScreenHeader).toBeDisplayed();

        await enterPinCode('2');

        const repeatnewCodeScreenHeader = getElementByAccessibilityId('Повторіть\nкод з 4 цифр');
        await expect(repeatnewCodeScreenHeader).toBeDisplayed();

        await enterPinCode('2');

        await assertPopup(
            'Код змінено',
            'Ви змінили код для входу у застосунок Дія.'
        );

        const thankBtn = getElementByClassChain('Button', 'name == "Дякую" OR label == "Дякую"');
        await thankBtn.waitForDisplayed({ timeout: 10000 });
        await thankBtn.click();

        // Для iOS перевіряємо наявність екрану налаштувань по тексту
        const settingsHeader = getElementByAccessibilityId('Налаштування');
        await settingsHeader.waitForDisplayed({ timeout: 10000 });
        await expect(settingsHeader).toBeDisplayed();
    });

    it('user should be able to login with new pin (after changing it via Settings)', async () => {
        await restart();

        await login('2');

        await assertGreeting();
    });

    it('user should be able to sign out from the app', async () => {
        // Перевіряємо, що користувач авторизований - чекаємо на появу меню
        await driver.waitUntil(
            async () => {
                try {
                    const menuBtn = getElementByAccessibilityId('menuSettingsInactive');
                    return await menuBtn.isDisplayed();
                } catch (e) {
                    return false;
                }
            },
            { timeout: 15000, timeoutMsg: 'Menu button not found - user may not be authorized' }
        );

        const menuBtn = getElementByAccessibilityId('menuSettingsInactive');
        await menuBtn.waitForDisplayed({ timeout: 10000 });
        await menuBtn.click();

        // Очікуємо відкриття меню - перевіряємо наявність елементів меню
        await driver.waitUntil(
            async () => {
                try {
                    const settingsBtn = getElementByAccessibilityId('Налаштування .');
                    return await settingsBtn.isDisplayed();
                } catch (e) {
                    return false;
                }
            },
            { timeout: 5000, timeoutMsg: 'Menu did not open' }
        );

        // Для iOS прокручуємо до кнопки "Вийти"
        await driver.execute('mobile: scroll', {
            direction: 'down',
            predicateString: 'name == "Вийти" OR label == "Вийти"'
        });

        // Знаходимо кнопку "Вийти" в меню (не в діалозі)
        // Використовуємо більш специфічний селектор - кнопка в меню має бути видимою та enabled
        const signoutBtn = getElementByClassChain('Button', 'name == "Вийти" AND enabled == true AND visible == true');
        await signoutBtn.waitForDisplayed({ timeout: 10000 });
        await signoutBtn.click();

        // Очікуємо появу діалогу підтвердження
        await driver.waitUntil(
            async () => {
                try {
                    // Перевіряємо наявність діалогу підтвердження
                    const confirmDialog = getElementByClassChain('Button', 'name == "Вийти" AND enabled == true');
                    return await confirmDialog.isDisplayed();
                } catch (e) {
                    return false;
                }
            },
            { timeout: 5000, timeoutMsg: 'Confirmation dialog did not appear' }
        );

        // Клікаємо на кнопку підтвердження в діалозі
        const confirmSignoutBtn = getElementByClassChain('Button', 'name == "Вийти" AND enabled == true');
        await confirmSignoutBtn.waitForDisplayed({ timeout: 10000 });
        await confirmSignoutBtn.click();

        // Очікуємо появу екрану авторизації
        const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
        await loginWithNBU.waitForDisplayed({ timeout: 10000 });
        await expect(loginWithNBU).toBeDisplayed();
    });

    it('user should be able to authorize to the app after sign out', async () => {
        // Очікуємо появу екрану авторизації після виходу
        // Перевіряємо наявність кнопки BankID або чекбокса
        await driver.waitUntil(
            async () => {
                try {
                    const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
                    return await loginWithNBU.isDisplayed();
                } catch (e) {
                    try {
                        const checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
                        return await checkbox.isDisplayed();
                    } catch (e2) {
                        return false;
                    }
                }
            },
            { timeout: 10000, timeoutMsg: 'Authorization screen did not appear after sign out' }
        );
        
        await authorize('3');

        await assertGreeting();
    });

    it('user should be able to reauthorize after 3 not successful pin code inputs', async () => {
        await restart();

        for (let i = 0; i < 3; ++i) {
            await login('4');
        }

        await assertPopup(
            'Ви ввели неправильний код тричі',
            'Пройдіть повторну авторизацію у застосунку'
        );

        const authorizeBtn = getElementByClassChain('Button', 'name == "Авторизуватися" OR label == "Авторизуватися"');
        await authorizeBtn.waitForDisplayed({ timeout: 10000 });
        await authorizeBtn.click();

        // Очікуємо перехід на екран авторизації
        await driver.waitUntil(
            async () => {
                try {
                    const loginWithNBU = getElementByClassChain('Button', 'name == "BankID НБУ  . "');
                    return await loginWithNBU.isDisplayed();
                } catch (e) {
                    try {
                        const checkbox = getElementByAccessibilityId('checkbox_conditions_bordered_auth');
                        return await checkbox.isDisplayed();
                    } catch (e2) {
                        return false;
                    }
                }
            },
            { timeout: 10000, timeoutMsg: 'Authorization screen did not appear after reauthorization' }
        );

        await authorize('4');

        await assertGreeting();
    });
});
