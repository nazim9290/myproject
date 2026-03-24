import { useState, useEffect, useCallback } from "react";

const API_URL = window.location.hostname === "localhost" ? "http://localhost:3001/api" : "https://newbook-e2v3.onrender.com/api";

function getToken() {
  return localStorage.getItem("agencyos_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("json")) return res.json();
  return res;
}

/**
 * Hook to fetch data from API with fallback to mock data
 * Usage: const { data, loading, refetch, setData } = useAPI("/students", mockData);
 */
export function useAPI(endpoint, fallback = []) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const res = await request(endpoint);
      // API returns either array or { data: [...] }
      const items = Array.isArray(res) ? res : res.data ? res.data : res;
      if (Array.isArray(items) && items.length > 0) setData(items);
      else if (Array.isArray(items)) setData(items); // empty is valid
    } catch {
      // API unavailable — keep fallback
    }
    setLoading(false);
  }, [endpoint]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, refetch: fetchData, setData };
}

// Direct API helpers for CRUD
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData }),
};

export { getToken, API_URL };
