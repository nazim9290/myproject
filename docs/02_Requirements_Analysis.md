# AgencyBook — Requirements Analysis Document (RAD)

**তারিখ:** ২৮ মার্চ, ২০২৬ | **সংস্করণ:** 2.0

---

## ১. সিস্টেম সারাংশ

AgencyBook একটি Multi-Tenant SaaS CRM যা Study Abroad Agency-দের জন্য তৈরি। প্রতিটি এজেন্সি আলাদা tenant হিসেবে কাজ করে — নিজস্ব data, user, settings।

---

## ২. Functional Requirements Analysis

### ২.১ মডিউল ম্যাপিং

| # | মডিউল | Requirements | API Endpoints | DB Tables | Priority |
|---|--------|-------------|---------------|-----------|----------|
| 1 | Authentication | R-044, R-045, R-046, R-056 | 7 | users | CRITICAL |
| 2 | Dashboard | R-038, R-039 | 1 | (aggregated) | HIGH |
| 3 | Visitors | R-001, R-002, R-003, R-004 | 4 | visitors | HIGH |
| 4 | Students | R-005, R-006, R-007, R-008 | 12 | students, education, exams, family, sponsors | CRITICAL |
| 5 | Schools | R-017, R-018, R-019, R-020 | 8 | schools, submissions | HIGH |
| 6 | Language Course | R-009, R-010, R-011, R-012 | 5 | batches, batch_students, attendance | HIGH |
| 7 | Documents | R-013, R-014, R-015, R-016 | 12 | documents, doc_types, document_data | HIGH |
| 8 | Excel AutoFill | R-021, R-022, R-023, R-024, R-025 | 8 | excel_templates | HIGH |
| 9 | Accounts | R-026, R-027, R-028, R-029 | 6 | payments, fee_items, expenses | HIGH |
| 10 | Pre-Departure | R-030, R-031, R-032 | 2 | pre_departure | MEDIUM |
| 11 | Tasks | R-034 | 4 | tasks | MEDIUM |
| 12 | Communication | R-033 | 3 | communications | MEDIUM |
| 13 | Calendar | R-035 | 4 | calendar_events | MEDIUM |
| 14 | Agents | R-004 | 4 | agents | MEDIUM |
| 15 | Partners (B2B) | R-054, R-055 | 6 | partner_agencies, partner_students | MEDIUM |
| 16 | HR | R-036 | 5 | employees, salary_history | LOW |
| 17 | Inventory | R-037 | 4 | inventory | LOW |
| 18 | Reports | R-038, R-039, R-040, R-041 | 1 | (aggregated) | HIGH |
| 19 | Users & Roles | R-044, R-045, R-046 | 5 | users, branches | HIGH |
| 20 | Student Portal | R-047, R-048, R-049 | 6 | students (reuse) | MEDIUM |
| 21 | Super Admin | R-050, R-051, R-052, R-053 | 10 | agencies, platform_settings | CRITICAL |
| 22 | Settings | R-042, R-043 | CRUD | branches, agencies | MEDIUM |
| 23 | Profile | — | 2 | users | LOW |
| 24 | Help | — | — | — | LOW |

---

### ২.২ Data Flow Diagram

```
                    ┌─────────────────────────────┐
                    │       Super Admin            │
                    │   (Agency CRUD, Billing)     │
                    └─────────┬───────────────────┘
                              │ creates
                    ┌─────────▼───────────────────┐
                    │         Agency               │
                    │  (prefix, settings, plan)    │
                    └─────────┬───────────────────┘
                              │ contains
         ┌────────────────────┼────────────────────┐
         │                    │                    │
  ┌──────▼──────┐    ┌───────▼───────┐    ┌───────▼───────┐
  │   Users     │    │   Branches    │    │   Settings    │
  │ (staff)     │    │ (locations)   │    │ (config)      │
  └──────┬──────┘    └───────────────┘    └───────────────┘
         │ manages
  ┌──────▼──────────────────────────────────────────────┐
  │                                                      │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
  │  │ Visitors │→│ Students │→│ Pipeline │          │
  │  │ (leads)  │  │ (14 step)│  │ tracking │          │
  │  └──────────┘  └────┬─────┘  └──────────┘          │
  │                     │                                │
  │     ┌───────┬───────┼───────┬───────┬───────┐      │
  │     ▼       ▼       ▼       ▼       ▼       ▼      │
  │  Batches  Docs   Schools  Fees   Exams   Sponsor   │
  │  Course   Upload  Submit  Payment JLPT   Banks     │
  │  Attend   Verify  COE     Dues    NAT    Income    │
  │     │       │       │       │       │       │      │
  │     └───────┴───────┼───────┴───────┘       │      │
  │                     ▼                        │      │
  │              Pre-Departure                   │      │
  │          (COE→Health→VFS→Visa→Flight)        │      │
  │                     │                        │      │
  │                     ▼                        │      │
  │                 ARRIVED ✓                    │      │
  └──────────────────────────────────────────────┘      │
                                                        │
  ┌─────────────────────────────────────────────────────┘
  │ Supporting Modules:
  │  Tasks, Calendar, Communication, Agents, Partners,
  │  HR, Inventory, Reports, Excel AutoFill, DocGen
  └──────────────────────────────────────────────────────
```

---

### ২.৩ User Role Analysis

```
Super Admin ──► সব Agency manage
    │
Agency Owner ──► সব Module access
    │
Branch Manager ──► নিজ Branch-এর data
    │
    ├── Counselor ──► Visitor/Student manage
    ├── Admission Officer ──► Student/Doc/Accounts
    ├── Teacher ──► Course/Attendance/Exams
    ├── Doc Collector ──► Document upload
    ├── Doc Processor ──► Document verify
    ├── Accountant ──► Accounts/HR/Inventory
    └── Viewer ──► শুধু দেখতে পারবে
```

---

### ২.৪ Student Pipeline Flow Analysis

```
VISITOR (আগ্রহী)
  │ counseling + follow-up
  ▼
FOLLOW_UP (ফলোআপ চলছে)
  │ enrollment fee payment
  ▼
ENROLLED (ভর্তি হয়েছে)
  │ batch assign + course start
  ▼
IN_COURSE (ক্লাস চলছে)
  │ JLPT/NAT exam
  ▼
EXAM_PASSED (পাস করেছে)
  │ document collection
  ▼
DOC_COLLECTION (ডকুমেন্ট জমা হচ্ছে)
  │ school submit
  ▼
SCHOOL_INTERVIEW (ইন্টারভিউ)
  │ document review
  ▼
DOC_SUBMITTED (ডক জমা দেওয়া হয়েছে)
  │ COE issuance
  ▼
COE_RECEIVED (COE পেয়েছে)
  │ health + tuition + VFS
  ▼
VISA_GRANTED (ভিসা পেয়েছে)
  │ flight + pre-departure
  ▼
ARRIVED (দেশে পৌঁছেছে)
  │ program complete
  ▼
COMPLETED ✓

  ├──► CANCELLED (বাতিল)
  └──► PAUSED (বিরতি)
```

---

### ২.৫ Fee Structure Analysis

| Category | বাংলা | বিবরণ |
|----------|--------|--------|
| enrollment_fee | ভর্তি ফি | ভর্তির সময় একবার |
| course_fee | কোর্স ফি | ভাষা কোর্সের ফি (কিস্তি সম্ভব) |
| doc_processing | ডক প্রসেসিং ফি | ডকুমেন্ট তৈরি ও জমার খরচ |
| visa_fee | ভিসা ফি | VFS ও ভিসা আবেদন ফি |
| service_charge | সার্ভিস চার্জ | এজেন্সির সার্ভিস ফি |
| shokai_fee | শৌকাই ফি | জাপানি স্কুলের পরিচয় ফি |
| other_income | অন্যান্য | বিবিধ আয় |

---

### ২.৬ Non-Functional Requirements Analysis

| Requirement | Target | Approach |
|------------|--------|----------|
| **Performance** | <3s page load | Vite build, gzip, CDN cache |
| **Security** | OWASP Top 10 | HSTS, CSP, rate limit, encryption |
| **Availability** | 99.5% uptime | PM2 cluster, auto-restart |
| **Scalability** | 100+ agencies | PostgreSQL, multi-tenant |
| **Language** | 100% বাংলা UI | All labels/messages in Bengali |
| **Responsive** | Mobile + Desktop | Tailwind CSS responsive |
| **Data Privacy** | PII encrypted | AES-256-GCM for NID, passport |
| **Backup** | Daily automated | pg_dump cron, 7-day retention |
| **Browser** | Chrome/Firefox/Edge | ES2020 target, no IE support |

---

## ৩. Gap Analysis

| Requirement | Status | Gap |
|------------|--------|-----|
| R-001 to R-065 | ✅ Implemented | — |
| Email/SMS integration | ❌ Not implemented | Future: SendGrid/Twilio |
| Mobile app | ❌ Not implemented | Future: React Native |
| OCR document extraction | ❌ Not implemented | Future: Tesseract/Google Vision |
| Payment gateway | ❌ Not implemented | Future: bKash/Nagad API |
| Multi-language (EN/BN) | Partial | UI is Bengali only, no EN toggle |

---

## ৪. Risk Analysis

| ঝুঁকি | সম্ভাবনা | প্রভাব | প্রশমন |
|--------|---------|--------|---------|
| Server down | Low | High | PM2 auto-restart, monitoring |
| Data breach | Low | Critical | Encryption, RBAC, audit log |
| Slow performance | Medium | Medium | Query timeout, pagination limit |
| Cross-tenant leak | Low | Critical | agency_id filter on all routes |
| Payment dispute | Medium | Medium | Receipt numbers, audit trail |
