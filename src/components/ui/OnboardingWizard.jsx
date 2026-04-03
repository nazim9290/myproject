/**
 * OnboardingWizard — প্রথমবার login-এ step-by-step নির্দেশনা
 * localStorage-এ "agencybook_onboarding_done" flag দিয়ে track করে
 * একবার complete হলে আর দেখায় না
 *
 * ব্যবহার:
 *   - App.jsx-এর authenticated section-এ <OnboardingWizard /> রাখুন
 *   - Help page থেকে resetOnboarding() call করলে আবার দেখাবে
 *
 * Props: কিছু লাগে না (নিজে localStorage check করে)
 */

import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";

// ── localStorage key — onboarding সম্পন্ন হয়েছে কি না ──
const STORAGE_KEY = "agencybook_onboarding_done";

// ── Onboarding-এর ৭টি ধাপ — প্রতিটিতে icon, title, description, tip ──
const STEPS = [
  {
    icon: "\u{1F44B}",
    titleKey: "onboarding.welcome",
    descKey: "onboarding.welcomeDesc",
    tipKey: null,
  },
  {
    icon: "\u{1F3E2}",
    titleKey: "onboarding.agencySetup",
    descKey: "onboarding.agencySetupDesc",
    tipKey: "onboarding.agencySetupTip",
  },
  {
    icon: "\u{1F465}",
    titleKey: "onboarding.addStudents",
    descKey: "onboarding.addStudentsDesc",
    tipKey: "onboarding.addStudentsTip",
  },
  {
    icon: "\u{1F4C4}",
    titleKey: "onboarding.documents",
    descKey: "onboarding.documentsDesc",
    tipKey: "onboarding.documentsTip",
  },
  {
    icon: "\u{1F4DD}",
    titleKey: "onboarding.docGenerator",
    descKey: "onboarding.docGeneratorDesc",
    tipKey: "onboarding.docGeneratorTip",
  },
  {
    icon: "\u2708\uFE0F",
    titleKey: "onboarding.preDeparture",
    descKey: "onboarding.preDepartureDesc",
    tipKey: "onboarding.preDepartureTip",
  },
  {
    icon: "\u{1F680}",
    titleKey: "onboarding.ready",
    descKey: "onboarding.readyDesc",
    tipKey: null,
  },
];

/**
 * OnboardingWizard — full-screen modal wizard
 * প্রথম login-এ দেখায়, complete/skip করলে localStorage flag সেট করে
 */
export default function OnboardingWizard() {
  const t = useTheme();
  const { t: tr } = useLanguage();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  // ── mount-এ check — onboarding আগে সম্পন্ন হয়েছে কি না ──
  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setShow(true);
    } catch {
      // localStorage unavailable — দেখিয়ে দাও
      setShow(true);
    }
  }, []);

  // ── complete — flag সেট করে wizard বন্ধ করো ──
  const complete = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setShow(false);
  };

  // ── skip — সরাসরি complete হিসেবে mark করো ──
  const skip = () => complete();

  // ── দেখানোর দরকার নেই — null return ──
  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden anim-fade"
        style={{ background: t.card, border: `1px solid ${t.border}` }}
      >
        {/* ── Top illustration area — gradient background + বড় icon ── */}
        <div
          className="h-32 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${t.cyan}15, ${t.purple}15)` }}
        >
          <span className="text-6xl">{current.icon}</span>
        </div>

        {/* ── Content — title, description, tip ── */}
        <div className="p-6 text-center">
          {/* ধাপের শিরোনাম */}
          <h2 className="text-lg font-bold mb-2" style={{ color: t.text }}>
            {tr(current.titleKey)}
          </h2>

          {/* ধাপের বিবরণ */}
          <p className="text-sm mb-4" style={{ color: t.textSecondary }}>
            {tr(current.descKey)}
          </p>

          {/* টিপ — শুধু যেসব ধাপে tipKey আছে */}
          {current.tipKey && (
            <div
              className="p-3 rounded-xl mb-4 text-left"
              style={{ background: `${t.cyan}08`, border: `1px solid ${t.cyan}15` }}
            >
              <p className="text-[11px]" style={{ color: t.cyan }}>
                {"\u{1F4A1}"} {tr(current.tipKey)}
              </p>
            </div>
          )}

          {/* ── Progress dots — বর্তমান ধাপ বড়, আগেরগুলো সবুজ ── */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 24 : 8,
                  background:
                    i === step
                      ? t.cyan
                      : i < step
                        ? t.emerald
                        : `${t.muted}30`,
                }}
              />
            ))}
          </div>

          {/* ── Navigation buttons — Skip, Back, Next/GetStarted ── */}
          <div className="flex items-center justify-between">
            {/* Skip বাটন — বাম পাশে */}
            <button
              onClick={skip}
              className="text-xs"
              style={{ color: t.muted }}
            >
              {tr("onboarding.skip")}
            </button>

            <div className="flex gap-2">
              {/* Back বাটন — প্রথম ধাপে দেখাবে না */}
              {!isFirst && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 py-2 rounded-xl text-xs"
                  style={{ color: t.muted }}
                >
                  {"\u2190"} {tr("onboarding.back")}
                </button>
              )}

              {/* Next / Get Started বাটন */}
              <button
                onClick={isLast ? complete : () => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl text-xs font-medium"
                style={{
                  background: isLast ? t.emerald : t.cyan,
                  color: "#fff",
                }}
              >
                {isLast ? tr("onboarding.getStarted") : tr("onboarding.next")}
              </button>
            </div>
          </div>
        </div>

        {/* ── Step counter — নিচে ধাপ সংখ্যা দেখায় ── */}
        <div className="px-6 pb-4 text-center">
          <p className="text-[10px]" style={{ color: t.muted }}>
            {step + 1} / {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * resetOnboarding — বাইরে থেকে call করলে onboarding আবার দেখাবে
 * Help page-এ এই function ব্যবহার হয়
 */
export function resetOnboarding() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
