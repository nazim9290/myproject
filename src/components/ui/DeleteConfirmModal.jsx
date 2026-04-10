/* ─── রিইউজেবল ডিলিট কনফার্মেশন মোডাল ─── */
/* যেকোনো পেজ থেকে ডিলিট অ্যাকশনের আগে কনফার্মেশন নেওয়ার জন্য ব্যবহৃত হয় */
/* Modal, Button, useTheme এবং AlertTriangle আইকন ব্যবহার করে */

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import Modal from "./Modal";
import Button from "./Button";

/**
 * ডিলিট কনফার্ম মোডাল কম্পোনেন্ট — i18n সাপোর্ট
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
}) {
  const t = useTheme();
  const { t: tr } = useLanguage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || tr("common.deleteConfirmTitle")} size="sm">
      <div className="flex flex-col items-center text-center py-2">

        {/* ─── সতর্কতা আইকন (লাল বৃত্তের মধ্যে) ─── */}
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full mb-4"
          style={{ background: `${t.rose}15` }}
        >
          <AlertTriangle size={28} style={{ color: t.rose }} />
        </div>

        {/* ─── আইটেমের নাম (যদি দেওয়া থাকে) ─── */}
        {itemName && (
          <p className="text-sm font-bold mb-1" style={{ color: t.text }}>
            "{itemName}"
          </p>
        )}

        {/* ─── সতর্কতা বার্তা ─── */}
        <p className="text-xs mb-5" style={{ color: t.muted }}>
          {message || tr("common.deleteConfirmMessage")}
        </p>

        {/* ─── অ্যাকশন বাটন — বাতিল ও ডিলিট ─── */}
        <div className="flex items-center gap-3 w-full">
          {/* বাতিল বাটন — ghost variant */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-1 justify-center"
          >
            {tr("common.cancel")}
          </Button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 font-medium rounded-xl text-xs px-3.5 py-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: t.rose, color: "#fff" }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              tr("common.yesDelete")
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
