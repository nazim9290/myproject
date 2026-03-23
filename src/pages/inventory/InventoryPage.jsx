import { useState } from "react";
import { Plus, Layers, DollarSign, Building, AlertTriangle, Download } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { INITIAL_INVENTORY, CONSUMABLE_ITEMS, INVENTORY_CATEGORIES, CONDITION_OPTIONS } from "../../data/mockData";

export default function InventoryPage() {
  const t = useTheme();
  const toast = useToast();
  const [items, setItems] = useState(INITIAL_INVENTORY);
  const [consumables] = useState(CONSUMABLE_ITEMS);
  const [activeTab, setActiveTab] = useState("assets");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", category: "Electronics", brand: "", model: "", quantity: 1, branch: "ঢাকা (HQ)", location: "", purchaseDate: "", price: "", vendor: "", warranty: "", condition: "new", assignedTo: "", notes: "" });

  const filtered = items.filter((i) => (filterBranch === "All" || i.branch === filterBranch) && (filterCategory === "All" || i.category === filterCategory));
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

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "মোট আইটেম", value: totalItems, color: t.cyan, icon: Layers },
          { label: "মোট মূল্য", value: `৳${(totalValue / 1000).toFixed(0)}K`, color: t.purple, icon: DollarSign },
          { label: "ব্রাঞ্চ", value: branches.length, color: t.amber, icon: Building },
          { label: "মেরামত দরকার", value: needsRepair, color: needsRepair > 0 ? t.rose : t.emerald, icon: AlertTriangle },
          { label: "Low Stock ⚠", value: lowStock, color: lowStock > 0 ? t.rose : t.emerald, icon: AlertTriangle },
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

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "assets", label: "📦 Fixed Assets", count: items.length },
          { key: "consumables", label: "🧴 ব্যবহার্য সামগ্রী", count: consumables.length },
          { key: "log", label: "📋 Movement Log", count: 0 },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{ background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent", color: activeTab === tab.key ? t.text : t.muted, boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === "assets" && (
        <>
          <div className="flex flex-wrap gap-2">
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={inputStyle}>
              <option value="All">সব ব্রাঞ্চ</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={inputStyle}>
              <option value="All">সব ক্যাটাগরি</option>
              {INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <span className="text-xs py-1.5" style={{ color: t.muted }}>দেখাচ্ছে: {filtered.length} আইটেম</span>
          </div>

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
                <Button variant="ghost" size="xs" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button size="xs" onClick={handleAdd}>Save Item</Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {filtered.map((item, i) => {
              const cond = CONDITION_OPTIONS.find((c) => c.value === item.condition) || CONDITION_OPTIONS[1];
              const totalCost = item.price * item.quantity;
              const warrantyExpired = item.warranty && new Date(item.warranty) < new Date();
              return (
                <Card key={item.id} delay={100 + i * 30} className="!p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${cond.color}15` }}>
                      {item.category === "Electronics" ? "💻" : item.category === "Furniture" ? "🪑" : item.category === "Books & Materials" ? "📚" : item.category === "Appliances" ? "❄️" : "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">{item.name}</p>
                        {item.brand && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: t.inputBg, color: t.muted }}>{item.brand} {item.model}</span>}
                        {warrantyExpired && <Badge color={t.rose} size="xs">ওয়ারেন্টি শেষ</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px]" style={{ color: t.muted }}>
                        <span>📍 {item.branch}</span>
                        {item.location && <span>📌 {item.location}</span>}
                        {item.assignedTo && <span>👤 {item.assignedTo}</span>}
                        {item.purchaseDate && <span>📅 {item.purchaseDate}</span>}
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <p className="text-lg font-bold" style={{ color: t.cyan }}>{item.quantity}</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>পিস</p>
                    </div>
                    <div className="text-right shrink-0 w-20">
                      <p className="text-xs font-bold font-mono" style={{ color: t.purple }}>৳{totalCost.toLocaleString()}</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>৳{item.price.toLocaleString()}/pc</p>
                    </div>
                    <button onClick={() => cycleCondition(item.id)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition shrink-0"
                      style={{ background: `${cond.color}15`, color: cond.color, border: `1px solid ${cond.color}30` }}
                      title="ক্লিক করে অবস্থা পরিবর্তন">
                      {cond.icon} {cond.label}
                    </button>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && <Card><EmptyState icon={Layers} title="কোনো আইটেম পাওয়া যায়নি" subtitle="ফিল্টার পরিবর্তন করুন" /></Card>}
          </div>

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

      {activeTab === "consumables" && (
        <div className="space-y-2">
          {consumables.map((item, i) => {
            const isLow = item.stock <= item.minStock;
            return (
              <Card key={item.id} delay={i * 40} className="!p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: isLow ? `${t.rose}15` : `${t.emerald}15` }}>
                    {isLow ? "⚠️" : "✅"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{item.name}</p>
                      <Badge color={isLow ? t.rose : t.emerald} size="xs">{item.category}</Badge>
                      {isLow && <Badge color={t.rose} size="xs">Low Stock!</Badge>}
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>📍 {item.branch} • Last: {item.lastDate} • ৳{item.lastPrice}/{item.unit}</p>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-lg font-bold" style={{ color: isLow ? t.rose : t.emerald }}>{item.stock}</p>
                    <p className="text-[9px]" style={{ color: t.muted }}>{item.unit} (min: {item.minStock})</p>
                  </div>
                  <div className="h-1.5 w-20 rounded-full overflow-hidden shrink-0" style={{ background: `${t.muted}20` }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (item.stock / item.minStock) * 50)}%`, background: isLow ? t.rose : t.emerald }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "log" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">Movement Log</h3>
          <div className="space-y-2">
            {[
              { date: "2026-03-20", action: "Purchase", item: "A4 Paper (10 রিম)", branch: "ঢাকা HQ", by: "Rana", cost: 5500, icon: "🛒" },
              { date: "2026-03-15", action: "Transfer", item: "Office Chair (2টি)", branch: "ঢাকা → চট্টগ্রাম", by: "Abrar", cost: 0, icon: "🔄" },
              { date: "2026-03-10", action: "Repair", item: "Printer HP LaserJet", branch: "চট্টগ্রাম", by: "Karim", cost: 2000, icon: "🔧" },
              { date: "2026-03-05", action: "Purchase", item: "Whiteboard Marker (20 pcs)", branch: "ঢাকা HQ", by: "Sadia", cost: 1600, icon: "🛒" },
              { date: "2026-02-28", action: "Dispose", item: "Mouse (নষ্ট)", branch: "ঢাকা HQ", by: "Jamal", cost: 0, icon: "🗑️" },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg transition"
                onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span className="text-base">{log.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{log.item}</p>
                    <Badge color={log.action === "Purchase" ? t.cyan : log.action === "Transfer" ? t.purple : log.action === "Repair" ? t.amber : t.muted} size="xs">{log.action}</Badge>
                  </div>
                  <p className="text-[10px]" style={{ color: t.muted }}>📍 {log.branch} • 👤 {log.by}</p>
                </div>
                <span className="text-[10px] font-mono" style={{ color: t.muted }}>{log.date}</span>
                {log.cost > 0 && <span className="text-xs font-bold font-mono" style={{ color: t.rose }}>৳{log.cost.toLocaleString()}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
