# AgencyOS — Master Feature Roadmap

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done

---

## PHASE 1: Students (Core)

### Task 1.1: Complete Student Form
File: `src/pages/students/AddStudentForm.jsx` (new) + `StudentsPage.jsx`
- [x] Section 1 — Personal: name_en, name_bn, name_katakana, phone, whatsapp, email, dob, gender, marital_status, nationality, nid, passport_number, passport_issue, passport_expiry, permanent_address, current_address, same_as_permanent toggle
- [x] Section 2 — Education Table (repeatable): level [SSC/HSC/Diploma/Degree/Masters], institution, year, board, gpa, group
- [x] Section 3 — Employment (repeatable): company, position, start_date, end_date
- [x] Section 4 — JP Study (repeatable): institution, hours, attendance_rate, grade
- [x] Section 5 — JP Exam (repeatable): exam_type [JLPT/JFT/NAT/JPT/JLCT/TopJ/Other], level, date, score, result
- [x] Section 6 — Visa & Destination: visa_type [Language Student/SSW/TITP/Engineer/Graduation/Masters/Visitor/Dependent/Other], country, school, batch, intake, agent, source, counselor, type, branch
- [x] Section 7 — Google Drive: gdrive_folder_url
- [x] Section 8 — Notes: internal_notes textarea
- [x] Validation: name_en + phone required. Toast on save.

### Task 1.2: Sponsor Section
File: `src/pages/students/StudentDetailView.jsx`
- [x] "Sponsor" tab in detail view
- [x] Basic: name, relationship [Father/Mother/Brother/Uncle/Other], phone, address, nid
- [x] Business: company_name, trade_license_no, work_address
- [x] Tax: tin, annual_income_y1/y2/y3, tax_y1/y2/y3
- [x] Bank (repeatable): bank_name, branch, account_no, balance, balance_date, name_in_statement, address_in_statement
- [x] Japan expense: tuition_jpy, living_jpy_monthly, payment_method, exchange_rate

### Task 1.3: Student Search & Multi-filter
File: `src/pages/students/StudentsPage.jsx`
- [x] Search: name_en, id, phone, passport_number
- [x] Filters: status, country, batch, school (AND logic)

### Task 1.4: Student Export
File: `src/pages/students/StudentsPage.jsx`
- [x] Export dropdown: Current View / All Students
- [x] 30+ fields CSV with BOM (exports filtered view)

### Task 1.5: Student Timeline
File: `src/pages/students/StudentDetailView.jsx`
- [x] "Timeline" tab: status changes, payments, documents, communications
- [x] Mock timeline data

---

## PHASE 2: Language Course

### Task 2.1: Add/Edit Batch
File: `src/pages/courses/LanguageCoursePage.jsx`
- [x] Form: name, country, start_date, end_date, capacity, level, schedule, teacher
- [x] Save → toast → list update

### Task 2.2: Enroll Student in Batch
File: `src/pages/courses/BatchDetailView.jsx`
- [x] "Add Student" button → searchable dropdown → select → add to batch → toast

### Task 2.3: Daily Attendance
File: `src/pages/attendance/AttendancePage.jsx`
- [x] Date picker → student list → Present/Absent/Late toggle → Save → toast

### Task 2.4: Add Class Test
File: `src/pages/courses/BatchDetailView.jsx`
- [x] Test name, date → score per student → Save → chart update

### Task 2.5: JLPT/NAT Result
File: `src/pages/courses/BatchDetailView.jsx`
- [x] Exam type, level → per student score/pass/fail → Save → toast

---

## PHASE 3: Accounts

### Task 3.1: Add Income Entry
File: `src/pages/accounts/AccountsPage.jsx`
- [x] Student select (searchable), category, amount, tax (15% auto for course_fee), installments, payment_method, due_date, receipt#
- [x] Save → toast

### Task 3.2: Add Expense Entry
File: `src/pages/accounts/AccountsPage.jsx`
- [x] Category, description, amount, date, branch
- [x] Save → toast

### Task 3.3: Payment Collection
File: `src/pages/accounts/AccountsPage.jsx`
- [x] Dues tab → "Collect" button → amount, method, date → update paid → toast

### Task 3.4: Export Financial Reports
File: `src/pages/accounts/AccountsPage.jsx`
- [x] Income CSV, Expense CSV, Monthly P&L CSV

---

## PHASE 4: Documents

### Task 4.1: Document Status Toggle
File: `src/pages/documents/StudentDocumentDetail.jsx`
- [x] Click status icon → cycle: not_submitted → submitted → verified → issue → toast

### Task 4.2: Document Data Entry
File: `src/pages/documents/StudentDocumentDetail.jsx`
- [x] Per doc: name_en, father_en, mother_en, dob, address → Save → toast

### Task 4.3: Auto Cross-Validation
File: `src/pages/documents/StudentDocumentDetail.jsx`
- [x] On save → compare fields across docs → show mismatches

---

## PHASE 5: Schools

### Task 5.1: Add/Edit School
File: `src/pages/schools/SchoolsPage.jsx`
- [x] name_en, name_jp, country, city, phone, fax, fees, requirements, deadline
- [x] Save → toast

### Task 5.2: Submission Tracking
File: `src/pages/schools/SchoolDetailView.jsx`
- [x] Students submitted → status: submitted/interview/accepted/rejected
- [x] Add new submission form + cycle status on click → toast

---

## PHASE 6: Tasks

### Task 6.1: Task CRUD
File: `src/pages/tasks/TasksPage.jsx`
- [x] Add: title, priority, assignee, due_date, student link
- [x] 3 columns: Todo / In Progress / Done
- [x] Click → cycle status → toast. Overdue = red. Delete with confirm.

---

## PHASE 7: Communication

### Task 7.1: Communication Log CRUD
File: `src/pages/communication/CommunicationPage.jsx`
- [x] Add: type [Phone/WhatsApp/Email/SMS/Visit], student, notes, follow_up_date
- [x] List with type filter. Student timeline view.

---

## PHASE 8: Agents

### Task 8.1: Agent CRUD + Commission
File: `src/pages/agents/AgentsPage.jsx`
- [x] Add: name, phone, area, nid, bank, commission_per_student
- [x] Detail: students, total earned, paid, due
- [x] Commission payment form → toast

---

## PHASE 9: Pre-Departure

### Task 9.1: Departure Checklist
File: `src/pages/predeparture/PreDeparturePage.jsx` + `DepartureDetailView.jsx`
- [x] Per student: COE/Health/Tuition/VFS/Visa/Flight checkmarks with dates
- [x] VFS: appointment_date, time, location
- [x] Flight: airline, flight#, date, airports

---

## PHASE 10: Remaining Modules

### Task 10.1: Certificates PDF placeholder
File: `src/pages/certificates/CertificatePage.jsx`
- [x] Certificate template preview + download button
- [x] New Template form, Generate tab, PDF download/print → toast

### Task 10.2: Inventory Add/Edit
File: `src/pages/inventory/InventoryPage.jsx`
- [x] name, category, brand, quantity, branch, condition, price, vendor → toast

### Task 10.3: HR Salary Payment
File: `src/pages/hr/HRPage.jsx`
- [x] "Pay Salary" button → month, amount, method → expense entry → toast

### Task 10.4: Calendar Add Event
File: `src/pages/calendar/CalendarPage.jsx`
- [x] Click date → title, type [Interview/Batch/Exam/Follow-up], student, notes → Save → show on calendar
- [x] Mini calendar grid with prev/next navigation + event dots

### Task 10.5: Settings Dynamic Fields
File: `src/pages/settings/SettingsPage.jsx`
- [x] Custom field definitions UI: name, type [text/select/date/number], module, required, options
- [x] Add/Delete custom fields with toast

### Task 10.6: Users Permission Matrix
File: `src/pages/users/UserRolePage.jsx`
- [x] Role × Module: Read/Write/Delete toggle matrix (full working version)

---

## EXISTING COMPLETED FEATURES

### Visitors
- [x] Visitor list with search, filter, pagination
- [x] Add visitor form (full fields)
- [x] Convert visitor → student
- [x] Branch filter + column
- [x] Follow-up date tracking

### Students
- [x] Student list with search, filter, pagination (name, phone, ID)
- [x] Branch filter + column
- [x] Student detail view
- [x] Pipeline stepper (14 steps, collapsible)
- [x] Per-step checklist with required/optional
- [x] Pause / Cancel / Re-activate
- [x] Activity log + notes
- [x] Fee structure by category (items)
- [x] Payment collection with category tagging

### Accounts & Finance
- [x] Income / Expense tabs
- [x] Student fees tab (auto-derived from student payments)
- [x] Category breakdown
- [x] Per-student fee summary table
- [x] Payment ledger
- [x] Export CSV

### HR & Branches
- [x] Branch management (add, edit, delete)
- [x] Employee list + role assignment

### Users & Roles
- [x] User management + role assignment
- [x] Permission matrix (basic)

### Language Course
- [x] Batch list + batch detail (students, attendance, tests)

### Schools
- [x] School list + school detail with submission tracking

### Documents
- [x] Document checklist per student + mismatch detection

### Dashboard
- [x] KPI cards + pipeline chart + revenue chart + alert notifications

### Profile
- [x] Profile page (avatar click) — info, security, preferences tabs

---

## ALL TASKS COMPLETED ✅

All 30+ tasks across all 10 phases have been implemented. The application is feature-complete as per this roadmap.
