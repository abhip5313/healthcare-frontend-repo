import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';

const STATUS_STYLES = {
  PENDING:  'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICONS = {
  PENDING:  '⏳',
  APPROVED: '✅',
  REJECTED: '❌',
};

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DoctorMyLeavePage() {
  const [leaves,  setLeaves]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(null);

  // Form state
  const [form, setForm] = useState({
    leave_date: getTodayStr(),
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      const res = await doctorService.getMyLeaves();
      setLeaves(res.data || []);
    } catch {
      toast.error('Could not load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leave_date) return toast.error('Please select a date.');
    setSubmitting(true);
    try {
      await doctorService.applyLeave(form);
      toast.success('Leave request submitted! Hospital admin will review it.');
      setForm({ leave_date: getTodayStr(), reason: '' });
      fetchLeaves();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat();
        msgs.forEach(m => toast.error(String(m)));
      } else {
        toast.error('Failed to submit leave request.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    setCancelling(id);
    try {
      await doctorService.cancelLeave(id);
      toast.success('Leave request cancelled.');
      fetchLeaves();
    } catch {
      toast.error('Failed to cancel leave.');
    } finally {
      setCancelling(null);
    }
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white";
  const lbl = "block text-xs font-semibold text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">🗓️ Leave Requests</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Apply for a day off. Your hospital admin will approve or reject.
          Approved leave days automatically set your status to <strong>On Leave</strong>.
        </p>
      </div>

      {/* Apply Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          ➕ Apply for Leave
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={lbl}>Leave Date *</label>
            <input
              type="date"
              name="leave_date"
              value={form.leave_date}
              min={getTodayStr()}
              onChange={handleChange}
              required
              className={inp}
            />
            <p className="text-xs text-gray-400 mt-1">
              Today's date is pre-selected. Select the date you want to take leave.
            </p>
          </div>

          <div>
            <label className={lbl}>Reason <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              className={inp}
              placeholder="e.g. Personal emergency, Medical appointment, Family function..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-sm font-medium text-white bg-teal-600
                         rounded-lg hover:bg-teal-700 disabled:opacity-50
                         transition-colors flex items-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {submitting ? 'Submitting...' : '📤 Submit Leave Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
          📋 My Leave History
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin w-6 h-6 text-teal-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">🏖️</p>
            <p className="text-sm">No leave requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <div
                key={leave.id}
                className="flex items-start justify-between gap-3 bg-gray-50
                           border border-gray-100 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(leave.leave_date)}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                                     text-xs font-semibold border ${STATUS_STYLES[leave.status]}`}>
                      {STATUS_ICONS[leave.status]} {leave.status}
                    </span>
                  </div>

                  {leave.reason && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{leave.reason}</p>
                  )}

                  {leave.status === 'REJECTED' && leave.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1">
                      Reason: {leave.rejection_reason}
                    </p>
                  )}

                  {leave.status === 'APPROVED' && leave.reviewed_by_name && (
                    <p className="text-xs text-green-600 mt-1">
                      Approved by {leave.reviewed_by_name}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    Applied: {new Date(leave.applied_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>

                {leave.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(leave.id)}
                    disabled={cancelling === leave.id}
                    className="text-xs text-red-400 hover:text-red-600 font-medium
                               transition-colors shrink-0 mt-0.5"
                  >
                    {cancelling === leave.id ? '...' : 'Cancel'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <p className="text-xs text-teal-800 font-semibold mb-1">ℹ️ How it works</p>
        <ul className="text-xs text-teal-700 space-y-1 list-disc list-inside">
          <li>Submit your leave request with the date and reason.</li>
          <li>Hospital admin will approve or reject it.</li>
          <li>If approved and that date is today, your status becomes <strong>On Leave</strong> automatically.</li>
          <li>You can cancel a pending request anytime before it's reviewed.</li>
        </ul>
      </div>
    </div>
  );
}
