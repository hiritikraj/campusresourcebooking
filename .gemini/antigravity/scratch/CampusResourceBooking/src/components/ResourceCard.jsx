import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarPlus,
  DoorOpen,
  Monitor,
  Presentation,
  Users,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const TYPE_ICONS = {
  'Computer Lab': Monitor,
  Classroom: Presentation,
  Auditorium: Building2,
  'Meeting Room': Users,
};

export default function ResourceCard({ resource, bookPath = '/book' }) {
  const Icon = TYPE_ICONS[resource.resource_type] || DoorOpen;
  const isAvailable = Boolean(resource.is_active);

  return (
    <div className="card flex flex-col justify-between p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-royal-200 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal-50 text-royal-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-royal-600">
                {resource.resource_type}
              </span>
              <h3 className="text-base font-bold text-navy-800">
                {resource.resource_name}
              </h3>
            </div>
          </div>
          <StatusBadge
            status={isAvailable ? 'available' : 'inactive'}
            label={isAvailable ? 'Available' : 'Inactive'}
          />
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
          {resource.description || 'Campus facility ready for scheduled academic use.'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
          <div>
            <span className="text-slate-500">Room Number</span>
            <p className="mt-0.5 font-semibold text-navy-800">{resource.room_number}</p>
          </div>
          <div>
            <span className="text-slate-500">Capacity</span>
            <p className="mt-0.5 font-semibold text-navy-800">{resource.capacity} Seats</p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-1">
        {isAvailable ? (
          <Link
            to={`${bookPath}?resource=${resource.id}`}
            className="btn-primary w-full"
          >
            <CalendarPlus className="h-4 w-4" />
            Book Now
          </Link>
        ) : (
          <button type="button" disabled className="btn-secondary w-full">
            Currently Unavailable
          </button>
        )}
      </div>
    </div>
  );
}
