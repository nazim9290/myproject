/* ─── ColumnCustomizer — টেবিল কলাম দেখানো/লুকানো ও ক্রম পরিবর্তন ─── */
/* গ্রুপ হেডার সহ (Basic, Family, Education, JP Exam ইত্যাদি) */
/* Drag & Drop দিয়ে কলাম reorder + checkbox দিয়ে toggle visibility */

import { useState, useRef, useEffect, useMemo } from "react";
import { Settings2, GripVertical, RotateCcw, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

/**
 * @param {Object} props
 * @param {Array<{key:string, label:string, group?:string}>} props.columns — সব available কলাম
 * @param {string[]} props.visibleKeys — বর্তমানে দৃশ্যমান কলামের key তালিকা (ordered)
 * @param {(keys: string[]) => void} props.onChange — visible+ordered keys পরিবর্তন হলে callback
 * @param {string[]} props.defaultKeys — ডিফল্ট কলাম keys (reset বাটনের জন্য)
 */
export default function ColumnCustomizer({ columns, visibleKeys, onChange, defaultKeys }) {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const [open, setOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
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
      if (visibleKeys.length <= 1) return;
      onChange(visibleKeys.filter(k => k !== key));
    } else {
      onChange([...visibleKeys, key]);
    }
  };

  // ── গ্রুপ toggle — গ্রুপের সব কলাম একসাথে on/off ──
  const toggleGroup = (groupKeys) => {
    const allVisible = groupKeys.every(k => visibleKeys.includes(k));
    if (allVisible) {
      // সব বন্ধ করো (কমপক্ষে ১টা কলাম রাখো)
      const remaining = visibleKeys.filter(k => !groupKeys.includes(k));
      if (remaining.length === 0) return;
      onChange(remaining);
    } else {
      // সব চালু করো
      const newKeys = [...visibleKeys];
      groupKeys.forEach(k => { if (!newKeys.includes(k)) newKeys.push(k); });
      onChange(newKeys);
    }
  };

  // ── গ্রুপ collapse/expand ──
  const toggleCollapse = (group) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
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

  // ── গ্রুপ অনুযায়ী কলাম সাজানো ──
  const groups = useMemo(() => {
    const map = {};
    columns.forEach(c => {
      const g = c.group || "Other";
      if (!map[g]) map[g] = [];
      map[g].push(c);
    });
    return map;
  }, [columns]);

  const visibleCount = visibleKeys.length;

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
        <span>{tr("common.columns")} ({visibleCount})</span>
      </button>

      {/* ── ড্রপডাউন প্যানেল ── */}
      {open && (
        <div
          className="absolute right-0 top-9 z-50 rounded-xl shadow-xl overflow-hidden"
          style={{
            background: t.cardSolid || t.card,
            border: `1px solid ${t.border}`,
            width: 280,
            maxHeight: 480,
          }}
        >
          {/* ── হেডার ── */}
          <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${t.border}` }}>
            <span className="text-xs font-semibold" style={{ color: t.text }}>
              {tr("common.columnSettings")}
            </span>
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

          {/* ── গ্রুপ অনুযায়ী কলাম তালিকা ── */}
          <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
            {Object.entries(groups).map(([groupName, groupCols]) => {
              const groupKeys = groupCols.map(c => c.key);
              const visibleInGroup = groupKeys.filter(k => visibleKeys.includes(k)).length;
              const allVisible = visibleInGroup === groupKeys.length;
              const isCollapsed = collapsedGroups.has(groupName);

              return (
                <div key={groupName}>
                  {/* ── গ্রুপ হেডার ── */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
                    style={{ background: `${t.muted}08`, borderBottom: `1px solid ${t.border}` }}
                    onClick={() => toggleCollapse(groupName)}
                  >
                    {isCollapsed
                      ? <ChevronRight size={12} style={{ color: t.muted }} />
                      : <ChevronDown size={12} style={{ color: t.muted }} />
                    }
                    <span className="text-[10px] font-bold uppercase tracking-wider flex-1" style={{ color: t.textSecondary }}>
                      {groupName}
                    </span>
                    {/* গ্রুপ toggle বাটন */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleGroup(groupKeys); }}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: allVisible ? `${t.cyan}15` : "transparent",
                        color: allVisible ? t.cyan : t.muted,
                      }}
                    >
                      {visibleInGroup}/{groupKeys.length}
                    </button>
                  </div>

                  {/* ── গ্রুপের কলামগুলো ── */}
                  {!isCollapsed && groupCols.map(col => {
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
                        style={{ opacity: isVisible ? 1 : 0.5 }}
                        onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        onClick={() => toggle(col.key)}
                      >
                        {/* ড্র্যাগ হ্যান্ডেল */}
                        {isVisible ? (
                          <GripVertical size={11} style={{ color: t.muted, cursor: "grab", flexShrink: 0 }} />
                        ) : (
                          <span style={{ width: 11, flexShrink: 0 }} />
                        )}

                        {/* আই আইকন */}
                        {isVisible ? (
                          <Eye size={11} style={{ color: t.cyan, flexShrink: 0 }} />
                        ) : (
                          <EyeOff size={11} style={{ color: t.muted, flexShrink: 0 }} />
                        )}

                        {/* কলাম নাম */}
                        <span className="text-[11px] flex-1" style={{ color: isVisible ? t.text : t.muted }}>
                          {col.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
