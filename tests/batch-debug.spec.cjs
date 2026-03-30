const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const SHOTS = path.join(__dirname, '..', 'test-results', 'batch-debug');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const BASE = 'https://demo.agencybook.net';

test('Batch: full debug — login + attendance + JLPT', async ({ page }) => {
  const consoleLogs = [];
  const networkReqs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('requestfinished', req => {
    if (req.url().includes('/api/')) networkReqs.push(`${req.method()} ${req.url()}`);
  });
  page.on('requestfailed', req => networkReqs.push(`FAIL ${req.method()} ${req.url()} — ${req.failure()?.errorText}`));

  // 1. Login
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[placeholder*="mail" i], input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill('admin@agencybook.net');
    await page.locator('input[type="password"]').first().fill('admin123');
    await page.locator('button:has-text("লগইন")').first().click();
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: path.join(SHOTS, '01-logged-in.png') });

  // 2. Go to ভাষা কোর্স
  await page.locator('text=ভাষা কোর্স').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(SHOTS, '02-course-list.png') });

  // 3. Click first batch card
  const cards = page.locator('[class*="cursor-pointer"]');
  const cardCount = await cards.count();
  console.log('Batch cards found:', cardCount);
  if (cardCount > 0) {
    await cards.first().click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SHOTS, '03-batch-detail.png'), fullPage: true });
  }

  // 4. Check what tabs are visible
  const bodyText = await page.textContent('body');
  console.log('Has উপস্থিতি:', bodyText.includes('উপস্থিতি'));
  console.log('Has JLPT:', bodyText.includes('JLPT'));
  console.log('Has সংরক্ষণ:', bodyText.includes('সংরক্ষণ'));

  // 5. Click উপস্থিতি tab
  const tabs = page.locator('button');
  const tabCount = await tabs.count();
  for (let i = 0; i < tabCount; i++) {
    const text = await tabs.nth(i).textContent().catch(() => '');
    if (text.includes('উপস্থিতি')) {
      await tabs.nth(i).click();
      await page.waitForTimeout(2000);
      break;
    }
  }
  await page.screenshot({ path: path.join(SHOTS, '04-attendance-tab.png'), fullPage: true });

  // 6. Click save
  networkReqs.length = 0; // reset network log before save
  const saveBtns = page.locator('button:has-text("সংরক্ষণ")');
  const saveCount = await saveBtns.count();
  console.log('Save buttons found:', saveCount);
  if (saveCount > 0) {
    await saveBtns.first().click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: path.join(SHOTS, '05-after-save.png') });

  // 7. Capture toast
  const toastText = await page.locator('[class*="toast"], [role="alert"]').first().textContent().catch(() => 'NO TOAST');
  console.log('Toast:', toastText);

  // Write all debug info
  const debug = [
    '=== Console ===',
    ...consoleLogs.slice(-20),
    '',
    '=== Network (API calls) ===',
    ...networkReqs,
    '',
    `Toast: ${toastText}`,
    `Save buttons: ${saveCount}`,
    `Batch cards: ${cardCount}`,
  ].join('\n');

  fs.writeFileSync(path.join(SHOTS, 'debug.txt'), debug);
  console.log(debug);
});
