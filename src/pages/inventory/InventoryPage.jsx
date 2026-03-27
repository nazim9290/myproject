import { useState, useEffect } from "react";
import { Plus, Layers, DollarSign, Building, AlertTriangle, Download, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/ui/Pagination";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { INVENTORY_CATEGORIES, CONDITION_OPTIONS, CONSUMABLE_ITEMS } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

export default function InventoryPage() {
  const t = useTheme();
  const toast = useToast();
  const [items, setItems] = useState([]);

  // ── Backend থেকে inventory items load — DB fields → frontend fields map ──
  useEffect(() => {
    api.get("/inventory").then(data => {
      if (Array.isArray(data)) setItems(data.map(i => ({
        ...i,
        price: i.unit_price || i.price || 0,
        quantity: i.quantity || 1,
        brand: i.brand || "",
        model: i.model || "",
        vendor: i.vendor || "",
      })));
    }).catch(() => {});
  }, []);
  const [consumables] = useState(CONSUMABLE_ITEMS);
  const [activeTab, setActiveTab] = useState("assets");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "Electronics", brand: "", model: "", quantity: 1, branch: "ঢাকা (HQ)", location: "", purchaseDate: "", price: "", vendor: "", warranty: "", condition: "new", assignedTo: "", notes: "" });

  // ── সার্চ, পেজিনেশন ও সর্টিং স্টেট ──
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const assetSort = useSortable("name", "asc");
  const consumableSort = useSortable("name", "asc");
  const logSort = useSortable("date", "desc");

  // ── Movement log ডাটা ──
  const movementLogs = [
    { id: 1, date: "2026-03-20", action: "Purchase", item: "A4 Paper (10 রিম)", branch: "ঢাকা HQ", by: "Rana", cost: 5500, icon: "🛒" },
    { id: 2, date: "2026-03-15", action: "Transfer", item: "Office Chair (2টি)", branch: "ঢাকা → চট্টগ্রাম", by: "Abrar", cost: 0, icon: "🔄" },
    { id: 3, date: "2026-03-10", action: "Repair", item: "Printer HP LaserJet", branch: "চট্টগ্রাম", by: "Karim", cost: 2000, icon: "🔧" },
    { id: 4, date: "2026-03-05", action: "Purchase", item: "Whiteboard Marker (20 pcs)", branch: "ঢাকা HQ", by: "Sadia", cost: 1600, icon: "🛒" },
    { id: 5, date: "2026-02-28", action: "Dispose", item: "Mouse (নষ্ট)", branch: "ঢাকা HQ", by: "Jamal", cost: 0, icon: "🗑️" },
  ];

  // ── Assets ফিল্টার + সার্চ + সর্ট + পেজিনেশন ──
  const filteredAssets = items
    .filter((i) => (filterBranch === "All" || i.branch === filterBranch) && (filterCategory === "All" || i.category === filterCategory))
    .filter((i) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (i.name || "").toLowerCase().includes(q) || (i.category || "").toLowerCase().includes(q) || (i.branch || "").toLowerCase().includes(q) || (i.brand || "").toLowerCase().includes(q) || (i.vendor || "").toLowerCase().includes(q);
    });
  const sortedAssets = assetSort.sortFn(filteredAssets);
  const assetSafePage = Math.min(page, Math.max(1, Math.ceil(sortedAssets.length / pageSize)));
  const paginatedAssets = sortedAssets.slice((assetSafePage - 1) * pageSize, assetSafePage * pageSize);

  // ── Consumables সার্চ + সর্ট + পেজিনেশন ──
  const filteredConsumables = consumables.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.category || "").toLowerCase().includes(q) || (c.branch || "").toLowerCase().includes(q);
  });
  const sortedConsumables = consumableSort.sortFn(filteredConsumables);
  const consSafePage = Math.min(page, Math.max(1, Math.ceil(sortedConsumables.length / pageSize)));
  const paginatedConsumables = sortedConsumables.slice((consSafePage - 1) * pageSize, consSafePage * pageSize);

  // ── Movement Log সার্চ + সর্ট + পেজিনেশন ──
  const filteredLogs = movementLogs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (l.item || "").toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q) || (l.branch || "").toLowerCase().includes(q) || (l.by || "").toLowerCase().includes(q);
  });
  const sortedLogs = logSort.sortFn(filteredLogs);
  const logSafePage = Math.min(page, Math.max(1, Math.ceil(sortedLogs.length / pageSize)));
  const paginatedLogs = sortedLogs.slice((logSafePage - 1) * pageSize, logSafePage * pageSize);

  // ── KPI গণনায় মূল items ব্যবহার (ফিল্টার/সার্চ ছাড়া) ──
  const totalValue = items.reduce((s, i) => s + (i.price * i.quantity), 0);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const needsRepair = items.filter((i) => i.condition === "repair" || i.condition === "damaged").length;
  const lowStock = consumables.filter((c) => c.stock <= c.minStock).length;
  const branches = [...new Set(items.map((i) => i.branch))];

  const handleAdd = () => {
    if (!addForm.name.trim()) { toast.error("সম্পদের নাম দিন"); return; }
    const newItem = { ...addForm, id: `INV-${String(Date.now()).slice(-3)}`, price: Number(addForm.price) || 0, quantity: Number(addForm.quantity) || 1 };
    setItems([newItem, ...items]);
    setShowAddForm(false);
    setAddForm({ name: "", category: "Electronics", brand: "", model: "", quantity: 1, branch: "ঢাকা (HQ)", location: "", purchaseDate: "", price: "", vendor: "", warranty: "", condition: "new", assignedTo: "", notes: "" });
    toast.success(`"${newItem.name}" — Inventory তে যোগ হয়েছে`);
  };

  const cycleCondition = (id) => {
    const order = ["new", "good", "fair", "repair", "damaged", "disposed"];
    setItems(items.map((i) => {
      if (i.id !== id) return i;
      const idx = order.indexOf(i.condition);
      return { ...i, condition: order[(idx + 1) % order.length] };
    }));
  };

  const inputStyle = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Inventory</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>সম্পদ, মালামাল ও ব্যবহার্য সামগ্রী ব্যবস্থাপনা</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={Download} size="xs" onClick={() => {
            const csv = "ID,Name,Category,Brand,Model,Qty,Branch,Condition,Price,Vendor\n" + items.map((i) => `${i.id},"${i.name}",${i.category},${i.brand},${i.model},${i.quantity},${i.branch},${i.condition},${i.price},"${i.vendor}"`).join("\n");
            const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
            a.download = `Inventory_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
          }}>Export</Button>
          <Button icon={Plus} onClick={() => setShowAddForm(!showAddForm)}>Add Item</Button>
        </div>
      </div>

      {/* ── KPI কার্ডস ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "মোট আইটেম", value: totalItems, color: t.cyan, icon: Layers },
          { label: "মোট মূল্য", value: `৳${(totalValue / 1000).toFixed(0)}K`, color: t.purple, icon: DollarSign },
          { label: "ব্রাঞ্চ", value: branches.length, color: t.amber, icon: Building },
          { label: "মেরামত দরকার", value: needsRepair, color: needsRepair > 0 ? t.rose : t.emerald, icon: AlertTriangle },
          { label: "Low Stock", value: lowStock, color: lowStock > 0 ? t.rose : t.emerald, icon: AlertTriangle },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 40}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── ট্যাব সুইচার ── */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "assets", label: "Fixed Assets", count: items.length },
          { key: "consumables", label: "ব্যবহার্য সামগ্রী", count: consumables.length },
          { key: "log", label: "Movement Log", count: movementLogs.length },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); setSearch(""); }}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{ background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent", color: activeTab === tab.key ? t.text : t.muted, boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ── সার্চ বার (সব ট্যাবে একই) ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={14} style={{ color: t.muted }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
            placeholder="নাম, ক্যাটাগরি, ব্রাঞ্চ দিয়ে খুঁজুন..." />
        </div>
        {/* Assets ট্যাবে অতিরিক্ত ফিল্টার */}
        {activeTab === "assets" && (
          <>
            <select value={filterBranch} onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl text-xs outline-none" style={inputStyle}>
              <option value="All">সব ব্রাঞ্চ</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="px-3 py-2 rounded-xl text-xs outline-none" style={inputStyle}>
              <option value="All">সব ক্যাটাগরি</option>
              {INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
      </div>

      {/* ══════════════════════ Assets ট্যাব ══════════════════════ */}
      {activeTab === "assets" && (
        <>
          {/* ── নতুন সম্পদ যোগ ফর্ম ── */}
          {showAddForm && (
            <Card delay={0}>
              <h3 className="text-sm font-semibold mb-3">নতুন সম্পদ যোগ করুন</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { key: "name", label: "সম্পদের নাম *", placeholder: "e.g. Desktop Computer" },
                  { key: "brand", label: "ব্র্যান্ড", placeholder: "e.g. Dell" },
                  { key: "model", label: "মডেল", placeholder: "e.g. OptiPlex 3090" },
                  { key: "quantity", label: "পরিমাণ", placeholder: "1", type: "number" },
                  { key: "price", label: "ক্রয়মূল্য (৳/unit)", placeholder: "45000", type: "number" },
                  { key: "vendor", label: "বিক্রেতা", placeholder: "e.g. Star Tech" },
                  { key: "location", label: "ঠিক কোথায়", placeholder: "e.g. ক্লাসরুম ১" },
                  { key: "assignedTo", label: "ব্যবহারকারী", placeholder: "e.g. Shared" },
                  { key: "purchaseDate", label: "ক্রয় তারিখ", type: "date" },
                  { key: "warranty", label: "ওয়ারেন্টি শেষ", type: "date" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                    <input type={f.type || "text"} value={addForm[f.key]} onChange={(e) => setAddForm({ ...addForm, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} placeholder={f.placeholder} />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ক্যাটাগরি</label>
                  <select value={addForm.category} onChange={(e) => setAddForm({ ...addForm, category: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    {INVENTORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ</label>
                  <select value={addForm.branch} onChange={(e) => setAddForm({ ...addForm, branch: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    <option>ঢাকা (HQ)</option><option>চট্টগ্রাম</option><option>সিলেট</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>অবস্থা</label>
                  <select value={addForm.condition} onChange={(e) => setAddForm({ ...addForm, condition: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
                    {CONDITION_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <Button variant="ghost" size="xs" onClick={() => setShowAddForm(false)}>বাতিল</Button>
                <Button size="xs" onClick={handleAdd}>সংরক্ষণ করুন</Button>
              </div>
            </Card>
          )}

          {/* ── Assets টেবিল ── */}
          <Card delay={100}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    <SortHeader label="নাম" sortKey="name" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                    <SortHeader label="ক্যাটাগরি" sortKey="category" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                    <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                    <SortHeader label="পরিমাণ" sortKey="quantity" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                    <SortHeader label="মূল্য" sortKey="price" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                    <SortHeader label="অবস্থা" sortKey="condition" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                    <SortHeader label="তারিখ" sortKey="purchaseDate" currentKey={assetSort.sortKey} currentDir={assetSort.sortDir} onSort={assetSort.toggleSort} />
                  </tr>
                </thead>
                <tbody>
                  {paginatedAssets.map((item) => {
                    const cond = CONDITION_OPTIONS.find((c) => c.value === item.condition) || CONDITION_OPTIONS[1];
                    const totalCost = item.price * item.quantity;
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            {item.brand && <p className="text-[10px]" style={{ color: t.muted }}>{item.brand} {item.model}</p>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge color={t.cyan} size="xs">{item.category}</Badge>
                        </td>
                        <td className="py-3 px-4" style={{ color: t.textSecondary }}>{item.branch}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold" style={{ color: t.cyan }}>{item.quantity}</span>
                          <span className="text-[10px] ml-1" style={{ color: t.muted }}>পিস</span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold font-mono" style={{ color: t.purple }}>৳{totalCost.toLocaleString("en-IN")}</p>
                          {item.quantity > 1 && <p className="text-[10px] font-mono" style={{ color: t.muted }}>৳{item.price.toLocaleString("en-IN")}/pc</p>}
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={() => cycleCondition(item.id)}
                            className="px-2 py-1 rounded-lg text-[10px] font-medium transition"
                            style={{ background: `${cond.color}15`, color: cond.color, border: `1px solid ${cond.color}30` }}
                            title="ক্লিক করে অবস্থা পরিবর্তন">
                            {cond.icon} {cond.label}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono" style={{ color: t.muted }}>{item.purchaseDate || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sortedAssets.length === 0 && <EmptyState icon={Layers} title="কোনো আইটেম পাওয়া যায়নি" subtitle="ফিল্টার বা সার্চ পরিবর্তন করুন" />}
            </div>
            {sortedAssets.length > 0 && (
              <Pagination total={sortedAssets.length} page={assetSafePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
            )}
          </Card>

          {/* ── ব্রাঞ্চ ভিত্তিক সারাংশ ── */}
          <Card delay={300}>
            <h3 className="text-sm font-semibold mb-3">ব্রাঞ্চ ভিত্তিক সারাংশ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {branches.map((branch) => {
                const bItems = items.filter((i) => i.branch === branch);
                const bValue = bItems.reduce((s, i) => s + (i.price * i.quantity), 0);
                const bCount = bItems.reduce((s, i) => s + i.quantity, 0);
                const bRepair = bItems.filter((i) => i.condition === "repair" || i.condition === "damaged").length;
                return (
                  <div key={branch} className="p-3 rounded-xl" style={{ background: t.inputBg }}>
                    <p className="text-sm font-bold">{branch}</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div><p className="text-[9px]" style={{ color: t.muted }}>আইটেম</p><p className="text-sm font-bold" style={{ color: t.cyan }}>{bCount}</p></div>
                      <div><p className="text-[9px]" style={{ color: t.muted }}>মূল্য</p><p className="text-sm font-bold" style={{ color: t.purple }}>৳{(bValue / 1000).toFixed(0)}K</p></div>
                      <div><p className="text-[9px]" style={{ color: t.muted }}>সমস্যা</p><p className="text-sm font-bold" style={{ color: bRepair > 0 ? t.rose : t.emerald }}>{bRepair}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* ══════════════════════ Consumables ট্যাব ══════════════════════ */}
      {activeTab === "consumables" && (
        <Card delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <SortHeader label="নাম" sortKey="name" currentKey={consumableSort.sortKey} currentDir={consumableSort.sortDir} onSort={consumableSort.toggleSort} />
                  <SortHeader label="ক্যাটাগরি" sortKey="category" currentKey={consumableSort.sortKey} currentDir={consumableSort.sortDir} onSort={consumableSort.toggleSort} />
                  <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={consumableSort.sortKey} currentDir={consumableSort.sortDir} onSort={consumableSort.toggleSort} />
                  <SortHeader label="পরিমাণ" sortKey="stock" currentKey={consumableSort.sortKey} currentDir={consumableSort.sortDir} onSort={consumableSort.toggleSort} />
                  <SortHeader label="ইউনিট" sortKey="unit" currentKey={consumableSort.sortKey} currentDir={consumableSort.sortDir} onSort={consumableSort.toggleSort} />
                  <SortHeader label="Reorder Level" sortKey="minStock" currentKey={consumableSort.sortKey} currentDir={consumableSort.sortDir} onSort={consumableSort.toggleSort} />
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>স্টক অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {paginatedConsumables.map((item) => {
                  const isLow = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-4">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-[10px]" style={{ color: t.muted }}>শেষ ক্রয়: {item.lastDate} | ৳{item.lastPrice}/{item.unit}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge color={isLow ? t.rose : t.emerald} size="xs">{item.category}</Badge>
                      </td>
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>{item.branch}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold" style={{ color: isLow ? t.rose : t.emerald }}>{item.stock}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>{item.unit}</td>
                      <td className="py-3 px-4" style={{ color: t.muted }}>{item.minStock}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.stock / item.minStock) * 50)}%`, background: isLow ? t.rose : t.emerald }} />
                          </div>
                          {isLow && <Badge color={t.rose} size="xs">Low Stock!</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedConsumables.length === 0 && <EmptyState icon={Layers} title="কোনো সামগ্রী পাওয়া যায়নি" subtitle="সার্চ পরিবর্তন করুন" />}
          </div>
          {sortedConsumables.length > 0 && (
            <Pagination total={sortedConsumables.length} page={consSafePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
          )}
        </Card>
      )}

      {/* ══════════════════════ Movement Log ট্যাব ══════════════════════ */}
      {activeTab === "log" && (
        <Card delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <SortHeader label="তারিখ" sortKey="date" currentKey={logSort.sortKey} currentDir={logSort.sortDir} onSort={logSort.toggleSort} />
                  <SortHeader label="ধরন" sortKey="action" currentKey={logSort.sortKey} currentDir={logSort.sortDir} onSort={logSort.toggleSort} />
                  <SortHeader label="আইটেম" sortKey="item" currentKey={logSort.sortKey} currentDir={logSort.sortDir} onSort={logSort.toggleSort} />
                  <SortHeader label="ব্রাঞ্চ" sortKey="branch" currentKey={logSort.sortKey} currentDir={logSort.sortDir} onSort={logSort.toggleSort} />
                  <SortHeader label="কর্মী" sortKey="by" currentKey={logSort.sortKey} currentDir={logSort.sortDir} onSort={logSort.toggleSort} />
                  <SortHeader label="খরচ" sortKey="cost" currentKey={logSort.sortKey} currentDir={logSort.sortDir} onSort={logSort.toggleSort} />
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log) => {
                  const actionColor = log.action === "Purchase" ? t.cyan : log.action === "Transfer" ? t.purple : log.action === "Repair" ? t.amber : t.muted;
                  return (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${t.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-4 font-mono" style={{ color: t.muted }}>{log.date}</td>
                      <td className="py-3 px-4">
                        <Badge color={actionColor} size="xs">{log.icon} {log.action}</Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold">{log.item}</td>
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>{log.branch}</td>
                      <td className="py-3 px-4" style={{ color: t.textSecondary }}>{log.by}</td>
                      <td className="py-3 px-4">
                        {log.cost > 0
                          ? <span className="font-bold font-mono" style={{ color: t.rose }}>৳{log.cost.toLocaleString("en-IN")}</span>
                          : <span style={{ color: t.muted }}>—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedLogs.length === 0 && <EmptyState icon={Layers} title="কোনো লগ পাওয়া যায়নি" subtitle="সার্চ পরিবর্তন করুন" />}
          </div>
          {sortedLogs.length > 0 && (
            <Pagination total={sortedLogs.length} page={logSafePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
          )}
        </Card>
      )}
    </div>
  );
}
