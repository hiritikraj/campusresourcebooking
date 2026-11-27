import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import ResourceCard from '../components/ResourceCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SupabaseNotice from '../components/SupabaseNotice';
import { useResources } from '../hooks/useResources';
import { Library } from 'lucide-react';
import { RESOURCE_TYPES } from '../utils/bookingUtils';

export default function ResourcesPage() {
  const { resources, loading, error } = useResources({ includeInactive: false });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('Any');

  const CAPACITY_OPTIONS = [
    { label: 'Any Capacity', value: 'Any' },
    { label: 'Up to 20 seats', value: '20' },
    { label: 'Up to 50 seats', value: '50' },
    { label: '50+ seats', value: '50+' },
  ];

  const filtered = resources.filter((r) => {
    const matchSearch =
      search.trim() === '' ||
      r.resource_name.toLowerCase().includes(search.toLowerCase()) ||
      r.room_number.toLowerCase().includes(search.toLowerCase()) ||
      r.resource_type.toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === 'All' || r.resource_type === typeFilter;

    const matchCapacity =
      capacityFilter === 'Any' ||
      (capacityFilter === '20' && r.capacity <= 20) ||
      (capacityFilter === '50' && r.capacity <= 50 && r.capacity > 20) ||
      (capacityFilter === '50+' && r.capacity > 50);

    return matchSearch && matchType && matchCapacity;
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Browse Campus Resources</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Explore all available campus facilities and book your slot.
        </p>
      </div>

      <SupabaseNotice compact />

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, room, or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field min-w-[160px]"
          >
            <option value="All">All Types</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
            className="input-field min-w-[150px]"
          >
            {CAPACITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <LoadingSpinner label="Loading campus resources..." />
        ) : error ? (
          <div className="card p-6 text-center text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Library}
            title="No resources found"
            description={
              search || typeFilter !== 'All' || capacityFilter !== 'Any'
                ? 'Try adjusting your search or filters.'
                : 'No campus resources have been added yet. Contact your administrator.'
            }
            action={
              (search || typeFilter !== 'All' || capacityFilter !== 'Any') && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setTypeFilter('All'); setCapacityFilter('Any'); }}
                  className="btn-secondary"
                >
                  Clear Filters
                </button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-3 text-xs font-medium text-slate-500">
              Showing {filtered.length} of {resources.length} resources
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((r) => (
                <ResourceCard key={r.id} resource={r} bookPath="/book" />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
