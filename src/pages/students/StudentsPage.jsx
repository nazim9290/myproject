import { useState } from "react";
import { Search, X, Plus, Download } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PIPELINE_STATUSES } from "../../data/students";
import Pagination from "../../components/ui/Pagination";
import StudentDetailView from "./StudentDetailView";
import AddStudentForm from "./AddStudentForm";

export default function StudentsPage({ students, setStudents }) {
  const t = useTheme();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterBranch, setFilterBranch] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterSchool, setFilterSchool] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const selectedStudent = selectedId ? students.find((s) => s.id === selectedId) : null;

  if (selectedStudent) {
    return (
      <StudentDetailView
        student={selectedStudent}
        onBack={() => setSelectedId(null)}
        onUpdate={(updated) => {
          setStudents(students.map((s) => s.id === updated.id ? updated : s));
          toast.updated("Student");
        }}
        onDelete={(id) => {
          setStudents(students.filter((s) => s.id !== id));
          setSelectedId(null);
          toast.deleted("Student");
        }}
      />
    );
  }

  const countries = ["All", ...new Set(students.map((s) => s.country).filter(Boolean))];
  const statuses = ["All", ...PIPELINE_STATUSES.map((s) => s.code)];
  const branches = ["All", ...new Set(students.map((s) => s.branch).filter(Boolean))];
  const batches = ["All", ...new Set(students.map((s) => s.batch).filter(Boolean))];
  const schools = ["All", ...new Set(students.map((s) => s.school).filter(Boolean))];

  const filtered = students.filter((s) => {
    const q = searchQ.toLowerCase();
    const matchSearch = !searchQ || s.name_en.toLowerCase().includes(q) || (s.name_bn || "").includes(searchQ) || (s.phone || "").includes(searchQ) || s.id.toLowerCase().includes(q) || (s.passport_number || s.passport || "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || s.status === filterStatus;
    const matchCountry = filterCountry === "All" || s.country === filterCountry;
    const matchBranch = filterBranch === "All" || (s.branch || "") === filterBranch;
    const matchBatch = filterBatch === "All" || (s.batch || "") === filterBatch;
    const matchSchool = filterSchool === "All" || (s.school || "") === filterSchool;
    return matchSearch && matchStatus && matchCountry && matchBranch && matchBatch && matchSchool;
  });
  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeCount = students.filter((s) => !["CANCELLED", "PAUSED"].includes(s.status)).length;
  const visaCount = students.filter((s) => ["VISA_GRANTED", "ARRIVED", "COMPLETED"].includes(s.status)).length;
  const ownCount = students.filter((s) => s.type === "own").length;
  const partnerCount = students.filter((s) => s.type === "partner").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Students</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>Student Pipeline Management</p>
        </div>
        <div className="flex gap-2 relative">
          <Button variant="ghost" size="xs" icon={Download} onClick={() => setShowExportMenu(p => !p)}>Export</Button>
          {showExportMenu && (
            <div className="absolute right-0 top-8 z-50 rounded-xl shadow-lg min-w-[200px] overflow-hidden"
              style={{ background: t.card, border: `1px solid ${t.border}` }}>
              {[
                { label: `📋 Current View (${filtered.length} জন)`, data: filtered },
                { label: `📦 All Students (${students.length} জন)`, data: students },
              ].map((opt) => (
                <button key={opt.label} className="w-full text-left px-4 py-2.5 text-xs transition"
                  style={{ color: t.text }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => {
                    const cols = [
                      { h: "ID", k: "id" }, { h: "Name (EN)", k: "name_en" }, { h: "Name (BN)", k: "name_bn" },
                      { h: "Name (Katakana)", k: "name_katakana" }, { h: "Phone", k: "phone" }, { h: "WhatsApp", k: "whatsapp" },
                      { h: "Email", k: "email" }, { h: "DOB", k: "dob" }, { h: "Gender", k: "gender" },
                      { h: "Marital Status", k: "marital_status" }, { h: "Nationality", k: "nationality" },
                      { h: "NID", k: "nid" }, { h: "Passport No", k: "passport_number" },
                      { h: "Passport Issue", k: "passport_issue" }, { h: "Passport Expiry", k: "passport_expiry" },
                      { h: "Permanent Address", k: "permanent_address" }, { h: "Current Address", k: "current_address" },
                      { h: "Visa Type", k: "visa_type" }, { h: "Country", k: "country" }, { h: "School", k: "school" },
                      { h: "Batch", k: "batch" }, { h: "Intake", k: "intake" }, { h: "Agent", k: "agent" },
                      { h: "Source", k: "source" }, { h: "Counselor", k: "counselor" }, { h: "Type", k: "type" },
                      { h: "Branch", k: "branch" }, { h: "Google Drive", k: "gdrive_folder_url" },
                      { h: "Status", k: "status" }, { h: "Created", k: "created" }, { h: "Notes", k: "internal_notes" },
                    ];
                    const csv = cols.map(c => c.h).join(",") + "\n" +
                      opt.data.map(s => cols.map(c => `"${String(s[c.k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
                    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
                    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Students_${new Date().toISOString().slice(0,10)}.csv` }).click();
                    toast.exported(`Students (${opt.data.length} records)`);
                    setShowExportMenu(false);
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <Button icon={Plus} onClick={() => setShowAddForm(true)}>Add Student</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Total", v: students.length, c: t.cyan },
          { l: "Active", v: activeCount, c: t.emerald },
          { l: "Visa / Arrived", v: visaCount, c: t.purple },
          { l: "Own / Partner", v: `${ownCount} / ${partnerCount}`, c: t.amber },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
            <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>{s.l}</p>
          </div>
        ))}
      </div>

      {showAddForm && (
        <AddStudentForm
          studentsCount={students.length}
          onCancel={() => setShowAddForm(false)}
          onSave={(newStudent) => {
            setStudents(prev => [newStudent, ...prev]);
            setShowAddForm(false);
            toast.success(`${newStudent.name_en} — Student added!`);
          }}
        />
      )}


      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-3 py-1.5 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          <Search size={13} style={{ color: t.muted }} />
          <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }} className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder="Search name, phone, ID..." />
          {searchQ && <button onClick={() => setSearchQ("")}><X size={12} style={{ color: t.muted }} /></button>}
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : PIPELINE_STATUSES.find(p => p.code === s)?.label || s}</option>)}
        </select>
        <select value={filterCountry} onChange={e => { setFilterCountry(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}>
          {countries.map(c => <option key={c} value={c}>{c === "All" ? "All Countries" : c}</option>)}
        </select>
        <select value={filterBranch} onChange={e => { setFilterBranch(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterBranch !== "All" ? t.cyan : t.inputBorder}`, color: filterBranch !== "All" ? t.cyan : t.text }}>
          {branches.map(b => <option key={b} value={b}>{b === "All" ? "সব Branch" : b}</option>)}
        </select>
        <select value={filterBatch} onChange={e => { setFilterBatch(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterBatch !== "All" ? t.amber : t.inputBorder}`, color: filterBatch !== "All" ? t.amber : t.text }}>
          {batches.map(b => <option key={b} value={b}>{b === "All" ? "সব Batch" : b}</option>)}
        </select>
        <select value={filterSchool} onChange={e => { setFilterSchool(e.target.value); setPage(1); }} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: t.inputBg, border: `1px solid ${filterSchool !== "All" ? t.emerald : t.inputBorder}`, color: filterSchool !== "All" ? t.emerald : t.text }}>
          {schools.map(s => <option key={s} value={s}>{s === "All" ? "সব School" : s}</option>)}
        </select>
      </div>

      <Card delay={100}>
        <p className="text-xs font-medium mb-3" style={{ color: t.textSecondary }}>মোট: {filtered.length} জন স্টুডেন্ট</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["ID", "Name", "Phone", "Branch", "Country", "School", "Batch", "Status", "Type"].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((s) => (
                <tr key={s.id} className="cursor-pointer" style={{ borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  onClick={() => setSelectedId(s.id)}>
                  <td className="py-3 px-3 font-mono text-[10px]" style={{ color: t.muted }}>{s.id}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${t.cyan}15`, color: t.cyan }}>
                        {s.name_en.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium block">{s.name_en}</span>
                        <span className="text-[9px] block" style={{ color: t.muted }}>{s.name_bn}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]" style={{ color: t.textSecondary }}>{s.phone}</td>
                  <td className="py-3 px-3"><Badge color={t.purple} size="xs">{s.branch || "—"}</Badge></td>
                  <td className="py-3 px-3"><Badge color={s.country === "Japan" ? t.rose : s.country === "Germany" ? t.amber : t.emerald} size="xs">{s.country}</Badge></td>
                  <td className="py-3 px-3 text-[10px]" style={{ color: t.textSecondary }}>{s.school}</td>
                  <td className="py-3 px-3 text-[10px]" style={{ color: t.textSecondary }}>{s.batch}</td>
                  <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                  <td className="py-3 px-3"><Badge color={s.type === "own" ? t.cyan : t.amber} size="xs">{s.type}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="flex flex-col items-center py-12 opacity-40"><p className="text-sm">No students found</p></div>}
        <Pagination total={filtered.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>
    </div>
  );
}
