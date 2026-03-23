import { Plus, Briefcase, Users, TrendingUp, Clock, Phone, MapPin, User } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PARTNER_AGENCIES, SERVICE_LABELS } from "../../data/mockData";

export default function PartnerAgencyPage() {
  const t = useTheme();
  const totalStudents = PARTNER_AGENCIES.reduce((s, p) => s + p.students.length, 0);
  const totalRevenue = PARTNER_AGENCIES.reduce((s, p) => s + p.students.reduce((ss, st) => ss + st.paid, 0), 0);
  const totalDue = PARTNER_AGENCIES.reduce((s, p) => s + p.students.reduce((ss, st) => ss + (st.fee - st.paid), 0), 0);

  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Partner Agencies (B2B)</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>অন্য এজেন্সির স্টুডেন্ট প্রসেসিং</p>
        </div>
        <Button icon={Plus}>Add Partner</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Partners", value: PARTNER_AGENCIES.filter((p) => p.status === "active").length, color: t.cyan, icon: Briefcase },
          { label: "মোট স্টুডেন্ট", value: totalStudents, color: t.purple, icon: Users },
          { label: "আয়", value: `৳${(totalRevenue / 1000).toFixed(0)}K`, color: t.emerald, icon: TrendingUp },
          { label: "বাকি", value: `৳${(totalDue / 1000).toFixed(0)}K`, color: totalDue > 0 ? t.rose : t.emerald, icon: Clock },
        ].map((kpi, i) => (
          <Card key={i} delay={i * 50}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: t.muted }}>{kpi.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                <kpi.icon size={16} style={{ color: kpi.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {PARTNER_AGENCIES.map((partner, i) => {
          const pRevenue = partner.students.reduce((s, st) => s + st.paid, 0);
          const pDue = partner.students.reduce((s, st) => s + (st.fee - st.paid), 0);
          return (
            <Card key={partner.id} delay={200 + i * 60}>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${t.amber}15` }}>🤝</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold">{partner.name}</p>
                    <Badge color={partner.status === "active" ? t.emerald : t.muted} size="xs">{partner.status === "active" ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] mb-2" style={{ color: t.textSecondary }}>
                    <span className="flex items-center gap-1"><User size={10} /> {partner.contact}</span>
                    <span className="flex items-center gap-1"><Phone size={10} /> {partner.phone}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {partner.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {partner.services.map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${t.purple}15`, color: t.purple }}>{SERVICE_LABELS[s] || s}</span>
                    ))}
                  </div>
                  {partner.students.length > 0 && (
                    <div className="space-y-1.5">
                      {partner.students.map((st) => (
                        <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg text-xs" style={{ background: t.hoverBg }}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{st.name}</span>
                            <StatusBadge status={st.status} />
                          </div>
                          <div className="flex items-center gap-3">
                            <span style={{ color: t.textSecondary }}>{st.service}</span>
                            <span className="font-mono font-semibold" style={{ color: t.emerald }}>৳{st.paid.toLocaleString()}</span>
                            {st.fee - st.paid > 0 && <Badge color={t.rose} size="xs">বাকি ৳{(st.fee - st.paid).toLocaleString()}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {partner.students.length === 0 && <p className="text-xs" style={{ color: t.muted }}>কোনো স্টুডেন্ট নেই</p>}
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>Students</p><p className="text-lg font-bold" style={{ color: t.cyan }}>{partner.students.length}</p></div>
                  <div><p className="text-[9px] uppercase" style={{ color: t.muted }}>Revenue</p><p className="text-sm font-bold font-mono" style={{ color: t.emerald }}>৳{pRevenue.toLocaleString()}</p></div>
                  {pDue > 0 && <div><p className="text-[9px] uppercase" style={{ color: t.rose }}>Due</p><p className="text-sm font-bold font-mono" style={{ color: t.rose }}>৳{pDue.toLocaleString()}</p></div>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
