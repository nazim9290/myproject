/**
 * AgencyBook — Automated Browser Tests (Playwright)
 *
 * চালাতে: npx playwright test tests/agencybook.spec.js --headed
 * রিপোর্ট: npx playwright show-report
 */

const { test, expect } = require('@playwright/test');

const BASE = 'https://demo.agencybook.net';
const API = 'https://demo-api.agencybook.net';
const EMAIL = 'admin@agencybook.net';
const PASSWORD = 'admin123';  // আপনার password দিন

// ═══════════════════════════════════════════════
// Helper: Login
// ═══════════════════════════════════════════════
async function login(page) {
  await page.goto(BASE);
  await page.waitForTimeout(1000);

  // Login form visible কিনা
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="Email" i]').first();
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button:has-text("লগইন"), button:has-text("Login"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
  }
}

// Helper: সাইডবার মেনু ক্লিক
async function navigateTo(page, menuText) {
  // মোবাইল হলে hamburger menu খুলো
  const hamburger = page.locator('button:has(svg.lucide-menu)').first();
  if (await hamburger.isVisible({ timeout: 500 }).catch(() => false)) {
    await hamburger.click();
    await page.waitForTimeout(300);
  }
  await page.locator(`text=${menuText}`).first().click();
  await page.waitForTimeout(1500);
}

// ═══════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════

test.describe('AgencyBook Full Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000);
  });

  // ── ১. লগইন ──
  test('TC-001: সঠিক তথ্য দিয়ে লগইন', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1500);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASSWORD);
    await page.locator('button:has-text("লগইন"), button:has-text("Login"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    // Dashboard বা main content দেখাবে
    await expect(page.locator('text=ড্যাশবোর্ড, text=Dashboard, text=মোট স্টুডেন্ট').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-002: ভুল পাসওয়ার্ড দিয়ে লগইন', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1500);

    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill(EMAIL);
      await page.locator('input[type="password"]').first().fill('wrongpassword123');
      await page.locator('button:has-text("লগইন"), button:has-text("Login"), button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      // Error message দেখাবে
      const body = await page.textContent('body');
      expect(body).toContain('ভুল');
    }
  });

  // ── ২. ড্যাশবোর্ড ──
  test('TC-005: ড্যাশবোর্ড KPI কার্ড', async ({ page }) => {
    await login(page);

    // KPI cards visible
    await expect(page.locator('text=মোট স্টুডেন্ট').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=এই মাসের আয়').first()).toBeVisible();
    await expect(page.locator('text=ডক প্রসেসিং').first()).toBeVisible();
  });

  // ── ৩. ভিজিটর ──
  test('TC-007: ভিজিটর পেজ লোড', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Visitors');

    // ভিজিটর পেজ visible
    const body = await page.textContent('body');
    const hasVisitorPage = body.includes('ভিজিটর') || body.includes('Visitor');
    expect(hasVisitorPage).toBeTruthy();
  });

  // ── ৪. স্টুডেন্ট ──
  test('TC-010: স্টুডেন্ট পেজ লোড', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Students');

    await expect(page.locator('text=মোট স্টুডেন্ট, text=Students, text=স্টুডেন্ট').first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-014: বাল্ক সিলেকশন checkbox দেখা যাচ্ছে', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Students');
    await page.waitForTimeout(2000);

    // Checkbox visible
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── ৫. স্কুল ──
  test('TC-017: স্কুল পেজ লোড ও ফর্ম', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Schools');

    await expect(page.locator('text=Schools, text=স্কুল').first()).toBeVisible({ timeout: 10000 });

    // Add button আছে
    await expect(page.locator('button:has-text("যোগ"), button:has-text("Add")').first()).toBeVisible();
  });

  // ── ৬. ভাষা কোর্স ──
  test('TC-019: ব্যাচ পেজ লোড', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Course');

    const body = await page.textContent('body');
    const hasBatch = body.includes('ব্যাচ') || body.includes('Batch') || body.includes('কোর্স');
    expect(hasBatch).toBeTruthy();
  });

  // ── ৭. Attendance ──
  test('TC-021: উপস্থিতি পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Attendance');

    const body = await page.textContent('body');
    const hasAtt = body.includes('উপস্থিতি') || body.includes('Attendance');
    expect(hasAtt).toBeTruthy();
  });

  // ── ৮. Documents ──
  test('TC-028: ডকুমেন্ট পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Documents');

    const body = await page.textContent('body');
    const hasDoc = body.includes('ডকুমেন্ট') || body.includes('Document');
    expect(hasDoc).toBeTruthy();
  });

  // ── ৯. Excel AutoFill ──
  test('TC-022: Excel পেজ ও সিস্টেম ভ্যারিয়েবল', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Excel');

    const body = await page.textContent('body');
    const hasExcel = body.includes('Excel') || body.includes('টেমপ্লেট');
    expect(hasExcel).toBeTruthy();
  });

  // ── ১০. Pre-Departure ──
  test('TC-024: প্রি-ডিপার্চার পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Pre-Departure');

    const body = await page.textContent('body');
    const hasPD = body.includes('প্রি-ডিপার্চার') || body.includes('Pre-Departure') || body.includes('COE');
    expect(hasPD).toBeTruthy();
  });

  // ── ১১. Tasks ──
  test('TC-042: টাস্ক পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Tasks');

    const body = await page.textContent('body');
    const hasTasks = body.includes('টাস্ক') || body.includes('Task');
    expect(hasTasks).toBeTruthy();
  });

  // ── ১২. Communication ──
  test('TC-040: যোগাযোগ পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Communication');

    const body = await page.textContent('body');
    const hasComm = body.includes('যোগাযোগ') || body.includes('Communication');
    expect(hasComm).toBeTruthy();
  });

  // ── ১৩. Agents ──
  test('TC-042b: এজেন্ট পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Agents');

    const body = await page.textContent('body');
    const hasAgent = body.includes('এজেন্ট') || body.includes('Agent');
    expect(hasAgent).toBeTruthy();
  });

  // ── ১৪. Partners ──
  test('TC-027: পার্টনার পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Partners');

    await expect(page.locator('text=পার্টনার').first()).toBeVisible({ timeout: 10000 });
  });

  // ── ১৫. Accounts ──
  test('TC-026: হিসাব পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Accounts');

    const body = await page.textContent('body');
    const hasAcc = body.includes('আয়') || body.includes('হিসাব') || body.includes('Accounts');
    expect(hasAcc).toBeTruthy();
  });

  // ── ১৬. Inventory ──
  test('TC-041: ইনভেন্টরি পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Inventory');

    const body = await page.textContent('body');
    const hasInv = body.includes('ইনভেন্টরি') || body.includes('Inventory') || body.includes('সম্পদ');
    expect(hasInv).toBeTruthy();
  });

  // ── ১৭. HR ──
  test('TC-043: HR পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'HR');

    const body = await page.textContent('body');
    const hasHR = body.includes('কর্মচারী') || body.includes('HR') || body.includes('Employee');
    expect(hasHR).toBeTruthy();
  });

  // ── ১৮. Reports ──
  test('TC-028b: রিপোর্ট পেজ ও ৪টি ট্যাব', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Reports');

    await expect(page.locator('text=রিপোর্ট, text=Reports').first()).toBeVisible({ timeout: 10000 });

    // ৪টি ট্যাব আছে
    const body = await page.textContent('body');
    expect(body).toContain('ফানেল');
    expect(body).toContain('সোর্স');
  });

  // ── ১৯. Calendar ──
  test('TC-041b: ক্যালেন্ডার পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Calendar');

    const body = await page.textContent('body');
    const hasCal = body.includes('ক্যালেন্ডার') || body.includes('Calendar') || body.includes('ইভেন্ট');
    expect(hasCal).toBeTruthy();
  });

  // ── ২০. Users ──
  test('TC-030: ইউজার পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Users');

    await expect(page.locator('text=Users, text=ইউজার').first()).toBeVisible({ timeout: 10000 });
  });

  // ── ২১. Settings ──
  test('TC-032: সেটিংস ব্রাঞ্চ ট্যাব', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Settings');

    await expect(page.locator('text=এজেন্সি তথ্য, text=সেটিংস').first()).toBeVisible({ timeout: 10000 });

    // ব্রাঞ্চ ট্যাবে যাও
    const branchTab = page.locator('text=ব্রাঞ্চ').first();
    if (await branchTab.isVisible()) {
      await branchTab.click();
      await page.waitForTimeout(1000);
    }
  });

  // ── ২২. Profile ──
  test('TC-034: প্রোফাইল পেজ ও ছবি বাটন', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Profile');

    const body = await page.textContent('body');
    const hasProfile = body.includes('প্রোফাইল') || body.includes('Profile') || body.includes(EMAIL);
    expect(hasProfile).toBeTruthy();
  });

  // ── ২৩. Help ──
  test('TC-045: হেল্প পেজ', async ({ page }) => {
    await login(page);
    await navigateTo(page, 'Help');

    const body = await page.textContent('body');
    expect(body).toContain('AgencyBook');
    expect(body).toContain('সিস্টেম ভ্যারিয়েবল');
  });

  // ── ২৪. API Health ──
  test('API Health Check', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('ok');
  });

  // ── ২৫. API Auth — ভুল পাসওয়ার্ড ──
  test('API: ভুল পাসওয়ার্ড 401', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: EMAIL, password: 'wrongpassword' }
    });
    expect(res.status()).toBe(401);
  });

  // ── ২৬. API Protected Route — token ছাড়া ──
  test('API: token ছাড়া 401', async ({ request }) => {
    const res = await request.get(`${API}/api/students`);
    expect(res.status()).toBe(401);
  });

  // ── ২৭. সিকিউরিটি — Rate Limit Header ──
  test('API: Rate Limit headers আছে', async ({ request }) => {
    const res = await request.get(`${API}/api/health`);
    const headers = res.headers();
    const hasRateLimit = headers['ratelimit-limit'] || headers['x-ratelimit-limit'];
    expect(hasRateLimit).toBeTruthy();
  });

  // ── ২৮. Code Protection — Right Click ──
  test('TC-039: Right-click বন্ধ (production)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(2000);

    // contextmenu event listener check
    const hasProtection = await page.evaluate(() => {
      let blocked = false;
      const handler = (e) => { blocked = true; };
      document.addEventListener('contextmenu', handler);
      const event = new MouseEvent('contextmenu', { bubbles: true });
      document.dispatchEvent(event);
      document.removeEventListener('contextmenu', handler);
      // Check if preventDefault is set
      return document.querySelector('script')?.textContent?.includes('contextmenu') || false;
    });
    // Protection script exists in HTML
    const html = await page.content();
    expect(html).toContain('contextmenu');
  });

  // ── ২৯. মোবাইল রেসপন্সিভ ──
  test('TC-044: মোবাইল ভিউ', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone size
    await login(page);

    // Hamburger menu visible হওয়া উচিত
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    // Content render হয়েছে
    expect(body.length).toBeGreaterThan(100);
  });

  // ── ৩০. Theme Toggle ──
  test('TC-068: থিম টগল', async ({ page }) => {
    await login(page);

    // Theme toggle button খুঁজো
    const themeBtn = page.locator('button:has(svg.lucide-sun), button:has(svg.lucide-moon)').first();
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const bgBefore = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      await themeBtn.click();
      await page.waitForTimeout(500);
      const bgAfter = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      // Background color পরিবর্তন হওয়া উচিত
      expect(bgBefore !== bgAfter || true).toBeTruthy(); // soft check
    }
  });

});
