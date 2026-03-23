import { useState } from "react";
import { ArrowLeft, Download, Check, Clock, Save, Edit3 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function DepartureDetailView({ student: st, onBack, onUpdate }) {
  const t = useTheme();
  const toast = useToast();
  const [checklistState, setChecklistState] = useState(st.airportChecklist.map((c) => c.checked));
  const toggleChecklist = (idx) => { const n = [...checklistState]; n[idx] = !n[idx]; setChecklistState(n); };
  const checkedCount = checklistState.filter(Boolean).length;

  // VFS edit
  const [editingVFS, setEditingVFS] = useState(false);
  const [vfsForm, setVfsForm] = useState({ appointmentDate: st.vfs.appointmentDate || "", time: st.vfs.time || "", location: st.vfs.location || "", formFilled: st.vfs.formFilled, docsSubmitted: st.vfs.docsSubmitted });
  const saveVFS = () => {
    if (onUpdate) onUpdate({ ...st, vfs: { ...st.vfs, ...vfsForm } });
    setEditingVFS(false);
    toast.updated("VFS");
  };

  // Flight edit
  const [editingFlight, setEditingFlight] = useState(false);
  const [flightForm, setFlightForm] = useState({ airline: st.flight?.airline || "", number: st.flight?.number || "", date: st.flight?.date || "", time: st.flight?.time || "", from: st.flight?.from || "DAC", to: st.flight?.to || "NRT" });
  const saveFlight = () => {
    if (onUpdate) onUpdate({ ...st, flight: { ...st.flight, ...flightForm } });
    setEditingFlight(false);
    toast.updated("Flight");
  };

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const sections = [
    { key: "coe", icon: "📋", title: "COE Information", color: t.cyan, items: [
      { label: "COE নম্বর", value: st.coe.number },
      { label: "প্রাপ্তির তারিখ", value: st.coe.date },
      { label: "মেয়াদ শেষ", value: st.coe.expiry },
      { label: "বাকি দিন", value: `${Math.max(0, Math.ceil((new Date(st.coe.expiry) - new Date()) / 86400000))} দিন`, warn: Math.ceil((new Date(st.coe.expiry) - new Date()) / 86400000) < 30 },
    ]},
    { key: "health", icon: "🏥", title: "Health Tests", color: t.emerald, items: st.healthTests.map((h) => ({
      label: h.test, value: h.status === "done" ? `✅ ${h.result} (${h.date})` : h.status === "scheduled" ? `📅 Scheduled: ${h.date}` : "❌ বাকি আছে",
      warn: h.status !== "done",
    }))},
    { key: "tuition", icon: "💰", title: "Tuition Remittance", color: t.amber, items: [
      { label: "পরিমাণ", value: `${st.tuition.currency} ${st.tuition.amount.toLocaleString()}` },
      { label: "ব্যাংক", value: st.tuition.bank || "❌ বাকি" },
      { label: "TT Reference", value: st.tuition.ttRef || "—" },
      { label: "পাঠানোর তারিখ", value: st.tuition.sentDate || "—" },
      { label: "স্কুল পেয়েছে", value: st.tuition.receivedBySchool ? "✅ হ্যাঁ" : "⏳ অপেক্ষমাণ", warn: !st.tuition.receivedBySchool },
    ]},
    { key: "vfs", icon: "🛂", title: "VFS Application", color: t.purple, items: [
      { label: "অ্যাপয়েন্টমেন্ট তারিখ", value: st.vfs.appointmentDate || "❌ তারিখ নেওয়া হয়নি", warn: !st.vfs.appointmentDate },
      { label: "সময়", value: st.vfs.time || "—" },
      { label: "লোকেশন", value: st.vfs.location || "—" },
      { label: "ফর্ম পূরণ", value: st.vfs.formFilled ? "✅ সম্পন্ন" : "❌ বাকি", warn: !st.vfs.formFilled },
      { label: "ডকুমেন্ট জমা", value: st.vfs.docsSubmitted ? "✅ জমা দেওয়া হয়েছে" : "❌ বাকি", warn: !st.vfs.docsSubmitted },
    ]},
    { key: "visa", icon: "✅", title: "Visa Status", color: t.emerald, items: [
      { label: "স্ট্যাটাস", value: st.visa.status === "granted" ? "🎉 অনুমোদিত!" : st.visa.status === "pending" ? "⏳ Processing" : "❌ আবেদন হয়নি", warn: st.visa.status !== "granted" },
      { label: "ভিসা নম্বর", value: st.visa.number || "—" },
      { label: "অনুমোদনের তারিখ", value: st.visa.grantDate || "—" },
      { label: "সার্ভিস চার্জ (৳)", value: `৳${st.serviceCharge.amount.toLocaleString()} — ${st.serviceCharge.paid ? "✅ পরিশোধিত" : "❌ বাকি"}`, warn: !st.serviceCharge.paid },
    ]},
  ];

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl transition" style={{ background: "transparent" }}
          onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{st.name}</h2>
            <Badge color={st.visa.status === "granted" ? t.emerald : t.amber}>
              {st.visa.status === "granted" ? "ভিসা পেয়েছে" : "Processing"}
            </Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{st.id} • {st.school} • COE: {st.coe.number}</p>
        </div>
      </div>

      <Card delay={50}>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {[
            { label: "COE", done: true, icon: "📋" },
            { label: "Health", done: st.healthTests.every((h) => h.status === "done"), icon: "🏥" },
            { label: "Tuition", done: st.tuition.receivedBySchool, icon: "💰" },
            { label: "VFS", done: st.vfs.docsSubmitted, icon: "🛂" },
            { label: "Visa", done: st.visa.status === "granted", icon: "✅" },
            { label: "Flight", done: !!st.flight, icon: "✈️" },
            { label: "Checklist", done: st.airportChecklist.length > 0 && st.airportChecklist.every((c) => c.checked), icon: "📝" },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-base transition"
                  style={{ background: step.done ? `${t.emerald}20` : `${t.muted}15`, border: `2px solid ${step.done ? t.emerald : `${t.muted}30`}` }}>
                  {step.icon}
                </div>
                <span className="text-[9px] font-medium" style={{ color: step.done ? t.emerald : t.muted }}>{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-6 h-0.5 mx-1 rounded" style={{ background: step.done ? t.emerald : `${t.muted}30` }} />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, i) => (
          <Card key={sec.key} delay={100 + i * 50}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: sec.color }}>
              <span>{sec.icon}</span> {sec.title}
            </h4>
            <div className="space-y-2">
              {sec.items.map((item, j) => (
                <div key={j} className="flex justify-between text-xs gap-2">
                  <span style={{ color: t.muted }}>{item.label}</span>
                  <span className="font-medium text-right" style={{ color: item.warn ? t.rose : t.text }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* VFS Edit */}
      <Card delay={320}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.purple }}>🛂 VFS অ্যাপয়েন্টমেন্ট</h4>
          {editingVFS ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setEditingVFS(false)}>বাতিল</Button>
              <Button icon={Save} size="xs" onClick={saveVFS}>সংরক্ষণ</Button>
            </div>
          ) : <Button variant="ghost" icon={Edit3} size="xs" onClick={() => setEditingVFS(true)}>Edit</Button>}
        </div>
        {editingVFS ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "অ্যাপয়েন্টমেন্ট তারিখ", key: "appointmentDate", type: "date" },
              { label: "সময়", key: "time", type: "time" },
              { label: "লোকেশন", key: "location" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                <input type={f.type || "text"} value={vfsForm[f.key] || ""} onChange={e => setVfsForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} />
              </div>
            ))}
            <div className="flex items-center gap-3">
              {[{label:"ফর্ম পূরণ", key:"formFilled"},{label:"ডক জমা", key:"docsSubmitted"}].map(f => (
                <label key={f.key} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={!!vfsForm[f.key]} onChange={e => setVfsForm(p => ({ ...p, [f.key]: e.target.checked }))} className="rounded" />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><p className="text-[10px]" style={{ color: t.muted }}>তারিখ</p><p className="font-medium">{st.vfs.appointmentDate || "—"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>সময়</p><p className="font-medium">{st.vfs.time || "—"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>লোকেশন</p><p className="font-medium">{st.vfs.location || "—"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>ফর্ম পূরণ</p><p className="font-medium" style={{ color: st.vfs.formFilled ? t.emerald : t.rose }}>{st.vfs.formFilled ? "✅ হ্যাঁ" : "❌ না"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>ডক জমা</p><p className="font-medium" style={{ color: st.vfs.docsSubmitted ? t.emerald : t.rose }}>{st.vfs.docsSubmitted ? "✅ হ্যাঁ" : "❌ না"}</p></div>
          </div>
        )}
      </Card>

      {/* Flight Edit */}
      <Card delay={350}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.cyan }}>✈️ Flight Information</h4>
          {editingFlight ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setEditingFlight(false)}>বাতিল</Button>
              <Button icon={Save} size="xs" onClick={saveFlight}>সংরক্ষণ</Button>
            </div>
          ) : <Button variant="ghost" icon={Edit3} size="xs" onClick={() => setEditingFlight(true)}>Edit</Button>}
        </div>
        {editingFlight ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "এয়ারলাইন", key: "airline" }, { label: "ফ্লাইট নম্বর", key: "number" },
              { label: "তারিখ", key: "date", type: "date" }, { label: "সময়", key: "time", type: "time" },
              { label: "ছাড়ার বিমানবন্দর", key: "from" }, { label: "গন্তব্য বিমানবন্দর", key: "to" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                <input type={f.type || "text"} value={flightForm[f.key] || ""} onChange={e => setFlightForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} />
              </div>
            ))}
          </div>
        ) : st.flight ? (
          <div className="flex items-center gap-6 p-4 rounded-xl" style={{ background: `${t.cyan}06`, border: `1px solid ${t.cyan}20` }}>
            <div className="text-center">
              <p className="text-3xl">✈️</p>
              <p className="text-xs font-bold mt-1" style={{ color: t.cyan }}>{st.flight.airline}</p>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4 text-xs">
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>Flight</p><p className="font-bold">{st.flight.number}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>Date</p><p className="font-bold">{st.flight.date}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>Time</p><p className="font-bold">{st.flight.time}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>From</p><p className="font-bold">{st.flight.from || "DAC"}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>To</p><p className="font-bold">{st.flight.to || "NRT"}</p></div>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: t.muted }}>ফ্লাইট তথ্য এখনো যোগ হয়নি — Edit করুন</p>
        )}
      </Card>

      {st.airportChecklist.length > 0 && (
        <Card delay={400}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.amber }}>
              📝 Airport Document Checklist
            </h4>
            <span className="text-xs font-bold" style={{ color: checkedCount === st.airportChecklist.length ? t.emerald : t.amber }}>
              {checkedCount}/{st.airportChecklist.length} ✓
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: `${t.muted}15` }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(checkedCount / st.airportChecklist.length) * 100}%`, background: checkedCount === st.airportChecklist.length ? t.emerald : t.amber }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {st.airportChecklist.map((item, idx) => (
              <button key={idx} onClick={() => toggleChecklist(idx)}
                className="flex items-center gap-3 p-2.5 rounded-lg text-left transition"
                style={{ background: checklistState[idx] ? `${t.emerald}08` : "transparent", border: `1px solid ${checklistState[idx] ? `${t.emerald}20` : t.border}` }}>
                <div className="h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition"
                  style={{ borderColor: checklistState[idx] ? t.emerald : `${t.muted}40`, background: checklistState[idx] ? t.emerald : "transparent" }}>
                  {checklistState[idx] && <Check size={12} className="text-white" />}
                </div>
                <span className={`text-xs ${checklistState[idx] ? "line-through opacity-50" : ""}`}>{item.item}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <Button icon={Download} size="xs" onClick={() => toast.exported("Airport Checklist PDF")}>Download PDF</Button>
            <Button variant="ghost" size="xs" onClick={() => setChecklistState(st.airportChecklist.map(() => true))}>সব Check করুন</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
