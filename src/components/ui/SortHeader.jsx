import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * সর্টেবল টেবিল হেডার — ক্লিক করলে সর্ট দিক পরিবর্তন হয়
 * @param {string} label - কলাম নাম
 * @param {string} sortKey - এই কলামের সর্ট key
 * @param {string} currentKey - বর্তমান সর্ট key
 * @param {"asc"|"desc"} currentDir - বর্তমান সর্ট দিক
 * @param {function} onSort - সর্ট টগল ফাংশন
 */
export default function SortHeader({ label, sortKey, currentKey, currentDir, onSort }) {
  const t = useTheme();
  const active = currentKey === sortKey;

  return (
    <th
      className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none"
      style={{ color: active ? t.cyan : t.muted }}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          currentDir === "asc" ? (
            <ChevronUp size={12} />
          ) : (
            <ChevronDown size={12} />
          )
        ) : (
          <ChevronsUpDown size={12} style={{ opacity: 0.35 }} />
        )}
      </span>
    </th>
  );
}
