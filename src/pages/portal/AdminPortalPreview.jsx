import { useState, useEffect } from "react";
import { Eye, Search, ChevronRight, Check, Clock, User, FileText, DollarSign, Shield, X } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { PIPELINE_STATUSES } from "../../data/students";
import { api } from "../../hooks/useAPI";

/**
 * AdminPortalPreview — Admin যেকোনো স্টুডেন্ট সিলেক্ট করে দেখবে
 * "স্টুডেন্ট কী দেখছে" — Portal preview হিসেবে কাজ করবে
 */
export default function AdminPortalPreview({ students = [] }) {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();
  const [selectedId, setSelectedId] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [portalStudents, setPortalStudents] = useState([]);

  // portal access আছে এমন students filter
  useEffect(() => {
    // Backend থেকে students-এ portal_access field থাকলে সেটা ব্যবহার করো
    // না থাকলে সব students দেখাও (admin preview)
    setPortalStudents(students);
  }, [students]);

  const filtered = portalStudents.filter(s => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (s.name_en || "").toLowerCase().includes(q) || (s.phone || "").includes(q) || (s.id || "").toLowerCase().includes(q);
  });

  const selected = selectedId ? students.find(s => s.id === selectedId) : null;

  // ── Student Preview Mode ──
  if (selected) {
    const statusInfo = PIPELINE_STATUSES.find(p => p.code === selected.status);
    const feeItems = selected.fees?.items || [];
    const payments = selected.fees?.payments || [];
    const totalDue = feeItems.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

    return (
      <div className="space-y-5 anim-fade max-w-4xl mx-auto">
        {/* Admin banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: `${t.amber}10`, border: `1px solid ${t.amber}25` }}>
          <Eye size={16} style={{ color: t.amber }} />
          <div className="flex-1">
            <p className="text-xs font-semibold" style={{ color: t.amber }}>{tr("portal.adminPreviewMode")}</p>
            <p className="text-[10px]" style={{ color: t.muted }}>
              {tr("portal.adminPreviewDesc", { name: selected.name_en })}
            </p>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setSelectedId(null)}>{tr("portal.goBack")}</Button>
        </div>

        {/* Student header */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${t.emerald}30, ${t.cyan}30)`, color: t.emerald }}>
            {(selected.name_en || "S").charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{tr("portal.welcome", { name: selected.name_bn || selected.name_en })}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {selected.id} • {selected.school || "—"} • {selected.batch || "—"}
            </p>
          </div>
        </div>

        {/* Pipeline status */}
        <Card delay={50}>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${statusInfo?.color || t.cyan}15` }}>
              <Clock size={20} style={{ color: statusInfo?.color || t.cyan }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">
                {tr("portal.currentStatus")}: <span style={{ color: statusInfo?.color || t.cyan }}>{statusInfo?.label || selected.status}</span>
              </p>
            </div>
            <StatusBadge status={selected.status} />
          </div>
        </Card>

        {/* Portal access status */}
        <Card delay={80}>
          <div className="flex items-center gap-3">
            <Shield size={16} style={{ color: selected.portal_access ? t.emerald : t.muted }} />
            <div className="flex-1">
              <p className="text-xs font-semibold">
                {tr("portal.portalAccess")}: {" "}
                <span style={{ color: selected.portal_access ? t.emerald : t.rose }}>
                  {selected.portal_access ? `✅ ${tr("common.active")}` : `❌ ${tr("common.inactive")}`}
                </span>
              </p>
              {selected.portal_access && (
                <p className="text-[10px]" style={{ color: t.muted }}>
                  {tr("portal.loginInfo", { phone: selected.phone })}
                </p>
              )}
            </div>
            {!selected.portal_access && (
              <p className="text-[10px] px-2 py-1 rounded" style={{ background: `${t.rose}10`, color: t.rose }}>
                {tr("portal.enablePortalHint")}
              </p>
            )}
          </div>
        </Card>

        {/* Student data preview — যা পূরণ করেছে */}
        <Card delay={100}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <FileText size={14} style={{ color: t.cyan }} /> {tr("portal.studentData")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: tr("portal.nameEn"), value: selected.name_en },
              { label: tr("portal.nameBn"), value: selected.name_bn },
              { label: tr("common.phone"), value: selected.phone },
              { label: "WhatsApp", value: selected.whatsapp },
              { label: tr("common.email"), value: selected.email },
              { label: tr("portal.dob"), value: selected.dob },
              { label: tr("portal.gender"), value: selected.gender },
              { label: tr("portal.bloodGroup"), value: selected.blood_group },
              { label: tr("portal.nationality"), value: selected.nationality },
              { label: "NID", value: selected.nid },
              { label: tr("portal.passportNo"), value: selected.passport_number || selected.passport },
              { label: tr("portal.passportExpiry"), value: selected.passport_expiry },
              { label: tr("portal.permanentAddress"), value: selected.permanent_address },
              { label: tr("portal.currentAddress"), value: selected.current_address },
              { label: tr("portal.fatherName"), value: selected.father_name },
              { label: tr("portal.fatherNameEn"), value: selected.father_name_en },
              { label: tr("portal.motherName"), value: selected.mother_name },
              { label: tr("portal.motherNameEn"), value: selected.mother_name_en },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: t.inputBg }}>
                <span className="text-[10px] w-28 shrink-0 uppercase tracking-wider" style={{ color: t.muted }}>{item.label}</span>
                <span className="text-xs font-medium flex-1" style={{ color: item.value ? t.text : t.muted }}>
                  {item.value || "—"}
                </span>
                {item.value ? (
                  <Check size={12} style={{ color: t.emerald }} />
                ) : (
                  <X size={12} style={{ color: `${t.muted}50` }} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Fee summary */}
        <Card delay={150}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <DollarSign size={14} style={{ color: t.emerald }} /> {tr("portal.paymentSummary")}
          </h3>
          {feeItems.length > 0 ? (
            <>
              <div className="space-y-1.5">
                {feeItems.map((item, i) => (
                  <div key={i} className="flex justify-between p-2.5 rounded-lg" style={{ background: t.inputBg }}>
                    <span className="text-xs">{item.label || item.category}</span>
                    <span className="text-xs font-bold font-mono">৳{(item.amount || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-3 mt-3 text-xs" style={{ borderTop: `1px solid ${t.border}` }}>
                <span>{tr("common.total")}: <strong>৳{totalDue.toLocaleString("en-IN")}</strong></span>
                <span>{tr("portal.totalPaid")}: <strong style={{ color: t.emerald }}>৳{totalPaid.toLocaleString("en-IN")}</strong></span>
                <span>{tr("common.balance")}: <strong style={{ color: (totalDue - totalPaid) > 0 ? t.rose : t.emerald }}>৳{(totalDue - totalPaid).toLocaleString("en-IN")}</strong></span>
              </div>
            </>
          ) : (
            <p className="text-xs text-center py-4" style={{ color: t.muted }}>{tr("portal.noFeeRecord")}</p>
          )}
        </Card>
      </div>
    );
  }

  // ── Student Selection List ──
  return (
    <div className="space-y-5 anim-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye size={20} style={{ color: t.cyan }} /> {tr("portal.previewTitle")}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>
            {tr("portal.previewSubtitle")}
          </p>
        </div>
        <Badge color={t.cyan}>{tr("portal.studentCount", { count: students.length })}</Badge>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
        <Search size={14} style={{ color: t.muted }} />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
          placeholder={tr("portal.searchPlaceholder")} />
      </div>

      {/* Student list */}
      <Card delay={50}>
        <div className="space-y-1">
          {filtered.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: t.muted }}>
              {students.length === 0 ? tr("portal.noStudents") : tr("portal.noResults")}
            </p>
          )}
          {filtered.map((s, i) => (
            <button key={s.id} onClick={() => setSelectedId(s.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition"
              style={{ background: "transparent" }}
              onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: `${t.cyan}15`, color: t.cyan }}>
                {(s.name_en || "S").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{s.name_en}</p>
                <p className="text-[10px]" style={{ color: t.muted }}>{s.id} • {s.phone} • {s.branch || "—"}</p>
              </div>
              <StatusBadge status={s.status} />
              {s.portal_access ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.emerald}15`, color: t.emerald }}>{tr("portal.portalOn")}</span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${t.muted}15`, color: t.muted }}>{tr("portal.portalOff")}</span>
              )}
              <ChevronRight size={14} style={{ color: t.muted }} />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
