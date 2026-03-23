# Skill: AgencyBook Dev Patterns

Reusable code templates for AgencyOS. Copy-paste these patterns when building features.

---

## PATTERN 1: Standard List Page with Filter + Pagination

```jsx
import { useState } from "react";
import { Search, Plus, Download } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import Pagination from "../../components/ui/Pagination";

export default function MyListPage({ items = [], setItems }) {
  const t = useTheme();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showForm, setShowForm] = useState(false);

  const filtered = items.filter(item =>
    (!search || item.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || item.status === filterStatus)
  );
  const safePage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const doExport = () => {
    const rows = filtered.map(i => [i.id, i.name, i.status].join(","));
    const csv = "ID,নাম,স্ট্যাটাস\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `Export_${new Date().toISOString().slice(0,10)}.csv`
    }).click();
    toast.exported(`${filtered.length} records`);
  };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">তালিকা</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{filtered.length}টি রেকর্ড</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={Download} size="xs" onClick={doExport}>Export</Button>
          <Button icon={Plus} onClick={() => setShowForm(true)}>নতুন যোগ করুন</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={14} style={{ color: t.muted }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
            placeholder="খুঁজুন..." />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl text-xs outline-none"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          <option value="">সব স্ট্যাটাস</option>
          <option value="active">সক্রিয়</option>
          <option value="inactive">নিষ্ক্রিয়</option>
        </select>
      </div>

      {/* Table */}
      <Card delay={100}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["নাম", "স্ট্যাটাস", "তারিখ"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium"
                    style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan="3" className="py-10 text-center text-xs" style={{ color: t.muted }}>কোনো রেকর্ড নেই</td></tr>
              ) : paginated.map(item => (
                <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-4"><Badge color={t.cyan} size="xs">{item.status}</Badge></td>
                  <td className="py-3 px-4" style={{ color: t.muted }}>{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination total={filtered.length} page={safePage} pageSize={pageSize}
          onPage={setPage} onPageSize={setPageSize} />
      </Card>
    </div>
  );
}
```

---

## PATTERN 2: Inline Add Form (inside Card)

```jsx
{showForm && (
  <Card delay={0}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-bold">নতুন এন্ট্রি</h3>
      <div className="flex gap-2">
        <Button variant="ghost" size="xs" onClick={() => setShowForm(false)}>বাতিল</Button>
        <Button size="xs" onClick={handleSave}>সংরক্ষণ</Button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {[
        { label: "নাম *", key: "name", required: true },
        { label: "ফোন", key: "phone" },
        { label: "ইমেইল", key: "email" },
      ].map(f => (
        <div key={f.key}>
          <label className="text-[10px] uppercase tracking-wider block mb-1"
            style={{ color: t.muted }}>{f.label}</label>
          <input
            value={form[f.key] || ""}
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: t.inputBg,
              border: `1px solid ${f.required && !form[f.key] ? t.rose : t.inputBorder}`,
              color: t.text
            }}
          />
        </div>
      ))}
    </div>
  </Card>
)}
```

---

## PATTERN 3: Status Badge Dropdown (inline select)

```jsx
const STATUS_OPTIONS = [
  { value: "active", label: "সক্রিয়", color: "#22c55e" },
  { value: "pending", label: "অপেক্ষমান", color: "#f59e0b" },
  { value: "inactive", label: "নিষ্ক্রিয়", color: "#94a3b8" },
];

// Compact badge-style select
<select
  value={item.status}
  onChange={e => handleStatusChange(item.id, e.target.value)}
  className="px-2 py-0.5 rounded-full text-[10px] font-bold outline-none cursor-pointer"
  style={{
    background: `${STATUS_OPTIONS.find(s => s.value === item.status)?.color || "#94a3b8"}20`,
    color: STATUS_OPTIONS.find(s => s.value === item.status)?.color || "#94a3b8",
    border: "none",
  }}
>
  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
</select>
```

---

## PATTERN 4: KPI Summary Cards Row

```jsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
  {[
    { label: "মোট", value: total, color: t.cyan, icon: Users },
    { label: "সক্রিয়", value: active, color: t.emerald, icon: CheckCircle },
    { label: "বকেয়া", value: due, color: t.amber, icon: Clock },
    { label: "বাতিল", value: cancelled, color: t.rose, icon: X },
  ].map((kpi, i) => (
    <Card key={i} delay={i * 50}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: `${kpi.color}15` }}>
          <kpi.icon size={18} style={{ color: kpi.color }} />
        </div>
      </div>
    </Card>
  ))}
</div>
```

---

## PATTERN 5: Export CSV with Bengali BOM

```jsx
const exportCSV = (data, columns, filename) => {
  const header = columns.map(c => c.label).join(",");
  const rows = data.map(d => columns.map(c => `"${(d[c.key] || "").toString().replace(/"/g, '""')}"`).join(","));
  const csv = header + "\n" + rows.join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `${filename}_${new Date().toISOString().slice(0,10)}.csv`
  });
  a.click();
};

// Usage
exportCSV(students, [
  { label: "ID", key: "id" },
  { label: "নাম", key: "name_en" },
  { label: "ফোন", key: "phone" },
  { label: "স্ট্যাটাস", key: "status" },
], "Students");
```

---

## PATTERN 6: Collapsible Section Card

```jsx
const [open, setOpen] = useState(false);

<Card delay={100}>
  <button onClick={() => setOpen(v => !v)}
    className="w-full flex items-center justify-between">
    <h3 className="text-sm font-bold">সেকশন টাইটেল</h3>
    <ChevronRight size={16} style={{
      color: t.muted,
      transform: open ? "rotate(90deg)" : "rotate(0deg)",
      transition: "transform 0.2s"
    }} />
  </button>
  {open && (
    <div className="mt-4" style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
      {/* content */}
    </div>
  )}
</Card>
```

---

## PATTERN 7: Delete Confirmation (inline)

```jsx
const [showDeleteId, setShowDeleteId] = useState(null);

// In table row:
{showDeleteId === item.id ? (
  <div className="flex items-center gap-2">
    <button onClick={() => { handleDelete(item.id); setShowDeleteId(null); }}
      className="text-[10px] px-2 py-1 rounded-lg font-medium"
      style={{ background: t.rose, color: "#fff" }}>নিশ্চিত</button>
    <button onClick={() => setShowDeleteId(null)}
      className="text-[10px] px-2 py-1 rounded-lg"
      style={{ color: t.muted }}>না</button>
  </div>
) : (
  <button onClick={() => setShowDeleteId(item.id)}
    className="p-1 rounded opacity-0 group-hover:opacity-100 transition"
    style={{ color: t.rose }}>
    <Trash2 size={13} />
  </button>
)}
```

---

## DATA HELPERS

```js
// Currency
const taka = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;

// Date today
const today = new Date().toISOString().slice(0, 10);

// Generate ID
const newId = (prefix, list) => `${prefix}-${String(list.length + 1).padStart(3, "0")}`;

// Safe filter chain
const filtered = data
  .filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()))
  .filter(d => !filterStatus || d.status === filterStatus)
  .filter(d => !filterBranch || d.branch === filterBranch);
```
