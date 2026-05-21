import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import hospitalService from '../../services/hospitalService';

// ─── Icons ────────────────────────────────────────────────────────────────────
const BanIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);
const UnlockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const BuildingIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// ─── Confirm Unblacklist Modal ────────────────────────────────────────────────
function UnblacklistModal({ hospital, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <UnlockIcon />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Unblacklist Hospital</h3>
              <p className="text-emerald-100 text-xs mt-0.5">Restore hospital access</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-emerald-800">{hospital?.hospital_name}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {hospital?.city}, {hospital?.state}
            </p>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            <p className="font-medium text-gray-800">Unblacklisting will:</p>
            <ul className="space-y-1.5 pl-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                Hospital admin चा account पुन्हा activate होईल
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                सर्व associated doctors पुन्हा active होतील
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                Hospital admin ला restoration email जाईल
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
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
            className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><SpinnerIcon /><span>Processing...</span></> : <><UnlockIcon /><span>Confirm Unblacklist</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blacklist Modal ──────────────────────────────────────────────────────────
function BlacklistModal({ hospital, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const charLimit = 500;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <BanIcon />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Blacklist Hospital</h3>
              <p className="text-red-200 text-xs mt-0.5">This action will deactivate hospital access</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs font-semibold text-red-800">{hospital?.hospital_name}</p>
            <p className="text-xs text-red-600 mt-0.5">{hospital?.city}, {hospital?.state}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-amber-800">
            ⚠️ Hospital admin + सर्व doctors deactivate होतील. Warning email पाठवला जाईल.
          </div>

          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Blacklist Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => e.target.value.length <= charLimit && setReason(e.target.value)}
            rows={4}
            placeholder="Reason for blacklisting this hospital (e.g., fraudulent activity, license violation)..."
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent
                       resize-none transition-shadow"
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {reason.length}/{charLimit}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) return toast.error('Blacklist reason required!');
              onConfirm(reason);
            }}
            disabled={loading || !reason.trim()}
            className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <><SpinnerIcon /><span>Blacklisting...</span></> : <><BanIcon /><span>Confirm Blacklist</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hospital Row Card ────────────────────────────────────────────────────────
function HospitalRow({ hospital, onBlacklist, onUnblacklist, actionLoading, navigate }) {
  const isBlacklisted = hospital.is_blacklisted;

  const typeColors = {
    GENERAL:         'bg-blue-50 text-blue-700 border-blue-100',
    MULTI_SPECIALTY: 'bg-purple-50 text-purple-700 border-purple-100',
    CLINIC:          'bg-teal-50 text-teal-700 border-teal-100',
    DIAGNOSTIC:      'bg-orange-50 text-orange-700 border-orange-100',
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden
      ${isBlacklisted
        ? 'border-red-200 shadow-sm shadow-red-50'
        : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
      }`}
    >
      {/* Blacklist banner */}
      {isBlacklisted && (
        <div className="bg-red-600 px-4 py-1.5 flex items-center gap-2">
          <BanIcon />
          <span className="text-white text-xs font-semibold tracking-wide">BLACKLISTED</span>
          {hospital.blacklisted_at && (
            <span className="text-red-200 text-xs ml-auto flex items-center gap-1">
              <CalendarIcon /> {formatDate(hospital.blacklisted_at)}
            </span>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Info */}
          <div className="flex items-start gap-3 min-w-0">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
              ${isBlacklisted ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-500'}`}>
              <BuildingIcon />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {hospital.hospital_name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                  ${typeColors[hospital.hospital_type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {hospital.hospital_type?.replace('_', '-')}
                </span>
                {/* Status badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${hospital.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    hospital.status === 'PENDING'  ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'}`}>
                  {hospital.status}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-0.5">
                📍 {hospital.city}, {hospital.state} &nbsp;·&nbsp; 📞 {hospital.phone_number}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Reg: {hospital.registration_number}
              </p>

              {/* Blacklist reason */}
              {isBlacklisted && hospital.blacklist_reason && (
                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Blacklist Reason:</p>
                  <p className="text-xs text-red-600 leading-relaxed">{hospital.blacklist_reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => navigate(`/hospitals/${hospital.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600
                         border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <EyeIcon /> View
            </button>

            {isBlacklisted ? (
              <button
                onClick={() => onUnblacklist(hospital)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                           bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UnlockIcon /> Unblacklist
              </button>
            ) : (
              <button
                onClick={() => onBlacklist(hospital)}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white
                           bg-red-600 rounded-lg hover:bg-red-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <BanIcon /> Blacklist
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function HospitalBlacklistPage() {
  const navigate = useNavigate();

  const [hospitals, setHospitals]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch]               = useState('');
  const [activeTab, setActiveTab]         = useState('blacklisted'); // 'all' | 'blacklisted' | 'active'

  // Modals
  const [blacklistModal,   setBlacklistModal]   = useState({ open: false, hospital: null });
  const [unblacklistModal, setUnblacklistModal] = useState({ open: false, hospital: null });

  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hospitalService.listHospitals({ page_size: 1000 });
      setHospitals(data.data || data.results || []);
    } catch {
      toast.error('Failed to load hospitals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = hospitals.filter(h => {
    const matchSearch = !search ||
      h.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase()) ||
      h.registration_number?.toLowerCase().includes(search.toLowerCase());

    const matchTab =
      activeTab === 'all'          ? true :
      activeTab === 'blacklisted'  ? h.is_blacklisted :
      /* active */                   !h.is_blacklisted;

    return matchSearch && matchTab;
  });

  const blacklistedCount = hospitals.filter(h => h.is_blacklisted).length;
  const activeCount      = hospitals.filter(h => !h.is_blacklisted).length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBlacklist = async (reason) => {
    setActionLoading(true);
    try {
      await hospitalService.blacklistHospital(blacklistModal.hospital.id, reason);
      toast.success(`"${blacklistModal.hospital.hospital_name}" blacklisted. Email sent!`);
      setBlacklistModal({ open: false, hospital: null });
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to blacklist.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblacklist = async () => {
    setActionLoading(true);
    try {
      await hospitalService.unblacklistHospital(unblacklistModal.hospital.id);
      toast.success(`"${unblacklistModal.hospital.hospital_name}" unblacklisted!`);
      setUnblacklistModal({ open: false, hospital: null });
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblacklist.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <SpinnerIcon />
        <p className="text-xs text-gray-400">Loading hospitals...</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
            <BanIcon />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Hospital Blacklist Management</h1>
        </div>
        <p className="text-xs text-gray-500 ml-11">
          Blacklisted hospitals चे admins आणि doctors deactivate होतात. Unblacklist केल्यावर सर्व access restore होतो.
        </p>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{hospitals.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Hospitals</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{blacklistedCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Blacklisted</p>
        </div>
        <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active</p>
        </div>
      </div>

      {/* ── Search + Tabs ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        {/* Search */}
        <div className="relative mb-3">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by hospital name, city, registration no..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'blacklisted', label: 'Blacklisted',  count: blacklistedCount, color: 'red'   },
            { id: 'active',      label: 'Active',       count: activeCount,      color: 'green' },
            { id: 'all',         label: 'All Hospitals', count: hospitals.length, color: 'gray'  },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                          transition-colors border
                ${activeTab === tab.id
                  ? tab.color === 'red'   ? 'bg-red-600 text-white border-red-600'
                  : tab.color === 'green' ? 'bg-green-600 text-white border-green-600'
                  :                         'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
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

      {/* ── Hospital List ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
            <BuildingIcon />
          </div>
          <p className="text-sm font-medium text-gray-600">
            {activeTab === 'blacklisted' ? 'No blacklisted hospitals' :
             activeTab === 'active'      ? 'No active hospitals' :
             'No hospitals found'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? 'Search adjust करा.' : 'सध्या कोणतेही hospital नाही.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(hospital => (
            <HospitalRow
              key={hospital.id}
              hospital={hospital}
              onBlacklist={(h)   => setBlacklistModal({ open: true, hospital: h })}
              onUnblacklist={(h) => setUnblacklistModal({ open: true, hospital: h })}
              actionLoading={actionLoading}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {/* ── Blacklist Modal ──────────────────────────────────────────────────── */}
      {blacklistModal.open && (
        <BlacklistModal
          hospital={blacklistModal.hospital}
          onConfirm={handleBlacklist}
          onCancel={() => setBlacklistModal({ open: false, hospital: null })}
          loading={actionLoading}
        />
      )}

      {/* ── Unblacklist Modal ────────────────────────────────────────────────── */}
      {unblacklistModal.open && (
        <UnblacklistModal
          hospital={unblacklistModal.hospital}
          onConfirm={handleUnblacklist}
          onCancel={() => setUnblacklistModal({ open: false, hospital: null })}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

export default HospitalBlacklistPage;