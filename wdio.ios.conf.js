const path = require('path');
const fs = require('fs');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

exports.config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    port: 4723,
    //
    // ==================
    // Specify Test Files
    // ==================
    specs: [
        './test/specs/iOS/**/*.js'
    ],
    exclude: [],
    //
    maxInstances: 1,
    //
    // iOS capabilities
    capabilities: [{
        platformName: 'iOS',
        'appium:deviceName': 'iPhone 15 Pro',
        'appium:platformVersion': '17.4',
        'appium:automationName': 'XCUITest',
        'appium:app': path.resolve('/Users/romantimchenko/diia-open-source/ios-diia/build/Build/Products/Debug-iphonesimulator/DiiaOpenSource.app'), //TODO  потрібно це переробити
        'appium:bundleId': 'ua.gov.diia.opensource.app',
        'appium:noReset': false,
        'appium:fullReset': false,
        'appium:wdaLaunchTimeout': 60000
    }],

    //
    // ===================
    // Test Configurations
    // ===================
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 2,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],

    before: function (capabilities, specs) {
        ensureDir('./artifacts/screenshots');
        ensureDir('./artifacts/pagesources');
    },

    afterTest: async function (test, context, { passed }) {
        if (!passed) {
            const safeName = test.title.replace(/\s+/g, '_');
            const timestamp = Date.now();

            const screenshotPath = `./artifacts/screenshots/${safeName}-${timestamp}.png`;
            const sourcePath = `./artifacts/pagesources/${safeName}-${timestamp}.xml`;

            await driver.saveScreenshot(screenshotPath);

            const source = await driver.getPageSource();
            fs.writeFileSync(sourcePath, source);
        }
    },

    mochaOpts: {
        ui: 'bdd',
        // Перший прохід авторизації іноді триває довше (BankID + PIN)
        timeout: 90000
    },
}
