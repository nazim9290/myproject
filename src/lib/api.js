const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === "localhost" ? "http://localhost:3001/api" : "https://newbook-e2v3.onrender.com/api");

function getToken() {
  return localStorage.getItem("agencyos_token");
}

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

// Auth
export const auth = {
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
};

// Students
export const students = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/students${qs ? `?${qs}` : ""}`);
  },
  get: (id) => request(`/students/${id}`),
  create: (body) => request("/students", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/students/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => request(`/students/${id}`, { method: "DELETE" }),
  addPayment: (id, body) => request(`/students/${id}/payments`, { method: "POST", body: JSON.stringify(body) }),
};

// Visitors
export const visitors = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/visitors${qs ? `?${qs}` : ""}`);
  },
  create: (body) => request("/visitors", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/visitors/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  convert: (id, body = {}) => request(`/visitors/${id}/convert`, { method: "POST", body: JSON.stringify(body) }),
};

// Attendance
export const attendance = {
  get: (date, batch) => {
    const params = new URLSearchParams({ date });
    if (batch && batch !== "all") params.set("batch", batch);
    return request(`/attendance?${params}`);
  },
  save: (date, records) => request("/attendance/save", { method: "POST", body: JSON.stringify({ date, records }) }),
};

// Accounts
export const accounts = {
  getIncome: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/accounts/income${qs ? `?${qs}` : ""}`); },
  addIncome: (body) => request("/accounts/income", { method: "POST", body: JSON.stringify(body) }),
  getExpenses: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/accounts/expenses${qs ? `?${qs}` : ""}`); },
  addExpense: (body) => request("/accounts/expenses", { method: "POST", body: JSON.stringify(body) }),
  getPayments: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/accounts/payments${qs ? `?${qs}` : ""}`); },
  addPayment: (body) => request("/accounts/payments", { method: "POST", body: JSON.stringify(body) }),
};

// Schools
export const schools = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/schools${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/schools", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/schools/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getSubmissions: (id) => request(`/schools/${id}/submissions`),
  addSubmission: (id, body) => request(`/schools/${id}/submissions`, { method: "POST", body: JSON.stringify(body) }),
  updateSubmission: (subId, body) => request(`/schools/submissions/${subId}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// Batches
export const batches = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/batches${qs ? `?${qs}` : ""}`); },
  get: (id) => request(`/batches/${id}`),
  create: (body) => request("/batches", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/batches/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  enroll: (id, studentId) => request(`/batches/${id}/enroll`, { method: "POST", body: JSON.stringify({ student_id: studentId }) }),
};

// Documents
export const documents = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/documents${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/documents", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getFields: (id) => request(`/documents/${id}/fields`),
  saveFields: (id, fields) => request(`/documents/${id}/fields`, { method: "POST", body: JSON.stringify({ fields }) }),
  crossValidate: (studentId) => request(`/documents/cross-validate/${studentId}`),
};

// HR
export const hr = {
  getEmployees: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/hr/employees${qs ? `?${qs}` : ""}`); },
  addEmployee: (body) => request("/hr/employees", { method: "POST", body: JSON.stringify(body) }),
  updateEmployee: (id, body) => request(`/hr/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getSalary: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/hr/salary${qs ? `?${qs}` : ""}`); },
  paySalary: (body) => request("/hr/salary", { method: "POST", body: JSON.stringify(body) }),
};

// Tasks
export const tasks = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/tasks${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};

// Agents
export const agents = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/agents${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/agents", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => request(`/agents/${id}`, { method: "DELETE" }),
};

// Calendar
export const calendar = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/calendar${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/calendar", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/calendar/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => request(`/calendar/${id}`, { method: "DELETE" }),
};

// Communications
export const communications = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/communications${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/communications", { method: "POST", body: JSON.stringify(body) }),
  remove: (id) => request(`/communications/${id}`, { method: "DELETE" }),
};

// Inventory
export const inventory = {
  list: () => request("/inventory"),
  create: (body) => request("/inventory", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => request(`/inventory/${id}`, { method: "DELETE" }),
};

// Submissions
export const submissions = {
  list: (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/submissions${qs ? `?${qs}` : ""}`); },
  create: (body) => request("/submissions", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => request(`/submissions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// Health check
export const health = () => request("/health");
