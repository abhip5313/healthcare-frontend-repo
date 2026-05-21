import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  COMPLETED:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Completed'  },
  CONFIRMED:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Confirmed'  },
  PENDING:    { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending'    },
  CANCELLED:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cancelled'  },
  REJECTED:   { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Rejected'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-700
                     flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DoctorPatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    patientService.getMyPatients()
      .then(data => {
        setPatients(data.data || []);
        setFiltered(data.data || []);
      })
      .catch(() => setError('Patients load करताना error आला.'))
      .finally(() => setLoading(false));
  }, []);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(patients);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(patients.filter(p =>
      p.patient_name.toLowerCase().includes(q) ||
      p.patient_email?.toLowerCase().includes(q) ||
      p.patient_phone?.includes(q)
    ));
  }, [search, patients]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={() => window.location.reload()}
          className="mt-3 text-xs text-red-500 underline">Retry</button>
      </div>
    );
  }

  // ── Empty ──
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
                 M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857
                 m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1">No Patients Yet</h3>
        <p className="text-xs text-gray-500">Patients तुमच्याशी appointments घेतल्यावर इथे दिसतील.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">My Patients</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-700">{patients.length}</p>
          <p className="text-xs text-blue-600 mt-0.5">Total Patients</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-2xl font-bold text-green-700">
            {patients.reduce((sum, p) => sum + p.total_appointments, 0)}
          </p>
          <p className="text-xs text-green-600 mt-0.5">Total Appointments</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-purple-700">
            {patients.filter(p => p.last_appointment_status === 'COMPLETED').length}
          </p>
          <p className="text-xs text-purple-600 mt-0.5">Completed Treatment</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          type="text"
          placeholder="Patient name, email किंवा phone search करा..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search result count */}
      {search && (
        <p className="text-xs text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} "{search}" साठी
        </p>
      )}

      {/* Patient Cards */}
      <div className="space-y-3">
        {filtered.map(patient => (
          <PatientCard
            key={patient.patient_id}
            patient={patient}
            navigate={navigate}
          />
        ))}
        {filtered.length === 0 && search && (
          <div className="text-center py-8 text-gray-500 text-sm">
            कोणीही मिळाला नाही "{search}" साठी
          </div>
        )}
      </div>
    </div>
  );
}

// ── Patient Card ──────────────────────────────────────────────────────────────
function PatientCard({ patient, navigate }) {
  const formattedDate = patient.last_appointment_date
    ? new Date(patient.last_appointment_date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : '—';

  return (
    <div
      onClick={() => navigate(`/patients/${patient.patient_id}`)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4
                 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">

        {/* Avatar */}
        <Avatar name={patient.patient_name} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {patient.patient_name}
            </h3>
            {patient.last_appointment_status && (
              <StatusBadge status={patient.last_appointment_status} />
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 flex-wrap">
            {patient.patient_email && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {patient.patient_email}
              </span>
            )}
            {patient.patient_phone && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13
                       a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0
                       01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {patient.patient_phone}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-base font-bold text-gray-800">{patient.total_appointments}</p>
            <p className="text-xs text-gray-500">Visits</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-gray-700">{formattedDate}</p>
            <p className="text-xs text-gray-500">Last Visit</p>
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0"
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Mobile stats */}
      <div className="sm:hidden mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">{patient.total_appointments} visits</span>
        <span className="text-xs text-gray-500">Last: {formattedDate}</span>
      </div>
    </div>
  );
}