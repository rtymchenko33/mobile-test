#!/usr/bin/env node

/**
 * Скрипт для витягування селекторів з open-source мобільного додатку
 * 
 * Використання:
 *   node scripts/extract-selectors.js <path-to-app-source> [--platform ios|android|both]
 * 
 * Приклад:
 *   node scripts/extract-selectors.js ../android-diia --platform android
 *   node scripts/extract-selectors.js ../ios-diia --platform ios
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLATFORM = process.argv.includes('--platform') 
    ? process.argv[process.argv.indexOf('--platform') + 1] 
    : 'both';

const SOURCE_PATH = process.argv[2] || process.cwd();

if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`❌ Помилка: Шлях ${SOURCE_PATH} не існує`);
    process.exit(1);
}

console.log(`🔍 Шукаю селектори в: ${SOURCE_PATH}`);
console.log(`📱 Платформа: ${PLATFORM}\n`);

const results = {
    ios: {
        accessibilityIdentifiers: new Set(),
        accessibilityLabels: new Set(),
        accessibilityHints: new Set()
    },
    android: {
        contentDescriptions: new Set(),
        resourceIds: new Set(),
        testTags: new Set()
    },
    reactNative: {
        testIDs: new Set(),
        accessibilityLabels: new Set()
    }
};

/**
 * Рекурсивно знаходить всі файли з розширенням
 */
function findFiles(dir, extensions, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        // Пропускаємо node_modules, build, .git тощо
        if (file.startsWith('.') || file === 'node_modules' || file === 'build' || file === 'dist') {
            return;
        }
        
        if (stat.isDirectory()) {
            findFiles(filePath, extensions, fileList);
        } else if (extensions.some(ext => file.endsWith(ext))) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

/**
 * Витягує iOS селектори з Swift/Objective-C файлів
 */
function extractIOSSelectors(filePath, content) {
    // accessibilityIdentifier
    const identifierRegex = /\.accessibilityIdentifier\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = identifierRegex.exec(content)) !== null) {
        results.ios.accessibilityIdentifiers.add(match[1]);
    }
    
    // accessibilityLabel
    const labelRegex = /\.accessibilityLabel\s*=\s*["']([^"']+)["']/g;
    while ((match = labelRegex.exec(content)) !== null) {
        results.ios.accessibilityLabels.add(match[1]);
    }
    
    // accessibilityIdentifier через setAccessibilityIdentifier
    const setIdentifierRegex = /setAccessibilityIdentifier\(["']([^"']+)["']\)/g;
    while ((match = setIdentifierRegex.exec(content)) !== null) {
        results.ios.accessibilityIdentifiers.add(match[1]);
    }
    
    // accessibilityLabel через setAccessibilityLabel
    const setLabelRegex = /setAccessibilityLabel\(["']([^"']+)["']\)/g;
    while ((match = setLabelRegex.exec(content)) !== null) {
        results.ios.accessibilityLabels.add(match[1]);
    }
}

/**
 * Витягує Android селектори з Kotlin/Java/XML файлів
 */
function extractAndroidSelectors(filePath, content) {
    const isXml = filePath.endsWith('.xml');
    
    // contentDescription (в XML та коді)
    const contentDescRegex = isXml 
        ? /android:contentDescription=["']([^"']+)["']/g
        : /contentDescription\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = contentDescRegex.exec(content)) !== null) {
        results.android.contentDescriptions.add(match[1]);
    }
    
    // contentDescription через setContentDescription
    const setContentDescRegex = /setContentDescription\(["']([^"']+)["']\)/g;
    while ((match = setContentDescRegex.exec(content)) !== null) {
        results.android.contentDescriptions.add(match[1]);
    }
    
    // android:id="@+id/..." (в XML)
    const resourceIdRegex = /android:id=["']@\+id\/([^"']+)["']/g;
    while ((match = resourceIdRegex.exec(content)) !== null) {
        results.android.resourceIds.add(match[1]);
    }
    
    // android:id="@id/..." (посилання на існуючий ID)
    const resourceIdRefRegex = /android:id=["']@id\/([^"']+)["']/g;
    while ((match = resourceIdRefRegex.exec(content)) !== null) {
        results.android.resourceIds.add(match[1]);
    }
    
    // R.id.xxx (в Kotlin/Java)
    const ridRegex = /R\.id\.(\w+)/g;
    while ((match = ridRegex.exec(content)) !== null) {
        results.android.resourceIds.add(match[1]);
    }
    
    // findViewById(R.id.xxx)
    const findViewRegex = /findViewById\(R\.id\.(\w+)\)/g;
    while ((match = findViewRegex.exec(content)) !== null) {
        results.android.resourceIds.add(match[1]);
    }
    
    // testTag (для React Native Android)
    const testTagRegex = /testTag\s*=\s*["']([^"']+)["']/g;
    while ((match = testTagRegex.exec(content)) !== null) {
        results.android.testTags.add(match[1]);
    }
    
    // android:tag (в XML)
    const androidTagRegex = /android:tag=["']([^"']+)["']/g;
    while ((match = androidTagRegex.exec(content)) !== null) {
        results.android.testTags.add(match[1]);
    }
}

/**
 * Витягує React Native селектори
 */
function extractReactNativeSelectors(filePath, content) {
    // testID
    const testIDRegex = /testID\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = testIDRegex.exec(content)) !== null) {
        results.reactNative.testIDs.add(match[1]);
    }
    
    // accessibilityLabel
    const labelRegex = /accessibilityLabel\s*=\s*["']([^"']+)["']/g;
    while ((match = labelRegex.exec(content)) !== null) {
        results.reactNative.accessibilityLabels.add(match[1]);
    }
    
    // accessibilityLabel через prop
    const labelPropRegex = /accessibilityLabel=["']([^"']+)["']/g;
    while ((match = labelPropRegex.exec(content)) !== null) {
        results.reactNative.accessibilityLabels.add(match[1]);
    }
}

/**
 * Обробляє файл та витягує селектори
 */
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath);
        
        // iOS файли
        if ((PLATFORM === 'ios' || PLATFORM === 'both') && 
            (ext === '.swift' || ext === '.m' || ext === '.mm' || ext === '.h')) {
            extractIOSSelectors(filePath, content);
        }
        
        // Android файли
        if ((PLATFORM === 'android' || PLATFORM === 'both') && 
            (ext === '.kt' || ext === '.java' || ext === '.xml')) {
            extractAndroidSelectors(filePath, content);
        }
        
        // React Native файли
        if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
            extractReactNativeSelectors(filePath, content);
        }
    } catch (error) {
        console.warn(`⚠️  Помилка при обробці ${filePath}: ${error.message}`);
    }
}

// Знаходимо та обробляємо файли
const iosFiles = (PLATFORM === 'ios' || PLATFORM === 'both') 
    ? findFiles(SOURCE_PATH, ['.swift', '.m', '.mm', '.h'])
    : [];
    
const androidFiles = (PLATFORM === 'android' || PLATFORM === 'both')
    ? findFiles(SOURCE_PATH, ['.kt', '.java', '.xml'])
    : [];
    
const rnFiles = findFiles(SOURCE_PATH, ['.js', '.jsx', '.ts', '.tsx']);

console.log(`📄 Знайдено файлів:`);
console.log(`   iOS: ${iosFiles.length}`);
console.log(`   Android: ${androidFiles.length}`);
console.log(`   React Native: ${rnFiles.length}\n`);

[...iosFiles, ...androidFiles, ...rnFiles].forEach(processFile);

// Виводимо результати
console.log('\n' + '='.repeat(60));
console.log('📊 РЕЗУЛЬТАТИ ВИТЯГУВАННЯ СЕЛЕКТОРІВ');
console.log('='.repeat(60) + '\n');

if (PLATFORM === 'ios' || PLATFORM === 'both') {
    console.log('🍎 iOS СЕЛЕКТОРИ:\n');
    
    if (results.ios.accessibilityIdentifiers.size > 0) {
        console.log('✅ Accessibility Identifiers (НАЙКРАЩЕ для тестування):');
        Array.from(results.ios.accessibilityIdentifiers).sort().forEach(id => {
            console.log(`   - ${id}`);
        });
        console.log();
    }
    
    if (results.ios.accessibilityLabels.size > 0) {
        console.log('📝 Accessibility Labels:');
        Array.from(results.ios.accessibilityLabels).sort().forEach(label => {
            console.log(`   - ${label}`);
        });
        console.log();
    }
}

if (PLATFORM === 'android' || PLATFORM === 'both') {
    console.log('🤖 ANDROID СЕЛЕКТОРИ:\n');
    
    if (results.android.contentDescriptions.size > 0) {
        console.log('✅ Content Descriptions (НАЙКРАЩЕ для тестування):');
        Array.from(results.android.contentDescriptions).sort().forEach(desc => {
            console.log(`   - ${desc}`);
        });
        console.log();
    }
    
    if (results.android.resourceIds.size > 0) {
        console.log('🆔 Resource IDs:');
        Array.from(results.android.resourceIds).sort().forEach(id => {
            console.log(`   - ${id}`);
        });
        console.log();
    }
    
    if (results.android.testTags.size > 0) {
        console.log('🏷️  Test Tags:');
        Array.from(results.android.testTags).sort().forEach(tag => {
            console.log(`   - ${tag}`);
        });
        console.log();
    }
}

if (results.reactNative.testIDs.size > 0 || results.reactNative.accessibilityLabels.size > 0) {
    console.log('⚛️  REACT NATIVE СЕЛЕКТОРИ:\n');
    
    if (results.reactNative.testIDs.size > 0) {
        console.log('✅ Test IDs (НАЙКРАЩЕ для тестування):');
        Array.from(results.reactNative.testIDs).sort().forEach(id => {
            console.log(`   - ${id}`);
        });
        console.log();
    }
    
    if (results.reactNative.accessibilityLabels.size > 0) {
        console.log('📝 Accessibility Labels:');
        Array.from(results.reactNative.accessibilityLabels).sort().forEach(label => {
            console.log(`   - ${label}`);
        });
        console.log();
    }
}

// Зберігаємо результати у JSON файл
const outputFile = path.join(process.cwd(), 'extracted-selectors.json');
const output = {
    sourcePath: SOURCE_PATH,
    platform: PLATFORM,
    extractedAt: new Date().toISOString(),
    ios: {
        accessibilityIdentifiers: Array.from(results.ios.accessibilityIdentifiers).sort(),
        accessibilityLabels: Array.from(results.ios.accessibilityLabels).sort()
    },
    android: {
        contentDescriptions: Array.from(results.android.contentDescriptions).sort(),
        resourceIds: Array.from(results.android.resourceIds).sort(),
        testTags: Array.from(results.android.testTags).sort()
    },
    reactNative: {
        testIDs: Array.from(results.reactNative.testIDs).sort(),
        accessibilityLabels: Array.from(results.reactNative.accessibilityLabels).sort()
    }
};

fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
console.log(`\n💾 Результати збережено у: ${outputFile}`);

// Генеруємо helper файл з селекторами
generateHelperFile(output);

console.log('\n✅ Готово!');

/**
 * Генерує helper файл з витягнутими селекторами
 */
function generateHelperFile(data) {
    const helperContent = `/**
 * Автоматично згенерований файл з селекторами
 * Згенеровано: ${data.extractedAt}
 * Джерело: ${data.sourcePath}
 */

const SELECTORS = {
    ios: {
        accessibilityIdentifiers: ${JSON.stringify(data.ios.accessibilityIdentifiers, null, 8)},
        accessibilityLabels: ${JSON.stringify(data.ios.accessibilityLabels, null, 8)}
    },
    android: {
        contentDescriptions: ${JSON.stringify(data.android.contentDescriptions, null, 8)},
        resourceIds: ${JSON.stringify(data.android.resourceIds, null, 8)},
        testTags: ${JSON.stringify(data.android.testTags, null, 8)}
    },
    reactNative: {
        testIDs: ${JSON.stringify(data.reactNative.testIDs, null, 8)},
        accessibilityLabels: ${JSON.stringify(data.reactNative.accessibilityLabels, null, 8)}
    }
};

module.exports = SELECTORS;
`;

    const helperFile = path.join(process.cwd(), 'selectors.js');
    fs.writeFileSync(helperFile, helperContent);
    console.log(`📝 Helper файл згенеровано: ${helperFile}`);
}
