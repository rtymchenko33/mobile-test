#!/usr/bin/env node

/**
 * Скрипт для послідовного запуску всіх iOS Auth тестів
 * Кожен тест запускається окремо для стабільності
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Кольори для виводу
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

// Список всіх тестів
const tests = [
    { id: 1, name: 'user should be able to authorize in the app for the first time', pinStart: '0' },
    { id: 2, name: 'user should be able to log in to the app', pinStart: '0' },
    { id: 3, name: 'user should be able to use \\"Forgot code\\" feature', pinStart: '0', pinEnd: '1' },
    { id: 4, name: 'user should be able to log in with new code after changing it \\(via \\"Forgot code\\" feature\\)', pinStart: '1' },
    { id: 5, name: 'user should be able to change pin code \\(via Settings\\)', pinStart: '1', pinEnd: '2' },
    { id: 6, name: 'user should be able to login with new pin \\(after changing it via Settings\\)', pinStart: '2' },
    { id: 7, name: 'user should be able to sign out from the app', pinStart: '2' },
    { id: 8, name: 'user should be able to authorize to the app after sign out', pinStart: '3' },
    { id: 9, name: 'user should be able to reauthorize after 3 not successful pin code inputs', pinStart: '0', pinEnd: '4' }
];

// Статистика
let passed = 0;
let failed = 0;
const results = [];

console.log(`${colors.blue}================================================`);
console.log(`Запуск iOS Authentication Тестів (послідовно)`);
console.log(`================================================${colors.reset}\n`);

// Директорія для логів
const logsDir = path.join(__dirname, 'test-logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Запуск кожного тесту
for (const test of tests) {
    const testNum = test.id;
    const testName = test.name;
    const logFile = path.join(logsDir, `test-${testNum}.log`);
    
    console.log(`\n${colors.yellow}[${testNum}/9]${colors.reset} Запуск: ${testName.replace(/\\/g, '')}`);
    console.log('---------------------------------------------------');
    
    try {
        const command = `npx wdio run ./wdio.ios.conf.js --spec ./test/specs/iOS/authentication.e2e.js --mochaOpts.grep "${testName}"`;
        
        // Запускаємо тест і зберігаємо вивід
        const output = execSync(command, {
            cwd: __dirname,
            encoding: 'utf-8',
            stdio: 'pipe',
            timeout: 300000 // 5 хвилин на тест
        });
        
        // Зберігаємо лог
        fs.writeFileSync(logFile, output);
        
        console.log(`${colors.green}✓ PASSED${colors.reset}`);
        passed++;
        results.push({ id: testNum, name: testName.replace(/\\/g, ''), status: 'PASSED' });
        
        // Пауза між тестами
        console.log(`Очікування 3 секунди перед наступним тестом...`);
        execSync('sleep 3');
        
    } catch (error) {
        console.log(`${colors.red}✗ FAILED${colors.reset}`);
        console.log(`  Лог збережено в: ${logFile}`);
        
        // Зберігаємо лог помилки
        if (error.stdout) {
            fs.writeFileSync(logFile, error.stdout);
        }
        if (error.stderr) {
            fs.appendFileSync(logFile, '\n\n=== STDERR ===\n' + error.stderr);
        }
        
        failed++;
        results.push({ id: testNum, name: testName.replace(/\\/g, ''), status: 'FAILED', log: logFile });
    }
}

// Підсумок
console.log(`\n${colors.blue}==================================================`);
console.log(`ПІДСУМОК ТЕСТУВАННЯ`);
console.log(`==================================================${colors.reset}`);
console.log(`Всього тестів: ${tests.length}`);
console.log(`${colors.green}Пройшло: ${passed}${colors.reset}`);
console.log(`${colors.red}Не пройшло: ${failed}${colors.reset}\n`);

// Детальні результати
console.log('Детальні результати:');
console.log('---------------------------------------------------');
results.forEach(result => {
    const status = result.status === 'PASSED' 
        ? `${colors.green}✓${colors.reset}` 
        : `${colors.red}✗${colors.reset}`;
    console.log(`${status} Test ${result.id}: ${result.name}`);
    if (result.log) {
        console.log(`   Лог: ${result.log}`);
    }
});

console.log('');

// Фінальний статус
if (failed === 0) {
    console.log(`${colors.green}🎉 ВСІ ТЕСТИ ПРОЙШЛИ УСПІШНО!${colors.reset}\n`);
    process.exit(0);
} else {
    console.log(`${colors.red}⚠️  Деякі тести не пройшли. Перевірте логи.${colors.reset}\n`);
    console.log(`Логи збережено в директорії: ${logsDir}\n`);
    process.exit(1);
}
