import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { fetchAllBookings } from '../../services/adminService';
import { cancelBookingRpc } from '../../services/bookingService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { formatDateDisplay, formatTimeDisplay, formatShortId, getTodayDateString } from '../../utils/bookingUtils';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import SupabaseNotice from '../../components/SupabaseNotice';

export default function AdminBookingsPage() {
  const { showSuccess, showError } = useToast();
  const today = getTodayDateString();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      setBookings(await fetchAllBookings());
    } catch (err) {
      showError(err.message || 'Failed to load bookings.', 'Error');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const result = await cancelBookingRpc(cancelTarget.id);
      if (result?.success) { showSuccess(result.message, 'Cancelled'); await load(); }
      else showError(result?.message || 'Could not cancel.', 'Error');
    } catch (err) {
      showError(err.message, 'Error');
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  }

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.profiles?.full_name?.toLowerCase().includes(q) ||
      b.profiles?.email?.toLowerCase().includes(q) ||
      b.resources?.resource_name?.toLowerCase().includes(q) ||
      b.resources?.room_number?.toLowerCase().includes(q) ||
      b.purpose?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">All Bookings</h1>
        <p className="mt-0.5 text-sm text-slate-500">View and manage every campus resource booking.</p>
      </div>

      <SupabaseNotice compact />

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: bookings.length, color: 'text-navy-800' },
          { label: 'Confirmed', value: confirmed, color: 'text-emerald-600' },
          { label: 'Cancelled', value: cancelled, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search user, resource, room, purpose..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <div className="flex gap-2">
          {[{ key: 'all', label: 'All' }, { key: 'confirmed', label: 'Confirmed' }, { key: 'cancelled', label: 'Cancelled' }].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${filterStatus === tab.key ? 'bg-navy-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <LoadingSpinner label="Loading bookings..." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No bookings found" description="Adjust your search or filters to see results." />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    {['ID', 'User', 'Resource', 'Room', 'Date', 'Time Slot', 'Purpose', 'Status', 'Action'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{formatShortId(b.id)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-medium text-navy-800">{b.profiles?.full_name || '—'}</p>
                        <p className="text-xs text-slate-500 capitalize">{b.profiles?.role}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{b.resources?.resource_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600">{b.resources?.room_number}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateDisplay(b.booking_date)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatTimeDisplay(b.start_time)} – {formatTimeDisplay(b.end_time)}
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-slate-600">{b.purpose}</td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {b.status === 'confirmed' && b.booking_date >= today ? (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(b)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                          >
                            Cancel
                          </button>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel Booking"
        message={cancelTarget ? `Cancel booking for ${cancelTarget.profiles?.full_name} — ${cancelTarget.resources?.resource_name} on ${formatDateDisplay(cancelTarget.booking_date)}?` : ''}
        confirmLabel="Cancel Booking"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </DashboardLayout>
  );
}
