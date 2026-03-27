import { useState, useMemo } from "react";

/**
 * সর্টিং হুক — যেকোনো টেবিলে কলাম সর্ট করতে ব্যবহার হয়
 * @param {string} defaultKey - ডিফল্ট সর্ট কলাম
 * @param {"asc"|"desc"} defaultDir - ডিফল্ট সর্ট দিক
 */
export default function useSortable(defaultKey = "", defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  // কলাম হেডারে ক্লিক করলে সর্ট টগল হবে
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ডাটা সর্ট করার ফাংশন
  const sortFn = (data) => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let va = a[sortKey] ?? "";
      let vb = b[sortKey] ?? "";
      // সংখ্যা হলে সংখ্যা হিসেবে তুলনা
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      // স্ট্রিং হলে lowercase-এ তুলনা
      va = String(va).toLowerCase();
      vb = String(vb).toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  };

  return { sortKey, sortDir, toggleSort, sortFn };
}
