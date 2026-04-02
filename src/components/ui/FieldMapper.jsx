/**
 * FieldMapper.jsx — Reusable placeholder → system field mapping component
 *
 * ব্যবহার: DocGen, SuperAdmin, ExcelAutoFill — সব জায়গায় একই component
 * Features: collapsible category picker, modifier dropdown, color-coded groups
 */

import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// ═══════════════════════════════════════════════════════
// System Fields — সব mapping UI-তে একই fields ব্যবহার হয়
// DocGen, SuperAdmin, ExcelAutoFill — সবাই এই list reference করে
// ═══════════════════════════════════════════════════════
const SYSTEM_FIELDS = [
  // ব্যক্তিগত তথ্য — নাম, জন্ম তারিখ, লিঙ্গ, ফোন, NID ইত্যাদি
  { group: "Personal", color: "cyan", fields: [
    { key: "name_en", label: "Name (English)" }, { key: "name_en:first", label: "Name → First" }, { key: "name_en:last", label: "Name → Last" },
    { key: "name_bn", label: "Name (Bengali)" }, { key: "name_katakana", label: "Name (カタカナ)" },
    { key: "dob", label: "Date of Birth" }, { key: "age", label: "Age" },
    { key: "gender", label: "Gender" }, { key: "nationality", label: "Nationality" },
    { key: "marital_status", label: "Marital Status" }, { key: "blood_group", label: "Blood Group" },
    { key: "phone", label: "Phone" }, { key: "email", label: "Email" }, { key: "nid", label: "NID" },
  ]},
  // পাসপোর্ট তথ্য — নম্বর, ইস্যু ও মেয়াদ
  { group: "Passport", color: "amber", fields: [
    { key: "passport_number", label: "Passport Number" },
    { key: "passport_issue", label: "Passport Issue Date" },
    { key: "passport_expiry", label: "Passport Expiry" },
  ]},
  // ঠিকানা — স্থায়ী ও বর্তমান
  { group: "Address", color: "emerald", fields: [
    { key: "permanent_address", label: "Permanent Address" },
    { key: "current_address", label: "Current Address" },
  ]},
  // পারিবারিক তথ্য — পিতা/মাতার নাম, জন্ম তারিখ, পেশা
  { group: "Family", color: "purple", fields: [
    { key: "father_name", label: "Father Name" }, { key: "father_name_en", label: "Father Name (EN)" },
    { key: "mother_name", label: "Mother Name" }, { key: "mother_name_en", label: "Mother Name (EN)" },
    { key: "father_dob", label: "Father DOB" }, { key: "mother_dob", label: "Mother DOB" },
    { key: "father_occupation", label: "Father Occupation" }, { key: "mother_occupation", label: "Mother Occupation" },
  ]},
  // শিক্ষাগত তথ্য — SSC/HSC স্কুল, সাল, বোর্ড, GPA
  { group: "Education", color: "amber", fields: [
    { key: "edu_ssc_school", label: "SSC School" },
    { key: "edu_ssc_year", label: "SSC Year" },
    { key: "edu_ssc_board", label: "SSC Board" },
    { key: "edu_ssc_gpa", label: "SSC GPA" },
    { key: "edu_hsc_school", label: "HSC School" },
    { key: "edu_hsc_year", label: "HSC Year" },
    { key: "edu_hsc_board", label: "HSC Board" },
    { key: "edu_hsc_gpa", label: "HSC GPA" },
  ]},
  // জাপানি ভাষা — JLPT/NAT লেভেল, স্কোর, পরীক্ষার তারিখ
  { group: "Japanese", color: "rose", fields: [
    { key: "jp_level", label: "JLPT/NAT Level" },
    { key: "jp_score", label: "JP Exam Score" },
    { key: "jp_exam_type", label: "JP Exam Type" },
    { key: "jp_exam_date", label: "JP Exam Date" },
  ]},
  // স্পন্সর/গ্যারান্টর — নাম, ফোন, ঠিকানা, সম্পর্ক + 経費支弁書 extended fields
  { group: "Sponsor", color: "rose", fields: [
    { key: "sponsor_name", label: "Sponsor Name" }, { key: "sponsor_phone", label: "Sponsor Phone" },
    { key: "sponsor_address", label: "Sponsor Address" }, { key: "sponsor_relationship", label: "Relationship" },
    { key: "sponsor_statement", label: "Sponsor Statement" },
    { key: "sponsor_payment_to_student", label: "Payment to Student (bool)" },
    { key: "sponsor_payment_to_school", label: "Payment to School (bool)" },
    { key: "sponsor_sign_date", label: "Sponsor Sign Date" },
    { key: "sponsor_tin", label: "Sponsor TIN" },
    { key: "sponsor_income", label: "Sponsor Annual Income" },
    { key: "sponsor_company", label: "Sponsor Company" },
    { key: "sponsor_nid", label: "Sponsor NID" },
  ]},
  // জাপান ফাইন্যান্স — টিউশন, জীবনযাত্রা খরচ, বিনিময় হার
  { group: "Japan Finance", color: "amber", fields: [
    { key: "tuition_jpy", label: "Tuition First Year (JPY)" },
    { key: "monthly_living", label: "Monthly Living (JPY)" },
    { key: "exchange_rate", label: "Exchange Rate" },
  ]},
  // গন্তব্য — দেশ, স্কুল, ব্যাচ
  { group: "Destination", color: "cyan", fields: [
    { key: "country", label: "Country" }, { key: "school", label: "School" }, { key: "batch", label: "Batch" },
  ]},
  // সিস্টেম — আজকের তারিখ (বাংলা ও জাপানি ফরম্যাট)
  { group: "System", color: "muted", fields: [
    { key: "today", label: "Today's Date" }, { key: "today_jp", label: "Today (Japanese)" },
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

  // বাইরে ক্লিক করলে dropdown বন্ধ
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // SYSTEM_FIELDS + doc_type-এর extraGroups একত্রে — সম্পূর্ণ field list
  const allGroups = [...SYSTEM_FIELDS, ...extraGroups];
  const allFields = allGroups.flatMap(g => g.fields);
  const selectedLabel = selectedField ? (allFields.find(f => f.key === selectedField)?.label || selectedField) : null;

  // Dropdown position — নিচে space না থাকলে উপরে
  const getPosition = () => {
    const el = ref.current;
    if (!el) return {};
    const rect = el.getBoundingClientRect();
    return (window.innerHeight - rect.bottom) < 350 ? { bottom: "100%", marginBottom: 4 } : { top: "100%", marginTop: 4 };
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

        {open && (
          <div className="absolute left-0 right-0 z-50 rounded-xl shadow-2xl overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}`, maxHeight: 320, overflowY: "auto", ...getPosition() }}>
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
          </div>
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
