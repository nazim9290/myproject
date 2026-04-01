import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, Calendar, ChevronRight, Check, Save, ArrowLeft, Edit3 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { preDeparture } from "../../lib/api";

/**
 * PreDeparturePage — Pre-Departure & VFS Tracking
 * COE → Health → Tuition → VFS → Visa → Flight → Arrival
 * API থেকে real data — COE+ stage-এ থাকা students
 */
export default function PreDeparturePage() {
  const t = useTheme();
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [kpi, setKpi] = useState({ total: 0, visaGranted: 0, healthPending: 0, vfsPending: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ── API থেকে data লোড ──
  const loadData = async () => {
    try {
      const res = await preDeparture.list();
      setStudents(res.students || []);
      setKpi(res.kpi || {});
    } catch (err) {
      console.error("Pre-departure load error:", err);
      toast.error("প্রি-ডিপার্চার ডাটা লোড করতে সমস্যা হয়েছে");
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Detail View ──
  if (selectedStudent) {
    return (
      <DepartureDetail
        student={selectedStudent}
        onBack={() => { setSelectedStudent(null); loadData(); }}
        t={t}
        toast={toast}
      />
    );
  }

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">প্রি-ডিপার্চার ও ভিএফএস</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>সিওই → হেলথ → টিউশন → ভিএফএস → ভিসা → ফ্লাইট → পৌঁছানো</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "COE+ স্টুডেন্ট", value: kpi.total, color: t.cyan, icon: FileText },
          { label: "ভিসা পেয়েছে", value: kpi.visaGranted, color: t.emerald, icon: CheckCircle },
          { label: "হেলথ বাকি", value: kpi.healthPending, color: t.amber, icon: Clock },
          { label: "ভিএফএস বাকি", value: kpi.vfsPending, color: t.rose, icon: Calendar },
        ].map((k, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{k.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15` }}>
                <k.icon size={16} style={{ color: k.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Student List */}
      {loading ? (
        <Card><div className="py-10 text-center text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</div></Card>
      ) : students.length === 0 ? (
        <Card><div className="py-10 text-center text-xs" style={{ color: t.muted }}>COE+ পর্যায়ে কোনো স্টুডেন্ট নেই</div></Card>
      ) : (
        <div className="space-y-3">
          {students.map((st, i) => {
            const steps = [
              { label: "সিওই", done: !!st.coe.number, icon: "📋" },
              { label: "হেলথ", done: st.health.status === "done", icon: "🏥" },
              { label: "টিউশন", done: st.tuition.remitted, icon: "💰" },
              { label: "ভিএফএস", done: st.vfs.docsSubmitted, icon: "🛂" },
              { label: "ভিসা", done: ["granted","VISA_GRANTED","ARRIVED","COMPLETED"].includes(st.visa.status) || ["VISA_GRANTED","ARRIVED","COMPLETED"].includes(st.status), icon: "✅" },
              { label: "ফ্লাইট", done: !!st.flight.date, icon: "✈️" },
            ];
            const completedSteps = steps.filter(s => s.done).length;
            const pct = Math.round((completedSteps / steps.length) * 100);

            return (
              <Card key={st.id} delay={150 + i * 60}
                className="cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 !p-4"
                onClick={() => setSelectedStudent(st)}>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${t.cyan}25, ${t.purple}25)`, color: t.cyan }}>
                    {(st.name || st.name_en || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold group-hover:text-cyan-400 transition">{st.name || st.name_en}</p>
                      <Badge color={
                        ["VISA_GRANTED","ARRIVED","COMPLETED"].includes(st.status) ? t.emerald
                        : st.status === "VISA_APPLIED" ? t.purple
                        : t.amber
                      } size="xs">
                        {st.status === "VISA_GRANTED" ? "ভিসা পেয়েছে" : st.status === "ARRIVED" ? "পৌঁছেছে"
                          : st.status === "COMPLETED" ? "সম্পন্ন" : "COE পেয়েছে"}
                      </Badge>
                    </div>
                    <p className="text-[10px]" style={{ color: t.muted }}>{st.school} • {st.batch}{st.coe.number ? ` • COE: ${st.coe.number}` : ""}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {steps.map((step, j) => (
                        <div key={j} className="flex items-center gap-1 text-[9px]" style={{ color: step.done ? t.emerald : t.muted }}>
                          <span>{step.icon}</span>
                          <span className="hidden sm:inline">{step.label}</span>
                          {step.done ? <Check size={9} /> : <Clock size={9} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold" style={{ color: pct === 100 ? t.emerald : pct >= 50 ? t.amber : t.muted }}>{pct}%</p>
                    <p className="text-[9px]" style={{ color: t.muted }}>{completedSteps}/{steps.length}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" style={{ color: t.muted }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DepartureDetail — student-এর বিস্তারিত pre-departure info + edit
// ═══════════════════════════════════════════════════════
function DepartureDetail({ student: st, onBack, t, toast }) {
  const [form, setForm] = useState({
    coe_number: st.coe.number || "",
    coe_date: st.coe.date || "",
    health_status: st.health.status || "pending",
    health_date: st.health.date || "",
    health_notes: st.health.notes || "",
    tuition_amount: st.tuition.amount || 0,
    tuition_remitted: st.tuition.remitted || false,
    tuition_date: st.tuition.date || "",
    vfs_appointment_date: st.vfs.appointmentDate || "",
    vfs_docs_submitted: st.vfs.docsSubmitted || false,
    visa_status: st.visa.status || "pending",
    visa_date: st.visa.date || "",
    visa_expiry: st.visa.expiry || "",
    flight_date: st.flight.date || "",
    flight_number: st.flight.number || "",
    arrival_confirmed: st.arrivalConfirmed || false,
    notes: st.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await preDeparture.update(st.id, form);
      toast.success("ডিপার্চার তথ্য সেভ হয়েছে");
    } catch (err) {
      toast.error(err.message || "সেভ করতে সমস্যা হয়েছে");
    }
    setSaving(false);
  };

  const inputStyle = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  const sections = [
    {
      icon: "📋", title: "সিওই তথ্য", color: t.cyan,
      fields: [
        { key: "coe_number", label: "COE নম্বর", type: "text" },
        { key: "coe_date", label: "COE প্রাপ্তির তারিখ", type: "date" },
      ],
    },
    {
      icon: "🏥", title: "হেলথ টেস্ট", color: t.emerald,
      fields: [
        { key: "health_status", label: "স্ট্যাটাস", type: "select", options: [
          { value: "pending", label: "বাকি" }, { value: "scheduled", label: "তারিখ নির্ধারিত" }, { value: "done", label: "সম্পন্ন" },
        ]},
        { key: "health_date", label: "তারিখ", type: "date" },
        { key: "health_notes", label: "নোট", type: "text" },
      ],
    },
    {
      icon: "💰", title: "টিউশন রেমিটেন্স", color: t.amber,
      fields: [
        { key: "tuition_amount", label: "পরিমাণ (JPY)", type: "number" },
        { key: "tuition_remitted", label: "পাঠানো হয়েছে", type: "checkbox" },
        { key: "tuition_date", label: "পাঠানোর তারিখ", type: "date" },
      ],
    },
    {
      icon: "🛂", title: "ভিএফএস আবেদন", color: t.purple,
      fields: [
        { key: "vfs_appointment_date", label: "অ্যাপয়েন্টমেন্ট তারিখ", type: "date" },
        { key: "vfs_docs_submitted", label: "ডকুমেন্ট জমা দেওয়া হয়েছে", type: "checkbox" },
      ],
    },
    {
      icon: "✅", title: "ভিসা", color: t.emerald,
      fields: [
        { key: "visa_status", label: "স্ট্যাটাস", type: "select", options: [
          { value: "pending", label: "অপেক্ষমাণ" }, { value: "applied", label: "আবেদন করা হয়েছে" }, { value: "granted", label: "পেয়েছে" }, { value: "rejected", label: "প্রত্যাখ্যাত" },
        ]},
        { key: "visa_date", label: "ভিসার তারিখ", type: "date" },
        { key: "visa_expiry", label: "মেয়াদ শেষ", type: "date" },
      ],
    },
    {
      icon: "✈️", title: "ফ্লাইট", color: t.cyan,
      fields: [
        { key: "flight_date", label: "ফ্লাইট তারিখ", type: "date" },
        { key: "flight_number", label: "ফ্লাইট নম্বর", type: "text" },
        { key: "arrival_confirmed", label: "পৌঁছেছে (confirmed)", type: "checkbox" },
      ],
    },
  ];

  return (
    <div className="space-y-5 anim-fade">
      {/* হেডার */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:opacity-80" style={{ background: `${t.cyan}15` }}>
          <ArrowLeft size={16} style={{ color: t.cyan }} />
        </button>
        <div>
          <h2 className="text-xl font-bold">{st.name || st.name_en}</h2>
          <p className="text-xs" style={{ color: t.muted }}>{st.school} • {st.batch} • {st.status}</p>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, si) => (
          <Card key={sec.icon} delay={si * 60}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>{sec.icon}</span> {sec.title}
            </h3>
            <div className="space-y-3">
              {sec.fields.map(f => (
                <div key={f.key}>
                  {f.type === "checkbox" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))}
                        className="rounded" />
                      <span className="text-xs" style={{ color: t.text }}>{f.label}</span>
                    </label>
                  ) : (
                    <>
                      <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{f.label}</label>
                      {f.type === "select" ? (
                        <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle}>
                          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input type={f.type} value={form[f.key]}
                          onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={inputStyle} />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Notes + Save */}
      <Card delay={400}>
        <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>নোট</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-xs outline-none h-20 resize-none" style={inputStyle}
          placeholder="অতিরিক্ত তথ্য..." />
        <div className="flex justify-end mt-3">
          <Button icon={Save} onClick={handleSave} disabled={saving}>
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
