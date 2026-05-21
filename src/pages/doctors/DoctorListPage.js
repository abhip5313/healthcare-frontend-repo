import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';
import DoctorCard from '../../components/doctors/DoctorCard';
import { useAuth } from '../../context/AuthContext';

function DoctorListPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';
  const isDoctor        = user?.role === 'DOCTOR';

  const [doctors, setDoctors]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterSpec, setFilterSpec]   = useState('');
  const [rejectModal, setRejectModal] = useState({ open: false, doctor: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState('all'); // all | pending

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let data;
      if (isHospitalAdmin) {
        data = activeTab === 'pending'
          ? await doctorService.getPendingDoctors()
          : await doctorService.getHospitalDoctors();
      } else {
        data = await doctorService.listDoctors({
          search: search || undefined,
          specialization: filterSpec || undefined,
        });
      }
      setDoctors(data.data || []);
    } catch {
      toast.error('Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, [search, filterSpec, activeTab]);

  const handleApprove = async (doctor) => {
    setActionLoading(true);
    try {
      await doctorService.approveReject(doctor.id, 'approve');
      toast.success(`Dr. ${doctor.full_name} approved!`);
      fetchDoctors();
    } catch { toast.error('Failed.'); }
    finally { setActionLoading(false); }
  };

  const handleRejectSubmit = async () => {
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {isHospitalAdmin ? 'Hospital Doctors' : 'Find Doctors'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isHospitalAdmin ? 'Manage doctors registered under your hospital' : 'Search and find specialist doctors'}
          </p>
        </div>
        {isDoctor && (
          <button onClick={() => navigate('/doctors/register')}
            className="px-4 py-2 text-xs font-medium text-white bg-teal-600
                       rounded-lg hover:bg-teal-700 transition-colors">
            + Register Profile
          </button>
        )}
      </div>

      {/* Hospital Admin Tabs */}
      {isHospitalAdmin && (
        <div className="flex gap-2 mb-5">
          {['all','pending'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {tab === 'all' ? 'All Doctors' : 'Pending Approval'}
            </button>
          ))}
        </div>
      )}

      {/* Search + Filter (public view) */}
      {!isHospitalAdmin && (
        <div className="flex gap-3 mb-5">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, specialization, hospital..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-teal-500"/>
          <select value={filterSpec} onChange={e => setFilterSpec(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">All Specializations</option>
            {['Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology',
              'Dermatology','Oncology','Psychiatry','ENT','Ophthalmology'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {/* Doctor List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 mx-auto mb-4 bg-teal-50 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">No doctors found</p>
          <p className="text-xs text-gray-400 mt-1">
            {isHospitalAdmin
              ? activeTab === 'pending' ? 'No pending doctor approvals.' : 'No doctors registered under your hospital yet.'
              : 'Try adjusting your search filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              showStatus={isHospitalAdmin}
              actions={isHospitalAdmin && activeTab === 'pending' && (
                <>
                  <button onClick={() => handleApprove(doctor)} disabled={actionLoading}
                    className="px-3 py-1 text-xs font-medium text-white bg-green-600
                               rounded-md hover:bg-green-700 disabled:opacity-50">
                    ✓ Approve
                  </button>
                  <button onClick={() => setRejectModal({ open: true, doctor })} disabled={actionLoading}
                    className="px-3 py-1 text-xs font-medium text-white bg-red-600
                               rounded-md hover:bg-red-700 disabled:opacity-50">
                    ✗ Reject
                  </button>
                </>
              )}
            />
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Reject Doctor</h3>
            <p className="text-xs text-gray-500 mb-4">
              Rejecting: <strong>Dr. {rejectModal.doctor?.full_name}</strong>
            </p>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                                  focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Reason for rejection..."/>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setRejectModal({ open: false, doctor: null }); setRejectReason(''); }}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={handleRejectSubmit} disabled={actionLoading}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg disabled:opacity-50">
                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorListPage;