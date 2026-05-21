import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-700',     icon: '✅' },
  COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-700',   icon: '🎉' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700',       icon: '❌' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-gray-100 text-gray-600',     icon: '🚫' },
};

function AppointmentDetailPage() {
  const { id }           = useParams();
  const navigate         = useNavigate();
  const { user }         = useAuth();
  const isDoctor         = user?.role === 'DOCTOR';
  const isPatient        = user?.role === 'PATIENT';
  const isHospitalAdmin  = user?.role === 'HOSPITAL_ADMIN';
  const isSuperAdmin     = user?.role === 'SUPER_ADMIN';
  const isAdmin          = isHospitalAdmin || isSuperAdmin;

  const [appt, setAppt]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notes, setNotes]         = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModal, setCancelModal]     = useState(false);
  const [cancelReason, setCancelReason]   = useState('');

  const fetchAppt = () => {
    appointmentService.getAppointment(id)
      .then(data => {
        setAppt(data.data);
        setNotes(data.data?.notes || '');
      })
      .catch(() => {
        toast.error('Appointment not found.');
        navigate('/appointments');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAppt(); }, [id]);

  const handleStatus = async (newStatus, extra = {}) => {
    setActionLoading(true);
    try {
      await appointmentService.updateStatus(id, newStatus, extra);
      toast.success(`Appointment ${newStatus.toLowerCase()}!`);
      fetchAppt();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Cancellation reason द्या.');
    setActionLoading(true);
    try {
      await appointmentService.updateStatus(id, 'CANCELLED', {
        cancellation_reason: cancelReason,
      });
      toast.success('Appointment cancelled.');
      setCancelModal(false);
      setCancelReason('');
      fetchAppt();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinMeeting = () => navigate(`/appointments/${id}/video-call`);

  if (loading) return (
    <div className="flex justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (!appt) return null;

  const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.PENDING;

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Back */}
      <button onClick={() => navigate('/appointments')}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600">
        ← Back to Appointments
      </button>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${cfg.cls}`}>
        <span className="text-2xl">{cfg.icon}</span>
        <div>
          <p className="text-sm font-bold">Appointment {cfg.label}</p>
          <p className="text-xs opacity-75 mt-0.5">
            {new Date(appt.appointment_date).toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })} at {appt.appointment_time}
          </p>
        </div>
      </div>

      {/* Hospital Admin Info Banner */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2">
          <span className="text-base">🏥</span>
          <p className="text-xs text-blue-700 font-medium">
            {isHospitalAdmin ? 'Hospital Admin View — Full access' : 'Super Admin View — Full access'}
          </p>
        </div>
      )}

      {/* Video Meeting Banner */}
      {appt.status === 'CONFIRMED' && appt.meeting_link && (
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-4
                        flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0
                     002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Video Consultation Ready</p>
              <p className="text-blue-100 text-xs mt-0.5">
                {appt.meeting_joined_at ? 'Meeting आधीच join केली होती' : 'Meeting join करण्यासाठी तयार'}
              </p>
            </div>
          </div>
          {(isDoctor || isPatient) && (
            <button onClick={handleJoinMeeting}
              className="flex-shrink-0 px-4 py-2.5 bg-white text-blue-700 rounded-lg
                         text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm">
              🎥 Join Meeting
            </button>
          )}
        </div>
      )}

      {appt.status === 'CONFIRMED' && !appt.meeting_link && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-xl">⏳</span>
          <div>
            <p className="text-yellow-800 text-sm font-medium">Meeting link तयार होतेय</p>
            <p className="text-yellow-600 text-xs mt-0.5">थोड्या वेळात meeting link उपलब्ध होईल.</p>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 border-b pb-2">
          Appointment Details
        </h2>
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
          <InfoRow label="Patient"      value={appt.patient_name} />
          <InfoRow label="Doctor"       value={appt.doctor_name} />
          <InfoRow label="Hospital"     value={appt.hospital_name || 'N/A'} />
          <InfoRow label="Specialization" value={appt.specialization} />
          <InfoRow label="Date"
            value={new Date(appt.appointment_date).toLocaleDateString('en-IN')} />
          <InfoRow label="Time"         value={appt.appointment_time} />
          <InfoRow label="Consultation Fee"
            value={`₹${Number(appt.consultation_fee).toLocaleString()}`}
            green />
          {appt.reason && (
            <div className="col-span-2">
              <span className="text-gray-400 block mb-0.5">Reason for Visit</span>
              <span className="font-medium">{appt.reason}</span>
            </div>
          )}
          {appt.cancellation_reason && (
            <div className="col-span-2">
              <span className="text-red-400 block mb-0.5">Cancellation Reason</span>
              <span className="font-medium text-red-700">{appt.cancellation_reason}</span>
            </div>
          )}
          {appt.notes && (
            <div className="col-span-2">
              <span className="text-gray-400 block mb-0.5">Doctor Notes</span>
              <span className="font-medium">{appt.notes}</span>
            </div>
          )}
        </div>

        {/* Contact info for admin */}
        {isAdmin && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-600">
            <InfoRow label="Patient Email"  value={appt.patient_email} />
            <InfoRow label="Patient Phone"  value={appt.patient_phone} />
            <InfoRow label="Doctor Phone"   value={appt.doctor_phone} />
          </div>
        )}
      </div>

      {/* ── DOCTOR ACTIONS ── */}
      {isDoctor && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>

          {appt.status === 'PENDING' && (
            <div className="flex gap-2">
              <button onClick={() => handleStatus('CONFIRMED')}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-green-600
                           rounded-lg hover:bg-green-700 disabled:opacity-50">
                ✓ Confirm Appointment
              </button>
              <button onClick={() => handleStatus('REJECTED')}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-medium text-white bg-red-500
                           rounded-lg hover:bg-red-600 disabled:opacity-50">
                ✗ Reject
              </button>
            </div>
          )}

          {appt.status === 'CONFIRMED' && (
            <div className="space-y-3">
              <button onClick={handleJoinMeeting}
                disabled={!appt.meeting_link}
                className="w-full py-2.5 text-xs font-medium text-white bg-blue-600
                           rounded-lg hover:bg-blue-700 disabled:opacity-50
                           flex items-center justify-center gap-2">
                🎥 Join Video Consultation
              </button>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Add Notes (optional)
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={2} placeholder="Diagnosis, prescription notes..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-teal-500"/>
              </div>
              <button onClick={() => handleStatus('COMPLETED', { notes })}
                disabled={actionLoading || !appt.meeting_joined_at}
                title={!appt.meeting_joined_at ? 'आधी meeting join करा' : ''}
                className="w-full py-2.5 text-xs font-medium text-white bg-teal-600
                           rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {appt.meeting_joined_at ? '✓ Mark as Completed' : '🔒 Complete (join meeting first)'}
              </button>
            </div>
          )}

          {['COMPLETED','CANCELLED','REJECTED'].includes(appt.status) && (
            <p className="text-xs text-gray-400 text-center py-2">
              No actions available for {appt.status.toLowerCase()} appointments.
            </p>
          )}
        </div>
      )}

      {/* ── HOSPITAL ADMIN / SUPER ADMIN ACTIONS ── */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Admin Actions</h3>

          {['PENDING', 'CONFIRMED'].includes(appt.status) ? (
            <button
              onClick={() => setCancelModal(true)}
              disabled={actionLoading}
              className="w-full py-2.5 text-xs font-medium text-red-600
                         border border-red-200 rounded-lg hover:bg-red-50
                         disabled:opacity-50 transition-colors">
              ✗ Cancel Appointment
            </button>
          ) : (
            <p className="text-xs text-gray-400 text-center py-2">
              This appointment is already {appt.status.toLowerCase()}.
            </p>
          )}
        </div>
      )}

      {/* ── PATIENT ACTIONS ── */}
      {isPatient && ['PENDING','CONFIRMED'].includes(appt.status) && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/appointments/${id}/reschedule`)}
            className="flex-1 py-2.5 text-xs font-medium text-orange-600
                       border border-orange-200 rounded-xl hover:bg-orange-50">
            📆 Reschedule
          </button>
          <button
            onClick={() => setCancelModal(true)}
            className="flex-1 py-2.5 text-xs font-medium text-red-600
                       border border-red-200 rounded-xl hover:bg-red-50">
            ✗ Cancel Appointment
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Cancel Appointment</h3>
            <p className="text-xs text-gray-500 mb-4">
              Cancellation चं कारण द्या.
            </p>
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
                onClick={() => { setCancelModal(false); setCancelReason(''); }}
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

function InfoRow({ label, value, green = false }) {
  return (
    <div>
      <span className="text-gray-400 block mb-0.5">{label}</span>
      <span className={`font-medium ${green ? 'text-teal-700' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default AppointmentDetailPage;