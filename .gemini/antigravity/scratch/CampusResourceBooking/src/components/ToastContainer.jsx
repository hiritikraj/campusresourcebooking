import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const styles = {
  success: {
    container: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  error: {
    container: 'border-red-200 bg-red-50 text-red-900',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
  info: {
    container: 'border-royal-200 bg-royal-50 text-navy-800',
    icon: Info,
    iconColor: 'text-royal-600',
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const cfg = styles[toast.type] || styles.info;
        const Icon = cfg.icon;
        return (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all ${cfg.container}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.iconColor}`} />
            <div className="min-w-0 flex-1">
              {toast.title && (
                <p className="text-sm font-semibold leading-5">{toast.title}</p>
              )}
              {toast.message && (
                <p className="mt-0.5 text-sm leading-5 opacity-90">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded-md p-1 opacity-60 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
