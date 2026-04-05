/* ─── রিইউজেবল ExportModal কম্পোনেন্ট ─── */
/* CSV এক্সপোর্টের আগে ইউজার কলাম সিলেক্ট করতে পারে */
/* BOM সহ CSV জেনারেট করে — বাংলা টেক্সট Excel-এ সঠিকভাবে দেখায় */
/* ফোন নম্বর কলামে leading zero রক্ষা করে (="01712345678" ফরম্যাট) */

import { useState, useEffect, useMemo } from "react";
import { Download, CheckSquare, Square, ToggleLeft, ToggleRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
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

  /* ─── সিলেক্টেড কলামের key গুলো ট্র্যাক করা ─── */
  const [selectedKeys, setSelectedKeys] = useState([]);

  /* ─── Modal ওপেন হলে সব কলাম সিলেক্ট করে দাও ─── */
  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(columns.map((c) => c.key));
    }
  }, [isOpen, columns]);

  /* ─── সব সিলেক্ট আছে কিনা চেক ─── */
  const allSelected = selectedKeys.length === columns.length && columns.length > 0;

  /* ─── Select All / Deselect All টগল ─── */
  const toggleAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(columns.map((c) => c.key));
    }
  };

  /* ─── একটি কলাম টগল করা ─── */
  const toggleColumn = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  /* ─── ফোন/WhatsApp কলাম কিনা চেক ─── */
  const isPhoneKey = (key) => {
    const lower = key.toLowerCase();
    return lower.includes("phone") || lower.includes("whatsapp");
  };

  /* ─── সিলেক্টেড কলাম অবজেক্ট লিস্ট ─── */
  const selectedColumns = useMemo(
    () => columns.filter((c) => selectedKeys.includes(c.key)),
    [columns, selectedKeys]
  );

  /* ─── CSV জেনারেট ও ডাউনলোড ─── */
  const handleExport = () => {
    if (selectedColumns.length === 0) return;

    /* হেডার তৈরি */
    const header = selectedColumns.map((c) => c.label).join(",");

    /* প্রতিটি রো-এর ডেটা CSV ফরম্যাটে রূপান্তর */
    const rows = data.map((row) =>
      selectedColumns
        .map((col) => {
          let val = row[col.key];

          /* null/undefined হলে খালি স্ট্রিং */
          if (val == null) return "";

          val = String(val);

          /* ফোন নম্বর কলামে leading zero রক্ষা — Excel-এ ="01712345678" ফরম্যাট */
          if (isPhoneKey(col.key) && val) {
            return `="` + val.replace(/"/g, '""') + `"`;
          }

          /* কমা বা ডাবল কোট থাকলে কোট দিয়ে মুড়িয়ে দাও */
          if (val.includes(",") || val.includes('"') || val.includes("\n")) {
            return '"' + val.replace(/"/g, '""') + '"';
          }

          return val;
        })
        .join(",")
    );

    /* BOM + CSV তৈরি — বাংলা টেক্সট Excel-এ সঠিকভাবে দেখানোর জন্য */
    const csv = header + "\n" + rows.join("\n");
    const blob = new Blob([String.fromCharCode(0xfeff) + csv], {
      type: "text/csv;charset=utf-8",
    });

    /* ডাউনলোড লিংক তৈরি ও ক্লিক */
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`,
    });
    a.click();

    /* কলব্যাক — এক্সপোর্ট সম্পন্ন */
    if (onExport) onExport(data.length);

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {/* ─── উপরের অংশ: রো কাউন্ট + Select All টগল ─── */}
        <div className="flex items-center justify-between">
          {/* কতটি রো এক্সপোর্ট হবে */}
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${t.cyan}20`, color: t.cyan }}
            >
              {data.length} রো
            </span>
            <span className="text-xs" style={{ color: t.muted }}>
              এক্সপোর্ট হবে
            </span>
          </div>

          {/* Select All / Deselect All বাটন */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
            style={{ color: t.cyan }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${t.cyan}10`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {allSelected ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            {allSelected ? "সব বাদ দিন" : "সব নির্বাচন"}
          </button>
        </div>

        {/* ─── সিলেক্টেড কাউন্ট ব্যাজ ─── */}
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${t.emerald}20`, color: t.emerald }}
          >
            {selectedKeys.length}/{columns.length}
          </span>
          <span className="text-xs" style={{ color: t.muted }}>
            কলাম নির্বাচিত
          </span>
        </div>

        {/* ─── কলাম চেকবক্স লিস্ট — স্ক্রলযোগ্য ─── */}
        <div
          className="rounded-xl p-1 overflow-y-auto"
          style={{
            maxHeight: "300px",
            background: t.inputBg,
            border: `1px solid ${t.inputBorder}`,
          }}
        >
          {columns.map((col) => {
            const checked = selectedKeys.includes(col.key);
            return (
              <label
                key={col.key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                style={{ color: t.text }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* কাস্টম চেকবক্স আইকন */}
                {checked ? (
                  <CheckSquare size={15} style={{ color: t.cyan, flexShrink: 0 }} />
                ) : (
                  <Square size={15} style={{ color: t.muted, flexShrink: 0 }} />
                )}

                {/* হিডেন নেটিভ চেকবক্স — অ্যাক্সেসিবিলিটির জন্য */}
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleColumn(col.key)}
                  className="sr-only"
                />

                <span className="text-xs">{col.label}</span>

                {/* ফোন কলাম হলে ব্যাজ দেখাও */}
                {isPhoneKey(col.key) && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto"
                    style={{ background: `${t.amber}20`, color: t.amber }}
                  >
                    ফোন
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {/* ─── ফুটার: বাতিল + এক্সপোর্ট বাটন ─── */}
        <div
          className="flex items-center justify-end gap-2 pt-3"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button
            icon={Download}
            onClick={handleExport}
            className={selectedKeys.length === 0 ? "opacity-50 pointer-events-none" : ""}
          >
            এক্সপোর্ট ({selectedKeys.length} কলাম)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
