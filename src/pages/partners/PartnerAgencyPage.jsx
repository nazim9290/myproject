import { useState, useMemo } from "react";
import { Plus, Briefcase, Users, TrendingUp, Clock, Search } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import { PARTNER_AGENCIES, SERVICE_LABELS } from "../../data/mockData";

export default function PartnerAgencyPage() {
  const t = useTheme();

  // সার্চ, পেজিনেশন ও সর্টিং স্টেট
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");

  // KPI হিসাব
  const totalStudents = PARTNER_AGENCIES.reduce((s, p) => s + p.students.length, 0);
  const totalRevenue = PARTNER_AGENCIES.reduce((s, p) => s + p.students.reduce((ss, st) => ss + st.paid, 0), 0);
  const totalDue = PARTNER_AGENCIES.reduce((s, p) => s + p.students.reduce((ss, st) => ss + (st.fee - st.paid), 0), 0);

  // ফ্ল্যাট ডাটা — সর্টিং-এর জন্য computed ফিল্ড যোগ
  const partnersFlat = useMemo(() =>
    PARTNER_AGENCIES.map((p) => ({
      ...p,
      studentCount: p.students.length,
      revenue: p.students.reduce((s, st) => s + st.paid, 0),
      due: p.students.reduce((s, st) => s + (st.fee - st.paid), 0),
    })),
  []);

  // সার্চ ফিল্টার
  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return partnersFlat;
    return partnersFlat.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.contact.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.services.some((s) => (SERVICE_LABELS[s] || s).toLowerCase().includes(q))
    );
  }, [searchQ, partnersFlat]);

  // সর্ট প্রয়োগ
  const sorted = useMemo(() => sortFn(filtered), [filtered, sortKey, sortDir]);

  // পেজিনেশন
  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5 anim-fade">
      {/* হেডার */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">পার্টনার এজেন্সি (B2B)</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>অন্য এজেন্সির স্টুডেন্ট প্রসেসিং</p>
        </div>
        <Button icon={Plus}>নতুন পার্টনার</Button>
      </div>

      {/* KPI কার্ড */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "সক্রিয় পার্টনার", value: PARTNER_AGENCIES.filter((p) => p.status === "active").length, color: t.cyan, icon: Briefcase },
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

      {/* সার্চ বার */}
      <Card delay={200}>
        <div className="flex flex-wrap gap-3 items-center">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}
          >
            <Search size={14} style={{ color: t.muted }} />
            <input
              value={searchQ}
              onChange={(e) => { setSearchQ(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-xs flex-1"
              style={{ color: t.text }}
              placeholder="নাম, যোগাযোগ, ফোন দিয়ে খুঁজুন..."
            />
          </div>
        </div>

        {/* পার্টনার টেবিল */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <SortHeader label="নাম" sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="যোগাযোগ" sortKey="contact" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>সার্ভিস</th>
                <SortHeader label="স্টুডেন্ট" sortKey="studentCount" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="রেভিনিউ" sortKey="revenue" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="বকেয়া" sortKey="due" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                <SortHeader label="স্ট্যাটাস" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs" style={{ color: t.muted }}>
                    কোনো পার্টনার পাওয়া যায়নি
                  </td>
                </tr>
              )}
              {paginated.map((partner) => (
                <tr
                  key={partner.id}
                  style={{ borderBottom: `1px solid ${t.border}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.hoverBg)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* নাম */}
                  <td className="py-3 px-4">
                    <p className="font-semibold" style={{ color: t.text }}>{partner.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{partner.address}</p>
                  </td>

                  {/* যোগাযোগ */}
                  <td className="py-3 px-4">
                    <p style={{ color: t.text }}>{partner.contact}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{partner.phone}</p>
                  </td>

                  {/* সার্ভিস */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {partner.services.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: `${t.purple}15`, color: t.purple }}
                        >
                          {SERVICE_LABELS[s] || s}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* স্টুডেন্ট সংখ্যা */}
                  <td className="py-3 px-4 text-center font-bold" style={{ color: t.cyan }}>
                    {partner.studentCount}
                  </td>

                  {/* রেভিনিউ */}
                  <td className="py-3 px-4 font-mono font-semibold" style={{ color: t.emerald }}>
                    ৳{partner.revenue.toLocaleString("en-IN")}
                  </td>

                  {/* বকেয়া */}
                  <td className="py-3 px-4 font-mono font-semibold" style={{ color: partner.due > 0 ? t.rose : t.emerald }}>
                    {partner.due > 0 ? `৳${partner.due.toLocaleString("en-IN")}` : "—"}
                  </td>

                  {/* স্ট্যাটাস */}
                  <td className="py-3 px-4">
                    <Badge color={partner.status === "active" ? t.emerald : t.muted} size="xs">
                      {partner.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* পেজিনেশন */}
        <Pagination
          total={sorted.length}
          page={safePage}
          pageSize={pageSize}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </Card>
    </div>
  );
}
