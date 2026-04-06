import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * তারিখ ইনপুট কম্পোনেন্ট — DD-MM-YYYY ফরম্যাটে দেখায়, YYYY-MM-DD (ISO) ফরম্যাটে সংরক্ষণ করে
 *
 * ব্যবহার:
 *   <DateInput value={form.dob} onChange={v => set("dob", v)} />
 *   <DateInput value="2001-10-07" onChange={handleDate} size="md" />
 *
 * Props:
 *   value       — তারিখ ISO ফরম্যাটে (YYYY-MM-DD string)
 *   onChange     — ISO ফরম্যাটে তারিখ পরিবর্তনের callback
 *   placeholder  — placeholder টেক্সট (default: "DD-MM-YYYY")
 *   disabled    — নিষ্ক্রিয় অবস্থা
 *   error       — error থাকলে border লাল হবে
 *   className   — অতিরিক্ত CSS class
 *   style       — অতিরিক্ত inline style
 *   size        — "sm" (default) বা "md"
 *   min         — সর্বনিম্ন তারিখ (YYYY-MM-DD)
 *   max         — সর্বোচ্চ তারিখ (YYYY-MM-DD)
 *   id          — input element-এর id
 *   name        — input element-এর name
 */

// ─── ISO (YYYY-MM-DD) → Display (DD-MM-YYYY) রূপান্তর ───
const toDisplay = (iso) => {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const [y, m, d] = parts;
  return `${d}-${m}-${y}`;
};

// ─── Display (DD-MM-YYYY) → ISO (YYYY-MM-DD) রূপান্তর ───
const toISO = (display) => {
  const match = display.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return "";
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  const year = match[3];
  return `${year}-${month}-${day}`;
};

// ─── তারিখ বৈধতা যাচাই — দিন/মাস/বছর range check ───
const isValidDate = (iso) => {
  if (!iso) return false;
  const parts = iso.split("-");
  if (parts.length !== 3) return false;
  const [y, m, d] = parts.map(Number);
  // মাস ১-১২, দিন ১-৩১, বছর যুক্তিসঙ্গত range
  if (m < 1 || m > 12 || d < 1 || y < 1900 || y > 2100) return false;
  // JavaScript Date দিয়ে actual validity check (যেমন ফেব্রুয়ারি ৩০ invalid)
  const dateObj = new Date(y, m - 1, d);
  return (
    dateObj.getFullYear() === y &&
    dateObj.getMonth() === m - 1 &&
    dateObj.getDate() === d
  );
};

// ─── Auto-dash: ব্যবহারকারী টাইপ করলে স্বয়ংক্রিয়ভাবে dash বসানো ───
const formatWithDashes = (raw) => {
  // শুধু সংখ্যা ও বিদ্যমান dash রাখি
  const digits = raw.replace(/[^0-9]/g, "");
  // সর্বোচ্চ ৮ ডিজিট (DDMMYYYY)
  const limited = digits.slice(0, 8);
  if (limited.length <= 2) return limited;
  if (limited.length <= 4) return `${limited.slice(0, 2)}-${limited.slice(2)}`;
  return `${limited.slice(0, 2)}-${limited.slice(2, 4)}-${limited.slice(4)}`;
};

export default function DateInput({
  value = "",
  onChange,
  placeholder = "DD-MM-YYYY",
  disabled = false,
  error = false,
  className = "",
  style: extraStyle,
  size = "sm",
  min,
  max,
  id,
  name,
}) {
  const t = useTheme();
  const hiddenRef = useRef(null);
  const textRef = useRef(null);

  // ─── ইন্টার্নাল display state — টাইপিংয়ের সময় ব্যবহারকারীর ইনপুট ধরে রাখা ───
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  // ─── বাইরে থেকে value prop পরিবর্তন হলে display sync করা ───
  useEffect(() => {
    // focus অবস্থায় external value change হলে overwrite করবো না (টাইপিং চলছে)
    if (!isFocused) {
      setDisplayValue(toDisplay(value));
    }
  }, [value, isFocused]);

  // ─── টেক্সট ইনপুটে টাইপ করলে auto-dash ও validation ───
  const handleTextChange = useCallback(
    (e) => {
      const raw = e.target.value;
      const formatted = formatWithDashes(raw);
      setDisplayValue(formatted);

      // সম্পূর্ণ DD-MM-YYYY format হলে ISO-তে রূপান্তর করে onChange কল
      const iso = toISO(formatted);
      if (iso && isValidDate(iso)) {
        onChange?.(iso);
      }
    },
    [onChange]
  );

  // ─── Blur-এ partial/invalid ইনপুট handle ───
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const iso = toISO(displayValue);
    if (iso && isValidDate(iso)) {
      // বৈধ তারিখ — properly format করে দেখাই
      setDisplayValue(toDisplay(iso));
      onChange?.(iso);
    } else if (displayValue.trim() === "") {
      // খালি — clear করি
      onChange?.("");
    } else {
      // অবৈধ — আগের বৈধ value-তে ফিরে যাই
      setDisplayValue(toDisplay(value));
    }
  }, [displayValue, value, onChange]);

  // ─── Focus handler ───
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // ─── ক্যালেন্ডার আইকন ক্লিক → hidden native date picker খোলা ───
  const openPicker = useCallback(() => {
    if (disabled) return;
    const el = hiddenRef.current;
    if (!el) return;
    // showPicker() ব্যবহার করি — modern browsers-এ সাপোর্ট করে
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        // কিছু browser-এ user gesture ছাড়া showPicker fail করতে পারে
        el.click();
      }
    } else {
      // fallback: focus করলে অনেক browser picker দেখায়
      el.focus();
      el.click();
    }
  }, [disabled]);

  // ─── Hidden date input থেকে তারিখ নির্বাচন হলে ───
  const handlePickerChange = useCallback(
    (e) => {
      const iso = e.target.value; // native picker YYYY-MM-DD দেয়
      if (iso && isValidDate(iso)) {
        setDisplayValue(toDisplay(iso));
        onChange?.(iso);
      }
      // picker বন্ধ হওয়ার পর text input-এ focus ফেরত
      textRef.current?.focus();
    },
    [onChange]
  );

  // ─── Keyboard shortcuts: Enter → picker খোলা, Escape → blur ───
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        openPicker();
      } else if (e.key === "Escape") {
        textRef.current?.blur();
      }
    },
    [openPicker]
  );

  // ─── Size variant অনুযায়ী class ───
  const py = size === "md" ? "py-2" : "py-1.5";
  const textSize = size === "md" ? "text-sm" : "text-xs";
  const iconSize = size === "md" ? 16 : 14;

  // ─── Border color — error বা focus অনুযায়ী ───
  const borderColor = error ? t.rose : isFocused ? t.cyan : t.inputBorder;

  return (
    <div
      className={`flex items-stretch ${className}`}
      style={{
        position: "relative",
        ...extraStyle,
      }}
    >
      {/* ─── দৃশ্যমান টেক্সট ইনপুট (DD-MM-YYYY ফরম্যাট) ─── */}
      <input
        ref={textRef}
        type="text"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={10} // DD-MM-YYYY = ১০ অক্ষর
        autoComplete="off"
        className={`flex-1 px-2.5 ${py} rounded-l-lg ${textSize} outline-none min-w-0 font-mono`}
        style={{
          background: t.inputBg,
          border: `1px solid ${borderColor}`,
          borderRight: "none",
          color: t.text,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
          transition: "border-color 0.15s ease",
        }}
      />

      {/* ─── ক্যালেন্ডার আইকন বাটন ─── */}
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        title="তারিখ বাছাই করুন"
        className={`flex items-center justify-center px-2.5 ${py} rounded-r-lg shrink-0 transition-colors`}
        style={{
          background: t.inputBg,
          border: `1px solid ${borderColor}`,
          borderLeft: "none",
          color: t.muted,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          transition: "border-color 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.color = t.cyan;
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.color = t.muted;
        }}
      >
        <Calendar size={iconSize} />
      </button>

      {/* ─── Hidden native date picker — শুধু picker UI-এর জন্য ─── */}
      <input
        ref={hiddenRef}
        type="date"
        value={value || ""}
        min={min}
        max={max}
        onChange={handlePickerChange}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          pointerEvents: "none",
          // native picker-এর click area বন্ধ — শুধু programmatic open
        }}
      />
    </div>
  );
}

// ─── ইউটিলিটি: ISO তারিখ → DD-MM-YYYY display format ───
export { toDisplay, toISO, isValidDate };

// ─── ইউটিলিটি: তারিখ display helper (table/card-এ দেখানোর জন্য) ───
export function formatDateDisplay(iso) {
  if (!iso) return "—";
  const display = toDisplay(iso);
  return display || "—";
}
