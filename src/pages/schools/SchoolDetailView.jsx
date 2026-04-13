import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, FileText, Plus, Save, X, Download, Search, Users, AlertTriangle, CheckCircle, Clock, Send, Filter, Star } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import Modal from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { SUB_STATUS } from "../../data/mockData";
import { JAPAN_REGIONS, JP_LEVEL_RANK, EDUCATION_RANK, INTAKE_MONTHS } from "../../data/japanRegions";
import { api } from "../../hooks/useAPI";

import { API_URL } from "../../lib/api";
import { formatDateDisplay } from "../../components/ui/DateInput";
const token = () => localStorage.getItem("agencyos_token");

// Interview List-এ available columns — user select/deselect করবে
// labelKey ব্যবহার করা হয়েছে — component-এর ভিতরে tr() দিয়ে resolve হবে
const INTERVIEW_COLUMNS = [
  { key: "no", labelKey: "schools.col.serial" },
  { key: "family_name", labelKey: "schools.col.familyName" },
  { key: "given_name", labelKey: "schools.col.givenName" },
  { key: "full_name", labelKey: "schools.col.fullName" },
  { key: "gender", labelKey: "schools.col.gender" },
  { key: "dob_age", labelKey: "schools.col.dobAge" },
  { key: "nationality", labelKey: "schools.col.nationality" },
  { key: "education", labelKey: "schools.col.education" },
  { key: "gpa", labelKey: "schools.col.gpa" },
  { key: "jp_level", labelKey: "schools.col.jpLevel" },
  { key: "jp_study_hours", labelKey: "schools.col.jpStudyHours" },
  { key: "occupation", labelKey: "schools.col.occupation" },
  { key: "past_visa", labelKey: "schools.col.pastVisa" },
  { key: "sponsor", labelKey: "schools.col.sponsor" },
  { key: "sponsor_relation", labelKey: "schools.col.sponsorRelation" },
  { key: "passport_no", labelKey: "schools.col.passportNo" },
  { key: "phone", labelKey: "common.phone" },
  { key: "email", labelKey: "common.email" },
  { key: "address", labelKey: "common.address" },
  { key: "intended_semester", labelKey: "schools.col.intakeSemester" },
  { key: "coe_applied", labelKey: "schools.col.coeApplied" },
  { key: "textbook_lesson", labelKey: "schools.col.textbookLesson" },
  { key: "goal", labelKey: "schools.col.goal" },
];

const DEFAULT_COLS = ["no", "family_name", "given_name", "gender", "dob_age", "education", "gpa", "jp_level", "sponsor", "sponsor_relation"];

export default function SchoolDetailView({ school, students, onBack }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
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
    }).catch((err) => { console.error("[Submissions Load]", err); toast.error(tr("schools.submissionLoadError")); });
  }, [school.id]);
  const countryColor = school.country === "Japan" ? t.rose : school.country === "Germany" ? t.amber : t.cyan;
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  // ── Active section: interview | eligible | null ──
  const [activeSection, setActiveSection] = useState(null);

  // ── Eligible Students (Smart Matching) state ──
  const [eligibleIntake, setEligibleIntake] = useState(""); // কোন intake-এর requirements দিয়ে filter
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [addingStudentId, setAddingStudentId] = useState(null); // submission তৈরি হচ্ছে

  // ── Match Data — education + JP exam data bulk fetch (eligible section open হলে) ──
  const [matchData, setMatchData] = useState({ education: [], jp_exams: [], loaded: false });
  useEffect(() => {
    if (activeSection !== "eligible") return;
    if (matchData.loaded) return;
    // সব student-এর education ও JP exam data একবারে আনো
    api.get("/students/match-data").then(data => {
      if (data) setMatchData({ education: data.education || [], jp_exams: data.jp_exams || [], loaded: true });
    }).catch(() => {});
  }, [activeSection]);

  // ── Student-এ match data merge করো (education, jp_exams) ──
  const enrichedStudents = useMemo(() => {
    if (!matchData.loaded) return students || [];
    // student_id → education/jp_exams map তৈরি
    const eduMap = {};
    (matchData.education || []).forEach(e => {
      if (!eduMap[e.student_id]) eduMap[e.student_id] = [];
      eduMap[e.student_id].push(e);
    });
    const jpMap = {};
    (matchData.jp_exams || []).forEach(j => {
      if (!jpMap[j.student_id]) jpMap[j.student_id] = [];
      jpMap[j.student_id].push(j);
    });
    return (students || []).map(s => ({
      ...s,
      student_education: eduMap[s.id] || s.student_education || [],
      student_jp_exams: jpMap[s.id] || s.student_jp_exams || [],
    }));
  }, [students, matchData]);

  // ── Smart Matching — intake requirements অনুযায়ী student eligibility check ──
  const intakeReqs = useMemo(() => {
    const reqs = school.intake_requirements || [];
    if (typeof reqs === "string") try { return JSON.parse(reqs); } catch { return []; }
    return reqs;
  }, [school.intake_requirements]);

  // নির্দিষ্ট intake-এর requirement
  const activeReq = useMemo(() => {
    if (!eligibleIntake) return null;
    return intakeReqs.find(r => r.month === eligibleIntake) || null;
  }, [intakeReqs, eligibleIntake]);

  // ── Student বয়স calculate ──
  const calcAge = (dob) => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d)) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) age--;
    return age;
  };

  // ── Student-এর সর্বোচ্চ JP level বের করো (jp_exams থেকে) ──
  const getStudentJpLevel = (s) => {
    // সরাসরি student object-এ jp_level থাকতে পারে বা student_jp_exams array-তে
    const exams = s.student_jp_exams || s.jp_exams || [];
    let best = s.jp_level || "";
    let bestRank = JP_LEVEL_RANK[best] || 0;
    exams.forEach(ex => {
      const r = JP_LEVEL_RANK[ex.jp_level] || 0;
      if (r > bestRank) { bestRank = r; best = ex.jp_level; }
    });
    return { level: best, rank: bestRank };
  };

  // ── Student-এর সর্বোচ্চ education level + GPA বের করো ──
  const getStudentEducation = (s) => {
    const edu = s.student_education || s.education || [];
    let best = "";
    let bestRank = 0;
    let sscGpa = null, hscGpa = null;
    edu.forEach(e => {
      const r = EDUCATION_RANK[e.level] || 0;
      if (r > bestRank) { bestRank = r; best = e.level; }
      // SSC/HSC GPA track করো
      if (e.level === "SSC" && e.gpa) sscGpa = parseFloat(e.gpa);
      if (e.level === "HSC" && e.gpa) hscGpa = parseFloat(e.gpa);
    });
    return { level: best, rank: bestRank, sscGpa, hscGpa };
  };

  // ── Matching score calculate — কতটুকু match হয়েছে ──
  const calcMatchScore = (s, req) => {
    if (!req) return { score: 0, total: 0, details: [] };
    const details = [];
    let score = 0, total = 0;

    // JP Level check
    if (req.min_jp_level) {
      total++;
      const { level, rank } = getStudentJpLevel(s);
      const reqRank = JP_LEVEL_RANK[req.min_jp_level] || 0;
      if (rank >= reqRank) { score++; details.push({ key: "jp", ok: true, label: level || "—" }); }
      else { details.push({ key: "jp", ok: false, label: `${level || "নেই"} (${req.min_jp_level} দরকার)` }); }
    }

    // Education check
    const { level: eduLevel, rank: eduRank, sscGpa, hscGpa } = getStudentEducation(s);
    if (req.min_education) {
      total++;
      const reqRank = EDUCATION_RANK[req.min_education] || 0;
      if (eduRank >= reqRank) { score++; details.push({ key: "edu", ok: true, label: eduLevel || "—" }); }
      else { details.push({ key: "edu", ok: false, label: `${eduLevel || "নেই"} (${req.min_education} দরকার)` }); }
    }

    // SSC GPA check
    if (req.min_gpa_ssc) {
      total++;
      if (sscGpa !== null && sscGpa >= req.min_gpa_ssc) { score++; details.push({ key: "ssc", ok: true, label: `SSC ${sscGpa}` }); }
      else { details.push({ key: "ssc", ok: false, label: `SSC ${sscGpa ?? "নেই"} (${req.min_gpa_ssc} দরকার)` }); }
    }

    // HSC GPA check
    if (req.min_gpa_hsc) {
      total++;
      if (hscGpa !== null && hscGpa >= req.min_gpa_hsc) { score++; details.push({ key: "hsc", ok: true, label: `HSC ${hscGpa}` }); }
      else { details.push({ key: "hsc", ok: false, label: `HSC ${hscGpa ?? "নেই"} (${req.min_gpa_hsc} দরকার)` }); }
    }

    // Age check
    const age = calcAge(s.dob);
    if (req.min_age || req.max_age) {
      total++;
      if (age === null) {
        details.push({ key: "age", ok: false, label: "DOB নেই" });
      } else {
        const minOk = !req.min_age || age >= req.min_age;
        const maxOk = !req.max_age || age <= req.max_age;
        if (minOk && maxOk) { score++; details.push({ key: "age", ok: true, label: `${age} বছর` }); }
        else { details.push({ key: "age", ok: false, label: `${age} বছর (${req.min_age || "—"}~${req.max_age || "—"})` }); }
      }
    }

    // Region match — bonus (total-এ count করে না, কিন্তু priority দেয়)
    const regionMatch = s.preferred_region && school.region && s.preferred_region === school.region;
    const noRegionPref = !s.preferred_region; // কোনো preference নেই = সব school-এ eligible

    return { score, total, details, regionMatch, noRegionPref, age };
  };

  // ── Eligible students list — smart filter ──
  const eligibleStudents = useMemo(() => {
    // enrichedStudents ব্যবহার করো — education + JP exam data সহ
    const base = enrichedStudents.filter(s => !["VISITOR", "FOLLOW_UP", "CANCELLED", "COMPLETED", "ARRIVED"].includes(s.status));

    // Region filter — student-এর preferred_region match করলে বা preference না থাকলে eligible
    const regionFiltered = base.filter(s => {
      if (!school.region) return true;
      if (!s.preferred_region) return true;
      return s.preferred_region === school.region;
    });

    // Requirements filter
    let matched = regionFiltered;
    if (activeReq) {
      // নির্দিষ্ট intake সিলেক্ট — ঐ intake-এর requirements দিয়ে filter
      matched = regionFiltered.map(s => {
        const m = calcMatchScore(s, activeReq);
        return { ...s, _match: m };
      }).filter(s => s._match.total === 0 || s._match.score === s._match.total);
    } else if (intakeReqs.length > 0) {
      // "সব সেশন" — যেকোনো একটা intake-এর requirements পূরণ করলে eligible
      matched = regionFiltered.map(s => {
        // প্রতিটি intake-এর বিপরীতে check — সবচেয়ে ভালো match রাখো
        let bestMatch = { score: 0, total: 0, details: [] };
        let bestIntake = "";
        for (const req of intakeReqs) {
          const m = calcMatchScore(s, req);
          if (m.total === 0) continue; // কোনো requirement নেই — skip
          if (m.score === m.total) { bestMatch = m; bestIntake = req.month; break; } // full match → done
          if (m.score > bestMatch.score) { bestMatch = m; bestIntake = req.month; }
        }
        // কোনো intake-এই requirement নেই → null match (eligible)
        if (intakeReqs.every(r => calcMatchScore(s, r).total === 0)) bestMatch = { score: 0, total: 0, details: [] };
        return { ...s, _match: bestMatch, _matchIntake: bestIntake };
      }).filter(s => s._match.total === 0 || s._match.score === s._match.total);
    } else {
      // কোনো intake requirement সেট করা হয়নি — সবাই eligible
      matched = regionFiltered.map(s => ({ ...s, _match: calcMatchScore(s, null) }));
    }

    // ইতিমধ্যে এই school-এ submit হয়ে যাওয়া students বাদ
    const submittedIds = new Set(subs.map(sub => sub.student_id));
    matched = matched.filter(s => !submittedIds.has(s.id));

    // Search filter
    if (eligibleSearch) {
      const q = eligibleSearch.toLowerCase();
      matched = matched.filter(s => (s.name_en || "").toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
    }

    // Sort — region match আগে, তারপর match score
    matched.sort((a, b) => {
      const aRegion = a._match?.regionMatch ? 1 : 0;
      const bRegion = b._match?.regionMatch ? 1 : 0;
      if (aRegion !== bRegion) return bRegion - aRegion;
      return (b._match?.score || 0) - (a._match?.score || 0);
    });

    return matched;
  }, [students, school, subs, activeReq, eligibleSearch]);

  // ── Eligible student → submission হিসেবে add ──
  const addEligibleToSchool = async (studentId) => {
    setAddingStudentId(studentId);
    try {
      const saved = await api.post("/submissions", {
        school_id: school.id,
        student_id: studentId,
        submission_number: subs.filter(s => s.student_id === studentId).length + 1,
        intake: eligibleIntake || "",
        status: "submitted",
      });
      setSubs(prev => [saved, ...prev]);
      toast.success(tr("schools.submissionAdded"));
    } catch (err) { toast.error(err.message); }
    setAddingStudentId(null);
  };

  // ── Interview List state ──
  const showInterviewList = activeSection === "interview";
  const [selectedForInterview, setSelectedForInterview] = useState([]);
  const [interviewFormat, setInterviewFormat] = useState("row");
  const [agencyName, setAgencyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [interviewSearch, setInterviewSearch] = useState("");
  const [staffName, setStaffName] = useState("");
  const [adminUsers, setAdminUsers] = useState([]); // staff dropdown-এর জন্য

  // ── Agency info + admin users auto-load — interview section open হলে ──
  useEffect(() => {
    if (activeSection !== "interview") return;
    // Agency নাম auto-fill
    if (!agencyName) {
      api.get("/agency/me").then(a => { if (a?.name) setAgencyName(a.name); }).catch(() => {});
    }
    // Admin/staff users load — staff dropdown-এ দেখাবো
    if (adminUsers.length === 0) {
      api.get("/users").then(data => {
        const users = Array.isArray(data) ? data : data?.data || [];
        setAdminUsers(users);
        // Current user-কে default staff হিসেবে সেট
        if (!staffName) {
          const me = localStorage.getItem("agencyos_user");
          if (me) {
            try {
              const u = JSON.parse(me);
              setStaffName(u.name || u.display_name || "");
            } catch {}
          }
        }
      }).catch(() => {});
    }
  }, [activeSection]);
  const [interviewCols, setInterviewCols] = useState(DEFAULT_COLS);
  const [templateName, setTemplateName] = useState(school.interview_template_name || school.interview_template || "");
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [mappingHeaders, setMappingHeaders] = useState([]); // [{position, label, field}]
  const [mappingFormat, setMappingFormat] = useState("row");
  const [mappingHeaderRow, setMappingHeaderRow] = useState(3);
  const [showMapping, setShowMapping] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);

  // Student data fields — dropdown options (tr() দিয়ে localized)
  const STUDENT_FIELDS = [
    { value: "", label: tr("schools.field.mapSelect") },
    { value: "no", label: tr("schools.field.serial") },
    { value: "full_name", label: tr("schools.field.fullName") },
    { value: "family_name", label: tr("schools.field.familyName") },
    { value: "given_name", label: tr("schools.field.givenName") },
    { value: "name_bn", label: tr("schools.field.nameBn") },
    { value: "gender", label: tr("schools.field.gender") },
    { value: "gender_jp", label: tr("schools.field.genderJp") },
    { value: "dob", label: tr("schools.field.dob") },
    { value: "dob_age", label: tr("schools.field.dobAge") },
    { value: "age", label: tr("schools.field.age") },
    { value: "nationality", label: tr("schools.field.nationality") },
    { value: "education", label: tr("schools.field.education") },
    { value: "gpa", label: "GPA" },
    { value: "jp_exam_type", label: tr("schools.field.jpExamType") },
    { value: "jp_level", label: tr("schools.field.jpLevel") },
    { value: "jp_score", label: tr("schools.field.jpScore") },
    { value: "jp_study_hours", label: tr("schools.field.jpStudyHours") },
    { value: "has_jp_cert", label: tr("schools.field.hasJpCert") },
    { value: "occupation", label: tr("schools.field.occupation") },
    { value: "passport_no", label: tr("schools.field.passportNo") },
    { value: "phone", label: tr("common.phone") },
    { value: "email", label: tr("common.email") },
    { value: "address", label: tr("common.address") },
    { value: "intended_semester", label: tr("schools.field.intakeSemester") },
    { value: "sponsor", label: tr("schools.field.sponsor") },
    { value: "sponsor_relation", label: tr("schools.field.sponsorRelation") },
    { value: "sponsor_income", label: tr("schools.field.sponsorIncome") },
    { value: "sponsor_contact", label: tr("schools.field.sponsorContact") },
    { value: "coe_applied", label: tr("schools.field.coeApplied") },
    { value: "goal", label: tr("schools.field.goal") },
    { value: "goal_jp", label: tr("schools.field.goalJp") },
    { value: "past_visa", label: tr("schools.field.pastVisa") },
    { value: "agency_name", label: tr("schools.field.agencyName") },
    { value: "staff_name", label: tr("schools.field.staffName") },
    { value: "today", label: tr("schools.field.todayDate") },
  ];

  // Load saved mapping on mount
  useEffect(() => {
    if (school.interview_template) {
      fetch(`${API_URL}/schools/${school.id}/interview-mapping`, { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => r.json()).then(data => {
          if (data.mapping?.mapping) {
            setMappingHeaders(data.mapping.mapping);
            setMappingFormat(data.mapping.format || "row");
            setMappingHeaderRow(data.mapping.header_row || 3);
          }
        }).catch((err) => { console.error("[Template Load]", err); toast.error(tr("schools.templateLoadError")); });
    }
  }, [school.id, school.interview_template]);

  // ── Template upload handler ──
  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) { toast.error(tr("schools.xlsxOnly")); return; }
    setUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append("template", file);
      const res = await fetch(`${API_URL}/schools/${school.id}/interview-template`, {
        method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tr("schools.uploadFailed"));
      setTemplateName(data.template_name || data.template);
      // Row-wise headers বা column-wise labels — যেটা বেশি
      const headers = (data.row_headers?.length >= data.col_labels?.length) ? data.row_headers : data.col_labels;
      const fmt = (data.row_headers?.length >= data.col_labels?.length) ? "row" : "column";
      setMappingHeaders(headers || []);
      setMappingFormat(fmt);
      setMappingHeaderRow(data.header_row || 3);
      setShowMapping(true);
      toast.success(tr("schools.templateUploaded"));
    } catch (err) { toast.error(err.message); }
    setUploadingTemplate(false);
    e.target.value = "";
  };

  // ── Mapping save ──
  const saveMapping = async () => {
    setSavingMapping(true);
    try {
      const res = await fetch(`${API_URL}/schools/${school.id}/interview-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ mapping: mappingHeaders, format: mappingFormat, header_row: mappingHeaderRow }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(tr("schools.mappingSaved"));
      setShowMapping(false);
    } catch (err) { toast.error(err.message); }
    setSavingMapping(false);
  };

  // ── Template delete handler ──
  const handleTemplateDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/schools/${school.id}/interview-template`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || tr("errors.deleteFailed")); }
      setTemplateName("");
      toast.success(tr("schools.templateDeleted"));
    } catch (err) { toast.error(err.message); }
  };

  const allStudents = (students || []).filter(s => !["VISITOR", "FOLLOW_UP", "CANCELLED"].includes(s.status));
  const interviewFiltered = interviewSearch
    ? allStudents.filter(s => (s.name_en || "").toLowerCase().includes(interviewSearch.toLowerCase()) || s.id.toLowerCase().includes(interviewSearch.toLowerCase()))
    : allStudents;

  // Generate interview list
  const generateInterviewList = async () => {
    if (selectedForInterview.length === 0) { toast.error(tr("schools.selectAtLeastOne")); return; }
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
      toast.exported(`Interview List — ${selectedForInterview.length}`);
    } catch (err) { toast.error(err.message); }
    setGenerating(false);
  };

  // Status config — tr() দিয়ে localized
  const STATUS_CONFIG = {
    submitted: { label: tr("schools.status.submitted"), color: t.cyan, icon: Send },
    under_review: { label: tr("schools.status.underReview"), color: t.amber, icon: Clock },
    issues_found: { label: tr("schools.status.issuesFound"), color: t.rose, icon: AlertTriangle },
    resubmitted: { label: tr("schools.status.resubmitted"), color: t.purple, icon: Send },
    accepted: { label: tr("schools.status.accepted"), color: t.emerald, icon: CheckCircle },
    interview_scheduled: { label: tr("schools.status.interviewScheduled"), color: t.amber, icon: Clock },
    coe_received: { label: tr("schools.status.coeReceived"), color: t.emerald, icon: CheckCircle },
    rejected: { label: tr("schools.status.rejected"), color: t.rose, icon: X },
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
    if (!addForm.studentId) { toast.error(tr("schools.selectStudent")); return; }
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
      toast.success(tr("schools.submissionAdded"));
    } catch (err) { toast.error(err.message); }
  };

  // Add feedback (recheck issue)
  const addFeedback = async (subId) => {
    if (!feedbackForm.doc || !feedbackForm.issue) { toast.error(tr("schools.feedbackRequired")); return; }
    try {
      const updated = await api.post(`/submissions/${subId}/feedback`, feedbackForm);
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, ...updated } : s));
      setShowFeedbackForm(null);
      setFeedbackForm({ doc: "", issue: "", severity: "warning" });
      toast.success(tr("schools.feedbackAdded"));
    } catch (err) { toast.error(err.message); }
  };

  // Resolve feedback
  const resolveFeedback = async (subId, fbIdx) => {
    try {
      const updated = await api.patch(`/submissions/${subId}/feedback/${fbIdx}/resolve`, {});
      setSubs(prev => prev.map(s => s.id === subId ? { ...s, ...updated } : s));
      toast.success(tr("schools.issueResolved"));
    } catch (err) { toast.error(err.message); }
  };

  // ── Student Preview Modal — eligible student ক্লিক করলে detail দেখাবে ──
  const [previewStudent, setPreviewStudent] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const openStudentPreview = async (studentId) => {
    setPreviewLoading(true);
    setPreviewStudent(null);
    try {
      const data = await api.get(`/students/${studentId}`);
      setPreviewStudent(data);
    } catch (err) { toast.error(err.message); }
    setPreviewLoading(false);
  };

  // ── Submission delete ──
  const [deleteSubId, setDeleteSubId] = useState(null);
  const deleteSubmission = async (subId) => {
    try {
      await api.del(`/submissions/${subId}`);
      setSubs(prev => prev.filter(s => s.id !== subId));
      setDeleteSubId(null);
      toast.success(tr("schools.submissionDeleted") || "সাবমিশন মুছে ফেলা হয়েছে");
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
          <ArrowLeft size={16} /> <span className="hidden sm:inline">{tr("schools.goBack")}</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{school.name_en}</h2>
            <Badge color={countryColor}>{school.country}</Badge>
          </div>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{school.name_jp} • {school.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button icon={Filter} size="xs" variant={activeSection === "eligible" ? "default" : "ghost"} onClick={() => setActiveSection(activeSection === "eligible" ? null : "eligible")}>
            {tr("schools.eligibleStudents") || "যোগ্য স্টুডেন্ট"}
          </Button>
          <Button icon={Users} size="xs" variant={activeSection === "interview" ? "default" : "ghost"} onClick={() => setActiveSection(activeSection === "interview" ? null : "interview")}>
            {tr("schools.interviewList")}
          </Button>
        </div>
      </div>

      {/* ══════════ ELIGIBLE STUDENTS — SMART MATCHING ══════════ */}
      {activeSection === "eligible" && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Filter size={14} style={{ color: t.emerald }} />
              {tr("schools.eligibleStudents") || "যোগ্য স্টুডেন্ট"} — {school.name_en}
            </h3>
            <div className="flex items-center gap-2">
              {/* Intake select — কোন session-এর requirements দিয়ে filter */}
              <select value={eligibleIntake} onChange={e => setEligibleIntake(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
                <option value="">{tr("schools.allIntakes") || "সব সেশন"}</option>
                {(school.intakes || []).map(ik => (
                  <option key={ik.month || ik} value={ik.month || ik}>{ik.month || ik}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── এই intake-এর requirements দেখাও ── */}
          {activeReq && (
            <div className="flex flex-wrap gap-2 mb-3 p-2 rounded-xl" style={{ background: `${t.amber}08`, border: `1px solid ${t.amber}15` }}>
              <span className="text-[10px] font-bold" style={{ color: t.amber }}>
                {eligibleIntake} {tr("schools.requirements") || "রিকোয়ারমেন্ট"}:
              </span>
              {activeReq.min_jp_level && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.cyan}15`, color: t.cyan }}>JP: {activeReq.min_jp_level}+</span>}
              {activeReq.min_education && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.purple}15`, color: t.purple }}>শিক্ষা: {activeReq.min_education}+</span>}
              {activeReq.min_gpa_ssc && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.amber}15`, color: t.amber }}>SSC: {activeReq.min_gpa_ssc}+</span>}
              {activeReq.min_gpa_hsc && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.amber}15`, color: t.amber }}>HSC: {activeReq.min_gpa_hsc}+</span>}
              {(activeReq.min_age || activeReq.max_age) && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${t.emerald}15`, color: t.emerald }}>বয়স: {activeReq.min_age || "—"}~{activeReq.max_age || "—"}</span>}
            </div>
          )}
          {!activeReq && eligibleIntake && (
            <p className="text-[10px] mb-3 px-2" style={{ color: t.muted }}>
              {eligibleIntake} সেশনের জন্য কোনো রিকোয়ারমেন্ট সেট করা হয়নি — সব স্টুডেন্ট দেখানো হচ্ছে
            </p>
          )}

          {/* ── সার্চ বার ── */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={eligibleSearch} onChange={e => setEligibleSearch(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
                placeholder={tr("schools.searchStudentPlaceholder") || "নাম বা ID দিয়ে খুঁজুন..."} />
            </div>
            <span className="text-[10px] px-2" style={{ color: t.muted }}>
              {eligibleStudents.length} জন {tr("schools.eligible") || "যোগ্য"}
            </span>
          </div>

          {/* ── যোগ্য স্টুডেন্ট লিস্ট ── */}
          {eligibleStudents.length > 0 ? (
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {eligibleStudents.map(s => {
                const m = s._match || {};
                const isAdding = addingStudentId === s.id;
                return (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer"
                    style={{ background: m.regionMatch ? `${t.emerald}06` : "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = m.regionMatch ? `${t.emerald}10` : t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = m.regionMatch ? `${t.emerald}06` : "transparent"}
                    onClick={() => openStudentPreview(s.id)}>

                    {/* স্টুডেন্ট তথ্য */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium truncate">{s.name_en}</p>
                        {/* Region match badge */}
                        {m.regionMatch && (
                          <span className="text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5" style={{ background: `${t.emerald}15`, color: t.emerald }}>
                            <Star size={8} /> {s.preferred_region}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: t.muted }}>{s.id}</span>
                        {s.batch && <span className="text-[10px]" style={{ color: t.muted }}>• {s.batch}</span>}
                        {/* Match details — JP level, Education, Age ব্যাজ */}
                        {(m.details || []).map(d => (
                          <span key={d.key} className="text-[9px] px-1 py-0.5 rounded"
                            style={{ background: d.ok ? `${t.emerald}10` : `${t.rose}10`, color: d.ok ? t.emerald : t.rose }}>
                            {d.key === "jp" ? "JP" : d.key === "edu" ? "📚" : "🎂"} {d.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* + বাটন — এই স্কুলে submission হিসেবে add */}
                    <button onClick={e => { e.stopPropagation(); addEligibleToSchool(s.id); }} disabled={isAdding}
                      className="p-1.5 rounded-lg transition shrink-0"
                      style={{ background: `${t.cyan}15`, color: t.cyan }}
                      onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}25`}
                      onMouseLeave={e => e.currentTarget.style.background = `${t.cyan}15`}
                      title={tr("schools.addToSchool") || "এই স্কুলে যোগ করুন"}>
                      {isAdding ? <Clock size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={Users} message={tr("schools.noEligibleStudents") || "কোনো যোগ্য স্টুডেন্ট পাওয়া যায়নি"} />
          )}

          {/* ── Region তথ্য ── */}
          {school.region && (
            <p className="text-[9px] mt-3 pt-2" style={{ color: t.muted, borderTop: `1px solid ${t.border}` }}>
              📍 স্কুল অঞ্চল: <strong style={{ color: t.purple }}>{school.region}</strong>
              {" • "}★ চিহ্নিত স্টুডেন্টরা এই অঞ্চল পছন্দ করেছে
              {" • "}অঞ্চল preference না থাকলে সব স্কুলে eligible
            </p>
          )}
        </Card>
      )}

      {/* ══════════ INTERVIEW LIST GENERATOR ══════════ */}
      {showInterviewList && (
        <Card delay={0}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><Users size={14} /> {tr("schools.interviewStudentList")} — {school.name_en}</h3>
            <div className="flex items-center gap-2">
              <select value={interviewFormat} onChange={e => setInterviewFormat(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs outline-none" style={is}>
                <option value="row">{tr("schools.rowWise")}</option>
                <option value="column">{tr("schools.columnWise")}</option>
              </select>
            </div>
          </div>

          {/* ── টেমপ্লেট ম্যানেজমেন্ট ── */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}20` }}>
            <FileText size={16} style={{ color: t.cyan }} />
            <div className="flex-1 text-xs">
              {templateName ? (
                <span>{tr("schools.template")}: <strong style={{ color: t.cyan }}>{templateName}</strong> ({tr("schools.schoolSpecific")})</span>
              ) : (
                <span style={{ color: t.muted }}>{tr("schools.noCustomTemplate")}</span>
              )}
            </div>
            <label className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition"
              style={{ background: t.cyan, color: "#000" }}>
              {uploadingTemplate ? tr("schools.uploading") : `📎 ${tr("schools.templateUpload")}`}
              <input type="file" accept=".xlsx" onChange={handleTemplateUpload} className="hidden" disabled={uploadingTemplate} />
            </label>
            {templateName && (
              <>
                <button onClick={() => setShowMapping(!showMapping)} className="px-2 py-1.5 rounded-lg text-xs font-medium transition"
                  style={{ background: `${t.purple}20`, color: t.purple }}>
                  🔗 {tr("schools.mapping")} {showMapping ? tr("schools.mappingClose") : tr("schools.mappingView")}
                </button>
                <button onClick={handleTemplateDelete} className="px-2 py-1.5 rounded-lg text-xs transition"
                  style={{ background: `${t.rose}20`, color: t.rose }}>
                  ✕ {tr("common.delete")}
                </button>
              </>
            )}
          </div>

          {/* ── ম্যাপিং টেবিল ── */}
          {showMapping && mappingHeaders.length > 0 && (
            <div className="mb-4 p-4 rounded-xl" style={{ background: `${t.purple}08`, border: `1px solid ${t.purple}20` }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold" style={{ color: t.purple }}>🔗 {tr("schools.fieldMapping")} — {tr("schools.mappingDesc", { type: mappingFormat === "column" ? tr("schools.row") : tr("schools.column") })}</h4>
                <div className="flex items-center gap-2">
                  <select value={mappingFormat} onChange={e => setMappingFormat(e.target.value)}
                    className="px-2 py-1 rounded text-[10px] outline-none" style={is}>
                    <option value="row">Row-wise</option>
                    <option value="column">Column-wise</option>
                  </select>
                  <button onClick={saveMapping} disabled={savingMapping}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: t.emerald, color: "#000" }}>
                    {savingMapping ? tr("common.saving") : `💾 ${tr("schools.mappingSave")}`}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {mappingHeaders.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: t.inputBg }}>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${t.cyan}20`, color: t.cyan }}>
                      {mappingFormat === "column" ? `R${h.position}` : `C${h.position}`}
                    </span>
                    <span className="flex-1 text-xs truncate" title={h.label}>{h.label}</span>
                    <select value={h.field || ""} onChange={e => {
                      const updated = [...mappingHeaders];
                      updated[i] = { ...h, field: e.target.value };
                      setMappingHeaders(updated);
                    }} className="px-2 py-1 rounded text-[10px] outline-none min-w-[140px]" style={is}>
                      {STUDENT_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: t.muted }}>
                {tr("schools.mappingHint", { type: mappingFormat === "column" ? tr("schools.row") : tr("schools.column") })}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("schools.agencyName")}</label>
              <input value={agencyName} onChange={e => setAgencyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="Your Agency Name" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("schools.staffName")}</label>
              {adminUsers.length > 1 ? (
                <select value={staffName} onChange={e => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="">— {tr("schools.selectOne") || "সিলেক্ট করুন"} —</option>
                  {adminUsers.map(u => <option key={u.id} value={u.name || u.display_name}>{u.name || u.display_name} ({u.role})</option>)}
                </select>
              ) : (
                <input value={staffName} onChange={e => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="担当者名" />
              )}
            </div>
          </div>

          {/* Column selection */}
          <div className="mb-3">
            <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("schools.columnSelection")}</label>
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
                    {selected ? "✓ " : ""}{tr(col.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
              <Search size={14} style={{ color: t.muted }} />
              <input value={interviewSearch} onChange={e => setInterviewSearch(e.target.value)}
                className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }} placeholder={tr("schools.searchStudentPlaceholder")} />
            </div>
            <button onClick={() => setSelectedForInterview(
              selectedForInterview.length === interviewFiltered.length ? [] : interviewFiltered.map(s => s.id)
            )} className="text-[10px] px-3 py-2 rounded-lg" style={{ color: t.cyan, background: `${t.cyan}10` }}>
              {selectedForInterview.length === interviewFiltered.length ? tr("schools.deselectAll") : tr("common.selectAll")}
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
            <p className="text-xs" style={{ color: t.muted }}>{tr("schools.selected")}: <strong style={{ color: t.text }}>{selectedForInterview.length}</strong></p>
            <Button icon={Download} onClick={generateInterviewList} disabled={generating || !selectedForInterview.length}>
              {generating ? tr("schools.generating") : `.xlsx ${tr("common.download")} (${interviewFormat})`}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card delay={50}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>{tr("schools.schoolInfo")}</h4>
          <div className="space-y-2.5">
            {[
              { label: tr("common.address"), value: school.address },
              { label: tr("schools.contact"), value: school.contact },
              { label: tr("schools.website"), value: school.website },
              { label: tr("schools.shoukaiFeePerStudent"), value: school.shoukai_fee ? `¥${Number(school.shoukai_fee).toLocaleString()}` : "N/A" },
              { label: tr("schools.minJpLevel"), value: school.min_jp_level || "—" },
              { label: tr("schools.region") || "অঞ্চল", value: school.region || "—" },
            ].map((f) => (
              <div key={f.label} className="flex justify-between text-xs">
                <span style={{ color: t.muted }}>{f.label}</span>
                <span className="font-medium text-right max-w-[60%]">{f.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card delay={100}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.muted }}>{tr("schools.statistics")}</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: tr("schools.totalReferred"), value: school.studentsReferred || schoolStudents.length, color: t.cyan },
              { label: tr("schools.arrived"), value: school.studentsArrived || 0, color: t.emerald },
              { label: tr("schools.submissions"), value: subs.length, color: t.purple },
              { label: tr("schools.status.accepted"), value: subs.filter((s) => ["accepted", "forwarded_immigration", "coe_received"].includes(s.status)).length, color: t.emerald },
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
          { label: tr("schools.totalSubmissions"), value: totalSubs, color: t.cyan },
          { label: tr("schools.status.accepted"), value: acceptedSubs, color: t.emerald },
          { label: tr("schools.hasIssues"), value: issuesSubs, color: t.rose },
          { label: tr("schools.recheckPending"), value: pendingRechecks, color: t.amber },
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
          <h3 className="text-sm font-semibold">{tr("schools.submissionHistory")}</h3>
          <Button icon={Plus} size="xs" onClick={() => setShowAddForm(true)}>{tr("schools.newSubmission")}</Button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="mb-4 p-3 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("schools.student")} <span className="req-star">*</span></label>
                <select value={addForm.studentId} onChange={e => setAddForm(p => ({ ...p, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="">— {tr("schools.selectOne")} —</option>
                  {(students || []).filter(s => !["VISITOR", "CANCELLED"].includes(s.status)).map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("schools.intake")}</label>
                <select value={addForm.intake} onChange={e => setAddForm(p => ({ ...p, intake: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is}>
                  <option value="">—</option><option>April 2026</option><option>July 2026</option><option>October 2026</option><option>January 2027</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{tr("schools.submissions")} #</label>
                <input type="number" value={addForm.submissionNo} onChange={e => setAddForm(p => ({ ...p, submissionNo: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={is} placeholder="1" />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="xs" icon={X} onClick={() => setShowAddForm(false)}>{tr("common.cancel")}</Button>
                <Button icon={Save} size="xs" onClick={addSubmission}>{tr("common.add")}</Button>
              </div>
            </div>
          </div>
        )}

        {/* Submissions list */}
        {subs.length === 0 ? <EmptyState icon={FileText} title={tr("schools.noSubmissions")} subtitle={tr("schools.addSubmissionHint")} /> : (
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
                      <p className="text-[10px]" style={{ color: t.muted }}>{formatDateDisplay(sub.submission_date)}{sub.recheck_count > 0 ? ` • ${sub.recheck_count}x ${tr("schools.recheck")}` : ""}</p>
                    </div>

                    {/* Status dropdown */}
                    <select value={sub.status} onChange={e => changeStatus(sub.id, e.target.value)}
                      className="px-2 py-1 rounded-lg text-[10px] font-medium outline-none"
                      style={{ background: `${st.color}15`, color: st.color, border: `1px solid ${st.color}30` }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>

                    {unresolvedCount > 0 && <Badge color={t.rose} size="xs">{unresolvedCount} {tr("schools.issues")}</Badge>}

                    <button onClick={() => setShowFeedbackForm(showFeedbackForm === sub.id ? null : sub.id)}
                      className="text-[10px] px-2 py-1 rounded-lg" style={{ color: t.amber, background: `${t.amber}10` }}>
                      + {tr("schools.issue")}
                    </button>

                    {/* Delete button — inline confirm */}
                    {deleteSubId === sub.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteSubmission(sub.id)} className="text-[10px] px-2 py-1 rounded-lg font-medium"
                          style={{ background: t.rose, color: "#fff" }}>{tr("common.delete")}</button>
                        <button onClick={() => setDeleteSubId(null)} className="text-[10px] px-1 py-1" style={{ color: t.muted }}>{tr("common.no") || "না"}</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteSubId(sub.id)} className="text-[10px] px-1.5 py-1 rounded-lg transition opacity-40 hover:opacity-100"
                        style={{ color: t.rose }} title={tr("common.delete")}>
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Feedback form */}
                  {showFeedbackForm === sub.id && (
                    <div className="px-3 pb-3">
                      <div className="p-3 rounded-lg" style={{ background: t.inputBg }}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <input value={feedbackForm.doc} onChange={e => setFeedbackForm(p => ({ ...p, doc: e.target.value }))}
                            className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder={tr("schools.docNamePlaceholder")} />
                          <input value={feedbackForm.issue} onChange={e => setFeedbackForm(p => ({ ...p, issue: e.target.value }))}
                            className="px-2 py-1.5 rounded-lg text-xs outline-none" style={is} placeholder={tr("schools.issuePlaceholder")} />
                          <div className="flex gap-2">
                            <select value={feedbackForm.severity} onChange={e => setFeedbackForm(p => ({ ...p, severity: e.target.value }))}
                              className="flex-1 px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                              <option value="warning">⚠ {tr("schools.severityWarning")}</option><option value="error">🔴 {tr("schools.severityError")}</option>
                            </select>
                            <Button size="xs" onClick={() => addFeedback(sub.id)}>{tr("common.add")}</Button>
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
                          <span className="text-[9px]" style={{ color: t.muted }}>{formatDateDisplay(fb.date)}</span>
                          {!fb.resolved && (
                            <button onClick={() => resolveFeedback(sub.id, fbIdx)}
                              className="text-[10px] px-2 py-0.5 rounded" style={{ color: t.emerald, background: `${t.emerald}10` }}>
                              {tr("schools.resolve")}
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
      {/* ══════════ STUDENT PREVIEW MODAL ══════════ */}
      {(previewStudent || previewLoading) && (
        <Modal isOpen={true} title={previewStudent?.name_en || "স্টুডেন্ট ডিটেলস"} onClose={() => { setPreviewStudent(null); setPreviewLoading(false); }} size="lg">
          {previewLoading ? (
            <div className="flex items-center justify-center py-10">
              <Clock size={20} className="animate-spin" style={{ color: t.cyan }} />
              <span className="ml-2 text-xs" style={{ color: t.muted }}>লোড হচ্ছে...</span>
            </div>
          ) : previewStudent && (() => {
            const s = previewStudent;
            const edu = s.student_education || [];
            const jpExams = s.student_jp_exams || [];
            const sponsor = s.sponsor || (s.sponsors && s.sponsors[0]) || null;
            const age = s.dob ? Math.floor((Date.now() - new Date(s.dob)) / 31557600000) : null;

            // ── ফিল্ড group — label:value pairs ──
            const personalFields = [
              ["নাম", s.name_en], ["কাতাকানা", s.name_katakana], ["জন্ম তারিখ", s.dob ? `${formatDateDisplay(s.dob)}${age ? ` (${age} বছর)` : ""}` : ""],
              ["লিঙ্গ", s.gender], ["জাতীয়তা", s.nationality || "Bangladeshi"], ["রক্তের গ্রুপ", s.blood_group],
              ["ফোন", s.phone], ["ইমেইল", s.email], ["পেশা", s.occupation],
              ["বৈবাহিক অবস্থা", s.marital_status], ["জন্মস্থান", s.birth_place],
            ];
            const passportFields = [
              ["পাসপোর্ট", s.passport_number || s.passport], ["ইস্যু", formatDateDisplay(s.passport_issue)], ["মেয়াদ", formatDateDisplay(s.passport_expiry)],
              ["বাবার নাম", s.father_name_en || s.father_name], ["মায়ের নাম", s.mother_name_en || s.mother_name],
              ["স্থায়ী ঠিকানা", s.permanent_address], ["বর্তমান ঠিকানা", s.current_address],
            ];
            const destFields = [
              ["দেশ", s.country], ["স্কুল", s.school], ["ব্যাচ", s.batch], ["ইনটেক", s.intake],
              ["ভিসা টাইপ", s.visa_type], ["পছন্দের অঞ্চল", s.preferred_region], ["ব্রাঞ্চ", s.branch],
            ];

            const FieldGrid = ({ fields }) => (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5">
                {fields.filter(([, v]) => v).map(([label, val]) => (
                  <div key={label} className="flex justify-between text-[11px] py-0.5">
                    <span style={{ color: t.muted }}>{label}</span>
                    <span className="font-medium text-right ml-2 truncate max-w-[60%]">{val}</span>
                  </div>
                ))}
              </div>
            );

            return (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* ── ব্যক্তিগত তথ্য ── */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.cyan }}>ব্যক্তিগত তথ্য</h4>
                  <FieldGrid fields={personalFields} />
                </div>

                {/* ── পাসপোর্ট ও পরিবার ── */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.amber }}>পাসপোর্ট ও পরিবার</h4>
                  <FieldGrid fields={passportFields} />
                </div>

                {/* ── গন্তব্য তথ্য ── */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.emerald }}>গন্তব্য তথ্য</h4>
                  <FieldGrid fields={destFields} />
                </div>

                {/* ── শিক্ষাগত যোগ্যতা ── */}
                {edu.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.purple }}>শিক্ষাগত যোগ্যতা</h4>
                    <div className="space-y-1">
                      {edu.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 text-[11px] px-2 py-1.5 rounded-lg" style={{ background: t.inputBg }}>
                          <span className="font-bold px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${t.purple}15`, color: t.purple }}>{e.level}</span>
                          <span className="flex-1">{e.school_name || "—"}</span>
                          {e.gpa && <span className="font-mono font-bold" style={{ color: t.cyan }}>GPA {e.gpa}</span>}
                          {e.passing_year && <span style={{ color: t.muted }}>{e.passing_year}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── জাপানিজ পরীক্ষা ── */}
                {jpExams.length > 0 && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.rose }}>জাপানিজ পরীক্ষা</h4>
                    <div className="space-y-1">
                      {jpExams.map((ex, i) => (
                        <div key={i} className="flex items-center gap-3 text-[11px] px-2 py-1.5 rounded-lg" style={{ background: t.inputBg }}>
                          <span className="font-bold px-1.5 py-0.5 rounded text-[10px]" style={{ background: `${t.rose}15`, color: t.rose }}>{ex.jp_level}</span>
                          <span>{ex.exam_type || "JLPT"}</span>
                          {ex.jp_score && <span style={{ color: t.muted }}>স্কোর: {ex.jp_score}</span>}
                          {ex.exam_date && <span style={{ color: t.muted }}>{formatDateDisplay(ex.exam_date)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── স্পনসর ── */}
                {sponsor && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.amber }}>স্পনসর</h4>
                    <FieldGrid fields={[
                      ["নাম", sponsor.name || sponsor.name_en], ["সম্পর্ক", sponsor.relationship],
                      ["ফোন", sponsor.phone], ["পেশা/কোম্পানি", sponsor.company_name],
                      ["আয় (১ম বছর)", sponsor.annual_income_y1 ? `৳${Number(sponsor.annual_income_y1).toLocaleString("en-IN")}` : ""],
                    ]} />
                  </div>
                )}
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
