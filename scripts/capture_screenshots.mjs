import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const frontendUrl = 'http://127.0.0.1:5500';
const backendUrl = 'http://127.0.0.1:8765';
const outputDir = new URL('../../docs/screenshots/', import.meta.url);

await mkdir(outputDir, { recursive: true });
const clearResponse = await fetch(`${backendUrl}/api/history`, {
  method: 'DELETE',
});
if (!clearResponse.ok) {
  throw new Error(`Could not clear history: ${clearResponse.status}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') {
    errors.push(message.text());
  }
});
page.on('pageerror', (error) => errors.push(error.message));

async function capture(name) {
  await page.screenshot({
    path: fileURLToPath(new URL(name, outputDir)),
    fullPage: true,
  });
}

async function calculate(expression, expectedText, expectedSelector) {
  await page.fill('#expression', expression);
  await page.click('#calculate');
  await page.waitForFunction(
    ({ selector, text }) => document.querySelector(selector)?.textContent?.includes(text),
    { selector: expectedSelector, text: expectedText },
  );
  await page.waitForTimeout(200);
}

await page.goto(frontendUrl, { waitUntil: 'networkidle' });
await page.waitForSelector('#history-list');
await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Backend online');
await capture('01-main.png');

await calculate('12+8', '20', '#result');
await capture('02-basic.png');

await calculate('2.5+0.75', '3.25', '#result');
await capture('03-decimal.png');

await calculate('2+3*4', '14', '#result');
await capture('04-precedence.png');

await calculate('(2+3)*4', '20', '#result');
await capture('05-parentheses.png');

await calculate('3*-2', '-6', '#result');
await capture('06-unary.png');

await calculate('1/0', 'Division by zero', '#error');
await capture('07-division-by-zero.png');

await calculate('1a2', 'Invalid character: a', '#error');
await capture('08-invalid-expression.png');

const historyBeforeReload = await page.locator('.history-item').count();
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(
  (count) => document.querySelectorAll('.history-item').length === count,
  historyBeforeReload,
);
await capture('09-refresh-history.png');

const historyBeforeDelete = await page.locator('.history-item').count();
await page.locator('.icon-button').first().click();
await page.waitForFunction(
  (count) => document.querySelectorAll('.history-item').length === count - 1,
  historyBeforeDelete,
);
await capture('10-delete.png');

await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: 'networkidle' });
await capture('11-mobile.png');

const result = {
  scenarios: 11,
  backendStatus: await page.locator('#status').textContent(),
  historyAfterDelete: await page.locator('.history-item').count(),
  consoleErrors: errors,
};
console.log(JSON.stringify(result, null, 2));

await browser.close();
