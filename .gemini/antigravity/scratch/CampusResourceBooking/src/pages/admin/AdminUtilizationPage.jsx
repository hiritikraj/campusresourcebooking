import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { fetchResourceUtilization } from '../../services/adminService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { getTodayDateString, calculateUtilizationPercentage } from '../../utils/bookingUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import SupabaseNotice from '../../components/SupabaseNotice';

function UtilizationBar({ percentage }) {
  const p = Math.min(100, Math.max(0, Number(percentage) || 0));
  const color =
    p >= 75 ? 'bg-red-500' : p >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold text-slate-700">
        {p.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AdminUtilizationPage() {
  const today = getTodayDateString();
  const thirtyDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  })();

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUtilization() {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    try {
      setData(await fetchResourceUtilization(startDate, endDate));
    } catch (err) {
      console.error('Utilization error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUtilization(); }, []);

  const totalBooked = data.reduce((acc, r) => acc + Number(r.total_booked_hours || 0), 0);
  const totalAvailable = data.reduce((acc, r) => acc + Number(r.total_available_hours || 0), 0);
  const overallPct = calculateUtilizationPercentage(totalBooked, totalAvailable);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Resource Utilization</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Utilization = (Total Booked Hours ÷ Total Available Hours) × 100 &nbsp;•&nbsp; Campus hours: 8 AM – 6 PM (10 hrs/day)
        </p>
      </div>

      <SupabaseNotice compact />

      {/* Date range filter */}
      <div className="mt-5 card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div>
            <label className="label-text" htmlFor="startDate">From</label>
            <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label-text" htmlFor="endDate">To</label>
            <input id="endDate" type="date" value={endDate} max={today} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
          </div>
          <button type="button" onClick={loadUtilization} disabled={loading} className="btn-navy shrink-0">
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Calculating utilization..." />
      ) : (
        <>
          {/* Summary cards */}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="card p-5 text-center">
              <p className="text-2xl font-bold text-navy-800">{overallPct.toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Overall Utilization</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-2xl font-bold text-emerald-600">{totalBooked.toFixed(1)} hrs</p>
              <p className="text-xs text-slate-500">Total Booked Hours</p>
            </div>
            <div className="card p-5 text-center">
              <p className="text-2xl font-bold text-slate-700">{totalAvailable.toFixed(1)} hrs</p>
              <p className="text-xs text-slate-500">Total Available Hours</p>
            </div>
          </div>

          {/* Per-resource table */}
          <div className="mt-6 card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
              <h2 className="text-sm font-bold text-navy-800">Resource-wise Utilization Report</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    {['Resource', 'Type', 'Room', 'Capacity', 'Bookings', 'Booked Hrs', 'Available Hrs', 'Utilization'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((r) => (
                    <tr key={r.resource_id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">{r.resource_name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.resource_type}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-700">{r.room_number}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.capacity}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{r.confirmed_bookings}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{Number(r.total_booked_hours).toFixed(1)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{Number(r.total_available_hours).toFixed(1)}</td>
                      <td className="min-w-[180px] px-4 py-3">
                        <UtilizationBar percentage={r.utilization_percentage} />
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                        No data available for the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-royal-100 bg-royal-50 p-4 text-xs text-royal-800">
            <strong>Legend:</strong> Green (&lt;40%) = Low utilization &nbsp;|&nbsp; Amber (40–75%) = Moderate &nbsp;|&nbsp; Red (&gt;75%) = High demand
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
