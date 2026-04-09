import React, { useState, useEffect, useMemo } from "react";
import { Plus, Briefcase, Users, TrendingUp, Clock, Search, X, Edit3, Trash2 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import Card from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import DeleteConfirmModal from "../../components/ui/DeleteConfirmModal";
import Pagination from "../../components/ui/Pagination";
import SortHeader from "../../components/ui/SortHeader";
import useSortable from "../../hooks/useSortable";
import PhoneInput, { formatPhoneDisplay } from "../../components/ui/PhoneInput";
import { partners as partnersApi } from "../../lib/api";

/**
 * PartnerAgencyPage — পার্টনার এজেন্সি (B2B)
 * API থেকে real data — CRUD
 */

export default function PartnerAgencyPage() {
  const t = useTheme();
  const toast = useToast();
  const { t: tr } = useLanguage();

  // সার্ভিস label mapping — tr() ব্যবহার করে i18n সাপোর্ট
  const SERVICE_LABELS = {
    doc_processing: tr("partners.svcDocProcessing"), visa_processing: tr("partners.svcVisaProcessing"),
    translation: tr("partners.svcTranslation"), school_selection: tr("partners.svcSchoolSelection"),
    interview_prep: tr("partners.svcInterviewPrep"), full_package: tr("partners.svcFullPackage"),
  };

  // ── Data state ──
  const [partnersList, setPartnersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedStudents, setExpandedStudents] = useState([]);
  const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "", services: [], commission_rate: "", notes: "" });

  // ── Search, pagination, sort ──
  const [searchQ, setSearchQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { sortKey, sortDir, toggleSort, sortFn } = useSortable("name");

  // ── API থেকে data লোড ──
  const loadData = async () => {
    try {
      const data = await partnersApi.list();
      setPartnersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Partners load error:", err);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── KPI ──
  const totalStudents = partnersList.reduce((s, p) => s + (p.studentCount || 0), 0);
  const totalRevenue = partnersList.reduce((s, p) => s + (p.revenue || 0), 0);
  const totalDue = partnersList.reduce((s, p) => s + (p.due || 0), 0);

  // ── সার্চ ফিল্টার ──
  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return partnersList;
    return partnersList.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.contact_person || "").toLowerCase().includes(q) ||
      (p.phone || "").includes(q)
    );
  }, [searchQ, partnersList]);

  // ── Sort + Paginate ──
  const sorted = useMemo(() => sortFn(filtered), [filtered, sortKey, sortDir]);
  const safePage = Math.min(page, Math.max(1, Math.ceil(sorted.length / pageSize)));
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── partner save (create/edit) ──
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(tr("partners.errName")); return; }
    const payload = { ...form, commission_rate: Number(form.commission_rate) || 0 };
    try {
      if (editingId) {
        await partnersApi.update(editingId, payload);
        toast.updated(tr("partners.partnerLabel"));
      } else {
        await partnersApi.create(payload);
        toast.success(tr("partners.addedSuccess"));
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: "", contact_person: "", phone: "", email: "", address: "", services: [], commission_rate: "", notes: "" });
      loadData();
    } catch (err) {
      toast.error(err.message || tr("partners.saveFailed"));
    }
  };

  // ── partner delete ──
  const handleDelete = async (id) => {
    try {
      await partnersApi.remove(id);
      toast.success(tr("partners.deletedSuccess"));
      setDeleteTarget(null);
      loadData();
    } catch (err) { toast.error(err.message || tr("partners.deleteFailed")); }
  };

  // ── Edit open ──
  const openEdit = (p) => {
    setForm({ name: p.name || "", contact_person: p.contact_person || "", phone: p.phone || "", email: p.email || "", address: p.address || "", services: p.services || [], commission_rate: String(p.commission_rate || ""), notes: p.notes || "" });
    setEditingId(p.id); setShowForm(true);
  };

  // ── Expand row — partner-এর students load ──
  const toggleExpand = async (partnerId) => {
    if (expandedId === partnerId) { setExpandedId(null); return; }
    try {
      const data = await partnersApi.getStudents(partnerId);
      setExpandedStudents(Array.isArray(data) ? data : []);
    } catch { setExpandedStudents([]); }
    setExpandedId(partnerId);
  };

  // ── Currency ──
  const fmt = (n) => `৳${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-5 anim-fade">
      {/* হেডার */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">{tr("partners.title")}</h2>
          <p className="text-xs mt-0.5" style={{ color: t.muted }}>{tr("partners.subtitle")}</p>
        </div>
        <Button icon={Plus} onClick={() => setShowForm(true)}>{tr("partners.addNew")}</Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: tr("partners.activePartners"), value: partnersList.filter(p => p.status === "active").length, color: t.cyan, icon: Briefcase },
          { label: tr("partners.totalStudents"), value: totalStudents, color: t.purple, icon: Users },
          { label: tr("partners.revenue"), value: `৳${totalRevenue > 1000 ? (totalRevenue / 1000).toFixed(0) + "K" : totalRevenue}`, color: t.emerald, icon: TrendingUp },
          { label: tr("partners.due"), value: `৳${totalDue > 1000 ? (totalDue / 1000).toFixed(0) + "K" : totalDue}`, color: totalDue > 0 ? t.rose : t.emerald, icon: Clock },
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

      {/* নতুন পার্টনার ফর্ম */}
      {showForm && (
        <Card delay={50}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{editingId ? tr("partners.editPartner") : tr("partners.addTitle")}</h3>
            <button onClick={() => setShowForm(false)}><X size={16} style={{ color: t.muted }} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: "name", label: tr("partners.agencyName"), ph: tr("partners.namePlaceholder") },
              { key: "contact_person", label: tr("partners.contactPerson"), ph: tr("partners.contactPlaceholder") },
              { key: "email", label: tr("partners.emailLabel"), ph: "email@example.com" },
              { key: "address", label: tr("partners.addressLabel"), ph: tr("partners.addressPlaceholder") },
              { key: "commission_rate", label: tr("partners.commissionRate"), ph: "10" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                  placeholder={f.ph} />
              </div>
            ))}
            <div>
              <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{tr("partners.phoneLbl")}</label>
              <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} size="sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: t.muted }}>{tr("partners.notesLabel")}</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none h-16 resize-none"
                style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text }}
                placeholder={tr("partners.notesPlaceholder")} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="xs" onClick={() => { setShowForm(false); setEditingId(null); }}>{tr("common.cancel")}</Button>
            <Button size="xs" onClick={handleSave}>{tr("common.save")}</Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card delay={200}>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[200px]"
            style={{ background: t.inputBg, border: `1px solid ${t.inputBorder}` }}>
            <Search size={14} style={{ color: t.muted }} />
            <input value={searchQ} onChange={e => { setSearchQ(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-xs flex-1" style={{ color: t.text }}
              placeholder={tr("partners.searchPlaceholder")} />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs" style={{ color: t.muted }}>{tr("common.loading")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                  <SortHeader label={tr("common.name")} sortKey="name" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label={tr("partners.contactPerson")} sortKey="contact_person" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{tr("common.phone")}</th>
                  <SortHeader label={tr("partners.studentHeader")} sortKey="studentCount" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label={tr("partners.revenue")} sortKey="revenue" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label={tr("partners.due")} sortKey="due" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <SortHeader label={tr("partners.statusHeader")} sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={toggleSort} />
                  <th className="text-right py-3 px-4 text-[10px] uppercase tracking-wider font-medium" style={{ color: t.muted }}>{tr("partners.actionHeader")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-xs" style={{ color: t.muted }}>{tr("partners.noPartners")}</td></tr>
                )}
                {paginated.map(p => (
                  <React.Fragment key={p.id}>
                  <tr style={{ borderBottom: `1px solid ${t.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td className="py-3 px-4 cursor-pointer" onClick={() => toggleExpand(p.id)}>
                      <p className="font-semibold" style={{ color: t.text }}>{p.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: t.muted }}>{p.address || "—"}</p>
                    </td>
                    <td className="py-3 px-4" style={{ color: t.text }}>{p.contact_person || "—"}</td>
                    <td className="py-3 px-4" style={{ color: t.muted }}>{formatPhoneDisplay(p.phone)}</td>
                    <td className="py-3 px-4 text-center font-bold cursor-pointer" style={{ color: t.cyan }} onClick={() => toggleExpand(p.id)}>{p.studentCount || 0}</td>
                    <td className="py-3 px-4 font-mono font-semibold" style={{ color: t.emerald }}>{fmt(p.revenue)}</td>
                    <td className="py-3 px-4 font-mono font-semibold" style={{ color: (p.due || 0) > 0 ? t.rose : t.emerald }}>
                      {(p.due || 0) > 0 ? fmt(p.due) : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge color={p.status === "active" ? t.emerald : t.muted} size="xs">
                        {p.status === "active" ? tr("partners.active") : tr("partners.inactive")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                          onMouseEnter={e => e.currentTarget.style.color = t.cyan}
                          onMouseLeave={e => e.currentTarget.style.color = t.muted} title={tr("common.edit")}>
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg transition" style={{ color: t.muted }}
                          onMouseEnter={e => e.currentTarget.style.color = t.rose}
                          onMouseLeave={e => e.currentTarget.style.color = t.muted} title={tr("common.delete")}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* ── Expanded — partner-এর students তালিকা ── */}
                  {expandedId === p.id && (
                    <tr><td colSpan={8} style={{ background: t.inputBg }}>
                      <div className="px-6 py-3">
                        <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: t.muted }}>
                          {p.name}{tr("partners.studentsOf")} ({expandedStudents.length})
                        </p>
                        {expandedStudents.length === 0 ? (
                          <p className="text-xs py-2" style={{ color: t.muted }}>{tr("partners.noStudents")}</p>
                        ) : (
                          <div className="space-y-1.5">
                            {expandedStudents.map(ps => (
                              <div key={ps.id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded-lg transition"
                                onMouseEnter={e => e.currentTarget.style.background = t.hoverBg}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                <span className="font-medium flex-1">{ps.students?.name_en || ps.student_name || "—"}</span>
                                <span style={{ color: t.muted }}>{ps.student_id || ""}</span>
                                <span className="font-mono" style={{ color: t.emerald }}>{tr("partners.fee")}: {fmt(ps.fee)}</span>
                                <span className="font-mono" style={{ color: ps.paid >= ps.fee ? t.emerald : t.amber }}>{tr("partners.payment")}: {fmt(ps.paid)}</span>
                                <Badge color={ps.paid >= ps.fee ? t.emerald : (ps.paid > 0 ? t.amber : t.rose)} size="xs">
                                  {ps.paid >= ps.fee ? tr("partners.paidFull") : ps.paid > 0 ? tr("partners.partial") : tr("partners.due")}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td></tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination total={sorted.length} page={safePage} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      </Card>

      {/* ── ডিলিট কনফার্ম মোডাল ── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDelete(deleteTarget.id)}
        itemName={deleteTarget?.name || ""}
      />
    </div>
  );
}
