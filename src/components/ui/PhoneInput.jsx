import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * ফোন ইনপুট কম্পোনেন্ট — দেশের কোড সিলেক্টর সহ
 *
 * ব্যবহার:
 *   <PhoneInput value={form.phone} onChange={v => set("phone", v)} />
 *
 * মান সংরক্ষণ ফরম্যাট:
 *   - বাংলাদেশ: "01XXXXXXXXX" (backward compatible — সবচেয়ে বেশি ব্যবহৃত)
 *   - অন্য দেশ: "+81XXXXXXXXX", "+82XXXXXXXXX" ইত্যাদি
 *
 * Props:
 *   value       — ফোন নম্বর (string)
 *   onChange     — নম্বর পরিবর্তনে callback
 *   placeholder  — ইনপুট placeholder (optional)
 *   error       — error state থাকলে border লাল হবে
 *   disabled    — disabled state
 *   className   — অতিরিক্ত CSS class
 *   style       — অতিরিক্ত inline style
 *   size        — "sm" (default) বা "md"
 */

// ─── দেশের তালিকা — CRM-এ প্রয়োজনীয় দেশগুলো ───
const COUNTRIES = [
  { code: "BD", dial: "+880", flag: "🇧🇩", name: "বাংলাদেশ",       placeholder: "01XXXXXXXXX",   maxLen: 11 },
  { code: "JP", dial: "+81",  flag: "🇯🇵", name: "জাপান",          placeholder: "90-XXXX-XXXX",  maxLen: 11 },
  { code: "KR", dial: "+82",  flag: "🇰🇷", name: "দক্ষিণ কোরিয়া",  placeholder: "10-XXXX-XXXX",  maxLen: 11 },
  { code: "DE", dial: "+49",  flag: "🇩🇪", name: "জার্মানি",        placeholder: "1XX-XXXXXXX",   maxLen: 12 },
  { code: "IN", dial: "+91",  flag: "🇮🇳", name: "ভারত",           placeholder: "9XXXXXXXXX",    maxLen: 10 },
  { code: "MY", dial: "+60",  flag: "🇲🇾", name: "মালয়েশিয়া",      placeholder: "1X-XXXX-XXXX",  maxLen: 12 },
  { code: "SA", dial: "+966", flag: "🇸🇦", name: "সৌদি আরব",       placeholder: "5XXXXXXXX",     maxLen: 9 },
  { code: "AE", dial: "+971", flag: "🇦🇪", name: "সংযুক্ত আরব",     placeholder: "5X-XXX-XXXX",   maxLen: 10 },
  { code: "SG", dial: "+65",  flag: "🇸🇬", name: "সিঙ্গাপুর",       placeholder: "9XXX-XXXX",     maxLen: 8 },
  { code: "US", dial: "+1",   flag: "🇺🇸", name: "যুক্তরাষ্ট্র",     placeholder: "XXX-XXX-XXXX",  maxLen: 10 },
  { code: "GB", dial: "+44",  flag: "🇬🇧", name: "যুক্তরাজ্য",      placeholder: "7XXX-XXXXXX",   maxLen: 11 },
  { code: "AU", dial: "+61",  flag: "🇦🇺", name: "অস্ট্রেলিয়া",     placeholder: "4XX-XXX-XXX",   maxLen: 10 },
  { code: "CA", dial: "+1",   flag: "🇨🇦", name: "কানাডা",          placeholder: "XXX-XXX-XXXX",  maxLen: 10 },
  { code: "NP", dial: "+977", flag: "🇳🇵", name: "নেপাল",          placeholder: "9XXXXXXXXX",    maxLen: 10 },
  { code: "MM", dial: "+95",  flag: "🇲🇲", name: "মিয়ানমার",        placeholder: "9XXXXXXXX",     maxLen: 10 },
];

// ─── ভ্যালু থেকে দেশ ও লোকাল নম্বর parse করা ───
function parsePhone(value) {
  if (!value) return { country: COUNTRIES[0], local: "" };
  const str = String(value).trim();

  // বাংলাদেশ লোকাল ফরম্যাট — 01XXXXXXXXX (backward compatible)
  if (/^01\d{8,9}$/.test(str.replace(/[- ]/g, ""))) {
    return { country: COUNTRIES[0], local: str };
  }

  // +880 দিয়ে শুরু — বাংলাদেশ international format
  if (str.startsWith("+880")) {
    const local = str.slice(4);
    // +8801XXXXXXXXX → 01XXXXXXXXX (লোকাল ফরম্যাটে রাখি)
    return { country: COUNTRIES[0], local: local.startsWith("0") ? local : "0" + local };
  }

  // অন্য দেশ detect — dial code দিয়ে match (দীর্ঘ code আগে check)
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (c.code === "BD") continue; // BD আলাদা handle হয়েছে
    if (str.startsWith(c.dial)) {
      return { country: c, local: str.slice(c.dial.length) };
    }
  }

  // কোনো match না পেলে — Bangladesh default, value as-is
  return { country: COUNTRIES[0], local: str };
}

// ─── দেশ ও লোকাল নম্বর থেকে সংরক্ষণযোগ্য ভ্যালু তৈরি ───
function formatValue(country, local) {
  if (!local) return "";
  const cleaned = local.replace(/[- ]/g, "");
  // বাংলাদেশ — লোকাল ফরম্যাটেই রাখি (01XXXXXXXXX)
  if (country.code === "BD") return local;
  // অন্য দেশ — +dialCode + number
  return country.dial + cleaned;
}

export default function PhoneInput({
  value = "",
  onChange,
  placeholder,
  error,
  disabled,
  className = "",
  style: extraStyle,
  size = "sm",
}) {
  const t = useTheme();
  const ref = useRef(null);
  const dropRef = useRef(null);
  const [open, setOpen] = useState(false);

  // ভ্যালু থেকে দেশ ও লোকাল নম্বর parse
  const parsed = parsePhone(value);
  const [country, setCountry] = useState(parsed.country);
  const [local, setLocal] = useState(parsed.local);

  // বাইরে থেকে value পরিবর্তন হলে sync করা
  useEffect(() => {
    const p = parsePhone(value);
    setCountry(p.country);
    setLocal(p.local);
  }, [value]);

  // Dropdown বাইরে ক্লিক করলে বন্ধ
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // দেশ পরিবর্তন handler
  const selectCountry = (c) => {
    setCountry(c);
    setOpen(false);
    // নম্বর নতুন দেশের format-এ convert
    onChange?.(formatValue(c, local));
  };

  // নম্বর পরিবর্তন handler
  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    onChange?.(formatValue(country, v));
  };

  const py = size === "md" ? "py-2" : "py-1.5";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-stretch ${className}`} style={extraStyle}>
      {/* ─── দেশ সিলেক্টর বাটন ─── */}
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1 px-2 ${py} rounded-l-lg ${textSize} shrink-0 transition-colors`}
          style={{
            background: t.inputBg,
            border: `1px solid ${error ? t.rose : t.inputBorder}`,
            borderRight: "none",
            color: t.text,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <span className="text-sm leading-none">{country.flag}</span>
          <span className="text-[10px] font-medium" style={{ color: t.muted }}>{country.dial}</span>
          <ChevronDown size={10} style={{ color: t.muted }} />
        </button>

        {/* ─── দেশ ড্রপডাউন ─── */}
        {open && (
          <div
            ref={dropRef}
            className="absolute left-0 top-full mt-1 rounded-xl shadow-xl overflow-hidden z-[999]"
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              minWidth: 220,
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{
                  background: c.code === country.code ? `${t.cyan}15` : "transparent",
                  borderBottom: `1px solid ${t.border}`,
                  color: t.text,
                }}
                onMouseEnter={(e) => { if (c.code !== country.code) e.currentTarget.style.background = t.hoverBg; }}
                onMouseLeave={(e) => { if (c.code !== country.code) e.currentTarget.style.background = "transparent"; }}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="text-xs flex-1">{c.name}</span>
                <span className="text-[10px] font-mono" style={{ color: t.muted }}>{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── ফোন নম্বর ইনপুট ─── */}
      <input
        type="tel"
        value={local}
        onChange={handleChange}
        placeholder={placeholder || country.placeholder}
        disabled={disabled}
        className={`flex-1 px-2 ${py} rounded-r-lg ${textSize} outline-none min-w-0`}
        style={{
          background: t.inputBg,
          border: `1px solid ${error ? t.rose : t.inputBorder}`,
          borderLeft: "none",
          color: t.text,
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  );
}

// ─── ইউটিলিটি: ফোন নম্বর display format-এ দেখানো ───
export function formatPhoneDisplay(value) {
  if (!value) return "—";
  const { country, local } = parsePhone(value);
  if (!local) return "—";
  return `${country.flag} ${country.code === "BD" ? "" : country.dial + " "}${local}`;
}

// ─── ইউটিলিটি: ফোন নম্বর validate করা ───
export function isValidPhone(value) {
  if (!value) return false;
  const { country, local } = parsePhone(value);
  const cleaned = local.replace(/[- ]/g, "");
  if (!cleaned) return false;
  // বাংলাদেশ — 01 দিয়ে শুরু, ১১ ডিজিট
  if (country.code === "BD") return /^01\d{9}$/.test(cleaned);
  // অন্য দেশ — সর্বনিম্ন ৬ ডিজিট, সর্বোচ্চ maxLen
  return cleaned.length >= 6 && cleaned.length <= (country.maxLen || 15);
}

// ─── Export: দেশ তালিকা (অন্য component-এ লাগলে) ───
export { COUNTRIES, parsePhone };
