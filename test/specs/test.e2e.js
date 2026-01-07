const { expect, driver } = require('@wdio/globals')

describe('Open Diia app', () => {
    it('should open the Diia app and wait 5 seconds', async () => {
        await driver.startActivity(
            'ua.gov.diia.opensource',
            'ua.gov.diia.opensource.VendorActivity'
        );

        const loginWithNBU = await $('android=new UiSelector().text("BankID HБУ")');
        await loginWithNBU.click();

        const bankNadiia = await $('android=new UiSelector().text("Банк НаДія")');
        await bankNadiia.click();

        const tokenInput = await $('//android.widget.EditText[@resource-id="tokenInputField"]');

        await tokenInput.waitForExist({ timeout: 10000 });
        await tokenInput.waitForDisplayed({ timeout: 10000 });

        await tokenInput.click();
        await tokenInput.setValue('F0571FBF3FD94EE4E56DE58861126');

        const signinBtn = await $('android=new UiSelector().text("SignIn")');
        await signinBtn.click();

        const nextBtn = await $('android=new UiSelector().text("Далі")');
        await nextBtn.click();
        
        // const codeScreenHeader = await $('~Придумайте код з 4 цифр');
        // await expect(codeScreenHeader).toBeDisplayed();

        const zeroCodeButton = await $('android=new UiSelector().text("0")');
        for (let i = 0; i < 4; i++) {
            await zeroCodeButton.click();
        }

        // const repeatCodeScreenHeader = await $('~Повторіть код з 4 цифр');
        // await expect(repeatCodeScreenHeader).toBeDisplayed();

        for (let i = 0; i < 4; i++) {
            await zeroCodeButton.click();
        }

        const greeting = await driver.$('~Привіт, Надія 👋');
        await expect(greeting).toBeDisplayed();

        const documentsButton = await driver.$('~Документи');
        await documentsButton.click();

        await driver.pause(5000);
    });
});
