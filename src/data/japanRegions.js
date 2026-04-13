/**
 * Japan Regions — Smart Matching-এ ব্যবহৃত
 * School region + Student preferred_region dropdown-এ দেখাবে
 */

// ── Japan-এর ৯টি প্রধান অঞ্চল ──
export const JAPAN_REGIONS = [
  { value: "Hokkaido",  label: "Hokkaido (北海道)",   cities: ["Sapporo"] },
  { value: "Tohoku",    label: "Tohoku (東北)",       cities: ["Sendai", "Aomori", "Morioka"] },
  { value: "Kanto",     label: "Kanto (関東)",        cities: ["Tokyo", "Yokohama", "Saitama", "Chiba"] },
  { value: "Chubu",     label: "Chubu (中部)",        cities: ["Nagoya", "Niigata", "Shizuoka"] },
  { value: "Kansai",    label: "Kansai (関西)",       cities: ["Osaka", "Kyoto", "Kobe", "Nara"] },
  { value: "Chugoku",   label: "Chugoku (中国)",      cities: ["Hiroshima", "Okayama"] },
  { value: "Shikoku",   label: "Shikoku (四国)",      cities: ["Matsuyama", "Takamatsu"] },
  { value: "Kyushu",    label: "Kyushu (九州)",       cities: ["Fukuoka", "Kumamoto", "Kagoshima"] },
  { value: "Okinawa",   label: "Okinawa (沖縄)",     cities: ["Naha"] },
];

// ── JP Level hierarchy — matching comparison-এ ব্যবহৃত ──
// বড় সংখ্যা = বেশি advanced (N1 সবচেয়ে কঠিন)
export const JP_LEVEL_RANK = {
  "N5": 1, "NAT 5": 1,
  "N4": 2, "NAT 4": 2,
  "N3": 3, "NAT 3": 3,
  "N2": 4, "NAT 2": 4,
  "N1": 5, "NAT 1": 5,
};

// ── Education level hierarchy — matching comparison-এ ব্যবহৃত ──
export const EDUCATION_RANK = {
  "SSC": 1,
  "HSC": 2,
  "Diploma": 3,
  "Honours": 4,
  "Bachelors": 4,
  "Masters": 5,
};

// ── Intake months ──
export const INTAKE_MONTHS = ["January", "April", "July", "October"];
