# AgencyBook — System Design & Database Design Document

**তারিখ:** ২৮ মার্চ, ২০২৬ | **সংস্করণ:** 2.0

---

## ১. System Architecture

### ১.১ High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│                                                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Web Browser    │  │  Mobile Browser  │  │  Student Portal  │  │
│  │  (React SPA)     │  │  (Responsive)    │  │  (React SPA)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                     │            │
│           └────────────────────┴─────────────────────┘            │
│                                │ HTTPS                            │
└────────────────────────────────┼──────────────────────────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────┐
│                         SERVER LAYER (VPS)                        │
│                                │                                  │
│  ┌─────────────────────────────▼─────────────────────────────┐   │
│  │                     Nginx Reverse Proxy                    │   │
│  │  ┌───────────────────┐  ┌──────────────────────────┐      │   │
│  │  │ demo.agencybook.net│  │ demo-api.agencybook.net  │      │   │
│  │  │  → dist/ (static) │  │  → localhost:5000 (proxy) │      │   │
│  │  └───────────────────┘  └──────────────────────────┘      │   │
│  │  SSL: Let's Encrypt (certbot)                             │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                    Node.js + Express                       │   │
│  │                    (PM2 Cluster Mode)                      │   │
│  │                                                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │   Auth   │  │ Students │  │ Accounts │  │  Reports │ │   │
│  │  │ Middleware│  │  Routes  │  │  Routes  │  │  Routes  │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
│  │  │  RBAC    │  │ Tenancy  │  │Rate Limit│  │ Crypto   │ │   │
│  │  │Permission│  │ Filter   │  │ (100/min)│  │(AES-256) │ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │                                    │
│  ┌───────────────────────────▼───────────────────────────────┐   │
│  │                  PostgreSQL 16                             │   │
│  │              (localhost:5432)                               │   │
│  │         Database: agencybook_db                            │   │
│  │              38+ tables                                    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  /home/agencybook/uploads/                                │   │
│  │  ├── avatars/     (user photos)                           │   │
│  │  ├── logos/       (agency logos)                           │   │
│  │  ├── templates/   (Excel/Doc templates)                   │   │
│  │  └── documents/   (uploaded files)                        │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### ১.২ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + Vite | React 19, Vite 8 |
| **Styling** | Tailwind CSS | v3 |
| **Charts** | Recharts | Latest |
| **Icons** | Lucide React | Latest |
| **Backend** | Node.js + Express | Node 20, Express 4 |
| **Database** | PostgreSQL | 16 |
| **Process Manager** | PM2 | Latest (Cluster Mode) |
| **Web Server** | Nginx | 1.24 |
| **SSL** | Let's Encrypt | Certbot |
| **OS** | Ubuntu | 22.04 LTS |
| **Server** | Contabo VPS | 6 Core, 12GB RAM, 100GB NVMe |

### ১.৩ Security Architecture

```
┌─ Client ──────────────────────────────────────────┐
│  httpOnly Cookie (JWT)                             │
│  No localStorage token exposure                    │
│  DevTools protection (production)                  │
│  No source maps                                    │
└──────────────┬────────────────────────────────────┘
               │ HTTPS (TLS 1.3)
┌──────────────▼────────────────────────────────────┐
│  Nginx                                             │
│  ├── HSTS (1 year)                                 │
│  ├── X-Frame-Options: DENY                         │
│  ├── X-Content-Type-Options: nosniff               │
│  ├── Referrer-Policy: strict-origin                │
│  └── .env, .git, .map → 404 block                 │
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│  Express Middleware                                 │
│  ├── Rate Limiter: 100 req/min (global)            │
│  ├── Login Limiter: 10 attempts/15min              │
│  ├── CORS: exact domain matching                   │
│  ├── Body Parser: 1MB limit                        │
│  ├── Cookie Parser: httpOnly JWT read              │
│  ├── Auth: JWT verify (cookie first, then header)  │
│  ├── RBAC: checkPermission(module, action)         │
│  └── Tenancy: .eq("agency_id", req.user.agency_id)│
└──────────────┬────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────┐
│  Data Layer                                        │
│  ├── PII Encryption: AES-256-GCM                   │
│  │   (NID, passport, address, bank info)           │
│  ├── Password: bcrypt (12 rounds)                  │
│  ├── Query Timeout: 30 seconds                     │
│  └── Activity Log: all CRUD + login tracked        │
└───────────────────────────────────────────────────┘
```

---

## ২. Database Design

### ২.১ Entity Relationship Diagram (ERD)

```
agencies (1) ─────┬───── (*) users
                  ├───── (*) branches
                  ├───── (*) students
                  ├───── (*) visitors
                  ├───── (*) schools
                  ├───── (*) batches
                  ├───── (*) agents
                  ├───── (*) partner_agencies
                  ├───── (*) employees
                  ├───── (*) tasks
                  ├───── (*) calendar_events
                  ├───── (*) communications
                  ├───── (*) payments
                  ├───── (*) expenses
                  ├───── (*) inventory
                  ├───── (*) doc_types
                  └───── (*) activity_log

students (1) ─────┬───── (*) student_education
                  ├───── (*) student_jp_exams
                  ├───── (*) student_family
                  ├───── (1) sponsors ──── (*) sponsor_banks
                  ├───── (*) documents ──── (*) document_fields
                  ├───── (*) document_data
                  ├───── (*) payments
                  ├───── (*) fee_items
                  ├───── (*) submissions
                  ├───── (*) batch_students
                  ├───── (*) attendance
                  ├───── (*) communications
                  ├───── (1) pre_departure
                  └───── (*) tasks

schools (1) ──────┬───── (*) submissions
                  └───── (*) excel_templates

batches (1) ──────┬───── (*) batch_students
                  └───── (*) attendance

partner_agencies (1) ── (*) partner_students

employees (1) ────────── (*) salary_history
```

### ২.২ Table Details

#### Core Tables

```sql
-- ═══ AGENCY (Tenant) ═══
agencies (
  id            UUID PRIMARY KEY,
  subdomain     TEXT UNIQUE NOT NULL,      -- "sunrise" → sunrise.agencybook.net
  name          TEXT NOT NULL,              -- "Sunrise Education Consultancy"
  name_bn       TEXT,                       -- "সানরাইজ এডুকেশন"
  prefix        TEXT UNIQUE,                -- "SEC" — entity ID prefix
  id_counters   JSONB DEFAULT '{"student":0,"visitor":0,"payment":0}',
  phone         TEXT,
  email         TEXT,
  trade_license TEXT,
  tin           TEXT,
  logo_url      TEXT,
  address       TEXT,
  settings      JSONB DEFAULT '{}',
  status        TEXT DEFAULT 'active',      -- active | suspended
  plan          TEXT DEFAULT 'standard',    -- free | standard | dedicated
  per_student_fee NUMERIC DEFAULT 3000,
  trial_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ═══ USERS (Staff) ═══
users (
  id            UUID PRIMARY KEY,
  agency_id     UUID REFERENCES agencies(id),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT,                       -- bcrypt (12 rounds)
  phone         TEXT,
  role          TEXT DEFAULT 'counselor',   -- owner|admin|branch_manager|counselor|teacher|accountant|viewer
  branch        TEXT DEFAULT 'Main',
  permissions   JSONB DEFAULT '{}',
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, email)
);

-- ═══ BRANCHES ═══
branches (
  id          UUID PRIMARY KEY,
  agency_id   UUID REFERENCES agencies(id),
  name        TEXT NOT NULL,                -- "Dhaka (HQ)"
  name_bn     TEXT,                         -- "ঢাকা (প্রধান কার্যালয়)"
  city        TEXT,
  address     TEXT,                         -- English address (for Excel sys var)
  address_bn  TEXT,                         -- বাংলা ঠিকানা
  phone       TEXT,
  email       TEXT,
  manager     TEXT,
  is_hq       BOOLEAN DEFAULT false,
  status      TEXT DEFAULT 'active',
  UNIQUE(agency_id, name)
);
```

#### Student & Related Tables

```sql
-- ═══ STUDENTS (Primary Entity) ═══
students (
  id               TEXT PRIMARY KEY,        -- "SEC-S-2026-001"
  agency_id        UUID REFERENCES agencies(id),
  name_en          TEXT NOT NULL,
  name_bn          TEXT,
  name_katakana    TEXT,                    -- Japanese カタカナ
  phone            TEXT NOT NULL,
  whatsapp         TEXT,
  email            TEXT,
  dob              DATE,
  gender           TEXT,
  marital_status   TEXT DEFAULT 'Single',
  nationality      TEXT DEFAULT 'Bangladeshi',
  blood_group      TEXT,
  nid              TEXT,                    -- Encrypted (AES-256)
  passport_number  TEXT,                    -- Encrypted
  passport_issue   DATE,
  passport_expiry  DATE,
  permanent_address TEXT,                   -- Encrypted
  current_address  TEXT,                    -- Encrypted
  father_name      TEXT,
  mother_name      TEXT,
  status           TEXT DEFAULT 'VISITOR',  -- 14 pipeline statuses
  country          TEXT DEFAULT 'Japan',
  school_id        UUID REFERENCES schools(id),
  batch_id         UUID REFERENCES batches(id),
  school           TEXT,                    -- Denormalized name
  batch            TEXT,                    -- Denormalized name
  intake           TEXT,                    -- "April 2026"
  source           TEXT,                    -- Walk-in|Facebook|Agent|Referral
  agent_id         UUID REFERENCES agents(id),
  student_type     TEXT DEFAULT 'own',      -- own | partner
  counselor        TEXT,
  branch           TEXT,
  portal_access    BOOLEAN DEFAULT false,
  portal_password_hash TEXT,
  gdrive_folder_url TEXT,
  photo_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ═══ EDUCATION HISTORY ═══
student_education (
  id            UUID PRIMARY KEY,
  student_id    TEXT REFERENCES students(id),
  level         TEXT,           -- SSC | HSC | Honours | Masters
  school_name   TEXT,
  year          TEXT,
  board         TEXT,
  gpa           TEXT,
  subject_group TEXT
);

-- ═══ JP EXAM RESULTS ═══
student_jp_exams (
  id            UUID PRIMARY KEY,
  student_id    TEXT REFERENCES students(id),
  exam_type     TEXT,           -- JLPT | NAT | JFT | JPT
  level         TEXT,           -- N5 | N4 | N3 | N2 | N1
  exam_date     DATE,
  score         TEXT,
  result        TEXT,           -- Passed | Failed
  certificate_url TEXT
);

-- ═══ FAMILY MEMBERS ═══
student_family (
  id          UUID PRIMARY KEY,
  student_id  TEXT REFERENCES students(id),
  relation    TEXT,             -- father | mother | spouse | sibling
  name        TEXT,
  name_en     TEXT,
  dob         DATE,
  nationality TEXT,
  occupation  TEXT,
  phone       TEXT
);

-- ═══ SPONSORS ═══
sponsors (
  id              UUID PRIMARY KEY,
  student_id      TEXT REFERENCES students(id) UNIQUE,
  name            TEXT,
  name_en         TEXT,
  relationship    TEXT,
  phone           TEXT,
  address         TEXT,                   -- Encrypted
  company_name    TEXT,
  annual_income_y1 NUMERIC,
  annual_income_y2 NUMERIC,
  annual_income_y3 NUMERIC,
  tax_y1          NUMERIC,
  tax_y2          NUMERIC,
  tax_y3          NUMERIC,
  fund_formation  JSONB DEFAULT '[]'
);

-- ═══ SPONSOR BANKS ═══
sponsor_banks (
  id          UUID PRIMARY KEY,
  sponsor_id  UUID REFERENCES sponsors(id),
  bank_name   TEXT,
  account_no  TEXT,                       -- Encrypted
  balance     NUMERIC,
  balance_date DATE
);
```

#### Financial Tables

```sql
-- ═══ PAYMENTS (Fee Collection) ═══
payments (
  id             UUID PRIMARY KEY,
  agency_id      UUID REFERENCES agencies(id),
  student_id     TEXT REFERENCES students(id),
  category       TEXT,           -- enrollment_fee | course_fee | doc_processing | visa_fee | service_charge | shokai_fee
  label          TEXT,
  amount         NUMERIC DEFAULT 0,
  total_amount   NUMERIC DEFAULT 0,
  paid_amount    NUMERIC DEFAULT 0,
  installments   INT DEFAULT 1,
  payment_method TEXT DEFAULT 'Cash',   -- Cash | bKash | Bank Transfer
  status         TEXT DEFAULT 'pending', -- pending | partial | paid
  receipt_no     TEXT,           -- "SEC-P-2026-001"
  date           DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ═══ EXPENSES ═══
expenses (
  id          UUID PRIMARY KEY,
  agency_id   UUID REFERENCES agencies(id),
  category    TEXT NOT NULL,    -- Rent | Utilities | Salary | Marketing
  description TEXT,
  amount      NUMERIC NOT NULL,
  date        DATE DEFAULT CURRENT_DATE,
  branch      TEXT,
  paid_by     TEXT,
  approved_by UUID
);
```

#### Operations Tables

```sql
-- ═══ SCHOOLS ═══
schools (
  id              UUID PRIMARY KEY,
  agency_id       UUID REFERENCES agencies(id),
  name_en         TEXT NOT NULL,
  name_jp         TEXT,
  country         TEXT DEFAULT 'Japan',
  city            TEXT,
  address         TEXT,
  contact_person  TEXT,
  contact_email   TEXT,
  shoukai_fee     NUMERIC DEFAULT 0,
  tuition_y1      NUMERIC DEFAULT 0,
  tuition_y2      NUMERIC DEFAULT 0,
  admission_fee   NUMERIC DEFAULT 0,
  dormitory_fee   NUMERIC DEFAULT 0,
  capacity        INT,
  deadline_april  DATE,
  deadline_october DATE,
  status          TEXT DEFAULT 'active'
);

-- ═══ SUBMISSIONS ═══
submissions (
  id               UUID PRIMARY KEY,
  agency_id        UUID REFERENCES agencies(id),
  school_id        UUID REFERENCES schools(id),
  student_id       TEXT REFERENCES students(id),
  intake           TEXT,
  status           TEXT DEFAULT 'pending',
  submission_date  DATE,
  interview_date   DATE,
  coe_received_date DATE,
  feedback         TEXT,
  recheck_count    INT DEFAULT 0
);

-- ═══ PRE-DEPARTURE ═══
pre_departure (
  id               UUID PRIMARY KEY,
  agency_id        UUID REFERENCES agencies(id),
  student_id       TEXT REFERENCES students(id) UNIQUE,
  coe_number       TEXT,
  coe_date         DATE,
  health_status    TEXT DEFAULT 'pending',
  tuition_remitted BOOLEAN DEFAULT false,
  vfs_appointment_date DATE,
  vfs_docs_submitted BOOLEAN DEFAULT false,
  visa_status      TEXT DEFAULT 'pending',
  visa_date        DATE,
  flight_date      DATE,
  flight_number    TEXT,
  arrival_confirmed BOOLEAN DEFAULT false
);

-- ═══ ACTIVITY LOG ═══
activity_log (
  id          UUID PRIMARY KEY,
  agency_id   UUID REFERENCES agencies(id),
  user_id     UUID,
  action      TEXT,             -- create | update | delete | login
  module      TEXT,             -- students | visitors | accounts
  record_id   TEXT,
  description TEXT,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### ২.৩ Indexing Strategy

```sql
-- Performance indexes (already in schema via UNIQUE constraints)
-- Additional recommended:
CREATE INDEX idx_students_agency ON students(agency_id);
CREATE INDEX idx_students_status ON students(agency_id, status);
CREATE INDEX idx_students_branch ON students(agency_id, branch);
CREATE INDEX idx_visitors_agency ON visitors(agency_id);
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_agency ON payments(agency_id, date);
CREATE INDEX idx_attendance_date ON attendance(date, batch_id);
CREATE INDEX idx_activity_agency ON activity_log(agency_id, created_at);
```

### ২.৪ Multi-Tenancy Design

```
Every table has agency_id column (except agencies itself)
                    │
                    ▼
    ┌───────────────────────────────┐
    │  Middleware: Tenancy Filter   │
    │                               │
    │  GET:    .eq("agency_id", X)  │
    │  POST:   agency_id = X        │
    │  PATCH:  .eq("agency_id", X)  │
    │  DELETE: .eq("agency_id", X)  │
    │                               │
    │  X = req.user.agency_id       │
    │  (from JWT token)             │
    └───────────────────────────────┘
```

---

## ৩. API Design

### ৩.১ API Architecture

```
/api
├── /auth           (login, register, logout, avatar, logo)
├── /dashboard      (aggregated stats)
├── /students       (CRUD + import + payments + portal-access)
├── /visitors       (CRUD + convert)
├── /schools        (CRUD + submissions + interview-list)
├── /batches        (CRUD + enroll)
├── /attendance     (get + bulk-save)
├── /documents      (CRUD + fields + cross-validate)
├── /docdata        (doc types + student doc data)
├── /docgen         (template upload + generate)
├── /excel          (template + mapping + generate)
├── /accounts       (income + expenses + payments)
├── /pre-departure  (list + update)
├── /tasks          (CRUD)
├── /communications (CRUD)
├── /calendar       (CRUD)
├── /agents         (CRUD)
├── /partners       (CRUD + students)
├── /hr             (employees + salary)
├── /inventory      (CRUD)
├── /reports        (analytics)
├── /users          (CRUD + branches + roles)
├── /branches       (CRUD)
├── /student-portal (me + fees + timeline + password)
├── /super-admin    (agencies + stats + pricing + billing)
└── /health         (server status)
```

### ৩.২ Authentication Flow

```
Login Request:
  POST /api/auth/login { email, password }
      │
      ├── bcrypt.compare(password, hash)
      ├── JWT sign (id, email, role, agency_id)
      ├── Set httpOnly cookie: agencybook_token
      └── Return { token, user }

Every API Request:
  Request → Cookie/Header → JWT Verify → req.user
      │
      ├── checkPermission(module, action)
      ├── .eq("agency_id", req.user.agency_id)
      └── Process request
```

### ৩.৩ ID Generation Flow

```
Agency Create:
  "Sunrise Education" → generatePrefix("Sunrise Education") → "SE"
  ensureUniquePrefix("SE") → "SE" (unique) or "SE2" (if taken)

Student Create:
  generateId(agencyId, "student")
      │
      ├── Atomic: UPDATE agencies SET id_counters.student += 1
      ├── Return: "SE-S-2026-001"
      └── Next: "SE-S-2026-002"
```

---

## ৪. Deployment Architecture

```
┌──────────────────────────────────────────────┐
│           Contabo VPS (161.97.175.16)        │
│           Ubuntu 22.04, 6 Core, 12GB RAM     │
│                                              │
│  DNS:                                        │
│    demo.agencybook.net    → 161.97.175.16    │
│    demo-api.agencybook.net → 161.97.175.16   │
│                                              │
│  Nginx (443/80):                             │
│    ├── demo.agencybook.net → dist/ (static)  │
│    └── demo-api.* → proxy :5000              │
│                                              │
│  PM2 (cluster x2):                           │
│    └── agencybook-api → node src/app.js      │
│                                              │
│  PostgreSQL 16 (5432):                       │
│    └── agencybook_db (38 tables)             │
│                                              │
│  Cron:                                       │
│    └── 2:00 AM → pg_dump backup (7 days)     │
│                                              │
│  Deploy: bash ~/deploy.sh [all|frontend|backend|schema]  │
└──────────────────────────────────────────────┘
```
