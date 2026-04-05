// ════════════════════════════════════════════════════════════════
// TableInsights.jsx — টেবিল বিশ্লেষণ কম্পোনেন্ট
// যেকোনো ডেটা টেবিলের উপরে বসিয়ে কুইক স্ট্যাটস, গ্রুপ বাই,
// এবং শর্তভিত্তিক ফর্ম্যাটিং রুলস একসাথে দেখায়
// ════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { BarChart3, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import ConditionalFormatRules from "./ConditionalFormatRules";

// ── ইউনিক ভ্যালু গণনার সীমা — এর বেশি হলে ক্যাটেগরিক্যাল হিসেবে গণ্য হবে না ──
const MAX_UNIQUE_FOR_CATEGORICAL = 20;

// ── কুইক স্ট্যাটসে সর্বোচ্চ কতটি ফিল্ড দেখাবে ──
const MAX_STAT_FIELDS = 3;

// ── প্রতিটি স্ট্যাট ফিল্ডে সর্বোচ্চ কতটি মান দেখাবে ──
const MAX_VALUES_PER_STAT = 6;

// ═══════════════════════════════════════════════════════════════
// হেল্পার: একটি ফিল্ডের ভ্যালু অনুযায়ী গ্রুপ করে গণনা বের করে
// ═══════════════════════════════════════════════════════════════
function groupByField(data, fieldKey) {
  const counts = {};
  data.forEach((row) => {
    // নেস্টেড ফিল্ড সাপোর্ট — "address.city" → row.address.city
    const raw = fieldKey.split(".").reduce((obj, k) => obj?.[k], row);
    // খালি মান হলে "(খালি)" দেখাবে
    const val = raw == null || raw === "" ? "(খালি)" : String(raw);
    counts[val] = (counts[val] || 0) + 1;
  });

  const total = data.length || 1;
  // গণনা অনুযায়ী সাজানো — বেশি গণনা আগে
  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      pct: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ═══════════════════════════════════════════════════════════════
// হেল্পার: ক্যাটেগরিক্যাল ফিল্ড শনাক্তকরণ
// (<= MAX_UNIQUE ইউনিক ভ্যালু থাকলে ক্যাটেগরিক্যাল)
// ═══════════════════════════════════════════════════════════════
function findCategoricalFields(data, fields) {
  if (!data.length || !fields.length) return [];

  return fields
    .map((field) => {
      const uniqueValues = new Set();
      let nonEmptyCount = 0;

      for (const row of data) {
        const raw = field.key.split(".").reduce((obj, k) => obj?.[k], row);
        if (raw != null && raw !== "") {
          uniqueValues.add(String(raw));
          nonEmptyCount++;
        }
        // অপ্টিমাইজেশন — অনেক ইউনিক মান পেলে তাড়াতাড়ি বের হবে
        if (uniqueValues.size > MAX_UNIQUE_FOR_CATEGORICAL) break;
      }

      return {
        ...field,
        uniqueCount: uniqueValues.size,
        nonEmptyCount,
      };
    })
    // শুধু ক্যাটেগরিক্যাল ফিল্ড রাখা (২+ ইউনিক ভ্যালু, <= MAX সীমা)
    .filter(
      (f) =>
        f.uniqueCount >= 2 && f.uniqueCount <= MAX_UNIQUE_FOR_CATEGORICAL
    )
    // সবচেয়ে কম ইউনিক (বেশি সংক্ষিপ্ত ব্রেকডাউন) আগে
    .sort((a, b) => a.uniqueCount - b.uniqueCount);
}

// ═══════════════════════════════════════════════════════════════
// মূল কম্পোনেন্ট
// ═══════════════════════════════════════════════════════════════
export default function TableInsights({
  module,
  data = [],
  fields = [],
  onRulesChange,
}) {
  const t = useTheme();

  // ── প্যানেল টগল স্টেট ──
  const [showStats, setShowStats] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [groupByKey, setGroupByKey] = useState("");

  // ═══════════════════════════════════════════
  // গ্রুপ বাই ফলাফল — নির্বাচিত ফিল্ড অনুযায়ী গণনা
  // ═══════════════════════════════════════════
  const groupedData = useMemo(() => {
    if (!groupByKey || !data.length) return [];
    return groupByField(data, groupByKey);
  }, [data, groupByKey]);

  // ═══════════════════════════════════════════
  // অটো স্ট্যাটস — ক্যাটেগরিক্যাল ফিল্ড শনাক্ত করে
  // শীর্ষ ৩টি ফিল্ডের ব্রেকডাউন তৈরি করে
  // ═══════════════════════════════════════════
  const autoStats = useMemo(() => {
    if (!data.length || !fields.length) return [];

    const categorical = findCategoricalFields(data, fields);
    // শীর্ষ MAX_STAT_FIELDS টি ফিল্ড নেওয়া
    return categorical.slice(0, MAX_STAT_FIELDS).map((field) => ({
      field,
      groups: groupByField(data, field.key).slice(0, MAX_VALUES_PER_STAT),
    }));
  }, [data, fields]);

  // ── থিম অনুযায়ী অ্যাকসেন্ট রং তালিকা — বার চার্টে ব্যবহার ──
  const accentColors = useMemo(
    () => [t.cyan, t.emerald, t.amber, t.purple, t.rose, t.textSecondary],
    [t]
  );

  // ── শেয়ারড ইনপুট স্টাইল ──
  const inputStyle = {
    background: t.inputBg,
    border: `1px solid ${t.inputBorder}`,
    color: t.text,
  };

  // ═══════════════════════════════════════════════════════════════
  // রেন্ডার
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="space-y-2.5">
      {/* ════════════════════════════════════════════ */}
      {/* টুলবার — গ্রুপ বাই ড্রপডাউন + স্ট্যাটস + রুলস বাটন */}
      {/* ════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* ── গ্রুপ বাই ড্রপডাউন ── */}
        <select
          value={groupByKey}
          onChange={(e) => setGroupByKey(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl text-xs outline-none"
          style={inputStyle}
        >
          <option value="">গ্রুপ বাই: নেই</option>
          {fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>

        {/* ── কুইক স্ট্যাটস টগল বাটন ── */}
        <button
          onClick={() => setShowStats((p) => !p)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200"
          style={{
            background: showStats ? `${t.cyan}18` : t.inputBg,
            border: `1px solid ${showStats ? `${t.cyan}40` : t.inputBorder}`,
            color: showStats ? t.cyan : t.muted,
          }}
          title="কুইক স্ট্যাটস দেখুন"
        >
          <BarChart3 size={13} />
          স্ট্যাটস
          {showStats ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* ── শর্তভিত্তিক ফর্ম্যাট রুলস টগল বাটন ── */}
        <button
          onClick={() => setShowRules((p) => !p)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all duration-200"
          style={{
            background: showRules ? `${t.purple}18` : t.inputBg,
            border: `1px solid ${showRules ? `${t.purple}40` : t.inputBorder}`,
            color: showRules ? t.purple : t.muted,
          }}
          title="শর্তভিত্তিক সারি রং"
        >
          <Settings size={13} />
          রুলস
          {showRules ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* ── ডেটা সারাংশ ── */}
        {data.length > 0 && (
          <span
            className="text-[10px] ml-auto"
            style={{ color: t.muted }}
          >
            মোট: <strong style={{ color: t.text }}>{data.length}</strong> রেকর্ড
          </span>
        )}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* গ্রুপ বাই ফলাফল — নির্বাচিত থাকলে দেখায়   */}
      {/* ════════════════════════════════════════════ */}
      {groupByKey && groupedData.length > 0 && (
        <div
          className="rounded-xl p-3 anim-fade"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.border}`,
          }}
        >
          {/* ── গ্রুপ বাই শিরোনাম ── */}
          <p
            className="text-[10px] font-semibold uppercase tracking-wider mb-2.5"
            style={{ color: t.muted }}
          >
            {fields.find((f) => f.key === groupByKey)?.label || groupByKey}{" "}
            অনুযায়ী ({groupedData.length} গ্রুপ)
          </p>

          {/* ── গ্রুপ কার্ড গ্রিড ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {groupedData.map((g, idx) => (
              <div
                key={g.value}
                className="p-2.5 rounded-lg transition-all duration-200"
                style={{
                  background: t.cardSolid,
                  border: `1px solid ${t.border}`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = accentColors[idx % accentColors.length] + "60")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = t.border)
                }
              >
                {/* ── মান ও গণনা ── */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[11px] truncate max-w-[120px]"
                    style={{ color: t.text }}
                    title={g.value}
                  >
                    {g.value}
                  </span>
                  <span
                    className="text-[11px] font-bold shrink-0 ml-2"
                    style={{
                      color: accentColors[idx % accentColors.length],
                    }}
                  >
                    {g.count}
                  </span>
                </div>

                {/* ── মিনি প্রগ্রেস বার ── */}
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: `${t.border}` }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${g.pct}%`,
                      background: accentColors[idx % accentColors.length],
                    }}
                  />
                </div>

                {/* ── শতাংশ ── */}
                <p
                  className="text-[9px] mt-1 text-right"
                  style={{ color: t.muted }}
                >
                  {g.pct}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* কুইক স্ট্যাটস — অটো-শনাক্ত ক্যাটেগরিক্যাল ফিল্ডের ব্রেকডাউন */}
      {/* ════════════════════════════════════════════ */}
      {showStats && (
        <div
          className="rounded-xl p-3 anim-fade"
          style={{
            background: t.inputBg,
            border: `1px solid ${t.border}`,
          }}
        >
          {autoStats.length > 0 ? (
            <div className="space-y-4">
              {autoStats.map((stat, statIdx) => (
                <div key={stat.field.key}>
                  {/* ── ফিল্ড শিরোনাম ── */}
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: t.muted }}
                  >
                    {stat.field.label}
                  </p>

                  {/* ── ভ্যালু ব্রেকডাউন তালিকা ── */}
                  <div className="space-y-1.5">
                    {stat.groups.map((g) => {
                      // প্রতিটি স্ট্যাট ফিল্ডের জন্য আলাদা রং
                      const barColor = accentColors[statIdx % accentColors.length];
                      return (
                        <div key={g.value} className="flex items-center gap-2">
                          {/* মানের লেবেল */}
                          <span
                            className="text-[11px] w-[100px] truncate shrink-0"
                            style={{ color: t.textSecondary }}
                            title={g.value}
                          >
                            {g.value}
                          </span>

                          {/* প্রগ্রেস বার */}
                          <div
                            className="flex-1 h-[6px] rounded-full overflow-hidden"
                            style={{ background: `${t.border}` }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${g.pct}%`,
                                background: barColor,
                              }}
                            />
                          </div>

                          {/* গণনা ও শতাংশ */}
                          <span
                            className="text-[10px] w-[52px] text-right shrink-0"
                            style={{ color: t.muted }}
                          >
                            <strong style={{ color: t.text }}>
                              {g.count}
                            </strong>{" "}
                            ({g.pct}%)
                          </span>
                        </div>
                      );
                    })}

                    {/* ── বাকি মান থাকলে "+N আরও" দেখায় ── */}
                    {(() => {
                      const allGroups = groupByField(data, stat.field.key);
                      const remaining = allGroups.length - MAX_VALUES_PER_STAT;
                      if (remaining <= 0) return null;
                      return (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: t.muted }}
                        >
                          +{remaining} আরও...
                        </p>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ── পর্যাপ্ত ক্যাটেগরিক্যাল ডেটা না থাকলে ──
            <p className="text-xs text-center py-3" style={{ color: t.muted }}>
              পর্যাপ্ত ক্যাটেগরিক্যাল ডেটা নেই
            </p>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* শর্তভিত্তিক ফর্ম্যাটিং রুলস প্যানেল        */}
      {/* ════════════════════════════════════════════ */}
      {showRules && (
        <div className="anim-fade">
          <ConditionalFormatRules
            module={module}
            fields={fields}
          />
        </div>
      )}
    </div>
  );
}
