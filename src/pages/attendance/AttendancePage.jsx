import { useState, useEffect, useMemo, useCallback } from "react";
import { Save, Download, Search, ChevronLeft, ChevronRight, AlertTriangle, Calendar } from "lucide-react";
import { api } from "../../hooks/useAPI";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";
import { ATT_STATUS } from "../../data/mockData";

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

// ── সপ্তাহের দিন mapping ──
const DAY_MAP = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
const DAY_LABELS = { "Sun": "রবি", "Mon": "সোম", "Tue": "মঙ্গল", "Wed": "বুধ", "Thu": "বৃহ", "Fri": "শুক্র", "Sat": "শনি" };
const JS_TO_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── তারিখ helper — date string থেকে JS day number ──
const getDayNum = (dateStr) => new Date(dateStr + "T00:00:00").getDay();

// ── পরবর্তী/পূর্ববর্তী ক্লাসের দিন খুঁজে বের করা ──
function findNextClassDay(dateStr, classDayNums, direction = 1) {
  if (classDayNums.length === 0) return dateStr;
  // UTC date parse — timezone shift এড়ানো
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  for (let i = 1; i <= 7; i++) {
    d.setUTCDate(d.getUTCDate() + direction);
    if (classDayNums.includes(d.getUTCDay())) {
      // UTC date → YYYY-MM-DD string (timezone-safe)
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  }
  return dateStr;
}

// ── তারিখটি ব্যাচের date range-এর মধ্যে কিনা ──
function isInBatchRange(dateStr, batch) {
  if (!batch || !batch.start_date || !batch.end_date) return true;
  return dateStr >= batch.start_date && dateStr <= batch.end_date;
}

export default function AttendancePage({ students = [], currentUser }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const isAdmin = currentUser?.role === "owner" || currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");

  // ── ব্যাচ ডাটা API থেকে load — class_days, start_date, end_date সহ ──
  const [batches, setBatches] = useState([]);
  useEffect(() => {
    api.get("/batches").then(data => {
      if (Array.isArray(data)) setBatches(data);
    }).catch(() => {});
  }, []);

  // ── নির্বাচিত ব্যাচ object ──
  const selectedBatch = useMemo(() => {
    if (selectedBatchId === "all") return null;
    return batches.find(b => b.id === selectedBatchId || b.name === selectedBatchId) || null;
  }, [selectedBatchId, batches]);

  // ── ব্যাচের ক্লাসের দিন (JS day numbers) ──
  const classDayNums = useMemo(() => {
    if (!selectedBatch || !selectedBatch.class_days) return [];
    return (selectedBatch.class_days || []).map(d => DAY_MAP[d]).filter(n => n !== undefined);
  }, [selectedBatch]);

  // ── আজকের দিন কি ক্লাসের দিন? ──
  const isClassDay = useMemo(() => {
    if (classDayNums.length === 0) return true; // ব্যাচ সিলেক্ট না করলে সব দিন valid
    return classDayNums.includes(getDayNum(selectedDate));
  }, [selectedDate, classDayNums]);

  // ── ব্যাচ পরিবর্তন হলে নিকটতম ক্লাসের দিনে যাও ──
  const snapToClassDay = useCallback((dateStr, dayNums) => {
    if (dayNums.length === 0) return dateStr;
    if (dayNums.includes(getDayNum(dateStr))) return dateStr;
    // নিকটতম ক্লাসের দিন — সামনে ও পেছনে খুঁজে কাছেরটা নাও
    const fwd = findNextClassDay(dateStr, dayNums, 1);
    const bwd = findNextClassDay(dateStr, dayNums, -1);
    const fwdDiff = Math.abs(new Date(fwd) - new Date(dateStr));
    const bwdDiff = Math.abs(new Date(bwd) - new Date(dateStr));
    return fwdDiff <= bwdDiff ? fwd : bwd;
  }, []);

  // ── ব্যাচ পরিবর্তনে auto-snap ──
  useEffect(() => {
    if (classDayNums.length > 0 && !classDayNums.includes(getDayNum(selectedDate))) {
      const snapped = snapToClassDay(selectedDate, classDayNums);
      setSelectedDate(snapped);
    }
  }, [selectedBatchId]); // শুধু batch পরিবর্তনে, date পরিবর্তনে না

  // ── পরবর্তী / পূর্ববর্তী ক্লাস দিন — navigation ──
  const goPrev = () => setSelectedDate(findNextClassDay(selectedDate, classDayNums.length > 0 ? classDayNums : [0,1,2,3,4,5,6], -1));
  const goNext = () => setSelectedDate(findNextClassDay(selectedDate, classDayNums.length > 0 ? classDayNums : [0,1,2,3,4,5,6], 1));

  // attendanceLog: { [date]: { [studentId]: status } }
  const [attendanceLog, setAttendanceLog] = useState({});

  // ── DB থেকে attendance load — date বা batch পরিবর্তন হলে ──
  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      try {
        const batchParam = selectedBatchId !== "all" ? `&batch=${selectedBatchId}` : "";
        const data = await api.get(`/attendance?date=${selectedDate}${batchParam}`);
        if (Array.isArray(data) && data.length > 0) {
          const map = {};
          data.forEach(r => { map[r.student_id] = r.status || "absent"; });
          setAttendanceLog(prev => ({ ...prev, [selectedDate]: { ...(prev[selectedDate] || {}), ...map } }));
        }
      } catch (err) {
        console.error("[Attendance Read Error]", err);
      }
    })();
  }, [selectedDate, selectedBatchId]);

  // ── Students filtering — batch name match ──
  const eligibleStudents = students.filter(s =>
    ["ENROLLED", "IN_COURSE", "EXAM_PASSED", "DOC_COLLECTION", "SCHOOL_INTERVIEW", "DOC_SUBMITTED"].includes(s.status)
  );
  // Branch filter
  const branchOptions = ["all", ...new Set(eligibleStudents.map(s => s.branch).filter(Boolean))];
  const branchFiltered = selectedBranch === "all" ? eligibleStudents : eligibleStudents.filter(s => s.branch === selectedBranch);

  // ── Batch options — API থেকে আসা batches দেখাও ──
  const activeBatches = useMemo(() => {
    const studentBatchNames = new Set(branchFiltered.map(s => s.batch).filter(Boolean));
    // API batches যেগুলোতে student আছে
    return batches.filter(b => studentBatchNames.has(b.name) || b.status === "active");
  }, [batches, branchFiltered]);

  // ── নির্বাচিত batch-এ enrolled students ──
  const filteredStudents = useMemo(() => {
    if (selectedBatchId === "all") return branchFiltered;
    const batchName = selectedBatch?.name;
    if (!batchName) return branchFiltered;
    return branchFiltered.filter(s => s.batch === batchName);
  }, [selectedBatchId, selectedBatch, branchFiltered]);

  const baseList = filteredStudents.map(s => ({ id: s.id, name: s.name_en || s.name || s.id, batch: s.batch }));
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

  // ── Save — batch_id সহ ──
  const saveAttendance = async () => {
    const records = displayList.map(s => ({ student_id: s.id, status: getStatus(s.id) }));
    try {
      await api.post("/attendance/save", {
        date: selectedDate,
        records,
        batch_id: selectedBatchId !== "all" ? (selectedBatch?.id || null) : null,
      });
      toast.success(`${selectedDate} — ${displayList.length} জনের উপস্থিতি সংরক্ষণ হয়েছে`);
    } catch {
      toast.error("সংরক্ষণ ব্যর্থ");
    }
  };

  // ── Export CSV ──
  const exportAttendance = () => {
    const rows = displayList.map(s => `"${s.id}","${s.name}","${s.batch || ""}","${getStatus(s.id)}"`);
    const csv = "ID,নাম,ব্যাচ,স্ট্যাটাস\n" + rows.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `Attendance_${selectedDate}.csv` }).click();
    toast.exported(`Attendance (${selectedDate})`);
  };

  // ── তারিখের দিনের নাম (বাংলায়) ──
  const selectedDayName = JS_TO_DAY[getDayNum(selectedDate)];
  const selectedDayLabel = DAY_LABELS[selectedDayName] || "";

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{tr("attendance.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("attendance.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" icon={Download} size="xs" onClick={exportAttendance}>{tr("common.export")}</Button>
          <Button icon={Save} size="xs" onClick={saveAttendance}>{tr("common.save")}</Button>
        </div>
      </div>

      {/* ── ব্যাচ সিলেক্ট + তারিখ নেভিগেশন ── */}
      <Card delay={0}>
        <div className="flex flex-wrap gap-3 items-end">
          {/* ব্যাচ dropdown — API থেকে */}
          <div className="flex-1 min-w-[180px]">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("students.batch")}</label>
            <select value={selectedBatchId} onChange={e => { setSelectedBatchId(e.target.value); }}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
              <option value="all">{tr("attendance.allBatches")}</option>
              {activeBatches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}{b.class_time ? ` (${b.class_time})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* তারিখ নেভিগেশন — আগের/পরের ক্লাস দিন */}
          <div className="min-w-[200px]">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("common.date")}</label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={goPrev} className="p-2 rounded-lg transition shrink-0"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
                <ChevronLeft size={14} style={{ color: t.text }} />
              </button>
              <DateInput value={selectedDate} onChange={v => setSelectedDate(v)} size="md" />
              <button type="button" onClick={goNext} className="p-2 rounded-lg transition shrink-0"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
                <ChevronRight size={14} style={{ color: t.text }} />
              </button>
            </div>
          </div>

          {/* Branch filter — শুধু Admin */}
          {isAdmin && branchOptions.length > 2 && (
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("students.branch")}</label>
              <select value={selectedBranch} onChange={e => { setSelectedBranch(e.target.value); setSelectedBatchId("all"); }}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                <option value="all">{tr("attendance.allBranches")}</option>
                {branchOptions.filter(b => b !== "all").map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {/* সার্চ */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <Search size={14} style={{ color: t.muted }} />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
              placeholder={tr("common.search")} />
          </div>
        </div>

        {/* ── ব্যাচের ক্লাসের দিন দেখাও — pills ── */}
        {selectedBatch && selectedBatch.class_days && selectedBatch.class_days.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <Calendar size={12} style={{ color: t.muted }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>ক্লাসের দিন:</span>
            {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"].map(day => {
              const isActive = selectedBatch.class_days.includes(day);
              const isCurrent = selectedDayName === day;
              return (
                <span key={day} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: isActive ? (isCurrent ? `${t.cyan}30` : `${t.cyan}15`) : `${t.muted}10`,
                    color: isActive ? t.cyan : `${t.muted}50`,
                    border: isCurrent && isActive ? `1px solid ${t.cyan}` : "1px solid transparent",
                  }}>
                  {DAY_LABELS[day]}
                </span>
              );
            })}
            {selectedBatch.class_time && (
              <span className="text-[10px] ml-2" style={{ color: t.muted }}>⏰ {selectedBatch.class_time}</span>
            )}
          </div>
        )}

        {/* ── ক্লাসের দিন না হলে সতর্কতা ── */}
        {selectedBatch && !isClassDay && (
          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl" style={{ background: `${t.amber}10`, border: `1px solid ${t.amber}30` }}>
            <AlertTriangle size={14} style={{ color: t.amber }} />
            <p className="text-xs" style={{ color: t.amber }}>
              <strong>{selectedDayLabel}বার</strong> এই ব্যাচের ক্লাসের দিন নয়।
              ক্লাসের দিন: {(selectedBatch.class_days || []).map(d => DAY_LABELS[d]).join(", ")}
            </p>
          </div>
        )}
      </Card>

      {/* ── KPI — উপস্থিত/অনুপস্থিত/দেরি ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: tr("attendance.present"), value: present, color: t.emerald, icon: "✅" },
          { label: tr("attendance.absent"), value: absent, color: t.rose, icon: "❌" },
          { label: tr("attendance.late"), value: late, color: t.amber, icon: "⏰" },
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

      {/* ── হাজিরা টেবিল ── */}
      <Card delay={150}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">
            {tr("attendance.title")} — {formatDateDisplay(selectedDate)}
            <span className="text-[10px] font-normal ml-2" style={{ color: t.muted }}>
              ({selectedDayLabel}বার) • {displayList.length} জন
            </span>
          </h3>
          <p className="text-[10px]" style={{ color: t.muted }}>{tr("attendance.markAll")}</p>
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
          <Button icon={Save} size="xs" onClick={saveAttendance}>{tr("common.save")}</Button>
        </div>
      </Card>

      {/* ── সাপ্তাহিক সারাংশ — ব্যাচের ক্লাসের দিন অনুযায়ী ── */}
      <Card delay={250}>
        <h3 className="text-sm font-semibold mb-3">সাপ্তাহিক সারাংশ</h3>
        <div className="flex gap-2">
          {(selectedBatch && selectedBatch.class_days && selectedBatch.class_days.length > 0
            ? selectedBatch.class_days
            : ["Sun", "Mon", "Tue", "Wed", "Thu"]
          ).map((day) => {
            // এই সপ্তাহের ঐ দিনের তারিখ বের করা
            const todayDate = new Date(selectedDate + "T00:00:00");
            const todayDay = todayDate.getDay();
            const targetDay = DAY_MAP[day];
            const diff = targetDay - todayDay;
            const targetDate = new Date(todayDate);
            targetDate.setDate(targetDate.getDate() + diff);
            const dateStr = targetDate.toISOString().slice(0, 10);
            const dayAtt = attendanceLog[dateStr] || {};
            // ঐ দিনের attendance যত data আছে তার থেকে percentage
            const total = Object.keys(dayAtt).length;
            const presentCount = Object.values(dayAtt).filter(s => normalizeStatus(s) === "present" || normalizeStatus(s) === "late").length;
            const pct = total > 0 ? Math.round((presentCount / total) * 100) : null;
            const isCurrent = dateStr === selectedDate;

            return (
              <button key={day} onClick={() => setSelectedDate(dateStr)}
                className="flex-1 text-center p-2 rounded-lg transition cursor-pointer"
                style={{
                  background: isCurrent ? `${t.cyan}15` : t.inputBg,
                  border: isCurrent ? `1px solid ${t.cyan}40` : "1px solid transparent",
                }}>
                <p className="text-[9px] font-bold" style={{ color: isCurrent ? t.cyan : t.muted }}>{DAY_LABELS[day]}</p>
                <p className="text-[8px] mt-0.5" style={{ color: t.muted }}>{dateStr.slice(5)}</p>
                {pct !== null ? (
                  <>
                    <p className="text-sm font-bold mt-1" style={{ color: pct >= 85 ? t.emerald : pct >= 70 ? t.amber : t.rose }}>{pct}%</p>
                    <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: `${t.muted}20` }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 85 ? t.emerald : pct >= 70 ? t.amber : t.rose }} />
                    </div>
                  </>
                ) : (
                  <p className="text-[10px] mt-1.5" style={{ color: `${t.muted}60` }}>—</p>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
