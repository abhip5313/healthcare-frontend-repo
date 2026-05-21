import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import hospitalService from '../../services/hospitalService';
import HospitalStatusBadge from '../../components/hospitals/HospitalStatusBadge';
import { useAuth } from '../../context/AuthContext';

function HospitalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [hospital, setHospital]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [blacklistModal, setBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [unblacklistModal, setUnblacklistModal] = useState(false);

  const fetchHospital = async () => {
    try {
      const data = await hospitalService.getHospital(id);
      setHospital(data.data);
    } catch {
      toast.error('Hospital not found.');
      navigate('/hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospital(); }, [id]);

  const handleBlacklist = async () => {
    if (!blacklistReason.trim()) return toast.error('Blacklist reason required!');
    setActionLoading(true);
    try {
      await hospitalService.blacklistHospital(hospital.id, blacklistReason);
      toast.success(`"${hospital.hospital_name}" blacklisted!`);
      setBlacklistModal(false);
      setBlacklistReason('');
      fetchHospital();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to blacklist.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblacklist = async () => {
    setActionLoading(true);
    try {
      await hospitalService.unblacklistHospital(hospital.id);
      toast.success(`"${hospital.hospital_name}" unblacklisted!`);
      setUnblacklistModal(false);
      fetchHospital();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblacklist.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!hospital) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back + Actions row */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors">
          ← Back
        </button>

        {/* SuperAdmin blacklist/unblacklist button */}
        {isSuperAdmin && hospital.status === 'APPROVED' && (
          hospital.is_blacklisted ? (
            <button
              onClick={() => setUnblacklistModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white
                         bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              ✅ Unblacklist Hospital
            </button>
          ) : (
            <button
              onClick={() => { setBlacklistModal(true); setBlacklistReason(''); }}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white
                         bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              🚫 Blacklist Hospital
            </button>
          )
        )}
      </div>

      {/* Blacklisted banner */}
      {hospital.is_blacklisted && (
        <div className="bg-red-600 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-white font-bold text-sm">🚫 BLACKLISTED</span>
          {hospital.blacklist_reason && (
            <span className="text-red-100 text-xs">— {hospital.blacklist_reason}</span>
          )}
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            {hospital.logo_url
              ? <img src={hospital.logo_url} alt="logo" className="w-12 h-12 rounded-lg object-cover" />
              : <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">{hospital.hospital_name}</h1>
              <HospitalStatusBadge status={hospital.status} />
            </div>
            <p className="text-blue-200 text-xs mt-1">{hospital.hospital_type?.replace('_', '-')}</p>
            <p className="text-blue-100 text-xs mt-2">{hospital.description}</p>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Contact</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex gap-2"><span className="text-gray-400 w-20">Email:</span>{hospital.email}</div>
            <div className="flex gap-2"><span className="text-gray-400 w-20">Phone:</span>{hospital.phone_number}</div>
            {hospital.landline_number && <div className="flex gap-2"><span className="text-gray-400 w-20">Landline:</span>{hospital.landline_number}</div>}
            {hospital.emergency_contact && <div className="flex gap-2"><span className="text-gray-400 w-20">Emergency:</span>{hospital.emergency_contact}</div>}
            {hospital.website && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-20">Website:</span>
                <a href={hospital.website} target="_blank" rel="noreferrer"
                  className="text-blue-600 hover:underline truncate">{hospital.website}</a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Address</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <p>{hospital.address}</p>
            <p>{hospital.city}, {hospital.state} — {hospital.pincode}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
            <span className="text-gray-400">Reg. No: </span>{hospital.registration_number}
          </div>
        </div>
      </div>

      {hospital.specialties?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {hospital.specialties.map((s, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {hospital.documents?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-3 uppercase tracking-wide">Verification Documents</h3>
          <div className="space-y-2">
            {hospital.documents.map(doc => (
              <a key={doc.id} href={doc.document_file} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {doc.document_name}
              </a>
            ))}
          </div>
        </div>
      )}

      {hospital.status === 'REJECTED' && hospital.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-red-900 mb-1">Rejection Reason</h3>
          <p className="text-xs text-red-700">{hospital.rejection_reason}</p>
        </div>
      )}

      {/* ── Blacklist Modal ── */}
      {blacklistModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4">
              <h3 className="font-bold text-white text-sm">🚫 Blacklist Hospital</h3>
              <p className="text-red-200 text-xs mt-0.5">{hospital.hospital_name}</p>
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
                onClick={() => { setBlacklistModal(false); setBlacklistReason(''); }}
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

      {/* ── Unblacklist Modal ── */}
      {unblacklistModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <h3 className="font-bold text-white text-sm">✅ Unblacklist Hospital</h3>
              <p className="text-emerald-100 text-xs mt-0.5">{hospital.hospital_name}</p>
            </div>
            <div className="px-6 py-5 text-xs text-gray-600 space-y-2">
              <p className="font-medium text-gray-800">Unblacklisting करेल:</p>
              <ul className="space-y-1.5 pl-2">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Hospital admin account activate होईल</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />सर्व associated doctors activate होतील</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Restoration email जाईल</li>
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setUnblacklistModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUnblacklist}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg
                           hover:bg-emerald-700 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : '✅ Confirm Unblacklist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalDetailPage;