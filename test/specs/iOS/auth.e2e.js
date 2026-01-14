const { expect, driver } = require('@wdio/globals');
const path = require('path');

const { 
    getElementByText,
    getElementByAccessibilityId,
    authorize,
    forgotCode,
    login,
    assertGreeting,
    assertPopup,
    restart,
    enterPinCode
} = require(path.resolve(__dirname, '../../../helper-iOS.js'));

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
        const menuBtn = getElementByAccessibilityId('МенюЄ нові повідомлення');
        await menuBtn.click();

        const settingsBtn = getElementByAccessibilityId('Налаштування');
        await settingsBtn.click();

        // Для iOS використовуємо accessibility identifier або текст
        const changePinBtn = getElementByText('Змінити код для входу');
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

        const thankBtn = getElementByText('Дякую');
        await thankBtn.click();

        // Для iOS перевіряємо наявність екрану налаштувань по тексту
        const settingsHeader = getElementByText('Налаштування');
        await settingsHeader.waitForDisplayed({ timeout: 10000 });
        await expect(settingsHeader).toBeDisplayed();
    });

    it('user should be able to login with new pin (after changing it via Settings)', async () => {
        await restart();

        await login('2');

        await assertGreeting();
    });

    it('user should be able to sign out from the app', async () => {
        const menuBtn = getElementByAccessibilityId('МенюЄ нові повідомлення');
        await menuBtn.click();

        // Для iOS прокручуємо до кнопки "Вийти"
        await driver.execute('mobile: scroll', {
            direction: 'down',
            predicateString: 'label == "Вийти"'
        });

        const signoutBtn = getElementByText('Вийти');
        await signoutBtn.waitForDisplayed({ timeout: 10000 });
        await signoutBtn.click();

        const confirmSignoutBtn = getElementByText('ВИЙТИ');
        await confirmSignoutBtn.click();

        const loginWithNBU = getElementByText('BankID HБУ');
        await expect(loginWithNBU).toBeDisplayed();
    });

    it('user should be able to authorize to the app after sign out', async () => {
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

        const authorizeBtn = getElementByText('Авторизуватися');
        await authorizeBtn.click();

        await authorize('4');

        await assertGreeting();
    });
});
