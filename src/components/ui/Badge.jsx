import { useTheme } from "../../context/ThemeContext";
import { PIPELINE_STATUSES } from "../../data/students";

export function Badge({ children, color = "#06b6d4", size = "sm" }) {
  const t = useTheme();
  const pad = size === "xs" ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`${pad} rounded-full font-semibold inline-block`} style={{ background: t.badgeBg(color), color }}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = PIPELINE_STATUSES.find((p) => p.code === status);
  if (!s) return null;
  return <Badge color={s.color}>{s.label}</Badge>;
}
