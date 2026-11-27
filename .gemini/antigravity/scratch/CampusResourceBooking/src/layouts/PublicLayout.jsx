import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Resources', href: '/#facilities' },
];

export default function PublicLayout({ children }) {
  const { user, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const dashboardHref = profile?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-800">
              <BookOpen className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <span className="text-base font-extrabold tracking-tight text-navy-800">
                CampusBook
              </span>
              <span className="ml-0.5 text-xs text-royal-600 font-medium hidden sm:inline">
                {' '}— Resource Booking System
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-navy-800"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <Link to={dashboardHref} className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-navy-800"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                {user ? (
                  <Link to={dashboardHref} className="btn-primary w-full">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary w-full">
                      Login
                    </Link>
                    <Link to="/register" className="btn-primary w-full">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-navy-800 py-10 text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-royal-600">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">CampusBook</p>
                <p className="text-xs text-slate-400">Campus Resource Booking System</p>
              </div>
            </div>
            <div className="text-center text-xs leading-relaxed text-slate-400">
              <p>PBL Project — Object Oriented Techniques using Java</p>
              <p className="mt-0.5">
                Aligned with{' '}
                <span className="font-semibold text-slate-300">SDG 4: Quality Education</span>
              </p>
            </div>
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} CampusBook. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
