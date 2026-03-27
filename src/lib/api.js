/**
 * api.js — Backend API Client
 *
 * এই ফাইলে সব API endpoint-এর function আছে, module অনুযায়ী grouped।
 * প্রতিটি module-এ list, create, update, remove function থাকে।
 *
 * API URL:
 *   - লোকাল: http://localhost:5000/api
 *   - প্রোডাকশন: https://api.agencybook.net/api (VPS Nginx proxy)
 *
 * ব্যবহার:
 *   import { students } from "../lib/api";
 *   const data = await students.list({ status: "IN_COURSE" });
 *   await students.create({ name_en: "Rahim", phone: "017..." });
 */

// ═══════════════════════════════════════════════════════
// API Base URL — environment অনুযায়ী auto-detect
// ═══════════════════════════════════════════════════════
// Centralized API URL — সব ফাইলে এখান থেকে import করতে হবে
// API URL — লোকাল: localhost:5000, প্রোডাকশন: api.agencybook.net
export const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://api.agencybook.net/api"
);

/** localStorage থেকে JWT token পড়ে */
function getToken() {
  return localStorage.getItem("agencyos_token");
}

/**
 * Base HTTP request function
 * সব API call এই function দিয়ে যায়
 * - JWT token automatically header-এ যোগ হয়
 * - Error হলে throw করে
 */
async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ═══════════════════════════════════════════════════════
// Dashboard — aggregated stats
// ═══════════════════════════════════════════════════════
export const dashboard = {
  /** Dashboard stats (students, visitors, pipeline, revenue, alerts) */
  stats: () => request("/dashboard/stats"),
};

// ═══════════════════════════════════════════════════════
// Auth — লগইন ও রেজিস্ট্রেশন
// ═══════════════════════════════════════════════════════
export const auth = {
  /** Email/Password দিয়ে login → JWT token + user info পায় */
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  /** নতুন staff account তৈরি (admin only) */
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Students — স্টুডেন্ট CRUD (মূল entity)
// ═══════════════════════════════════════════════════════
export const students = {
  /** সব student আনো (search, filter, pagination support) */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/students${qs ? `?${qs}` : ""}`); },
  /** একটি student-এর বিস্তারিত (education, exams, sponsor সহ) */
  get: (id) => request(`/students/${id}`),
  /** নতুন student তৈরি */
  create: (body) => request("/students", { method: "POST", body: JSON.stringify(body) }),
  /** student info আপডেট */
  update: (id, body) => request(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** student মুছে ফেলো */
  remove: (id) => request(`/students/${id}`, { method: "DELETE" }),
  /** student-এর নতুন payment যোগ */
  addPayment: (id, body) => request(`/students/${id}/payments`, { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Visitors — ভিজিটর/লিড ট্র্যাকিং
// ═══════════════════════════════════════════════════════
export const visitors = {
  /** সব visitor আনো */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/visitors${qs ? `?${qs}` : ""}`); },
  /** নতুন visitor তৈরি */
  create: (body) => request("/visitors", { method: "POST", body: JSON.stringify(body) }),
  /** visitor info আপডেট */
  update: (id, body) => request(`/visitors/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** visitor কে student-এ convert করো */
  convert: (id, body = {}) => request(`/visitors/${id}/convert`, { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Attendance — উপস্থিতি
// ═══════════════════════════════════════════════════════
export const attendance = {
  /** নির্দিষ্ট তারিখের attendance আনো (batch filter সহ) */
  get: (date, batch) => { const p = new URLSearchParams({ date }); if (batch && batch !== "all") p.set("batch", batch); return request(`/attendance?${p}`); },
  /** একটি তারিখের সব student-এর attendance save */
  save: (date, records) => request("/attendance/save", { method: "POST", body: JSON.stringify({ date, records }) }),
};

// ═══════════════════════════════════════════════════════
// Accounts — আয়-ব্যয় হিসাব
// ═══════════════════════════════════════════════════════
export const accounts = {
  /** আয়ের তালিকা */
  getIncome: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/accounts/income${qs ? `?${qs}` : ""}`); },
  /** নতুন আয় যোগ */
  addIncome: (body) => request("/accounts/income", { method: "POST", body: JSON.stringify(body) }),
  /** ব্যয়ের তালিকা */
  getExpenses: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/accounts/expenses${qs ? `?${qs}` : ""}`); },
  /** নতুন ব্যয় যোগ */
  addExpense: (body) => request("/accounts/expenses", { method: "POST", body: JSON.stringify(body) }),
  /** পেমেন্ট তালিকা (student fee collection) */
  getPayments: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/accounts/payments${qs ? `?${qs}` : ""}`); },
  /** নতুন পেমেন্ট যোগ */
  addPayment: (body) => request("/accounts/payments", { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Schools — ভাষা স্কুল
// ═══════════════════════════════════════════════════════
export const schools = {
  /** সব স্কুলের তালিকা */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/schools${qs ? `?${qs}` : ""}`); },
  /** নতুন স্কুল যোগ */
  create: (body) => request("/schools", { method: "POST", body: JSON.stringify(body) }),
  /** স্কুল info আপডেট */
  update: (id, body) => request(`/schools/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** একটি স্কুলের সব submission আনো */
  getSubmissions: (id) => request(`/schools/${id}/submissions`),
  /** নতুন submission পাঠাও */
  addSubmission: (id, body) => request(`/schools/${id}/submissions`, { method: "POST", body: JSON.stringify(body) }),
  /** submission status আপডেট */
  updateSubmission: (subId, body) => request(`/schools/submissions/${subId}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Batches — ভাষা কোর্স ব্যাচ
// ═══════════════════════════════════════════════════════
export const batches = {
  /** সব ব্যাচের তালিকা */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/batches${qs ? `?${qs}` : ""}`); },
  /** একটি ব্যাচের বিস্তারিত (enrolled students সহ) */
  get: (id) => request(`/batches/${id}`),
  /** নতুন ব্যাচ তৈরি */
  create: (body) => request("/batches", { method: "POST", body: JSON.stringify(body) }),
  /** ব্যাচ info আপডেট */
  update: (id, body) => request(`/batches/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** ব্যাচে student enroll করো */
  enroll: (id, studentId) => request(`/batches/${id}/enroll`, { method: "POST", body: JSON.stringify({ student_id: studentId }) }),
};

// ═══════════════════════════════════════════════════════
// Documents — ডকুমেন্ট ম্যানেজমেন্ট
// ═══════════════════════════════════════════════════════
export const documents = {
  /** ডকুমেন্ট তালিকা (student_id, status filter) */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/documents${qs ? `?${qs}` : ""}`); },
  /** নতুন ডকুমেন্ট যোগ */
  create: (body) => request("/documents", { method: "POST", body: JSON.stringify(body) }),
  /** ডকুমেন্ট status/info আপডেট */
  update: (id, body) => request(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** ডকুমেন্টের extracted fields আনো */
  getFields: (id) => request(`/documents/${id}/fields`),
  /** ডকুমেন্টে extracted fields save করো */
  saveFields: (id, fields) => request(`/documents/${id}/fields`, { method: "POST", body: JSON.stringify({ fields }) }),
  /** একটি student-এর সব ডকুমেন্টের cross-validation চালাও */
  crossValidate: (studentId) => request(`/documents/cross-validate/${studentId}`),
};

// ═══════════════════════════════════════════════════════
// HR — কর্মচারী ও বেতন
// ═══════════════════════════════════════════════════════
export const hr = {
  /** কর্মচারী তালিকা */
  getEmployees: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/hr/employees${qs ? `?${qs}` : ""}`); },
  /** নতুন কর্মচারী যোগ */
  addEmployee: (body) => request("/hr/employees", { method: "POST", body: JSON.stringify(body) }),
  /** কর্মচারী info আপডেট */
  updateEmployee: (id, body) => request(`/hr/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** বেতনের ইতিহাস */
  getSalary: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/hr/salary${qs ? `?${qs}` : ""}`); },
  /** বেতন দাও */
  paySalary: (body) => request("/hr/salary", { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Tasks — টাস্ক ম্যানেজমেন্ট
// ═══════════════════════════════════════════════════════
export const tasks = {
  /** সব টাস্ক আনো (status, priority filter) */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/tasks${qs ? `?${qs}` : ""}`); },
  /** নতুন টাস্ক তৈরি */
  create: (body) => request("/tasks", { method: "POST", body: JSON.stringify(body) }),
  /** টাস্ক আপডেট (status change, assign, etc.) */
  update: (id, body) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** টাস্ক মুছে ফেলো */
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════
// Agents — রেফারেল এজেন্ট
// ═══════════════════════════════════════════════════════
export const agents = {
  /** সব এজেন্ট আনো */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/agents${qs ? `?${qs}` : ""}`); },
  /** নতুন এজেন্ট যোগ */
  create: (body) => request("/agents", { method: "POST", body: JSON.stringify(body) }),
  /** এজেন্ট info আপডেট */
  update: (id, body) => request(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** এজেন্ট মুছে ফেলো */
  remove: (id) => request(`/agents/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════
// Calendar — ক্যালেন্ডার ইভেন্ট
// ═══════════════════════════════════════════════════════
export const calendar = {
  /** সব ইভেন্ট আনো (month, type filter) */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/calendar${qs ? `?${qs}` : ""}`); },
  /** নতুন ইভেন্ট তৈরি */
  create: (body) => request("/calendar", { method: "POST", body: JSON.stringify(body) }),
  /** ইভেন্ট আপডেট */
  update: (id, body) => request(`/calendar/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** ইভেন্ট মুছে ফেলো */
  remove: (id) => request(`/calendar/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════
// Communications — যোগাযোগ লগ
// ═══════════════════════════════════════════════════════
export const communications = {
  /** সব communication log (student_id, type filter) */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/communications${qs ? `?${qs}` : ""}`); },
  /** নতুন log যোগ (call, sms, whatsapp, meeting) */
  create: (body) => request("/communications", { method: "POST", body: JSON.stringify(body) }),
  /** log মুছে ফেলো */
  remove: (id) => request(`/communications/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════
// Inventory — সম্পদ ও মালামাল
// ═══════════════════════════════════════════════════════
export const inventory = {
  /** সব inventory item আনো */
  list: () => request("/inventory"),
  /** নতুন item যোগ */
  create: (body) => request("/inventory", { method: "POST", body: JSON.stringify(body) }),
  /** item আপডেট */
  update: (id, body) => request(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** item মুছে ফেলো */
  remove: (id) => request(`/inventory/${id}`, { method: "DELETE" }),
};

// ═══════════════════════════════════════════════════════
// Submissions — স্কুলে submission
// ═══════════════════════════════════════════════════════
export const submissions = {
  /** সব submission আনো (school_id, student_id filter) */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/submissions${qs ? `?${qs}` : ""}`); },
  /** নতুন submission তৈরি */
  create: (body) => request("/submissions", { method: "POST", body: JSON.stringify(body) }),
  /** submission status আপডেট */
  update: (id, body) => request(`/submissions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Users — ইউজার ও Branch ম্যানেজমেন্ট
// ═══════════════════════════════════════════════════════
export const users = {
  /** সব ইউজার তালিকা */
  list: () => request("/users"),
  /** ইউজার আপডেট (role, branch, status) */
  update: (id, body) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** ইউজার মুছে ফেলো */
  remove: (id) => request(`/users/${id}`, { method: "DELETE" }),
  /** Branch তালিকা */
  branches: () => request("/users/branches"),
  /** Available roles */
  roles: () => request("/users/roles"),
};

// ═══════════════════════════════════════════════════════
// Reports — রিপোর্ট ও Analytics
// ═══════════════════════════════════════════════════════
export const reports = {
  /** Pipeline funnel, source, dropout, country analytics */
  analytics: () => request("/reports/analytics"),
};

// ═══════════════════════════════════════════════════════
// Partners — পার্টনার এজেন্সি (B2B)
// ═══════════════════════════════════════════════════════
export const partners = {
  /** সব partner তালিকা */
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/partners${qs ? `?${qs}` : ""}`); },
  /** নতুন partner তৈরি */
  create: (body) => request("/partners", { method: "POST", body: JSON.stringify(body) }),
  /** partner আপডেট */
  update: (id, body) => request(`/partners/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  /** partner মুছে ফেলো */
  remove: (id) => request(`/partners/${id}`, { method: "DELETE" }),
  /** partner-এর students */
  getStudents: (id) => request(`/partners/${id}/students`),
  /** partner-এ student যোগ */
  addStudent: (id, body) => request(`/partners/${id}/students`, { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Pre-Departure — প্রি-ডিপার্চার ও VFS
// ═══════════════════════════════════════════════════════
export const preDeparture = {
  /** departure-eligible students + checklist */
  list: () => request("/pre-departure"),
  /** student-এর departure data update */
  update: (studentId, body) => request(`/pre-departure/${studentId}`, { method: "POST", body: JSON.stringify(body) }),
};

// ═══════════════════════════════════════════════════════
// Health — সার্ভার চালু আছে কিনা check
// ═══════════════════════════════════════════════════════
export const health = () => request("/health");
