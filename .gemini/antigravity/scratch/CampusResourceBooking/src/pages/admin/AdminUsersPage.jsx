import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { fetchAllProfiles } from '../../services/adminService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SupabaseNotice from '../../components/SupabaseNotice';

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    fetchAllProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || p.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    students: profiles.filter((p) => p.role === 'student').length,
    faculty: profiles.filter((p) => p.role === 'faculty').length,
    admins: profiles.filter((p) => p.role === 'admin').length,
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Users Directory</h1>
        <p className="mt-0.5 text-sm text-slate-500">View all registered accounts. Admin role changes must be done via Supabase SQL Editor.</p>
      </div>

      <SupabaseNotice compact />

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Students', value: counts.students },
          { label: 'Faculty', value: counts.faculty },
          { label: 'Admins', value: counts.admins },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className="text-xl font-bold text-navy-800">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field sm:w-40">
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="mt-5">
        {loading ? (
          <LoadingSpinner label="Loading users..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Adjust your search or filters." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    {['Name', 'Email', 'Role', 'Joined'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-800">
                            {p.full_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-navy-800">{p.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.email}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={p.role} label={p.role?.charAt(0).toUpperCase() + p.role?.slice(1)} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500 text-xs">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
