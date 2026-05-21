import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import hospitalService from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import HospitalStatusBadge from '../../components/hospitals/HospitalStatusBadge';
import { useAuth } from '../../context/AuthContext';

function HospitalListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin    = user?.role === 'SUPER_ADMIN';
  const isHospitalAdmin = user?.role === 'HOSPITAL_ADMIN';

  const [hospitals, setHospitals]     = useState([]);
  const [myHospital, setMyHospital]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  // URL ?tab= param se default tab set hota hai (e.g. Approvals link ?tab=pending)
  const urlTab = new URLSearchParams(location.search).get('tab') || 'all';
  const [activeTab, setActiveTab]     = useState(urlTab);

  // URL ?tab= बदलल्यावर activeTab sync करा (e.g. /admin/approvals redirect)
  useEffect(() => { setActiveTab(urlTab); }, [urlTab]);
  const [rejectModal, setRejectModal] = useState({ open: false, hospital: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [blacklistModal, setBlacklistModal] = useState({ open: false, hospital: null });
  const [blacklistReason, setBlacklistReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isHospitalAdmin) {
        try {
          const data = await hospitalService.getMyHospital();
          setMyHospital(data.data);
        } catch (err) {
          if (err.response?.status === 404) setMyHospital(null);
        }
      } else if (isSuperAdmin) {
        // Super Admin — सर्व hospitals fetch करतो (backend super admin ला all देतो)
        // page_size=1000 देतो जेणेकरून सगळे एकत्र येतात (pagination bypass)
        const data = await hospitalService.listHospitals({ page_size: 1000 });
        // paginated response: { results: [...] }  OR  non-paginated: { data: [...] }
        setHospitals(data.data || data.results || []);
      } else {
        const params = {};
        if (search)     params.search        = search;
        if (filterType) params.hospital_type = filterType;
        const data = await hospitalService.listHospitals(params);
        setHospitals(data.data || data.results || []);
      }
    } catch {
      toast.error('Failed to load hospital data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, filterType, user?.role]);

  const handleApprove = async (hospital) => {
    setActionLoading(true);
    try {
      await hospitalService.approveReject(hospital.id, 'approve');
      toast.success(`${hospital.hospital_name} approved!`);
      fetchData();
    } catch {
      toast.error('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) return toast.error('Rejection reason is required.');
    setActionLoading(true);
    try {
      await hospitalService.approveReject(rejectModal.hospital.id, 'reject', rejectReason);
      toast.success(`${rejectModal.hospital.hospital_name} rejected.`);
      setRejectModal({ open: false, hospital: null });
      setRejectReason('');
      fetchData();
    } catch {
      toast.error('Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlacklist = async () => {
    if (!blacklistReason.trim()) return toast.error('Blacklist reason required!');
    setActionLoading(true);
    try {
      await hospitalService.blacklistHospital(blacklistModal.hospital.id, blacklistReason);
      toast.success(`"${blacklistModal.hospital.hospital_name}" blacklisted!`);
      setBlacklistModal({ open: false, hospital: null });
      setBlacklistReason('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to blacklist.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // HOSPITAL ADMIN VIEW
  // ══════════════════════════════════════════════════════════════════════
  if (isHospitalAdmin) {
    if (!myHospital) {
      return (
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full
                          flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5
                   M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-2">
            No Hospital Registered Yet
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Register your hospital to get started. It will be reviewed by the Super Admin.
          </p>
          <button
            onClick={() => navigate('/hospital/register')}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Register Hospital
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Hospital</h1>
            <p className="text-xs text-gray-500 mt-0.5">Your hospital registration details</p>
          </div>
          <HospitalStatusBadge status={myHospital.status} />
        </div>

        {myHospital.status === 'PENDING' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3
                          flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-yellow-800">
              Your hospital is <strong>pending approval</strong> from the Super Admin.
              You'll be notified once approved.
            </p>
          </div>
        )}

        {myHospital.status === 'APPROVED' && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3
                          flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none"
              stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-xs text-green-800">
              Your hospital is <strong>approved</strong> and live on the platform!
            </p>
          </div>
        )}

        {myHospital.status === 'REJECTED' && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-red-800 mb-1">Hospital Rejected</p>
            <p className="text-xs text-red-700">
              {myHospital.rejection_reason || 'Please contact support for details.'}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-5 py-4 text-white">
            <h2 className="font-bold text-base">{myHospital.hospital_name}</h2>
            <p className="text-blue-200 text-xs mt-0.5">
              {myHospital.hospital_type?.replace('_', '-')}
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <p className="font-semibold text-gray-700 uppercase tracking-wide text-xs">Contact</p>
              <div className="text-gray-600 space-y-1.5">
                <p><span className="text-gray-400 w-16 inline-block">Email:</span>{myHospital.email}</p>
                <p><span className="text-gray-400 w-16 inline-block">Phone:</span>{myHospital.phone_number}</p>
                {myHospital.emergency_contact && (
                  <p><span className="text-gray-400 w-16 inline-block">Emergency:</span>{myHospital.emergency_contact}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-700 uppercase tracking-wide text-xs">Address</p>
              <div className="text-gray-600 space-y-1.5">
                <p>{myHospital.address}</p>
                <p>{myHospital.city}, {myHospital.state} — {myHospital.pincode}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-2">Registration No.</p>
              <p className="text-gray-600">{myHospital.registration_number}</p>
            </div>
            {myHospital.specialties?.length > 0 && (
              <div>
                <p className="font-semibold text-gray-700 uppercase tracking-wide text-xs mb-2">Specialties</p>
                <div className="flex flex-wrap gap-1.5">
                  {myHospital.specialties.map((s, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-2.5 py-0.5
                                 rounded-full text-xs border border-blue-100">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => navigate(`/hospitals/${myHospital.id}`)}
              className="px-4 py-1.5 text-xs font-medium text-blue-600 border
                         border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // SUPER ADMIN VIEW — सर्व hospitals with tabs
  // ══════════════════════════════════════════════════════════════════════
  if (isSuperAdmin) {
    // Tab नुसार filter
    const filteredHospitals = hospitals.filter(h => {
      const matchSearch = !search ||
        h.hospital_name?.toLowerCase().includes(search.toLowerCase()) ||
        h.city?.toLowerCase().includes(search.toLowerCase());
      const matchTab =
        activeTab === 'all'      ? true :
        activeTab === 'pending'  ? h.status === 'PENDING' :
        activeTab === 'approved' ? h.status === 'APPROVED' :
        activeTab === 'rejected' ? h.status === 'REJECTED' : true;
      return matchSearch && matchTab;
    });

    const pendingCount  = hospitals.filter(h => h.status === 'PENDING').length;
    const approvedCount = hospitals.filter(h => h.status === 'APPROVED').length;
    const rejectedCount = hospitals.filter(h => h.status === 'REJECTED').length;

    const tabs = [
      { id: 'all',      label: 'All',      count: hospitals.length, color: 'gray'   },
      { id: 'pending',  label: 'Pending',  count: pendingCount,     color: 'yellow' },
      { id: 'approved', label: 'Approved', count: approvedCount,    color: 'green'  },
      { id: 'rejected', label: 'Rejected', count: rejectedCount,    color: 'red'    },
    ];

    return (
      <div>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-lg font-bold text-gray-900">Hospital Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage all hospitals — approve, reject, or view details
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{hospitals.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-yellow-100 p-3 text-center">
            <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-green-100 p-3 text-center">
            <p className="text-xl font-bold text-green-600">{approvedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Approved</p>
          </div>
          <div className="bg-white rounded-xl border border-red-100 p-3 text-center">
            <p className="text-xl font-bold text-red-500">{rejectedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Rejected</p>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by hospital name or city..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
          />
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                            transition-colors border
                  ${activeTab === tab.id
                    ? tab.color === 'yellow' ? 'bg-yellow-500 text-white border-yellow-500'
                    : tab.color === 'green'  ? 'bg-green-600 text-white border-green-600'
                    : tab.color === 'red'    ? 'bg-red-600 text-white border-red-600'
                    :                          'bg-gray-800 text-white border-gray-800'
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

        {/* Hospital Cards */}
        {filteredHospitals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-full
                            flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none"
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              {activeTab === 'pending'  ? 'No pending hospitals!' :
               activeTab === 'approved' ? 'No approved hospitals yet.' :
               activeTab === 'rejected' ? 'No rejected hospitals.' :
               'No hospitals found.'}
            </p>
            {activeTab === 'pending' && (
              <p className="text-xs text-gray-400 mt-1">All caught up — no hospitals awaiting review.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHospitals.map(hospital => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                showStatus={true}
                actions={
                  hospital.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApprove(hospital)}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs font-medium text-white
                                   bg-green-600 rounded-md hover:bg-green-700
                                   transition-colors disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setRejectModal({ open: true, hospital })}
                        disabled={actionLoading}
                        className="px-3 py-1 text-xs font-medium text-white
                                   bg-red-600 rounded-md hover:bg-red-700
                                   transition-colors disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/hospitals/${hospital.id}`)}
                        className="px-3 py-1 text-xs font-medium text-gray-600
                                   border border-gray-200 rounded-md hover:bg-gray-50
                                   transition-colors"
                      >
                        View Details
                      </button>
                      {hospital.status === 'APPROVED' && !hospital.is_blacklisted && (
                        <button
                          onClick={() => { setBlacklistModal({ open: true, hospital }); setBlacklistReason(''); }}
                          disabled={actionLoading}
                          className="px-3 py-1 text-xs font-medium text-white
                                     bg-red-600 rounded-md hover:bg-red-700
                                     transition-colors disabled:opacity-50"
                        >
                          🚫 Blacklist
                        </button>
                      )}
                      {hospital.is_blacklisted && (
                        <span className="px-3 py-1 text-xs font-medium text-red-600
                                         border border-red-200 rounded-md bg-red-50">
                          Blacklisted
                        </span>
                      )}
                    </div>
                  )
                }
              />
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center
                          justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Reject Hospital</h3>
              <p className="text-xs text-gray-500 mb-4">
                Rejecting: <strong>{rejectModal.hospital?.hospital_name}</strong>
              </p>
              <label className="block text-xs font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300
                           rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="Explain why this hospital is being rejected..."
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setRejectModal({ open: false, hospital: null }); setRejectReason(''); }}
                  className="px-4 py-2 text-xs font-medium text-gray-600
                             bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-medium text-white
                             bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blacklist Modal */}
        {blacklistModal.open && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4">
                <h3 className="font-bold text-white text-sm">🚫 Blacklist Hospital</h3>
                <p className="text-red-200 text-xs mt-0.5">
                  {blacklistModal.hospital?.hospital_name}
                </p>
              </div>
              <div className="px-6 py-5">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-amber-800">
                  ⚠️ Hospital admin + सर्व doctors deactivate होतील. Warning email पाठवला जाईल.
                </div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Blacklist Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blacklistReason}
                  onChange={e => setBlacklistReason(e.target.value)}
                  rows={4}
                  placeholder="Reason for blacklisting (e.g., fraudulent activity, license violation)..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => { setBlacklistModal({ open: false, hospital: null }); setBlacklistReason(''); }}
                  className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlacklist}
                  disabled={actionLoading || !blacklistReason.trim()}
                  className="px-5 py-2 text-xs font-medium text-white bg-red-600 rounded-lg
                             hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Blacklisting...' : '🚫 Confirm Blacklist'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // PATIENT / DOCTOR VIEW
  // ══════════════════════════════════════════════════════════════════════
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Hospitals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Browse approved hospitals on the platform</p>
        </div>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, city..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="GENERAL">General</option>
          <option value="MULTI_SPECIALTY">Multi-Speciality</option>
          <option value="CLINIC">Clinic</option>
          <option value="DIAGNOSTIC">Diagnostic</option>
        </select>
      </div>

      {hospitals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm font-medium text-gray-600">No hospitals found</p>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.map(hospital => (
            <HospitalCard key={hospital.id} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HospitalListPage;