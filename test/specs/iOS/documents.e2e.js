const { driver, expect } = require('@wdio/globals');
const path = require('path');

const { 
    getElementByText,
    getElementByAccessibilityId,
    getElementByClassChain,
    authorize,
    login,
    assertGreeting,
    restart,
    findTextViewByText,
    getContainer,
    assertTextView,
    clickByCoordinates
} = require(path.resolve(__dirname, '../../../helpers/helper-iOS.js'));

describe('Docs test suite', () => {
    it('user should be able to observe driver license document', async () => {
        await authorize('0');
    
        await assertGreeting();

        const documentsTab = getElementByClassChain('**/XCUIElementTypeStaticText[`name == "Документи"`]');
        await documentsTab.waitForDisplayed({ timeout: 10000 });
        await expect(documentsTab).toBeDisplayed();
        await documentsTab.click();

        const docTitle = getElementByClassChain('**/XCUIElementTypeStaticText[`name == "Посвідчення водія"`]');
        await docTitle.waitForDisplayed({ timeout: 10000 });
        await expect(docTitle).toBeDisplayed();

        // Стратегія 1: Спробуємо клікнути на кнопку more options по координатах
        console.log('[TEST] Strategy 1: Tapping more options button at coordinates (364, 660)');
        await clickByCoordinates(364, 660, 'more options button');
        await driver.pause(1500);
        
        // Перевіряємо, чи відкрилося меню
        let menuOpened = false;
        try {
            const michalchenkoText = getElementByClassChain('**/XCUIElementTypeStaticText[`name == "Михальченко"`]');
            await michalchenkoText.waitForDisplayed({ timeout: 3000 });
            menuOpened = true;
            console.log('[TEST] Menu opened after coordinate tap');
        } catch (e) {
            console.log('[TEST] Menu did not open after coordinate tap, trying alternative: clicking on document title');
            
            // Стратегія 2: Клікаємо на сам заголовок документа
            try {
                await docTitle.click();
                await driver.pause(1500);
                
                // Перевіряємо, чи відкрилося меню
                const michalchenkoText2 = getElementByClassChain('**/XCUIElementTypeStaticText[`name == "Михальченко"`]');
                await michalchenkoText2.waitForDisplayed({ timeout: 3000 });
                menuOpened = true;
                console.log('[TEST] Menu opened after clicking document title');
            } catch (e2) {
                console.log('[TEST] Menu did not open after clicking title, trying coordinate tap on document center');
                
                // Стратегія 3: Клікаємо по центру документа
                const docLocation = await docTitle.getLocation();
                const docSize = await docTitle.getSize();
                const centerX = docLocation.x + docSize.width / 2;
                const centerY = docLocation.y + docSize.height / 2;
                
                console.log(`[TEST] Document center coordinates: x=${centerX}, y=${centerY}`);
                await clickByCoordinates(centerX, centerY, 'document center');
                await driver.pause(1500);
                
                // Перевіряємо, чи відкрилося меню
                const michalchenkoText3 = getElementByClassChain('**/XCUIElementTypeStaticText[`name == "Михальченко"`]');
                await michalchenkoText3.waitForDisplayed({ timeout: 3000 });
                menuOpened = true;
                console.log('[TEST] Menu opened after tapping document center');
            }
        }
        
        if (!menuOpened) {
            throw new Error('Menu did not open after all tap strategies');
        }

        // Перевіряємо деталі документа
        await assertTextView('**/XCUIElementTypeStaticText[`name == "Михальченко"`]', 'Михальченко');
        await assertTextView('**/XCUIElementTypeStaticText[`name == "Віктор Олександрович"`]', 'Віктор Олександрович');
        await assertTextView('**/XCUIElementTypeStaticText[`name == "06.01.1996"`]', '06.01.1996');
        await assertTextView('birth_date_driver-license_ua', 'Дата\nнародження:');
        await assertTextView('category_driver-license_ua', 'Категорія:');
        await assertTextView('category_driver-license_ua', 'B');
        await assertTextView('doc_number_driver-license_ua', 'Номер\nдокумента:');
        await assertTextView('**/XCUIElementTypeStaticText[`name == "РОЕ886082"`]', 'РОЕ886082');

        
    });
});
