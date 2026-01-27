const path = require('path');
const fs = require('fs');

const iosAppPath = process.env.IOS_APP_PATH ||
    '/Users/romantimchenko/diia-open-source/ios-diia/build/Build/Products/Debug-iphonesimulator/DiiaOpenSource.app';
const iosBundleId = process.env.IOS_BUNDLE_ID || 'ua.gov.diia.opensource.app';
const iosDeviceName = process.env.IOS_DEVICE_NAME || 'iPhone 15 Pro';
const iosPlatformVersion = process.env.IOS_PLATFORM_VERSION || '17.4';

if (!fs.existsSync(iosAppPath)) {
    throw new Error(
        `iOS app not found at "${iosAppPath}". ` +
        'Set IOS_APP_PATH to the built .app bundle before running tests.'
    );
}

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
        'appium:deviceName': iosDeviceName,
        'appium:platformVersion': iosPlatformVersion,
        'appium:automationName': 'XCUITest',
        'appium:app': path.resolve(iosAppPath),
        'appium:bundleId': iosBundleId,
        'appium:noReset': false,
        'appium:fullReset': false,  // Full reset to clean state before tests
        'appium:wdaLaunchTimeout': 60000,
        'appium:newCommandTimeout': 1800, // 30 minutes timeout for long-running tests
        'appium:showXcodeLog': true,
        'appium:useSimpleBuildTest': true
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
        timeout: 180000
    },
}
