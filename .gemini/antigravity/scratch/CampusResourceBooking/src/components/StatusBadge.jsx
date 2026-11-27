const BADGE_VARIANTS = {
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  student: 'bg-royal-50 text-royal-700 ring-royal-600/20',
  faculty: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  admin: 'bg-navy-800 text-white ring-navy-900/20',
};

export default function StatusBadge({ status, label }) {
  const key = String(status || '').toLowerCase();
  const classes = BADGE_VARIANTS[key] || 'bg-slate-100 text-slate-700 ring-slate-500/20';
  const text = label || (key ? key.charAt(0).toUpperCase() + key.slice(1) : '—');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      {text}
    </span>
  );
}
