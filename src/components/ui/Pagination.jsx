import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function Pagination({ total, page, pageSize, onPage, onPageSize }) {
  const t = useTheme();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Build page number list with ellipsis
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }
    return pages;
  };

  const btn = (content, active, disabled, onClick) => (
    <button
      key={String(content) + (active ? "-a" : "")}
      onClick={onClick}
      disabled={disabled}
      className="h-7 min-w-[28px] px-2 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center"
      style={{
        background: active ? t.cyan : "transparent",
        color: active ? "#fff" : disabled ? `${t.muted}50` : t.muted,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => { if (!active && !disabled) e.currentTarget.style.background = t.hoverBg; }}
      onMouseLeave={(e) => { if (!active && !disabled) e.currentTarget.style.background = "transparent"; }}
    >
      {content}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3" style={{ borderTop: `1px solid ${t.border}` }}>
      {/* Left: count info */}
      <p className="text-[11px] shrink-0" style={{ color: t.muted }}>
        {total === 0 ? "কোনো রেকর্ড নেই" : `${from}–${to} দেখানো হচ্ছে, মোট ${total} জনের মধ্যে`}
      </p>

      {/* Center: page buttons */}
      <div className="flex items-center gap-0.5">
        {btn(<ChevronLeft size={13} />, false, page === 1, () => onPage(page - 1))}
        {getPages().map((p, i) =>
          p === "…"
            ? <span key={`ellipsis-${i}`} className="px-1 text-[11px]" style={{ color: t.muted }}>…</span>
            : btn(p, p === page, false, () => onPage(p))
        )}
        {btn(<ChevronRight size={13} />, false, page === totalPages, () => onPage(page + 1))}
      </div>

      {/* Right: page size selector */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px]" style={{ color: t.muted }}>প্রতি পাতায়</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSize(Number(e.target.value)); onPage(1); }}
          className="px-2 py-1 rounded-lg text-[11px] outline-none"
          style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
        >
          {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s} জন</option>)}
        </select>
      </div>
    </div>
  );
}
