import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { DOC_STATUS_CONFIG } from "../../data/mockData";
import { INITIAL_STUDENTS } from "../../data/students";

export default function StudentPortalPage() {
  const t = useTheme();
  const student = INITIAL_STUDENTS[0];
  const docs = [
    { name: "পাসপোর্ট", status: "verified" },
    { name: "জন্ম নিবন্ধন", status: "issue" },
    { name: "SSC সার্টিফিকেট", status: "verified" },
    { name: "SSC মার্কশিট", status: "verified" },
    { name: "HSC সার্টিফিকেট", status: "not_submitted" },
    { name: "HSC মার্কশিট", status: "not_submitted" },
    { name: "ফ্যামিলি সার্টিফিকেট", status: "submitted" },
    { name: "ব্যাংক স্টেটমেন্ট", status: "not_submitted" },
    { name: "ছবি", status: "verified" },
    { name: "JLPT Certificate", status: "submitted" },
  ];
  const verified = docs.filter((d) => d.status === "verified").length;
  const pct = Math.round((verified / docs.length) * 100);
  const payments = [
    { item: "কোর্স ফি (১ম কিস্তি)", amount: 15000, status: "paid" },
    { item: "কোর্স ফি (২য় কিস্তি)", amount: 15000, status: "paid" },
    { item: "কোর্স ফি (৩য় কিস্তি)", amount: 15000, status: "due" },
    { item: "ডক প্রসেসিং ফি", amount: 15000, status: "due" },
  ];

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold" style={{ background: `linear-gradient(135deg, ${t.cyan}30, ${t.purple}30)`, color: t.cyan }}>MR</div>
        <div>
          <h2 className="text-xl font-bold">স্বাগতম, {student.name_bn}!</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{student.id} • {student.school} • {student.batch}</p>
        </div>
      </div>

      <Card delay={50}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl" style={{ background: `${t.amber}15` }}>📄</div>
          <div className="flex-1">
            <p className="text-sm font-bold">বর্তমান অবস্থা: <span style={{ color: t.amber }}>ডকুমেন্ট কালেকশন চলছে</span></p>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>কিছু ডকুমেন্ট বাকি — নিচে দেখুন</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card delay={100}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">📄 আমার ডকুমেন্ট</h3>
            <span className="text-xs font-bold" style={{ color: pct >= 70 ? t.emerald : t.amber }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: `${t.muted}15` }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 70 ? t.emerald : t.amber }} />
          </div>
          <div className="space-y-1.5">
            {docs.map((doc, i) => {
              const st = DOC_STATUS_CONFIG[doc.status] || { color: t.muted, icon: "📄", label: doc.status };
              return (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: `${st.color}06`, border: `1px solid ${st.color}12` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{st.icon}</span>
                    <span className="text-xs font-medium">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={st.color} size="xs">{st.label}</Badge>
                    {doc.status === "not_submitted" && (
                      <button className="px-2 py-1 rounded text-[9px] font-medium" style={{ background: `${t.cyan}15`, color: t.cyan }}>আপলোড</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card delay={150}>
          <h3 className="text-sm font-semibold mb-3">💰 আমার পেমেন্ট</h3>
          <div className="space-y-2">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-lg"
                style={{ background: p.status === "due" ? `${t.rose}06` : `${t.emerald}06`, border: `1px solid ${p.status === "due" ? `${t.rose}12` : `${t.emerald}12`}` }}>
                <p className="text-xs font-medium">{p.item}</p>
                <div className="text-right">
                  <p className="text-xs font-bold font-mono" style={{ color: p.status === "due" ? t.rose : t.emerald }}>৳{p.amount.toLocaleString()}</p>
                  <Badge color={p.status === "paid" ? t.emerald : t.rose} size="xs">{p.status === "paid" ? "✓ Paid" : "Due"}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 text-xs mt-2" style={{ borderTop: `1px solid ${t.border}` }}>
            <span style={{ color: t.muted }}>মোট বাকি:</span>
            <span className="font-bold font-mono" style={{ color: t.rose }}>৳{payments.filter((p) => p.status === "due").reduce((s, p) => s + p.amount, 0).toLocaleString()}</span>
          </div>
        </Card>
      </div>

      <Card delay={200}>
        <h3 className="text-sm font-semibold mb-3">📋 আমার তথ্য</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "দেশ", value: student.country, icon: "🌏" },
            { label: "স্কুল", value: student.school, icon: "🏫" },
            { label: "ব্যাচ", value: student.batch, icon: "📅" },
            { label: "লেভেল", value: "N5", icon: "🏆" },
          ].map((info, i) => (
            <div key={i} className="p-3 rounded-xl text-center" style={{ background: t.inputBg }}>
              <span className="text-xl">{info.icon}</span>
              <p className="text-xs font-bold mt-1">{info.value}</p>
              <p className="text-[9px]" style={{ color: t.muted }}>{info.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="p-4 rounded-xl text-center" style={{ background: `${t.cyan}06`, border: `1px solid ${t.cyan}15` }}>
        <p className="text-xs" style={{ color: t.cyan }}>📞 সমস্যা হলে যোগাযোগ: 01700000001</p>
      </div>
    </div>
  );
}
