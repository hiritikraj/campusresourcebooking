import { Database } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

export default function SupabaseNotice({ compact = false }) {
  if (isSupabaseConfigured) return null;

  return (
    <div
      className={`rounded-xl border border-amber-200 bg-amber-50 text-amber-900 ${
        compact ? 'p-3.5 text-xs' : 'p-5 text-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">Supabase Connection Required</p>
          <p className="mt-1 leading-relaxed text-amber-800">
            Configure <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> in{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">.env</code> (or Vercel Environment Variables) and run the SQL scripts in{' '}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">supabase/</code> to load live resources and enable authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
