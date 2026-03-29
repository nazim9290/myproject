// ═══════════════════════════════════════════════
// পাইপলাইন স্টেপ কনফিগ — প্রতিটি ধাপে কী কী করতে হবে (ডেমো ডাটা)
// Admin সেটিংস থেকে dynamic ভাবে পরিবর্তন করা যাবে
// ═══════════════════════════════════════════════

export const DEFAULT_STEPS_META = {
  // VISITOR ও FOLLOW_UP → Visitors module-এ handle হয়
  // Student pipeline ENROLLED থেকে শুরু
  ENROLLED: {
    icon: "✅", nextStatus: "IN_COURSE", nextLabel: "কোর্স শুরু করুন",
    hint: "ভর্তি ফর্ম ও প্রথম কিস্তি ফি পরিশোধ হলে ব্যাচে যোগ করুন",
    checklist: [
      { id: "en1", text: "ভর্তির ফর্ম পূরণ ও স্বাক্ষর হয়েছে", req: true },
      { id: "en2", text: "১ম কিস্তি কোর্স ফি পরিশোধ হয়েছে", req: true },
      { id: "en3", text: "ব্যাচে এ্যাসাইন করা হয়েছে", req: true },
      { id: "en4", text: "অভিভাবককে ভর্তির তথ্য জানানো হয়েছে", req: false },
      { id: "en5", text: "ভর্তির রিসিট প্রদান করা হয়েছে", req: true },
    ],
  },
  IN_COURSE: {
    icon: "📚", nextStatus: "EXAM_PASSED", nextLabel: "পরীক্ষায় পাস হয়েছে",
    hint: "কোর্স চলাকালীন উপস্থিতি ও JLPT/NAT পরীক্ষায় পাস নিশ্চিত করুন",
    checklist: [
      { id: "ic1", text: "উপস্থিতি ৮০%-এর বেশি", req: true },
      { id: "ic2", text: "মাসিক টেস্টে পাস করেছে", req: true },
      { id: "ic3", text: "JLPT/NAT পরীক্ষায় রেজিস্ট্রেশন হয়েছে", req: true },
      { id: "ic4", text: "বকেয়া কোর্স ফি পরিশোধ হয়েছে", req: true },
      { id: "ic5", text: "JLPT/NAT পরীক্ষায় পাস করেছে", req: true },
    ],
  },
  EXAM_PASSED: {
    icon: "🏆", nextStatus: "DOC_COLLECTION", nextLabel: "ডকুমেন্ট কালেকশন শুরু করুন",
    hint: "সার্টিফিকেট পাওয়ার পর স্কুল নির্বাচন ও ডকুমেন্ট প্রস্তুত শুরু করুন",
    checklist: [
      { id: "ep1", text: "JLPT/NAT পাসের সার্টিফিকেট পাওয়া গেছে", req: true },
      { id: "ep2", text: "গন্তব্য স্কুল চূড়ান্ত নির্বাচন হয়েছে", req: true },
      { id: "ep3", text: "স্টুডেন্টকে ডকুমেন্ট চেকলিস্ট দেওয়া হয়েছে", req: true },
      { id: "ep4", text: "স্কুলে আবেদনের সিদ্ধান্ত হয়েছে", req: true },
    ],
  },
  DOC_COLLECTION: {
    icon: "📄", nextStatus: "SCHOOL_INTERVIEW", nextLabel: "ইন্টারভিউ শিডিউল করুন",
    hint: "সব ডকুমেন্ট সংগ্রহ ও যাচাই সম্পন্ন হলে স্কুল ইন্টারভিউ দিন",
    checklist: [
      { id: "dc1", text: "পাসপোর্ট (মেয়াদ কমপক্ষে ৬ মাস)", req: true },
      { id: "dc2", text: "SSC/HSC সার্টিফিকেট ও মার্কশিট (সত্যায়িত)", req: true },
      { id: "dc3", text: "JLPT/NAT সার্টিফিকেট", req: true },
      { id: "dc4", text: "ব্যাংক স্টেটমেন্ট (সর্বশেষ ৩ মাস)", req: true },
      { id: "dc5", text: "ছবি (৩.৫×৪.৫ cm, সাদা ব্যাকগ্রাউন্ড) — ৬ কপি", req: true },
      { id: "dc6", text: "পুলিশ ক্লিয়ারেন্স সার্টিফিকেট", req: true },
      { id: "dc7", text: "মেডিকেল সার্টিফিকেট", req: false },
      { id: "dc8", text: "ডকুমেন্ট প্রসেসিং ফি পরিশোধ হয়েছে", req: true },
      { id: "dc9", text: "সব ডকুমেন্ট mismatch মুক্ত ও যাচাই সম্পন্ন", req: true },
    ],
  },
  SCHOOL_INTERVIEW: {
    icon: "💻", nextStatus: "DOC_SUBMITTED", nextLabel: "ডকুমেন্ট স্কুলে জমা দিন",
    hint: "ইন্টারভিউ পাস হলে স্কুলে ডকুমেন্ট জমা দিন",
    checklist: [
      { id: "si1", text: "ইন্টারভিউ তারিখ ও সময় নির্ধারিত হয়েছে", req: true },
      { id: "si2", text: "স্কুলের সম্ভাব্য প্রশ্নোত্তর প্র্যাকটিস হয়েছে", req: true },
      { id: "si3", text: "ইন্টারভিউ সফলভাবে সম্পন্ন হয়েছে", req: true },
      { id: "si4", text: "স্কুল থেকে Conditional/Pre-approval পাওয়া গেছে", req: true },
    ],
  },
  DOC_SUBMITTED: {
    icon: "📤", nextStatus: "COE_RECEIVED", nextLabel: "COE পেয়েছি",
    hint: "ডকুমেন্ট জমার পর স্কুল ২-৪ সপ্তাহে COE ইস্যু করবে",
    checklist: [
      { id: "ds1", text: "সব ডকুমেন্ট স্কুলে পৌঁছে গেছে", req: true },
      { id: "ds2", text: "Submission নম্বর/রিসিট পাওয়া গেছে", req: true },
      { id: "ds3", text: "স্কুল Recheck থাকলে দ্রুত সমাধান হয়েছে", req: false },
    ],
  },
  COE_RECEIVED: {
    icon: "🎉", nextStatus: "VISA_GRANTED", nextLabel: "ভিসা পেয়েছি",
    hint: "⚠️ COE সাধারণত ৩ মাস valid — দ্রুত ভিসা apply করুন!",
    checklist: [
      { id: "coe1", text: "COE নম্বর ও মেয়াদ রেকর্ড করা হয়েছে", req: true },
      { id: "coe2", text: "টিউশন ফি রেমিট্যান্স সম্পন্ন (ব্যাংক রিসিট সহ)", req: true },
      { id: "coe3", text: "Health Check — Chest X-Ray সম্পন্ন", req: true },
      { id: "coe4", text: "VFS / Visa Center appointment নেওয়া হয়েছে", req: true },
      { id: "coe5", text: "ভিসা আবেদন ফর্ম পূরণ ও জমা হয়েছে", req: true },
    ],
  },
  VISA_GRANTED: {
    icon: "🛂", nextStatus: "ARRIVED", nextLabel: "গন্তব্যে পৌঁছেছে",
    hint: "ভিসা পাওয়ার পর সার্ভিস চার্জ কালেক্ট ও প্রস্থান প্রস্তুতি নিন",
    checklist: [
      { id: "vg1", text: "ভিসা স্টিকার পাসপোর্টে লেগেছে ও যাচাই হয়েছে", req: true },
      { id: "vg2", text: "সার্ভিস চার্জ (৫০,০০০৳) কালেক্ট হয়েছে", req: true },
      { id: "vg3", text: "ফ্লাইট বুকিং সম্পন্ন ও কনফার্ম", req: true },
      { id: "vg4", text: "Airport assistance arrange হয়েছে", req: false },
      { id: "vg5", text: "Pre-departure briefing দেওয়া হয়েছে", req: true },
      { id: "vg6", text: "জরুরি যোগাযোগ নম্বর ও স্কুল ঠিকানা দেওয়া হয়েছে", req: true },
    ],
  },
  ARRIVED: {
    icon: "✈️", nextStatus: "COMPLETED", nextLabel: "প্রক্রিয়া সম্পন্ন করুন",
    hint: "স্টুডেন্ট সেটেল হলে ও শোকাই ফি পেলে Completed করুন",
    checklist: [
      { id: "ar1", text: "নিরাপদে গন্তব্যে পৌঁছানো কনফার্ম হয়েছে", req: true },
      { id: "ar2", text: "স্কুলে রিপোর্ট সম্পন্ন হয়েছে", req: true },
      { id: "ar3", text: "Residence Card প্রসেস শুরু হয়েছে", req: false },
      { id: "ar4", text: "ব্যাংক একাউন্ট খোলা হয়েছে", req: false },
      { id: "ar5", text: "শোকাই (Shokai) ফি স্কুল থেকে পাওয়া গেছে", req: false },
    ],
  },
  COMPLETED: {
    icon: "🏁", nextStatus: null, nextLabel: null,
    hint: "🎉 সব প্রক্রিয়া সফলভাবে সম্পন্ন হয়েছে!",
    checklist: [
      { id: "cp1", text: "সব পেমেন্ট কালেক্ট সম্পন্ন", req: true },
      { id: "cp2", text: "শোকাই ফি প্রাপ্ত", req: false },
      { id: "cp3", text: "স্টুডেন্টের ফাইল আর্কাইভ করা হয়েছে", req: true },
    ],
  },
};
