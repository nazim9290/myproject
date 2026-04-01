import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// ── ক্লাস কম্পোনেন্ট — React Error Boundary (getDerivedStateFromError + componentDidCatch) ──
class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // ── error ধরলে state আপডেট করো ──
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // ── error ও info কনসোলে লগ করো ──
  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] রেন্ডারিং এরর:", error);
    console.error("[ErrorBoundary] কম্পোনেন্ট স্ট্যাক:", errorInfo?.componentStack);
  }

  // ── পেজ রিলোড ──
  handleReload = () => {
    window.location.reload();
  };

  // ── হোম পেজে যাও (state রিসেট করে) ──
  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    // হোম পেজে নেভিগেট — localStorage ব্যবহার করে activePage রিসেট
    window.location.href = "/";
  };

  render() {
    // ── সমস্যা না হলে সাধারণভাবে children দেখাও ──
    if (!this.state.hasError) {
      return this.props.children;
    }

    // ── থিম — props থেকে নাও (functional wrapper পাঠায়) ──
    const t = this.props.theme;

    // ── Fallback UI — সুন্দর এরর পেজ বাংলায় ──
    return (
      <div
        className="flex items-center justify-center min-h-screen p-6"
        style={{ background: t.bg }}
      >
        <div
          className="max-w-md w-full rounded-2xl p-8 text-center anim-fade"
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
          }}
        >
          {/* আইকন */}
          <div
            className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: `${t.rose}15` }}
          >
            <AlertTriangle size={32} style={{ color: t.rose }} />
          </div>

          {/* শিরোনাম */}
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: t.text }}
          >
            কিছু একটা সমস্যা হয়েছে
          </h2>

          {/* সাবটাইটেল */}
          <p
            className="text-xs mb-6"
            style={{ color: t.muted }}
          >
            পেজটি রিলোড করুন অথবা হোম পেজে যান
          </p>

          {/* ডেভেলপমেন্টে error message দেখাও */}
          {import.meta.env.DEV && this.state.error && (
            <div
              className="mb-6 p-3 rounded-xl text-left overflow-auto max-h-32"
              style={{
                background: `${t.rose}08`,
                border: `1px solid ${t.rose}20`,
              }}
            >
              <p
                className="text-[10px] font-mono break-all"
                style={{ color: t.rose }}
              >
                {this.state.error.toString()}
              </p>
            </div>
          )}

          {/* বাটন গ্রুপ */}
          <div className="flex items-center justify-center gap-3">
            {/* রিলোড বাটন */}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${t.cyan}, ${t.purple})`,
                color: "#fff",
              }}
            >
              <RefreshCw size={14} />
              রিলোড করুন
            </button>

            {/* হোম পেজ বাটন */}
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: t.inputBg,
                color: t.text,
                border: `1px solid ${t.inputBorder}`,
              }}
            >
              <Home size={14} />
              হোম পেজে যান
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// ── Functional wrapper — useTheme() hook ব্যবহার করে theme পাস করে ──
export default function ErrorBoundary({ children }) {
  const t = useTheme();
  return (
    <ErrorBoundaryInner theme={t}>
      {children}
    </ErrorBoundaryInner>
  );
}
