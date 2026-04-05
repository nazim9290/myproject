/* ─── রিইউজেবল ডিলিট কনফার্মেশন মোডাল ─── */
/* যেকোনো পেজ থেকে ডিলিট অ্যাকশনের আগে কনফার্মেশন নেওয়ার জন্য ব্যবহৃত হয় */
/* Modal, Button, useTheme এবং AlertTriangle আইকন ব্যবহার করে */

import { AlertTriangle, Loader2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Modal from "./Modal";
import Button from "./Button";

/**
 * ডিলিট কনফার্ম মোডাল কম্পোনেন্ট
 * @param {boolean} isOpen — মোডাল খোলা/বন্ধ স্টেট
 * @param {function} onClose — মোডাল বন্ধ করার ফাংশন
 * @param {function} onConfirm — ডিলিট নিশ্চিত করলে কল হবে
 * @param {string} title — মোডাল টাইটেল (ডিফল্ট: "ডিলিট নিশ্চিতকরণ")
 * @param {string} message — সতর্কতা বার্তা (ডিফল্ট: "এই কাজ undo করা যাবে না।")
 * @param {string} itemName — যে আইটেম ডিলিট হবে তার নাম (ঐচ্ছিক)
 * @param {boolean} loading — ডিলিট প্রসেসিং চলছে কিনা
 */
export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "ডিলিট নিশ্চিতকরণ",
  message = "এই কাজ undo করা যাবে না।",
  itemName,
  loading = false,
}) {
  /* ─── থিম কালার ─── */
  const t = useTheme();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
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
          {message}
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
            বাতিল
          </Button>

          {/* ডিলিট বাটন — লাল ব্যাকগ্রাউন্ড */}
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1.5 font-medium rounded-xl text-xs px-3.5 py-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: t.rose, color: "#fff" }}
          >
            {/* লোডিং স্পিনার বা ডিলিট টেক্সট ─── */}
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              "হ্যাঁ, মুছুন"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
