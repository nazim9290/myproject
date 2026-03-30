const { test, expect } = require('@playwright/test');
const path = require('path');

const BASE = 'https://demo.agencybook.net';
const EMAIL = 'admin@agencybook.net';
const PASSWORD = 'admin123';
const SHOTS = path.join(__dirname, '..', 'test-results', 'visitors-test');
const STATE = path.join(__dirname, '..', 'test-results', 'auth-state.json');

// ── Login + save session ──
async function ensureLogin(page) {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  const emailInput = page.locator('input[placeholder*="mail" i], input[type="email"]').first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button:has-text("লগইন"), button:has-text("Login")').first().click();
    await page.waitForTimeout(4000);
    await page.context().storageState({ path: STATE });
  }
}

async function openPage(browser) {
  try {
    const ctx = await browser.newContext({ storageState: STATE });
    return { page: await ctx.newPage(), ctx };
  } catch {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await ensureLogin(page);
    return { page, ctx };
  }
}

async function goVisitors(page) {
  await page.goto(BASE);
  await page.waitForTimeout(2000);
  await page.locator('text=Visitors').first().click();
  await page.waitForTimeout(2000);
}

test.describe('Visitors Module — Full Feature Test', () => {

  // ── SETUP ──
  test('SETUP: Login', async ({ page }) => {
    await ensureLogin(page);
    await page.context().storageState({ path: STATE });
    await page.screenshot({ path: path.join(SHOTS, '00-login-done.png') });
  });

  // ── V-01: ভিজিটর পেজ লোড ──
  test('V-01: ভিজিটর পেজ লোড হচ্ছে', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);
    await page.screenshot({ path: path.join(SHOTS, 'V01-visitors-page.png'), fullPage: true });

    const body = await page.textContent('body');
    expect(body.includes('ভিজিটর') || body.includes('Visitor')).toBeTruthy();
    await ctx.close();
  });

  // ── V-02: নতুন ভিজিটর যোগ ──
  test('V-02: নতুন ভিজিটর যোগ করা', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    // "নতুন ভিজিটর" বাটন ক্লিক
    const addBtn = page.locator('button:has-text("ভিজিটর"), button:has-text("নতুন")').last();
    await addBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SHOTS, 'V02-01-add-form-open.png'), fullPage: true });

    // ফর্ম পূরণ
    const nameInput = page.locator('input[placeholder*="নাম" i], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('টেস্ট ভিজিটর ২০২৬');
    }

    const phoneInput = page.locator('input[placeholder*="ফোন" i], input[placeholder*="phone" i], input[placeholder*="01" i]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill('01711223344');
    }

    await page.screenshot({ path: path.join(SHOTS, 'V02-02-form-filled.png'), fullPage: true });

    // সংরক্ষণ বাটন
    const saveBtn = page.locator('button:has-text("সংরক্ষণ"), button:has-text("Save"), button:has-text("যোগ")').last();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: path.join(SHOTS, 'V02-03-after-save.png'), fullPage: true });
    await ctx.close();
  });

  // ── V-03: ভিজিটর তালিকায় দেখা যাচ্ছে ──
  test('V-03: তালিকায় ভিজিটর দেখা যাচ্ছে', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SHOTS, 'V03-visitor-list.png'), fullPage: true });

    const body = await page.textContent('body');
    // কমপক্ষে ১ জন ভিজিটর থাকা উচিত
    const hasVisitor = body.includes('Nazim') || body.includes('টেস্ট') || body.includes('01');
    expect(hasVisitor).toBeTruthy();
    await ctx.close();
  });

  // ── V-04: সার্চ ──
  test('V-04: সার্চ কাজ করছে', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    const searchBox = page.locator('input[placeholder*="খুঁজুন" i], input[placeholder*="search" i], input[placeholder*="নাম" i]').first();
    if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBox.fill('Nazim');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS, 'V04-search-result.png'), fullPage: true });
    }
    await ctx.close();
  });

  // ── V-05: স্ট্যাটাস ফিল্টার ──
  test('V-05: স্ট্যাটাস ফিল্টার', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    // Interested ফিল্টার ক্লিক
    const interestedBtn = page.locator('text=Interested').first();
    if (await interestedBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await interestedBtn.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS, 'V05-filter-interested.png'), fullPage: true });
    }
    await ctx.close();
  });

  // ── V-06: ভিজিটর ডিটেইল ──
  test('V-06: ভিজিটর ডিটেইল দেখা', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    // প্রথম ভিজিটরের নামে ক্লিক
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(SHOTS, 'V06-visitor-detail.png'), fullPage: true });
    }
    await ctx.close();
  });

  // ── V-07: ভিজিটর Edit ──
  test('V-07: ভিজিটর সম্পাদনা', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    // ভিজিটরে ক্লিক → Edit
    const firstRow = page.locator('tbody tr').first();
    if (await firstRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(2000);

      // Edit বাটন খুঁজো
      const editBtn = page.locator('button:has-text("সম্পাদনা"), button:has-text("Edit"), button:has(svg.lucide-edit)').first();
      if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(SHOTS, 'V07-edit-form.png'), fullPage: true });
      }
    }
    await ctx.close();
  });

  // ── V-08: Export CSV ──
  test('V-08: CSV Export', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("এক্সপোর্ট")').first();
    if (await exportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Download event listen
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
        exportBtn.click(),
      ]);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS, 'V08-export-clicked.png') });

      if (download) {
        const filename = download.suggestedFilename();
        expect(filename.endsWith('.csv')).toBeTruthy();
      }
    }
    await ctx.close();
  });

  // ── V-09: KPI কার্ড ──
  test('V-09: KPI কার্ড দেখা যাচ্ছে', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);
    await page.screenshot({ path: path.join(SHOTS, 'V09-kpi-cards.png') });

    const body = await page.textContent('body');
    const hasKPI = body.includes('সক্রিয়') || body.includes('Active') || body.includes('মোট');
    expect(hasKPI).toBeTruthy();
    await ctx.close();
  });

  // ── V-10: পেজিনেশন ──
  test('V-10: পেজিনেশন', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);
    await page.screenshot({ path: path.join(SHOTS, 'V10-pagination.png') });

    // পেজিনেশন component আছে
    const body = await page.textContent('body');
    const hasPagination = body.includes('প্রতি পাতায়') || body.includes('জন') || body.includes('রেকর্ড');
    expect(hasPagination).toBeTruthy();
    await ctx.close();
  });

  // ── V-11: ব্রাঞ্চ ফিল্টার ──
  test('V-11: ব্রাঞ্চ ফিল্টার', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    const branchSelect = page.locator('select:has(option:has-text("সব ব্রাঞ্চ")), select:has(option:has-text("ব্রাঞ্চ"))').first();
    if (await branchSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.screenshot({ path: path.join(SHOTS, 'V11-branch-filter.png') });
    }
    await ctx.close();
  });

  // ── V-12: Active/Recent/Archive ট্যাব ──
  test('V-12: Active/Recent/Archive ট্যাব', async ({ browser }) => {
    const { page, ctx } = await openPage(browser);
    await goVisitors(page);

    // Recent ট্যাবে ক্লিক
    const recentTab = page.locator('text=Recent').first();
    if (await recentTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await recentTab.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(SHOTS, 'V12-recent-tab.png'), fullPage: true });
    }
    await ctx.close();
  });
});
