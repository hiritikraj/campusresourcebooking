import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 8) {
      showError('Password must be at least 8 characters.', 'Validation');
      return;
    }
    if (password !== confirm) {
      showError('Passwords do not match.', 'Validation');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      showSuccess('Password updated successfully. Please sign in.', 'Password Changed');
      navigate('/login', { replace: true });
    } catch (err) {
      showError(err.message || 'Failed to update password.', 'Error');
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
          <h1 className="mt-6 text-2xl font-bold text-navy-800">Set new password</h1>
          <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account.</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text" htmlFor="password">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label-text" htmlFor="confirm">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your new password"
                  className="input-field pl-10"
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm">
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
