/* ─── ColumnCustomizer — টেবিল কলাম দেখানো/লুকানো ও ক্রম পরিবর্তন ─── */
/* localStorage-এ persist হয় — পরবর্তী সেশনে মনে রাখে */
/* Drag & Drop দিয়ে কলাম reorder + checkbox দিয়ে toggle visibility */

import { useState, useRef, useEffect } from "react";
import { Settings2, GripVertical, RotateCcw, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

/**
 * @param {Object} props
 * @param {Array<{key:string, label:string}>} props.columns — সব available কলামের তালিকা
 * @param {string[]} props.visibleKeys — বর্তমানে দৃশ্যমান কলামের key তালিকা (ordered)
 * @param {(keys: string[]) => void} props.onChange — visible+ordered keys পরিবর্তন হলে callback
 * @param {string[]} props.defaultKeys — ডিফল্ট কলাম keys (reset বাটনের জন্য)
 */
export default function ColumnCustomizer({ columns, visibleKeys, onChange, defaultKeys }) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // ── বাইরে ক্লিক করলে বন্ধ হবে ──
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── কলাম toggle — visible হলে সরিয়ে দাও, না থাকলে যোগ করো ──
  const toggle = (key) => {
    if (visibleKeys.includes(key)) {
      // কমপক্ষে ১টা কলাম থাকতে হবে
      if (visibleKeys.length <= 1) return;
      onChange(visibleKeys.filter(k => k !== key));
    } else {
      onChange([...visibleKeys, key]);
    }
  };

  // ── Drag & Drop reorder ──
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragOver = (e, idx) => { e.preventDefault(); dragOverItem.current = idx; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...visibleKeys];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    onChange(items);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // ── সব কলাম ordered list — visible গুলো আগে (তাদের order-এ), তারপর hidden ──
  const orderedAll = [
    ...visibleKeys.map(k => columns.find(c => c.key === k)).filter(Boolean),
    ...columns.filter(c => !visibleKeys.includes(c.key)),
  ];

  return (
    <div className="relative" ref={ref}>
      {/* ── গিয়ার বাটন ── */}
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition"
        style={{
          background: open ? `${t.cyan}15` : t.inputBg,
          border: `1px solid ${open ? t.cyan : t.inputBorder}`,
          color: open ? t.cyan : t.muted,
        }}
        title={tr("common.columnSettings")}
      >
        <Settings2 size={13} />
        <span>{tr("common.columns")}</span>
      </button>

      {/* ── ড্রপডাউন প্যানেল ── */}
      {open && (
        <div
          className="absolute right-0 top-9 z-50 rounded-xl shadow-xl overflow-hidden"
          style={{
            background: t.cardSolid || t.card,
            border: `1px solid ${t.border}`,
            width: 260,
            maxHeight: 420,
          }}
        >
          {/* ── হেডার ── */}
          <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <span className="text-xs font-semibold" style={{ color: t.text }}>{tr("common.columnSettings")}</span>
            <button
              onClick={() => onChange([...defaultKeys])}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition"
              style={{ color: t.muted, background: t.inputBg }}
              title={tr("common.resetDefault")}
            >
              <RotateCcw size={10} />
              {tr("common.resetDefault")}
            </button>
          </div>

          {/* ── কলাম তালিকা ── */}
          <div className="overflow-y-auto" style={{ maxHeight: 350 }}>
            <p className="text-[9px] uppercase tracking-wider px-3 pt-2 pb-1" style={{ color: t.muted }}>
              {tr("common.dragToReorder")}
            </p>
            {orderedAll.map((col, idx) => {
              const isVisible = visibleKeys.includes(col.key);
              const visibleIdx = visibleKeys.indexOf(col.key);
              return (
                <div
                  key={col.key}
                  draggable={isVisible}
                  onDragStart={() => handleDragStart(visibleIdx)}
                  onDragOver={(e) => handleDragOver(e, visibleIdx)}
                  onDrop={handleDrop}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition"
                  style={{
                    background: isVisible ? "transparent" : `${t.muted}05`,
                    opacity: isVisible ? 1 : 0.5,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = isVisible ? "transparent" : `${t.muted}05`}
                  onClick={() => toggle(col.key)}
                >
                  {/* ড্র্যাগ হ্যান্ডেল — শুধু visible কলামে */}
                  {isVisible ? (
                    <GripVertical size={12} style={{ color: t.muted, cursor: "grab", flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 12, flexShrink: 0 }} />
                  )}

                  {/* আই আইকন — toggle */}
                  {isVisible ? (
                    <Eye size={12} style={{ color: t.cyan, flexShrink: 0 }} />
                  ) : (
                    <EyeOff size={12} style={{ color: t.muted, flexShrink: 0 }} />
                  )}

                  {/* কলাম নাম */}
                  <span className="text-xs flex-1" style={{ color: isVisible ? t.text : t.muted }}>
                    {col.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
