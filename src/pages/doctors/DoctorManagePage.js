import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';

// ── Status Badge ──────────────────────────────────────────────────────────
function DoctorBadge({ doctor }) {
  if (doctor.is_blacklisted) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                       text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"/>
        Blacklisted
      </span>
    );
  }
  const map = {
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    REJECTED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                     text-xs font-semibold border ${map[doctor.status] || map.PENDING}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        doctor.status === 'APPROVED' ? 'bg-green-500' :
        doctor.status === 'PENDING'  ? 'bg-yellow-500' : 'bg-gray-400'
      }`}/>
      {doctor.status}
    </span>
  );
}

// ── Blacklist Modal ───────────────────────────────────────────────────────
function BlacklistModal({ doctor, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-xl">🚫</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Blacklist Doctor</h3>
            <p className="text-xs text-gray-500">Dr. {doctor.full_name}</p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-700">
            ⚠️ Blacklisting will <strong>deactivate</strong> this doctor's account.
            They will not be able to login or accept appointments.
          </p>
        </div>

        <label className="block text-xs font-medium text-gray-700 mb-1">
          Reason for Blacklisting *
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Provide a clear reason (e.g. professional misconduct, fake license)..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-600
                       bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason); else toast.error('Reason required.'); }}
            disabled={loading}
            className="flex-1 py-2 text-xs font-medium text-white bg-red-600
                       rounded-lg hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Blacklisting...' : '🚫 Confirm Blacklist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
function DoctorManagePage() {
  const navigate = useNavigate();

  const [doctors, setDoctors]         = useState([]);
  const [counts, setCounts]           = useState({});
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [blacklistModal, setBlacklistModal] = useState({ open: false, doctor: null });
  const [rejectModal, setRejectModal] = useState({ open: false, doctor: null });
  const [rejectReason, setRejectReason] = useState('');
  const [search, setSearch]           = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await doctorService.manageDoctors(activeTab);
      setDoctors(data.data  || []);
      setCounts(data.counts || {});
    } catch {
      toast.error('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, [activeTab]);

  // Filter by search
  const filtered = doctors.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Actions
  const handleApprove = async (doctor) => {
    setActionLoading(true);
    try {
      await doctorService.approveReject(doctor.id, 'approve');
      toast.success(`Dr. ${doctor.full_name} approved!`);
      fetchDoctors();
    } catch { toast.error('Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Reason required.');
    setActionLoading(true);
    try {
      await doctorService.approveReject(rejectModal.doctor.id, 'reject', rejectReason);
      toast.success('Doctor rejected.');
      setRejectModal({ open: false, doctor: null });
      setRejectReason('');
      fetchDoctors();
    } catch { toast.error('Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleBlacklist = async (reason) => {
    setActionLoading(true);
    try {
      await doctorService.blacklistDoctor(blacklistModal.doctor.id, reason);
      toast.success(`Dr. ${blacklistModal.doctor.full_name} blacklisted.`);
      setBlacklistModal({ open: false, doctor: null });
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setActionLoading(false); }
  };

  const handleUnblacklist = async (doctor) => {
    setActionLoading(true);
    try {
      await doctorService.unblacklistDoctor(doctor.id);
      toast.success(`Dr. ${doctor.full_name} unblacklisted! Account restored.`);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setActionLoading(false); }
  };

  // Tab config
  const TABS = [
    { key: 'all',         label: 'All Doctors',  emoji: '👨‍⚕️', color: 'blue'   },
    { key: 'active',      label: 'Active',        emoji: '✅',  color: 'green'  },
    { key: 'pending',     label: 'Pending',       emoji: '⏳',  color: 'yellow' },
    { key: 'blacklisted', label: 'Blacklisted',   emoji: '🚫',  color: 'red'    },
    { key: 'rejected',    label: 'Rejected',      emoji: '❌',  color: 'gray'   },
  ];

  const tabColor = {
    blue:   'bg-blue-600 text-white',
    green:  'bg-green-600 text-white',
    yellow: 'bg-yellow-500 text-white',
    red:    'bg-red-600 text-white',
    gray:   'bg-gray-500 text-white',
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Doctor Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage doctors under your hospital — approve, reject, blacklist
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TABS.map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl p-3 text-center border transition-all ${
              activeTab === tab.key
                ? `${tabColor[tab.color]} border-transparent shadow-md`
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}>
            <p className="text-xl">{tab.emoji}</p>
            <p className={`text-lg font-bold mt-0.5 ${
              activeTab === tab.key ? 'text-white' : 'text-gray-800'
            }`}>
              {counts[tab.key] ?? '—'}
            </p>
            <p className={`text-xs mt-0.5 ${
              activeTab === tab.key ? 'text-white/80' : 'text-gray-500'
            }`}>
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, specialization, email..."
        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl
                   focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {/* Doctor List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-3xl mb-2">👨‍⚕️</p>
          <p className="text-sm font-medium text-gray-600">No doctors found</p>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'pending'
              ? 'No pending doctor approvals.'
              : activeTab === 'blacklisted'
              ? 'No blacklisted doctors.'
              : 'No doctors in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doctor => (
            <div key={doctor.id}
              className={`bg-white rounded-xl border shadow-sm p-4
                          transition-all ${
                doctor.is_blacklisted
                  ? 'border-red-200 bg-red-50/30'
                  : 'border-gray-100'
              }`}>
              <div className="flex items-start gap-4">

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                 text-white font-bold text-sm flex-shrink-0 ${
                  doctor.is_blacklisted ? 'bg-red-400' :
                  doctor.status === 'APPROVED' ? 'bg-teal-600' :
                  doctor.status === 'PENDING'  ? 'bg-yellow-500' : 'bg-gray-400'
                }`}>
                  {doctor.full_name?.charAt(0)?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Dr. {doctor.full_name}
                    </h3>
                    <DoctorBadge doctor={doctor} />
                    {doctor.is_blacklisted && (
                      <span className="text-xs text-red-500 font-medium">
                        🔒 Account Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    {doctor.specialization} • {doctor.experience_years} yrs •
                    ₹{Number(doctor.consultation_fee).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    ✉️ {doctor.email}
                  </p>

                  {/* Blacklist reason */}
                  {doctor.is_blacklisted && doctor.blacklist_reason && (
                    <div className="mt-2 bg-red-50 border border-red-200
                                    rounded-lg px-3 py-2">
                      <p className="text-xs text-red-700">
                        <span className="font-semibold">Blacklist Reason: </span>
                        {doctor.blacklist_reason}
                      </p>
                      {doctor.blacklisted_by_name && (
                        <p className="text-xs text-red-500 mt-0.5">
                          By: {doctor.blacklisted_by_name}
                          {doctor.blacklisted_at && (
                            <> • {new Date(doctor.blacklisted_at).toLocaleDateString('en-IN')}</>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {doctor.status === 'REJECTED' && !doctor.is_blacklisted && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      Rejected: {doctor.rejection_reason || 'No reason provided'}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">

                  {/* View Profile */}
                  <button
                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600
                               border border-blue-200 rounded-md hover:bg-blue-50">
                    View
                  </button>

                  {/* Pending — Approve/Reject */}
                  {doctor.status === 'PENDING' && !doctor.is_blacklisted && (
                    <>
                      <button
                        onClick={() => handleApprove(doctor)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs font-medium text-white
                                   bg-green-600 rounded-md hover:bg-green-700
                                   disabled:opacity-50">
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setRejectModal({ open: true, doctor })}
                        disabled={actionLoading}
                        className="px-3 py-1.5 text-xs font-medium text-white
                                   bg-red-500 rounded-md hover:bg-red-600
                                   disabled:opacity-50">
                        ✗ Reject
                      </button>
                    </>
                  )}

                  {/* Approved — Blacklist */}
                  {doctor.status === 'APPROVED' && !doctor.is_blacklisted && (
                    <button
                      onClick={() => setBlacklistModal({ open: true, doctor })}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-medium text-white
                                 bg-red-600 rounded-md hover:bg-red-700
                                 disabled:opacity-50">
                      🚫 Blacklist
                    </button>
                  )}

                  {/* Blacklisted — Unblacklist */}
                  {doctor.is_blacklisted && (
                    <button
                      onClick={() => handleUnblacklist(doctor)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-medium text-white
                                 bg-teal-600 rounded-md hover:bg-teal-700
                                 disabled:opacity-50">
                      ✅ Restore
                    </button>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Blacklist Modal */}
      {blacklistModal.open && (
        <BlacklistModal
          doctor={blacklistModal.doctor}
          onConfirm={handleBlacklist}
          onClose={() => setBlacklistModal({ open: false, doctor: null })}
          loading={actionLoading}
        />
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Reject Doctor</h3>
            <p className="text-xs text-gray-500 mb-4">
              Dr. <strong>{rejectModal.doctor?.full_name}</strong>
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Reason for rejection..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal({ open: false, doctor: null }); setRejectReason(''); }}
                className="flex-1 py-2 text-xs font-medium text-gray-600
                           bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 py-2 text-xs font-medium text-white
                           bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorManagePage;