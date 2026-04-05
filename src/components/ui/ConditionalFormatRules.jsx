// ════════════════════════════════════════════════════════════════
// ConditionalFormatRules.jsx — শর্তভিত্তিক সারি রং ব্যবস্থাপনা কম্পোনেন্ট
// সেটিংস পেজে ব্যবহারের জন্য — রুল যোগ, মুছা, সক্রিয়/নিষ্ক্রিয়, ক্রম পরিবর্তন
// ════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Card from "./Card";
import Button from "./Button";
import {
  Plus, Trash2, ChevronUp, ChevronDown, ToggleLeft, ToggleRight,
} from "lucide-react";
import {
  getRules, saveRules, AVAILABLE_COLORS, OPERATORS,
} from "../../lib/conditionalFormat";

// ── ইউনিক আইডি তৈরি করার ফাংশন ──
const uid = () => `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── ভ্যালু ইনপুট দরকার নেই এমন অপারেটর ──
const NO_VALUE_OPS = ["is_empty", "is_not_empty", "before_today", "after_today"];

export default function ConditionalFormatRules({ module, fields = [] }) {
  const t = useTheme();

  // ── রুল স্টেট — localStorage থেকে লোড ──
  const [rules, setRules] = useState(() => getRules(module));

  // ── নতুন রুল ফর্মের স্টেট ──
  const [form, setForm] = useState({
    field: fields[0]?.key || "",
    operator: "equals",
    value: "",
    color: AVAILABLE_COLORS[0].value,
    label: "",
  });

  // ── রুল পরিবর্তন হলে localStorage-এ সেভ ──
  useEffect(() => {
    saveRules(module, rules);
  }, [rules, module]);

  // ── মডিউল পরিবর্তন হলে রুল রিফ্রেশ ──
  useEffect(() => {
    setRules(getRules(module));
    setForm((f) => ({ ...f, field: fields[0]?.key || "" }));
  }, [module]);

  // ═══════════════════════════════════════════
  // নতুন রুল যোগ করা
  // ═══════════════════════════════════════════
  const addRule = () => {
    // ভ্যালিডেশন — ফিল্ড ও ভ্যালু (প্রয়োজন হলে) চেক
    if (!form.field) return;
    if (!NO_VALUE_OPS.includes(form.operator) && !form.value.trim()) return;

    const newRule = {
      id: uid(),
      module,
      field: form.field,
      operator: form.operator,
      value: form.value,
      color: form.color,
      label: form.label || generateLabel(form),
      enabled: true,
    };

    setRules((prev) => [...prev, newRule]);
    // ফর্ম রিসেট
    setForm({ field: fields[0]?.key || "", operator: "equals", value: "", color: AVAILABLE_COLORS[0].value, label: "" });
  };

  // ── অটো-লেবেল তৈরি — ফিল্ড + অপারেটর + ভ্যালু থেকে ──
  const generateLabel = (f) => {
    const fieldLabel = fields.find((x) => x.key === f.field)?.label || f.field;
    const opLabel = OPERATORS.find((x) => x.value === f.operator)?.label || f.operator;
    if (NO_VALUE_OPS.includes(f.operator)) return `${fieldLabel} ${opLabel}`;
    return `${fieldLabel} ${opLabel} "${f.value}"`;
  };

  // ═══════════════════════════════════════════
  // রুল মুছে ফেলা
  // ═══════════════════════════════════════════
  const deleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // ═══════════════════════════════════════════
  // রুল সক্রিয়/নিষ্ক্রিয় টগল
  // ═══════════════════════════════════════════
  const toggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  // ═══════════════════════════════════════════
  // রুল ক্রম পরিবর্তন — উপরে/নিচে সরানো
  // ═══════════════════════════════════════════
  const moveRule = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= rules.length) return;
    const updated = [...rules];
    // দুটি রুলের অবস্থান অদলবদল
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setRules(updated);
  };

  // ═══════════════════════════════════════════
  // শেয়ারড ইনপুট স্টাইল
  // ═══════════════════════════════════════════
  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
  };

  return (
    <Card delay={50}>
      {/* ── শিরোনাম ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold" style={{ color: t.text }}>
            শর্তভিত্তিক সারি রং
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>
            নির্দিষ্ট শর্ত মিললে সারির ব্যাকগ্রাউন্ড রং বদলে যাবে। প্রথম ম্যাচই কার্যকর হবে।
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* বিদ্যমান রুল তালিকা                         */}
      {/* ════════════════════════════════════════════ */}
      {rules.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {rules.map((rule, idx) => {
            // রুলের ফিল্ডের বাংলা লেবেল বের করা
            const fieldLabel = fields.find((f) => f.key === rule.field)?.label || rule.field;
            const opLabel = OPERATORS.find((o) => o.value === rule.operator)?.label || rule.operator;
            // রুলের প্রিভিউ রং বের করা
            const previewColor = AVAILABLE_COLORS.find((c) => c.value === rule.color)?.preview || "#888";

            return (
              <div
                key={rule.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                style={{
                  background: rule.enabled ? rule.color : "transparent",
                  border: `1px solid ${t.border}`,
                  opacity: rule.enabled ? 1 : 0.5,
                }}
              >
                {/* রং প্রিভিউ বর্গ */}
                <div
                  className="w-3.5 h-3.5 rounded shrink-0"
                  style={{ background: previewColor }}
                />

                {/* রুলের বিবরণ */}
                <div className="flex-1 min-w-0 truncate" style={{ color: t.text }}>
                  <span className="font-medium">{rule.label || `${fieldLabel} ${opLabel}`}</span>
                </div>

                {/* ── উপরে/নিচে সরানোর বাটন ── */}
                <button
                  onClick={() => moveRule(idx, -1)}
                  disabled={idx === 0}
                  className="p-0.5 rounded hover:opacity-80 disabled:opacity-20"
                  title="উপরে সরান"
                >
                  <ChevronUp size={13} style={{ color: t.muted }} />
                </button>
                <button
                  onClick={() => moveRule(idx, 1)}
                  disabled={idx === rules.length - 1}
                  className="p-0.5 rounded hover:opacity-80 disabled:opacity-20"
                  title="নিচে সরান"
                >
                  <ChevronDown size={13} style={{ color: t.muted }} />
                </button>

                {/* ── সক্রিয়/নিষ্ক্রিয় টগল ── */}
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="p-0.5 rounded hover:opacity-80"
                  title={rule.enabled ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                >
                  {rule.enabled ? (
                    <ToggleRight size={18} style={{ color: t.emerald }} />
                  ) : (
                    <ToggleLeft size={18} style={{ color: t.muted }} />
                  )}
                </button>

                {/* ── মুছুন বাটন ── */}
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-0.5 rounded hover:opacity-80"
                  title="মুছুন"
                >
                  <Trash2 size={13} style={{ color: t.rose }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── রুল না থাকলে খালি মেসেজ ── */}
      {rules.length === 0 && (
        <div
          className="text-center py-6 mb-4 rounded-xl"
          style={{ background: t.inputBg, border: `1px dashed ${t.border}` }}
        >
          <p className="text-xs" style={{ color: t.muted }}>
            কোনো শর্ত যোগ করা হয়নি
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* নতুন রুল যোগ করার ফর্ম                      */}
      {/* ════════════════════════════════════════════ */}
      <div
        className="p-3 rounded-xl space-y-3"
        style={{ background: t.inputBg, border: `1px solid ${t.border}` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: t.muted }}>
          নতুন শর্ত যোগ করুন
        </p>

        {/* ── প্রথম সারি: ফিল্ড + অপারেটর + ভ্যালু ── */}
        <div className="flex flex-wrap gap-2">
          {/* ফিল্ড ড্রপডাউন */}
          <select
            value={form.field}
            onChange={(e) => setForm({ ...form, field: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none min-w-[120px]"
            style={inputStyle}
          >
            {fields.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          {/* অপারেটর ড্রপডাউন */}
          <select
            value={form.operator}
            onChange={(e) => setForm({ ...form, operator: e.target.value })}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none min-w-[100px]"
            style={inputStyle}
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          {/* ভ্যালু ইনপুট — শুধু প্রয়োজন হলে দেখায় */}
          {!NO_VALUE_OPS.includes(form.operator) && (
            <input
              type="text"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              placeholder="মান লিখুন..."
              className="px-2.5 py-1.5 rounded-lg text-xs outline-none flex-1 min-w-[100px]"
              style={inputStyle}
            />
          )}
        </div>

        {/* ── দ্বিতীয় সারি: লেবেল ইনপুট ── */}
        <input
          type="text"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="লেবেল (ঐচ্ছিক — স্বয়ংক্রিয়ভাবে তৈরি হবে)"
          className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none"
          style={inputStyle}
        />

        {/* ── তৃতীয় সারি: রং নির্বাচন + যোগ বাটন ── */}
        <div className="flex items-center justify-between gap-3">
          {/* রং সোয়াচ গ্রিড — ক্লিক করে নির্বাচন */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] mr-1" style={{ color: t.muted }}>
              রং:
            </span>
            {AVAILABLE_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setForm({ ...form, color: c.value })}
                className="w-5 h-5 rounded-md transition-all"
                title={c.label}
                style={{
                  background: c.preview,
                  // নির্বাচিত রঙে বর্ডার দেখায়
                  outline: form.color === c.value ? `2px solid ${c.preview}` : "2px solid transparent",
                  outlineOffset: "1px",
                  opacity: form.color === c.value ? 1 : 0.6,
                }}
              />
            ))}
          </div>

          {/* যোগ করুন বাটন */}
          <Button icon={Plus} size="xs" onClick={addRule}>
            যোগ করুন
          </Button>
        </div>
      </div>
    </Card>
  );
}
