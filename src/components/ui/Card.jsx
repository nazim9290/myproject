import { useTheme } from "../../context/ThemeContext";

export default function Card({ children, className = "", delay = 0 }) {
  const t = useTheme();
  return (
    <div
      className={`rounded-2xl border p-5 anim-fade ${className}`}
      style={{ background: t.card, borderColor: t.border, animationDelay: `${delay}ms`, boxShadow: t.mode === "light" ? "0 1px 3px rgba(0,0,0,0.04)" : "none" }}
    >
      {children}
    </div>
  );
}
