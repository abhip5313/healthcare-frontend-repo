import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import chatService from '../../services/chatService';

// ── Status configs ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  COMPLETED:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500',  label: 'Completed'  },
  CONFIRMED:  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',   label: 'Confirmed'  },
  PENDING:    { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Pending'    },
  CANCELLED:  { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',    label: 'Cancelled'  },
  REJECTED:   { bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400',   label: 'Rejected'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                     flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12  = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'appointments',  label: 'Appointments', icon: '📅' },
  { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const { patientId } = useParams();
  const navigate      = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    patientService.getPatientDetail(patientId)
      .then(res => setData(res.data))
      .catch(() => setError('Patient detail load करताना error.'))
      .finally(() => setLoading(false));
  }, [patientId]);

  // Chat वर जा — room create करा किंवा existing room open करा
  const handleChat = useCallback(async () => {
    setChatLoading(true);
    try {
      let roomId = data?.chat_room_id;
      if (!roomId) {
        const res = await chatService.getOrCreateRoom({
          patient_user_id: parseInt(patientId),
        });
        roomId = res.data?.room_id || res.data?.id;
      }
      if (roomId) {
        navigate(`/chat/${roomId}`);
      }
    } catch (e) {
      alert('Chat room open करताना error. पुन्हा try करा.');
    } finally {
      setChatLoading(false);
    }
  }, [data, patientId, navigate]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back
        </button>
        <div className="bg-white rounded-xl border p-6 animate-pulse space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-60 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 text-sm">{error || 'Patient सापडला नाही.'}</p>
          <button onClick={() => navigate('/patients')}
            className="mt-3 text-xs text-blue-600 underline">My Patients वर जा</button>
        </div>
      </div>
    );
  }

  const { patient, appointment_stats, appointments, prescriptions } = data;

  return (
    <div className="space-y-5">

      {/* Back button */}
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        My Patients
      </button>

      {/* Patient Profile Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start gap-4">
          <Avatar name={patient.full_name} />
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900">{patient.full_name}</h1>
            <div className="mt-1.5 space-y-1">
              {patient.email && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {patient.email}
                </div>
              )}
              {patient.phone_number && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257
                         1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498A1
                         1 0 0121 19v1a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {patient.phone_number}
                </div>
              )}
            </div>
          </div>

          {/* Chat Button */}
          <button
            onClick={handleChat}
            disabled={chatLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       disabled:bg-blue-300 text-white text-xs font-medium rounded-lg
                       transition-colors shadow-sm flex-shrink-0"
          >
            {chatLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0
                     01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418
                     4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )}
            {chatLoading ? 'Opening...' : 'Chat'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Visits"  value={appointment_stats.total}     color="blue"   />
        <StatCard label="Completed"     value={appointment_stats.completed}  color="green"  />
        <StatCard label="Upcoming"      value={appointment_stats.confirmed + appointment_stats.pending} color="yellow" />
        <StatCard label="Prescriptions" value={prescriptions.length}         color="purple" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium
                          transition-colors border-b-2 -mb-px
                          ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-700 bg-blue-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs
                                ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                {tab.id === 'appointments' ? appointments.length : prescriptions.length}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'appointments' && (
            <AppointmentsTab appointments={appointments} navigate={navigate} />
          )}
          {activeTab === 'prescriptions' && (
            <PrescriptionsTab prescriptions={prescriptions} navigate={navigate} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Appointments Tab ──────────────────────────────────────────────────────────
function AppointmentsTab({ appointments, navigate }) {
  if (!appointments.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400 text-sm">कोणतीही appointment नाही.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((appt, idx) => (
        <div
          key={appt.id}
          onClick={() => navigate(`/appointments/${appt.id}`)}
          className="flex items-start gap-4 p-3 rounded-lg border border-gray-100
                     hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-all group"
        >
          {/* Timeline dot */}
          <div className="flex flex-col items-center flex-shrink-0 mt-1">
            <div className={`w-3 h-3 rounded-full border-2 border-white shadow
                             ${STATUS_CONFIG[appt.status]?.dot || 'bg-gray-400'}`} />
            {idx < appointments.length - 1 && (
              <div className="w-px h-full min-h-8 bg-gray-200 mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={appt.status} />
              <span className="text-xs text-gray-500">#{appt.id}</span>
            </div>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {formatDate(appt.appointment_date)}
              {appt.appointment_time && (
                <span className="text-gray-500 font-normal">
                  {' '}at {formatTime(appt.appointment_time)}
                </span>
              )}
            </p>
            {appt.reason && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                Reason: {appt.reason}
              </p>
            )}
          </div>

          <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ── Prescriptions Tab ─────────────────────────────────────────────────────────
function PrescriptionsTab({ prescriptions, navigate }) {
  if (!prescriptions.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-400 text-sm">कोणतीही prescription नाही.</p>
        <button
          onClick={() => navigate('/prescriptions/create')}
          className="mt-3 px-4 py-2 text-xs font-medium text-white bg-blue-600
                     hover:bg-blue-700 rounded-lg transition-colors"
        >
          + Create Prescription
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create new button */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/prescriptions/create')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600
                     hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Prescription
        </button>
      </div>

      {prescriptions.map(presc => (
        <div
          key={presc.id}
          onClick={() => navigate(`/prescriptions/${presc.id}`)}
          className="p-4 rounded-lg border border-gray-100 hover:border-purple-200
                     hover:bg-purple-50 cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-purple-700 bg-purple-100
                                 px-2 py-0.5 rounded-full">
                  💊 Prescription #{presc.id}
                </span>
                <span className="text-xs text-gray-500">{formatDate(presc.created_at)}</span>
              </div>

              {presc.diagnosis && (
                <p className="text-sm font-medium text-gray-800 mt-1.5">{presc.diagnosis}</p>
              )}

              <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                {presc.medicine_count != null && (
                  <span className="text-xs text-gray-500">
                    {presc.medicine_count} medicine{presc.medicine_count !== 1 ? 's' : ''}
                  </span>
                )}
                {presc.follow_up_date && (
                  <span className="text-xs text-blue-600">
                    Follow-up: {formatDate(presc.follow_up_date)}
                  </span>
                )}
              </div>
            </div>

            <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-500 flex-shrink-0 mt-1 transition-colors"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const COLOR_MAP = {
  blue:   'bg-blue-50 text-blue-700 border-blue-100',
  green:  'bg-green-50 text-green-700 border-green-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
};

function StatCard({ label, value, color = 'blue' }) {
  const cls = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-75">{label}</p>
    </div>
  );
}