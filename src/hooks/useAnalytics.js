/**
 * useAnalytics.js — ফিচার ব্যবহার ট্র্যাকিং হুক
 *
 * পেজ ভিউ ও অ্যাকশন (create, update, delete, export) ট্র্যাক করে
 * backend-এ পাঠায়। Fire-and-forget — API fail হলেও UI-তে কোনো প্রভাব নেই।
 *
 * ব্যবহার:
 *   usePageTrack("students");                          — পেজ ভিউ ট্র্যাক
 *   trackAction("students", "create", { id: "S-01" }) — নির্দিষ্ট অ্যাকশন ট্র্যাক
 */

import { useEffect } from "react";
import { api } from "./useAPI";

// ── Debounce cache — একই পেজ ৩০ সেকেন্ডের মধ্যে আবার track হবে না ──
let lastTrack = {};

/**
 * trackPage — পেজ ভিউ ট্র্যাক করে (debounced)
 * একই পেজ ৩০ সেকেন্ডের মধ্যে দ্বিতীয়বার কল হলে skip করে।
 *
 * @param {string} page — পেজ নাম (e.g. "students", "visitors", "documents")
 */
export function trackPage(page) {
  const now = Date.now();
  // ৩০ সেকেন্ডের মধ্যে একই পেজ আবার track করা দরকার নেই
  if (lastTrack[page] && now - lastTrack[page] < 30000) return;
  lastTrack[page] = now;
  // Fire-and-forget — error হলেও UI-তে কিছু হবে না
  api.post("/analytics/track", { page }).catch(() => {});
}

/**
 * trackAction — নির্দিষ্ট অ্যাকশন ট্র্যাক করে (debounce নেই)
 * create, update, delete, export, scan — সব action-এ কল করো।
 *
 * @param {string} page — কোন পেজে action হচ্ছে
 * @param {string} action — "create", "update", "delete", "export", "scan"
 * @param {object} metadata — অতিরিক্ত data (optional)
 */
export function trackAction(page, action, metadata) {
  api.post("/analytics/track", { page, action, metadata }).catch(() => {});
}

/**
 * usePageTrack — React hook: component mount-এ পেজ ভিউ ট্র্যাক করে
 *
 * ব্যবহার:
 *   function StudentsPage() {
 *     usePageTrack("students");
 *     ...
 *   }
 *
 * @param {string} page — পেজ নাম
 */
export function usePageTrack(page) {
  useEffect(() => {
    trackPage(page);
  }, [page]);
}
