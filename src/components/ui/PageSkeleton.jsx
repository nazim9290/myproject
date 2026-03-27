import { useTheme } from "../../context/ThemeContext";

// ── Skeleton shimmer animation block ──
function Bone({ w = "100%", h = 12, rounded = "rounded-lg", className = "" }) {
  const t = useTheme();
  return (
    <div
      className={`skeleton-shimmer ${rounded} ${className}`}
      style={{ width: typeof w === "number" ? `${w}px` : w, height: h, background: `${t.muted}15` }}
    />
  );
}

// ── টেবিল Skeleton — rows + columns ──
function TableSkeleton({ cols = 5, rows = 8 }) {
  const t = useTheme();
  return (
    <div className="overflow-hidden rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
      {/* হেডার */}
      <div className="flex gap-4 px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} w={i === 0 ? 40 : i === 1 ? "30%" : "15%"} h={10} rounded="rounded" />
        ))}
      </div>
      {/* রো */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: `1px solid ${t.border}` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Bone key={c} w={c === 0 ? 40 : c === 1 ? "30%" : "15%"} h={c === 1 ? 14 : 10} rounded="rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── KPI কার্ড Skeleton ──
function KpiSkeleton({ count = 4 }) {
  const t = useTheme();
  return (
    <div className={`grid grid-cols-2 lg:${({ 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6" })[count] || "grid-cols-4"} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <Bone w={80} h={8} rounded="rounded" className="mb-3" />
          <Bone w={60} h={22} rounded="rounded" />
        </div>
      ))}
    </div>
  );
}

// ── ফিল্টার বার Skeleton ──
function FilterSkeleton() {
  const t = useTheme();
  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex-1 min-w-[200px] h-9 rounded-xl" style={{ background: `${t.muted}10` }}>
        <Bone w="100%" h={36} rounded="rounded-xl" />
      </div>
      <Bone w={120} h={36} rounded="rounded-xl" />
      <Bone w={120} h={36} rounded="rounded-xl" />
    </div>
  );
}

// ═══════════════════════════════════════════════
// সম্পূর্ণ পেজ Skeleton — ডাটা লোড হওয়ার আগে দেখাবে
// ═══════════════════════════════════════════════
export default function PageSkeleton({ type = "table" }) {
  const t = useTheme();

  return (
    <div className="space-y-5 anim-fade">
      {/* পেজ হেডার */}
      <div className="flex items-center justify-between">
        <div>
          <Bone w={180} h={20} rounded="rounded-lg" className="mb-2" />
          <Bone w={120} h={10} rounded="rounded" />
        </div>
        <Bone w={110} h={34} rounded="rounded-xl" />
      </div>

      {/* KPI কার্ড */}
      <KpiSkeleton count={4} />

      {/* ফিল্টার বার */}
      <FilterSkeleton />

      {/* টেবিল বা কার্ড */}
      {type === "table" ? (
        <TableSkeleton cols={6} rows={8} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <Bone w={40} h={40} rounded="rounded-xl" />
                <div className="flex-1">
                  <Bone w="70%" h={14} rounded="rounded" className="mb-2" />
                  <Bone w="50%" h={10} rounded="rounded" />
                </div>
              </div>
              <Bone w="100%" h={8} rounded="rounded" className="mb-2" />
              <Bone w="80%" h={8} rounded="rounded" />
            </div>
          ))}
        </div>
      )}

      {/* পেজিনেশন placeholder */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <Bone w={140} h={10} rounded="rounded" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Bone key={i} w={28} h={28} rounded="rounded-lg" />
          ))}
        </div>
        <Bone w={100} h={10} rounded="rounded" />
      </div>
    </div>
  );
}

export { Bone, TableSkeleton, KpiSkeleton, FilterSkeleton };
