import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';

const TABS = [
  { key: '',         label: 'All' },
  { key: 'PENDING',  label: '⏳ Pending' },
  { key: 'APPROVED', label: '✅ Approved' },
  { key: 'REJECTED', label: '❌ Rejected' },
];

const STATUS_STYLES = {
  PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
}

function RejectModal({ leave, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Reject Leave Request</h3>
        <p className="text-xs text-gray-500 mb-4">
          Dr. {leave.doctor_name} — {formatDate(leave.leave_date)}
        </p>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-400"
            placeholder="Explain why this leave is rejected..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600
                       rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Rejecting...' : 'Reject Leave'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLeavePage() {
  const [leaves,   setLeaves]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [acting,   setActing]   = useState(null);   // id of the leave being acted on
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getAdminLeaves(activeTab);
      setLeaves(res.data || []);
    } catch {
      toast.error('Could not load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [activeTab]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this leave request?')) return;
    setActing(id);
    try {
      await doctorService.adminLeaveAction(id, 'approve');
      toast.success('Leave approved! Doctor\'s availability will be set to "On Leave" on that date.');
      fetchLeaves();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve leave.';
      toast.error(msg);
    } finally {
      setActing(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActing(rejectTarget.id);
    try {
      await doctorService.adminLeaveAction(rejectTarget.id, 'reject', reason);
      toast.success('Leave rejected.');
      setRejectTarget(null);
      fetchLeaves();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject leave.';
      toast.error(msg);
    } finally {
      setActing(null);
    }
  };

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">🗓️ Leave Requests</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Review and manage leave requests from your hospital's doctors.
          Approved leaves automatically set the doctor's availability to <strong>On Leave</strong>.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.key === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full
                               px-1.5 py-0.5 font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin w-7 h-7 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : leaves.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-gray-400">No leave requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => (
            <div
              key={leave.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-900">
                      Dr. {leave.doctor_name}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                     text-xs font-semibold border ${STATUS_STYLES[leave.status]}`}>
                      {leave.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                    <span>📅</span>
                    <span className="font-semibold">{formatDate(leave.leave_date)}</span>
                  </div>

                  {leave.reason && (
                    <p className="text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-600">Reason:</span> {leave.reason}
                    </p>
                  )}

                  {leave.status === 'REJECTED' && leave.rejection_reason && (
                    <p className="text-xs text-red-600">
                      <span className="font-medium">Rejection reason:</span> {leave.rejection_reason}
                    </p>
                  )}

                  {leave.status === 'APPROVED' && leave.reviewed_by_name && (
                    <p className="text-xs text-green-600">
                      Approved by {leave.reviewed_by_name}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    Applied {new Date(leave.applied_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>

                {/* Right: actions (only for PENDING) */}
                {leave.status === 'PENDING' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      disabled={acting === leave.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600
                                 rounded-lg hover:bg-green-700 disabled:opacity-50
                                 transition-colors"
                    >
                      {acting === leave.id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => setRejectTarget(leave)}
                      disabled={acting === leave.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-500
                                 rounded-lg hover:bg-red-600 disabled:opacity-50
                                 transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <RejectModal
          leave={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
          loading={acting === rejectTarget.id}
        />
      )}
    </div>
  );
}
