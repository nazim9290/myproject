import { useState, useEffect } from "react";
import { Save, Download, Search } from "lucide-react";
import { api } from "../../hooks/useAPI";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { ATT_STATUS, ATTENDANCE_DAY, BATCHES } from "../../data/mockData";

const ATT_CYCLE = ["present", "absent", "late"];
// P/A/L → present/absent/late normalize
const normalizeStatus = (s) => {
  if (!s) return "absent";
  const lower = s.toLowerCase();
  if (lower === "p" || lower === "present") return "present";
  if (lower === "a" || lower === "absent") return "absent";
  if (lower === "l" || lower === "late") return "late";
  return "absent";
};
// Safe ATT_STATUS lookup — undefined crash prevent
const getStatusConfig = (status) => ATT_STATUS[normalizeStatus(status)] || ATT_STATUS.absent;

export default function AttendancePage({ students = [], currentUser }) {
  const t = useTheme();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const isAdmin = currentUser?.role === "owner" || currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");
  // attendanceLog: { [date]: { [studentId]: status } }
  const [attendanceLog, setAttendanceLog] = useState({});

  // ── DB থেকে attendance load — date বা batch পরিবর্তন হলে ──
  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      try {
        const data = await api.get(`/attendance?date=${selectedDate}${selectedBatch !== "all" ? `&batch=${selectedBatch}` : ""}`);
        console.log("[Attendance Read]", selectedDate, "records:", Array.isArray(data) ? data.length : 0);
        if (Array.isArray(data) && data.length > 0) {
          const map = {};
          data.forEach(r => { map[r.student_id] = r.status || "absent"; });
          setAttendanceLog(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] || {}), ...map } }));
        }
      } catch (err) {
        console.error("[Attendance Read Error]", err);
      }
    })();
  }, [selectedDate, selectedBatch]);

  // Students to show: enrolled/in_course students filtered by batch
  const eligibleStudents = students.filter(s => ["ENROLLED", "IN_COURSE", "EXAM_PASSED", "DOC_COLLECTION", "SCHOOL_INTERVIEW", "DOC_SUBMITTED"].includes(s.status));
  // Branch filter — admin সব দেখে, staff নিজ branch
  const branchOptions = ["all", ...new Set(eligibleStudents.map(s => s.branch).filter(Boolean))];
  const branchFiltered = selectedBranch === "all" ? eligibleStudents : eligibleStudents.filter(s => s.branch === selectedBranch);
  const batchOptions = ["all", ...new Set(branchFiltered.map(s => s.batch).filter(Boolean))];
  const filteredStudents = selectedBatch === "all" ? branchFiltered : branchFiltered.filter(s => s.batch === selectedBatch);

  // Fallback to mock data if no real students
  const baseList = filteredStudents.map(s => ({ id: s.id, name: s.name_en || s.name || s.id, batch: s.batch }));

  // সার্চ ও সর্ট প্রয়োগ
  const displayList = sortFn(
    searchQ.trim()
      ? baseList.filter(s => s.name.toLowerCase().includes(searchQ.toLowerCase()) || s.id.toLowerCase().includes(searchQ.toLowerCase()))
      : baseList
  );

  const todayAtt = attendanceLog[selectedDate] || {};
  const getStatus = (id) => normalizeStatus(todayAtt[id]);
  const cycleStatus = (id) => {
    const cur = ATT_CYCLE.indexOf(getStatus(id));
    const next = ATT_CYCLE[(cur + 1) % ATT_CYCLE.length];
    setAttendanceLog(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] || {}), [id]: next } }));
  };

  const present = displayList.filter(s => getStatus(s.id) === "present").length;
  const absent = displayList.filter(s => getStatus(s.id) === "absent").length;
  const late = displayList.filter(s => getStatus(s.id) === "late").length;

  const saveAttendance = async () => {
    const records = displayList.map(s => ({ student_id: s.id, status: getStatus(s.id) }));
    try {
      await api.post("/attendance/save", { date: selectedDate, records });
      toast.success(`${selectedDate} — ${displayList.length} জনের উপস্থিতি সংরক্ষণ হয়েছে`);
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ");
    }
  };

  const exportAttendance = () => {
    const rows = displayList.map(s => `"${s.id}","${s.name}","${s.batch || ""}","${getStatus(s.id)}"`);
    const csv = "ID,নাম,ব্যাচ,স্ট্যাটাস\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Attendance_${selectedDate}.csv` }).click();
    toast.exported(`Attendance (${selectedDate})`);
  };

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">উপস্থিতি</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>দৈনিক উপস্থিতি ব্যবস্থাপনা</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={Download} size="xs" onClick={exportAttendance}>এক্সপোর্ট</Button>
          <Button icon={Save} size="xs" onClick={saveAttendance}>সংরক্ষণ</Button>
        </div>
      </div>

      {/* Date + Batch filter */}
      <Card delay={0}>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>তারিখ</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্যাচ</label>
            <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="all">সব ব্যাচ</option>
              {batchOptions.filter(b => b !== "all").map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Branch filter — শুধু Admin দেখবে */}
          {isAdmin && branchOptions.length > 2 && (
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ব্রাঞ্চ</label>
              <select value={selectedBranch} onChange={e => { setSelectedBranch(e.target.value); setSelectedBatch("all"); }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                <option value="all">সব ব্রাঞ্চ</option>
                {branchOptions.filter(b => b !== "all").map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          {/* সার্চ বার */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <Search size={14} style={{ color: t.muted }} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
              placeholder="স্টুডেন্ট খুঁজুন..." />
          </div>
          <div className="text-xs pb-2" style={{ color: t.muted }}>
            মোট: <span className="font-bold" style={{ color: t.text }}>{displayList.length}</span> জন
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "উপস্থিত", value: present, color: t.emerald, icon: "✅" },
          { label: "অনুপস্থিত", value: absent, color: t.rose, icon: "❌" },
          { label: "দেরিতে", value: late, color: t.amber, icon: "⏰" },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 40}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card delay={150}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">উপস্থিতি — {selectedDate}</h3>
          <p className="text-[10px]" style={{ color: t.muted }}>ক্লিক করে স্ট্যাটাস পরিবর্তন করুন</p>
        </div>
        {displayList.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: t.muted }}>কোনো স্টুডেন্ট নেই — ব্যাচ বা সার্চ পরিবর্তন করুন</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="ID" sortKey="id" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>ব্যাচ</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>হাজিরা</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((student) => {
                  const status = getStatus(student.id);
                  const st = getStatusConfig(status);
                  return (
                    <tr key={student.id} className="cursor-pointer" style={{ borderBottom: `1px solid ${t.border}` }}
                      onClick={() => cycleStatus(student.id)}
                      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td className="py-3 px-4">
                        <span className="font-medium">{student.name}</span>
                      </td>
                      <td className="py-3 px-4" style={{ color: t.muted }}>{student.id}</td>
                      <td className="py-3 px-4" style={{ color: t.muted }}>{student.batch || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge color={st.color} size="xs">{st.icon} {st.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end mt-4 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
          <Button icon={Save} size="xs" onClick={saveAttendance}>সংরক্ষণ করুন</Button>
        </div>
      </Card>

      <Card delay={250}>
        <h3 className="text-sm font-semibold mb-3">সাপ্তাহিক সারাংশ</h3>
        <div className="flex gap-2">
          {["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ"].map((day, i) => {
            const pct = [88, 92, 75, 85, 83][i];
            return (
              <div key={day} className="flex-1 text-center p-2 rounded-lg" style={{ background: t.inputBg }}>
                <p className="text-[9px] font-medium" style={{ color: t.muted }}>{day}</p>
                <p className="text-sm font-bold mt-1" style={{ color: pct >= 85 ? t.emerald : pct >= 70 ? t.amber : t.rose }}>{pct}%</p>
                <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: `${t.muted}20` }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 85 ? t.emerald : pct >= 70 ? t.amber : t.rose }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
