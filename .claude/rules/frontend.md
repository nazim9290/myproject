# Frontend Coding Rules — AgencyOS

These rules are mandatory for all code written in this project. No exceptions.

---

## 1. Theme — ALWAYS use useTheme()

```jsx
// CORRECT
const t = useTheme();
<div style={{ background: t.card, color: t.text }}>

// WRONG — never hardcode colors in JSX
<div style={{ background: "#1e1e2e", color: "#ffffff" }}>
<div className="bg-slate-800 text-white">
```

Available theme tokens:
- Backgrounds: `t.bg`, `t.card`, `t.cardSolid`, `t.inputBg`, `t.hoverBg`
- Borders: `t.border`, `t.inputBorder`
- Text: `t.text`, `t.textSecondary`, `t.muted`
- Accents: `t.cyan`, `t.emerald`, `t.rose`, `t.amber`, `t.purple`
- Charts: `t.chartGrid`, `t.chartAxisTick`, `t.tooltipBg`, `t.tooltipBorder`

Semi-transparent: `${t.cyan}20` = 12% opacity cyan

---

## 2. Toast — ALWAYS use useToast()

```jsx
// CORRECT
const toast = useToast();
toast.success("পেমেন্ট যোগ হয়েছে");
toast.error("সঠিক পরিমাণ দিন");
toast.updated("Student");
toast.exported("Student Fees (25 records)");

// WRONG
alert("Done!");
confirm("Delete?");
```

Every create/update/delete MUST show a toast.
Destructive actions MUST show inline confirmation UI (not `confirm()`).

---

## 3. Language — Bengali for all user-facing text

```jsx
// CORRECT
<h2>স্টুডেন্ট তালিকা</h2>
<option value="">সব ব্রাঞ্চ</option>
<p style={{ color: t.muted }}>কোনো রেকর্ড নেই</p>

// WRONG
<h2>Student List</h2>
<option value="">All Branches</option>
```

Currency format: `৳${amount.toLocaleString("en-IN")}`
Date format: `YYYY-MM-DD` (ISO) or as stored

---

## 4. Page Structure

Every page must follow this shell:
```jsx
export default function MyPage() {
  const t = useTheme();
  const toast = useToast();

  return (
    <div className="space-y-5 anim-fade">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">পেজ টাইটেল</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>সাবটাইটেল</p>
        </div>
        <Button icon={Plus} onClick={...}>নতুন যোগ করুন</Button>
      </div>

      {/* Content */}
      <Card delay={50}>...</Card>
    </div>
  );
}
```

---

## 5. Pagination — always reset page on filter change

```jsx
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(20);

// Every filter/search onChange must call setPage(1)
onChange={e => { setSearch(e.target.value); setPage(1); }}

// Compute safePage before slicing
const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
```

---

## 6. Forms — inline validation, no alerts

```jsx
const save = () => {
  if (!form.name.trim()) { toast.error("নাম দিন"); return; }
  if (!form.amount || +form.amount <= 0) { toast.error("সঠিক পরিমাণ দিন"); return; }
  // proceed
};

// Required field border highlight
style={{ border: `1px solid ${!form.name ? t.rose : t.inputBorder}` }}
```

---

## 7. Tables

```jsx
<div className="overflow-x-auto">
  <table className="w-full text-xs">
    <thead>
      <tr style={{ borderBottom: `1px solid ${t.border}` }}>
        {["কলাম"].map(h => (
          <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium"
            style={{ color: t.muted }}>{h}</th>
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

---

## 8. Delete / Destructive Actions

Always use inline confirmation, never `confirm()`:
```jsx
{showDeleteConfirm && (
  <div className="flex items-center gap-3 p-3 rounded-xl"
    style={{ background: `${t.rose}10`, border: `1px solid ${t.rose}30` }}>
    <AlertTriangle size={16} style={{ color: t.rose }} />
    <div className="flex-1">
      <p className="text-xs font-semibold" style={{ color: t.rose }}>মুছে ফেলবেন?</p>
      <p className="text-[10px]" style={{ color: t.muted }}>এই কাজ undo করা যাবে না</p>
    </div>
    <button onClick={() => setShowDeleteConfirm(false)} className="text-xs px-2 py-1" style={{ color: t.muted }}>না</button>
    <button onClick={handleDelete} className="text-xs px-3 py-1.5 rounded-lg font-medium"
      style={{ background: t.rose, color: "#fff" }}>হ্যাঁ, মুছুন</button>
  </div>
)}
```

---

## 9. CSV Export Pattern

```jsx
const doExport = () => {
  const rows = data.map(d => [d.field1, d.field2, d.amount].join(","));
  const csv = "কলাম১,কলাম২,পরিমাণ\n" + rows.join("\n");
  const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `Export_${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click();
  toast.exported(`Data (${data.length} records)`);
};
```
`String.fromCharCode(0xFEFF)` = BOM for Bengali text in Excel.

---

## 10. Searchable Dropdown — বড় list (5+ items) এ MUST use

Student, School, User/Staff dropdown-এ ALWAYS `SearchableSelect` ব্যবহার করো — কখনোই `<select>` দিয়ে বড় list রেন্ডার করো না।

```jsx
import SearchableSelect from "../../components/ui/SearchableSelect";

<SearchableSelect
  label="স্টুডেন্ট"
  value={form.studentId}
  placeholder="স্টুডেন্ট খুঁজুন..."
  options={students.map(s => ({ value: s.id, label: `${s.name_en} (${s.id})` }))}
  onChange={v => setForm(p => ({ ...p, studentId: v }))}
/>
```

**কখন ব্যবহার করবে:**
- Students dropdown (সবসময়)
- Schools dropdown (সবসময়)
- Users/Staff dropdown (5+ জন হলে)
- যেকোনো list যেখানে 5+ items আছে

**কখন `<select>` ব্যবহার করবে:**
- ছোট fixed list (priority, status, country, gender — 2-5 items)
- Staff/assignee যদি মাত্র 2-3 জন

**Staff/Assignee/Counselor — সবসময় `/users` API থেকে আনবে, হার্ডকোড করবে না।**

---

## 11. New Page Registration

After creating `src/pages/<module>/MyPage.jsx`, add to App.jsx:
```jsx
// 1. Import at top
import MyPage from "./pages/<module>/MyPage";

// 2. Add case to PageRenderer
case "<route-key>":
  return <MyPage students={students} />;
```
