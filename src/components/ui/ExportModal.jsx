/* ─── ExportModal — CSV এক্সপোর্ট, কলাম সিলেক্ট ও drag reorder ─── */
/* BOM সহ CSV জেনারেট করে — বাংলা টেক্সট Excel-এ সঠিকভাবে দেখায় */
/* ফোন নম্বর কলামে leading zero রক্ষা করে */
/* Drag & Drop দিয়ে কলাম order পরিবর্তন করা যায় */

import { useState, useEffect, useMemo, useRef } from "react";
import { Download, CheckSquare, Square, ToggleLeft, ToggleRight, GripVertical } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import Modal from "./Modal";
import Button from "./Button";

export default function ExportModal({
  isOpen,
  onClose,
  columns = [],
  data = [],
  fileName = "export",
  onExport,
  title = "Export Data",
}) {
  const t = useTheme();
  const { t: tr } = useLanguage();

  // ── Ordered columns — drag reorder state ──
  const [orderedKeys, setOrderedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  // Modal open হলে সব column select + default order
  useEffect(() => {
    if (isOpen && columns.length > 0) {
      setOrderedKeys(columns.map(c => c.key));
      setSelectedKeys(new Set(columns.map(c => c.key)));
    }
  }, [isOpen, columns]);

  const allSelected = selectedKeys.size === columns.length && columns.length > 0;

  const toggleAll = () => {
    if (allSelected) setSelectedKeys(new Set());
    else setSelectedKeys(new Set(columns.map(c => c.key)));
  };

  const toggleColumn = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const isPhoneKey = (key) => /phone|whatsapp/i.test(key);

  // ── Drag & Drop reorder ──
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (idx) => { dragItem.current = idx; };
  const handleDragOver = (e, idx) => { e.preventDefault(); dragOverItem.current = idx; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...orderedKeys];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    setOrderedKeys(items);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // ── Group select helpers ──
  const groups = useMemo(() => {
    const map = {};
    columns.forEach(c => {
      const g = c.group || "Other";
      if (!map[g]) map[g] = [];
      map[g].push(c.key);
    });
    return map;
  }, [columns]);

  const toggleGroup = (groupKeys) => {
    const allIn = groupKeys.every(k => selectedKeys.has(k));
    setSelectedKeys(prev => {
      const next = new Set(prev);
      groupKeys.forEach(k => allIn ? next.delete(k) : next.add(k));
      return next;
    });
  };

  // ── Selected columns in ordered order ──
  const selectedColumns = useMemo(
    () => orderedKeys.filter(k => selectedKeys.has(k)).map(k => columns.find(c => c.key === k)).filter(Boolean),
    [orderedKeys, selectedKeys, columns]
  );

  // ── CSV generate ──
  const handleExport = () => {
    if (selectedColumns.length === 0) return;
    const header = selectedColumns.map(c => c.label).join(",");
    const rows = data.map(row =>
      selectedColumns.map(col => {
        let val = row[col.key];
        if (val == null) return "";
        val = String(val);
        if (isPhoneKey(col.key) && val) return `="` + val.replace(/"/g, '""') + `"`;
        if (val.includes(",") || val.includes('"') || val.includes("\n")) return '"' + val.replace(/"/g, '""') + '"';
        return val;
      }).join(",")
    );
    const csv = header + "\n" + rows.join("\n");
    const blob = new Blob([String.fromCharCode(0xfeff) + csv], { type: "text/csv;charset=utf-8" });
    Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${fileName}_${new Date().toISOString().slice(0, 10)}.csv` }).click();
    if (onExport) onExport(data.length);
    onClose();
  };

  // Column lookup
  const colMap = useMemo(() => Object.fromEntries(columns.map(c => [c.key, c])), [columns]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        {/* Header stats */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${t.cyan}20`, color: t.cyan }}>
              {data.length} {tr("common.total")}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${t.emerald}20`, color: t.emerald }}>
              {selectedKeys.size}/{columns.length} columns
            </span>
          </div>
          <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg" style={{ color: t.cyan }}
            onMouseEnter={e => e.currentTarget.style.background = `${t.cyan}10`} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            {allSelected ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {allSelected ? tr("common.noneSelected") : tr("common.selectAll")}
          </button>
        </div>

        {/* Group quick-select buttons */}
        {Object.keys(groups).length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(groups).map(([group, keys]) => {
              const allIn = keys.every(k => selectedKeys.has(k));
              return (
                <button key={group} onClick={() => toggleGroup(keys)}
                  className="text-[10px] px-2 py-1 rounded-lg transition"
                  style={{ background: allIn ? `${t.cyan}15` : t.inputBg, color: allIn ? t.cyan : t.muted, border: `1px solid ${allIn ? t.cyan + "40" : t.inputBorder}` }}>
                  {allIn ? "✓" : ""} {group} ({keys.length})
                </button>
              );
            })}
          </div>
        )}

        {/* Reorderable column list */}
        <div className="rounded-xl overflow-y-auto" style={{ maxHeight: "350px", background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
          {orderedKeys.map((key, idx) => {
            const col = colMap[key];
            if (!col) return null;
            const checked = selectedKeys.has(key);
            return (
              <div key={key}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={handleDrop}
                className="flex items-center gap-2 px-2 py-1.5 cursor-grab active:cursor-grabbing transition-colors"
                style={{ opacity: checked ? 1 : 0.4, borderBottom: `1px solid ${t.border}20` }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Drag handle */}
                <GripVertical size={12} style={{ color: t.muted, flexShrink: 0 }} />
                {/* Order number */}
                <span className="text-[9px] w-5 text-center font-mono" style={{ color: t.muted }}>{idx + 1}</span>
                {/* Checkbox */}
                <button onClick={() => toggleColumn(key)} className="shrink-0">
                  {checked ? <CheckSquare size={14} style={{ color: t.cyan }} /> : <Square size={14} style={{ color: t.muted }} />}
                </button>
                {/* Label */}
                <span className="text-xs flex-1">{col.label}</span>
                {/* Group badge */}
                {col.group && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.muted}15`, color: t.muted }}>{col.group}</span>}
                {/* Phone badge */}
                {isPhoneKey(key) && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${t.amber}20`, color: t.amber }}>Phone</span>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
          <p className="text-[10px]" style={{ color: t.muted }}>
            ↕ Drag to reorder columns
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>{tr("common.cancel")}</Button>
            <Button icon={Download} onClick={handleExport} disabled={selectedKeys.size === 0}>
              {tr("common.export")} ({selectedKeys.size})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
