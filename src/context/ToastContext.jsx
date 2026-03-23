import { useState, useCallback, createContext, useContext } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: "#22c55e", bgLight: "#dcfce7", border: "#22c55e40", title: "সফল!" },
  error: { icon: AlertCircle, bg: "#ef4444", bgLight: "#fee2e2", border: "#ef444440", title: "ত্রুটি!" },
  warning: { icon: AlertTriangle, bg: "#eab308", bgLight: "#fef9c3", border: "#eab30840", title: "সতর্কতা!" },
  info: { icon: Info, bg: "#06b6d4", bgLight: "#e0f2fe", border: "#06b6d440", title: "তথ্য" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error", 5000),
    warning: (msg) => addToast(msg, "warning", 4000),
    info: (msg) => addToast(msg, "info"),
    created: (item) => addToast(`${item} সফলভাবে তৈরি হয়েছে`, "success"),
    updated: (item) => addToast(`${item} আপডেট হয়েছে`, "success"),
    deleted: (item) => addToast(`${item} ডিলিট হয়েছে`, "success"),
    saved: (item) => addToast(`${item} সেভ হয়েছে`, "success"),
    exported: (item) => addToast(`${item} এক্সপোর্ট হয়েছে`, "info"),
  };
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position:"fixed", top:16, right:16, zIndex:9999, display:"flex", flexDirection:"column", gap:8, maxWidth:380 }}>
        {toasts.map(t => {
          const c = TOAST_TYPES[t.type] || TOAST_TYPES.info;
          const Icon = c.icon;
          return (
            <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 16px", borderRadius:12, border:`1px solid ${c.border}`, background:c.bgLight, boxShadow:"0 8px 30px rgba(0,0,0,0.12)", animation:"fadeIn 0.3s ease", minWidth:280 }}>
              <div style={{ width:28, height:28, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", background:`${c.bg}20`, flexShrink:0 }}>
                <Icon size={15} color={c.bg} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12, fontWeight:700, color:c.bg, margin:0 }}>{c.title}</p>
                <p style={{ fontSize:11, color:"#334155", margin:"3px 0 0" }}>{t.message}</p>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background:"transparent", border:"none", cursor:"pointer", padding:2, opacity:0.4 }}>
                <X size={14} color="#64748b" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
