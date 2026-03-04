import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const main = document.querySelector('main');
      if (main) {
        setIsScrolled(main.scrollTop > 50);
      }
    };
    const mainNode = document.querySelector('main');
    mainNode?.addEventListener('scroll', handleScroll);
    return () => mainNode?.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/chat', label: 'Chat' },
    { to: '/code', label: 'Code' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <>
      <nav
        ref={menuRef}
        className={cn(
          "absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 transition-all duration-300",
          isScrolled || mobileOpen
            ? "bg-cinematic-bg/95 backdrop-blur-md shadow-lg shadow-black/50 border-b border-cinematic-border/20"
            : "bg-linear-to-b from-black/60 to-transparent"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-8 border-none shrink-0 group">
          <div className="font-bebas text-2xl sm:text-4xl tracking-[0.15em] text-st-red text-glow select-none group-hover:scale-[1.02] transition-transform duration-500 cursor-default">
            STRANGER CONNECT
          </div>
        </div>

        {/* Desktop nav — centered */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 border-none">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "text-base tracking-[0.15em] uppercase font-semibold transition-all duration-300 pb-1 relative group font-sans",
                  isActive
                    ? "text-white text-glow"
                    : "text-[#a3a3a3] hover:text-white hover:text-glow focus:outline-none"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 w-full h-[2px] bg-st-red transition-transform duration-300 origin-left",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* User avatar + logout (always visible) */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="w-8 h-8 rounded shrink-0 bg-[#333] border border-[#2a2a2a] overflow-hidden flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <button
              onClick={logout}
              className="text-white hover:text-st-red transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden text-white hover:text-st-red transition-colors p-1"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={cn(
            "absolute top-full left-0 right-0 md:hidden bg-cinematic-bg/98 backdrop-blur-xl border-b border-st-red/30 shadow-2xl shadow-black/60 transition-all duration-300 origin-top overflow-hidden",
            mobileOpen
              ? "max-h-[400px] opacity-100 scale-y-100"
              : "max-h-0 opacity-0 scale-y-95 pointer-events-none"
          )}
        >
          <div className="flex flex-col px-6 py-4 gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "block py-3 px-4 rounded-lg text-sm tracking-[0.2em] uppercase font-semibold transition-all duration-200 font-sans",
                    isActive
                      ? "text-white bg-st-red/15 text-glow border-l-2 border-st-red"
                      : "text-[#a3a3a3] hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Divider */}
            <div className="my-2 border-t border-white/10" />

            {/* User info + logout on mobile */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded shrink-0 bg-[#333] border border-[#2a2a2a] overflow-hidden flex items-center justify-center text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-[#a3a3a3] tracking-wider">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={logout}
                className="text-[#a3a3a3] hover:text-st-red transition-colors flex items-center gap-2 text-sm tracking-wider uppercase"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Backdrop overlay when mobile menu is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
