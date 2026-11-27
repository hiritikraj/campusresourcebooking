import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Library, ClipboardList, BarChart2, TrendingUp, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { fetchAllProfiles, fetchAllBookings } from '../../services/adminService';
import { fetchResources } from '../../services/resourceService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { getTodayDateString, formatDateDisplay, formatTimeDisplay } from '../../utils/bookingUtils';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import SupabaseNotice from '../../components/SupabaseNotice';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className="card flex items-center gap-4 p-5 transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-navy-800">{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboardPage() {
  const today = getTodayDateString();
  const [profiles, setProfiles] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    async function load() {
      try {
        const [p, r, b] = await Promise.all([
          fetchAllProfiles(),
          fetchResources({ includeInactive: true }),
          fetchAllBookings(),
        ]);
        setProfiles(p);
        setResources(r);
        setBookings(b);
      } catch (err) {
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const todayBookings = bookings.filter((b) => b.booking_date === today && b.status === 'confirmed');
  const recentBookings = bookings.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">System overview and management centre</p>
        </div>
        <Link to="/admin/resources" className="btn-navy">
          Manage Resources
        </Link>
      </div>

      <SupabaseNotice compact />

      {loading ? (
        <LoadingSpinner label="Loading admin overview..." />
      ) : (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Total Users" value={profiles.length} color="bg-indigo-50 text-indigo-600" to="/admin/users" />
            <StatCard icon={Library} label="Total Resources" value={resources.length} color="bg-royal-50 text-royal-600" to="/admin/resources" />
            <StatCard icon={ClipboardList} label="Total Bookings" value={bookings.length} color="bg-emerald-50 text-emerald-600" to="/admin/bookings" />
            <StatCard icon={CheckCircle2} label="Confirmed" value={confirmedBookings} color="bg-amber-50 text-amber-600" to="/admin/bookings" />
          </div>

          {/* Today's bookings */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-800">Today's Bookings ({todayBookings.length})</h2>
              <Link to="/admin/bookings" className="text-xs font-semibold text-royal-600 hover:underline">View all →</Link>
            </div>

            {todayBookings.length === 0 ? (
              <div className="card p-6 text-center text-sm text-slate-500">
                No bookings confirmed for today.
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        {['User', 'Resource', 'Room', 'Time Slot', 'Purpose', 'Status'].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {todayBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            <div>
                              <p className="font-medium text-navy-800">{b.profiles?.full_name || '—'}</p>
                              <p className="text-xs text-slate-500 capitalize">{b.profiles?.role}</p>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-700">{b.resources?.resource_name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{b.resources?.room_number}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {formatTimeDisplay(b.start_time)} – {formatTimeDisplay(b.end_time)}
                          </td>
                          <td className="max-w-[140px] truncate px-4 py-3 text-slate-600">{b.purpose}</td>
                          <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Library, label: 'Manage Resources', desc: 'Add, edit, or deactivate campus facilities', href: '/admin/resources' },
              { icon: ClipboardList, label: 'All Bookings', desc: 'View and manage every booking', href: '/admin/bookings' },
              { icon: Users, label: 'Users Directory', desc: 'View all registered accounts', href: '/admin/users' },
              { icon: BarChart2, label: 'Utilization Report', desc: 'Resource usage analytics', href: '/admin/utilization' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition group-hover:bg-navy-800 group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
