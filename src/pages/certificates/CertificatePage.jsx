import { useState } from "react";
import { Plus, FileText, CheckCircle, Calendar, Eye, Download, Save, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { CERT_TEMPLATES, GENERATED_CERTS } from "../../data/mockData";

export default function CertificatePage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("templates");
  const [generateFor, setGenerateFor] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [generatedCerts, setGeneratedCerts] = useState(GENERATED_CERTS);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", name_en: "", language: "Japanese", type: "completion" });
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Certificates</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>সার্টিফিকেট টেমপ্লেট ও জেনারেশন</p>
        </div>
        <Button icon={Plus} onClick={() => setShowNewTemplate(true)}>New Template</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Templates", value: CERT_TEMPLATES.length, color: t.cyan, icon: FileText },
          { label: "Generated", value: generatedCerts.length, color: t.emerald, icon: CheckCircle },
          { label: "This Month", value: generatedCerts.filter((c) => c.generatedDate >= "2026-03-01").length, color: t.purple, icon: Calendar },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showNewTemplate && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">নতুন Template যোগ করুন</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" icon={X} onClick={() => setShowNewTemplate(false)}>বাতিল</Button>
              <Button icon={Save} size="xs" onClick={() => {
                if (!templateForm.name.trim()) { toast.error("Template নাম দিন"); return; }
                toast.success(`"${templateForm.name}" — Template যোগ হয়েছে`);
                setShowNewTemplate(false);
                setTemplateForm({ name: "", name_en: "", language: "Japanese", type: "completion" });
              }}>সংরক্ষণ</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Template নাম (বাংলা) <span className="req-star">*</span></label>
              <input value={templateForm.name} onChange={e => setTemplateForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="যেমন: সমাপ্তি সার্টিফিকেট" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>Template নাম (English)</label>
              <input value={templateForm.name_en} onChange={e => setTemplateForm(p => ({ ...p, name_en: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Completion Certificate" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ভাষা</label>
              <select value={templateForm.language} onChange={e => setTemplateForm(p => ({ ...p, language: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                <option>Japanese</option><option>English</option><option>German</option><option>Korean</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ধরন</label>
              <select value={templateForm.type} onChange={e => setTemplateForm(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                <option value="completion">Completion</option><option value="enrollment">Enrollment</option><option value="achievement">Achievement</option><option value="participation">Participation</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "templates", label: "📄 Templates" },
          { key: "generated", label: "✅ Generated" },
          { key: "generate", label: "🔄 Generate New" },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#ffffff") : "transparent", color: activeTab === tab.key ? t.text : t.muted, boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "templates" && (
        <div className="space-y-3">
          {CERT_TEMPLATES.map((tmpl, i) => (
            <Card key={tmpl.id} delay={i * 60} className="!p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${t.purple}10` }}>🏆</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{tmpl.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{tmpl.name_en}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge color={t.cyan} size="xs">{tmpl.language}</Badge>
                    <Badge color={t.amber} size="xs">{tmpl.fields.length} fields</Badge>
                    <Badge color={t.purple} size="xs">{tmpl.type.replace("_", " ")}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" icon={Eye} size="xs" onClick={() => toast.info(`"${tmpl.name}" — Preview mode (Print থেকে দেখুন)`)}>Preview</Button>
                  <Button size="xs" onClick={() => { setActiveTab("generate"); setGenerateFor(tmpl.id); }}>Generate</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "generated" && (
        <Card delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["স্টুডেন্ট", "সার্টিফিকেট", "তারিখ", "স্ট্যাটাস", ""].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generatedCerts.map((cert) => (
                  <tr key={cert.id} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-3"><p className="font-medium">{cert.studentName}</p><p className="text-[9px]" style={{ color: t.muted }}>{cert.studentId}</p></td>
                    <td className="py-3 px-3">{cert.certName}</td>
                    <td className="py-3 px-3 font-mono" style={{ color: t.textSecondary }}>{cert.generatedDate}</td>
                    <td className="py-3 px-3"><Badge color={t.emerald} size="xs">✓ Generated</Badge></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1">
                        <button onClick={() => toast.exported(`${cert.certName} — ${cert.studentName} (PDF)`)} className="px-2 py-1 rounded text-[9px] font-medium" style={{ background: `${t.cyan}15`, color: t.cyan }}>PDF</button>
                        <button onClick={() => { window.print(); }} className="px-2 py-1 rounded text-[9px] font-medium" style={{ background: `${t.purple}15`, color: t.purple }}>Print</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === "generate" && (
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4">নতুন সার্টিফিকেট জেনারেট করুন</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: t.muted }}>Template সিলেক্ট করুন</label>
              <select value={generateFor || ""} onChange={(e) => setGenerateFor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="">— Template বাছুন —</option>
                {CERT_TEMPLATES.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: t.muted }}>Student সিলেক্ট করুন</label>
              <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
                <option value="">— Student বাছুন —</option>
                {(students || []).filter((s) => !["CANCELLED", "VISITOR"].includes(s.status)).map((s) => <option key={s.id} value={s.id}>{s.name_en} ({s.id})</option>)}
              </select>
            </div>
          </div>
          {generateFor && selectedStudent && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: `${t.emerald}06`, border: `1px solid ${t.emerald}20` }}>
              <p className="text-xs" style={{ color: t.emerald }}>✅ প্রস্তুত! নিচের বাটনে ক্লিক করে সার্টিফিকেট জেনারেট করুন।</p>
              <div className="flex gap-2 mt-3">
                <Button icon={Download} size="sm" onClick={() => {
                  const student = (students || []).find(s => s.id === selectedStudent);
                  const tmpl = CERT_TEMPLATES.find(t => t.id === generateFor);
                  const newCert = { id: `CERT-${Date.now()}`, studentId: selectedStudent, studentName: student?.name_en || "—", certName: tmpl?.name || "সার্টিফিকেট", generatedDate: new Date().toISOString().slice(0, 10) };
                  setGeneratedCerts(prev => [newCert, ...prev]);
                  toast.exported(`${newCert.certName} — ${newCert.studentName}`);
                  setActiveTab("generated");
                }}>Download PDF</Button>
                <Button variant="ghost" icon={Eye} size="sm" onClick={() => toast.info("Preview: Print থেকে দেখুন (Ctrl+P)")}>Preview</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
