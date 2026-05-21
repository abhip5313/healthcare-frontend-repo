import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import prescriptionService from '../../services/prescriptionService';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';

function PrescriptionListPage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isDoctor  = user?.role === 'DOCTOR';

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [chatLoading, setChatLoading]     = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = isDoctor
          ? await prescriptionService.getDoctorPrescriptions()
          : await prescriptionService.getMyPrescriptions();
        setPrescriptions(data.data || []);
      } catch {
        toast.error('Failed to load prescriptions.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isDoctor]);

  const handleChat = async (e, rx) => {
    e.stopPropagation();
    setChatLoading(rx.id);
    try {
      let res;
      if (isDoctor) {
        res = await chatService.getOrCreateRoom({ patient_user_id: rx.patient_user_id });
      } else {
        res = await chatService.getOrCreateRoom({ doctor_user_id: rx.doctor_user_id });
      }
      navigate(`/chat/${res.room_id}`, {
        state: {
          prescription: {
            id: rx.id,
            diagnosis: rx.diagnosis,
            created_at: rx.created_at,
          },
          otherUser: isDoctor
            ? { name: rx.patient_name, role: 'PATIENT' }
            : { name: rx.doctor_name, role: 'DOCTOR' },
        }
      });
    } catch (err) {
      console.error('Chat error full:', err);
      console.error('Chat error response:', err?.response?.data);
      console.error('rx object:', rx);
      toast.error(err?.response?.data?.message || err?.message || 'Could not open chat.');
    } finally {
      setChatLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            {isDoctor ? 'Prescriptions Written' : 'My Prescriptions'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDoctor
              ? 'Prescriptions you have written for patients'
              : 'View and download your prescriptions'}
          </p>
        </div>
        {isDoctor && (
          <button
            onClick={() => navigate('/prescriptions/create')}
            className="px-4 py-2 text-xs font-medium text-white bg-teal-600
                       rounded-lg hover:bg-teal-700 transition-colors">
            + Write Prescription
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-3">💊</p>
          <p className="text-sm font-medium text-gray-600">No prescriptions found</p>
          <p className="text-xs text-gray-400 mt-1">
            {isDoctor
              ? 'Write a prescription for a patient after consultation.'
              : 'Your doctor will add prescriptions after your appointment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map(rx => (
            <div key={rx.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4
                         hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/prescriptions/${rx.id}`)}>
                  {/* Header row */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💊</span>
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {isDoctor ? rx.patient_name : rx.doctor_name}
                    </h3>
                  </div>

                  {/* Diagnosis */}
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-400">Diagnosis: </span>
                    {rx.diagnosis}
                  </p>

                  {/* Hospital */}
                  {rx.hospital_name && (
                    <p className="text-xs text-gray-400">🏥 {rx.hospital_name}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>💊 {rx.medicine_count} medicine(s)</span>
                    <span>📅 {new Date(rx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}</span>
                    {rx.follow_up_date && (
                      <span className="text-orange-500">
                        🔄 Follow-up: {new Date(rx.follow_up_date).toLocaleDateString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side — Chat button + Arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleChat(e, rx);
                    }}
                    disabled={chatLoading === rx.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium
                               text-teal-600 border border-teal-200 rounded-lg
                               hover:bg-teal-50 transition-colors disabled:opacity-50"
                    title="Chat about this prescription">
                    {chatLoading === rx.id ? (
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : '💬'}
                    <span>Chat</span>
                  </button>

                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/prescriptions/${rx.id}`)}>
                    <svg className="w-4 h-4 text-gray-300"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PrescriptionListPage;