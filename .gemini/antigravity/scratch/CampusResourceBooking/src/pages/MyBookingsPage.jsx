import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ClipboardList } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchMyBookings, cancelBookingRpc } from '../services/bookingService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatShortId,
  getTodayDateString,
} from '../utils/bookingUtils';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import SupabaseNotice from '../components/SupabaseNotice';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const today = getTodayDateString();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMyBookings(user.id);
      setBookings(data);
    } catch (err) {
      showError(err.message || 'Failed to load bookings.', 'Error');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await cancelBookingRpc(cancelTarget.id);
      if (result?.success) {
        showSuccess(result.message, 'Booking Cancelled');
        await loadBookings();
      } else {
        showError(result?.message || 'Could not cancel booking.', 'Error');
      }
    } catch (err) {
      showError(err.message || 'Unexpected error.', 'Error');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  const filtered =
    filterStatus === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filterStatus);

  const upcoming = bookings.filter(
    (b) => b.status === 'confirmed' && b.booking_date >= today
  ).length;

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">My Bookings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            View and manage your campus resource reservations.
          </p>
        </div>
        <Link to="/book" className="btn-primary shrink-0">
          <CalendarPlus className="h-4 w-4" />
          New Booking
        </Link>
      </div>

      <SupabaseNotice compact />

      {/* Summary strip */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming', value: upcoming, color: 'text-royal-600' },
          { label: 'Total Confirmed', value: confirmed, color: 'text-emerald-600' },
          { label: 'Cancelled', value: cancelled, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mt-5 flex gap-2">
        {[
          { key: 'all', label: `All (${bookings.length})` },
          { key: 'confirmed', label: `Confirmed (${confirmed})` },
          { key: 'cancelled', label: `Cancelled (${cancelled})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filterStatus === tab.key
                ? 'bg-royal-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-5">
        {loading ? (
          <LoadingSpinner label="Loading your bookings..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No bookings found"
            description={
              filterStatus !== 'all'
                ? `You have no ${filterStatus} bookings.`
                : 'You haven\'t made any bookings yet. Reserve your first campus resource!'
            }
            action={
              filterStatus === 'all' && (
                <Link to="/book" className="btn-primary">
                  <CalendarPlus className="h-4 w-4" />
                  Book a Resource
                </Link>
              )
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    {[
                      'Booking ID',
                      'Resource',
                      'Room',
                      'Date',
                      'Time Slot',
                      'Purpose',
                      'Status',
                      'Action',
                    ].map((h) => (
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
                  {filtered.map((b) => {
                    const isUpcoming =
                      b.status === 'confirmed' && b.booking_date >= today;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">
                          {formatShortId(b.id)}
                        </td>
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
                        <td className="whitespace-nowrap px-4 py-3">
                          {isUpcoming ? (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(b)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              Cancel
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Booking"
        message={
          cancelTarget
            ? `Are you sure you want to cancel your booking for ${cancelTarget.resources?.resource_name} (${cancelTarget.resources?.room_number}) on ${formatDateDisplay(cancelTarget.booking_date)} from ${formatTimeDisplay(cancelTarget.start_time)} to ${formatTimeDisplay(cancelTarget.end_time)}? This action will release the time slot for others.`
            : ''
        }
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep It"
        variant="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </DashboardLayout>
  );
}
