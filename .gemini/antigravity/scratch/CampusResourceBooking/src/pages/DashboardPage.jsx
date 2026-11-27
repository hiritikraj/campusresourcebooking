import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  ClipboardList,
  Library,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { fetchMyBookings } from '../services/bookingService';
import { fetchResources } from '../services/resourceService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  formatDateDisplay,
  formatTimeDisplay,
  getTodayDateString,
} from '../utils/bookingUtils';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import SupabaseNotice from '../components/SupabaseNotice';

function StatCard({ icon: Icon, label, value, colorClass, to }) {
  const content = (
    <div className="card flex items-center gap-4 p-5 transition-all hover:shadow-md">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
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

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const today = getTodayDateString();

  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const [b, r] = await Promise.all([
          fetchMyBookings(user.id),
          fetchResources({ includeInactive: false }),
        ]);
        setBookings(b);
        setResources(r);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const activeBookings = bookings.filter((b) => b.status === 'confirmed');
  const upcomingBookings = activeBookings
    .filter((b) => b.booking_date >= today)
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
    .slice(0, 5);
  const activeResources = resources.filter((r) => r.is_active).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">
            {greeting}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 capitalize">
            {profile?.role} Portal &nbsp;·&nbsp; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/book" className="btn-primary shrink-0">
          <CalendarPlus className="h-4 w-4" />
          Book Now
        </Link>
      </div>

      <SupabaseNotice compact />

      {loading ? (
        <LoadingSpinner label="Loading your dashboard..." />
      ) : (
        <>
          {/* Stats */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Library}
              label="Total Resources"
              value={resources.length}
              colorClass="bg-royal-50 text-royal-600"
              to="/resources"
            />
            <StatCard
              icon={CheckCircle2}
              label="Available Now"
              value={activeResources}
              colorClass="bg-emerald-50 text-emerald-600"
              to="/resources"
            />
            <StatCard
              icon={ClipboardList}
              label="Active Bookings"
              value={activeBookings.length}
              colorClass="bg-indigo-50 text-indigo-600"
              to="/my-bookings"
            />
            <StatCard
              icon={Clock}
              label="Upcoming"
              value={upcomingBookings.length}
              colorClass="bg-amber-50 text-amber-600"
              to="/my-bookings"
            />
          </div>

          {/* Upcoming Bookings */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-800">Upcoming Bookings</h2>
              <Link to="/my-bookings" className="text-xs font-semibold text-royal-600 hover:underline">
                View all →
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-royal-50 text-royal-500">
                  <CalendarPlus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">No upcoming bookings</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Reserve a classroom, lab or auditorium for your next session.
                  </p>
                </div>
                <Link to="/book" className="btn-primary mt-1 text-xs">
                  Book a Resource
                </Link>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        {['Resource', 'Room', 'Date', 'Time Slot', 'Purpose', 'Status'].map((h) => (
                          <th
                            key={h}
                            className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {upcomingBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-800">
                            {b.resources?.resource_name || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {b.resources?.room_number || '—'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {formatDateDisplay(b.booking_date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {formatTimeDisplay(b.start_time)} – {formatTimeDisplay(b.end_time)}
                          </td>
                          <td className="max-w-[160px] truncate px-4 py-3 text-slate-600">
                            {b.purpose}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <StatusBadge status={b.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Library, label: 'Browse Resources', desc: 'Explore all available campus facilities', href: '/resources' },
              { icon: CalendarPlus, label: 'Book a Resource', desc: 'Reserve a room for your session', href: '/book' },
              { icon: TrendingUp, label: 'My Bookings', desc: 'View your booking history', href: '/my-bookings' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal-50 text-royal-600 transition group-hover:bg-royal-600 group-hover:text-white">
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
