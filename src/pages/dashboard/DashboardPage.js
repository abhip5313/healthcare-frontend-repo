import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    authService.healthCheck()
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('error'));
  }, []);

  // ── Role specific content ──────────────────────────────────────────
  const renderRoleContent = () => {
    switch (user?.role) {
      case 'HOSPITAL_ADMIN': return <HospitalAdminDashboard user={user} navigate={navigate} />;
      case 'DOCTOR':         return <DoctorDashboard user={user} navigate={navigate} />;
      case 'SUPER_ADMIN':    return <SuperAdminDashboard user={user} navigate={navigate} />;
      default:               return <PatientDashboard user={user} navigate={navigate} />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Welcome Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">
              Welcome back, {user?.full_name}! 👋
            </h1>
            <p className="text-blue-200 text-xs mt-0.5">
              {user?.role?.replace('_', ' ')} Account
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              apiStatus === 'healthy' ? 'bg-green-400' : 'bg-yellow-400'
            }`} />
            <span className="text-xs text-blue-200">
              {apiStatus === 'healthy' ? 'API Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Role Content */}
      {renderRoleContent()}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// HOSPITAL ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════
function HospitalAdminDashboard({ user, navigate }) {
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    import('../../services/hospitalService').then(async ({ default: hospitalService }) => {
      try {
        const data = await hospitalService.getMyHospital();
        setHospital(data.data);
      } catch {
        setHospital(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return <LoadingCards />;

  // Hospital register केला नाही
  if (!hospital) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-blue-300 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 bg-blue-50 rounded-full
                        flex items-center justify-center">
          <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5
                 m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1
                 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Register Your Hospital
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Get started by registering your hospital on the platform.
        </p>
        <button
          onClick={() => navigate('/hospital/register')}
          className="px-5 py-2 text-xs font-medium text-white bg-blue-600
                     rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Register Hospital
        </button>
      </div>
    );
  }

  // Hospital आहे — status दाखव
  const statusConfig = {
    APPROVED: {
      bg:   'bg-green-50 border-green-200',
      icon: 'text-green-500',
      text: 'text-green-800',
      title: '🎉 Hospital Approved!',
      msg:  'Your hospital is live on the platform. Doctors can now register under your hospital.',
    },
    PENDING: {
      bg:   'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-500',
      text: 'text-yellow-800',
      title: '⏳ Approval Pending',
      msg:  'Your hospital registration is under review by the Super Admin. This usually takes 24-48 hours.',
    },
    REJECTED: {
      bg:   'bg-red-50 border-red-200',
      icon: 'text-red-500',
      text: 'text-red-800',
      title: '❌ Hospital Rejected',
      msg:  hospital.rejection_reason || 'Your registration was rejected. Please contact support.',
    },
  };

  const cfg = statusConfig[hospital.status] || statusConfig.PENDING;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className={`border rounded-xl p-4 ${cfg.bg}`}>
        <h3 className={`text-sm font-semibold mb-1 ${cfg.text}`}>{cfg.title}</h3>
        <p className={`text-xs ${cfg.text}`}>{cfg.msg}</p>
      </div>

      {/* Hospital Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Hospital"  value={hospital.hospital_name} small />
        <StatCard label="Type"      value={hospital.hospital_type?.replace('_','-')} small />
        <StatCard label="City"      value={hospital.city} small />
        <StatCard label="Status"    value={hospital.status} small
          color={hospital.status === 'APPROVED' ? 'green' :
                 hospital.status === 'PENDING'  ? 'yellow' : 'red'} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <QuickAction
            label="View Hospital"
            icon="🏥"
            onClick={() => navigate('/hospital')}
          />
          <QuickAction
            label="My Profile"
            icon="👤"
            onClick={() => navigate('/profile')}
          />
          {hospital.status === 'APPROVED' && (
            <QuickAction
              label="Manage Doctors"
              icon="👨‍⚕️"
              onClick={() => navigate('/doctors')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SUPER ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════
function SuperAdminDashboard({ user, navigate }) {
  const [hospitalStats, setHospitalStats] = useState(null);
  const [doctorStats, setDoctorStats]     = useState(null);
  const [userCount, setUserCount]         = useState(null);

  useEffect(() => {
    // Hospital stats
    import('../../services/hospitalService').then(async ({ default: hospitalService }) => {
      try {
        const data = await hospitalService.getStats();
        setHospitalStats(data.data);
      } catch {
        setHospitalStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    });

    // Doctor stats
    import('../../services/doctorService').then(async ({ default: doctorService }) => {
      try {
        const data = await doctorService.getStats();
        setDoctorStats(data.data);
      } catch {
        setDoctorStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    });

    // User count
    import('../../services/authService').then(async ({ default: authService }) => {
      try {
        const data = await authService.getUsers();
        // paginated: data.count exists | non-paginated: data.data array
        setUserCount(data.count ?? (data.data || data.results || []).length);
      } catch {
        setUserCount(0);
      }
    });
  }, []);

  return (
    <div className="space-y-4">

      {/* Hospital Stats */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          🏥 Hospitals
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total"    value={hospitalStats?.total    ?? '...'} color="blue"   />
          <StatCard label="Pending"  value={hospitalStats?.pending  ?? '...'} color="yellow" />
          <StatCard label="Approved" value={hospitalStats?.approved ?? '...'} color="green"  />
          <StatCard label="Rejected" value={hospitalStats?.rejected ?? '...'} color="red"    />
        </div>
      </div>

      {/* Doctor Stats */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          👨‍⚕️ Doctors
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total"    value={doctorStats?.total    ?? '...'} color="teal"   />
          <StatCard label="Pending"  value={doctorStats?.pending  ?? '...'} color="yellow" />
          <StatCard label="Approved" value={doctorStats?.approved ?? '...'} color="green"  />
          <StatCard label="Rejected" value={doctorStats?.rejected ?? '...'} color="red"    />
        </div>
      </div>

      {/* Users summary */}
      <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
        <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-700">{userCount ?? '...'}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Platform Users</p>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-4 py-1.5 text-xs font-medium text-blue-600 border border-blue-200
                       rounded-lg hover:bg-blue-50 transition-colors"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <QuickAction label="Pending Approvals" icon="⏳"
            onClick={() => navigate('/admin/approvals')} />
          <QuickAction label="All Hospitals"     icon="🏥"
            onClick={() => navigate('/admin/hospitals')} />
          <QuickAction label="Blacklist"         icon="🚫"
            onClick={() => navigate('/admin/blacklist')} />
          <QuickAction label="All Users"         icon="👥"
            onClick={() => navigate('/admin/users')} />
          <QuickAction label="My Profile"        icon="👤"
            onClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// PATIENT DASHBOARD
// ══════════════════════════════════════════════════════════════════════
function PatientDashboard({ user, navigate }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Appointments" value="0" color="blue"   />
        <StatCard label="Prescriptions" value="0" color="green"  />
        <StatCard label="Medical Records" value="0" color="purple" />
        <StatCard label="Doctors Visited" value="0" color="orange" />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <QuickAction label="Find Doctors"    icon="🔍" onClick={() => navigate('/search')} />
          <QuickAction label="Appointments"    icon="📅" onClick={() => navigate('/appointments')} />
          <QuickAction label="Hospitals"       icon="🏥" onClick={() => navigate('/hospitals')} />
          <QuickAction label="Prescriptions"   icon="💊" onClick={() => navigate('/prescriptions')} />
          <QuickAction label="Medical Records" icon="📋" onClick={() => navigate('/records')} />
          <QuickAction label="My Profile"      icon="👤" onClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// DOCTOR DASHBOARD
// ══════════════════════════════════════════════════════════════════════

// ── Countdown hook — re-renders every second ───────────────────────
function useCountdown(appointmentDate, appointmentTime) {
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    if (!appointmentDate || !appointmentTime) return;
    const tick = () => {
      const target = new Date(`${appointmentDate}T${appointmentTime}`);
      const ms = target - Date.now();
      setDiff(ms);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [appointmentDate, appointmentTime]);

  return diff;
}

// ── Format ms → "Xh Ym Zs" / "Xs" / "Started" ─────────────────────
function fmtCountdown(ms) {
  if (ms === null) return '';
  if (ms <= 0) return 'Started';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2,'0')}s`;
  if (m > 0) return `${m}m ${String(s).padStart(2,'0')}s`;
  return `${s}s`;
}

// ── Single appointment card with live countdown ─────────────────────
function AppointmentCountdownCard({ appt, navigate }) {
  const ms = useCountdown(appt.appointment_date, appt.appointment_time);
  const isUrgent = ms !== null && ms > 0 && ms <= 10 * 60 * 1000;
  const isStarted = ms !== null && ms <= 0;

  const d = new Date(`${appt.appointment_date}T${appt.appointment_time}`);
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dayStr  = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div
      onClick={() => navigate(`/appointments/${appt.id}`)}
      className={`relative rounded-xl border p-4 cursor-pointer transition-all
        ${isUrgent
          ? 'border-red-400 bg-red-50 shadow-md shadow-red-100 animate-pulse'
          : appt.status === 'COMPLETED'
          ? 'border-gray-200 bg-gray-50'
          : 'border-gray-100 bg-white hover:border-teal-200 hover:shadow-sm'
        }`}
    >
      {/* Patient name + status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {appt.patient_name || appt.patient?.full_name || 'Patient'}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{dayStr} · {timeStr}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full
          ${appt.status === 'CONFIRMED' ? 'bg-teal-100 text-teal-700'
          : appt.status === 'PENDING'   ? 'bg-yellow-100 text-yellow-700'
          : appt.status === 'COMPLETED' ? 'bg-gray-100 text-gray-500'
          : 'bg-red-100 text-red-600'}`}>
          {appt.status}
        </span>
      </div>

      {/* Countdown — only for upcoming, not completed */}
      {!isStarted && ms !== null && appt.status !== 'COMPLETED' && (
        <div className={`flex items-center gap-1.5 mt-1
          ${isUrgent ? 'text-red-600' : 'text-teal-600'}`}>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className={`text-xs font-mono font-bold ${isUrgent ? 'text-red-600' : ''}`}>
            {fmtCountdown(ms)} remaining
          </span>
        </div>
      )}



      {/* 10-min urgent banner */}
      {isUrgent && (
        <div className="mt-2 flex items-center gap-2 bg-red-100 rounded-lg px-3 py-2">
          <span className="text-base">🔔</span>
          <p className="text-xs font-bold text-red-700">Next appointment — 10 min left!</p>
          <button
            onClick={e => { e.stopPropagation(); navigate(`/appointments/${appt.id}`); }}
            className="ml-auto shrink-0 px-3 py-1 text-[11px] font-bold text-white
                       bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Join Now
          </button>
        </div>
      )}
    </div>
  );
}

function DoctorDashboard({ user, navigate }) {
  const [doctor, setDoctor]   = useState(null);
  const [todayApts, setTodayApts] = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ default: doctorSvc }, { default: apptSvc }] = await Promise.all([
          import('../../services/doctorService'),
          import('../../services/appointmentService'),
        ]);

        const [profileRes, apptRes, statsRes] = await Promise.allSettled([
          doctorSvc.getMyProfile(),
          apptSvc.getDoctorAppointments({ date: new Date().toISOString().slice(0,10) }),
          apptSvc.getStats(),
        ]);

        if (profileRes.status === 'fulfilled') {
          setDoctor(profileRes.value.data || profileRes.value);
        }
        if (apptRes.status === 'fulfilled') {
          const raw = apptRes.value;
          const list = raw.results || raw.data || raw || [];
          const todayISO = new Date().toISOString().slice(0, 10);
          // Filter: only today, exclude CANCELLED
          const todayOnly = list.filter(a =>
            a.appointment_date === todayISO &&
            a.status !== 'CANCELLED'
          );
          // Sort by time ascending
          const sorted = [...todayOnly].sort((a, b) =>
            a.appointment_time?.localeCompare(b.appointment_time));
          setTodayApts(sorted);
        }
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data || statsRes.value);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingCards />;

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-4">

      {/* ── Today's date bar ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 font-medium">📅 {todayStr}</p>
        <button
          onClick={() => navigate('/appointments')}
          className="text-xs text-teal-600 hover:underline font-medium"
        >
          All appointments →
        </button>
      </div>

      {/* ── Hospital Info ── */}
      {doctor && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-4 py-3 text-white
                          flex items-center justify-between">
            <div>
              <p className="text-[11px] text-teal-300 uppercase tracking-wide font-medium">
                Your Hospital
              </p>
              <p className="text-sm font-bold mt-0.5">
                🏥 {doctor.hospital_name || 'Not assigned'}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
              ${doctor.status === 'APPROVED' ? 'bg-green-400 text-green-900'
              : doctor.status === 'PENDING'  ? 'bg-yellow-300 text-yellow-900'
              : 'bg-red-400 text-white'}`}>
              {doctor.status}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
            {[
              { label: 'Specialization', value: doctor.specialization },
              { label: 'Experience',     value: `${doctor.experience_years} yrs` },
              { label: 'Fee',            value: `₹${Number(doctor.consultation_fee||0).toLocaleString()}` },
              { label: 'Availability',   value: doctor.availability_status || '—' },
            ].map(item => (
              <div key={item.label} className="px-4 py-3">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{item.label}</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Today's Appts"  value={todayApts.length}       color="teal"   />
        <StatCard label="Total Appts"    value={stats?.total      ?? '…'} color="blue"   />
        <StatCard label="Completed"      value={stats?.completed  ?? '…'} color="green"  />
        <StatCard label="Pending"        value={stats?.pending    ?? '…'} color="yellow" />
      </div>

      {/* ── Today's appointments ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            🗓️ Today's Appointments
          </h3>
          <span className="text-[11px] text-gray-400">
            {todayApts.length} scheduled
          </span>
        </div>

        {todayApts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-sm font-medium text-gray-500">No appointments today</p>
            <p className="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayApts.map(appt => (
              <AppointmentCountdownCard key={appt.id} appt={appt} navigate={navigate} />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction label="Appointments" icon="📅" onClick={() => navigate('/appointments')} />
          <QuickAction label="My Profile"   icon="👤" onClick={() => navigate('/doctor/profile')} />
          <QuickAction label="Patients"     icon="🧑‍⚕️" onClick={() => navigate('/doctor/patients')} />
          <QuickAction label="Prescriptions" icon="💊" onClick={() => navigate('/prescriptions')} />
        </div>
      </div>
    </div>
  );
}
// ══════════════════════════════════════════════════════════════════════
// Reusable Components
// ══════════════════════════════════════════════════════════════════════
const COLOR_MAP = {
  teal:   'bg-teal-50 text-teal-700 border-teal-100',
  blue:   'bg-blue-50 text-blue-700 border-blue-100',
  green:  'bg-green-50 text-green-700 border-green-100',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  red:    'bg-red-50 text-red-700 border-red-100',
  purple: 'bg-purple-50 text-purple-700 border-purple-100',
  orange: 'bg-orange-50 text-orange-700 border-orange-100',
};

function StatCard({ label, value, color = 'blue', small = false }) {
  const cls = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className={`font-bold ${small ? 'text-sm' : 'text-xl'} truncate`}>
        {value}
      </p>
      <p className="text-xs mt-0.5 opacity-75 truncate">{label}</p>
    </div>
  );
}

function QuickAction({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs
                 font-medium text-gray-700 bg-gray-50 hover:bg-blue-50
                 hover:text-blue-700 border border-gray-100
                 hover:border-blue-200 transition-all text-left"
    >
      <span className="text-base">{icon}</span>
      {label}
    </button>
  );
}

function LoadingCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-16 animate-pulse" />
      ))}
    </div>
  );
}

export default DashboardPage;