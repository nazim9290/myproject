import { useTheme } from "../../context/ThemeContext";

export default function Button({ children, variant = "primary", size = "sm", icon: Icon, onClick, className = "" }) {
  const t = useTheme();
  const base = "inline-flex items-center gap-1.5 font-medium rounded-xl transition-all duration-200 shrink-0";
  const sizes = { xs: "px-2.5 py-1.5 text-[11px]", sm: "px-3.5 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  const variants = {
    primary: "text-white hover:opacity-90",
    ghost: `hover:text-current`,
    danger: "text-rose-500 hover:opacity-80",
  };
  const ghostBg = t.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f1f5f9";
  const ghostHover = t.mode === "dark" ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const dangerBg = `${t.rose}10`;
  const bg = variant === "primary"
    ? { background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})` }
    : variant === "ghost"
    ? { background: ghostBg }
    : { background: dangerBg };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} style={bg} onClick={onClick}
      onMouseEnter={(e) => { if (variant === "ghost") e.currentTarget.style.background = ghostHover; }}
      onMouseLeave={(e) => { if (variant === "ghost") e.currentTarget.style.background = ghostBg; }}
    >
      {Icon && <Icon size={size === "xs" ? 12 : 14} />}
      {children}
    </button>
  );
}
