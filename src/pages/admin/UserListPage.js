import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import authService from '../../services/authService';

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  PATIENT:        { label: 'Patient',        color: 'bg-blue-100 text-blue-700' },
  DOCTOR:         { label: 'Doctor',         color: 'bg-green-100 text-green-700' },
  HOSPITAL_ADMIN: { label: 'Hospital Admin', color: 'bg-purple-100 text-purple-700' },
  SUPER_ADMIN:    { label: 'Super Admin',    color: 'bg-red-100 text-red-700' },
};

// ─── Confirm Toggle Modal ─────────────────────────────────────────────────────
function ConfirmModal({ user, onConfirm, onCancel, loading }) {
  const isDeactivating = user?.is_active;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`px-6 py-5 ${isDeactivating
          ? 'bg-gradient-to-r from-red-600 to-rose-700'
          : 'bg-gradient-to-r from-green-600 to-emerald-700'}`}>
          <h3 className="font-bold text-white text-sm">
            {isDeactivating ? 'Deactivate User' : 'Activate User'}
          </h3>
          <p className="text-xs mt-0.5 text-white/70">
            {isDeactivating
              ? 'User login block होईल'
              : 'User login restore होईल'}
          </p>
        </div>
        <div className="px-6 py-5">
          <div className={`rounded-xl px-4 py-3 mb-4 ${isDeactivating
            ? 'bg-red-50 border border-red-200'
            : 'bg-green-50 border border-green-200'}`}>
            <p className="text-xs font-semibold text-gray-800">{user?.full_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">{ROLE_CONFIG[user?.role]?.label}</p>
          </div>
          <p className="text-xs text-gray-600">
            {isDeactivating
              ? 'हा user आता login करू शकणार नाही. Blacklisted hospital मुळे deactivate झालेले users वेगळे असतात.'
              : 'हा user पुन्हा platform वर login करू शकेल.'}
          </p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2
              ${isDeactivating
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading
              ? <><SpinnerIcon /><span>Processing...</span></>
              : isDeactivating ? 'Confirm Deactivate' : 'Confirm Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Row Card ────────────────────────────────────────────────────────────
function UserRow({ user, onToggle, actionLoading }) {
  const role = ROLE_CONFIG[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700' };
  const initials = user.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  return (
    <div className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden
      ${!user.is_active
        ? 'border-red-100 shadow-sm shadow-red-50'
        : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'}`}>
      {/* Deactivated banner */}
      {!user.is_active && (
        <div className="bg-red-500 px-4 py-1 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-white text-xs font-semibold tracking-wide">DEACTIVATED</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center
              font-bold text-xs flex-shrink-0
              ${!user.is_active
                ? 'bg-red-100 text-red-500'
                : 'bg-blue-100 text-blue-600'}`}>
              {initials}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-gray-900 truncate">{user.full_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${role.color}`}>
                  {role.label}
                </span>
                {user.is_verified && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user.phone_number || '—'} &nbsp;·&nbsp; Joined {joinDate}
              </p>
            </div>
          </div>

          {/* Right: Toggle button */}
          <div className="flex-shrink-0">
            {isSuperAdmin ? (
              <span className="text-xs text-gray-400 italic">Protected</span>
            ) : user.is_active ? (
              <button
                onClick={() => onToggle(user)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                           bg-red-500 rounded-lg hover:bg-red-600 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
                </svg>
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => onToggle(user)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                           bg-green-600 rounded-lg hover:bg-green-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function UserListPage() {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [activeTab, setActiveTab]     = useState('all'); // 'all' | 'active' | 'inactive'
  const [confirmModal, setConfirmModal] = useState({ open: false, user: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const data = await authService.getUsers({ ...params, page_size: 1000 });
      // paginated response: { results: [...], count: N }  OR  non-paginated: { data: [...] }
      setUsers(data.data || data.results || []);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Client-side filter: search + active tab ──────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone_number?.includes(search);

    const matchTab =
      activeTab === 'all'      ? true :
      activeTab === 'active'   ? u.is_active :
      /* inactive */             !u.is_active;

    return matchSearch && matchTab;
  });

  // ── Counts ───────────────────────────────────────────────────────────────
  const totalCount    = users.length;
  const activeCount   = users.filter(u => u.is_active).length;
  const inactiveCount = users.filter(u => !u.is_active).length;

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!confirmModal.user) return;
    setActionLoading(true);
    try {
      const data = await authService.toggleUserActive(confirmModal.user.id);
      toast.success(data.message);
      // Update locally for instant feedback
      setUsers(prev => prev.map(u =>
        u.id === confirmModal.user.id ? { ...u, is_active: !u.is_active } : u
      ));
      setConfirmModal({ open: false, user: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <SpinnerIcon />
        <p className="text-xs text-gray-400">Loading users...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'all',      label: 'All Users', count: totalCount,    color: 'gray'  },
    { id: 'active',   label: 'Active',    count: activeCount,   color: 'green' },
    { id: 'inactive', label: 'Inactive',  count: inactiveCount, color: 'red'   },
  ];

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <UserIcon />
          </div>
          <h1 className="text-lg font-bold text-gray-900">User Management</h1>
        </div>
        <p className="text-xs text-gray-500 ml-11">
          Platform वरील सर्व users बघा, activate किंवा deactivate करा.
        </p>
      </div>

      {/* ── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{inactiveCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Inactive</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{roleCounts['PATIENT'] || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Patients</p>
        </div>
      </div>

      {/* ── Role breakdown pills ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          roleCounts[role] ? (
            <span key={role} className={`text-xs px-3 py-1 rounded-full font-medium ${cfg.color}`}>
              {cfg.label}: {roleCounts[role]}
            </span>
          ) : null
        ))}
      </div>

      {/* ── Search + Filter + Tabs ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        {/* Search + Role Filter */}
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">All Roles</option>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="HOSPITAL_ADMIN">Hospital Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                          transition-colors border
                ${activeTab === tab.id
                  ? tab.color === 'green' ? 'bg-green-600 text-white border-green-600'
                  : tab.color === 'red'   ? 'bg-red-500 text-white border-red-500'
                  :                         'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold
                ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── User List ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-full flex items-center
                          justify-center text-gray-400">
            <UserIcon />
          </div>
          <p className="text-sm font-medium text-gray-600">
            {activeTab === 'inactive' ? 'No inactive users' :
             activeTab === 'active'   ? 'No active users' :
             'No users found'}
          </p>
          {search && (
            <p className="text-xs text-gray-400 mt-1">Search adjust करा.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <UserRow
              key={user.id}
              user={user}
              onToggle={u => setConfirmModal({ open: true, user: u })}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* ── Confirm Modal ──────────────────────────────────────────────────── */}
      {confirmModal.open && (
        <ConfirmModal
          user={confirmModal.user}
          onConfirm={handleToggle}
          onCancel={() => setConfirmModal({ open: false, user: null })}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

export default UserListPage;