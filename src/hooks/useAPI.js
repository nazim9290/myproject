/**
 * useAPI.js — API কমিউনিকেশন লেয়ার
 *
 * এই ফাইলে সব backend API call হ্যান্ডেল হয়।
 * - useAPI() hook: যেকোনো page-এ data fetch করতে ব্যবহার হয়
 * - api object: CRUD operations (get/post/patch/delete)
 * - Token management: JWT token localStorage থেকে পড়ে
 * - Production/Local auto-detect: localhost হলে port 3001, নাহলে render.com
 */

import { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════
// API Base URL — api.js থেকে centralized
// ═══════════════════════════════════════════════════════
import { API_URL } from "../lib/api";

/**
 * JWT Token পড়া — localStorage থেকে
 * Login-এর সময় token save হয়, পরে সব API call-এ পাঠানো হয়
 */
function getToken() {
  return localStorage.getItem("agencyos_token");
}

/**
 * মূল HTTP request function
 * - JWT token header-এ যোগ করে
 * - FormData হলে Content-Type বসায় না (browser নিজে বসাবে)
 * - Error হলে throw করে (caller handle করবে)
 *
 * @param {string} path — API endpoint (e.g. "/students")
 * @param {object} options — fetch options (method, body, headers)
 * @returns {Promise<any>} — JSON response
 */
async function request(path, options = {}) {
  const token = getToken();

  // Header তৈরি — token থাকলে Authorization যোগ
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };

  // FormData না হলে JSON Content-Type বসাও
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

  // API call
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Error handling — API error হলে throw
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  // JSON response হলে parse করে return
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("json")) return res.json();
  return res;
}

/**
 * useAPI Hook — যেকোনো page-এ API data fetch করতে
 *
 * ব্যবহার:
 *   const { data, loading, refetch, setData } = useAPI("/students", []);
 *
 * - প্রথমে fallback data দেখায়
 * - তারপর API call করে real data দিয়ে replace করে
 * - API fail হলে fallback data-ই থাকে
 *
 * @param {string} endpoint — API path (e.g. "/students")
 * @param {any} fallback — API fail হলে default data
 */
export function useAPI(endpoint, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  // Data fetch function — refetch-এও ব্যবহার হয়
  const fetchData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; } // Token নেই = login হয়নি
    try {
      const res = await request(endpoint);
      // API response format: array অথবা { data: [...] }
      const items = Array.isArray(res) ? res : res.data ? res.data : res;
      if (Array.isArray(items) && items.length > 0) setData(items);
      else if (Array.isArray(items)) setData(items); // empty array-ও valid
    } catch {
      // API unavailable — fallback data রাখো
    }
    setLoading(false);
  }, [endpoint]);

  // Component mount-এ data load
  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, setData };
}

// ═══════════════════════════════════════════════════════
// CRUD Helper Object
// সব page-এ direct API call করতে ব্যবহার হয়
//
// ব্যবহার:
//   await api.get("/students")              — সব student আনো
//   await api.post("/students", newData)    — নতুন student তৈরি
//   await api.patch("/students/S-001", up)  — student update
//   await api.del("/students/S-001")        — student delete
//   await api.upload("/excel/upload", form) — file upload
// ═══════════════════════════════════════════════════════
export const api = {
  get: (path) => request(path),                                                    // GET — data আনো
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),   // POST — নতুন তৈরি
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }), // PATCH — আপডেট
  del: (path) => request(path, { method: "DELETE" }),                               // DELETE — মুছে ফেলো
  upload: (path, formData) => request(path, { method: "POST", body: formData }),    // POST — file upload
};

export { getToken, API_URL };
