import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  CalendarPlus,
  ClipboardList,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Users,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function buildNavItems(role) {
  if (role === 'admin') {
    return [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Resources', href: '/admin/resources', icon: Library },
      { label: 'All Bookings', href: '/admin/bookings', icon: ClipboardList },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Utilization', href: '/admin/utilization', icon: BarChart2 },
      { label: 'Profile', href: '/profile', icon: User },
    ];
  }
  return [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'Browse Resources', href: '/resources', icon: Library },
    { label: 'Book a Resource', href: '/book', icon: CalendarPlus },
    { label: 'My Bookings', href: '/my-bookings', icon: ClipboardList },
    { label: 'Profile', href: '/profile', icon: User },
  ];
}

function SidebarContent({ navItems, profile, role, onSignOut, onClose }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <Link
          to={role === 'admin' ? '/admin' : '/dashboard'}
          onClick={onClose}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-extrabold tracking-tight text-navy-800">
            CampusBook
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Role badge */}
      <div className="px-5 pb-2 pt-4">
        <div className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-navy-600" />
          <span className="text-xs font-semibold capitalize text-navy-700">
            {role || 'Loading...'} Portal
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-royal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-navy-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Sign out */}
      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-800 text-xs font-bold text-white">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-800">
              {profile?.full_name || 'User'}
            </p>
            <p className="truncate text-xs text-slate-500">{profile?.email || ''}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const { profile, role, signOut } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = buildNavItems(role);

  async function handleSignOut() {
    try {
      await signOut();
      showSuccess('You have been signed out.', 'Goodbye!');
      navigate('/');
    } catch (err) {
      showError(err.message || 'Sign out failed.', 'Error');
    }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-64 shrink-0 overflow-hidden border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <SidebarContent
          navItems={navItems}
          profile={profile}
          role={role}
          onSignOut={handleSignOut}
          onClose={null}
        />
      </aside>

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" aria-hidden="true">
          <div
            className="absolute inset-0 bg-navy-900/50 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 overflow-hidden border-r border-slate-200 bg-white shadow-xl">
            <SidebarContent
              navItems={navItems}
              profile={profile}
              role={role}
              onSignOut={handleSignOut}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="mr-3 rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-800">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-navy-800">CampusBook</span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
