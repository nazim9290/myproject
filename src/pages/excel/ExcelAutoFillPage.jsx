import { useState } from "react";
import { Plus, FileText, CheckCircle, AlertTriangle, ArrowLeft, Download, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { EXCEL_TEMPLATES } from "../../data/mockData";

export default function ExcelAutoFillPage({ students }) {
  const t = useTheme();
  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showGenerate, setShowGenerate] = useState(false);

  const eligibleStudents = (students || []).filter((s) => !["VISITOR", "FOLLOW_UP", "CANCELLED"].includes(s.status));

  if (selectedTemplate && showGenerate) {
    return (
      <div className="space-y-5 anim-fade">
        <div className="flex items-center gap-4">
          <button onClick={() => { setShowGenerate(false); setSelectedStudents([]); }} className="p-2 rounded-xl transition" style={{ background: "transparent" }}
            onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Excel Generate — {selectedTemplate.schoolName}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>স্টুডেন্ট সিলেক্ট করুন → Excel ডাউনলোড করুন</p>
          </div>
        </div>

        <Card delay={50}>
          <h3 className="text-sm font-semibold mb-3">স্টুডেন্ট সিলেক্ট করুন</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {eligibleStudents.map((st) => {
              const isSelected = selectedStudents.includes(st.id);
              return (
                <div key={st.id} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition"
                  style={{ background: isSelected ? `${t.cyan}10` : "transparent", border: `1px solid ${isSelected ? `${t.cyan}30` : "transparent"}` }}
                  onClick={() => setSelectedStudents(isSelected ? selectedStudents.filter((id) => id !== st.id) : [...selectedStudents, st.id])}>
                  <div className="h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition"
                    style={{ borderColor: isSelected ? t.cyan : `${t.muted}40`, background: isSelected ? t.cyan : "transparent" }}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{st.name_en}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{st.id} • {st.batch}</p>
                  </div>
                  <StatusBadge status={st.status} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-xs" style={{ color: t.muted }}>সিলেক্টেড: <span className="font-bold" style={{ color: t.cyan }}>{selectedStudents.length}</span> জন</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setSelectedStudents(eligibleStudents.map((s) => s.id))}>Select All</Button>
              <Button icon={Download} size="sm" onClick={() => {
                if (selectedStudents.length === 0) { toast.error("কমপক্ষে ১ জন স্টুডেন্ট সিলেক্ট করুন"); return; }
                const sel = (students || []).filter(s => selectedStudents.includes(s.id));
                const headers = selectedTemplate.mappings.map(m => m.label).join(",");
                const rows = sel.map(s => selectedTemplate.mappings.map(m => `"${String(s[m.field] ?? "").replace(/"/g, '""')}"`).join(","));
                const csv = headers + "\n" + rows.join("\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${selectedTemplate.schoolName}_${new Date().toISOString().slice(0,10)}.csv` }).click();
                toast.exported(`${selectedTemplate.schoolName} — ${sel.length} জনের ডেটা`);
              }}>
                Generate {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ""}
              </Button>
            </div>
          </div>
        </Card>

        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-3">Field Mapping — {selectedTemplate.schoolName}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  {["Cell", "Excel Label", "System Field", ""].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedTemplate.mappings.map((m, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = t.hoverBg} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td className="py-2 px-3 font-mono font-bold" style={{ color: t.cyan }}>{m.cell}</td>
                    <td className="py-2 px-3">{m.label}</td>
                    <td className="py-2 px-3 font-mono text-[10px]" style={{ color: t.purple }}>{m.field}</td>
                    <td className="py-2 px-3"><Check size={12} style={{ color: t.emerald }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedTemplate.totalFields > selectedTemplate.mappedFields && (
            <p className="text-[10px] mt-2" style={{ color: t.amber }}>⚠ {selectedTemplate.totalFields - selectedTemplate.mappedFields} fields এখনো map হয়নি</p>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Excel Auto-fill (রিজুইমি)</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>স্কুলের Excel ফরম্যাটে স্টুডেন্ট ডেটা অটো বসান</p>
        </div>
        <Button icon={Plus}>Upload Template</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "মোট Template", value: EXCEL_TEMPLATES.length, color: t.cyan, icon: FileText },
          { label: "Fully Mapped", value: EXCEL_TEMPLATES.filter((e) => e.mappedFields === e.totalFields).length, color: t.emerald, icon: CheckCircle },
          { label: "Needs Mapping", value: EXCEL_TEMPLATES.filter((e) => e.mappedFields < e.totalFields).length, color: t.amber, icon: AlertTriangle },
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

      <div className="space-y-3">
        {EXCEL_TEMPLATES.map((tmpl, i) => {
          const pct = Math.round((tmpl.mappedFields / tmpl.totalFields) * 100);
          const isComplete = pct === 100;
          return (
            <Card key={tmpl.id} delay={150 + i * 60} className="!p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${t.emerald}10` }}>📊</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{tmpl.schoolName}</p>
                    <Badge color={isComplete ? t.emerald : t.amber} size="xs">{isComplete ? "Ready ✓" : `${pct}% mapped`}</Badge>
                    <span className="text-[10px] font-mono" style={{ color: t.muted }}>v{tmpl.version}</span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{tmpl.fileName} • আপলোড: {tmpl.uploadDate} • {tmpl.mappedFields}/{tmpl.totalFields} fields</p>
                  <div className="h-1.5 rounded-full overflow-hidden mt-2 w-48" style={{ background: `${t.muted}20` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isComplete ? t.emerald : t.amber }} />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="xs">Mapping</Button>
                  <Button icon={Download} size="xs" onClick={() => { setSelectedTemplate(tmpl); setShowGenerate(true); }}>Generate</Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
