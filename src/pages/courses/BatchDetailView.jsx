import { useState, useEffect } from "react";
import { ArrowLeft, Users, FileText, Plus, Save, X, Check, Search, Edit3, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import DateInput, { formatDateDisplay } from "../../components/ui/DateInput";
import { batches as batchesApi } from "../../lib/api";

const ATT_STATUS = ["P", "A", "L"]; // Present / Absent / Late
const ATT_LABEL = { P: "উপস্থিত", A: "অনুপস্থিত", L: "দেরিতে" };

export default function BatchDetailView({ batch, students: allStudents = [], onBack, activeTab, setActiveTab }) {
  const t = useTheme();
  const toast = useToast();
  const attColor = { P: t.emerald, A: t.rose, L: t.amber };

  const [bStudents, setBStudents] = useState([]);
  const [bTests, setBTests] = useState([]);

  // ── API থেকে batch-এর enrolled students + exam + attendance লোড ──
  useEffect(() => {
    (async () => {
      try {
        const { api: apiHook } = await import("../../hooks/useAPI");
        const data = await batchesApi.get(batch.id);

        if (data && data.enrollments && data.enrollments.length > 0) {
          // প্রতিটি student-এর detail (exam data সহ) load
          const enriched = await Promise.all(data.enrollments.map(async (e) => {
            const base = {
              studentId: e.student_id,
              name: e.students?.name_en || e.student_id,
              attendance: 0, lastTest: null,
              jlptStatus: "Preparing", examType: null, jlptLevel: null, jlptScore: null, examId: null,
            };
            try {
              const detail = await apiHook.get(`/students/${e.student_id}`);
              const exam = (detail.student_jp_exams || [])[0];
              if (exam) {
                base.examId = exam.id || null;
                base.examType = exam.exam_type || null;
                base.jlptLevel = exam.level || null;
                base.jlptScore = exam.score ? parseInt(exam.score) : null;
                base.jlptStatus = exam.result === "Passed" ? "Passed" : exam.result === "Failed" ? "Failed" : "Preparing";
              }
            } catch (err) { console.error("[Batch] Student detail load error:", err); }
            return base;
          }));
          setBStudents(enriched);
          console.log("[Batch] Enrolled:", enriched.length, "students loaded with exam data");
        }

        // Class tests load — scores সহ
        if (data && data.tests && data.tests.length > 0) {
          setBTests(data.tests.map(t => {
            // class_test_scores array থেকে scores object তৈরি
            const scoreMap = {};
            (t.class_test_scores || []).forEach(s => { scoreMap[s.student_id] = s.score; });
            const vals = Object.values(scoreMap).filter(v => v !== null && v !== undefined);
            const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            return {
              id: t.id, batchId: t.batch_id, testName: t.test_name,
              date: t.date, totalMarks: t.total_marks || 100, avgScore: avg, scores: scoreMap,
            };
          }));
        }
      } catch (err) {
        console.error("Batch detail load error:", err);
        toast.error("ব্যাচ ডাটা লোড করতে সমস্যা হয়েছে");
      }
    })();
  }, [batch.id]);

  // Enroll student
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollSearch, setEnrollSearch] = useState("");
  const enrollablStudents = allStudents.filter(s =>
    !bStudents.find(bs => bs.studentId === s.id) &&
    (!enrollSearch || s.name_en.toLowerCase().includes(enrollSearch.toLowerCase()) || s.id.toLowerCase().includes(enrollSearch.toLowerCase()))
  );
  const enroll = async (s) => {
    try {
      await batchesApi.enroll(batch.id, s.id);
      setBStudents(prev => [...prev, { studentId: s.id, name: s.name_en, attendance: 0, lastTest: null, jlptStatus: "Preparing", examType: null, jlptLevel: null, jlptScore: null }]);
      setShowEnroll(false);
      setEnrollSearch("");
      toast.success(`${s.name_en} — ব্যাচে যোগ হয়েছে`);
    } catch (err) {
      toast.error(err.message || "যোগ করতে সমস্যা হয়েছে");
    }
  };

  // Daily attendance
  const today = new Date().toISOString().slice(0, 10);
  const [attDate, setAttDate] = useState(today);
  const [attState, setAttState] = useState(() => Object.fromEntries(bStudents.map(s => [s.studentId, "P"])));
  const cycleAtt = (id) => setAttState(p => ({ ...p, [id]: ATT_STATUS[(ATT_STATUS.indexOf(p[id] || "P") + 1) % 3] }));

  // DB থেকে attendance load — date পরিবর্তন হলে
  useEffect(() => {
    if (!attDate || bStudents.length === 0) return;
    (async () => {
      try {
        const { api: apiHook } = await import("../../hooks/useAPI");
        const data = await apiHook.get(`/attendance?date=${attDate}&batch=${batch.id}`);
        console.log("[Attendance Load]", attDate, "records:", Array.isArray(data) ? data.length : 0, data);
        if (Array.isArray(data) && data.length > 0) {
          const map = {};
          data.forEach(r => {
            // status mapping — DB থেকে যা আসে তা P/A/L তে convert
            const s = (r.status || "").toLowerCase();
            map[r.student_id] = s === "present" || s === "p" ? "P" : s === "absent" || s === "a" ? "A" : s === "late" || s === "l" ? "L" : "P";
          });
          console.log("[Attendance Map]", map);
          setAttState({ ...Object.fromEntries(bStudents.map(s => [s.studentId, "P"])), ...map });
        } else {
          setAttState(Object.fromEntries(bStudents.map(s => [s.studentId, "P"])));
        }
      } catch (err) {
        console.error("[Attendance Load Error]", err);
        toast.error("উপস্থিতি ডাটা লোড করতে সমস্যা হয়েছে");
      }
    })();
  }, [attDate, bStudents.length]);
  const saveAttendance = async () => {
    // API-তে attendance save
    const records = bStudents.map(s => ({
      student_id: s.studentId,
      status: attState[s.studentId] || "P",
    }));
    try {
      const { api: apiHook } = await import("../../hooks/useAPI");
      await apiHook.post("/attendance/save", { date: attDate, batch_id: batch.id, records });
      toast.success(`${attDate} — উপস্থিতি সংরক্ষণ হয়েছে`);
    } catch (err) {
      console.error("[Attendance Save Error]", err);
      toast.error("সংরক্ষণ ব্যর্থ: " + (err.message || ""));
    }
  };

  // Add / Edit class test — supports adding students from other batches
  const [showAddTest, setShowAddTest] = useState(false);
  const [testForm, setTestForm] = useState({ testName: "", date: today, totalMarks: 100 });
  const [testScores, setTestScores] = useState({});
  const [testBatchFilter, setTestBatchFilter] = useState(batch.id);
  const [testExtraStudents, setTestExtraStudents] = useState([]); // IDs from other batches
  const [editingTest, setEditingTest] = useState(null); // যে test edit হচ্ছে তার id
  const [expandedTest, setExpandedTest] = useState(null); // কোন test-এর student scores দেখাচ্ছে

  // Current batch only (other batches would need separate API calls)
  const allBatchIds = [batch.id];

  // Students visible in the test form: current batch + any extra from other batches
  const testStudentList = [
    ...bStudents.map(s => ({ ...s, fromBatch: batch.name })),
    ...testExtraStudents.map(id => {
      const st = allStudents.find(s => s.id === id);
      return st ? { studentId: st.id, name: st.name_en, fromBatch: st.batch || "Other", attendance: 0, lastTest: null } : null;
    }).filter(Boolean),
  ];

  const addExtraBatchStudents = (batchId) => {
    // অন্য ব্যাচ থেকে students যোগ করতে API call দরকার — ভবিষ্যতে implement
    toast.info("অন্য ব্যাচ থেকে যোগ করা শীঘ্রই আসছে");
  };

  // ক্লাস টেস্ট সংরক্ষণ — নতুন অথবা edit
  const saveTest = async () => {
    if (!testForm.testName.trim()) { toast.error("টেস্টের নাম দিন"); return; }
    const tm = parseInt(testForm.totalMarks) || 100;
    const allScored = testStudentList.filter(s => testScores[s.studentId]);
    const scoreVals = allScored.map(s => parseInt(testScores[s.studentId]) || 0);
    const avg = scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : 0;

    try {
      const { api: apiHook } = await import("../../hooks/useAPI");

      if (editingTest) {
        // ── আপডেট মোড ──
        const updated = await apiHook.put(`/batches/${batch.id}/tests/${editingTest}`, {
          test_name: testForm.testName, date: testForm.date, total_marks: tm, scores: testScores,
        });
        // local state আপডেট
        const scoreMap = {};
        (updated?.class_test_scores || []).forEach(s => { scoreMap[s.student_id] = s.score; });
        setBTests(prev => prev.map(t => t.id === editingTest ? {
          ...t, testName: testForm.testName, date: testForm.date, totalMarks: tm,
          avgScore: avg, scores: Object.keys(scoreMap).length > 0 ? scoreMap : testScores,
        } : t));
        setBStudents(prev => prev.map(s => ({ ...s, lastTest: parseInt(testScores[s.studentId]) || s.lastTest })));
        toast.success("ক্লাস টেস্ট আপডেট হয়েছে");
      } else {
        // ── নতুন টেস্ট ──
        const dbTest = await apiHook.post(`/batches/${batch.id}/tests`, {
          test_name: testForm.testName, date: testForm.date, total_marks: tm, scores: testScores,
        });
        const scoreMap = {};
        (dbTest?.class_test_scores || []).forEach(s => { scoreMap[s.student_id] = s.score; });
        const newTest = {
          id: dbTest?.id || `CT-${Date.now()}`, batchId: batch.id, testName: testForm.testName,
          date: testForm.date, totalMarks: tm, avgScore: avg,
          scores: Object.keys(scoreMap).length > 0 ? scoreMap : testScores,
        };
        setBTests(prev => [...prev, newTest]);
        setBStudents(prev => prev.map(s => ({ ...s, lastTest: parseInt(testScores[s.studentId]) || s.lastTest })));
        toast.success(`ক্লাস টেস্ট যোগ হয়েছে (${allScored.length} জনের রেজাল্ট)`);
      }
    } catch (err) {
      console.error("[Class Test Save]", err);
      toast.error("ক্লাস টেস্ট সার্ভারে সেভ ব্যর্থ");
    }
    // ফর্ম রিসেট
    setTestForm({ testName: "", date: today, totalMarks: 100 });
    setTestScores({});
    setTestExtraStudents([]);
    setEditingTest(null);
    setShowAddTest(false);
  };

  // ক্লাস টেস্ট edit শুরু — ফর্ম-এ ডাটা বসাও
  const startEditTest = (test) => {
    setTestForm({ testName: test.testName, date: test.date, totalMarks: test.totalMarks || 100 });
    // scores object থেকে testScores সেট
    const sMap = {};
    if (test.scores && typeof test.scores === "object") {
      Object.entries(test.scores).forEach(([sid, sc]) => { sMap[sid] = String(sc); });
    }
    setTestScores(sMap);
    setEditingTest(test.id);
    setShowAddTest(true);
  };

  // Update exam result
  const [examUpdates, setExamUpdates] = useState({});
  const [examForm, setExamForm] = useState({ examType: "JLPT", level: "N5", date: today });
  const [showExamForm, setShowExamForm] = useState(false);
  const saveExamResults = async () => {
    // DB-তে student_jp_exams table-এ save/update
    try {
      const { api } = await import("../../hooks/useAPI");
      for (const [studentId, u] of Object.entries(examUpdates)) {
        if (u.score || u.result) {
          // existing exam_id থাকলে update, না থাকলে insert
          const student = bStudents.find(s => s.studentId === studentId);
          const resp = await api.post(`/students/${studentId}/exam-result`, {
            exam_id: student?.examId || null,
            exam_type: examForm.examType,
            level: examForm.level,
            score: u.score || null,
            result: u.result || null,
            exam_date: examForm.date || null,
          });
          // response থেকে examId আপডেট
          if (resp && resp.id) {
            setBStudents(prev => prev.map(s => s.studentId === studentId ? { ...s, examId: resp.id } : s));
          }
        }
      }
      // সফল হলে local state আপডেট
      setBStudents(prev => prev.map(s => {
        const u = examUpdates[s.studentId];
        if (!u) return s;
        return { ...s, examType: examForm.examType, jlptLevel: examForm.level, jlptScore: parseInt(u.score) || null, jlptStatus: u.result };
      }));
      toast.success("পরীক্ষার ফলাফল সংরক্ষণ হয়েছে");
    } catch (err) { console.error("[Exam Result Save]", err); toast.error("পরীক্ষার ফলাফল সার্ভারে সেভ ব্যর্থ"); }
    setExamUpdates({});
    setShowExamForm(false);
  };

  const avgAtt = bStudents.length > 0 ? Math.round(bStudents.reduce((s, st) => s + st.attendance, 0) / bStudents.length) : 0;
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="space-y-5 anim-fade">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
          onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
          <ArrowLeft size={16} /> <span className="hidden sm:inline">ফিরুন</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{batch.name}</h2>
            <Badge color={batch.country === "Japan" ? t.rose : t.amber}>{batch.country}</Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>
            {batch.level} • {batch.class_time || batch.schedule || "—"} • {batch.teacher}
            {/* ক্লাসের দিন থাকলে দেখাও */}
            {batch.class_days && batch.class_days.length > 0 && ` • ${batch.class_days.join(", ")}`}
          </p>
        </div>
      </div>

      {/* KPI — স্টুডেন্ট সংখ্যা + শিডিউল ঘণ্টা */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "স্টুডেন্ট", value: bStudents.length, color: t.cyan },
          { label: "গড় উপস্থিতি", value: `${avgAtt}%`, color: avgAtt >= 80 ? t.emerald : t.amber },
          { label: "পাস", value: bStudents.filter(s => s.jlptStatus === "Passed").length, color: t.emerald },
          { label: "প্রস্তুতি", value: bStudents.filter(s => s.jlptStatus === "Preparing").length, color: t.purple },
          { label: "ক্লাস টেস্ট", value: bTests.length, color: t.amber },
        ].map((s, i) => (
          <Card key={i} delay={i * 40}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{s.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* ── ক্লাস শিডিউল সারাংশ — total_hours, weekly_hours, total_classes থাকলে দেখাও ── */}
      {(batch.weekly_hours || batch.total_hours || batch.total_classes) && (
        <Card delay={60}>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {batch.class_days && batch.class_days.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>ক্লাসের দিন</p>
                <p className="text-xs font-semibold mt-1">{batch.class_days.join(", ")}</p>
              </div>
            )}
            {batch.class_time && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>ক্লাসের সময়</p>
                <p className="text-xs font-semibold mt-1">{batch.class_time}</p>
              </div>
            )}
            {batch.weekly_hours > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>সাপ্তাহিক ঘণ্টা</p>
                <p className="text-lg font-bold mt-1" style={{ color: t.cyan }}>{batch.weekly_hours}</p>
              </div>
            )}
            {batch.total_classes > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>মোট ক্লাস</p>
                <p className="text-lg font-bold mt-1" style={{ color: t.emerald }}>{batch.total_classes}</p>
              </div>
            )}
            {batch.total_hours > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>মোট ঘণ্টা</p>
                <p className="text-lg font-bold mt-1" style={{ color: t.purple }}>{batch.total_hours}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.inputBg }}>
        {[
          { key: "students", label: "👨‍🎓 স্টুডেন্ট", count: bStudents.length },
          { key: "attendance", label: "📅 উপস্থিতি", count: null },
          { key: "tests", label: "📝 ক্লাস টেস্ট", count: bTests.length },
          { key: "exams", label: "🏆 JLPT/NAT", count: bStudents.filter(s => s.jlptStatus === "Passed").length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
            style={{ background: activeTab === tab.key ? (t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#fff") : "transparent", color: activeTab === tab.key ? t.text : t.muted, boxShadow: activeTab === tab.key && t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}{tab.count !== null ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>

      {/* ── Students tab ── */}
      {activeTab === "students" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: t.textSecondary }}>{bStudents.length} জন স্টুডেন্ট</p>
            <Button icon={Plus} size="xs" onClick={() => setShowEnroll(v => !v)}>স্টুডেন্ট যোগ করুন</Button>
          </div>

          {showEnroll && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <Search size={13} style={{ color: t.muted }} />
                <input value={enrollSearch} onChange={e => setEnrollSearch(e.target.value)} className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder="স্টুডেন্ট খুঁজুন..." autoFocus />
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {enrollablStudents.length === 0 && <p className="text-xs text-center py-3" style={{ color: t.muted }}>কোনো স্টুডেন্ট পাওয়া যায়নি</p>}
                {enrollablStudents.map(s => (
                  <button key={s.id} onClick={() => enroll(s)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${t.cyan}15`, color: t.cyan }}>{s.name_en[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{s.name_en}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{s.id} • {s.status}</p>
                    </div>
                    <Plus size={13} style={{ color: t.emerald }} />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowEnroll(false)} className="mt-2 text-[10px] w-full text-center" style={{ color: t.muted }}>বন্ধ করুন</button>
            </div>
          )}

          {bStudents.length === 0 ? <EmptyState icon={Users} title="এই ব্যাচে কোনো স্টুডেন্ট নেই" subtitle="উপরের বাটন থেকে স্টুডেন্ট যোগ করুন" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["স্টুডেন্ট","উপস্থিতি","শেষ টেস্ট","পরীক্ষা","লেভেল","স্কোর","স্ট্যাটাস"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bStudents.map(bs => {
                    const ac = bs.attendance >= 85 ? t.emerald : bs.attendance >= 70 ? t.amber : t.rose;
                    const tc = bs.lastTest >= 80 ? t.emerald : bs.lastTest >= 60 ? t.amber : bs.lastTest ? t.rose : t.muted;
                    const sc = bs.jlptStatus === "Passed" ? t.emerald : bs.jlptStatus === "Preparing" ? t.amber : bs.jlptStatus === "Dropped" ? t.rose : t.muted;
                    return (
                      <tr key={bs.studentId} style={{ borderBottom: `1px solid ${t.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${t.cyan}15`, color: t.cyan }}>
                              {bs.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div><p className="font-medium">{bs.name}</p><p className="text-[9px]" style={{ color: t.muted }}>{bs.studentId}</p></div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                              <div className="h-full rounded-full" style={{ width: `${bs.attendance}%`, background: ac }} />
                            </div>
                            <span className="font-semibold" style={{ color: ac }}>{bs.attendance}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-3"><span className="font-semibold" style={{ color: tc }}>{bs.lastTest ?? "—"}</span>{bs.lastTest != null && <span style={{ color: t.muted }}>/{bTests.length > 0 ? (bTests[0].totalMarks || 100) : 100}</span>}</td>
                        <td className="py-3 px-3" style={{ color: t.textSecondary }}>{bs.examType || "—"}</td>
                        <td className="py-3 px-3">{bs.jlptLevel ? <Badge color={t.purple} size="xs">{bs.jlptLevel}</Badge> : <span style={{ color: t.muted }}>—</span>}</td>
                        <td className="py-3 px-3 font-mono">{bs.jlptScore ?? "—"}</td>
                        <td className="py-3 px-3"><Badge color={sc} size="xs">{bs.jlptStatus === "Passed" ? "পাস ✓" : bs.jlptStatus === "Preparing" ? "প্রস্তুতি" : bs.jlptStatus === "Dropped" ? "বাদ" : "শুরু হয়নি"}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ── Attendance tab ── */}
      {activeTab === "attendance" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">দৈনিক উপস্থিতি</h3>
            <div className="flex items-center gap-3">
              <DateInput value={attDate} onChange={v => setAttDate(v)} size="sm" />
              <Button icon={Save} size="xs" onClick={saveAttendance}>সংরক্ষণ</Button>
            </div>
          </div>
          {bStudents.length === 0 ? <EmptyState icon={Users} title="কোনো স্টুডেন্ট নেই" /> : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold" style={{ color: t.muted }}>
                <span className="flex-1">স্টুডেন্ট</span>
                {["P","A","L"].map(s => <span key={s} className="w-16 text-center" style={{ color: attColor[s] }}>{ATT_LABEL[s]}</span>)}
              </div>
              {bStudents.map(bs => {
                const cur = attState[bs.studentId] || "P";
                return (
                  <div key={bs.studentId} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${attColor[cur]}08`, border: `1px solid ${attColor[cur]}20` }}>
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${t.cyan}15`, color: t.cyan }}>{bs.name[0]}</div>
                      <div>
                        <p className="text-xs font-medium">{bs.name}</p>
                        <p className="text-[10px]" style={{ color: t.muted }}>{bs.studentId}</p>
                      </div>
                    </div>
                    {ATT_STATUS.map(s => (
                      <button key={s} onClick={() => setAttState(p => ({ ...p, [bs.studentId]: s }))}
                        className="w-16 py-1.5 rounded-lg text-[10px] font-bold transition"
                        style={{ background: cur === s ? attColor[s] : `${attColor[s]}15`, color: cur === s ? "#fff" : attColor[s] }}>
                        {ATT_LABEL[s]}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Tests tab ── */}
      {activeTab === "tests" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">ক্লাস টেস্ট ফলাফল</h3>
            <Button icon={showAddTest ? X : Plus} size="xs" onClick={() => { setShowAddTest(v => !v); if (showAddTest) { setEditingTest(null); setTestForm({ testName: "", date: today, totalMarks: 100 }); setTestScores({}); } }}>
              {showAddTest ? "বাতিল" : "নতুন টেস্ট"}
            </Button>
          </div>

          {/* ── টেস্ট যোগ / সম্পাদনা ফর্ম ── */}
          {showAddTest && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <p className="text-xs font-semibold mb-3">{editingTest ? "📝 টেস্ট সম্পাদনা করুন" : "📝 নতুন টেস্ট যোগ করুন"}</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>টেস্টের নাম <span style={{ color: t.rose }}>*</span></label>
                  <input value={testForm.testName} onChange={e => setTestForm(p => ({ ...p, testName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="Weekly Test 1..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>তারিখ</label>
                  <DateInput value={testForm.date} onChange={v => setTestForm(p => ({ ...p, date: v }))} size="sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সর্বোচ্চ নম্বর</label>
                  <input type="number" min="1" max="1000" value={testForm.totalMarks} onChange={e => setTestForm(p => ({ ...p, totalMarks: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is} placeholder="100" />
                </div>
              </div>

              {/* ── স্টুডেন্ট লিস্ট — নম্বর ইনপুট ── */}
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>প্রতি স্টুডেন্টের নম্বর (/{parseInt(testForm.totalMarks) || 100})</p>
              <div className="space-y-2 mb-3">
                {testStudentList.map(bs => (
                  <div key={bs.studentId} className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0" style={{ background: `${t.cyan}15`, color: t.cyan }}>
                      {bs.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{bs.name}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{bs.studentId}</p>
                    </div>
                    <input type="number" min="0" max={parseInt(testForm.totalMarks) || 100} value={testScores[bs.studentId] || ""}
                      onChange={e => setTestScores(p => ({ ...p, [bs.studentId]: e.target.value }))}
                      className="w-20 px-2 py-1.5 rounded-lg text-xs text-center outline-none" style={is} placeholder="—" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button icon={Save} size="xs" onClick={saveTest}>{editingTest ? "আপডেট করুন" : "সংরক্ষণ করুন"}</Button>
              </div>
            </div>
          )}

          {/* ── টেস্ট তালিকা — প্রতিটি expandable ── */}
          {bTests.length === 0 && !showAddTest && <EmptyState icon={FileText} title="কোনো ক্লাস টেস্ট নেই" subtitle="উপরের বাটন থেকে নতুন টেস্ট যোগ করুন" />}
          <div className="space-y-2">
            {bTests.map((test, i) => {
              const tm = test.totalMarks || 100;
              const isExpanded = expandedTest === test.id;
              const scoreEntries = test.scores && typeof test.scores === "object" ? Object.entries(test.scores) : [];
              return (
                <div key={test.id || i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
                  {/* টেস্ট header — click করলে expand */}
                  <div className="flex items-center gap-3 p-3 cursor-pointer transition"
                    onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm shrink-0" style={{ background: `${t.purple}15` }}>📝</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{test.testName}</p>
                      <p className="text-[10px]" style={{ color: t.muted }}>{formatDateDisplay(test.date)} • সর্বোচ্চ: {tm} • {scoreEntries.length} জন</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-lg font-bold" style={{ color: test.avgScore >= tm * 0.7 ? t.emerald : test.avgScore >= tm * 0.4 ? t.amber : t.rose }}>{test.avgScore}</p>
                      <p className="text-[9px]" style={{ color: t.muted }}>গড় /{tm}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); startEditTest(test); }} className="p-1.5 rounded-lg transition" title="সম্পাদনা"
                      style={{ color: t.muted }} onMouseEnter={e => { e.currentTarget.style.color = t.cyan; }}
                      onMouseLeave={e => { e.currentTarget.style.color = t.muted; }}>
                      <Edit3 size={13} />
                    </button>
                    {isExpanded ? <ChevronUp size={14} style={{ color: t.muted }} /> : <ChevronDown size={14} style={{ color: t.muted }} />}
                  </div>

                  {/* expanded — student scores list */}
                  {isExpanded && (
                    <div className="px-3 pb-3" style={{ borderTop: `1px solid ${t.border}` }}>
                      <div className="space-y-1.5 mt-2">
                        {scoreEntries.length === 0 && <p className="text-xs text-center py-2" style={{ color: t.muted }}>কোনো স্কোর নেই</p>}
                        {scoreEntries.map(([sid, score]) => {
                          const st = bStudents.find(s => s.studentId === sid);
                          const sc = parseInt(score) || 0;
                          const pct = tm > 0 ? (sc / tm) * 100 : 0;
                          const clr = pct >= 70 ? t.emerald : pct >= 40 ? t.amber : t.rose;
                          return (
                            <div key={sid} className="flex items-center gap-3 p-2 rounded-lg transition"
                              onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                                style={{ background: `${clr}15`, color: clr }}>
                                {st ? st.name.split(" ").map(n => n[0]).join("").slice(0, 2) : "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{st?.name || sid}</p>
                                <p className="text-[10px]" style={{ color: t.muted }}>{sid}</p>
                              </div>
                              {/* প্রগ্রেস বার */}
                              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: `${t.muted}20` }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: clr }} />
                              </div>
                              <p className="text-sm font-bold w-16 text-right" style={{ color: clr }}>{sc}<span className="text-[10px] font-normal" style={{ color: t.muted }}>/{tm}</span></p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── চার্ট — একাধিক টেস্ট থাকলে ── */}
          {bTests.length > 1 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>স্কোর ট্রেন্ড</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={bTests}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                  <XAxis dataKey="testName" tick={{ fill: t.chartAxisTick, fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: t.chartAxisTick, fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, Math.max(...bTests.map(t => t.totalMarks || 100))]} />
                  <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8, fontSize: 12, color: t.text }} />
                  <Bar dataKey="avgScore" fill={t.cyan} radius={[6,6,0,0]} barSize={32} name="গড় স্কোর" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* ── Exams tab ── */}
      {activeTab === "exams" && (
        <Card delay={100}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">জেএলপিটি / এনএটি / জেপিটি ফলাফল</h3>
            <Button icon={showExamForm ? X : Plus} size="xs" onClick={() => {
              if (!showExamForm) {
                // বিদ্যমান exam data pre-fill করো
                const updates = {};
                bStudents.forEach(s => {
                  if (s.jlptScore || s.jlptStatus !== "Preparing") {
                    updates[s.studentId] = { score: s.jlptScore ? String(s.jlptScore) : "", result: s.jlptStatus || "Preparing" };
                  }
                });
                setExamUpdates(updates);
                // প্রথম student-এর exam data থেকে form pre-fill
                const first = bStudents.find(s => s.examType);
                if (first) setExamForm(p => ({ ...p, examType: first.examType || "JLPT", level: first.jlptLevel || "N5" }));
              }
              setShowExamForm(v => !v);
            }}>
              {showExamForm ? "বাতিল" : "ফলাফল এন্ট্রি / আপডেট"}
            </Button>
          </div>

          {showExamForm && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরীক্ষার ধরন</label>
                  <select value={examForm.examType} onChange={e => setExamForm(p => ({ ...p, examType: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                    {["JLPT","JFT","NAT","JPT","JLCT","TopJ","Other"].map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>লেভেল</label>
                  <select value={examForm.level} onChange={e => setExamForm(p => ({ ...p, level: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={is}>
                    {["N5","N4","N3","N2","N1","A2","B1","A","B","C","Other"].map(x => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>পরীক্ষার তারিখ</label>
                  <DateInput value={examForm.date} onChange={v => setExamForm(p => ({ ...p, date: v }))} size="sm" />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: t.muted }}>প্রতি স্টুডেন্টের স্কোর ও ফলাফল</p>
              <div className="space-y-2 mb-3">
                {bStudents.map(bs => (
                  <div key={bs.studentId} className="flex items-center gap-3">
                    <span className="text-xs flex-1">{bs.name}</span>
                    <input type="number" placeholder="স্কোর" value={examUpdates[bs.studentId]?.score || ""} onChange={e => setExamUpdates(p => ({ ...p, [bs.studentId]: { ...p[bs.studentId], score: e.target.value } }))}
                      className="w-20 px-2 py-1.5 rounded-lg text-xs text-center outline-none" style={is} />
                    <select value={examUpdates[bs.studentId]?.result || "Preparing"} onChange={e => setExamUpdates(p => ({ ...p, [bs.studentId]: { ...p[bs.studentId], result: e.target.value } }))}
                      className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                      <option value="Passed">পাস</option>
                      <option value="Failed">ফেল</option>
                      <option value="Preparing">প্রস্তুতি</option>
                      <option value="Not Taken">দেয়নি</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button icon={Save} size="xs" onClick={saveExamResults}>ফলাফল সংরক্ষণ</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {bStudents.map(bs => {
              const sc = bs.jlptStatus === "Passed" ? t.emerald : bs.jlptStatus === "Preparing" ? t.amber : bs.jlptStatus === "Dropped" ? t.rose : t.muted;
              return (
                <div key={bs.studentId} className="flex items-center gap-4 p-3 rounded-xl transition"
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: `${sc}15`, color: sc }}>
                    {bs.jlptStatus === "Passed" ? "✓" : bs.jlptStatus === "Preparing" ? "⏳" : "—"}
                  </div>
                  <div className="flex-1"><p className="text-xs font-medium">{bs.name}</p><p className="text-[10px]" style={{ color: t.muted }}>{bs.studentId}</p></div>
                  <div className="text-center"><p className="text-[9px] uppercase" style={{ color: t.muted }}>পরীক্ষা</p><p className="text-xs font-semibold">{bs.examType || "—"}</p></div>
                  <div className="text-center"><p className="text-[9px] uppercase" style={{ color: t.muted }}>লেভেল</p><p className="text-xs font-semibold">{bs.jlptLevel || "—"}</p></div>
                  <div className="text-center"><p className="text-[9px] uppercase" style={{ color: t.muted }}>স্কোর</p><p className="text-xs font-bold" style={{ color: bs.jlptScore >= 120 ? t.emerald : bs.jlptScore ? t.amber : t.muted }}>{bs.jlptScore ?? "—"}</p></div>
                  <Badge color={sc} size="xs">{bs.jlptStatus === "Passed" ? "পাস ✓" : bs.jlptStatus === "Preparing" ? "প্রস্তুতি" : bs.jlptStatus === "Dropped" ? "বাদ" : "শুরু হয়নি"}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
