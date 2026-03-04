import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, MessageSquare, Users, LogOut, Film } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: Users, label: 'Admin Panel' }] : []),
  ];

  return (
    <div className="w-64 bg-cinematic-surface border-r border-cinematic-border h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <Film className="w-6 h-6 text-white" />
        <span className="font-semibold text-lg tracking-tight">Workshop</span>
      </div>

      <div className="px-4 py-2">
        <div className="text-xs font-medium text-cinematic-muted uppercase tracking-wider mb-4 px-2">
          Menu
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-cinematic-muted hover:bg-white/5 hover:text-white"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-cinematic-border">
        <div className="flex items-center justify-between px-2 mb-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{user?.name}</span>
            <span className="text-xs text-cinematic-muted capitalize">{user?.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-cinematic-muted hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
