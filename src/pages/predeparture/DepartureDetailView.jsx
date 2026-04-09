import { useState } from "react";
import { ArrowLeft, Download, Check, Clock, Save, Edit3 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDateDisplay } from "../../components/ui/DateInput";

export default function DepartureDetailView({ student: st, onBack, onUpdate }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr, lang } = useLanguage();
  const stepLbl = (step) => lang === "bn" ? step.label : (step.label_en || step.label);
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
    { key: "coe", icon: "📋", title: tr("departure.coeInfo"), color: t.cyan, items: [
      { label: tr("departure.coeNumber"), value: st.coe.number },
      { label: tr("departure.receivedDate"), value: formatDateDisplay(st.coe.date) },
      { label: tr("departure.expiryDate"), value: formatDateDisplay(st.coe.expiry) },
      { label: tr("departure.daysLeft"), value: tr("departure.daysCount", { count: Math.max(0, Math.ceil((new Date(st.coe.expiry) - new Date()) / 86400000)) }), warn: Math.ceil((new Date(st.coe.expiry) - new Date()) / 86400000) < 30 },
    ]},
    { key: "health", icon: "🏥", title: tr("departure.healthCheck"), color: t.emerald, items: st.healthTests.map((h) => ({
      label: h.test, value: h.status === "done" ? `✅ ${h.result} (${formatDateDisplay(h.date)})` : h.status === "scheduled" ? `📅 Scheduled: ${formatDateDisplay(h.date)}` : `❌ ${tr("departure.remaining")}`,
      warn: h.status !== "done",
    }))},
    { key: "tuition", icon: "💰", title: tr("departure.tuitionRemittance"), color: t.amber, items: [
      { label: tr("common.amount"), value: `${st.tuition.currency} ${st.tuition.amount.toLocaleString()}` },
      { label: tr("departure.bank"), value: st.tuition.bank || `❌ ${tr("departure.remaining")}` },
      { label: "TT Reference", value: st.tuition.ttRef || "—" },
      { label: tr("departure.sentDate"), value: formatDateDisplay(st.tuition.sentDate) },
      { label: tr("departure.schoolReceived"), value: st.tuition.receivedBySchool ? `✅ ${tr("common.yes")}` : `⏳ ${tr("departure.waiting")}`, warn: !st.tuition.receivedBySchool },
    ]},
    { key: "vfs", icon: "🛂", title: tr("departure.vfsApplication"), color: t.purple, items: [
      { label: tr("departure.appointmentDate"), value: st.vfs.appointmentDate ? formatDateDisplay(st.vfs.appointmentDate) : `❌ ${tr("departure.noAppointment")}`, warn: !st.vfs.appointmentDate },
      { label: tr("departure.time"), value: st.vfs.time || "—" },
      { label: tr("departure.location"), value: st.vfs.location || "—" },
      { label: tr("departure.formFilled"), value: st.vfs.formFilled ? `✅ ${tr("departure.done")}` : `❌ ${tr("departure.remaining")}`, warn: !st.vfs.formFilled },
      { label: tr("departure.docSubmitted"), value: st.vfs.docsSubmitted ? `✅ ${tr("departure.submitted")}` : `❌ ${tr("departure.remaining")}`, warn: !st.vfs.docsSubmitted },
    ]},
    { key: "visa", icon: "✅", title: tr("departure.visaStatus"), color: t.emerald, items: [
      { label: tr("common.status"), value: st.visa.status === "granted" ? `🎉 ${tr("departure.visaGranted")}` : st.visa.status === "pending" ? "⏳ Processing" : `❌ ${tr("departure.notApplied")}`, warn: st.visa.status !== "granted" },
      { label: tr("departure.visaNumber"), value: st.visa.number || "—" },
      { label: tr("departure.grantDate"), value: st.visa.grantDate || "—" },
      { label: tr("departure.serviceCharge"), value: `৳${st.serviceCharge.amount.toLocaleString()} — ${st.serviceCharge.paid ? `✅ ${tr("departure.paid")}` : `❌ ${tr("departure.remaining")}`}`, warn: !st.serviceCharge.paid },
    ]},
  ];

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
          onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
          <ArrowLeft size={16} /> <span className="hidden sm:inline">{tr("departure.back")}</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{st.name}</h2>
            <Badge color={st.visa.status === "granted" ? t.emerald : t.amber}>
              {st.visa.status === "granted" ? tr("departure.visaGranted") : "Processing"}
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
                <span className="text-[9px] font-medium" style={{ color: step.done ? t.emerald : t.muted }}>{stepLbl(step)}</span>
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
          <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.purple }}>🛂 {tr("departure.vfsAppointment")}</h4>
          {editingVFS ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setEditingVFS(false)}>{tr("common.cancel")}</Button>
              <Button icon={Save} size="xs" onClick={saveVFS}>{tr("common.save")}</Button>
            </div>
          ) : <Button variant="ghost" icon={Edit3} size="xs" onClick={() => setEditingVFS(true)}>{tr("common.edit")}</Button>}
        </div>
        {editingVFS ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: tr("departure.appointmentDate"), key: "appointmentDate", type: "date" },
              { label: tr("departure.time"), key: "time", type: "time" },
              { label: tr("departure.location"), key: "location" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{f.label}</label>
                <input type={f.type || "text"} value={vfsForm[f.key] || ""} onChange={e => setVfsForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} />
              </div>
            ))}
            <div className="flex items-center gap-3">
              {[{label:tr("departure.formFilled"), key:"formFilled"},{label:tr("departure.docSubmitted"), key:"docsSubmitted"}].map(f => (
                <label key={f.key} className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input type="checkbox" checked={!!vfsForm[f.key]} onChange={e => setVfsForm(p => ({ ...p, [f.key]: e.target.checked }))} className="rounded" />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div><p className="text-[10px]" style={{ color: t.muted }}>{tr("common.date")}</p><p className="font-medium">{st.vfs.appointmentDate || "—"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>{tr("departure.time")}</p><p className="font-medium">{st.vfs.time || "—"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>{tr("departure.location")}</p><p className="font-medium">{st.vfs.location || "—"}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>{tr("departure.formFilled")}</p><p className="font-medium" style={{ color: st.vfs.formFilled ? t.emerald : t.rose }}>{st.vfs.formFilled ? `✅ ${tr("common.yes")}` : `❌ ${tr("common.no")}`}</p></div>
            <div><p className="text-[10px]" style={{ color: t.muted }}>{tr("departure.docSubmitted")}</p><p className="font-medium" style={{ color: st.vfs.docsSubmitted ? t.emerald : t.rose }}>{st.vfs.docsSubmitted ? `✅ ${tr("common.yes")}` : `❌ ${tr("common.no")}`}</p></div>
          </div>
        )}
      </Card>

      {/* Flight Edit */}
      <Card delay={350}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.cyan }}>✈️ {tr("departure.flightInfo")}</h4>
          {editingFlight ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setEditingFlight(false)}>{tr("common.cancel")}</Button>
              <Button icon={Save} size="xs" onClick={saveFlight}>{tr("common.save")}</Button>
            </div>
          ) : <Button variant="ghost" icon={Edit3} size="xs" onClick={() => setEditingFlight(true)}>{tr("common.edit")}</Button>}
        </div>
        {editingFlight ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: tr("departure.airline"), key: "airline" }, { label: tr("departure.flightNumber"), key: "number" },
              { label: tr("common.date"), key: "date", type: "date" }, { label: tr("departure.time"), key: "time", type: "time" },
              { label: tr("departure.departureAirport"), key: "from" }, { label: tr("departure.destinationAirport"), key: "to" },
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
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>{tr("departure.flight")}</p><p className="font-bold">{st.flight.number}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>{tr("common.date")}</p><p className="font-bold">{formatDateDisplay(st.flight.date)}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>{tr("departure.time")}</p><p className="font-bold">{st.flight.time}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>{tr("departure.from")}</p><p className="font-bold">{st.flight.from || "DAC"}</p></div>
              <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>{tr("departure.destination")}</p><p className="font-bold">{st.flight.to || "NRT"}</p></div>
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: t.muted }}>{tr("departure.noFlightInfo")}</p>
        )}
      </Card>

      {st.airportChecklist.length > 0 && (
        <Card delay={400}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: t.amber }}>
              📝 {tr("departure.airportChecklist")}
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
            <Button icon={Download} size="xs" onClick={() => toast.exported("Airport Checklist PDF")}>{tr("departure.downloadPdf")}</Button>
            <Button variant="ghost" size="xs" onClick={() => setChecklistState(st.airportChecklist.map(() => true))}>{tr("departure.checkAll")}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
