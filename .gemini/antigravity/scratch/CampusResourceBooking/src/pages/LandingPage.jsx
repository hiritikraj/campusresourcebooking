import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Monitor,
  Presentation,
  Building2,
  Users,
  ShieldCheck,
  Zap,
  Globe,
  ClipboardList,
  Search,
  CalendarPlus,
} from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { useResources } from '../hooks/useResources';
import ResourceCard from '../components/ResourceCard';
import SupabaseNotice from '../components/SupabaseNotice';

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Search,
    title: 'Browse Available Resources',
    desc: 'View all campus facilities — labs, classrooms, auditoriums, and meeting rooms — with real-time availability.',
  },
  {
    step: '02',
    icon: CalendarPlus,
    title: 'Select Date & Time Slot',
    desc: 'Choose your preferred date and time. The system prevents double-bookings through conflict detection.',
  },
  {
    step: '03',
    icon: ClipboardList,
    title: 'Confirm Your Booking',
    desc: 'Submit your booking with a clear purpose. Receive instant confirmation and manage cancellations anytime.',
  },
];

const WHY_CHOOSE = [
  {
    icon: ShieldCheck,
    title: 'Conflict-Free Booking',
    desc: 'Atomic database-level conflict detection ensures no two users ever book the same slot simultaneously.',
  },
  {
    icon: Zap,
    title: 'Instant Confirmation',
    desc: 'Real-time booking status with immediate success or conflict feedback — no waiting, no manual approval.',
  },
  {
    icon: Globe,
    title: 'Access From Anywhere',
    desc: 'Fully responsive design works on desktop, mobile, and tablet. Book from anywhere on campus.',
  },
  {
    icon: Users,
    title: 'Multi-Role Support',
    desc: 'Separate portals for Students, Faculty, and Administrators with role-appropriate permissions.',
  },
];

const BENEFITS = [
  'Eliminates scheduling conflicts and double bookings',
  'Centralised platform for all campus resource management',
  'Better resource utilisation with analytics reports',
  'Transparent booking history and cancellation workflow',
  'Supports SDG 4: Quality Education through digital campus infrastructure',
  'Admin-controlled resource management and oversight',
];

const RESOURCE_TYPE_ICONS = {
  'Computer Lab': Monitor,
  Classroom: Presentation,
  Auditorium: Building2,
  'Meeting Room': Users,
};

export default function LandingPage() {
  const { resources, loading } = useResources({ includeInactive: false });
  const displayResources = resources.slice(0, 4);

  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-700 to-royal-700 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
      >
        {/* Background blobs */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-royal-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-navy-900/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-royal-400/30 bg-royal-500/10 px-4 py-1.5 text-sm font-semibold text-royal-200">
            <CalendarCheck className="h-4 w-4" />
            SDG 4 — Quality Education
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Smart Campus
            <br />
            <span className="text-royal-300">Resource Booking</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Book classrooms, laboratories and campus facilities easily. Check
            availability and avoid scheduling conflicts through one centralized platform.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="#facilities" className="btn-primary px-6 py-3 text-base">
              <BookOpen className="h-5 w-5" />
              Explore Resources
            </a>
            <Link
              to="/register"
              className="btn-secondary px-6 py-3 text-base"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Dashboard preview card */}
        <div className="relative mx-auto mt-16 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-sm">
            <div className="rounded-xl bg-navy-900/80 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-slate-400">CampusBook Dashboard</span>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Total Resources', value: '5', color: 'bg-royal-600' },
                  { label: 'Active Bookings', value: '12', color: 'bg-emerald-600' },
                  { label: 'Available Now', value: '4', color: 'bg-indigo-600' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-white/5 p-4 text-center"
                  >
                    <div
                      className={`mx-auto mb-2 h-8 w-8 rounded-lg ${stat.color} flex items-center justify-center`}
                    >
                      <span className="text-xs font-bold text-white">{stat.value}</span>
                    </div>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { room: 'LAB101 — Programming Lab', time: '09:00 – 11:00', status: 'Confirmed' },
                  { room: 'CR201 — Smart Classroom', time: '14:00 – 15:00', status: 'Confirmed' },
                ].map((b) => (
                  <div
                    key={b.room}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{b.room}</p>
                      <p className="text-xs text-slate-400">{b.time}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="about" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-royal-600">
              Simple Process
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-navy-800">How It Works</h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
              Book campus resources in three easy steps — no manual forms, no emails,
              no waiting.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="card p-6 text-center">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-royal-50 text-royal-600">
                  <item.icon className="h-7 w-7" />
                </div>
                <div className="mb-2 text-3xl font-black text-slate-100">{item.step}</div>
                <h3 className="text-base font-bold text-navy-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FACILITIES ── */}
      <section id="facilities" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-royal-600">
              Campus Facilities
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-navy-800">
              Available Resources
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-slate-600">
              Explore all bookable campus facilities below. Sign in to reserve your slot.
            </p>
          </div>

          <SupabaseNotice />

          {loading ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="card h-64 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : displayResources.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {displayResources.map((r) => (
                <ResourceCard key={r.id} resource={r} bookPath="/register" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { resource_name: 'Programming Lab', resource_type: 'Computer Lab', room_number: 'LAB101', capacity: 40, description: '40 high-speed workstations with Java/Python IDEs and dual-screen projector.', is_active: true },
                { resource_name: 'Smart Classroom', resource_type: 'Classroom', room_number: 'CR201', capacity: 60, description: 'HD projector, acoustic paneling, and ergonomic seating for 60 students.', is_active: true },
                { resource_name: 'Main Auditorium', resource_type: 'Auditorium', room_number: 'AUD301', capacity: 200, description: '200-seat auditorium with stage lighting and PA sound system.', is_active: true },
                { resource_name: 'Meeting Room', resource_type: 'Meeting Room', room_number: 'MR101', capacity: 15, description: 'Quiet conference room with 15-seat table and 4K display.', is_active: true },
              ].map((r, i) => (
                <ResourceCard key={i} resource={r} bookPath="/register" />
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-sm">
              Book a Resource
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE ── */}
      <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-royal-600">
              Why CampusBook?
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-navy-800">
              Built for Modern Campuses
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title} className="card p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-navy-800">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="bg-navy-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <span className="text-sm font-bold uppercase tracking-widest text-royal-300">
              Project Benefits
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white">
              Transforming Campus Management
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div
                key={b}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span className="text-sm leading-relaxed text-slate-300">{b}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/register" className="btn-primary px-8 py-3 text-base">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
