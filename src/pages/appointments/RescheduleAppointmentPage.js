import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import appointmentService from '../../services/appointmentService';

/**
 * RescheduleAppointmentPage
 * Route: /appointments/:id/reschedule
 *
 * Patient नवीन date/time निवडतो.
 * Backend: POST /appointments/:id/reschedule/
 * → appointment PENDING वर reset होतो, doctor ला notification जातो.
 */
function RescheduleAppointmentPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [appt, setAppt]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    appointment_date: '',
    appointment_time: '',
  });

  useEffect(() => {
    appointmentService.getAppointment(id)
      .then(data => setAppt(data.data))
      .catch(() => { toast.error('Appointment सापडली नाही.'); navigate('/appointments'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.appointment_date || !form.appointment_time) {
      toast.error('Date आणि Time निवडा.');
      return;
    }

    // Validate: future date only
    const selected = new Date(`${form.appointment_date}T${form.appointment_time}`);
    if (selected <= new Date()) {
      toast.error('Future date/time निवडा.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.reschedule(id, form.appointment_date, form.appointment_time);
      toast.success('Appointment reschedule झाली! Doctor confirm करेल.');
      navigate(`/appointments/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reschedule failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Min date = today + 1 day
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  if (loading) return (
    <div className="flex justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-5">

      <button onClick={() => navigate(`/appointments/${id}`)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600">
        ← Back
      </button>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Appointment Reschedule करा</h1>
          {appt && (
            <p className="text-xs text-gray-500 mt-1">
              सध्याची date:{' '}
              <span className="font-medium text-gray-700">
                {new Date(appt.appointment_date).toLocaleDateString('en-IN')} at {appt.appointment_time}
              </span>
            </p>
          )}
        </div>

        {/* Info box */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
          <p className="font-medium mb-0.5">⚠️ लक्षात ठेवा:</p>
          <p>Reschedule केल्यावर appointment PENDING वर जाईल. Doctor ला पुन्हा confirm करावे लागेल.</p>
        </div>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              नवीन Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              min={minDateStr}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              नवीन Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="appointment_time"
              value={form.appointment_time}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/appointments/${id}`)}
            className="flex-1 py-2.5 text-xs font-medium text-gray-600
                       border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.appointment_date || !form.appointment_time}
            className="flex-1 py-2.5 text-xs font-medium text-white bg-orange-500
                       rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Rescheduling...' : '📆 Reschedule Confirm करा'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RescheduleAppointmentPage;