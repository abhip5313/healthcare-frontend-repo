import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = {
  PATIENT: [
    { to: '/dashboard',     label: 'Dashboard',       icon: HomeIcon },
    { to: '/profile',       label: 'My Profile',      icon: UserIcon },
    { to: '/search',        label: 'Find Doctors',    icon: SearchIcon },
    { to: '/appointments',  label: 'Appointments',    icon: CalendarIcon },
    { to: '/records',       label: 'Medical Records', icon: FileIcon },
    { to: '/prescriptions', label: 'Prescriptions',   icon: PillIcon },
    { to: '/chat',          label: 'Messages',        icon: ChatIcon },
  ],
  DOCTOR: [
    { to: '/dashboard',          label: 'Dashboard',      icon: HomeIcon },
    { to: '/profile',            label: 'My Profile',     icon: UserIcon },
    { to: '/doctors/my-profile', label: 'Doctor Profile', icon: UserIcon },
    { to: '/doctors/my-leaves',  label: 'Leave',          icon: CalendarIcon },
    { to: '/appointments',       label: 'Appointments',   icon: CalendarIcon },
    { to: '/patients',           label: 'My Patients',    icon: UsersIcon },
    { to: '/prescriptions',      label: 'Prescriptions',  icon: PillIcon },
    { to: '/chat',               label: 'Messages',       icon: ChatIcon },
  ],
  HOSPITAL_ADMIN: [
    { to: '/dashboard',        label: 'Dashboard',      icon: HomeIcon },
    { to: '/profile',          label: 'Profile',        icon: UserIcon },
    { to: '/hospital',         label: 'Hospital',       icon: BuildingIcon },
    { to: '/doctors',          label: 'Doctors',        icon: UsersIcon },
    { to: '/doctors/manage',   label: 'Manage Doctors', icon: UserIcon },
    { to: '/admin/leaves',     label: 'Leave Requests', icon: CalendarIcon },
    { to: '/appointments',     label: 'Appointments',   icon: CalendarIcon },
  ],
  SUPER_ADMIN: [
    { to: '/dashboard',        label: 'Dashboard', icon: HomeIcon },
    { to: '/profile',          label: 'Profile',   icon: UserIcon },
    { to: '/admin/hospitals',  label: 'Hospitals', icon: BuildingIcon },
    { to: '/admin/users',      label: 'Users',     icon: UsersIcon },
    { to: '/admin/hospitals?tab=pending',  label: 'Approvals', icon: CheckIcon, tabKey: 'pending' },
    { to: '/admin/blacklist',  label: 'Blacklist',  icon: BanIcon },
  ],
};

const ROLE_LABELS = {
  PATIENT:        'Patient',
  DOCTOR:         'Doctor',
  HOSPITAL_ADMIN: 'Hospital Admin',
  SUPER_ADMIN:    'Super Admin',
};

const ROLE_BADGE = {
  PATIENT:        'bg-blue-500/20 text-blue-300',
  DOCTOR:         'bg-green-500/20 text-green-300',
  HOSPITAL_ADMIN: 'bg-purple-500/20 text-purple-300',
  SUPER_ADMIN:    'bg-red-500/20 text-red-300',
};

function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  const navItems = NAV_ITEMS[user?.role] || NAV_ITEMS.PATIENT;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    // ✅ FIX 1: h-screen + overflow-hidden on root — forces layout to exactly viewport height
    <div className="h-screen flex overflow-hidden bg-gray-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/*
        ✅ FIX 2:
        - Mobile: fixed + h-screen (full viewport height)
        - Desktop: relative/static, h-full fills the flex parent (which is h-screen)
        - flex-shrink-0 prevents sidebar from being squeezed
      */}
      <aside className={`
        flex-shrink-0
        h-screen
        bg-slate-900 text-white z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        w-56
        fixed top-0 left-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-bold text-sm tracking-wide">
            Health<span className="text-blue-400">Care</span>
          </span>
        </div>

        

        {/* User info */}
        <div className="px-3 py-3 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center
                            text-white font-bold text-xs flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.full_name}
              </p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium mt-0.5 inline-block
                ${ROLE_BADGE[user?.role] || ROLE_BADGE.PATIENT}`}>
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Nav links — flex-1 + overflow-y-auto so it scrolls if too many items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto min-h-0">
          {navItems.map((item) => (
            <NavLinkItem
              key={item.to}
              item={item}
              onClose={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Logout — always at bottom */}
        <div className="px-2 py-3 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium
                       text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
          >
            <LogoutIcon className="w-4 h-4 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      {/*
        ✅ FIX 3:
        - flex-1 + min-w-0 — takes remaining width
        - h-screen + overflow-hidden — full height container
        - flex flex-col — topbar stays fixed, main scrolls
        - lg:ml-0 — no margin needed since sidebar is in flow on desktop
      */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-0 ml-0">

        {/* Top bar */}
        <header className="h-12 bg-white border-b border-gray-200 flex items-center
                           justify-between px-4 z-10 shadow-sm flex-shrink-0">
          {/* Mobile toggle */}
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          <div className="hidden lg:block" />

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
              })}
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center
                            text-blue-700 font-bold text-xs">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content — flex-1 + overflow-y-auto allows this section to scroll */}
        <main className="flex-1 p-5 overflow-y-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function FileIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function PillIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  );
}
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function BuildingIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BanIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
function MenuIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0
           01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418
           4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
  );
}

function NavLinkItem({ item, onClose }) {
  const location = useLocation();

  // Query-string aware isActive:
  // items with tabKey are only active when pathname AND ?tab match
  const isActive = (() => {
    if (item.tabKey) {
      const tab = new URLSearchParams(location.search).get('tab');
      return location.pathname === '/admin/hospitals' && tab === item.tabKey;
    }
    // Hospitals link should NOT be active when ?tab=pending is present
    if (item.to === '/admin/hospitals') {
      const tab = new URLSearchParams(location.search).get('tab');
      if (tab) return false; // tab असल्यास Approvals active आहे, Hospitals नाही
      return location.pathname === '/admin/hospitals';
    }
    // default: prefix match (NavLink default behaviour)
    return location.pathname === item.to ||
      (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'));
  })();

  return (
    <NavLink
      to={item.to}
      end
      onClick={onClose}
      className={() =>
        `flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium
         transition-all duration-150 ${
           isActive
             ? 'bg-blue-600 text-white'
             : 'text-slate-400 hover:bg-slate-800 hover:text-white'
         }`
      }
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </NavLink>
  );
}

export default DashboardLayout;