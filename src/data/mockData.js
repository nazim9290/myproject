// Dashboard mock data
export const revenueData = [
  { month: "Sep", amount: 620000 }, { month: "Oct", amount: 780000 },
  { month: "Nov", amount: 850000 }, { month: "Dec", amount: 920000 },
  { month: "Jan", amount: 1050000 }, { month: "Feb", amount: 980000 },
  { month: "Mar", amount: 1250000 },
];
export const pipelineChartData = [
  { stage: "Visitor", count: 120 }, { stage: "Follow-up", count: 95 },
  { stage: "Enrolled", count: 45 }, { stage: "Exam Pass", count: 38 },
  { stage: "Doc Done", count: 30 }, { stage: "Submitted", count: 28 },
  { stage: "COE", count: 22 }, { stage: "Visa", count: 20 },
  { stage: "Arrived", count: 18 },
];
export const alerts = [
  { type: "critical", icon: "💰", text: "৫ জন স্টুডেন্টের কোর্স ফি কিস্তি overdue", time: "২ ঘণ্টা আগে" },
  { type: "critical", icon: "📄", text: "Tokyo Galaxy — ২ জনের recheck বাকি (৫ দিন)", time: "৩ ঘণ্টা আগে" },
  { type: "warning", icon: "🛂", text: "৩ জনের পাসপোর্ট ৬ মাসে expire হবে", time: "আজ" },
  { type: "warning", icon: "📞", text: "৮ জন visitor এর ৭+ দিন follow-up হয়নি", time: "আজ" },
  { type: "info", icon: "💻", text: "আগামীকাল Skype Interview — ৩ জন", time: "সিস্টেম" },
];

// Document module
export const DOC_TYPES = [
  { id: "passport", name: "পাসপোর্ট", name_en: "Passport", fields: ["name_en", "father_en", "dob", "permanent_address"], base: true },
  { id: "birth_cert", name: "জন্ম নিবন্ধন", name_en: "Birth Certificate", fields: ["name_en", "father_en", "mother_en", "dob", "permanent_address"], base: true },
  { id: "nid", name: "জাতীয় পরিচয়পত্র", name_en: "NID", fields: ["name_en", "dob", "permanent_address"], base: true },
  { id: "ssc_cert", name: "SSC সার্টিফিকেট", name_en: "SSC Certificate", fields: ["name_en", "father_en"], base: true },
  { id: "ssc_mark", name: "SSC মার্কশিট", name_en: "SSC Marksheet", fields: ["name_en"], base: true },
  { id: "hsc_cert", name: "HSC সার্টিফিকেট", name_en: "HSC Certificate", fields: ["name_en", "father_en"], base: true },
  { id: "hsc_mark", name: "HSC মার্কশিট", name_en: "HSC Marksheet", fields: ["name_en"], base: true },
  { id: "family_cert", name: "ফ্যামিলি সার্টিফিকেট", name_en: "Family Certificate", fields: ["name_en", "father_en", "mother_en", "permanent_address"], base: true },
  { id: "bank_stmt", name: "ব্যাংক স্টেটমেন্ট", name_en: "Bank Statement", fields: ["name_en"], base: true },
  { id: "photo", name: "ছবি (4.5x3.5)", name_en: "Photo", fields: [], base: true },
  { id: "jlpt_cert", name: "JLPT/NAT Certificate", name_en: "JLPT/NAT Certificate", fields: ["name_en"], base: true },
  { id: "marriage_cert", name: "বিবাহের সার্টিফিকেট", name_en: "Marriage Certificate", fields: ["name_en"], base: false, condition: "married" },
  { id: "degree_cert", name: "ডিগ্রি সার্টিফিকেট", name_en: "Degree Certificate", fields: ["name_en", "father_en"], base: false, condition: "bachelor+" },
  { id: "employment_cert", name: "চাকরির সার্টিফিকেট", name_en: "Employment Certificate", fields: ["name_en"], base: false, condition: "employed" },
  { id: "gap_explanation", name: "গ্যাপ ইয়ার ব্যাখ্যা", name_en: "Gap Year Explanation", fields: [], base: false, condition: "age>25" },
];

export const INITIAL_STUDENT_DOCS = {
  "S-2026-001": {
    docs: [
      { docId: "passport", status: "verified", uploadDate: "2026-01-10", data: { name_en: "MOHAMMAD RAHIM UDDIN", father_en: "ABDUL KARIM", dob: "1999-05-15", permanent_address: "Vill: Kamal, Upazila: Sadar, Dist: Gazipur" } },
      { docId: "birth_cert", status: "issue", uploadDate: "2026-01-12", data: { name_en: "MOHAMMAD RAHIM UDDIN", father_en: "ABDUL KARIM", mother_en: "FATEMA BEGUM", dob: "1999-05-15", permanent_address: "Vill: Kamol, Upazila: Sadar, Dist: Gazipur" } },
      { docId: "nid", status: "submitted", uploadDate: "2026-01-15", data: { name_en: "MD. RAHIM UDDIN", dob: "1999-05-15", permanent_address: "Vill: Kamal, Upazila: Sadar, Dist: Gazipur" } },
      { docId: "ssc_cert", status: "verified", uploadDate: "2026-01-08", data: { name_en: "MOHAMMAD RAHIM UDDIN", father_en: "ABDUL KARIM" } },
      { docId: "ssc_mark", status: "verified", uploadDate: "2026-01-08", data: { name_en: "MOHAMMAD RAHIM UDDIN" } },
      { docId: "hsc_cert", status: "not_submitted", data: {} },
      { docId: "hsc_mark", status: "not_submitted", data: {} },
      { docId: "family_cert", status: "submitted", uploadDate: "2026-02-01", data: { name_en: "MOHAMMAD RAHIM UDDIN", father_en: "ABD. KARIM", mother_en: "FATEMA BEGUM", permanent_address: "Vill: Kamal, Upazila: Sadar, Dist: Gazipur" } },
      { docId: "bank_stmt", status: "not_submitted", data: {} },
      { docId: "photo", status: "verified", uploadDate: "2026-01-05", data: {} },
      { docId: "jlpt_cert", status: "submitted", uploadDate: "2026-02-20", data: { name_en: "MOHAMMAD RAHIM UDDIN" } },
    ],
    mismatches: [
      { field: "name_en", docs: ["passport", "nid"], values: ["MOHAMMAD RAHIM UDDIN", "MD. RAHIM UDDIN"], severity: "warning" },
      { field: "father_en", docs: ["passport", "family_cert"], values: ["ABDUL KARIM", "ABD. KARIM"], severity: "warning" },
      { field: "permanent_address", docs: ["passport", "birth_cert"], values: ["Vill: Kamal...", "Vill: Kamol..."], severity: "error" },
    ],
  },
  "S-2026-002": {
    docs: [
      { docId: "passport", status: "verified", uploadDate: "2025-12-20", data: { name_en: "KAMAL HOSSAIN", father_en: "JAMAL HOSSAIN", dob: "2000-03-20", permanent_address: "Vill: Dakshin, Upazila: Raozan, Dist: Chittagong" } },
      { docId: "birth_cert", status: "verified", uploadDate: "2025-12-22", data: { name_en: "KAMAL HOSSAIN", father_en: "JAMAL HOSSAIN", mother_en: "RAHIMA KHATUN", dob: "2000-03-20", permanent_address: "Vill: Dakshin, Upazila: Raozan, Dist: Chittagong" } },
      { docId: "nid", status: "verified", uploadDate: "2025-12-25", data: { name_en: "KAMAL HOSSAIN", dob: "2000-03-20", permanent_address: "Vill: Dakshin, Upazila: Raozan, Dist: Chittagong" } },
      { docId: "ssc_cert", status: "verified", uploadDate: "2025-12-18", data: { name_en: "KAMAL HOSSAIN", father_en: "JAMAL HOSSAIN" } },
      { docId: "ssc_mark", status: "verified", uploadDate: "2025-12-18", data: { name_en: "KAMAL HOSSAIN" } },
      { docId: "hsc_cert", status: "verified", uploadDate: "2025-12-18", data: { name_en: "KAMAL HOSSAIN", father_en: "JAMAL HOSSAIN" } },
      { docId: "hsc_mark", status: "verified", uploadDate: "2025-12-18", data: { name_en: "KAMAL HOSSAIN" } },
      { docId: "family_cert", status: "verified", uploadDate: "2026-01-05", data: { name_en: "KAMAL HOSSAIN", father_en: "JAMAL HOSSAIN", mother_en: "RAHIMA KHATUN", permanent_address: "Vill: Dakshin, Upazila: Raozan, Dist: Chittagong" } },
      { docId: "bank_stmt", status: "submitted", uploadDate: "2026-01-10", data: { name_en: "KAMAL HOSSAIN" } },
      { docId: "photo", status: "verified", uploadDate: "2025-12-15", data: {} },
      { docId: "jlpt_cert", status: "verified", uploadDate: "2026-02-10", data: { name_en: "KAMAL HOSSAIN" } },
    ],
    mismatches: [],
  },
};

export const DOC_STATUS_CONFIG = {
  not_submitted: { label: "জমা হয়নি", icon: "⬜", color: "#64748b", bgClass: "opacity-40" },
  submitted: { label: "জমা হয়েছে", icon: "📄", color: "#eab308", bgClass: "" },
  verified: { label: "যাচাই সম্পন্ন", icon: "✅", color: "#22c55e", bgClass: "" },
  issue: { label: "সমস্যা আছে", icon: "⚠️", color: "#f43f5e", bgClass: "" },
};

// Language course module
export const BATCHES = [
  { id: "B-A26", name: "Batch April 2026", country: "Japan", startDate: "2025-10-01", endDate: "2026-03-31", capacity: 25, level: "N5→N4", schedule: "Sun-Thu, 10AM-1PM", teacher: "Tanaka Sensei" },
  { id: "B-O26", name: "Batch October 2026", country: "Japan", startDate: "2026-04-01", endDate: "2026-09-30", capacity: 20, level: "N5", schedule: "Sun-Thu, 2PM-5PM", teacher: "Yamamoto Sensei" },
  { id: "B-G26", name: "German Batch 2026", country: "Germany", startDate: "2026-01-15", endDate: "2026-06-30", capacity: 15, level: "A1→A2", schedule: "Mon-Wed, 10AM-1PM", teacher: "Herr Mueller" },
];

export const BATCH_STUDENTS = {
  "B-A26": [
    { studentId: "S-2026-001", name: "Mohammad Rahim", attendance: 88, lastTest: 78, jlptLevel: "N5", jlptScore: 120, jlptStatus: "Passed", examType: "JLPT" },
    { studentId: "S-2026-002", name: "Kamal Hossain", attendance: 95, lastTest: 92, jlptLevel: "N5", jlptScore: 145, jlptStatus: "Passed", examType: "NAT" },
    { studentId: "S-2026-003", name: "Fatema Akter", attendance: 82, lastTest: 65, jlptLevel: "N5", jlptScore: 105, jlptStatus: "Passed", examType: "JLPT" },
    { studentId: "S-2026-004", name: "Nasrin Sultana", attendance: 92, lastTest: 88, jlptLevel: "N4", jlptScore: 95, jlptStatus: "Passed", examType: "JLPT" },
    { studentId: "S-2026-006", name: "Sohel Rana", attendance: 75, lastTest: 55, jlptLevel: "N5", jlptScore: null, jlptStatus: "Not Taken", examType: null },
    { studentId: "S-2026-009", name: "Tamanna Islam", attendance: 45, lastTest: 30, jlptLevel: null, jlptScore: null, jlptStatus: "Dropped", examType: null },
  ],
  "B-O26": [
    { studentId: "S-2026-005", name: "Rafiqul Islam", attendance: 90, lastTest: 70, jlptLevel: null, jlptScore: null, jlptStatus: "Preparing", examType: null },
    { studentId: "S-2026-007", name: "Ayesha Siddiqua", attendance: 85, lastTest: null, jlptLevel: null, jlptScore: null, jlptStatus: "Not Started", examType: null },
  ],
  "B-G26": [],
};

export const CLASS_TESTS = [
  { batchId: "B-A26", testName: "Test 1 — Hiragana", date: "2025-11-01", avgScore: 72 },
  { batchId: "B-A26", testName: "Test 2 — Katakana", date: "2025-12-01", avgScore: 75 },
  { batchId: "B-A26", testName: "Test 3 — Grammar N5", date: "2026-01-15", avgScore: 68 },
  { batchId: "B-A26", testName: "Test 4 — Listening", date: "2026-02-15", avgScore: 71 },
  { batchId: "B-A26", testName: "Mock JLPT N5", date: "2026-03-10", avgScore: 74 },
];

// Accounts & Finance module
export const INCOME_DATA = [
  { id: "INC-001", studentId: "S-2026-001", studentName: "Mohammad Rahim", category: "course_fee", amount: 45000, tax: 6750, installments: 3, paid: 2, paidAmount: 30000, dueDate: "2026-03-30", status: "partial" },
  { id: "INC-002", studentId: "S-2026-002", studentName: "Kamal Hossain", category: "course_fee", amount: 45000, tax: 6750, installments: 3, paid: 3, paidAmount: 45000, dueDate: null, status: "paid" },
  { id: "INC-003", studentId: "S-2026-001", studentName: "Mohammad Rahim", category: "doc_processing", amount: 15000, tax: 0, installments: 1, paid: 0, paidAmount: 0, dueDate: "2026-04-15", status: "unpaid" },
  { id: "INC-004", studentId: "S-2026-004", studentName: "Nasrin Sultana", category: "service_charge", amount: 50000, tax: 0, installments: 1, paid: 1, paidAmount: 50000, dueDate: null, status: "paid" },
  { id: "INC-005", studentId: "S-2026-006", studentName: "Sohel Rana", category: "course_fee", amount: 45000, tax: 6750, installments: 3, paid: 3, paidAmount: 45000, dueDate: null, status: "paid" },
  { id: "INC-006", studentId: "S-2026-006", studentName: "Sohel Rana", category: "doc_processing", amount: 15000, tax: 0, installments: 1, paid: 1, paidAmount: 15000, dueDate: null, status: "paid" },
  { id: "INC-007", studentId: "S-2026-003", studentName: "Fatema Akter", category: "course_fee", amount: 45000, tax: 6750, installments: 3, paid: 1, paidAmount: 15000, dueDate: "2026-04-01", status: "partial" },
  { id: "INC-008", studentId: "S-2026-008", studentName: "Mizanur Rahman", category: "partner_service", amount: 20000, tax: 0, installments: 1, paid: 1, paidAmount: 20000, dueDate: null, status: "paid" },
  { id: "INC-009", studentId: "S-2026-002", studentName: "Kamal Hossain", category: "doc_processing", amount: 15000, tax: 0, installments: 1, paid: 1, paidAmount: 15000, dueDate: null, status: "paid" },
  { id: "INC-010", studentId: "S-2026-002", studentName: "Kamal Hossain", category: "service_charge", amount: 50000, tax: 0, installments: 2, paid: 1, paidAmount: 25000, dueDate: "2026-04-10", status: "partial" },
];

export const EXPENSE_DATA = [
  { id: "EXP-001", category: "salary", description: "মার্চ বেতন — ১২ জন", amount: 240000, date: "2026-03-01" },
  { id: "EXP-002", category: "rent", description: "অফিস ভাড়া — ঢাকা HQ", amount: 45000, date: "2026-03-01" },
  { id: "EXP-003", category: "marketing", description: "Facebook Ads — মার্চ", amount: 35000, date: "2026-03-05" },
  { id: "EXP-004", category: "agent_fee", description: "Agent Hafiz — ৩ students", amount: 30000, date: "2026-03-10" },
  { id: "EXP-005", category: "utility", description: "বিদ্যুৎ + ইন্টারনেট", amount: 8000, date: "2026-03-08" },
  { id: "EXP-006", category: "agent_fee", description: "Agent Rahim — ২ students", amount: 20000, date: "2026-03-15" },
  { id: "EXP-007", category: "office_supply", description: "প্রিন্টার + কাগজ", amount: 5000, date: "2026-03-12" },
  { id: "EXP-008", category: "rent", description: "অফিস ভাড়া — চট্টগ্রাম", amount: 25000, date: "2026-03-01" },
  { id: "EXP-009", category: "marketing", description: "Banner + Flyer Print", amount: 12000, date: "2026-03-18" },
  { id: "EXP-010", category: "misc", description: "কুরিয়ার + ডকুমেন্ট পাঠানো", amount: 6000, date: "2026-03-20" },
];

export const MONTHLY_REVENUE = [
  { month: "Oct '25", income: 620000, expense: 380000 },
  { month: "Nov '25", income: 780000, expense: 410000 },
  { month: "Dec '25", income: 850000, expense: 420000 },
  { month: "Jan '26", income: 920000, expense: 450000 },
  { month: "Feb '26", income: 1050000, expense: 440000 },
  { month: "Mar '26", income: 1250000, expense: 426000 },
];

export const CATEGORY_CONFIG = {
  enrollment_fee: { label: "ভর্তি ফি", color: "#6ee7b7", icon: "📝" },
  course_fee:     { label: "কোর্স ফি", color: "#06b6d4", icon: "📚" },
  doc_processing: { label: "ডক প্রসেসিং ফি", color: "#a855f7", icon: "📄" },
  visa_fee:       { label: "ভিসা ফি", color: "#c084fc", icon: "🛂" },
  service_charge: { label: "সার্ভিস চার্জ", color: "#22c55e", icon: "💼" },
  shokai_fee:     { label: "শোকাই ফি", color: "#f472b6", icon: "🎌" },
  partner_service:{ label: "Partner Service", color: "#eab308", icon: "🤝" },
  other_income:   { label: "অন্যান্য আয়", color: "#94a3b8", icon: "💰" },
  salary:         { label: "বেতন", color: "#f472b6", icon: "👥" },
  rent:           { label: "ভাড়া", color: "#fb923c", icon: "🏢" },
  marketing:      { label: "মার্কেটিং", color: "#60a5fa", icon: "📢" },
  agent_fee:      { label: "Agent Fee", color: "#fbbf24", icon: "🕵️" },
  utility:        { label: "ইউটিলিটি", color: "#34d399", icon: "⚡" },
  office_supply:  { label: "অফিস সাপ্লাই", color: "#c084fc", icon: "🖨️" },
  misc:           { label: "অন্যান্য ব্যয়", color: "#94a3b8", icon: "📦" },
};

// Standard fee categories shown in student fee structure
export const FEE_CATEGORIES = [
  { id: "enrollment_fee", label: "ভর্তি ফি",         icon: "📝", color: "#6ee7b7" },
  { id: "course_fee",     label: "কোর্স ফি",          icon: "📚", color: "#06b6d4" },
  { id: "doc_processing", label: "ডক প্রসেসিং ফি",   icon: "📄", color: "#a855f7" },
  { id: "visa_fee",       label: "ভিসা ফি",           icon: "🛂", color: "#c084fc" },
  { id: "service_charge", label: "সার্ভিস চার্জ",    icon: "💼", color: "#22c55e" },
  { id: "shokai_fee",     label: "শোকাই ফি",          icon: "🎌", color: "#f472b6" },
  { id: "other_income",   label: "অন্যান্য",          icon: "💰", color: "#94a3b8" },
];

// Schools module
export const SCHOOLS_DATA = [
  { id: "SCH-001", name_en: "Tokyo Galaxy Japanese Language School", name_jp: "東京ギャラクシー日本語学校", country: "Japan", city: "Tokyo", address: "東京都中央区新川1-15-13", contact: "+81-3-6280-5830", website: "tokyogalaxy.ac.jp", shoukaiPerStudent: 30000, currency: "JPY", studentsReferred: 15, studentsArrived: 8, healthRequired: ["Chest X-Ray", "Blood Test"], status: "active" },
  { id: "SCH-002", name_en: "Osaka YMCA International College", name_jp: "大阪YMCA国際専門学校", country: "Japan", city: "Osaka", address: "大阪市西区土佐堀1-5-6", contact: "+81-6-6441-0892", website: "osakymca.ac.jp", shoukaiPerStudent: 25000, currency: "JPY", studentsReferred: 8, studentsArrived: 5, healthRequired: ["Chest X-Ray"], status: "active" },
  { id: "SCH-003", name_en: "Fukuoka Japanese Language School", name_jp: "福岡日本語学校", country: "Japan", city: "Fukuoka", address: "福岡市博多区博多駅前3-22-8", contact: "+81-92-431-0015", website: "fukuoka-lang.jp", shoukaiPerStudent: 20000, currency: "JPY", studentsReferred: 6, studentsArrived: 4, healthRequired: [], status: "active" },
  { id: "SCH-004", name_en: "Goethe-Institut Dhaka", name_jp: "", country: "Germany", city: "Dhaka", address: "House 10, Road 9, Dhanmondi, Dhaka", contact: "+880-2-8617839", website: "goethe.de/dhaka", shoukaiPerStudent: 0, currency: "EUR", studentsReferred: 3, studentsArrived: 1, healthRequired: [], status: "active" },
];

export const SUBMISSIONS_DATA = [
  { id: "SUB-001", studentId: "S-2026-001", studentName: "Mohammad Rahim", schoolId: "SCH-001", schoolName: "Tokyo Galaxy", submissionDate: "2026-02-15", submissionNo: 1, status: "issues_found",
    feedback: [
      { doc: "পাসপোর্ট ফটোকপি", issue: "অস্পষ্ট — আবার scan করুন", date: "2026-02-20" },
      { doc: "ব্যাংক স্টেটমেন্ট", issue: "৬ মাসের নেই, ৪ মাসের দিয়েছে", date: "2026-02-20" },
    ]},
  { id: "SUB-002", studentId: "S-2026-001", studentName: "Mohammad Rahim", schoolId: "SCH-001", schoolName: "Tokyo Galaxy", submissionDate: "2026-03-01", submissionNo: 2, status: "minor_issues",
    feedback: [
      { doc: "ব্যাংক স্টেটমেন্ট", issue: "১ মাস কম — মে পর্যন্ত দরকার", date: "2026-03-05" },
    ]},
  { id: "SUB-003", studentId: "S-2026-002", studentName: "Kamal Hossain", schoolId: "SCH-002", schoolName: "Osaka YMCA", submissionDate: "2026-01-20", submissionNo: 1, status: "accepted",
    feedback: [] },
  { id: "SUB-004", studentId: "S-2026-006", studentName: "Sohel Rana", schoolId: "SCH-001", schoolName: "Tokyo Galaxy", submissionDate: "2026-01-10", submissionNo: 1, status: "accepted",
    feedback: [] },
  { id: "SUB-005", studentId: "S-2026-006", studentName: "Sohel Rana", schoolId: "SCH-001", schoolName: "Tokyo Galaxy", submissionDate: "2026-01-10", submissionNo: 1, status: "forwarded_immigration",
    feedback: [] },
  { id: "SUB-006", studentId: "S-2026-004", studentName: "Nasrin Sultana", schoolId: "SCH-003", schoolName: "Fukuoka Lang.", submissionDate: "2025-12-10", submissionNo: 1, status: "coe_received",
    feedback: [] },
];

export const SUB_STATUS = {
  submitted: { label: "জমা দেওয়া হয়েছে", color: "#eab308", icon: "📤" },
  issues_found: { label: "সমস্যা পাওয়া গেছে", color: "#f43f5e", icon: "🔴" },
  minor_issues: { label: "ছোট সমস্যা", color: "#fb923c", icon: "🟡" },
  accepted: { label: "গ্রহণ করা হয়েছে", color: "#22c55e", icon: "✅" },
  forwarded_immigration: { label: "ইমিগ্রেশনে পাঠানো", color: "#06b6d4", icon: "📋" },
  coe_received: { label: "COE পেয়েছে", color: "#a855f7", icon: "🎉" },
};

// Tasks module
export const TASKS_DATA = [
  { id: "T-001", title: "Rahim এর HSC Certificate collect করো", assignee: "Jamal", assigneeRole: "Doc Collector", studentId: "S-2026-001", studentName: "Mohammad Rahim", priority: "high", status: "todo", dueDate: "2026-03-22", autoCreated: true, trigger: "DOC_COLLECTION" },
  { id: "T-002", title: "৩ জনের Japanese Translation শেষ করো", assignee: "Mina", assigneeRole: "Doc Processor", studentId: null, studentName: null, priority: "high", status: "in_progress", dueDate: "2026-03-22", autoCreated: false, trigger: null },
  { id: "T-003", title: "Tokyo Galaxy তে recheck ডক পাঠাও", assignee: "Karim", assigneeRole: "Doc Processor", studentId: "S-2026-001", studentName: "Mohammad Rahim", priority: "medium", status: "todo", dueDate: "2026-03-23", autoCreated: true, trigger: "RECHECK" },
  { id: "T-004", title: "৫ জন visitor কে follow-up call দাও", assignee: "Sadia", assigneeRole: "Follow-up", studentId: null, studentName: null, priority: "medium", status: "todo", dueDate: "2026-03-22", autoCreated: true, trigger: "FOLLOW_UP_DUE" },
  { id: "T-005", title: "Fatema এর VFS ফর্ম তৈরি করো", assignee: "Rana", assigneeRole: "Doc Processor", studentId: "S-2026-003", studentName: "Fatema Akter", priority: "low", status: "done", dueDate: "2026-03-20", autoCreated: false, trigger: null },
  { id: "T-006", title: "Nasrin এর Airport Checklist print করো", assignee: "Karim", assigneeRole: "Doc Processor", studentId: "S-2026-004", studentName: "Nasrin Sultana", priority: "high", status: "in_progress", dueDate: "2026-03-24", autoCreated: true, trigger: "PRE_DEPARTURE" },
  { id: "T-007", title: "Agent Hafiz কে ৳৩০,০০০ শোকাই ফি দাও", assignee: "Rana", assigneeRole: "Accounts", studentId: null, studentName: null, priority: "medium", status: "todo", dueDate: "2026-03-25", autoCreated: false, trigger: null },
  { id: "T-008", title: "Kamal এর Health Test Schedule করো", assignee: "Sadia", assigneeRole: "Follow-up", studentId: "S-2026-002", studentName: "Kamal Hossain", priority: "high", status: "todo", dueDate: "2026-03-23", autoCreated: true, trigger: "COE_RECEIVED" },
];

export const PRIORITY_CONFIG = { high: { label: "High", color: "#f43f5e" }, medium: { label: "Medium", color: "#eab308" }, low: { label: "Low", color: "#06b6d4" } };
export const TASK_STATUS_CONFIG = { todo: { label: "করতে হবে", color: "#94a3b8" }, in_progress: { label: "চলছে", color: "#eab308" }, done: { label: "সম্পন্ন", color: "#22c55e" } };

// Agents module
export const AGENTS_DATA = [
  { id: "AG-001", name: "Hafizur Rahman", phone: "01712340010", area: "Comilla", commissionPerStudent: 10000, status: "active", students: [
    { name: "Mohammad Rahim", id: "S-2026-001", status: "DOC_COLLECTION", feePaid: true },
    { name: "Mizanur Rahman", id: "S-2026-008", status: "DOC_COLLECTION", feePaid: false },
    { name: "Rafiqul Islam", id: "S-2026-005", status: "IN_COURSE", feePaid: false },
  ]},
  { id: "AG-002", name: "Abdur Rahim", phone: "01812340020", area: "Sylhet", commissionPerStudent: 8000, status: "active", students: [
    { name: "Habibur Rahman", id: "S-2026-010", status: "ARRIVED", feePaid: true },
    { name: "Sohel Rana", id: "S-2026-006", status: "COE_RECEIVED", feePaid: true },
  ]},
  { id: "AG-003", name: "Kamrul Hasan", phone: "01912340030", area: "Dhaka", commissionPerStudent: 12000, status: "active", students: [
    { name: "Nasrin Sultana", id: "S-2026-004", status: "VISA_GRANTED", feePaid: false },
  ]},
  { id: "AG-004", name: "Selim Reza", phone: "01612340040", area: "Chittagong", commissionPerStudent: 10000, status: "inactive", students: [] },
];

// Reports module
export const REPORT_PIPELINE_FUNNEL = [
  { stage: "Visitor", count: 320 }, { stage: "Follow-up", count: 260 },
  { stage: "Enrolled", count: 145 }, { stage: "Exam Pass", count: 120 },
  { stage: "Doc Done", count: 95 }, { stage: "Submitted", count: 88 },
  { stage: "COE", count: 72 }, { stage: "Visa", count: 65 },
  { stage: "Arrived", count: 58 },
];
export const SOURCE_DATA = [
  { source: "Facebook", visitors: 120, enrolled: 52, conversion: 43 },
  { source: "Agent", visitors: 95, enrolled: 48, conversion: 51 },
  { source: "Walk-in", visitors: 65, enrolled: 30, conversion: 46 },
  { source: "Referral", visitors: 40, enrolled: 15, conversion: 38 },
];
export const DROPOUT_DATA = [
  { stage: "After Enrollment", count: 18, pct: 45 },
  { stage: "After Exam Fail", count: 12, pct: 30 },
  { stage: "After Doc Process", count: 6, pct: 15 },
  { stage: "After COE", count: 2, pct: 5 },
  { stage: "After Visa", count: 2, pct: 5 },
];

// Calendar module
export const CALENDAR_EVENTS = [
  { id: "EV-001", title: "Skype Interview — Tokyo Galaxy", type: "interview", date: "2026-03-23", time: "10:00", students: ["Fatema Akter", "Nasrin Sultana", "Sohel Rana"], staff: "Mina" },
  { id: "EV-002", title: "VFS Appointment — Kamal Hossain", type: "vfs", date: "2026-03-23", time: "09:00", students: ["Kamal Hossain"], staff: "Karim" },
  { id: "EV-003", title: "JLPT Registration Deadline", type: "deadline", date: "2026-03-25", time: "23:59", students: [], staff: null },
  { id: "EV-004", title: "Health Check — Rahim, Kamal", type: "health", date: "2026-03-24", time: "09:00", students: ["Mohammad Rahim", "Kamal Hossain"], staff: "Sadia" },
  { id: "EV-005", title: "Fee Collection — ৫ জন কিস্তি due", type: "finance", date: "2026-03-25", time: "—", students: [], staff: "Rana" },
  { id: "EV-006", title: "Agent Hafiz — Meeting", type: "meeting", date: "2026-03-26", time: "14:00", students: [], staff: "Admin" },
  { id: "EV-007", title: "Batch A26 — Final Exam (Mock JLPT)", type: "exam", date: "2026-03-28", time: "10:00", students: [], staff: "Tanaka Sensei" },
  { id: "EV-008", title: "April Intake Doc Submission Deadline", type: "deadline", date: "2026-03-31", time: "23:59", students: [], staff: null },
  { id: "EV-009", title: "Nasrin Sultana — Flight to Tokyo", type: "flight", date: "2026-04-02", time: "22:30", students: ["Nasrin Sultana"], staff: "Karim" },
  { id: "EV-010", title: "Monthly Team Review Meeting", type: "meeting", date: "2026-03-30", time: "15:00", students: [], staff: "All" },
];

export const EVENT_TYPES = {
  interview: { label: "Interview", color: "#c084fc", icon: "💻" },
  vfs: { label: "VFS", color: "#06b6d4", icon: "🛂" },
  deadline: { label: "Deadline", color: "#f43f5e", icon: "⏰" },
  health: { label: "Health", color: "#22c55e", icon: "🏥" },
  finance: { label: "Finance", color: "#eab308", icon: "💰" },
  meeting: { label: "Meeting", color: "#60a5fa", icon: "🏢" },
  exam: { label: "Exam", color: "#a855f7", icon: "📝" },
  flight: { label: "Flight", color: "#f472b6", icon: "✈️" },
};

// Partner agency module
export const PARTNER_AGENCIES = [
  { id: "PA-001", name: "Excel Education", contact: "Mr. Habib", phone: "01712340099", address: "Mirpur, Dhaka", services: ["translation", "doc_processing"], status: "active",
    students: [
      { id: "S-2026-008", name: "Mizanur Rahman", service: "Doc Processing + Translation", fee: 20000, paid: 20000, status: "DOC_COLLECTION" },
    ],
  },
  { id: "PA-002", name: "Star Overseas", contact: "Ms. Ruma", phone: "01812340088", address: "Agrabad, Chittagong", services: ["translation", "doc_processing", "school_submission"], status: "active",
    students: [
      { id: "PS-001", name: "Jabed Hossain", service: "Full Doc + Submission", fee: 35000, paid: 20000, status: "DOC_SUBMITTED" },
      { id: "PS-002", name: "Sumaiya Khatun", service: "Translation Only", fee: 8000, paid: 8000, status: "SCHOOL_INTERVIEW" },
    ],
  },
  { id: "PA-003", name: "Bridge Consultancy", contact: "Mr. Karim", phone: "01912340077", address: "Sylhet", services: ["translation"], status: "inactive", students: [] },
];

export const SERVICE_LABELS = { translation: "ট্রান্সলেশন", doc_processing: "ডক প্রসেসিং", school_submission: "স্কুল সাবমিশন", visa_processing: "ভিসা প্রসেসিং", full_service: "ফুল সার্ভিস" };

// Excel auto-fill module
export const EXCEL_TEMPLATES = [
  { id: "ET-001", schoolId: "SCH-001", schoolName: "Tokyo Galaxy", fileName: "tokyo_galaxy_rijiumi_2026.xlsx", version: 1, uploadDate: "2026-01-15", totalFields: 22, mappedFields: 20,
    mappings: [
      { cell: "B3", label: "氏名(カタカナ)", field: "student.name_katakana" },
      { cell: "B4", label: "氏名(ローマ字)", field: "student.name_en" },
      { cell: "B5", label: "生年月日", field: "student.dob_jp" },
      { cell: "B6", label: "国籍", field: "student.nationality_jp" },
      { cell: "B7", label: "パスポート番号", field: "student.passport_no" },
      { cell: "B8", label: "現住所", field: "student.address_jp" },
      { cell: "B10", label: "最終学歴", field: "student.hsc_school" },
      { cell: "B11", label: "卒業年月", field: "student.hsc_year_jp" },
      { cell: "C15", label: "経費支弁者名", field: "sponsor.name_katakana" },
      { cell: "C16", label: "続柄", field: "sponsor.relationship_jp" },
    ]},
  { id: "ET-002", schoolId: "SCH-002", schoolName: "Osaka YMCA", fileName: "osaka_ymca_resume_2026.xlsx", version: 1, uploadDate: "2026-02-01", totalFields: 18, mappedFields: 18,
    mappings: [
      { cell: "C2", label: "名前", field: "student.name_katakana" },
      { cell: "C3", label: "誕生日", field: "student.dob_jp" },
      { cell: "D5", label: "旅券番号", field: "student.passport_no" },
      { cell: "C8", label: "教育背景", field: "student.education_summary_jp" },
    ]},
  { id: "ET-003", schoolId: "SCH-003", schoolName: "Fukuoka Language", fileName: "fukuoka_application_2026.xlsx", version: 2, uploadDate: "2026-02-20", totalFields: 15, mappedFields: 12,
    mappings: [] },
];

// Certificate module
export const CERT_TEMPLATES = [
  { id: "CT-001", name: "ভাষা কোর্স সমাপনী সার্টিফিকেট", name_en: "Language Course Completion Certificate", type: "course_completion", language: "English + বাংলা", fields: ["student.name_en", "student.name_bn", "batch.name", "batch.level", "batch.startDate", "batch.endDate", "exam.score", "agency.name"] },
  { id: "CT-002", name: "JLPT/NAT পাশ সার্টিফিকেট", name_en: "JLPT/NAT Pass Certificate", type: "exam_pass", language: "English", fields: ["student.name_en", "exam.type", "exam.level", "exam.score", "exam.date", "agency.name"] },
  { id: "CT-003", name: "ভর্তি নিশ্চিতকরণ পত্র", name_en: "Enrollment Confirmation Letter", type: "enrollment", language: "English + বাংলা", fields: ["student.name_en", "student.name_bn", "student.id", "batch.name", "enrollment.date", "agency.name"] },
];

export const GENERATED_CERTS = [
  { id: "GC-001", templateId: "CT-001", studentId: "S-2026-002", studentName: "Kamal Hossain", certName: "Course Completion", generatedDate: "2026-03-15", status: "generated" },
  { id: "GC-002", templateId: "CT-002", studentName: "Kamal Hossain", studentId: "S-2026-002", certName: "JLPT N5 Pass", generatedDate: "2026-03-10", status: "generated" },
  { id: "GC-003", templateId: "CT-003", studentId: "S-2026-007", studentName: "Ayesha Siddiqua", certName: "Enrollment Confirmation", generatedDate: "2026-02-20", status: "generated" },
];

// Pre-departure module
export const DEPARTURE_STUDENTS = [
  { id: "S-2026-004", name: "Nasrin Sultana", school: "Fukuoka Lang.", country: "Japan", batch: "April 2026", status: "VISA_GRANTED",
    coe: { number: "COE-2026-0412", date: "2026-02-20", expiry: "2026-05-20" },
    healthTests: [
      { test: "Chest X-Ray", status: "done", date: "2026-03-01", result: "Normal" },
      { test: "Blood Test", status: "done", date: "2026-03-01", result: "Normal" },
    ],
    tuition: { amount: 750000, currency: "JPY", bank: "Dutch Bangla Bank", ttRef: "DBBL-TT-2026-0412", sentDate: "2026-03-05", receivedBySchool: true },
    vfs: { appointmentDate: "2026-03-10", time: "09:30", formFilled: true, docsSubmitted: true },
    visa: { status: "granted", number: "JP-VISA-2026-0412", grantDate: "2026-03-18" },
    serviceCharge: { amount: 50000, paid: true },
    flight: { number: "NH-846", date: "2026-04-02", time: "22:30", airline: "ANA" },
    airportChecklist: [
      { item: "পাসপোর্ট (ভিসা সহ)", checked: true },
      { item: "COE — Original", checked: true },
      { item: "Admission Letter — Original", checked: true },
      { item: "এয়ারলাইন টিকেট", checked: true },
      { item: "Health Certificate", checked: true },
      { item: "ছবি (4.5 x 3.5) — ৫ কপি", checked: false },
      { item: "টিউশন ফি রেমিট্যান্স রসিদ", checked: true },
      { item: "ব্যাংক স্টেটমেন্ট", checked: false },
      { item: "স্কুলের ঠিকানা ও যোগাযোগ (প্রিন্ট)", checked: true },
      { item: "এজেন্সির জাপান অফিসের যোগাযোগ", checked: true },
      { item: "জরুরি যোগাযোগ নম্বর", checked: true },
      { item: "জাপানি ইয়েন (ক্যাশ — ন্যূনতম ¥30,000)", checked: false },
    ],
    arrivalStatus: null,
  },
  { id: "S-2026-006", name: "Sohel Rana", school: "Tokyo Galaxy", country: "Japan", batch: "April 2026", status: "COE_RECEIVED",
    coe: { number: "COE-2026-0388", date: "2026-03-10", expiry: "2026-06-10" },
    healthTests: [
      { test: "Chest X-Ray", status: "scheduled", date: "2026-03-25", result: null },
    ],
    tuition: { amount: 750000, currency: "JPY", bank: null, ttRef: null, sentDate: null, receivedBySchool: false },
    vfs: { appointmentDate: null, time: null, formFilled: false, docsSubmitted: false },
    visa: { status: "not_applied", number: null, grantDate: null },
    serviceCharge: { amount: 50000, paid: false },
    flight: null,
    airportChecklist: [],
    arrivalStatus: null,
  },
  { id: "S-2026-002", name: "Kamal Hossain", school: "Osaka YMCA", country: "Japan", batch: "April 2026", status: "COE_RECEIVED",
    coe: { number: "COE-2026-0395", date: "2026-03-12", expiry: "2026-06-12" },
    healthTests: [
      { test: "Chest X-Ray", status: "done", date: "2026-03-15", result: "Normal" },
    ],
    tuition: { amount: 800000, currency: "JPY", bank: "Sonali Bank", ttRef: "SBL-TT-2026-0395", sentDate: "2026-03-18", receivedBySchool: false },
    vfs: { appointmentDate: "2026-03-28", time: "10:00", formFilled: true, docsSubmitted: false },
    visa: { status: "pending", number: null, grantDate: null },
    serviceCharge: { amount: 50000, paid: false },
    flight: null,
    airportChecklist: [],
    arrivalStatus: null,
  },
];

// Branch management
export const INITIAL_BRANCHES = [
  { id: "BR-001", name: "ঢাকা (HQ)", city: "ঢাকা", address: "House 12, Road 4, Dhanmondi, Dhaka-1205", phone: "02-9876543", manager: "Abrar Rahman", status: "active", createdAt: "2023-01-01" },
  { id: "BR-002", name: "চট্টগ্রাম", city: "চট্টগ্রাম", address: "GEC Circle, Chittagong-4100", phone: "031-234567", manager: "Karim Hasan", status: "active", createdAt: "2024-01-01" },
  { id: "BR-003", name: "সিলেট", city: "সিলেট", address: "Zindabazar, Sylhet-3100", phone: "0821-123456", manager: "Rafiq Mia", status: "active", createdAt: "2025-06-01" },
];

// User & Role management
export const MOCK_USERS = [
  { id: "U-001", name: "Abrar Rahman", email: "abrar@agency.com", phone: "01700000001", branch: "ঢাকা (HQ)", roles: ["Owner"], status: "active", lastLogin: "2026-03-22 10:30" },
  { id: "U-002", name: "Mina Akter", email: "mina@agency.com", phone: "01700000002", branch: "ঢাকা (HQ)", roles: ["Counselor", "Doc Processor"], status: "active", lastLogin: "2026-03-22 09:15" },
  { id: "U-003", name: "Sadia Islam", email: "sadia@agency.com", phone: "01700000003", branch: "ঢাকা (HQ)", roles: ["Follow-up Executive"], status: "active", lastLogin: "2026-03-22 08:45" },
  { id: "U-004", name: "Jamal Uddin", email: "jamal@agency.com", phone: "01700000004", branch: "ঢাকা (HQ)", roles: ["Document Collector"], status: "active", lastLogin: "2026-03-21 17:00" },
  { id: "U-005", name: "Karim Hasan", email: "karim@agency.com", phone: "01700000005", branch: "চট্টগ্রাম", roles: ["Branch Manager", "Doc Processor"], status: "active", lastLogin: "2026-03-22 10:00" },
  { id: "U-006", name: "Rana Ahmed", email: "rana@agency.com", phone: "01700000006", branch: "ঢাকা (HQ)", roles: ["Accounts"], status: "active", lastLogin: "2026-03-22 09:30" },
  { id: "U-007", name: "Tanaka Sensei", email: "tanaka@agency.com", phone: "01700000007", branch: "ঢাকা (HQ)", roles: ["Language Teacher"], status: "active", lastLogin: "2026-03-21 14:00" },
  { id: "U-008", name: "Rafiq Mia", email: "rafiq@agency.com", phone: "01700000008", branch: "সিলেট", roles: ["Counselor"], status: "inactive", lastLogin: "2026-02-15 11:00" },
];
export const ALL_ROLES = ["Owner", "Branch Manager", "Counselor", "Follow-up Executive", "Admission Officer", "Language Teacher", "Document Collector", "Document Processor", "Accounts", "Student"];
export const PERMISSION_MATRIX = { "Owner": { dashboard: true, visitors: true, students: true, documents: true, accounts: true, reports: true, settings: true, users: true }, "Branch Manager": { dashboard: true, visitors: true, students: true, documents: true, accounts: true, reports: true, settings: false, users: false }, "Counselor": { dashboard: false, visitors: true, students: false, documents: false, accounts: false, reports: false, settings: false, users: false }, "Follow-up Executive": { dashboard: false, visitors: true, students: false, documents: false, accounts: false, reports: false, settings: false, users: false }, "Document Collector": { dashboard: false, visitors: false, students: true, documents: true, accounts: false, reports: false, settings: false, users: false }, "Document Processor": { dashboard: false, visitors: false, students: true, documents: true, accounts: false, reports: false, settings: false, users: false }, "Accounts": { dashboard: true, visitors: false, students: false, documents: false, accounts: true, reports: true, settings: false, users: false }, "Language Teacher": { dashboard: false, visitors: false, students: true, documents: false, accounts: false, reports: false, settings: false, users: false } };

// Communication log
export const COMM_LOGS = [
  { id: "CL-01", studentName: "Mohammad Rahim", type: "phone", direction: "outbound", summary: "কিস্তি পাঠাবে বলেছে", user: "Sadia", date: "2026-03-22", time: "10:30" },
  { id: "CL-02", studentName: "Mohammad Rahim", type: "whatsapp", direction: "inbound", summary: "পাসপোর্টের কপি পাঠিয়েছে", user: "Jamal", date: "2026-03-20", time: "14:15" },
  { id: "CL-03", studentName: "Kamal Hossain", type: "email", direction: "outbound", summary: "VFS appointment confirmation", user: "Karim", date: "2026-03-21", time: "09:00" },
  { id: "CL-04", studentName: "Fatema Akter", type: "office_visit", direction: "inbound", summary: "HSC মার্কশিট জমা দিয়েছে", user: "Jamal", date: "2026-03-21", time: "11:30" },
  { id: "CL-05", studentName: "Mohammad Rahim", type: "phone", direction: "outbound", summary: "ডকুমেন্ট recheck নিয়ে জানানো", user: "Mina", date: "2026-03-18", time: "15:45" },
  { id: "CL-06", studentName: "Nasrin Sultana", type: "whatsapp", direction: "outbound", summary: "Airport checklist পাঠানো হয়েছে", user: "Karim", date: "2026-03-22", time: "08:00" },
  { id: "CL-07", studentName: "Rafiqul Islam", type: "sms", direction: "outbound", summary: "ক্লাস টেস্ট সময়সূচি", user: "Tanaka", date: "2026-03-19", time: "16:00" },
];
export const COMM_TYPES = { phone: { icon: "📞", label: "Phone", color: "#22c55e" }, whatsapp: { icon: "💬", label: "WhatsApp", color: "#25d366" }, email: { icon: "📧", label: "Email", color: "#06b6d4" }, sms: { icon: "📱", label: "SMS", color: "#a855f7" }, office_visit: { icon: "🏢", label: "Visit", color: "#eab308" } };

// Attendance module
export const ATT_STATUS = { present: { label: "উপস্থিত", color: "#22c55e", icon: "✅" }, absent: { label: "অনুপস্থিত", color: "#f43f5e", icon: "❌" }, late: { label: "দেরিতে", color: "#eab308", icon: "⏰" } };
export const ATTENDANCE_DAY = [
  { name: "Mohammad Rahim", id: "S-2026-001", status: "present" },
  { name: "Kamal Hossain", id: "S-2026-002", status: "present" },
  { name: "Fatema Akter", id: "S-2026-003", status: "absent" },
  { name: "Nasrin Sultana", id: "S-2026-004", status: "present" },
  { name: "Sohel Rana", id: "S-2026-006", status: "late" },
  { name: "Tamanna Islam", id: "S-2026-009", status: "absent" },
];

// Inventory module
export const INVENTORY_CATEGORIES = ["Electronics", "Furniture", "Books & Materials", "Office Supplies", "Appliances", "Software", "Other"];
export const CONDITION_OPTIONS = [
  { value: "new", label: "নতুন", color: "#22c55e", icon: "🟢" },
  { value: "good", label: "ভালো", color: "#06b6d4", icon: "🔵" },
  { value: "fair", label: "মোটামুটি", color: "#eab308", icon: "🟡" },
  { value: "repair", label: "মেরামত দরকার", color: "#f97316", icon: "🟠" },
  { value: "damaged", label: "ক্ষতিগ্রস্ত", color: "#ef4444", icon: "🔴" },
  { value: "disposed", label: "বাতিল", color: "#64748b", icon: "⚫" },
];

export const INITIAL_INVENTORY = [
  { id: "INV-001", name: "Desktop Computer", category: "Electronics", brand: "Dell", model: "OptiPlex 3090", serial: "DL-2025-001", quantity: 5, branch: "ঢাকা (HQ)", location: "কাউন্সেলিং রুম", purchaseDate: "2025-06-15", price: 45000, vendor: "Computer Source", warranty: "2027-06-15", condition: "good", assignedTo: "Office", notes: "" },
  { id: "INV-002", name: "Laptop", category: "Electronics", brand: "HP", model: "ProBook 450", serial: "HP-2025-002", quantity: 2, branch: "ঢাকা (HQ)", location: "ম্যানেজার রুম", purchaseDate: "2025-08-10", price: 65000, vendor: "Ryans Computer", warranty: "2027-08-10", condition: "good", assignedTo: "Abrar, Karim", notes: "" },
  { id: "INV-003", name: "Printer (Color)", category: "Electronics", brand: "Canon", model: "PIXMA G3020", serial: "CN-2025-003", quantity: 2, branch: "ঢাকা (HQ)", location: "প্রিন্ট জোন", purchaseDate: "2025-07-01", price: 18000, vendor: "Star Tech", warranty: "2026-07-01", condition: "good", assignedTo: "Shared", notes: "" },
  { id: "INV-004", name: "প্রিন্টার (সাদাকালো)", category: "Electronics", brand: "HP", model: "LaserJet 107a", serial: "HP-2024-004", quantity: 1, branch: "চট্টগ্রাম", location: "অফিস", purchaseDate: "2024-12-01", price: 12000, vendor: "Star Tech", warranty: "2025-12-01", condition: "repair", assignedTo: "Shared", notes: "কালি জ্যাম হচ্ছে" },
  { id: "INV-005", name: "Office Chair", category: "Furniture", brand: "Hatil", model: "Executive", serial: "", quantity: 10, branch: "ঢাকা (HQ)", location: "সব রুম", purchaseDate: "2025-05-01", price: 8500, vendor: "Hatil Showroom", warranty: "", condition: "good", assignedTo: "", notes: "" },
  { id: "INV-006", name: "Student Chair", category: "Furniture", brand: "Local", model: "Plastic", serial: "", quantity: 30, branch: "ঢাকা (HQ)", location: "ক্লাসরুম ১ ও ২", purchaseDate: "2025-04-01", price: 1200, vendor: "New Market", warranty: "", condition: "fair", assignedTo: "", notes: "৩টি ভাঙা" },
  { id: "INV-007", name: "Whiteboard (4x3 ft)", category: "Furniture", brand: "Generic", model: "", serial: "", quantity: 3, branch: "ঢাকা (HQ)", location: "ক্লাসরুম", purchaseDate: "2025-04-15", price: 2500, vendor: "Nilkhet", warranty: "", condition: "good", assignedTo: "", notes: "" },
  { id: "INV-008", name: "Minna no Nihongo 1", category: "Books & Materials", brand: "", model: "3A Corporation", serial: "", quantity: 25, branch: "ঢাকা (HQ)", location: "লাইব্রেরি", purchaseDate: "2025-09-01", price: 850, vendor: "Japan Foundation", warranty: "", condition: "good", assignedTo: "Batch A26", notes: "" },
  { id: "INV-009", name: "Minna no Nihongo 2", category: "Books & Materials", brand: "", model: "3A Corporation", serial: "", quantity: 15, branch: "ঢাকা (HQ)", location: "লাইব্রেরি", purchaseDate: "2025-09-01", price: 950, vendor: "Japan Foundation", warranty: "", condition: "good", assignedTo: "Batch A26", notes: "" },
  { id: "INV-010", name: "Router (WiFi)", category: "Electronics", brand: "TP-Link", model: "Archer C6", serial: "TPL-2025-010", quantity: 1, branch: "ঢাকা (HQ)", location: "রিসেপশন", purchaseDate: "2025-03-01", price: 4500, vendor: "Ryans", warranty: "2027-03-01", condition: "good", assignedTo: "", notes: "" },
  { id: "INV-011", name: "AC (1.5 Ton)", category: "Appliances", brand: "Walton", model: "WSI-INVERNA-18F", serial: "WLT-2025-011", quantity: 2, branch: "ঢাকা (HQ)", location: "ক্লাসরুম ১, ম্যানেজার রুম", purchaseDate: "2025-05-20", price: 62000, vendor: "Walton Plaza", warranty: "2028-05-20", condition: "good", assignedTo: "", notes: "" },
  { id: "INV-012", name: "Scanner", category: "Electronics", brand: "Canon", model: "LiDE 300", serial: "CN-2025-012", quantity: 1, branch: "ঢাকা (HQ)", location: "ডক প্রসেসিং", purchaseDate: "2025-07-15", price: 7500, vendor: "Star Tech", warranty: "2026-07-15", condition: "good", assignedTo: "Jamal", notes: "" },
  { id: "INV-013", name: "Projector", category: "Electronics", brand: "Epson", model: "EB-X51", serial: "EP-2025-013", quantity: 1, branch: "ঢাকা (HQ)", location: "ক্লাসরুম ১", purchaseDate: "2025-08-01", price: 55000, vendor: "Tech Land", warranty: "2027-08-01", condition: "good", assignedTo: "", notes: "" },
  { id: "INV-014", name: "Office Chair", category: "Furniture", brand: "Local", model: "Standard", serial: "", quantity: 5, branch: "চট্টগ্রাম", location: "অফিস", purchaseDate: "2025-10-01", price: 5000, vendor: "Local", warranty: "", condition: "good", assignedTo: "", notes: "" },
];

export const CONSUMABLE_ITEMS = [
  { id: "CON-001", name: "A4 Paper (Ream)", category: "Stationery", branch: "ঢাকা (HQ)", stock: 8, minStock: 5, unit: "রিম", lastDate: "2026-03-10", lastQty: 10, lastPrice: 550 },
  { id: "CON-002", name: "Printer Ink (Canon Color)", category: "Printing", branch: "ঢাকা (HQ)", stock: 2, minStock: 2, unit: "সেট", lastDate: "2026-02-15", lastQty: 3, lastPrice: 2200 },
  { id: "CON-003", name: "Printer Ink (HP Black)", category: "Printing", branch: "চট্টগ্রাম", stock: 0, minStock: 1, unit: "পিস", lastDate: "2025-12-01", lastQty: 2, lastPrice: 1800 },
  { id: "CON-004", name: "File Folder", category: "Stationery", branch: "ঢাকা (HQ)", stock: 50, minStock: 20, unit: "পিস", lastDate: "2026-01-20", lastQty: 100, lastPrice: 25 },
  { id: "CON-005", name: "Whiteboard Marker", category: "Stationery", branch: "ঢাকা (HQ)", stock: 6, minStock: 10, unit: "পিস", lastDate: "2026-02-01", lastQty: 20, lastPrice: 80 },
];

// HR module
export const EMPLOYEES = [
  { id: "E-001", name: "Abrar Rahman", role: "Owner", branch: "ঢাকা (HQ)", phone: "01700000001", email: "abrar@agency.com", joinDate: "2023-01-01", salary: 50000, status: "active", leaves: { total: 18, used: 3 } },
  { id: "E-002", name: "Mina Akter", role: "Counselor", branch: "ঢাকা (HQ)", phone: "01700000002", email: "mina@agency.com", joinDate: "2024-03-15", salary: 20000, status: "active", leaves: { total: 14, used: 5 } },
  { id: "E-003", name: "Sadia Islam", role: "Follow-up Executive", branch: "ঢাকা (HQ)", phone: "01700000003", email: "sadia@agency.com", joinDate: "2024-06-01", salary: 18000, status: "active", leaves: { total: 14, used: 2 } },
  { id: "E-004", name: "Jamal Uddin", role: "Document Collector", branch: "ঢাকা (HQ)", phone: "01700000004", email: "jamal@agency.com", joinDate: "2024-09-01", salary: 15000, status: "active", leaves: { total: 14, used: 7 } },
  { id: "E-005", name: "Karim Hasan", role: "Branch Manager", branch: "চট্টগ্রাম", phone: "01700000005", email: "karim@agency.com", joinDate: "2024-01-01", salary: 30000, status: "active", leaves: { total: 16, used: 4 } },
  { id: "E-006", name: "Rana Ahmed", role: "Accounts", branch: "ঢাকা (HQ)", phone: "01700000006", email: "rana@agency.com", joinDate: "2024-07-01", salary: 22000, status: "active", leaves: { total: 14, used: 1 } },
  { id: "E-007", name: "Tanaka Sensei", role: "Language Teacher", branch: "ঢাকা (HQ)", phone: "01700000007", email: "tanaka@agency.com", joinDate: "2025-01-15", salary: 35000, status: "active", leaves: { total: 14, used: 0 } },
  { id: "E-008", name: "Rafiq Mia", role: "Counselor", branch: "সিলেট", phone: "01700000008", email: "rafiq@agency.com", joinDate: "2025-06-01", salary: 18000, status: "inactive", leaves: { total: 14, used: 14 } },
];

export const SALARY_HISTORY = [
  { month: "মার্চ ২০২৬", totalSalary: 208000, totalBonus: 0, paid: true, date: "2026-03-01" },
  { month: "ফেব্রুয়ারি ২০২৬", totalSalary: 208000, totalBonus: 10000, paid: true, date: "2026-02-01" },
  { month: "জানুয়ারি ২০২৬", totalSalary: 208000, totalBonus: 0, paid: true, date: "2026-01-01" },
];

// Nav items
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "visitors", label: "Visitors", badge: 3 },
  { key: "students", label: "Students" },
  { key: "course", label: "Language Course" },
  { key: "attendance", label: "Attendance" },
  { key: "documents", label: "Documents" },
  { key: "schools", label: "Schools" },
  { key: "excel", label: "Resume Builder" },
  { key: "certificates", label: "Certificates" },
  { key: "departure", label: "Pre-Departure" },
  { key: "tasks", label: "Tasks", badge: 4 },
  { key: "communication", label: "Communication" },
  { key: "agents", label: "Agents" },
  { key: "partners", label: "Partners (B2B)" },
  { key: "accounts", label: "Accounts" },
  { key: "inventory", label: "Inventory" },
  { key: "hr", label: "HR & Employees" },
  { key: "reports", label: "Reports" },
  { key: "calendar", label: "Calendar" },
  { key: "users", label: "Users & Roles" },
  { key: "portal", label: "Student Portal" },
  { key: "settings", label: "Settings" },
];
