# AgencyBook — Client Requirements Document (CRD)

**প্রকল্প:** AgencyBook SaaS — Study Abroad Agency CRM
**ক্লায়েন্ট:** বাংলাদেশী Study Abroad Agencies (Japan, Germany, Korea focused)
**তারিখ:** ২৮ মার্চ, ২০২৬
**সংস্করণ:** 2.0

---

## ১. প্রকল্পের পটভূমি

বাংলাদেশে শত শত এজেন্সি আছে যারা ছাত্রদের জাপান, জার্মানি, কোরিয়া ও অন্যান্য দেশে ভাষা শিক্ষা প্রোগ্রামে পাঠায়। এই এজেন্সিগুলো এখনো Excel spreadsheet, WhatsApp ও কাগজপত্রে কাজ করে। AgencyBook একটি সম্পূর্ণ ওয়েব-ভিত্তিক CRM সফটওয়্যার যা এই সব কাজ একটি platform-এ আনবে।

---

## ২. ক্লায়েন্টের মূল চাহিদা

### ২.১ ভিজিটর/লিড ম্যানেজমেন্ট
- **R-001:** অফিসে আসা ভিজিটরদের তথ্য রেকর্ড (নাম, ফোন, আগ্রহের দেশ, শিক্ষাগত যোগ্যতা)
- **R-002:** Follow-up tracking — কে কবে contact করেছে, পরবর্তী follow-up কবে
- **R-003:** ভিজিটর থেকে স্টুডেন্ট-এ convert করার সুবিধা
- **R-004:** Agent/Referral source tracking — কোথা থেকে lead এসেছে

### ২.২ স্টুডেন্ট Pipeline ম্যানেজমেন্ট
- **R-005:** ১৪ ধাপের pipeline: ভিজিটর → ফলোআপ → ভর্তি → কোর্স → পরীক্ষা → ডক কালেকশন → ইন্টারভিউ → ডক জমা → COE → ভিসা → পৌঁছানো → সম্পন্ন
- **R-006:** প্রতিটি ধাপে checklist (কী কী করতে হবে)
- **R-007:** একসাথে অনেক স্টুডেন্টের status পরিবর্তন (Bulk action)
- **R-008:** প্রতিটি স্টুডেন্টের বিস্তারিত প্রোফাইল — ব্যক্তিগত, পাসপোর্ট, শিক্ষা, পরিবার, স্পন্সর

### ২.৩ ভাষা কোর্স ও ব্যাচ
- **R-009:** ব্যাচ তৈরি (নাম, শুরু/শেষ তারিখ, শিক্ষক, ক্ষমতা)
- **R-010:** ব্যাচে স্টুডেন্ট enroll/remove
- **R-011:** দৈনিক উপস্থিতি নেওয়া (P/A/L)
- **R-012:** ক্লাস টেস্ট রেকর্ড ও JLPT/NAT পরীক্ষার ফলাফল

### ২.৪ ডকুমেন্ট ম্যানেজমেন্ট
- **R-013:** প্রতিটি স্টুডেন্টের ডকুমেন্ট checklist (পাসপোর্ট, NID, সনদ ইত্যাদি)
- **R-014:** ডকুমেন্ট status tracking (pending → submitted → verified)
- **R-015:** Cross-validation — একাধিক ডকুমেন্টে একই তথ্য match করছে কিনা
- **R-016:** Google Drive integration — ডকুমেন্ট ফোল্ডার লিংক

### ২.৫ স্কুল ও Submission
- **R-017:** জাপানি/জার্মান ভাষা স্কুলের তালিকা (ফি, ক্যাপাসিটি, ডেডলাইন)
- **R-018:** প্রতিটি স্কুলে submission tracking — কে কবে apply করেছে, ফলাফল কী
- **R-019:** Interview list তৈরি ও schedule
- **R-020:** Recheck management — rejection হলে আবার জমা দেওয়া

### ২.৬ Excel AutoFill (রিজুমি পূরণ)
- **R-021:** জাপানি স্কুলের নির্দিষ্ট Excel format-এ স্টুডেন্ট ডাটা auto-fill
- **R-022:** {{placeholder}} system — টেমপ্লেটে placeholder বসালে student data স্বয়ংক্রিয়ভাবে বসবে
- **R-023:** System variable support — এজেন্সির নাম, ব্রাঞ্চ ঠিকানা, আজকের তারিখ, ব্যাচের তারিখ
- **R-024:** ক্যাটাগরি ভিত্তিক field dropdown — ব্যক্তিগত, শিক্ষা, পারিবারিক, স্পন্সর, সিস্টেম
- **R-025:** Sub-field support — জন্ম তারিখ থেকে শুধু বছর, নাম থেকে শুধু first name

### ২.৭ হিসাব-নিকাশ
- **R-026:** আয় tracking — fee category অনুযায়ী (ভর্তি ফি, কোর্স ফি, সার্ভিস চার্জ, শৌকাই ফি)
- **R-027:** ব্যয় tracking — category, branch, approved by
- **R-028:** স্টুডেন্ট ফি ব্রেকডাউন ও কিস্তি (installment) management
- **R-029:** বকেয়া (dues) tracking ও collection

### ২.৮ Pre-Departure & VFS
- **R-030:** COE প্রাপ্তির পর থেকে arrival পর্যন্ত সম্পূর্ণ tracking
- **R-031:** Health test, Tuition remittance, VFS appointment, Visa status, Flight booking
- **R-032:** Progress bar — প্রতিটি ধাপ কতটুকু সম্পন্ন

### ২.৯ যোগাযোগ ও টাস্ক
- **R-033:** Call/SMS/WhatsApp/Meeting log রাখা
- **R-034:** টাস্ক তৈরি, assign করা, due date, priority
- **R-035:** ক্যালেন্ডার — interview, deadline, event tracking

### ২.১০ কর্মচারী (HR) ও ইনভেন্টরি
- **R-036:** কর্মচারী তালিকা, বেতন দেওয়া, বেতন ইতিহাস
- **R-037:** অফিস সম্পদ ও মালামাল ব্যবস্থাপনা

### ২.১১ রিপোর্ট ও Analytics
- **R-038:** Pipeline funnel — কোন ধাপে কতজন আছে
- **R-039:** Source analysis — কোন source থেকে কত conversion
- **R-040:** Country-wise — দেশ ভিত্তিক student ও revenue
- **R-041:** Dropout analysis — কোন ধাপে কত ঝরে পড়ছে

### ২.১২ Multi-Branch
- **R-042:** একাধিক ব্রাঞ্চ — প্রতিটি ব্রাঞ্চের আলাদা ঠিকানা, ফোন, ম্যানেজার
- **R-043:** Branch-wise data filter — স্টুডেন্ট, কর্মচারী, হিসাব

### ২.১৩ User Role & Permission
- **R-044:** ১০+ role: Owner, Admin, Branch Manager, Counselor, Teacher, Accountant ইত্যাদি
- **R-045:** Module-wise Read/Write/Delete permission matrix
- **R-046:** Sidebar filtering — role অনুযায়ী শুধু permitted মেনু দেখাবে

### ২.১৪ Student Portal
- **R-047:** স্টুডেন্ট নিজের ফোন নম্বর ও পাসওয়ার্ড দিয়ে login করবে
- **R-048:** নিজের তথ্য দেখা ও edit করা (admin যে section enable করবে)
- **R-049:** ফি সারাংশ ও পেমেন্ট ইতিহাস দেখা

### ২.১৫ Multi-Agency SaaS
- **R-050:** একই platform-এ একাধিক এজেন্সি — সম্পূর্ণ data isolation
- **R-051:** Agency prefix ID — প্রতিটি entity-র ID এজেন্সির নামের আদ্যক্ষর দিয়ে
- **R-052:** Per-student billing model (৳3000/student, 14-day trial)
- **R-053:** Super Admin panel — সব agency manage করা

### ২.১৬ পার্টনার (B2B)
- **R-054:** অন্য এজেন্সি থেকে আসা student tracking
- **R-055:** Partner-wise fee ও payment tracking

### ২.১৭ নিরাপত্তা
- **R-056:** HTTPS enforcement, HSTS header
- **R-057:** Rate limiting — brute force protection
- **R-058:** PII encryption (NID, পাসপোর্ট, ঠিকানা)
- **R-059:** Activity audit log
- **R-060:** Code protection — DevTools block, source map বন্ধ

### ২.১৮ Non-Functional Requirements
- **R-061:** বাংলা (Bengali) UI — সম্পূর্ণ বাংলায়
- **R-062:** Dark/Light theme
- **R-063:** মোবাইল responsive
- **R-064:** CSV/Excel export সব তালিকা থেকে
- **R-065:** Single VPS deployment (Nginx + PM2 + PostgreSQL)

---

## ৩. ব্যবহারকারী (Stakeholders)

| Role | ব্যবহার |
|------|---------|
| **Agency Owner** | সব কিছু দেখা ও পরিবর্তন, রিপোর্ট, কর্মচারী management |
| **Branch Manager** | নিজের branch-এর সব data manage |
| **Counselor** | ভিজিটর/স্টুডেন্ট manage, follow-up |
| **Teacher** | ব্যাচ, উপস্থিতি, পরীক্ষার ফলাফল |
| **Accountant** | আয়-ব্যয়, ফি collection, বেতন |
| **Document Officer** | ডকুমেন্ট verify, cross-check |
| **Student** | নিজের portal থেকে তথ্য দেখা |
| **Super Admin** | Platform management, agency CRUD |

---

## ৪. প্রযুক্তি সীমাবদ্ধতা (Constraints)

| সীমাবদ্ধতা | বিবরণ |
|------------|--------|
| Language | UI সম্পূর্ণ বাংলায় |
| Hosting | Single VPS (Contabo, 6 Core, 12GB RAM) |
| Budget | Low-cost — open-source stack |
| Browser | Chrome, Firefox, Edge (modern browsers) |
| Internet | Bangladesh internet speed বিবেচনা — light bundle |
