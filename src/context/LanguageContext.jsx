/**
 * LanguageContext — ভাষা পরিবর্তন সিস্টেম
 *
 * ব্যবহার:
 *   const { t, lang, setLang, languages } = useLanguage();
 *   <h2>{t("dashboard.title")}</h2>          → "Dashboard" বা "ড্যাশবোর্ড"
 *   <Button>{t("common.save")}</Button>       → "Save" বা "সংরক্ষণ"
 *   <p>{t("documents.scanComplete", { count: 5 })}</p> → "Scan complete — 5 fields auto-filled"
 *
 * Supported languages: bn (বাংলা), en (English)
 * Default: Settings-এ যে ভাষা set করা আছে, অথবা bn
 * localStorage-এ persist হয়
 */

import { createContext, useContext, useState, useCallback } from "react";
import bnTranslations from "../i18n/bn.json";
import enTranslations from "../i18n/en.json";
import bnEnTranslations from "../i18n/bn-en.json";

// সমর্থিত ভাষার তালিকা — বাংলা, English, বাংলিশ (mixed)
const LANGUAGES = {
  bn: { code: "bn", label: "বাংলা", labelEn: "Bengali", translations: bnTranslations },
  "bn-en": { code: "bn-en", label: "বাংলা + English", labelEn: "Banglish", translations: bnEnTranslations },
  en: { code: "en", label: "English", labelEn: "English", translations: enTranslations },
};

const LanguageContext = createContext(null);

/**
 * getNestedValue — dot notation দিয়ে nested object থেকে value বের করে
 * "dashboard.title" → translations.dashboard.title
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

/**
 * LanguageProvider — App-এর root-এ wrap করতে হবে
 */
export function LanguageProvider({ children }) {
  // localStorage থেকে saved language load, default: "bn"
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem("agencybook_language") || "bn";
    } catch {
      return "bn";
    }
  });

  // ভাষা পরিবর্তন — localStorage-এ save
  const setLang = useCallback((newLang) => {
    if (LANGUAGES[newLang]) {
      setLangState(newLang);
      try {
        localStorage.setItem("agencybook_language", newLang);
      } catch {}
    }
  }, []);

  // t() function — translation key → localized text
  // Supports interpolation: t("key", { count: 5 }) → "5 fields"
  const t = useCallback((key, params = {}) => {
    const translations = LANGUAGES[lang]?.translations || bnTranslations;
    let value = getNestedValue(translations, key);

    // Fallback: বাংলায় না পেলে English-এ খুঁজো
    if (value === undefined && lang !== "bn") {
      value = getNestedValue(bnTranslations, key);
    }
    // তাও না পেলে English-এ
    if (value === undefined && lang !== "en") {
      value = getNestedValue(enTranslations, key);
    }
    // কিছুই না পেলে key নিজেই return
    if (value === undefined) return key;

    // Interpolation: {count}, {date} etc. replace
    if (typeof value === "string" && Object.keys(params).length > 0) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return value;
  }, [lang]);

  // সব supported language-র list
  const languages = Object.values(LANGUAGES).map(l => ({ code: l.code, label: l.label, labelEn: l.labelEn }));

  return (
    <LanguageContext.Provider value={{ t, lang, setLang, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * useLanguage hook — যেকোনো component-এ ব্যবহার
 *
 * const { t, lang, setLang, languages } = useLanguage();
 * t("common.save") → "সংরক্ষণ" বা "Save"
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Provider ছাড়া fallback — default Bengali
    return {
      t: (key) => {
        const val = getNestedValue(bnTranslations, key);
        return val !== undefined ? val : key;
      },
      lang: "bn",
      setLang: () => {},
      languages: [],
    };
  }
  return ctx;
}

export default LanguageContext;
