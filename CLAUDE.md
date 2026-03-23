# AgencyOS — Claude Project Context

## Project Overview
**AgencyOS** (also called AgencyBook) is a Study Abroad CRM for Bangladeshi agencies that send students to Japan, Germany, and other countries for language school programs.

## Tech Stack
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v3 + inline styles via ThemeContext
- **Charts**: Recharts
- **Icons**: lucide-react
- **State**: Local React state only (no backend, no Redux, no API calls)
- **Language**: UI is entirely in Bengali (Bangla)

## Project Structure
```
src/
  App.jsx                  — AppShell, Sidebar, Header, PageRenderer, routing
  data/
    mockData.js            — INCOME_DATA, EXPENSE_DATA, CATEGORY_CONFIG, FEE_CATEGORIES, BATCHES, SCHOOLS_DATA, NAV_ITEMS, etc.
    students.js            — INITIAL_STUDENTS, PIPELINE_STATUSES
    visitors.js            — INITIAL_VISITORS
  context/
    ThemeContext.jsx       — useTheme(), THEMES (dark/light), ThemeToggle
    ToastContext.jsx       — useToast() → toast.success/error/updated/exported
  components/ui/
    Card.jsx               — <Card delay={n}> wrapper
    Button.jsx             — <Button variant icon size onClick>
    Badge.jsx              — <Badge color size>, <StatusBadge status>
    EmptyState.jsx         — empty list placeholder
    Pagination.jsx         — <Pagination total page pageSize onPage onPageSize>
  pages/
    DashboardPage.jsx
    LoginPage.jsx
    visitors/VisitorsPage.jsx
    students/StudentsPage.jsx
    students/StudentDetailView.jsx
    accounts/AccountsPage.jsx
    hr/HRPage.jsx
    users/UserRolePage.jsx
    profile/ProfilePage.jsx
    schools/SchoolsPage.jsx + SchoolDetailView.jsx
    courses/LanguageCoursePage.jsx + BatchDetailView.jsx
    documents/DocumentsPage.jsx + StudentDocumentDetail.jsx
    ... (attendance, tasks, calendar, reports, etc.)
```

## Core Patterns

### Theme
```jsx
const t = useTheme();
// t.bg, t.card, t.cardSolid, t.text, t.textSecondary, t.muted
// t.border, t.inputBg, t.inputBorder, t.hoverBg
// t.cyan, t.emerald, t.rose, t.amber, t.purple
// t.chartGrid, t.chartAxisTick, t.tooltipBg, t.tooltipBorder
```

### Toast
```jsx
const toast = useToast();
toast.success("Message");
toast.error("Message");
toast.updated("Entity name");
toast.exported("Export description");
```

### Standard Page Shell
```jsx
<div className="space-y-5 anim-fade">
  <div className="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h2 className="text-xl font-bold">Page Title</h2>
      <p className="text-xs mt-0.5" style={{ color: t.muted }}>Subtitle</p>
    </div>
    <Button icon={Plus} onClick={...}>নতুন যোগ করুন</Button>
  </div>
  <Card delay={50}>...</Card>
</div>
```

### Data Table Pattern
```jsx
<div className="overflow-x-auto">
  <table className="w-full text-xs">
    <thead>
      <tr style={{ borderBottom: `1px solid ${t.border}` }}>
        {["Col1","Col2"].map(h => (
          <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map(row => (
        <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}` }}
          onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <td className="py-3 px-4">{row.field}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Filter Bar Pattern
```jsx
<div className="flex flex-wrap gap-3 items-center">
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
    <Search size={14} style={{ color: t.muted }} />
    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
      className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
      placeholder="খুঁজুন..." />
  </div>
  <select value={filterX} onChange={e => { setFilterX(e.target.value); setPage(1); }}
    className="px-3 py-2 rounded-xl text-xs outline-none"
    style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
    <option value="">সব</option>
  </select>
</div>
```

### Pagination Pattern
```jsx
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);
const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

<Pagination total={filtered.length} page={safePage} pageSize={pageSize}
  onPage={setPage} onPageSize={setPageSize} />
```

## Student Pipeline
14 statuses in PIPELINE_STATUSES (students.js):
VISITOR → FOLLOW_UP → ENROLLED → IN_COURSE → EXAM_PASSED → DOC_COLLECTION →
SCHOOL_INTERVIEW → DOC_SUBMITTED → COE_RECEIVED → VISA_GRANTED → ARRIVED → COMPLETED
+ CANCELLED, PAUSED (terminal)

## Fee Structure (students.js)
```js
fees: {
  items: [{ id, category, label, amount }],   // fee breakdown by category
  payments: [{ id, date, amount, method, category, note }]  // actual collections
}
```
FEE_CATEGORIES: enrollment_fee, course_fee, doc_processing, visa_fee, service_charge, shokai_fee, other_income

## Branch System
INITIAL_BRANCHES in mockData.js: ঢাকা (HQ), চট্টগ্রাম, সিলেট

## Key Rules
1. All UI text in Bengali
2. Never use `alert()` — use `toast.success/error`
3. Always use `useTheme()` for colors — no hardcoded hex in JSX except from `t.*`
4. Filter changes must call `setPage(1)`
5. New pages must be added to PageRenderer in App.jsx
6. Amounts format: `৳${n.toLocaleString("en-IN")}`
