import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CalendarPlus, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useResources } from '../hooks/useResources';
import { createBookingRpc, fetchBookedSlotsForDate } from '../services/bookingService';
import {
  getTodayDateString,
  validateBookingInput,
  formatTimeDisplay,
  hasTimeOverlap,
  RESOURCE_TYPES,
  OPERATING_START_HOUR,
  OPERATING_END_HOUR,
} from '../utils/bookingUtils';
import SupabaseNotice from '../components/SupabaseNotice';
import LoadingSpinner from '../components/LoadingSpinner';

function generateTimeOptions() {
  const options = [];
  for (let h = OPERATING_START_HOUR; h <= OPERATING_END_HOUR; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    options.push(label);
    if (h < OPERATING_END_HOUR) {
      options.push(`${String(h).padStart(2, '0')}:30`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export default function BookResourcePage() {
  const { user, isSupabaseConfigured } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resources, loading: resourcesLoading } = useResources({ includeInactive: false });

  const [form, setForm] = useState({
    resourceId: searchParams.get('resource') || '',
    bookingDate: getTodayDateString(),
    startTime: '09:00',
    endTime: '10:00',
    purpose: '',
  });

  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success, message }

  // Load booked slots whenever resource or date changes
  useEffect(() => {
    if (!form.resourceId || !form.bookingDate || !isSupabaseConfigured) {
      setBookedSlots([]);
      return;
    }
    setSlotsLoading(true);
    fetchBookedSlotsForDate(form.resourceId, form.bookingDate)
      .then(setBookedSlots)
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.resourceId, form.bookingDate, isSupabaseConfigured]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setResult(null);
  }

  const selectedResource = resources.find((r) => r.id === form.resourceId);

  // Check local slot conflict for UI feedback (actual enforcement done by RPC)
  const localConflict = bookedSlots.some((s) =>
    hasTimeOverlap(form.startTime, form.endTime, s.start_time, s.end_time)
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setResult(null);

    const validation = validateBookingInput(form);
    if (!validation.valid) {
      showError(validation.error, 'Validation Error');
      return;
    }

    setSubmitting(true);
    try {
      const data = await createBookingRpc({
        resourceId: form.resourceId,
        bookingDate: form.bookingDate,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
      });

      if (data?.success) {
        setResult({ success: true, message: data.message });
        showSuccess(data.message, 'Booking Confirmed!');
        // Refresh slots
        const slots = await fetchBookedSlotsForDate(form.resourceId, form.bookingDate);
        setBookedSlots(slots);
        // Reset form purpose
        setForm((prev) => ({ ...prev, purpose: '' }));
        setTimeout(() => navigate('/my-bookings'), 1500);
      } else {
        setResult({ success: false, message: data?.message || 'Booking failed.' });
        showError(data?.message || 'Booking conflict or error.', 'Booking Failed');
      }
    } catch (err) {
      const msg = err.message || 'Unexpected error. Please try again.';
      setResult({ success: false, message: msg });
      showError(msg, 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Book a Campus Resource</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Select a facility, choose your time slot, and confirm your booking.
        </p>
      </div>

      <SupabaseNotice compact />

      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        {/* ── Booking Form ── */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            <h2 className="mb-5 text-base font-bold text-navy-800">Booking Details</h2>

            {resourcesLoading ? (
              <LoadingSpinner label="Loading resources..." />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Resource */}
                <div>
                  <label className="label-text" htmlFor="resourceId">Select Resource *</label>
                  <select
                    id="resourceId"
                    name="resourceId"
                    value={form.resourceId}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">— Choose a campus resource —</option>
                    {RESOURCE_TYPES.map((type) => {
                      const group = resources.filter((r) => r.resource_type === type);
                      if (!group.length) return null;
                      return (
                        <optgroup key={type} label={type}>
                          {group.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.resource_name} ({r.room_number}) — {r.capacity} seats
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="label-text" htmlFor="bookingDate">Booking Date *</label>
                  <input
                    id="bookingDate"
                    name="bookingDate"
                    type="date"
                    min={getTodayDateString()}
                    value={form.bookingDate}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text" htmlFor="startTime">Start Time *</label>
                    <select
                      id="startTime"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      {TIME_OPTIONS.filter((t) => t !== '18:00').map((t) => (
                        <option key={t} value={t}>{formatTimeDisplay(t)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-text" htmlFor="endTime">End Time *</label>
                    <select
                      id="endTime"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      {TIME_OPTIONS.filter((t) => t !== '08:00').map((t) => (
                        <option key={t} value={t}>{formatTimeDisplay(t)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="label-text" htmlFor="purpose">Booking Purpose *</label>
                  <textarea
                    id="purpose"
                    name="purpose"
                    rows={3}
                    value={form.purpose}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Java Programming Lab session, Seminar presentation, Group study..."
                    className="input-field resize-none"
                  />
                </div>

                {/* Local conflict warning */}
                {localConflict && !result && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      This time slot overlaps with an existing booking for{' '}
                      <strong>{selectedResource?.resource_name}</strong>. Please choose a different time.
                    </span>
                  </div>
                )}

                {/* Result message */}
                {result && (
                  <div
                    className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-sm ${
                      result.success
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span>{result.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || localConflict || !isSupabaseConfigured || !user}
                  className="btn-primary w-full py-3"
                >
                  <CalendarPlus className="h-4 w-4" />
                  {submitting ? 'Confirming Booking...' : 'Book Now'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Availability Panel ── */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-bold text-navy-800">
              Availability — {selectedResource?.resource_name || 'Select a resource'}
            </h2>

            {!form.resourceId ? (
              <p className="text-xs text-slate-500">
                Select a resource to see available time slots.
              </p>
            ) : slotsLoading ? (
              <LoadingSpinner label="Checking availability..." />
            ) : (
              <>
                {/* Operating hours timeline */}
                <div className="mb-4 space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500">
                    Operating Hours: 8:00 AM – 6:00 PM
                  </p>
                  {bookedSlots.length === 0 ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                      ✅ All slots available on this date
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">
                        {bookedSlots.length} confirmed booking{bookedSlots.length !== 1 ? 's' : ''}:
                      </p>
                      {bookedSlots.map((slot, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-semibold">
                            {formatTimeDisplay(slot.start_time)} – {formatTimeDisplay(slot.end_time)}
                          </span>
                          <span className="text-red-500">Booked</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resource info */}
                {selectedResource && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1.5">
                    <p className="font-semibold text-navy-800">{selectedResource.resource_name}</p>
                    <p className="text-slate-600">Room: <span className="font-medium">{selectedResource.room_number}</span></p>
                    <p className="text-slate-600">Type: <span className="font-medium">{selectedResource.resource_type}</span></p>
                    <p className="text-slate-600">Capacity: <span className="font-medium">{selectedResource.capacity} seats</span></p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Rules card */}
          <div className="card mt-4 p-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Booking Rules
            </h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {[
                'Minimum booking duration: 30 minutes',
                'Past dates cannot be booked',
                'Adjacent bookings are allowed',
                'Cancelled bookings release their slot immediately',
                'Campus hours: 8:00 AM to 6:00 PM',
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
