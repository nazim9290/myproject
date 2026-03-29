import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * DropZone — ড্র্যাগ অ্যান্ড ড্রপ ফাইল আপলোড কম্পোনেন্ট
 *
 * ব্যবহার:
 *   <DropZone accept=".xlsx,.xls" onFile={file => handleFile(file)}>
 *     Excel ফাইল টেনে আনুন
 *   </DropZone>
 */
export default function DropZone({ accept, onFile, children, multiple = false }) {
  const t = useTheme();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      if (multiple) {
        for (let i = 0; i < files.length; i++) onFile(files[i]);
      } else {
        onFile(files[0]);
      }
    }
  };

  const handleClick = () => inputRef.current?.click();
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = ""; // reset — same file আবার সিলেক্ট করতে পারবে
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative cursor-pointer rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-3 py-8 px-6"
      style={{
        border: `2px dashed ${dragging ? t.cyan : t.inputBorder}`,
        background: dragging ? `${t.cyan}08` : t.inputBg,
      }}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" multiple={multiple} />
      <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${t.cyan}15` }}>
        <Upload size={20} style={{ color: t.cyan }} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold" style={{ color: dragging ? t.cyan : t.text }}>
          {children || "ফাইল টেনে আনুন অথবা ক্লিক করুন"}
        </p>
        <p className="text-[10px] mt-1" style={{ color: t.muted }}>
          {accept ? `সমর্থিত: ${accept}` : "যেকোনো ফাইল"}
        </p>
      </div>
      {dragging && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: `${t.cyan}10` }}>
          <p className="text-sm font-bold" style={{ color: t.cyan }}>এখানে ছেড়ে দিন!</p>
        </div>
      )}
    </div>
  );
}
