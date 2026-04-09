import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { PIPELINE_STATUSES } from "../../data/students";

export function Badge({ children, color = null, size = "sm" }) {
  const t = useTheme();
  const actualColor = color || t.cyan;
  const pad = size === "xs" ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span className={`${pad} rounded-full font-semibold inline-block`} style={{ background: t.badgeBg(actualColor), color: actualColor }}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { t: tr } = useLanguage();
  const s = PIPELINE_STATUSES.find((p) => p.code === status);
  if (!s) return null;
  // pipeline.CODE key থেকে translated label, fallback: data file-এর label
  const label = tr(`pipeline.${status}`);
  return <Badge color={s.color}>{label !== `pipeline.${status}` ? label : s.label}</Badge>;
}
