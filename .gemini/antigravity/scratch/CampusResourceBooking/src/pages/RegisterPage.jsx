import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import SupabaseNotice from '../components/SupabaseNotice';

export default function RegisterPage() {
  const { signUp, isSupabaseConfigured } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      showError('Supabase is not configured yet.', 'Setup Required');
      return;
    }

    const name = form.fullName.trim();
    if (name.length < 2) {
      showError('Full name must be at least 2 characters.', 'Validation');
      return;
    }
    if (form.password.length < 8) {
      showError('Password must be at least 8 characters.', 'Validation');
      return;
    }
    if (form.password !== form.confirmPassword) {
      showError('Passwords do not match.', 'Validation');
      return;
    }

    setLoading(true);
    try {
      const { session } = await signUp({
        fullName: name,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      if (session) {
        showSuccess('Account created! Welcome to CampusBook.', 'Registration Successful');
        navigate('/dashboard', { replace: true });
      } else {
        showInfo(
          'Please check your college email and click the verification link to activate your account.',
          'Verify Your Email'
        );
        navigate('/login');
      }
    } catch (err) {
      showError(err.message || 'Registration failed. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-royal-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-navy-800">CampusBook</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-navy-800">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Join CampusBook and start booking resources
          </p>
        </div>

        <div className="card p-8">
          <SupabaseNotice compact />

          <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
            {/* Full Name */}
            <div>
              <label className="label-text" htmlFor="fullName">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Smith"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label-text" htmlFor="email">College Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@college.edu"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="label-text" htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input-field"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Admin accounts are assigned manually by system administrators.
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="label-text" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label-text" htmlFor="confirmPassword">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirm ? 'Hide' : 'Show'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="btn-primary w-full py-3 text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-royal-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="hover:underline">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
