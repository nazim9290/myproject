/* ─── রিইউজেবল Modal কম্পোনেন্ট ─── */
/* React Portal ব্যবহার করে body-তে রেন্ডার হয় */
/* isOpen, onClose, title, subtitle, size (sm/md/lg/xl/full) প্রপস সাপোর্ট করে */

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/* ─── সাইজ ম্যাপিং ─── */
const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-6xl",
};

export default function Modal({ isOpen, onClose, title, subtitle, size = "md", children }) {
  const t = useTheme();
  const overlayRef = useRef(null);
  /* ─── প্রতিটি Modal ইনস্ট্যান্সের জন্য ইউনিক ID ─── */
  const modalId = useId();

  /* ─── Escape কী দিয়ে বন্ধ + body scroll বন্ধ ─── */
  /* শুধুমাত্র সবচেয়ে উপরের (topmost) modal ESC-এ বন্ধ হবে */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") {
        const allModals = document.querySelectorAll("[data-modal]");
        if (allModals.length > 0 && allModals[allModals.length - 1]?.getAttribute("data-modal") === modalId) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      /* শুধুমাত্র শেষ modal বন্ধ হলে body scroll ফিরিয়ে দাও */
      const remaining = document.querySelectorAll("[data-modal]");
      if (remaining.length === 0) document.body.style.overflow = "";
    };
  }, [isOpen, onClose, modalId]);

  /* ─── বন্ধ থাকলে কিছু রেন্ডার করবে না ─── */
  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      data-modal={modalId}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        animation: "modalOverlayIn 0.2s ease forwards",
      }}>

      {/* ─── Modal কন্টেন্ট বক্স ─── */}
      <div
        className={`w-full ${SIZES[size]} rounded-2xl shadow-2xl overflow-hidden`}
        style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          maxHeight: "90vh",
          animation: "modalScaleIn 0.25s ease forwards",
        }}>

        {/* ─── হেডার ─── */}
        {title && (
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <div>
              <h3 className="text-sm font-bold" style={{ color: t.text }}>{title}</h3>
              {subtitle && (
                <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: t.muted }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${t.rose}15`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── বডি — স্ক্রলযোগ্য ─── */}
        <div
          className="overflow-y-auto px-5 py-4"
          style={{ maxHeight: title ? "calc(90vh - 60px)" : "90vh" }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
