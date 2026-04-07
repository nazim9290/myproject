import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// সার্চযোগ্য ড্রপডাউন — বড় list (students, schools, users) থেকে সহজে খুঁজে বের করা
// Portal ব্যবহার করে Modal-এর overflow-এর বাইরে রেন্ডার
// ব্যবহার: <SearchableSelect label="স্টুডেন্ট" value={id} options={[{value, label}]} onChange={fn} placeholder="খুঁজুন..." />
export default function SearchableSelect({ label, value, options = [], onChange, placeholder = "খুঁজুন..." }) {
  const t = useTheme();
  const is = { background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text };
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const dropRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find(o => o.value === value);
  const filtered = q ? options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())).slice(0, 20) : options.slice(0, 20);

  // বাটনের position মেপে dropdown position সেট
  const openDrop = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      // viewport-এর নিচের দিকে জায়গা কম থাকলে উপরে দেখাও
      const spaceBelow = window.innerHeight - r.bottom;
      const dropH = Math.min(filtered.length * 32 + 50, 250);
      const goUp = spaceBelow < dropH && r.top > dropH;
      setPos({
        top: goUp ? r.top - dropH - 4 : r.bottom + 4,
        left: r.left,
        width: r.width,
      });
    }
    setQ("");
    setOpen(true);
  };

  // বাইরে click করলে বন্ধ
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div>
      {label && <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: t.muted }}>{label}</label>}
      <button ref={btnRef} type="button" onClick={() => open ? setOpen(false) : openDrop()}
        className="w-full px-3 py-2 rounded-lg text-sm text-left outline-none truncate" style={is}>
        {selected ? selected.label : <span style={{ color: t.muted }}>{placeholder}</span>}
      </button>
      {open && ReactDOM.createPortal(
        <div ref={dropRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}>
          <div className="rounded-xl shadow-2xl" style={{ background: t.cardSolid || t.card, border: `1px solid ${t.border}` }}>
            {/* সার্চ বক্স */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: `1px solid ${t.border}` }}>
              <Search size={13} style={{ color: t.muted }} />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none" style={{ color: t.text }} placeholder="খুঁজুন..." />
            </div>
            {/* অপশন তালিকা */}
            <div className="max-h-52 overflow-y-auto py-1">
              <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs" style={{ color: t.muted }}
                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>— নির্বাচন বাতিল —</button>
              {filtered.map(o => (
                <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs truncate"
                  style={{ color: value === o.value ? t.cyan : t.text, fontWeight: value === o.value ? 600 : 400 }}
                  onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  {o.label}
                </button>
              ))}
              {filtered.length === 0 && <p className="text-xs text-center py-3" style={{ color: t.muted }}>কিছু পাওয়া যায়নি</p>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
