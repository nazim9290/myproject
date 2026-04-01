import { createContext, useContext, useState, useEffect } from "react";

// ── Admin-configurable label settings (localStorage-এ persist) ──
const DEFAULT_LABEL_SETTINGS = {
  labelColor: "",        // empty = theme default (t.muted)
  labelSize: "10px",     // default label font size
};

function loadLabelSettings() {
  try {
    const saved = localStorage.getItem("agencybook_label_settings");
    return saved ? { ...DEFAULT_LABEL_SETTINGS, ...JSON.parse(saved) } : DEFAULT_LABEL_SETTINGS;
  } catch { return DEFAULT_LABEL_SETTINGS; }
}

export function useLabelSettings() {
  const [settings, setSettings] = useState(loadLabelSettings);
  const update = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    localStorage.setItem("agencybook_label_settings", JSON.stringify(merged));
  };
  return { labelSettings: settings, updateLabelSettings: update };
}

export const THEMES = {
  dark: {
    mode: "dark",
    bg: "#0a0c10",
    bgAlt: "#0f1218",
    sidebar: "linear-gradient(180deg, #0f1218, #0a0c10)",
    sidebarText: "rgba(255,255,255,0.4)",
    sidebarTextActive: "#ffffff",
    sidebarActiveBg: "rgba(255,255,255,0.10)",
    sidebarHoverBg: "rgba(255,255,255,0.05)",
    card: "linear-gradient(135deg, #12151d, #0f1218)",
    cardSolid: "#12151d",
    border: "rgba(255,255,255,0.06)",
    inputBg: "rgba(255,255,255,0.05)",
    inputBorder: "rgba(255,255,255,0.05)",
    inputFocusBorder: "rgba(6,182,212,0.3)",
    text: "#e2e8f0",
    textSecondary: "#94a3b8",
    muted: "#64748b",
    hoverBg: "rgba(255,255,255,0.05)",
    tableBorder: "rgba(255,255,255,0.05)",
    tableHover: "rgba(255,255,255,0.05)",
    badgeBg: (c) => `${c}20`,
    tooltipBg: "#1e293b",
    tooltipBorder: "#334155",
    scrollThumb: "#1e293b",
    chartGrid: "#1e293b",
    chartAxisTick: "#64748b",
    cyan: "#06b6d4",
    purple: "#a855f7",
    emerald: "#22c55e",
    amber: "#eab308",
    rose: "#f43f5e",
  },
  light: {
    mode: "light",
    bg: "#f8fafc",
    bgAlt: "#ffffff",
    sidebar: "linear-gradient(180deg, #0f172a, #1e293b)",
    sidebarText: "rgba(255,255,255,0.5)",
    sidebarTextActive: "#ffffff",
    sidebarActiveBg: "rgba(255,255,255,0.12)",
    sidebarHoverBg: "rgba(255,255,255,0.06)",
    card: "#ffffff",
    cardSolid: "#ffffff",
    border: "#e2e8f0",
    inputBg: "#f1f5f9",
    inputBorder: "#e2e8f0",
    inputFocusBorder: "rgba(6,182,212,0.5)",
    text: "#0f172a",
    textSecondary: "#475569",
    muted: "#94a3b8",
    hoverBg: "#f1f5f9",
    tableBorder: "#f1f5f9",
    tableHover: "#f8fafc",
    badgeBg: (c) => `${c}15`,
    tooltipBg: "#ffffff",
    tooltipBorder: "#e2e8f0",
    scrollThumb: "#cbd5e1",
    chartGrid: "#e2e8f0",
    chartAxisTick: "#94a3b8",
    cyan: "#0891b2",
    purple: "#9333ea",
    emerald: "#16a34a",
    amber: "#ca8a04",
    rose: "#e11d48",
  },
};

export const ThemeContext = createContext(THEMES.dark);
export const useTheme = () => useContext(ThemeContext);

export const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
`;

export const getGlobalStyles = (t) => `
  ${FONTS}
  * { scrollbar-width: thin; scrollbar-color: ${t.scrollThumb} transparent; box-sizing: border-box; }
  *::-webkit-scrollbar { width: 5px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: ${t.scrollThumb}; border-radius: 4px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes modalOverlayIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .anim-fade { animation: fadeIn 0.4s ease forwards; }
  .anim-slide { animation: slideIn 0.35s ease forwards; }
  .skeleton-shimmer {
    background: linear-gradient(90deg, ${t.muted}10 25%, ${t.muted}20 50%, ${t.muted}10 75%) !important;
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
  select, input { color: ${t.text}; }
  select option { background: ${t.cardSolid}; color: ${t.text}; }
  /* Required field * mark লাল দেখাবে — label-এ, placeholder-এ, সবখানে */
  label .req-star, .req-star { color: ${t.rose} !important; font-weight: 700; }
  /* Label settings — admin customizable */
  .ab-label {
    font-size: var(--ab-label-size, 10px);
    color: var(--ab-label-color, ${t.muted});
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }
`;

export function ThemeToggle({ isDark, onToggle }) {
  const t = useTheme();
  return (
    <button
      onClick={onToggle}
      className="relative p-2 rounded-lg transition-all duration-300 group"
      style={{ background: t.inputBg }}
      title={isDark ? "লাইট মোডে যান" : "ডার্ক মোডে যান"}
    >
      <div className="relative w-4 h-4">
        {/* Sun */}
        <svg
          className="absolute inset-0 transition-all duration-500"
          style={{ opacity: isDark ? 0 : 1, transform: isDark ? "rotate(-90deg) scale(0.5)" : "rotate(0) scale(1)" }}
          viewBox="0 0 24 24" fill="none" stroke={t.amber} strokeWidth="2" strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        {/* Moon */}
        <svg
          className="absolute inset-0 transition-all duration-500"
          style={{ opacity: isDark ? 1 : 0, transform: isDark ? "rotate(0) scale(1)" : "rotate(90deg) scale(0.5)" }}
          viewBox="0 0 24 24" fill="none" stroke={t.purple} strokeWidth="2" strokeLinecap="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </div>
    </button>
  );
}
