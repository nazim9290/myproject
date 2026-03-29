import { useState, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * DropZone — ড্র্যাগ অ্যান্ড ড্রপ ফাইল আপলোড কম্পোনেন্ট
 * Counter-based approach — child element bubble সমস্যা নেই
 */
export default function DropZone({ accept, onFile, children, multiple = false }) {
  const t = useTheme();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      if (multiple) {
        for (let i = 0; i < files.length; i++) onFile(files[i]);
      } else {
        onFile(files[0]);
      }
    }
  }, [onFile, multiple]);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = "";
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative cursor-pointer rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10 px-6"
      style={{
        border: `2px dashed ${dragging ? t.cyan : t.inputBorder}`,
        background: dragging ? `${t.cyan}10` : t.inputBg,
        minHeight: 140,
      }}
    >
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" multiple={multiple} />

      {dragging ? (
        <div className="flex flex-col items-center gap-2">
          <Upload size={32} style={{ color: t.cyan }} />
          <p className="text-sm font-bold" style={{ color: t.cyan }}>এখানে ছেড়ে দিন!</p>
        </div>
      ) : (
        <>
          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: `${t.cyan}15` }}>
            <Upload size={20} style={{ color: t.cyan }} />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold" style={{ color: t.text }}>
              {children || "ফাইল টেনে আনুন অথবা ক্লিক করুন"}
            </p>
            <p className="text-[10px] mt-1" style={{ color: t.muted }}>
              {accept ? `সমর্থিত ফরম্যাট: ${accept}` : "যেকোনো ফাইল"} • ড্র্যাগ অ্যান্ড ড্রপ সমর্থিত
            </p>
          </div>
        </>
      )}
    </div>
  );
}
