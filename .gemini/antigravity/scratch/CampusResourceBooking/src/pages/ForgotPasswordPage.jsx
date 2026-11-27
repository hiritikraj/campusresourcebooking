import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, BookOpen, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const { resetPassword, isSupabaseConfigured } = useAuth();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      showError('Supabase is not configured yet.', 'Setup Required');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      showSuccess('Password reset link sent! Check your college email.', 'Email Sent');
    } catch (err) {
      showError(err.message || 'Failed to send reset email.', 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-royal-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-navy-800">CampusBook</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-navy-800">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your college email and we'll send you a reset link.
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-base font-semibold text-navy-800">Check your email</h2>
              <p className="mt-2 text-sm text-slate-600">
                We&apos;ve sent a password reset link to{' '}
                <strong className="text-navy-800">{email}</strong>.
              </p>
              <Link to="/login" className="btn-primary mt-6 w-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="label-text" htmlFor="email">College Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-royal-600 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
