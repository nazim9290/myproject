/**
 * FieldMapper.jsx — Reusable placeholder → system field mapping component
 *
 * ব্যবহার: DocGen, SuperAdmin, ExcelAutoFill — সব জায়গায় একই component
 * Features: collapsible category picker, modifier dropdown, color-coded groups
 */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// ═══════════════════════════════════════════════════════
// System Fields — সব mapping UI-তে একই fields ব্যবহার হয়
// DocGen, SuperAdmin, ExcelAutoFill — সবাই এই list reference করে
// ═══════════════════════════════════════════════════════
const SYSTEM_FIELDS = [
  // ব্যক্তিগত তথ্য — নাম, জন্ম তারিখ, লিঙ্গ, ফোন, WhatsApp, ইমেইল, জন্মস্থান, পেশা
  { group: "ব্যক্তিগত", color: "cyan", fields: [
    { key: "name_en", label: "নাম (Full English)" },
    { key: "name_en:first", label: "নাম → First Name" },
    { key: "name_en:last", label: "নাম → Last Name" },
    { key: "name_bn", label: "নাম (বাংলা)" },
    { key: "name_katakana", label: "নাম (カタカナ)" },
    { key: "name_katakana:first", label: "カタカナ → First" },
    { key: "name_katakana:last", label: "カタカナ → Last" },
    { key: "dob", label: "জন্ম তারিখ (Full)" },
    { key: "dob:year", label: "জন্ম → শুধু Year" },
    { key: "dob:month", label: "জন্ম → শুধু Month" },
    { key: "dob:day", label: "জন্ম → শুধু Day" },
    { key: "age", label: "বয়স" },
    { key: "gender", label: "লিঙ্গ" },
    { key: "nationality", label: "জাতীয়তা" },
    { key: "marital_status", label: "বৈবাহিক অবস্থা" },
    { key: "blood_group", label: "রক্তের গ্রুপ" },
    { key: "phone", label: "ফোন" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "email", label: "ইমেইল" },
    // Resume fields — 入学願書
    { key: "birth_place", label: "জন্মস্থান" },
    { key: "occupation", label: "পেশা" },
  ]},
  // পাসপোর্ট / NID তথ্য — নম্বর, ইস্যু ও মেয়াদ + year/month/day sub-parts
  { group: "পাসপোর্ট / NID", color: "amber", fields: [
    { key: "nid", label: "NID নম্বর" },
    { key: "passport_number", label: "পাসপোর্ট নম্বর" },
    { key: "passport_issue", label: "পাসপোর্ট ইস্যু (Full)" },
    { key: "passport_issue:year", label: "পাসপোর্ট ইস্যু → Year" },
    { key: "passport_issue:month", label: "পাসপোর্ট ইস্যু → Month" },
    { key: "passport_issue:day", label: "পাসপোর্ট ইস্যু → Day" },
    { key: "passport_expiry", label: "পাসপোর্ট মেয়াদ (Full)" },
    { key: "passport_expiry:year", label: "পাসপোর্ট মেয়াদ → Year" },
    { key: "passport_expiry:month", label: "পাসপোর্ট মেয়াদ → Month" },
    { key: "passport_expiry:day", label: "পাসপোর্ট মেয়াদ → Day" },
  ]},
  // ঠিকানা — স্থায়ী ও বর্তমান
  { group: "ঠিকানা", color: "emerald", fields: [
    { key: "permanent_address", label: "স্থায়ী ঠিকানা" },
    { key: "current_address", label: "বর্তমান ঠিকানা" },
  ]},
  // পারিবারিক তথ্য — পিতা/মাতার নাম, জন্ম তারিখ (+ year/month/day), পেশা
  { group: "পরিবার", color: "purple", fields: [
    { key: "father_name", label: "পিতার নাম (বাংলা)" },
    { key: "father_name_en", label: "পিতার নাম (EN)" },
    { key: "mother_name", label: "মাতার নাম (বাংলা)" },
    { key: "mother_name_en", label: "মাতার নাম (EN)" },
    { key: "father_dob", label: "পিতার জন্ম তারিখ (Full)" },
    { key: "father_dob:year", label: "পিতার জন্ম → Year" },
    { key: "father_dob:month", label: "পিতার জন্ম → Month" },
    { key: "father_dob:day", label: "পিতার জন্ম → Day" },
    { key: "father_occupation", label: "পিতার পেশা" },
    { key: "mother_dob", label: "মাতার জন্ম তারিখ (Full)" },
    { key: "mother_dob:year", label: "মাতার জন্ম → Year" },
    { key: "mother_dob:month", label: "মাতার জন্ম → Month" },
    { key: "mother_dob:day", label: "মাতার জন্ম → Day" },
    { key: "mother_occupation", label: "মাতার পেশা" },
  ]},
  // শিক্ষাগত তথ্য — SSC/HSC/Honours + Elementary/Junior/High (入学願書 format)
  { group: "শিক্ষা", color: "amber", fields: [
    // SSC / HSC / Honours — existing
    { key: "edu_ssc_school", label: "SSC স্কুল" },
    { key: "edu_ssc_year", label: "SSC সন" },
    { key: "edu_ssc_board", label: "SSC বোর্ড" },
    { key: "edu_ssc_gpa", label: "SSC GPA" },
    { key: "edu_ssc_subject", label: "SSC বিভাগ" },
    { key: "edu_hsc_school", label: "HSC কলেজ" },
    { key: "edu_hsc_year", label: "HSC সন" },
    { key: "edu_hsc_board", label: "HSC বোর্ড" },
    { key: "edu_hsc_gpa", label: "HSC GPA" },
    { key: "edu_hsc_subject", label: "HSC বিভাগ" },
    { key: "edu_honours_school", label: "Honours বিশ্ববিদ্যালয়" },
    { key: "edu_honours_year", label: "Honours সন" },
    { key: "edu_honours_gpa", label: "Honours GPA" },
    { key: "edu_honours_subject", label: "Honours বিষয়" },
    // Elementary — 小学校 (入学/卒業 + 所在地)
    { key: "edu_elementary_school", label: "প্রাথমিক বিদ্যালয়" },
    { key: "edu_elementary_address", label: "প্রাথমিক → ঠিকানা" },
    { key: "edu_elementary_entrance", label: "প্রাথমিক → ভর্তি সন" },
    { key: "edu_elementary_graduation", label: "প্রাথমিক → পাশ সন" },
    // Junior High — 中学校
    { key: "edu_junior_school", label: "জুনিয়র হাই স্কুল" },
    { key: "edu_junior_address", label: "জুনিয়র → ঠিকানা" },
    { key: "edu_junior_entrance", label: "জুনিয়র → ভর্তি সন" },
    { key: "edu_junior_graduation", label: "জুনিয়র → পাশ সন" },
    // High School — 高等学校
    { key: "edu_high_school", label: "উচ্চ বিদ্যালয়" },
    { key: "edu_high_address", label: "উচ্চ বিদ্যালয় → ঠিকানা" },
    { key: "edu_high_entrance", label: "উচ্চ বিদ্যালয় → ভর্তি সন" },
    { key: "edu_high_graduation", label: "উচ্চ বিদ্যালয় → পাশ সন" },
  ]},
  // জাপানি ভাষা — JLPT/NAT পরীক্ষার ধরন, লেভেল, স্কোর, ফলাফল, তারিখ
  { group: "জাপানি ভাষা", color: "rose", fields: [
    { key: "jp_exam_type", label: "পরীক্ষার ধরন" },
    { key: "jp_level", label: "লেভেল" },
    { key: "jp_score", label: "স্কোর" },
    { key: "jp_result", label: "ফলাফল" },
    { key: "jp_exam_date", label: "পরীক্ষার তারিখ" },
  ]},
  // কর্ম অভিজ্ঞতা — 職歴 (Vocational experience for 入学願書)
  { group: "কর্ম অভিজ্ঞতা", color: "emerald", fields: [
    { key: "work_company", label: "কোম্পানি নাম" },
    { key: "work_address", label: "কোম্পানি ঠিকানা" },
    { key: "work_start", label: "শুরু তারিখ" },
    { key: "work_end", label: "শেষ তারিখ" },
    { key: "work_position", label: "পদবি" },
    // ২য় কর্ম অভিজ্ঞতা (indexed)
    { key: "work2_company", label: "২য় কোম্পানি নাম" },
    { key: "work2_address", label: "২য় কোম্পানি ঠিকানা" },
    { key: "work2_start", label: "২য় শুরু তারিখ" },
    { key: "work2_end", label: "২য় শেষ তারিখ" },
    { key: "work2_position", label: "২য় পদবি" },
  ]},
  // জাপানি ভাষা শিক্ষা ইতিহাস — 日本語学習歴 (入学願書)
  { group: "জাপানি শিক্ষা ইতিহাস", color: "purple", fields: [
    { key: "jp_study_institution", label: "প্রতিষ্ঠান" },
    { key: "jp_study_address", label: "প্রতিষ্ঠান ঠিকানা" },
    { key: "jp_study_from", label: "শুরু তারিখ" },
    { key: "jp_study_to", label: "শেষ তারিখ" },
    { key: "jp_study_hours", label: "মোট ঘণ্টা" },
  ]},
  // স্পন্সর/গ্যারান্টর — নাম, ফোন, ঠিকানা, সম্পর্ক, আয়/ট্যাক্স (৩ বছর) + 経費支弁書 fields
  { group: "স্পন্সর", color: "rose", fields: [
    { key: "sponsor_name", label: "স্পন্সরের নাম" },
    { key: "sponsor_name_en", label: "স্পন্সর নাম (EN)" },
    { key: "sponsor_relationship", label: "সম্পর্ক" },
    { key: "sponsor_phone", label: "স্পন্সর ফোন" },
    { key: "sponsor_address", label: "স্পন্সর ঠিকানা" },
    { key: "sponsor_company", label: "কোম্পানি" },
    { key: "sponsor_income_y1", label: "আয় (১ম বছর)" },
    { key: "sponsor_income_y2", label: "আয় (২য় বছর)" },
    { key: "sponsor_income_y3", label: "আয় (৩য় বছর)" },
    { key: "sponsor_tax_y1", label: "ট্যাক্স (১ম বছর)" },
    { key: "sponsor_tax_y2", label: "ট্যাক্স (২য় বছর)" },
    { key: "sponsor_tax_y3", label: "ট্যাক্স (৩য় বছর)" },
    { key: "sponsor_statement", label: "Sponsor Statement" },
    { key: "sponsor_payment_to_student", label: "Payment to Student (bool)" },
    { key: "sponsor_payment_to_school", label: "Payment to School (bool)" },
    { key: "sponsor_sign_date", label: "Sponsor Sign Date" },
    { key: "sponsor_tin", label: "Sponsor TIN" },
    { key: "sponsor_income", label: "Sponsor Annual Income" },
    { key: "sponsor_nid", label: "Sponsor NID" },
    // Resume fields — 入学願書
    { key: "sponsor_dob", label: "স্পন্সর জন্ম তারিখ" },
    { key: "sponsor_company_phone", label: "কোম্পানি ফোন" },
    { key: "sponsor_company_address", label: "কোম্পানি ঠিকানা" },
  ]},
  // জাপান ফাইন্যান্স — টিউশন, জীবনযাত্রা খরচ, বিনিময় হার
  { group: "জাপান ফাইন্যান্স", color: "amber", fields: [
    { key: "tuition_jpy", label: "Tuition First Year (JPY)" },
    { key: "monthly_living", label: "Monthly Living (JPY)" },
    { key: "exchange_rate", label: "Exchange Rate" },
  ]},
  // গন্তব্য — দেশ, ভিসা, Intake, স্টুডেন্ট টাইপ
  { group: "গন্তব্য", color: "cyan", fields: [
    { key: "country", label: "দেশ" },
    { key: "school", label: "School" },
    { key: "batch", label: "Batch" },
    { key: "intake", label: "Intake" },
    { key: "visa_type", label: "ভিসার ধরন" },
    { key: "student_type", label: "স্টুডেন্ট টাইপ" },
  ]},
  // পরিবার (বিস্তারিত) — 入学願書 format: নাম, সম্পর্ক, জন্ম তারিখ, পেশা, ঠিকানা
  { group: "পরিবার (বিস্তারিত)", color: "purple", fields: [
    { key: "family1_name", label: "সদস্য ১ নাম" },
    { key: "family1_relation", label: "সদস্য ১ সম্পর্ক" },
    { key: "family1_dob", label: "সদস্য ১ জন্ম তারিখ" },
    { key: "family1_occupation", label: "সদস্য ১ পেশা" },
    { key: "family1_address", label: "সদস্য ১ ঠিকানা" },
    { key: "family2_name", label: "সদস্য ২ নাম" },
    { key: "family2_relation", label: "সদস্য ২ সম্পর্ক" },
    { key: "family2_dob", label: "সদস্য ২ জন্ম তারিখ" },
    { key: "family2_occupation", label: "সদস্য ২ পেশা" },
    { key: "family2_address", label: "সদস্য ২ ঠিকানা" },
    { key: "family3_name", label: "সদস্য ৩ নাম" },
    { key: "family3_relation", label: "সদস্য ৩ সম্পর্ক" },
    { key: "family3_dob", label: "সদস্য ৩ জন্ম তারিখ" },
    { key: "family3_occupation", label: "সদস্য ৩ পেশা" },
    { key: "family3_address", label: "সদস্য ৩ ঠিকানা" },
  ]},
  // পড়াশোনার পরিকল্পনা — 入学願書: কেন পড়তে চাও, ভবিষ্যৎ পরিকল্পনা, বিষয়
  { group: "পড়াশোনার পরিকল্পনা", color: "cyan", fields: [
    { key: "reason_for_study", label: "পড়ার কারণ" },
    { key: "future_plan", label: "ভবিষ্যৎ পরিকল্পনা" },
    { key: "study_subject", label: "পড়ার বিষয়" },
  ]},
  // সিস্টেম ভ্যারিয়েবল — এজেন্সি, ব্রাঞ্চ, তারিখ, স্কুল, ব্যাচ তথ্য
  { group: "সিস্টেম ভ্যারিয়েবল", color: "muted", fields: [
    { key: "sys_agency_name", label: "এজেন্সি নাম" },
    { key: "sys_agency_name_bn", label: "এজেন্সি নাম (বাংলা)" },
    { key: "sys_agency_address", label: "এজেন্সি ঠিকানা" },
    { key: "sys_agency_phone", label: "এজেন্সি ফোন" },
    { key: "sys_agency_email", label: "এজেন্সি ইমেইল" },
    { key: "sys_branch_name", label: "ব্রাঞ্চ নাম" },
    { key: "sys_branch_address", label: "ব্রাঞ্চ ঠিকানা" },
    { key: "sys_branch_phone", label: "ব্রাঞ্চ ফোন" },
    { key: "sys_branch_manager", label: "ব্রাঞ্চ ম্যানেজার" },
    { key: "sys_today", label: "আজকের তারিখ" },
    { key: "sys_today:year", label: "আজ → বছর" },
    { key: "sys_today:month", label: "আজ → মাস" },
    { key: "sys_today:day", label: "আজ → দিন" },
    { key: "sys_today_jp", label: "আজকের তারিখ (日本語)" },
    { key: "sys_batch_name", label: "ব্যাচ নাম" },
    { key: "sys_batch_start", label: "ব্যাচ শুরু তারিখ" },
    { key: "sys_batch_start:year", label: "ব্যাচ শুরু → বছর" },
    { key: "sys_batch_start:month", label: "ব্যাচ শুরু → মাস" },
    { key: "sys_batch_start:day", label: "ব্যাচ শুরু → দিন" },
    { key: "sys_batch_end", label: "ব্যাচ শেষ তারিখ" },
    { key: "sys_batch_end:year", label: "ব্যাচ শেষ → বছর" },
    { key: "sys_batch_end:month", label: "ব্যাচ শেষ → মাস" },
    { key: "sys_batch_end:day", label: "ব্যাচ শেষ → দিন" },
    { key: "sys_batch_teacher", label: "ব্যাচ শিক্ষক" },
    { key: "sys_batch_schedule", label: "ব্যাচ সময়সূচী" },
    // ব্যাচ শিডিউল — ক্লাসের দিন, সময়, ঘণ্টা (auto-calculated)
    { key: "sys_batch_class_days", label: "ব্যাচ ক্লাসের দিন" },
    { key: "sys_batch_class_time", label: "ব্যাচ ক্লাস সময়" },
    { key: "sys_batch_hours_per_day", label: "প্রতিদিন ঘণ্টা" },
    { key: "sys_batch_weekly_hours", label: "সাপ্তাহিক ঘণ্টা" },
    { key: "sys_batch_total_classes", label: "মোট ক্লাস" },
    { key: "sys_batch_total_hours", label: "মোট ঘণ্টা" },
    { key: "sys_school_name", label: "স্কুল নাম (EN)" },
    { key: "sys_school_name_jp", label: "স্কুল নাম (JP)" },
    { key: "sys_school_address", label: "স্কুল ঠিকানা" },
  ]},
];

// Modifier অপশন — তারিখ/নামের ফরম্যাট পরিবর্তন করতে ব্যবহার হয়
// যেমন :jp = জাপানি তারিখ (年月日), :first/:last = নামের অংশ
const MODIFIERS = [
  { value: "", label: "None" },
  { value: ":jp", label: ":jp (日本語)" },
  { value: ":slash", label: ":slash (Y/M/D)" },
  { value: ":dot", label: ":dot (D.M.Y)" },
  { value: ":dmy", label: ":dmy (D/M/Y)" },
  { value: ":year", label: ":year" },
  { value: ":month", label: ":month" },
  { value: ":day", label: ":day" },
  { value: ":first", label: ":first" },
  { value: ":last", label: ":last" },
];

/**
 * FieldMapper — একটি placeholder-এর জন্য field picker + modifier
 *
 * Props:
 *   placeholderKey — "Register No"
 *   selectedField — "register_no"
 *   selectedModifier — ":jp"
 *   onFieldChange(key, value)
 *   onModifierChange(key, value)
 *   extraGroups — additional field groups (doc_type fields etc.)
 */
export function FieldPicker({ placeholderKey, selectedField, selectedModifier, onFieldChange, onModifierChange, extraGroups = [] }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  // বাইরে ক্লিক করলে dropdown বন্ধ — trigger button ও dropdown content দুটোই exclude
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && ref.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // SYSTEM_FIELDS + doc_type-এর extraGroups একত্রে — সম্পূর্ণ field list
  const allGroups = [...SYSTEM_FIELDS, ...extraGroups];
  const allFields = allGroups.flatMap(g => g.fields);
  const selectedLabel = selectedField ? (allFields.find(f => f.key === selectedField)?.label || selectedField) : null;

  // Dropdown position — Portal দিয়ে body-তে render, button-এর নিচে/উপরে position
  const getPortalStyle = () => {
    const el = ref.current;
    if (!el) return {};
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 350;
    return {
      position: "fixed",
      left: rect.left,
      width: rect.width,
      maxHeight: 320,
      overflowY: "auto",
      zIndex: 9999,
      ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    };
  };

  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };

  return (
    <div className="flex items-center gap-2 flex-1">
      {/* ফিল্ড সিলেক্টর — collapsible category-wise dropdown */}
      <div className="flex-1 relative" ref={ref}>
        <button onClick={() => setOpen(!open)}
          className="w-full px-3 py-1.5 rounded-lg text-xs text-left flex items-center justify-between"
          style={{ background: t.card, border: `1px solid ${selectedField ? t.emerald + "60" : t.inputBorder}`, color: selectedField ? t.text : t.muted }}>
          <span>{selectedLabel ? `${selectedLabel} (${selectedField})` : "— field সিলেক্ট —"}</span>
          <span style={{ fontSize: 10, color: t.muted }}>▼</span>
        </button>

        {open && createPortal(
          <div ref={dropdownRef} className="rounded-xl shadow-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}`, ...getPortalStyle() }}>
            <button onClick={() => { onFieldChange(placeholderKey, ""); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-[10px]" style={{ color: t.muted, borderBottom: `1px solid ${t.border}` }}>
              ✕ Clear
            </button>
            {allGroups.map(g => {
              const color = t[g.color] || t.cyan;
              return (
                <div key={g.group}>
                  <button onClick={() => setExpandedGroup(expandedGroup === g.group ? null : g.group)}
                    className="w-full px-3 py-2 text-left text-[10px] font-semibold"
                    style={{ background: `${color}06`, borderBottom: `1px solid ${t.border}`, color }}>
                    {expandedGroup === g.group ? "▼" : "▶"} {g.group} ({g.fields.length})
                  </button>
                  {expandedGroup === g.group && g.fields.map(f => (
                    <button key={f.key} onClick={() => { onFieldChange(placeholderKey, f.key); setOpen(false); }}
                      className="w-full px-4 py-1.5 text-left text-xs flex items-center gap-2 transition"
                      style={{ background: selectedField === f.key ? `${color}12` : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = `${color}08`}
                      onMouseLeave={e => e.currentTarget.style.background = selectedField === f.key ? `${color}12` : "transparent"}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span>{f.label}</span>
                      <span className="text-[9px] ml-auto" style={{ color: t.muted }}>{f.key}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>,
          document.body
        )}
      </div>

      {/* Modifier dropdown — তারিখ/নাম ফরম্যাট পরিবর্তন */}
      <select value={selectedModifier || ""} onChange={e => onModifierChange(placeholderKey, e.target.value)}
        className="px-2 py-1.5 rounded-lg text-[10px] outline-none shrink-0"
        style={{ ...is, width: 130, borderColor: selectedModifier ? `${t.purple}60` : t.inputBorder, color: selectedModifier ? t.purple : t.muted }}>
        {MODIFIERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>

      {/* ম্যাপ সম্পন্ন হলে সবুজ চেক দেখাও */}
      {selectedField && <Check size={14} style={{ color: t.emerald }} className="shrink-0" />}
    </div>
  );
}

/**
 * FieldMapperTable — placeholder list + mapping
 *
 * Props:
 *   placeholders — [{ key, placeholder }]
 *   mappings — { "Register No": "register_no" }
 *   modifiers — { "Register No": ":jp" }
 *   onMappingChange(key, value)
 *   onModifierChange(key, value)
 *   extraGroups — additional field groups
 */
export default function FieldMapperTable({ placeholders, mappings, modifiers, onMappingChange, onModifierChange, extraGroups = [] }) {
  const t = useTheme();
  // মোট কতটি placeholder ম্যাপ হয়েছে তার হিসাব
  const mappedCount = Object.values(mappings).filter(Boolean).length;

  return (
    <div>
      {/* প্রোগ্রেস বার — কতটি ম্যাপ হয়েছে / মোট */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: t.inputBg }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${placeholders.length > 0 ? (mappedCount / placeholders.length) * 100 : 0}%`, background: t.emerald }} />
        </div>
        <span className="text-[10px] font-mono" style={{ color: t.muted }}>{mappedCount}/{placeholders.length} mapped</span>
      </div>

      {/* টেবিল হেডার — Placeholder | System Field | Modifier */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted, width: 160 }}>Placeholder</span>
        <span className="text-[10px] uppercase tracking-wider font-medium flex-1" style={{ color: t.muted }}>System Field</span>
        <span className="text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted, width: 130 }}>Modifier</span>
        <span style={{ width: 14 }} />
      </div>

      {/* প্রতিটি placeholder-এর জন্য একটি row — FieldPicker সহ */}
      <div className="space-y-1.5">
        {placeholders.map(p => (
          <div key={p.key} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: t.inputBg, border: `1px solid ${mappings[p.key] ? t.emerald + "25" : t.border}` }}>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded shrink-0" style={{ background: `${t.cyan}10`, color: t.cyan, minWidth: 150 }}>
              {`{{${p.key}}}`}
            </span>
            <FieldPicker
              placeholderKey={p.key}
              selectedField={mappings[p.key] || ""}
              selectedModifier={modifiers[p.key] || ""}
              onFieldChange={onMappingChange}
              onModifierChange={onModifierChange}
              extraGroups={extraGroups}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// অন্য component-এ ব্যবহারের জন্য export (DocGen, SuperAdmin ইত্যাদি)
export { SYSTEM_FIELDS, MODIFIERS };
