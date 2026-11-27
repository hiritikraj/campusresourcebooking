import { useState } from 'react';
import { User, Mail, Shield, Key, Save } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

export default function ProfilePage() {
  const { profile, updateProfileName, updatePassword } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(profile?.full_name || '');
  const [nameSaving, setNameSaving] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  async function handleNameSave(e) {
    e.preventDefault();
    if (name.trim().length < 2) {
      showError('Name must be at least 2 characters.', 'Validation');
      return;
    }
    setNameSaving(true);
    try {
      await updateProfileName(name.trim());
      showSuccess('Your display name has been updated.', 'Profile Saved');
    } catch (err) {
      showError(err.message || 'Failed to update name.', 'Error');
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (passwords.newPassword.length < 8) {
      showError('Password must be at least 8 characters.', 'Validation');
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      showError('New passwords do not match.', 'Validation');
      return;
    }
    setPwSaving(true);
    try {
      await updatePassword(passwords.newPassword);
      showSuccess('Password changed successfully.', 'Password Updated');
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } catch (err) {
      showError(err.message || 'Failed to change password.', 'Error');
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">My Profile</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Manage your account information and security settings.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-navy-800 text-2xl font-bold text-white">
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-navy-800">{profile?.full_name || '—'}</h2>
            <p className="mt-1 text-sm text-slate-500">{profile?.email || '—'}</p>
            <div className="mt-3 flex justify-center">
              <StatusBadge status={profile?.role || 'student'} label={profile?.role?.charAt(0).toUpperCase() + (profile?.role?.slice(1) || '')} />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Member since{' '}
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>

          <div className="card mt-4 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Account Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-700">{profile?.full_name || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-slate-700">{profile?.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="capitalize text-slate-700">{profile?.role || '—'} Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit forms */}
        <div className="space-y-6 lg:col-span-2">
          {/* Update Name */}
          <div className="card p-6">
            <h2 className="mb-4 text-base font-bold text-navy-800">Update Display Name</h2>
            <form onSubmit={handleNameSave} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="fullName">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fullName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={nameSaving} className="btn-primary">
                <Save className="h-4 w-4" />
                {nameSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card p-6">
            <h2 className="mb-4 text-base font-bold text-navy-800">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="label-text" htmlFor="newPassword">New Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="newPassword"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 8 characters"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label-text" htmlFor="confirmPw">Confirm New Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="confirmPw"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={pwSaving} className="btn-primary">
                <Key className="h-4 w-4" />
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
