export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-40">
      <Icon size={48} strokeWidth={1} />
      <p className="mt-3 text-sm font-medium">{title}</p>
      {subtitle && <p className="mt-1 text-xs">{subtitle}</p>}
    </div>
  );
}
