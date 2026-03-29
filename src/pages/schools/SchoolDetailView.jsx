import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Plus, Save, X, Download, Search, Users, AlertTriangle, CheckCircle, Clock, Send } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { SUB_STATUS } from "../../data/mockData";
import { api } from "../../hooks/useAPI";

import { API_URL } from "../../lib/api";
const token = () => localStorage.getItem("agencyos_token");

// Interview List-এ available columns — user select/deselect করবে
const INTERVIEW_COLUMNS = [
  { key: "no", label: "ক্রমিক" },
  { key: "family_name", label: "পদবি" },
  { key: "given_name", label: "নাম" },
  { key: "full_name", label: "পুরো নাম" },
  { key: "gender", label: "লিঙ্গ" },
  { key: "dob_age", label: "জন্ম তারিখ (বয়স)" },
  { key: "nationality", label: "জাতীয়তা" },
  { key: "education", label: "শিক্ষাগত যোগ্যতা" },
  { key: "gpa", label: "জিপিএ" },
  { key: "jp_level", label: "জেপি লেভেল/স্কোর" },
  { key: "jp_study_hours", label: "জেপি অধ্যয়ন ঘণ্টা" },
  { key: "occupation", label: "পেশা" },
  { key: "past_visa", label: "পূর্ববর্তী ভিসা/ইমিগ্রেশন" },
  { key: "sponsor", label: "স্পন্সর (আয়)" },
  { key: "sponsor_relation", label: "স্পন্সর সম্পর্ক" },
  { key: "passport_no", label: "পাসপোর্ট নং" },
  { key: "phone", label: "ফোন" },
  { key: "email", label: "ইমেইল" },
  { key: "address", label: "ঠিকানা" },
  { key: "intended_semester", label: "ইনটেক সেমিস্টার" },
  { key: "coe_applied", label: "COE আবেদন?" },
  { key: "textbook_lesson", label: "পাঠ্যবইয়ের পাঠ" },
  { key: "goal", label: "গ্র্যাজুয়েশনের পর লক্ষ্য" },
];

const DEFAULT_COLS = ["no", "family_name", "given_name", "gender", "dob_age", "education", "gpa", "jp_level", "sponsor", "sponsor_relation"];

export default function SchoolDetailView({ school, students, onBack }) {
  const t = useTheme();
  const toast = useToast();
  const [subs, setSubs] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ studentId: "", status: "submitted", submissionNo: "", intake: "" });
  const [showFeedbackForm, setShowFeedbackForm] = useState(null); // submission id
  const [feedbackForm, setFeedbackForm] = useState({ doc: "", issue: "", severity: "warning" });
  const schoolStudents = (students || []).filter((s) => s.school === school.name_en || subs.some((sub) => sub.student_id === s.id));

  // Load submissions from API
  useEffect(() => {
    api.get(`/submissions?school_id=${school.id}`).then(data => {
      if (Array.isArray(data)) setSubs(data);
    }).catch(() => {});
  }, [school.id]);
  const countryColor = school.country === "Japan" ? t.rose : school.country === "Germany" ? t.amber : t.cyan;
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // ── Active section: interview | resume | null ──
  const [activeSection, setActiveSection] = useState(null);


  // ── Interview List state ──
  const showInterviewList = activeSection === "interview";
  const [selectedForInterview, setSelectedForInterview] = useState([]);
  const [interviewFormat, setInterviewFormat] = useState("row");
  const [agencyName, setAgencyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [interviewSearch, setInterviewSearch] = useState("");
  const [staffName, setStaffName] = useState("");
  const [interviewCols, setInterviewCols] = useState(DEFAULT_COLS);

  const allStudents = (students || []).filter(s => !["VISITOR", "FOLLOW_UP", "CANCELLED"].includes(s.status));
  const interviewFiltered = interviewSearch
    ? allStudents.filter(s => (s.name_en || "").toLowerCase().includes(interviewSearch.toLowerCase()) || s.id.toLowerCase().includes(interviewSearch.toLowerCase()))
    : allStudents;

  // Generate interview list
  const generateInterviewList = async () => {
    if (selectedForInterview.length === 0) { toast.error("কমপক্ষে ১ জন স্টুডেন্ট সিলেক্ট করুন"); return; }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/schools/${school.id}/interview-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ student_ids: selectedForInterview, format: interviewFormat, agency_name: agencyName, staff_name: staffName, columns: interviewCols }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const blob = await res.blob();
      Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `Interview_List_${school.name_en}_${selectedForInterview.length}students.xlsx`
      }).click();
      toast.exported(`Interview List — ${selectedForInterview.length} জন`);
    } catch (err) { toast.error(err.message); }
    setGenerating(false);
  };

  // Status config
  const STATUS_CONFIG = {
    submitted: { label: "সাবমিট", color: t.cyan, icon: Send },
    under_review: { label: "রিভিউ চলছে", color: t.amber, icon: Clock },
    issues_found: { label: "সমস্যা পাওয়া", color: t.rose, icon: AlertTriangle },
    resubmitted: { label: "পুনরায় সাবমিট", color: t.purple, icon: Send },
    accepted: { label: "গৃহীত", color: t.emerald, icon: CheckCircle },
    interview_scheduled: { label: "ইন্টারভিউ", color: t.amber, icon: Clock },
    coe_received: { label: "COE পেয়েছে", color: t.emerald, icon: CheckCircle },
    rejected: { label: "প্রত্যাখ্যাত", color: t.rose, icon: X },
  };

  // Status change via API
  const changeStatus = async (subId, newStatus) => {
    try {
      const updated = await api.patch(`/submissions/${subId}`, { status: newStatus });
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, ...updated } : s));
      toast.success(`Status → ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch (err) { toast.error(err.message); }
  };

  // Add submission via API
  const addSubmission = async () => {
    if (!addForm.studentId) { toast.error("স্টুডেন্ট সিলেক্ট করুন"); return; }
    try {
      const saved = await api.post("/submissions", {
        school_id: school.id,
        student_id: addForm.studentId,
        submission_number: parseInt(addForm.submissionNo) || (subs.filter(s => s.student_id === addForm.studentId).length + 1),
        intake: addForm.intake || "",
        status: addForm.status || "submitted",
      });
      setSubs(prev => [saved, ...prev]);
      setShowAddForm(false);
      setAddForm({ studentId: "", status: "submitted", submissionNo: "", intake: "" });
      toast.success("সাবমিশন যোগ হয়েছে");
    } catch (err) { toast.error(err.message); }
  };

  // Add feedback (recheck issue)
  const addFeedback = async (subId) => {
    if (!feedbackForm.doc || !feedbackForm.issue) { toast.error("ডকুমেন্ট ও সমস্যা লিখুন"); return; }
    try {
      const updated = await api.post(`/submissions/${subId}/feedback`, feedbackForm);
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, ...updated } : s));
      setShowFeedbackForm(null);
      setFeedbackForm({ doc: "", issue: "", severity: "warning" });
      toast.success("রিচেক সমস্যা যোগ হয়েছে");
    } catch (err) { toast.error(err.message); }
  };

  // Resolve feedback
  const resolveFeedback = async (subId, fbIdx) => {
    try {
      const updated = await api.patch(`/submissions/${subId}/feedback/${fbIdx}/resolve`, {});
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, ...updated } : s));
      toast.success("সমস্যা সমাধান হয়েছে!");
    } catch (err) { toast.error(err.message); }
  };

  // KPI calculations
  const totalSubs = subs.length;
  const issuesSubs = subs.filter(s => s.status === "issues_found").length;
  const acceptedSubs = subs.filter(s => ["accepted", "coe_received"].includes(s.status)).length;
  const pendingRechecks = subs.reduce((sum, s) => sum + (s.feedback || []).filter(f => !f.resolved).length, 0);

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl transition flex items-center gap-1 text-xs font-medium"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
          onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
          onMouseLeave={e => e.currentTarget.style.background = t.inputBg}>
          <ArrowLeft size={16} /> <span className="hidden sm:inline">ফিরুন</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{school.name_en}</h2>
            <Badge color={countryColor}>{school.country}</Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{school.name_jp} • {school.city}</p>
        </div>
        <Button icon={Users} size="xs" variant={activeSection === "interview" ? "default" : "ghost"} onClick={() => setActiveSection(activeSection === "interview" ? null : "interview")}>
          ইন্টারভিউ তালিকা
        </Button>
      </div>

      {/* ══════════ INTERVIEW LIST GENERATOR ══════════ */}
      {showInterviewList && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> ইন্টারভিউ স্টুডেন্ট তালিকা — {school.name_en}</h3>
            <div className="flex items-center gap-2">
              <select value={interviewFormat} onChange={e => setInterviewFormat(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
                <option value="row">Row-wise (প্রতি স্টুডেন্ট এক row)</option>
                <option value="column">Column-wise (প্রতি স্টুডেন্ট এক column)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>এজেন্সি নাম</label>
              <input value={agencyName} onChange={e => setAgencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Your Agency Name" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টাফ নাম (লিংকস্টাফ)</label>
              <input value={staffName} onChange={e => setStaffName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="担当者名" />
            </div>
          </div>

          {/* Column selection */}
          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>কোন কোন column দরকার (click করে select/deselect)</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERVIEW_COLUMNS.map(col => {
                const selected = interviewCols.includes(col.key);
                return (
                  <button key={col.key} onClick={() => setInterviewCols(prev =>
                    selected ? prev.filter(k => k !== col.key) : [...prev, col.key]
                  )} className="px-2 py-1 rounded text-[10px] transition"
                  style={{
                    background: selected ? `${t.cyan}15` : t.inputBg,
                    border: `1px solid ${selected ? t.cyan : t.inputBorder}`,
                    color: selected ? t.cyan : t.muted,
                  }}>
                    {selected ? "✓ " : ""}{col.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={interviewSearch} onChange={e => setInterviewSearch(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }} placeholder="স্টুডেন্ট খুঁজুন..." />
            </div>
            <button onClick={() => setSelectedForInterview(
              selectedForInterview.length === interviewFiltered.length ? [] : interviewFiltered.map(s => s.id)
            )} className="text-[10px] px-3 py-2 rounded-lg" style={{ color: t.cyan, background: `${t.cyan}10` }}>
              {selectedForInterview.length === interviewFiltered.length ? "সব বাদ দিন" : "সব নির্বাচন"}
            </button>
          </div>

          <div className="space-y-1 max-h-[250px] overflow-y-auto mb-3">
            {interviewFiltered.map(s => (
              <div key={s.id} onClick={() => setSelectedForInterview(prev =>
                prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
              )} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition"
                style={{ background: selectedForInterview.includes(s.id) ? `${t.cyan}10` : "transparent" }}>
                <div className="w-4 h-4 rounded border flex items-center justify-center text-[10px]"
                  style={{ borderColor: selectedForInterview.includes(s.id) ? t.cyan : t.muted, background: selectedForInterview.includes(s.id) ? t.cyan : "transparent", color: "#fff" }}>
                  {selectedForInterview.includes(s.id) && "✓"}
                </div>
                <div className="flex-1"><p className="text-xs font-medium">{s.name_en}</p><p className="text-[10px]" style={{ color: t.muted }}>{s.id} • {s.batch || "—"}</p></div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
            <p className="text-xs" style={{ color: t.muted }}>সিলেক্টেড: <strong style={{ color: t.text }}>{selectedForInterview.length}</strong> জন</p>
            <Button icon={Download} onClick={generateInterviewList} disabled={generating || !selectedForInterview.length}>
              {generating ? "তৈরি হচ্ছে..." : `.xlsx ডাউনলোড (${interviewFormat})`}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card delay={50}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>স্কুল তথ্য</h4>
          <div className="space-y-2.5">
            {[
              { label: "ঠিকানা", value: school.address },
              { label: "যোগাযোগ", value: school.contact },
              { label: "ওয়েবসাইট", value: school.website },
              { label: "শোকাই ফি/জন", value: school.shoukai_fee ? `¥${Number(school.shoukai_fee).toLocaleString()}` : "N/A" },
              { label: "ন্যূনতম JP লেভেল", value: school.min_jp_level || "—" },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-xs">
                <span style={{ color: t.muted }}>{f.label}</span>
                <span className="font-medium text-right max-w-[60%]">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card delay={100}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>পরিসংখ্যান</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "মোট রেফার", value: school.studentsReferred || schoolStudents.length, color: t.cyan },
              { label: "পৌঁছেছে", value: school.studentsArrived || 0, color: t.emerald },
              { label: "সাবমিশন", value: subs.length, color: t.purple },
              { label: "গৃহীত", value: subs.filter((s) => ["accepted", "forwarded_immigration", "coe_received"].includes(s.status)).length, color: t.emerald },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: `${s.color}08` }}>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px]" style={{ color: t.muted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ SUBMISSION KPI ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "মোট সাবমিশন", value: totalSubs, color: t.cyan },
          { label: "গৃহীত", value: acceptedSubs, color: t.emerald },
          { label: "সমস্যা আছে", value: issuesSubs, color: t.rose },
          { label: "রিচেক বাকি", value: pendingRechecks, color: t.amber },
        ].map((kpi, i) => (
          <Card key={i} delay={150 + i * 30}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* ═══ SUBMISSIONS LIST ═══ */}
      <Card delay={250}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">সাবমিশন ইতিহাস</h3>
          <Button icon={Plus} size="xs" onClick={() => setShowAddForm(true)}>নতুন সাবমিশন</Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>স্টুডেন্ট <span className="req-star">*</span></label>
                <select value={addForm.studentId} onChange={e => setAddForm(p => ({ ...p, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="">— বাছুন —</option>
                  {(students || []).filter(s => !["VISITOR", "CANCELLED"].includes(s.status)).map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>ইনটেক</label>
                <select value={addForm.intake} onChange={e => setAddForm(p => ({ ...p, intake: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="">—</option><option>April 2026</option><option>July 2026</option><option>October 2026</option><option>January 2027</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>সাবমিশন #</label>
                <input type="number" value={addForm.submissionNo} onChange={e => setAddForm(p => ({ ...p, submissionNo: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="1" />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="xs" icon={X} onClick={() => setShowAddForm(false)}>বাতিল</Button>
                <Button icon={Save} size="xs" onClick={addSubmission}>যোগ</Button>
              </div>
            </div>
          </div>
        )}

        {/* Submissions list */}
        {subs.length === 0 ? <EmptyState icon={FileText} title="কোনো সাবমিশন নেই" subtitle="উপরে নতুন সাবমিশন যোগ করুন" /> : (
          <div className="space-y-3">
            {subs.map(sub => {
              const st = STATUS_CONFIG[sub.status] || STATUS_CONFIG.submitted;
              const StIcon = st.icon;
              const feedbacks = sub.feedback || [];
              const unresolvedCount = feedbacks.filter(f => !f.resolved).length;

              return (
                <div key={sub.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${unresolvedCount > 0 ? t.rose + "40" : t.border}` }}>
                  {/* Main row */}
                  <div className="flex items-center gap-4 p-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${st.color}15` }}>
                      <StIcon size={14} style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{sub.students?.name_en || sub.student_id}</p>
                        <span className="text-[10px] font-mono" style={{ color: t.cyan }}>#{sub.submission_number || 1}</span>
                        {sub.intake && <span className="text-[10px]" style={{ color: t.muted }}>{sub.intake}</span>}
                      </div>
                      <p className="text-[10px]" style={{ color: t.muted }}>{sub.submission_date || "—"}{sub.recheck_count > 0 ? ` • ${sub.recheck_count}x রিচেক` : ""}</p>
                    </div>

                    {/* Status dropdown */}
                    <select value={sub.status} onChange={e => changeStatus(sub.id, e.target.value)}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium outline-none"
                      style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>

                    {unresolvedCount > 0 && <Badge color={t.rose} size="xs">{unresolvedCount} সমস্যা</Badge>}

                    <button onClick={() => setShowFeedbackForm(showFeedbackForm === sub.id ? null : sub.id)}
                      className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.amber, background: `${t.amber}10` }}>
                      + সমস্যা
                    </button>
                  </div>

                  {/* Feedback form */}
                  {showFeedbackForm === sub.id && (
                    <div className="px-3 pb-3">
                      <div className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <input value={feedbackForm.doc} onChange={e => setFeedbackForm(p => ({ ...p, doc: e.target.value }))}
                            className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="ডকুমেন্ট নাম (যেমন: জন্ম সনদ)" />
                          <input value={feedbackForm.issue} onChange={e => setFeedbackForm(p => ({ ...p, issue: e.target.value }))}
                            className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder="সমস্যা কী?" />
                          <div className="flex gap-2">
                            <select value={feedbackForm.severity} onChange={e => setFeedbackForm(p => ({ ...p, severity: e.target.value }))}
                              className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                              <option value="warning">⚠ সতর্কতা</option><option value="error">🔴 ত্রুটি</option>
                            </select>
                            <Button size="xs" onClick={() => addFeedback(sub.id)}>যোগ</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feedback list */}
                  {feedbacks.length > 0 && (
                    <div className="px-3 pb-3 space-y-1">
                      {feedbacks.map((fb, fbIdx) => (
                        <div key={fbIdx} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                          style={{ background: fb.resolved ? `${t.emerald}08` : `${fb.severity === "error" ? t.rose : t.amber}08` }}>
                          <span>{fb.resolved ? "✅" : fb.severity === "error" ? "🔴" : "⚠️"}</span>
                          <span className="font-medium" style={{ color: fb.resolved ? t.emerald : fb.severity === "error" ? t.rose : t.amber }}>{fb.doc}</span>
                          <span className="flex-1" style={{ color: t.textSecondary }}>{fb.issue}</span>
                          <span className="text-[9px]" style={{ color: t.muted }}>{fb.date}</span>
                          {!fb.resolved && (
                            <button onClick={() => resolveFeedback(sub.id, fbIdx)}
                              className="text-[10px] px-2 py-0.5 rounded" style={{ color: t.emerald, background: `${t.emerald}10` }}>
                              সমাধান
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
