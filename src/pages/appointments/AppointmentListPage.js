import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700 border-red-200' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function StatusBadge({ status }) {
  const { label, cls } = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function AppointmentListPage() {
  const { user }          = useAuth();
  const navigate          = useNavigate();
  const isDoctor          = user?.role === 'DOCTOR';
  const isPatient         = user?.role === 'PATIENT';
  const isHospitalAdmin   = user?.role === 'HOSPITAL_ADMIN';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [cancelModal, setCancelModal]   = useState({ open: false, id: null });
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats]               = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus ? { status: filterStatus } : {};

      let apptData, statsData;

      if (isHospitalAdmin) {
        // Hospital admin — hospital च्या सगळ्या appointments
        const res = await appointmentService.getHospitalAppointments(params);
        apptData  = res.data || [];
        statsData = res.stats || null;
      } else {
        const [apptRes, statsRes] = await Promise.allSettled([
          isDoctor
            ? appointmentService.getDoctorAppointments(params)
            : appointmentService.getMyAppointments(params),
          appointmentService.getStats(),
        ]);
        apptData  = apptRes.status  === 'fulfilled' ? apptRes.value.data  || [] : [];
        statsData = statsRes.status === 'fulfilled' ? statsRes.value.data || null : null;
      }

      setAppointments(apptData);
      setStats(statsData);
    } catch (err) {
      toast.error('Appointments load करताना error.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, isDoctor, isHospitalAdmin]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Hospital Admin client-side search
  const displayed = isHospitalAdmin && searchQuery
    ? appointments.filter(a =>
        a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : appointments;

  const handleStatusUpdate = async (id, newStatus, extra = {}) => {
    setActionLoading(true);
    try {
      await appointmentService.updateStatus(id, newStatus, extra);
      toast.success(`Appointment ${newStatus.toLowerCase()}!`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please enter a reason.');
    setActionLoading(true);
    try {
      await appointmentService.updateStatus(
        cancelModal.id, 'CANCELLED',
        { cancellation_reason: cancelReason }
      );
      toast.success('Appointment cancelled.');
      setCancelModal({ open: false, id: null });
      setCancelReason('');
      fetchAll();
    } catch {
      toast.error('Failed to cancel.');
    } finally {
      setActionLoading(false);
    }
  };

  const pageTitle = isHospitalAdmin
    ? 'Hospital Appointments'
    : isDoctor ? 'Patient Appointments' : 'My Appointments';

  const pageSubtitle = isHospitalAdmin
    ? 'Your hospital च्या सगळ्या doctors च्या appointments'
    : isDoctor
      ? 'Manage and confirm patient appointments'
      : 'Track your upcoming and past appointments';

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{pageSubtitle}</p>
        </div>
        {isPatient && (
          <button onClick={() => navigate('/search')}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 transition-colors">
            + Book Appointment
          </button>
        )}
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'Total',     val: stats.total,     color: 'bg-gray-50 text-gray-700 border-gray-100' },
            { label: 'Pending',   val: stats.pending,   color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            { label: 'Confirmed', val: stats.confirmed, color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: 'Completed', val: stats.completed, color: 'bg-green-50 text-green-700 border-green-100' },
            { label: 'Cancelled', val: stats.cancelled, color: 'bg-red-50 text-red-700 border-red-100' },
          ].map(s => (
            <div key={s.label}
              className={`rounded-xl p-3 text-center border ${s.color}`}>
              <p className="text-lg font-bold">{s.val}</p>
              <p className="text-xs mt-0.5 opacity-75">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hospital Admin — Search bar */}
      {isHospitalAdmin && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </svg>
          <input
            type="text"
            placeholder="Patient या Doctor नाव search करा..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white
                       placeholder-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-sm font-medium text-gray-600">No appointments found</p>
          <p className="text-xs text-gray-400 mt-1">
            {isPatient ? 'Book your first appointment with a doctor.' : 'No appointments yet.'}
          </p>
          {isPatient && (
            <button onClick={() => navigate('/search')}
              className="mt-4 px-5 py-2 text-xs font-medium text-white
                         bg-blue-600 rounded-lg hover:bg-blue-700">
              Find Doctors
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              isDoctor={isDoctor}
              isPatient={isPatient}
              isHospitalAdmin={isHospitalAdmin}
              actionLoading={actionLoading}
              navigate={navigate}
              onStatusUpdate={handleStatusUpdate}
              onCancelOpen={(id) => setCancelModal({ open: true, id })}
            />
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Cancel Appointment</h3>
            <p className="text-xs text-gray-500 mb-4">Please provide a reason for cancellation.</p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Reason for cancellation..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setCancelModal({ open: false, id: null }); setCancelReason(''); }}
                className="px-4 py-2 text-xs font-medium text-gray-600
                           bg-gray-100 rounded-lg hover:bg-gray-200">
                Go Back
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600
                           rounded-lg hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────────────────────
function AppointmentCard({
  appt, isDoctor, isPatient, isHospitalAdmin,
  actionLoading, navigate, onStatusUpdate, onCancelOpen,
}) {
  const formattedDate = new Date(appt.appointment_date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {isPatient ? appt.doctor_name : appt.patient_name}
            </h3>
            <StatusBadge status={appt.status} />
          </div>

          {/* Sub info */}
          <div className="space-y-0.5">
            {isHospitalAdmin && (
              <p className="text-xs text-gray-500">
                👨‍⚕️ Doctor: <span className="font-medium text-gray-700">{appt.doctor_name}</span>
              </p>
            )}
            {isHospitalAdmin && (
              <p className="text-xs text-gray-500">
                🧑 Patient: <span className="font-medium text-gray-700">{appt.patient_name}</span>
              </p>
            )}
            {isDoctor && (
              <p className="text-xs text-gray-500">Patient: {appt.patient_name}</p>
            )}
            {isPatient && (
              <p className="text-xs text-gray-500">
                {appt.specialization} • {appt.hospital_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
            <span>📅 {formattedDate}</span>
            <span>🕐 {appt.appointment_time}</span>
          </div>

          {appt.reason && (
            <p className="text-xs text-gray-400 mt-1 truncate">💬 {appt.reason}</p>
          )}

          {/* Hospital Admin — extra info badge */}
          {isHospitalAdmin && appt.hospital_name && (
            <p className="text-xs text-blue-600 mt-1">🏥 {appt.hospital_name}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => navigate(`/appointments/${appt.id}`)}
            className="px-3 py-1.5 text-xs font-medium text-blue-600
                       border border-blue-200 rounded-md hover:bg-blue-50">
            View
          </button>

          {/* Doctor actions */}
          {isDoctor && appt.status === 'PENDING' && (
            <>
              <button
                onClick={() => onStatusUpdate(appt.id, 'CONFIRMED')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium text-white
                           bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                ✓ Confirm
              </button>
              <button
                onClick={() => onStatusUpdate(appt.id, 'REJECTED')}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-medium text-white
                           bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50">
                ✗ Reject
              </button>
            </>
          )}

          {isDoctor && appt.status === 'CONFIRMED' && (
            <button
              onClick={() => onStatusUpdate(appt.id, 'COMPLETED')}
              disabled={actionLoading}
              className="px-3 py-1.5 text-xs font-medium text-white
                         bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50">
              ✓ Complete
            </button>
          )}

          {/* Hospital Admin actions — cancel करण्याचा अधिकार */}
          {isHospitalAdmin && ['PENDING', 'CONFIRMED'].includes(appt.status) && (
            <button
              onClick={() => onCancelOpen(appt.id)}
              disabled={actionLoading}
              className="px-3 py-1.5 text-xs font-medium text-red-600
                         border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50">
              Cancel
            </button>
          )}

          {/* Patient actions */}
          {isPatient && ['PENDING', 'CONFIRMED'].includes(appt.status) && (
            <>
              <button
                onClick={() => navigate(`/appointments/${appt.id}/reschedule`)}
                className="px-3 py-1.5 text-xs font-medium text-orange-600
                           border border-orange-200 rounded-md hover:bg-orange-50">
                Reschedule
              </button>
              <button
                onClick={() => onCancelOpen(appt.id)}
                className="px-3 py-1.5 text-xs font-medium text-red-600
                           border border-red-200 rounded-md hover:bg-red-50">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentListPage;