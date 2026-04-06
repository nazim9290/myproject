import { useState, useEffect } from "react";
import { Save, Plus, Trash2, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import PhoneInput, { isValidPhone } from "../../components/ui/PhoneInput";
import DateInput from "../../components/ui/DateInput";
import { api } from "../../hooks/useAPI";

// ─── helpers ────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

const BLANK_EDU   = () => ({ id: uid(), level: "SSC", institution: "", year: "", board: "", gpa: "", group: "" });
const BLANK_EMP   = () => ({ id: uid(), company: "", position: "", start_date: "", end_date: "" });
const BLANK_STUDY = () => ({ id: uid(), institution: "", hours: "", attendance_rate: "", grade: "" });
const BLANK_EXAM  = () => ({ id: uid(), exam_type: "JLPT", level: "N5", date: "", score: "", result: "Pass" });

const BLANK_FORM = {
  // Section 1 — Personal
  name_en: "", name_katakana: "",
  phone: "", whatsapp: "", email: "",
  dob: "", gender: "Male", marital_status: "Single",
  nationality: "Bangladeshi", nid: "",
  passport_number: "", passport_issue: "", passport_expiry: "",
  permanent_address: "", current_address: "", same_as_permanent: true,
  // Section 2-5 (arrays)
  education: [BLANK_EDU()],
  employment: [],
  jp_study: [],
  jp_exams: [],
  // Section 6 — Visa & Destination
  visa_type: "Language Student",
  country: "Japan", school: "", batch: "April 2026", intake: "", agent: "",
  source: "Walk-in", counselor: "", type: "own",
  branch: (() => { try { const t = localStorage.getItem("agencyos_token"); if (!t) return ""; return JSON.parse(atob(t.split(".")[1])).branch || ""; } catch { return ""; } })(),
  // Section 7
  gdrive_folder_url: "",
  // Section 8
  internal_notes: "",
};

// ─── sub-components ──────────────────────────────────────
function SectionHeader({ icon, title, badge, open, onToggle }) {
  const t = useTheme();
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center gap-2 py-2 px-1 rounded-lg transition-all"
      onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span className="text-base">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.cyan }}>{title}</span>
      {badge != null && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${t.cyan}20`, color: t.cyan }}>{badge}</span>
      )}
      <div className="flex-1 h-px mx-2" style={{ background: `${t.cyan}20` }} />
      {open ? <ChevronDown size={13} style={{ color: t.muted }} /> : <ChevronRight size={13} style={{ color: t.muted }} />}
    </button>
  );
}

function Field({ label, required, error, children }) {
  const t = useTheme();
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>
        {label}{required && <span style={{ color: t.rose }}> *</span>}
      </label>
      {children}
      {error && <p className="flex items-center gap-1 mt-1 text-[10px]" style={{ color: t.rose }}><AlertCircle size={10} />{error}</p>}
    </div>
  );
}

// ─── main component ──────────────────────────────────────
export default function AddStudentForm({ onSave, onCancel, studentsCount }) {
  const t = useTheme();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  // API থেকে branches load (mock data সরানো)
  const [branchesList, setBranchesList] = useState([]);
  useEffect(() => { api.get("/branches").then(d => { if (Array.isArray(d)) setBranchesList(d); }).catch(() => {}); }, []);
  // which sections are open
  const [open, setOpen] = useState({ personal: true, education: true, employment: false, jpStudy: false, jpExam: false, destination: true, drive: false, notes: false });

  const set = (k, v) => {
    setForm(p => {
      const next = { ...p, [k]: v };
      if (k === "same_as_permanent" && v) next.current_address = next.permanent_address;
      if (k === "permanent_address" && p.same_as_permanent) next.current_address = v;
      return next;
    });
    if (errors[k]) setErrors(p => ({ ...p, [k]: null }));
  };
  const toggle = (sec) => setOpen(p => ({ ...p, [sec]: !p[sec] }));

  // Array row helpers
  const addRow = (key, blank) => setForm(p => ({ ...p, [key]: [...p[key], blank()] }));
  const removeRow = (key, id) => setForm(p => ({ ...p, [key]: p[key].filter(r => r.id !== id) }));
  const updateRow = (key, id, field, val) => setForm(p => ({ ...p, [key]: p[key].map(r => r.id === id ? { ...r, [field]: val } : r) }));

  const inp = (extra = {}) => ({ className: "w-full px-2 py-1.5 rounded-lg text-xs outline-none", style: is, ...extra });
  const sel = (opts, val, onChange) => (
    <select value={val} onChange={e => onChange(e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
      {opts.map(o => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );

  const validate = () => {
    const e = {};
    if (!form.name_en.trim()) e.name_en = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!isValidPhone(form.phone)) e.phone = "Enter a valid phone number";
    if (!form.branch) e.branch = "Select a branch";
    setErrors(e);
    if (Object.keys(e).length) {
      setOpen(p => ({ ...p, personal: true, destination: true }));
    }
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!validate()) return;
    const id = `S-2026-${String(studentsCount + 1).padStart(3, "0")}`;
    onSave({
      ...form,
      id,
      status: "ENROLLED",
      created: new Date().toISOString().slice(0, 10),
      fees: { items: [], payments: [] },
    });
  };

  const addBtn = (label, onClick) => (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition mt-2"
      style={{ background: `${t.cyan}15`, color: t.cyan }}
      onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}25`}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${t.cyan}15`; }}>
      <Plus size={10} /> {label}
    </button>
  );
  const delBtn = (onClick) => (
    <button type="button" onClick={onClick} title="Delete"
      className="p-1 rounded transition shrink-0 self-start mt-5"
      style={{ color: t.rose }}
      onMouseEnter={e => e.currentTarget.style.background = `${t.rose}15`}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; }}>
      <Trash2 size={12} />
    </button>
  );

  return (
    <Card delay={0}>
      {/* Sticky header */}
      <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div>
          <h3 className="text-sm font-bold">New Student Entry</h3>
          <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>Student Registration Form — fill all sections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="xs" onClick={onCancel}>Cancel</Button>
          <Button icon={Save} size="xs" onClick={save}>Save Student</Button>
        </div>
      </div>

      <div className="space-y-1">

        {/* ══ SECTION 1: PERSONAL ══════════════════════════ */}
        <SectionHeader icon="👤" title="Personal Info" badge={null} open={open.personal} onToggle={() => toggle("personal")} />
        {open.personal && (
          <div className="pl-2 pb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Full Name" required error={errors.name_en}>
                <input value={form.name_en} onChange={e => set("name_en", e.target.value)} placeholder="FULL NAME IN CAPS" {...inp({ style: { ...is, borderColor: errors.name_en ? t.rose : t.inputBorder } })} />
              </Field>
              <Field label="Name (Katakana)">
                <input value={form.name_katakana} onChange={e => set("name_katakana", e.target.value)} placeholder="カタカナ" {...inp()} />
              </Field>
              <Field label="Phone" required error={errors.phone}>
                <PhoneInput value={form.phone} onChange={v => set("phone", v)} error={errors.phone} />
              </Field>
              <Field label="WhatsApp">
                <PhoneInput value={form.whatsapp} onChange={v => set("whatsapp", v)} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" {...inp()} />
              </Field>
              <Field label="Date of Birth">
                <DateInput value={form.dob} onChange={v => set("dob", v)} size="sm" />
              </Field>
              <Field label="Gender">
                {sel([{v:"Male",l:"Male"}, {v:"Female",l:"Female"}, {v:"Other",l:"Other"}], form.gender, v => set("gender", v))}
              </Field>
              <Field label="Marital Status">
                {sel([{v:"Single",l:"Single"}, {v:"Married",l:"Married"}, {v:"Divorced",l:"Divorced"}, {v:"Widowed",l:"Widowed"}], form.marital_status, v => set("marital_status", v))}
              </Field>
              <Field label="Nationality">
                <input value={form.nationality} onChange={e => set("nationality", e.target.value)} placeholder="Bangladeshi" {...inp()} />
              </Field>
              <Field label="NID Number">
                <input value={form.nid} onChange={e => set("nid", e.target.value)} placeholder="17-digit NID" {...inp()} />
              </Field>
              <Field label="Passport Number">
                <input value={form.passport_number} onChange={e => set("passport_number", e.target.value)} placeholder="A12345678" {...inp()} />
              </Field>
              <Field label="Passport Issue Date">
                <DateInput value={form.passport_issue} onChange={v => set("passport_issue", v)} size="sm" />
              </Field>
              <Field label="Passport Expiry Date">
                <DateInput value={form.passport_expiry} onChange={v => set("passport_expiry", v)} size="sm" />
              </Field>
            </div>
            <Field label="Permanent Address">
              <textarea value={form.permanent_address} onChange={e => set("permanent_address", e.target.value)}
                rows={2} placeholder="Village, Upazila, District..."
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none resize-none" style={is} />
            </Field>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>Current Address</label>
              <label className="flex items-center gap-1 cursor-pointer text-[10px]" style={{ color: t.muted }}>
                <input type="checkbox" checked={form.same_as_permanent} onChange={e => set("same_as_permanent", e.target.checked)} />
                Same as permanent
              </label>
            </div>
            {!form.same_as_permanent && (
              <textarea value={form.current_address} onChange={e => set("current_address", e.target.value)}
                rows={2} placeholder="Current address..."
                className="w-full px-2 py-1.5 rounded-lg text-xs outline-none resize-none" style={is} />
            )}
          </div>
        )}

        {/* ══ SECTION 2: EDUCATION ════════════════════════ */}
        <SectionHeader icon="🎓" title="Education" badge={form.education.length} open={open.education} onToggle={() => toggle("education")} />
        {open.education && (
          <div className="pl-2 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                    {["Level", "Institution", "Year", "Board", "GPA", "Group", ""].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.education.map(row => (
                    <tr key={row.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                      <td className="py-1.5 px-1">
                        <select value={row.level} onChange={e => updateRow("education", row.id, "level", e.target.value)}
                          className="px-2 py-1 rounded-lg text-xs outline-none w-full" style={is}>
                          {["SSC","HSC","Diploma","Degree","Masters","Other"].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 px-1"><input value={row.institution} onChange={e => updateRow("education", row.id, "institution", e.target.value)} placeholder="School/College/University" {...inp()} /></td>
                      <td className="py-1.5 px-1"><input value={row.year} onChange={e => updateRow("education", row.id, "year", e.target.value)} placeholder="2022" {...inp({ style: { ...is, width: 70 } })} /></td>
                      <td className="py-1.5 px-1"><input value={row.board} onChange={e => updateRow("education", row.id, "board", e.target.value)} placeholder="Dhaka" {...inp({ style: { ...is, width: 80 } })} /></td>
                      <td className="py-1.5 px-1"><input value={row.gpa} onChange={e => updateRow("education", row.id, "gpa", e.target.value)} placeholder="5.00" {...inp({ style: { ...is, width: 60 } })} /></td>
                      <td className="py-1.5 px-1"><input value={row.group} onChange={e => updateRow("education", row.id, "group", e.target.value)} placeholder="Science" {...inp({ style: { ...is, width: 80 } })} /></td>
                      <td className="py-1.5 px-1">{delBtn(() => removeRow("education", row.id))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {addBtn("Add Education", () => addRow("education", BLANK_EDU))}
          </div>
        )}

        {/* ══ SECTION 3: EMPLOYMENT ═══════════════════════ */}
        <SectionHeader icon="💼" title="Employment History" badge={form.employment.length || null} open={open.employment} onToggle={() => toggle("employment")} />
        {open.employment && (
          <div className="pl-2 pb-3">
            {form.employment.length === 0 && <p className="text-[11px] py-2" style={{ color: t.muted }}>No employment records.</p>}
            {form.employment.map(row => (
              <div key={row.id} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
                <Field label="Company"><input value={row.company} onChange={e => updateRow("employment", row.id, "company", e.target.value)} placeholder="Company Name" {...inp()} /></Field>
                <Field label="Position"><input value={row.position} onChange={e => updateRow("employment", row.id, "position", e.target.value)} placeholder="Job Title" {...inp()} /></Field>
                <Field label="Start Date"><DateInput value={row.start_date} onChange={v => updateRow("employment", row.id, "start_date", v)} size="sm" /></Field>
                <div className="flex gap-2 items-end">
                  <Field label="End Date" classes="flex-1"><DateInput value={row.end_date} onChange={v => updateRow("employment", row.id, "end_date", v)} size="sm" /></Field>
                  {delBtn(() => removeRow("employment", row.id))}
                </div>
              </div>
            ))}
            {addBtn("Add Employment", () => addRow("employment", BLANK_EMP))}
          </div>
        )}

        {/* ══ SECTION 4: JP STUDY ══════════════════════════ */}
        <SectionHeader icon="🇯🇵" title="Japanese Study History" badge={form.jp_study.length || null} open={open.jpStudy} onToggle={() => toggle("jpStudy")} />
        {open.jpStudy && (
          <div className="pl-2 pb-3">
            {form.jp_study.length === 0 && <p className="text-[11px] py-2" style={{ color: t.muted }}>No Japanese study records.</p>}
            {form.jp_study.map(row => (
              <div key={row.id} className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
                <Field label="Institution"><input value={row.institution} onChange={e => updateRow("jp_study", row.id, "institution", e.target.value)} placeholder="Institute name" {...inp()} /></Field>
                <Field label="Total Hours"><input type="number" value={row.hours} onChange={e => updateRow("jp_study", row.id, "hours", e.target.value)} placeholder="150" {...inp()} /></Field>
                <Field label="Attendance %"><input type="number" value={row.attendance_rate} onChange={e => updateRow("jp_study", row.id, "attendance_rate", e.target.value)} placeholder="85" {...inp()} /></Field>
                <div className="flex gap-2 items-end">
                  <Field label="Grade" classes="flex-1"><input value={row.grade} onChange={e => updateRow("jp_study", row.id, "grade", e.target.value)} placeholder="A / B+ / 90%" {...inp()} /></Field>
                  {delBtn(() => removeRow("jp_study", row.id))}
                </div>
              </div>
            ))}
            {addBtn("Add JP Study", () => addRow("jp_study", BLANK_STUDY))}
          </div>
        )}

        {/* ══ SECTION 5: JP EXAM ═══════════════════════════ */}
        <SectionHeader icon="📝" title="Japanese Exam Results" badge={form.jp_exams.length || null} open={open.jpExam} onToggle={() => toggle("jpExam")} />
        {open.jpExam && (
          <div className="pl-2 pb-3">
            {form.jp_exams.length === 0 && <p className="text-[11px] py-2" style={{ color: t.muted }}>No exam results.</p>}
            {form.jp_exams.map(row => (
              <div key={row.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3 p-3 rounded-xl" style={{ background: t.inputBg }}>
                <Field label="Exam Type">
                  <select value={row.exam_type} onChange={e => updateRow("jp_exams", row.id, "exam_type", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                    {["JLPT","JFT","NAT","JPT","JLCT","TopJ","Other"].map(x => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="Level">
                  <select value={row.level} onChange={e => updateRow("jp_exams", row.id, "level", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                    {["N1","N2","N3","N4","N5","A2","A2.2","Basic"].map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Exam Date"><DateInput value={row.date} onChange={v => updateRow("jp_exams", row.id, "date", v)} size="sm" /></Field>
                <Field label="Score"><input value={row.score} onChange={e => updateRow("jp_exams", row.id, "score", e.target.value)} placeholder="180 / A" {...inp()} /></Field>
                <div className="flex gap-2 items-end">
                  <Field label="Result" classes="flex-1">
                    <select value={row.result} onChange={e => updateRow("jp_exams", row.id, "result", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                      {["Pass","Fail","Pending"].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </Field>
                  {delBtn(() => removeRow("jp_exams", row.id))}
                </div>
              </div>
            ))}
            {addBtn("Add Exam Result", () => addRow("jp_exams", BLANK_EXAM))}
          </div>
        )}

        {/* ══ SECTION 6: VISA & DESTINATION ════════════════ */}
        <SectionHeader icon="🌍" title="Visa &amp; Destination" badge={null} open={open.destination} onToggle={() => toggle("destination")} />
        {open.destination && (
          <div className="pl-2 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Visa Type">
                <select value={form.visa_type} onChange={e => set("visa_type", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                  {["Language Student","SSW","TITP","Engineer","Graduation","Masters","Visitor","Dependent","Other"].map(v => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <Field label="Country">
                <select value={form.country} onChange={e => set("country", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                  {["Japan","Germany","Korea","Canada","UK","Australia","Malaysia"].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="School / University">
                <input value={form.school} onChange={e => set("school", e.target.value)} placeholder="Tokyo Galaxy..." {...inp()} />
              </Field>
              <Field label="Batch">
                <select value={form.batch} onChange={e => set("batch", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                  {["April 2026","October 2026","January 2027","April 2027","October 2027","Not confirmed"].map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Intake Month">
                <input value={form.intake} onChange={e => set("intake", e.target.value)} placeholder="April 2026" {...inp()} />
              </Field>
              <Field label="Agent Name">
                <input value={form.agent} onChange={e => set("agent", e.target.value)} placeholder="Agent / Referrer name" {...inp()} />
              </Field>
              <Field label="Source">
                <select value={form.source} onChange={e => set("source", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                  {["Walk-in","Facebook","Agent","Referral","Website","YouTube","Friend"].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Counselor">
                <input value={form.counselor} onChange={e => set("counselor", e.target.value)} placeholder="Counselor name" {...inp()} />
              </Field>
              <Field label="Type">
                <select value={form.type} onChange={e => set("type", e.target.value)} className="w-full px-2 py-1.5 rounded-lg text-xs outline-none" style={is}>
                  <option value="own">Own Student</option>
                  <option value="partner">Partner Agency</option>
                </select>
              </Field>
              <Field label="Branch" required error={errors.branch}>
                <select value={form.branch} onChange={e => set("branch", e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                  style={{ ...is, borderColor: errors.branch ? t.rose : t.inputBorder }}>
                  <option value="">— Select Branch —</option>
                  {branchesList.map(b => (
                    <option key={b.id} value={b.name}>{b.name} ({b.city})</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ══ SECTION 7: GOOGLE DRIVE ══════════════════════ */}
        <SectionHeader icon="📁" title="Google Drive" badge={null} open={open.drive} onToggle={() => toggle("drive")} />
        {open.drive && (
          <div className="pl-2 pb-3">
            <Field label="Google Drive Folder URL">
              <input value={form.gdrive_folder_url} onChange={e => set("gdrive_folder_url", e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..." {...inp()} />
            </Field>
            {form.gdrive_folder_url && (
              <a href={form.gdrive_folder_url} target="_blank" rel="noreferrer"
                className="text-[10px] mt-1 inline-block" style={{ color: t.cyan }}>
                Open Drive Folder →
              </a>
            )}
          </div>
        )}

        {/* ══ SECTION 8: NOTES ════════════════════════════ */}
        <SectionHeader icon="📌" title="Internal Notes" badge={null} open={open.notes} onToggle={() => toggle("notes")} />
        {open.notes && (
          <div className="pl-2 pb-3">
            <textarea value={form.internal_notes} onChange={e => set("internal_notes", e.target.value)}
              rows={4} placeholder="Internal notes — only visible to staff..."
              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none" style={is} />
          </div>
        )}

      </div>

      {/* Footer save button */}
      <div className="flex justify-end gap-2 pt-4 mt-2" style={{ borderTop: `1px solid ${t.border}` }}>
        <Button variant="ghost" size="xs" onClick={onCancel}>Cancel</Button>
        <Button icon={Save} size="xs" onClick={save}>Save Student</Button>
      </div>
    </Card>
  );
}
