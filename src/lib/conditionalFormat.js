// ════════════════════════════════════════════════════════════════
// conditionalFormat.js — শর্তভিত্তিক সারি রং (Conditional Row Coloring)
// localStorage-এ রুল সংরক্ষণ করে এবং ডাটা অনুযায়ী সারির ব্যাকগ্রাউন্ড রিটার্ন করে
// ════════════════════════════════════════════════════════════════

// ── localStorage কী ──
const STORAGE_KEY = "agencybook_row_rules";

// ── প্রি-ডিফাইন্ড রং — ডার্ক/লাইট উভয় থিমে ভালো দেখায় ──
export const AVAILABLE_COLORS = [
  { value: "rgba(239, 68, 68, 0.08)",  label: "লাল",    preview: "#ef4444" },
  { value: "rgba(245, 158, 11, 0.08)", label: "অ্যাম্বার", preview: "#f59e0b" },
  { value: "rgba(34, 197, 94, 0.08)",  label: "সবুজ",   preview: "#22c55e" },
  { value: "rgba(59, 130, 246, 0.08)", label: "নীল",    preview: "#3b82f6" },
  { value: "rgba(168, 85, 247, 0.08)", label: "বেগুনি",  preview: "#a855f7" },
  { value: "rgba(236, 72, 153, 0.08)", label: "পিংক",   preview: "#ec4899" },
  { value: "rgba(6, 182, 212, 0.08)",  label: "সায়ান",  preview: "#06b6d4" },
];

// ── অপারেটর তালিকা — সব ধরনের তুলনা সমর্থন করে ──
export const OPERATORS = [
  { value: "equals",       label: "সমান" },
  { value: "not_equals",   label: "সমান নয়" },
  { value: "contains",     label: "ধারণ করে" },
  { value: "not_contains", label: "ধারণ করে না" },
  { value: "greater_than", label: "বড়" },
  { value: "less_than",    label: "ছোট" },
  { value: "is_empty",     label: "খালি" },
  { value: "is_not_empty", label: "খালি নয়" },
  { value: "before_today", label: "আজকের আগে" },
  { value: "after_today",  label: "আজকের পরে" },
];

// ── localStorage থেকে সব রুল পড়া (JSON parse) ──
function loadAllRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── localStorage-এ সব রুল সেভ করা ──
function saveAllRules(allRules) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allRules));
}

// ── নির্দিষ্ট মডিউলের রুলগুলো রিটার্ন করে ──
export function getRules(module) {
  const all = loadAllRules();
  return all[module] || [];
}

// ── নির্দিষ্ট মডিউলে রুল সেভ করে ──
export function saveRules(module, rules) {
  const all = loadAllRules();
  all[module] = rules;
  saveAllRules(all);
}

// ════════════════════════════════════════════════════════════════
// একটি রুল দিয়ে একটি ফিল্ড ভ্যালু পরীক্ষা করে — ম্যাচ হলে true রিটার্ন করে
// ════════════════════════════════════════════════════════════════
function evaluateRule(rule, rowData) {
  // ফিল্ড ভ্যালু বের করা — নেস্টেড ফিল্ড সাপোর্ট (যেমন "fees.total")
  const fieldValue = rule.field.split(".").reduce((obj, key) => {
    if (obj == null) return undefined;
    return obj[key];
  }, rowData);

  const { operator, value: ruleValue } = rule;

  // ── খালি চেক — null, undefined, "" সবই "empty" ──
  if (operator === "is_empty") {
    return fieldValue == null || String(fieldValue).trim() === "";
  }
  if (operator === "is_not_empty") {
    return fieldValue != null && String(fieldValue).trim() !== "";
  }

  // ── তারিখ তুলনা — আজকের সাথে তুলনা করে ──
  if (operator === "before_today" || operator === "after_today") {
    if (!fieldValue) return false;
    const fieldDate = new Date(fieldValue);
    if (isNaN(fieldDate.getTime())) return false; // অবৈধ তারিখ
    const today = new Date();
    today.setHours(0, 0, 0, 0); // দিনের শুরু
    return operator === "before_today"
      ? fieldDate < today
      : fieldDate > today;
  }

  // ── স্ট্রিং তুলনা — case-insensitive ──
  const fieldStr = String(fieldValue ?? "").toLowerCase();
  const ruleStr = String(ruleValue ?? "").toLowerCase();

  switch (operator) {
    case "equals":
      return fieldStr === ruleStr;

    case "not_equals":
      return fieldStr !== ruleStr;

    case "contains":
      return fieldStr.includes(ruleStr);

    case "not_contains":
      return !fieldStr.includes(ruleStr);

    // ── সংখ্যা তুলনা — নম্বর হিসেবে parse করে ──
    case "greater_than": {
      const numField = parseFloat(fieldValue);
      const numRule = parseFloat(ruleValue);
      if (isNaN(numField) || isNaN(numRule)) return false;
      return numField > numRule;
    }

    case "less_than": {
      const numField = parseFloat(fieldValue);
      const numRule = parseFloat(ruleValue);
      if (isNaN(numField) || isNaN(numRule)) return false;
      return numField < numRule;
    }

    default:
      return false;
  }
}

// ════════════════════════════════════════════════════════════════
// getRowStyle — একটি সারির ডাটা দিয়ে ম্যাচিং রুলের ব্যাকগ্রাউন্ড রিটার্ন করে
// প্রথম ম্যাচই জিতবে (priority order অনুযায়ী)
// ম্যাচ না হলে null রিটার্ন করে
// ════════════════════════════════════════════════════════════════
export function getRowStyle(module, rowData) {
  const rules = getRules(module);

  // সক্রিয় (enabled) রুলগুলো ক্রমানুসারে পরীক্ষা করা
  for (const rule of rules) {
    if (!rule.enabled) continue; // নিষ্ক্রিয় রুল বাদ
    if (evaluateRule(rule, rowData)) {
      return { background: rule.color };
    }
  }

  // কোনো রুল ম্যাচ হয়নি
  return null;
}
