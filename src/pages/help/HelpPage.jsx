import { useState } from "react";
import { HelpCircle, Search, ChevronDown, ChevronRight, BookOpen, Users, GraduationCap, FileText, DollarSign, Building, ClipboardList, Briefcase, Globe, Package, TrendingUp, Settings, Phone, Plane, Calendar, CheckCircle, Award, Lock, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";

// ═══════════════════════════════════════════════
// হেল্প গাইড ডাটা — প্রতিটি মডিউলের ধাপে ধাপে ব্যবহার নির্দেশিকা
// ═══════════════════════════════════════════════
const HELP_SECTIONS = [
  {
    id: "getting-started",
    icon: HelpCircle,
    title: "শুরু করুন",
    subtitle: "সিস্টেম ব্যবহারের প্রাথমিক ধারণা",
    color: "#22d3ee",
    topics: [
      {
        q: "AgencyBook কী?",
        a: `AgencyBook হলো Study Abroad এজেন্সির জন্য একটি সম্পূর্ণ CRM (Customer Relationship Management) সিস্টেম। এটি দিয়ে আপনি:
• ভিজিটর ও স্টুডেন্ট ম্যানেজ করতে পারবেন
• পাইপলাইনে প্রতিটি ধাপ ট্র্যাক করতে পারবেন
• ডকুমেন্ট, ফি, স্কুল ও ভিসা প্রক্রিয়া পরিচালনা করতে পারবেন
• হিসাব-নিকাশ, কর্মী ও ইনভেন্টরি ম্যানেজ করতে পারবেন`,
      },
      {
        q: "প্রথমবার লগইন করলে কী করবো?",
        a: `১. আপনার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন
২. বাম পাশের সাইডবার থেকে যেকোনো মেনু ক্লিক করুন
৩. Dashboard-এ আপনি সামগ্রিক অবস্থা দেখতে পাবেন
৪. প্রথমে "Visitors" বা "Students" মেনুতে যান`,
      },
      {
        q: "সাইডবার (বাম পাশের মেনু) কীভাবে কাজ করে?",
        a: `• বাম পাশে সব মেনু আইটেম আছে — ক্লিক করলে সেই পেজ খুলবে
• মোবাইলে উপরের ≡ বাটনে ক্লিক করে মেনু খুলুন
• ডেস্কটপে সাইডবার ছোট/বড় করতে পারবেন (collapse বাটন)
• প্রতিটি মেনুর পাশে সংখ্যা দেখায় (যেমন: কতজন স্টুডেন্ট আছে)`,
      },
      {
        q: "ডার্ক মোড / লাইট মোড কীভাবে বদলাবো?",
        a: `• উপরের ডান পাশে চাঁদ/সূর্য আইকনে ক্লিক করুন
• অথবা Settings → ডিজাইন ও থিম থেকে পরিবর্তন করুন`,
      },
    ],
  },
  {
    id: "visitors",
    icon: Users,
    title: "ভিজিটর ম্যানেজমেন্ট",
    subtitle: "যারা অফিসে আসে তাদের তথ্য সংরক্ষণ",
    color: "#7dd3fc",
    topics: [
      {
        q: "নতুন ভিজিটর কীভাবে যোগ করবো?",
        a: `১. সাইডবার থেকে "Visitors" মেনুতে যান
২. উপরে ডান পাশে "নতুন ভিজিটর" বাটনে ক্লিক করুন
৩. ফর্মে ব্যক্তিগত তথ্য পূরণ করুন (নাম ও ফোন আবশ্যক)
৪. শিক্ষাগত তথ্য, ভিসার ধরন, আগ্রহের দেশ ইত্যাদি পূরণ করুন
৫. "Save Visitor" বাটনে ক্লিক করুন`,
      },
      {
        q: "ভিজিটরের স্ট্যাটাস কীভাবে পরিবর্তন করবো?",
        a: `• ভিজিটরের নামে ক্লিক করুন — Detail View খুলবে
• "Status" অপশন থেকে Interested / Thinking / Not Interested বাছুন
• Follow-up বাটনে ক্লিক করলে আজকের তারিখ রেকর্ড হবে
• স্টুডেন্টে কনভার্ট করতে "Enroll" বাটনে ক্লিক করুন`,
      },
      {
        q: "ভিজিটর খুঁজে পাচ্ছি না — কী করবো?",
        a: `• উপরের সার্চ বক্সে নাম বা ফোন নম্বর লিখুন
• Active / Recent / Archive ট্যাব চেক করুন — পুরানো ভিজিটর Archive-এ চলে যায়
• Branch ফিল্টার চেক করুন — সঠিক Branch সিলেক্ট করুন
• "সব" ফিল্টার সিলেক্ট করে সব ভিজিটর দেখুন`,
      },
      {
        q: "ভিজিটরকে স্টুডেন্টে কনভার্ট করবো কীভাবে?",
        a: `১. ভিজিটরের Detail View-তে যান
২. "Enroll / কনভার্ট" বাটনে ক্লিক করুন
৩. নিশ্চিতকরণ দিন
৪. ভিজিটরের সব তথ্য স্টুডেন্ট হিসেবে কপি হয়ে যাবে
৫. এখন Students পেজে গিয়ে তাকে দেখতে পাবেন`,
      },
    ],
  },
  {
    id: "students",
    icon: GraduationCap,
    title: "স্টুডেন্ট পাইপলাইন",
    subtitle: "ভর্তি থেকে গন্তব্যে পৌঁছানো পর্যন্ত",
    color: "#6ee7b7",
    topics: [
      {
        q: "স্টুডেন্ট পাইপলাইন কী?",
        a: `পাইপলাইন হলো একটি স্টুডেন্টের সম্পূর্ণ যাত্রা — ১২টি ধাপে বিভক্ত:
১. দর্শনার্থী → ২. ফলোআপ → ৩. ভর্তি → ৪. কোর্স চলছে
৫. পরীক্ষায় পাস → ৬. ডক কালেকশন → ৭. ইন্টারভিউ
৮. ডক জমা → ৯. COE পেয়েছে → ১০. ভিসা পেয়েছে
১১. পৌঁছেছে → ১২. সম্পন্ন

প্রতিটি ধাপে কিছু কাজ (checklist) আছে — সব কাজ শেষ করলে পরের ধাপে যেতে পারবেন।`,
      },
      {
        q: "স্টুডেন্টকে পরের ধাপে নিয়ে যাবো কীভাবে?",
        a: `১. Students পেজ থেকে স্টুডেন্টের নামে ক্লিক করুন
২. Detail View-তে "এই ধাপে যা করতে হবে" চেকলিস্ট দেখুন
৩. প্রতিটি কাজ সম্পন্ন হলে চেকবক্সে টিক দিন
৪. সব আবশ্যক কাজ সম্পন্ন হলে "পরবর্তী ধাপ" বাটন সক্রিয় হবে
৫. বাটনে ক্লিক করুন — স্টুডেন্ট পরের ধাপে চলে যাবে`,
      },
      {
        q: "নতুন স্টুডেন্ট কীভাবে যোগ করবো?",
        a: `১. Students পেজে যান
২. "Add Student" বাটনে ক্লিক করুন
৩. নাম, ফোন, দেশ, ব্রাঞ্চ ইত্যাদি পূরণ করুন
৪. Save করুন — নতুন স্টুডেন্ট "VISITOR" ধাপে তৈরি হবে

অথবা: Visitors পেজ থেকে ভিজিটরকে কনভার্ট করুন`,
      },
      {
        q: "Excel থেকে স্টুডেন্ট Import করবো কীভাবে?",
        a: `১. Students পেজে "Excel Import" বাটনে ক্লিক করুন
২. প্রথমে Template ডাউনলোড করুন
৩. Template-এ স্টুডেন্টদের তথ্য বসান
৪. ফাইল আপলোড করুন
৫. Column Mapping করুন — Excel-এর কোন কলাম সিস্টেমের কোন field-এ যাবে
৬. Import বাটনে ক্লিক করুন`,
      },
      {
        q: "স্টুডেন্ট ফিল্টার ও সার্চ কীভাবে করবো?",
        a: `• সার্চ বক্সে নাম, ফোন, ID বা পাসপোর্ট নম্বর লিখুন
• Status ড্রপডাউন থেকে নির্দিষ্ট ধাপের স্টুডেন্ট দেখুন
• Country, Branch, Batch, School দিয়ে ফিল্টার করুন
• কলাম হেডারে ক্লিক করে সর্ট করুন (A→Z বা Z→A)
• Export বাটনে ক্লিক করে CSV ডাউনলোড করুন`,
      },
    ],
  },
  {
    id: "fees",
    icon: DollarSign,
    title: "ফি ও পেমেন্ট",
    subtitle: "স্টুডেন্ট ফি কালেকশন ও হিসাব",
    color: "#34d399",
    topics: [
      {
        q: "স্টুডেন্টের ফি কীভাবে দেখবো?",
        a: `১. Students পেজ থেকে স্টুডেন্টের নামে ক্লিক করুন
২. Detail View-তে "ফি ও পেমেন্ট" ট্যাবে যান
৩. এখানে দেখবেন:
   • মোট নির্ধারিত ফি (Fee Items)
   • কতটুকু পরিশোধ হয়েছে (Payments)
   • কত বাকি আছে`,
      },
      {
        q: "পেমেন্ট কালেক্ট করবো কীভাবে?",
        a: `১. স্টুডেন্টের Detail → ফি ট্যাবে যান
২. "পেমেন্ট যোগ করুন" বাটনে ক্লিক করুন
৩. পরিমাণ, পদ্ধতি (Cash/bKash/Bank), ক্যাটাগরি ও নোট দিন
৪. Save করুন — পেমেন্ট রেকর্ড হবে`,
      },
      {
        q: "Accounts পেজে কী কী দেখতে পাবো?",
        a: `• Overview: মোট আয়, ব্যয়, লাভ, বকেয়া — চার্ট সহ
• স্টুডেন্ট ফি: খাত অনুযায়ী কালেকশন ও স্টুডেন্ট-ওয়াইজ সারাংশ
• অন্যান্য আয়: Non-student income entries
• ব্যয়: Agency-র খরচ (বেতন, ভাড়া, মার্কেটিং ইত্যাদি)
• বকেয়া: কার কত বাকি আছে — কিস্তি কালেক্ট করতে পারবেন`,
      },
    ],
  },
  {
    id: "documents",
    icon: FileText,
    title: "ডকুমেন্ট ম্যানেজমেন্ট",
    subtitle: "স্টুডেন্টের ডকুমেন্ট তথ্য সংরক্ষণ",
    color: "#f472b6",
    topics: [
      {
        q: "ডকুমেন্ট পেজে কী করতে পারবো?",
        a: `• প্রতিটি স্টুডেন্টের ডকুমেন্ট টাইপ অনুযায়ী তথ্য পূরণ করুন
• পাসপোর্ট, সার্টিফিকেট, ব্যাংক স্টেটমেন্ট ইত্যাদির তথ্য রাখুন
• প্রতিটি ডকুমেন্টের সম্পূর্ণতা % দেখুন
• ব্যাচ অনুযায়ী ফিল্টার করে দেখুন কার ডকুমেন্ট অসম্পূর্ণ`,
      },
      {
        q: "নতুন ডকুমেন্ট টাইপ কীভাবে তৈরি করবো?",
        a: `১. Settings → ডকুমেন্ট টাইপ ট্যাবে যান
২. "নতুন টাইপ" বাটনে ক্লিক করুন
৩. নাম, ক্যাটাগরি ও প্রয়োজনীয় field যোগ করুন
৪. Save করুন — সব স্টুডেন্টের ডকুমেন্ট তালিকায় এটি যোগ হবে`,
      },
    ],
  },
  {
    id: "schools",
    icon: Building,
    title: "স্কুল ম্যানেজমেন্ট",
    subtitle: "গন্তব্য স্কুল ও Document Submission",
    color: "#c084fc",
    topics: [
      {
        q: "নতুন স্কুল কীভাবে যোগ করবো?",
        a: `১. Schools পেজে যান
২. "নতুন স্কুল" বাটনে ক্লিক করুন
৩. স্কুলের নাম (English + Japanese), শহর, দেশ ইত্যাদি দিন
৪. ক্যাপাসিটি, ভর্তি সময়, ফি ইত্যাদি পূরণ করুন
৫. Save করুন`,
      },
      {
        q: "Document Submission কীভাবে ট্র্যাক করবো?",
        a: `• Schools পেজের "Submissions" ট্যাবে যান
• এখানে দেখবেন কোন স্টুডেন্টের ডকুমেন্ট কোন স্কুলে জমা দেওয়া হয়েছে
• Status: জমা হয়েছে / গ্রহণ হয়েছে / Recheck আছে
• Recheck থাকলে "Rechecks" ট্যাবে সমস্যার বিবরণ দেখুন`,
      },
    ],
  },
  {
    id: "course",
    icon: BookOpen,
    title: "কোর্স ও ব্যাচ",
    subtitle: "ভাষা কোর্স ও ব্যাচ ম্যানেজমেন্ট",
    color: "#a5f3fc",
    topics: [
      {
        q: "নতুন ব্যাচ কীভাবে তৈরি করবো?",
        a: `১. Course পেজে যান
২. "নতুন ব্যাচ" বাটনে ক্লিক করুন
৩. ব্যাচের নাম, শুরু/শেষ তারিখ, শিক্ষক, ক্যাপাসিটি দিন
৪. Save করুন — ব্যাচ তৈরি হবে

ব্যাচে ক্লিক করলে Detail View-তে দেখবেন:
• ব্যাচের স্টুডেন্ট তালিকা
• উপস্থিতির হার
• পরীক্ষার ফলাফল`,
      },
    ],
  },
  {
    id: "attendance",
    icon: ClipboardList,
    title: "উপস্থিতি (Attendance)",
    subtitle: "দৈনিক হাজিরা রেকর্ড",
    color: "#fcd34d",
    topics: [
      {
        q: "উপস্থিতি কীভাবে নেবো?",
        a: `১. Attendance পেজে যান
২. তারিখ সিলেক্ট করুন (ডিফল্ট আজকের তারিখ)
৩. ব্যাচ সিলেক্ট করুন
৪. প্রতিটি স্টুডেন্টের পাশে ক্লিক করুন:
   • সবুজ (Present) → লাল (Absent) → হলুদ (Late) → আবার সবুজ
৫. উপস্থিতি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়`,
      },
    ],
  },
  {
    id: "agents",
    icon: Briefcase,
    title: "এজেন্ট ম্যানেজমেন্ট",
    subtitle: "রেফারেল এজেন্ট ও কমিশন",
    color: "#fb923c",
    topics: [
      {
        q: "এজেন্ট কী? কীভাবে কাজ করে?",
        a: `এজেন্ট হলো যারা আপনার এজেন্সিতে স্টুডেন্ট পাঠায় (রেফার করে)। প্রতিটি রেফারেলের জন্য এজেন্ট কমিশন পায়।

• Agents পেজে এজেন্ট তালিকা দেখুন
• প্রতিটি এজেন্টের রেফার করা স্টুডেন্ট সংখ্যা ও কমিশন দেখুন
• নতুন এজেন্ট যোগ করতে "নতুন এজেন্ট" বাটনে ক্লিক করুন`,
      },
    ],
  },
  {
    id: "partners",
    icon: Globe,
    title: "পার্টনার এজেন্সি (B2B)",
    subtitle: "অন্য এজেন্সির সাথে ব্যবসা",
    color: "#22d3ee",
    topics: [
      {
        q: "পার্টনার এজেন্সি কী?",
        a: `পার্টনার এজেন্সি হলো অন্য কোনো এজেন্সি যারা আপনার মাধ্যমে তাদের স্টুডেন্ট প্রসেস করে। এটি B2B (Business to Business) মডেল।

• Partners পেজে পার্টনার তালিকা দেখুন
• প্রতিটি পার্টনারের স্টুডেন্ট, রেভিনিউ ও বকেয়া দেখুন
• নতুন পার্টনার যোগ করতে "নতুন পার্টনার" বাটনে ক্লিক করুন`,
      },
      {
        q: "নতুন পার্টনার কীভাবে যোগ করবো?",
        a: `১. Partners পেজে যান
২. "নতুন পার্টনার" বাটনে ক্লিক করুন
৩. ফর্মে তথ্য পূরণ করুন:
   • এজেন্সির নাম
   • যোগাযোগকারীর নাম ও ফোন
   • ইমেইল ও ঠিকানা
   • কমিশন হার (শতকরা বা নির্দিষ্ট পরিমাণ)
৪. "সেভ করুন" ক্লিক করুন

পার্টনার যোগ হলে তাদের মাধ্যমে আসা স্টুডেন্ট assign করতে পারবেন।`,
      },
      {
        q: "পার্টনারের স্টুডেন্ট রেফারেল কীভাবে ট্র্যাক করবো?",
        a: `পার্টনারের নামে ক্লিক করলে Detail View-তে দেখবেন:

• রেফার করা মোট স্টুডেন্ট সংখ্যা
• প্রতিটি স্টুডেন্টের বর্তমান পাইপলাইন ধাপ
• মোট রেভিনিউ ও কমিশন হিসাব
• বকেয়া পরিমাণ (যদি থাকে)

নতুন স্টুডেন্ট যোগ করার সময় "পার্টনার" ফিল্ডে সংশ্লিষ্ট পার্টনার সিলেক্ট করুন — তাহলে স্বয়ংক্রিয়ভাবে লিংক হবে।`,
      },
      {
        q: "পার্টনারের কমিশন ও পেমেন্ট কীভাবে দেখবো?",
        a: `• Partners পেজে প্রতিটি পার্টনারের পাশে মোট রেভিনিউ ও বকেয়া দেখায়
• Detail View-তে পেমেন্ট হিস্ট্রি দেখুন — কবে, কত, কোন পদ্ধতিতে দেওয়া হয়েছে
• কমিশন গণনা: স্টুডেন্ট সংখ্যা × কমিশন হার
• Accounts পেজেও পার্টনার-ওয়াইজ লেনদেন দেখতে পাবেন`,
      },
    ],
  },
  {
    id: "hr",
    icon: Users,
    title: "HR ও বেতন",
    subtitle: "কর্মী ম্যানেজমেন্ট ও Payroll",
    color: "#f0abfc",
    topics: [
      {
        q: "কর্মী যোগ ও বেতন পরিশোধ কীভাবে করবো?",
        a: `কর্মী যোগ:
১. HR পেজে যান → "Add Employee" বাটনে ক্লিক করুন
২. নাম, পদবি, Branch, বেতন, ফোন দিন
৩. Save করুন

বেতন পরিশোধ:
১. "বেতন" ট্যাবে যান
২. কর্মীর পাশে "বেতন দিন" বাটনে ক্লিক করুন
৩. মাস, পরিমাণ, পদ্ধতি (Bank/Cash/bKash) দিন
৪. Save করুন — বেতন রেকর্ড হবে`,
      },
    ],
  },
  {
    id: "inventory",
    icon: Package,
    title: "ইনভেন্টরি",
    subtitle: "অফিস সরঞ্জাম ও সম্পদ ব্যবস্থাপনা",
    color: "#94a3b8",
    topics: [
      {
        q: "ইনভেন্টরি কীভাবে ম্যানেজ করবো?",
        a: `• Assets ট্যাব: Fixed assets (কম্পিউটার, ডেস্ক, প্রিন্টার ইত্যাদি)
• Consumables ট্যাব: ব্যবহারযোগ্য জিনিস (কাগজ, কালি, স্ট্যাপলার পিন)
• Movement Log: কোন জিনিস কখন কোথায় গেছে

নতুন আইটেম যোগ করতে "নতুন আইটেম" বাটনে ক্লিক করুন।`,
      },
    ],
  },
  {
    id: "reports",
    icon: TrendingUp,
    title: "রিপোর্ট",
    subtitle: "বিভিন্ন ধরনের রিপোর্ট ও অ্যানালিটিক্স",
    color: "#4ade80",
    topics: [
      {
        q: "কোন কোন রিপোর্ট পাবো?",
        a: `• Pipeline Report: কোন ধাপে কতজন স্টুডেন্ট
• Revenue Report: মাসিক/বার্ষিক আয়-ব্যয়
• Branch-wise Performance: কোন Branch কত স্টুডেন্ট প্রসেস করেছে
• Agent Performance: কোন এজেন্ট কত স্টুডেন্ট রেফার করেছে
• Export: যেকোনো রিপোর্ট CSV-তে ডাউনলোড করুন`,
      },
      {
        q: "রিপোর্ট কীভাবে ফিল্টার ও কাস্টমাইজ করবো?",
        a: `প্রতিটি রিপোর্টে ফিল্টার অপশন আছে:

• তারিখ: নির্দিষ্ট সময়কাল বাছুন (এই মাস, গত ৩ মাস, কাস্টম রেঞ্জ)
• ব্রাঞ্চ: নির্দিষ্ট ব্রাঞ্চের ডাটা আলাদাভাবে দেখুন
• দেশ: Japan, Germany বা অন্য দেশ অনুযায়ী ফিল্টার করুন
• স্ট্যাটাস: নির্দিষ্ট পাইপলাইন ধাপ অনুযায়ী দেখুন

ফিল্টার বদলালে চার্ট ও টেবিল স্বয়ংক্রিয়ভাবে আপডেট হবে।`,
      },
      {
        q: "রিপোর্ট CSV-তে Export কীভাবে করবো?",
        a: `১. Reports পেজে যান
২. যে রিপোর্ট দেখতে চান সেটি সিলেক্ট করুন
৩. প্রয়োজনে ফিল্টার দিন (তারিখ, ব্রাঞ্চ, দেশ)
৪. উপরের "Export CSV" বাটনে ক্লিক করুন
৫. CSV ফাইল ডাউনলোড হবে — Excel-এ খুলতে পারবেন

CSV ফাইলে Bengali text সঠিকভাবে দেখাবে (BOM encoding ব্যবহার করা হয়)।`,
      },
      {
        q: "অ্যানালিটিক্স চার্ট কীভাবে পড়বো?",
        a: `Reports পেজে বিভিন্ন ধরনের চার্ট দেখাবে:

• Bar Chart: মাসিক আয়-ব্যয় তুলনা — উচ্চতা বেশি মানে বেশি পরিমাণ
• Pipeline Funnel: কোন ধাপে কতজন — উপর থেকে নিচে সংখ্যা কমে আসে
• Pie Chart: খাতভিত্তিক আয় বা ব্যয়ের শতকরা হার
• Trend Line: সময়ের সাথে কোনো মেট্রিকের পরিবর্তন

চার্টে hover করলে সঠিক সংখ্যা ও তারিখ tooltip-এ দেখাবে।`,
      },
    ],
  },
  {
    id: "roles",
    icon: Lock,
    title: "রোল ও পারমিশন",
    subtitle: "কে কোন পেজ দেখতে বা কাজ করতে পারবে",
    color: "#c084fc",
    topics: [
      {
        q: "কোন কোন রোল আছে?",
        a: `সিস্টেমে ৯টি রোল আছে:
• Owner — সব কিছুর সম্পূর্ণ access
• Branch Manager — নিজ branch-এর সব কাজ (Settings/Users ছাড়া)
• Counselor — ভিজিটর ও স্টুডেন্ট কাউন্সেলিং
• Follow-up Executive — ভিজিটর ফলোআপ
• Admission Officer — ভর্তি প্রক্রিয়া, ডকুমেন্ট, স্কুল
• Language Teacher — কোর্স ও উপস্থিতি
• Document Collector — শুধু ডকুমেন্ট সংগ্রহ
• Document Processor — ডকুমেন্ট যাচাই ও জমা
• Accounts — আর্থিক হিসাব ও রিপোর্ট`,
      },
      {
        q: "রোল অনুযায়ী কে কী দেখতে পায়?",
        a: `প্রতিটি রোলের জন্য আলাদা menu দেখায়:
• Owner সব ২২+ মেনু দেখে
• Counselor শুধু Visitors, Students, Communication দেখে
• Accounts শুধু Dashboard, Accounts, Reports দেখে
• Language Teacher শুধু Course ও Attendance দেখে

রোল অনুযায়ী sidebar-এ শুধু অনুমোদিত পেজ দেখাবে — বাকিগুলো আড়াল থাকবে।`,
      },
      {
        q: "Read / Write / Delete পারমিশন কী?",
        a: `প্রতিটি module-এ ৩ ধরনের পারমিশন:
• Read (R) — ডাটা দেখতে পারবে
• Write (W) — নতুন যোগ ও সম্পাদনা করতে পারবে
• Delete (D) — মুছে ফেলতে পারবে

উদাহরণ: Document Collector students module-এ শুধু Read পারে — নতুন student যোগ বা delete করতে পারবে না।`,
      },
      {
        q: "নতুন ইউজার কীভাবে যোগ করবো?",
        a: `১. Users মেনুতে যান
২. "নতুন User" বাটনে ক্লিক করুন
৩. ফর্মে তথ্য পূরণ করুন:
   • নাম, ইমেইল ও পাসওয়ার্ড
   • রোল সিলেক্ট করুন (Owner, Branch Manager, Counselor ইত্যাদি)
   • ব্রাঞ্চ assign করুন
   • স্ট্যাটাস (Active / Inactive)
৪. Save করুন — ইউজার তৈরি হবে

নতুন ইউজার তার ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করতে পারবে। রোল অনুযায়ী সে শুধু অনুমোদিত পেজ দেখবে।`,
      },
      {
        q: "ইউজারের রোল বা পারমিশন পরিবর্তন করবো কীভাবে?",
        a: `১. Users পেজে যান
২. যে ইউজারের রোল বদলাতে চান তার নামে ক্লিক করুন
৩. রোল ড্রপডাউন থেকে নতুন রোল সিলেক্ট করুন
৪. Save করুন

কাস্টম পারমিশন দিতে:
১. "Permissions" ট্যাবে যান
২. রোল সিলেক্ট করুন
৩. প্রতিটি মডিউলের পাশে Read (R), Write (W), Delete (D) চেকবক্স দিন
৪. Save করুন — ঐ রোলের সব ইউজারের জন্য প্রযোজ্য হবে`,
      },
    ],
  },
  {
    id: "student-portal",
    icon: User,
    title: "স্টুডেন্ট পোর্টাল",
    subtitle: "স্টুডেন্ট নিজে লগইন করে তথ্য পূরণ করবে",
    color: "#34d399",
    topics: [
      {
        q: "স্টুডেন্ট পোর্টাল কী?",
        a: `স্টুডেন্ট পোর্টাল হলো একটি আলাদা লগইন যেখানে স্টুডেন্ট নিজে:
• নিজের ব্যক্তিগত তথ্য পূরণ করতে পারে
• পাসপোর্ট, ঠিকানা, পারিবারিক তথ্য দিতে পারে
• পাইপলাইন স্ট্যাটাস দেখতে পারে (কোন ধাপে আছে)
• পেমেন্ট সারাংশ দেখতে পারে (কত ফি, কত বাকি)

এতে এজেন্সির কাজ সহজ হয় — স্টুডেন্ট নিজে ডাটা দিলে আর হাতে লিখতে হয় না।`,
      },
      {
        q: "স্টুডেন্টের পোর্টাল অ্যাক্সেস কীভাবে চালু করবো?",
        a: `১. Students পেজে যান → স্টুডেন্টের নামে ক্লিক করুন
২. Detail View-তে "স্টুডেন্ট পোর্টাল" কার্ড দেখবেন
৩. "চালু করুন" বাটনে ক্লিক করুন
৪. একটি পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর)
৫. "চালু করুন" ক্লিক করুন

এখন স্টুডেন্টকে বলুন:
• লগইন পেজে "স্টুডেন্ট পোর্টাল লগইন" বাটন ক্লিক
• ফোন নম্বর + পাসওয়ার্ড দিয়ে লগইন`,
      },
      {
        q: "পোর্টাল বন্ধ কীভাবে করবো?",
        a: `১. Students → স্টুডেন্টের Detail View
২. "স্টুডেন্ট পোর্টাল" কার্ডে "বন্ধ করুন" ক্লিক
৩. নিশ্চিত করুন

বন্ধ করলে স্টুডেন্ট আর লগইন করতে পারবে না, তবে তার দেওয়া ডাটা মুছবে না।`,
      },
      {
        q: "স্টুডেন্ট কোন কোন তথ্য পূরণ করতে পারবে?",
        a: `Admin Settings → পাইপলাইন সেটিংস থেকে কনফিগার করা যায়। ডিফল্ট sections:
• ব্যক্তিগত তথ্য (নাম, ফোন, ইমেইল, জন্ম তারিখ, লিঙ্গ)
• পরিচয়পত্র ও পাসপোর্ট (NID, পাসপোর্ট নম্বর, মেয়াদ)
• ঠিকানা (স্থায়ী ও বর্তমান)
• পারিবারিক তথ্য (পিতা-মাতার নাম)
• শিক্ষাগত যোগ্যতা
• জাপানি ভাষা পরীক্ষা

স্টুডেন্ট স্ট্যাটাস, স্কুল, ব্যাচ পরিবর্তন করতে পারবে না — শুধু Admin পারবে।`,
      },
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "সেটিংস ও প্রশাসন",
    subtitle: "সিস্টেম কনফিগারেশন",
    color: "#fb923c",
    topics: [
      {
        q: "সেটিংস-এ কী কী পরিবর্তন করতে পারবো?",
        a: `• এজেন্সি তথ্য: এজেন্সির নাম, ফোন, ইমেইল, ঠিকানা
• ডিজাইন ও থিম: Dark/Light মোড, লেবেল সাইজ
• ডকুমেন্ট টাইপ: কোন কোন ডকুমেন্ট দরকার — field সহ কাস্টমাইজ
• পাইপলাইন সেটিংস: প্রতিটি ধাপের চেকলিস্ট আইটেম add/edit/delete
• ব্রাঞ্চ ম্যানেজমেন্ট: নতুন Branch যোগ ও ম্যানেজ
• নোটিফিকেশন: কোন কোন বিষয়ে alert পাবেন
• কাস্টম ফিল্ড: স্টুডেন্ট/ভিজিটরে অতিরিক্ত field যোগ
• ডাটা ব্যাকআপ: ডাটা Export ও ব্যাকআপ`,
      },
      {
        q: "পাইপলাইনের চেকলিস্ট কীভাবে পরিবর্তন করবো?",
        a: `১. Settings → পাইপলাইন সেটিংস ট্যাবে যান
২. যে ধাপের চেকলিস্ট পরিবর্তন করতে চান সেটিতে ক্লিক করুন
৩. নতুন আইটেম যোগ করতে নিচের ইনপুটে লিখে "যোগ করুন" ক্লিক করুন
৪. আইটেম এডিট করতে তার উপরে ক্লিক করুন
৫. আবশ্যক/ঐচ্ছিক টগল করতে "আবশ্যক" বাটনে ক্লিক করুন
৬. মুছতে ডিলিট আইকনে ক্লিক করুন
৭. সব শেষে "সংরক্ষণ" বাটনে ক্লিক করুন`,
      },
      {
        q: "User ও Permission কীভাবে ম্যানেজ করবো?",
        a: `১. Users মেনুতে যান
২. "Users" ট্যাবে ইউজার তালিকা দেখুন — সার্চ ও সর্ট করতে পারবেন
৩. নতুন ইউজার যোগ করতে "নতুন User" বাটনে ক্লিক করুন
৪. "Permissions" ট্যাবে Role অনুযায়ী কোন মডিউলে Read/Write/Delete করতে পারবে সেটি সেট করুন`,
      },
    ],
  },
  {
    id: "tips",
    icon: Award,
    title: "টিপস ও শর্টকাট",
    subtitle: "দ্রুত কাজ করার কৌশল",
    color: "#fbbf24",
    topics: [
      {
        q: "দ্রুত কাজ করার টিপস",
        a: `✅ সর্ট: যেকোনো টেবিলের কলাম হেডারে ক্লিক করলে A→Z বা Z→A সর্ট হবে
✅ সার্চ: প্রতিটি পেজে সার্চ বক্স আছে — নাম, ফোন, ID দিয়ে খুঁজুন
✅ ফিল্টার: Status, Branch, Country, Batch দিয়ে ফিল্টার করুন
✅ Export: যেকোনো তালিকা CSV-তে Export করুন (Excel-এ খুলতে পারবেন)
✅ পেজিনেশন: প্রতি পাতায় ১০/২০/৫০/১০০ জন দেখতে পারবেন`,
      },
      {
        q: "সাধারণ সমস্যা ও সমাধান",
        a: `❓ ডাটা দেখাচ্ছে না?
→ পেজ Refresh করুন (Ctrl + R)
→ ইন্টারনেট কানেকশন চেক করুন
→ লগআউট করে আবার লগইন করুন

❓ ফিল্টার কাজ করছে না?
→ সব ফিল্টার "সব/All" সিলেক্ট করে দেখুন
→ সার্চ বক্স খালি করুন

❓ পেজ লোড হচ্ছে না?
→ ব্রাউজারের Cache পরিষ্কার করুন (Ctrl + Shift + Delete)
→ অন্য ব্রাউজারে চেষ্টা করুন (Chrome/Firefox/Edge)`,
      },
    ],
  },
  {
    id: "dashboard",
    icon: TrendingUp,
    title: "ড্যাশবোর্ড",
    subtitle: "রিয়েল-টাইম KPI, চার্ট ও সতর্কতা",
    color: "#22d3ee",
    topics: [
      {
        q: "ড্যাশবোর্ডে কী কী দেখায়?",
        a: `ড্যাশবোর্ড API থেকে real-time ডাটা দেখায়:
• মোট স্টুডেন্ট ও Active সংখ্যা
• এই মাসের আয় ও বকেয়া
• ডক প্রসেসিং ও ভিসা পর্যায়ের সংখ্যা
• মাসিক আয় চার্ট (৬ মাস)
• পাইপলাইন ফানেল
• সতর্কতা (overdue task, বকেয়া, COE action)
• সাম্প্রতিক ভিজিটর ও আসন্ন টাস্ক`,
      },
      {
        q: "ড্যাশবোর্ডের চার্ট ও গ্রাফ কী দেখায়?",
        a: `ড্যাশবোর্ডে ২টি প্রধান চার্ট আছে:

১. মাসিক আয় চার্ট (Bar/Line):
   • গত ৬ মাসের মাসিক কালেকশন দেখায়
   • মাসের নাম ও টাকার পরিমাণ tooltip-এ দেখা যায়

২. পাইপলাইন ফানেল:
   • কোন ধাপে কতজন স্টুডেন্ট আছে — ভিজ্যুয়ালি দেখায়
   • সবচেয়ে বেশি স্টুডেন্ট কোন ধাপে আছে সেটি হাইলাইট হয়

চার্টে hover করলে বিস্তারিত তথ্য দেখতে পাবেন।`,
      },
      {
        q: "সাম্প্রতিক কার্যকলাপ (Recent Activity) কীভাবে দেখবো?",
        a: `ড্যাশবোর্ডের নিচের দিকে ২টি সেকশন আছে:

• সাম্প্রতিক ভিজিটর: শেষ কয়েকজন নতুন ভিজিটর — নাম, ফোন ও তারিখ সহ
• আসন্ন টাস্ক: যেসব টাস্ক overdue বা আজকে করতে হবে — লাল রঙে সতর্কতা দেখাবে

এই কার্ডগুলো থেকে সরাসরি ভিজিটর বা টাস্কে ক্লিক করে বিস্তারিত দেখতে পারবেন।`,
      },
      {
        q: "সতর্কতা (Alerts) কী এবং কীভাবে কাজ করে?",
        a: `ড্যাশবোর্ডে গুরুত্বপূর্ণ বিষয়ে সতর্কতা দেখায়:

• Overdue Task: নির্দিষ্ট সময়ের মধ্যে যে কাজ শেষ হয়নি
• বকেয়া ফি: কার ফি বাকি আছে — পরিমাণ সহ
• COE Action: যেসব স্টুডেন্টের COE সংক্রান্ত পদক্ষেপ দরকার

সতর্কতায় ক্লিক করলে সংশ্লিষ্ট পেজে চলে যাবেন। সতর্কতার সংখ্যা Dashboard-এর উপরের কার্ডেও দেখাবে।`,
      },
    ],
  },
  {
    id: "pre-departure",
    icon: Plane,
    title: "প্রি-ডিপার্চার ও VFS",
    subtitle: "COE থেকে Flight পর্যন্ত tracking",
    color: "#a855f7",
    topics: [
      {
        q: "প্রি-ডিপার্চার কীভাবে কাজ করে?",
        a: `COE পেয়েছে থেকে শুরু করে সব ধাপ track করা যায়:
📋 COE → 🏥 Health → 💰 Tuition → 🛂 VFS → ✅ Visa → ✈️ Flight
• প্রতিটি student-এর জন্য আলাদা checklist
• ক্লিক করে detail view-তে যান
• সব তথ্য পরিবর্তন করে "সেভ করুন" চাপুন`,
      },
      {
        q: "COE ট্র্যাকিং কীভাবে করবো?",
        a: `COE (Certificate of Eligibility) ট্র্যাক করতে:

১. Pre-Departure পেজে যান
২. COE ট্যাব/কলামে স্টুডেন্টের COE স্ট্যাটাস দেখুন:
   • আবেদন করা হয়নি
   • আবেদন করা হয়েছে
   • COE পেয়েছে (তারিখ সহ)
৩. COE নম্বর ও তারিখ ইনপুট দিন
৪. COE পেলে পরবর্তী ধাপ (Health Check, Tuition) সক্রিয় হবে`,
      },
      {
        q: "ফ্লাইট তথ্য কীভাবে যোগ করবো?",
        a: `১. Pre-Departure পেজ থেকে স্টুডেন্টে ক্লিক করুন
২. Detail View-তে "Flight" সেকশনে যান
৩. নিম্নলিখিত তথ্য পূরণ করুন:
   • ফ্লাইট নম্বর
   • প্রস্থানের তারিখ ও সময়
   • এয়ারলাইন্স নাম
   • গন্তব্য বিমানবন্দর
৪. "সেভ করুন" ক্লিক করুন

ফ্লাইট তথ্য দেওয়া হলে তালিকায় বিমান আইকন দেখাবে।`,
      },
      {
        q: "ডিপার্চার চেকলিস্ট কী কী আছে?",
        a: `প্রতিটি স্টুডেন্টের ডিপার্চার আগে যা চেক করতে হবে:

• COE গ্রহণ — আসল COE হাতে পেয়েছে
• Health Check — স্বাস্থ্য পরীক্ষা সম্পন্ন
• Tuition Fee — স্কুলে টিউশন ফি পরিশোধ
• VFS Appointment — ভিসা ইন্টারভিউ সম্পন্ন
• Visa Sticker — পাসপোর্টে ভিসা লাগানো হয়েছে
• Flight Booking — টিকেট কেনা হয়েছে

প্রতিটি ধাপে তারিখ ও status রেকর্ড করুন। সব ধাপ সম্পন্ন হলে সবুজ চেকমার্ক দেখাবে।`,
      },
    ],
  },
  {
    id: "excel-system-vars",
    icon: FileText,
    title: "Excel সিস্টেম ভ্যারিয়েবল",
    subtitle: "এজেন্সি, ব্রাঞ্চ, ব্যাচ — auto-fill",
    color: "#f59e0b",
    topics: [
      {
        q: "সিস্টেম ভ্যারিয়েবল কী?",
        a: `Excel template-এ {{sys_*}} placeholder ব্যবহার করলে auto-fill হবে:
• {{sys_agency_name}} — এজেন্সির নাম
• {{sys_branch_address}} — স্টুডেন্টের ব্রাঞ্চের ঠিকানা
• {{sys_today}} — আজকের তারিখ (2026-03-28)
• {{sys_today_jp}} — 2026年03月28日
• {{sys_batch_start:year}} — ব্যাচ শুরুর বছর
• {{sys_school_name_jp}} — স্কুলের জাপানি নাম
মোট ২৯টি সিস্টেম ভ্যারিয়েবল আছে — Excel পেজে ড্রপডাউনে দেখুন।`,
      },
      {
        q: "ব্রাঞ্চ ঠিকানা কীভাবে সেট করবো?",
        a: `Settings → ব্রাঞ্চ ম্যানেজমেন্ট → প্রতিটি branch-এর ঠিকানা, ফোন, ম্যানেজার দিন।
Excel-এ {{sys_branch_address}} লিখলে student-এর branch-এর ঠিকানা auto-fill হবে।`,
      },
    ],
  },
  {
    id: "prefix-id",
    icon: Lock,
    title: "Agency Prefix ID",
    subtitle: "SEC-S-2026-001 ফরম্যাটের ID",
    color: "#ec4899",
    topics: [
      {
        q: "Prefix ID কীভাবে কাজ করে?",
        a: `প্রতিটি entity-র ID এজেন্সির নামের আদ্যক্ষর দিয়ে তৈরি হয়:
"Sunrise Education" → SEC
• Student: SEC-S-2026-001
• Visitor: SEC-V-2026-001
• Payment: SEC-P-2026-001
Super Admin-এ নতুন এজেন্সি তৈরি করলে auto-generate হয়।`,
      },
    ],
  },
  {
    id: "bulk-actions",
    icon: CheckCircle,
    title: "বাল্ক অ্যাকশন",
    subtitle: "একসাথে অনেক student-এর কাজ",
    color: "#14b8a6",
    topics: [
      {
        q: "বাল্ক স্ট্যাটাস পরিবর্তন কীভাবে করবো?",
        a: `Students পেজে:
১. বাম পাশের checkbox-এ ক্লিক করে student সিলেক্ট করুন
২. উপরের "select all" checkbox দিয়ে পুরো পেজ সিলেক্ট করুন
৩. ড্রপডাউন থেকে নতুন status নির্বাচন করুন
৪. "পরিবর্তন করুন" চাপুন — একসাথে সবার status বদলে যাবে`,
      },
    ],
  },
];

export default function HelpPage() {
  const t = useTheme();
  const [searchQ, setSearchQ] = useState("");
  const [expandedSection, setExpandedSection] = useState("getting-started");
  const [expandedTopics, setExpandedTopics] = useState({});

  // সার্চ ফিল্টার — topic question ও answer-এ খুঁজবে
  const filteredSections = searchQ
    ? HELP_SECTIONS.map(sec => ({
        ...sec,
        topics: sec.topics.filter(t =>
          t.q.toLowerCase().includes(searchQ.toLowerCase()) ||
          t.a.toLowerCase().includes(searchQ.toLowerCase())
        ),
      })).filter(sec => sec.topics.length > 0)
    : HELP_SECTIONS;

  const toggleTopic = (sectionId, topicIdx) => {
    const key = `${sectionId}_${topicIdx}`;
    setExpandedTopics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // সার্চ করলে সব topic expand করো
  const isTopicExpanded = (sectionId, topicIdx) => {
    if (searchQ) return true;
    return expandedTopics[`${sectionId}_${topicIdx}`] || false;
  };

  return (
    <div className="space-y-5 anim-fade">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle size={22} style={{ color: t.cyan }} /> সাহায্য ও ব্যবহার নির্দেশিকা
          </h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>
            AgencyBook-এর সম্পূর্ণ গাইডলাইন — নন-টেকনিক্যাল ব্যবহারকারীদের জন্য
          </p>
        </div>
      </div>

      {/* ── সার্চ বার ── */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
        <Search size={16} style={{ color: t.muted }} />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          className="bg-transparent outline-none text-sm flex-1" style={{ color: t.text }}
          placeholder="আপনার প্রশ্ন লিখুন... (যেমন: স্টুডেন্ট যোগ, পেমেন্ট, ফিল্টার)" />
        {searchQ && (
          <button onClick={() => setSearchQ("")} className="p-1 rounded" style={{ color: t.muted }}>
            <span className="text-xs">মুছুন</span>
          </button>
        )}
      </div>

      {/* ── Quick Links ── */}
      {!searchQ && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {HELP_SECTIONS.slice(0, 6).map(sec => (
            <button key={sec.id} onClick={() => { setExpandedSection(sec.id); document.getElementById(`help-${sec.id}`)?.scrollIntoView({ behavior: "smooth" }); }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all"
              style={{ background: expandedSection === sec.id ? `${sec.color}15` : t.inputBg, border: `1px solid ${expandedSection === sec.id ? `${sec.color}40` : "transparent"}` }}
              onMouseEnter={e => e.currentTarget.style.background = `${sec.color}15`}
              onMouseLeave={e => { if (expandedSection !== sec.id) e.currentTarget.style.background = t.inputBg; }}>
              <sec.icon size={18} style={{ color: sec.color }} />
              <span className="text-[10px] font-medium" style={{ color: t.text }}>{sec.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Help Sections ── */}
      <div className="space-y-3">
        {filteredSections.map((sec, secIdx) => {
          const isOpen = searchQ || expandedSection === sec.id;
          return (
            <Card key={sec.id} delay={secIdx * 30}>
              <div id={`help-${sec.id}`}>
                {/* Section Header */}
                <button onClick={() => setExpandedSection(isOpen && !searchQ ? null : sec.id)}
                  className="w-full flex items-center gap-3 text-left">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${sec.color}15` }}>
                    <sec.icon size={16} style={{ color: sec.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{sec.title}</p>
                    <p className="text-[10px]" style={{ color: t.muted }}>{sec.subtitle}</p>
                  </div>
                  <span className="text-[10px] shrink-0 px-2 py-0.5 rounded-full" style={{ background: `${sec.color}15`, color: sec.color }}>
                    {sec.topics.length} টপিক
                  </span>
                  {searchQ ? null : isOpen ? <ChevronDown size={16} style={{ color: t.muted }} /> : <ChevronRight size={16} style={{ color: t.muted }} />}
                </button>

                {/* Topics */}
                {isOpen && (
                  <div className="mt-4 space-y-2">
                    {sec.topics.map((topic, tIdx) => {
                      const open = isTopicExpanded(sec.id, tIdx);
                      return (
                        <div key={tIdx} className="rounded-xl overflow-hidden"
                          style={{ background: t.inputBg, border: `1px solid ${open ? `${sec.color}30` : "transparent"}` }}>
                          {/* Question */}
                          <button onClick={() => toggleTopic(sec.id, tIdx)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition"
                            onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <span className="text-sm shrink-0" style={{ color: sec.color }}>Q</span>
                            <span className="text-xs font-semibold flex-1">{topic.q}</span>
                            {open ? <ChevronDown size={14} style={{ color: t.muted }} /> : <ChevronRight size={14} style={{ color: t.muted }} />}
                          </button>

                          {/* Answer */}
                          {open && (
                            <div className="px-4 pb-4 pt-0">
                              <div className="pl-7 text-xs leading-relaxed whitespace-pre-line" style={{ color: t.textSecondary }}>
                                {topic.a}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredSections.length === 0 && (
          <Card delay={0}>
            <div className="text-center py-10">
              <HelpCircle size={40} style={{ color: t.muted, opacity: 0.3 }} className="mx-auto mb-3" />
              <p className="text-sm font-medium" style={{ color: t.muted }}>কোনো ফলাফল পাওয়া যায়নি</p>
              <p className="text-[10px] mt-1" style={{ color: t.muted }}>অন্য কিছু দিয়ে খুঁজে দেখুন</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
