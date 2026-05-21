import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';

const DAYS_MAP = {
  MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0
};
const DAY_LABELS = {
  MON:'Monday', TUE:'Tuesday', WED:'Wednesday',
  THU:'Thursday', FRI:'Friday', SAT:'Saturday', SUN:'Sunday'
};

// Get next 14 days date list
function getNext14Days() {
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function BookAppointmentPage() {
  const { doctorId } = useParams();
  const navigate     = useNavigate();

  const [doctor, setDoctor]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason]       = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  const next14Days = getNext14Days();

  useEffect(() => {
    doctorService.getDoctor(doctorId)
      .then(data => setDoctor(data.data))
      .catch(() => { toast.error('Doctor not found.'); navigate('/search'); })
      .finally(() => setLoading(false));
  }, [doctorId]);

  // When date selected — find matching slots
  useEffect(() => {
    if (!selectedDate || !doctor?.slots) return;
    setSelectedSlot(null);

    const dayOfWeek = new Date(selectedDate).getDay(); // 0=Sun,1=Mon...
    const dayKeys   = Object.entries(DAYS_MAP)
      .filter(([, v]) => v === dayOfWeek)
      .map(([k]) => k);

    const matching = doctor.slots.filter(
      s => s.is_active && dayKeys.includes(s.day)
    );
    setAvailableSlots(matching);
  }, [selectedDate, doctor]);

  const handleSubmit = async () => {
    if (!selectedDate)       return toast.error('Please select a date.');
    if (!selectedSlot)       return toast.error('Please select a time slot.');
    if (!reason.trim())      return toast.error('Please enter reason for visit.');

    setSubmitting(true);
    try {
      await appointmentService.bookAppointment({
        doctor:           parseInt(doctorId),
        slot:             selectedSlot.id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot.start_time,
        reason,
      });
      toast.success('Appointment booked! Waiting for doctor confirmation.');
      navigate('/appointments');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat();
        msgs.forEach(m => toast.error(String(m)));
      } else {
        toast.error('Booking failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (!doctor) return null;

  // Block booking if doctor is on leave
  if (doctor.availability_status === 'ON_LEAVE') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600">
          ← Back
        </button>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">🔴</p>
          <h2 className="text-base font-bold text-red-800 mb-2">
            Dr. {doctor.full_name} is on Leave Today
          </h2>
          <p className="text-sm text-red-600 mb-4">
            This doctor is not available for appointments today.
            Please try booking for a future date or choose another doctor.
          </p>
          <button
            onClick={() => navigate(`/doctors/${doctorId}`)}
            className="px-5 py-2 text-sm font-medium text-white bg-red-500
                       rounded-lg hover:bg-red-600 transition-colors">
            ← Back to Doctor Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600">
        ← Back
      </button>

      {/* Doctor Card */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center
                          justify-center text-white font-bold text-xl flex-shrink-0">
            {doctor.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-base">Dr. {doctor.full_name}</h1>
            <p className="text-teal-200 text-xs mt-0.5">{doctor.specialization}</p>
            <p className="text-teal-200 text-xs">{doctor.hospital_name}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-teal-200 text-xs">Consultation Fee</p>
            <p className="text-white font-bold text-lg">
              ₹{Number(doctor.consultation_fee).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Step 1 — Select Date */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center
                           justify-center text-xs font-bold">1</span>
          Select Date
        </h2>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {next14Days.map((date, i) => {
            const dateStr  = date.toISOString().split('T')[0];
            const dayName  = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum   = date.getDate();
            const month    = date.toLocaleDateString('en-US', { month: 'short' });
            const isSelected = selectedDate === dateStr;
            const isToday    = i === 0;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl
                            text-xs font-medium transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-gray-50 text-gray-700 border-gray-100 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {dayName}
                </span>
                <span className="text-sm font-bold mt-0.5">{dayNum}</span>
                <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {month}
                </span>
                {isToday && (
                  <span className={`text-xs mt-0.5 ${
                    isSelected ? 'text-blue-100' : 'text-blue-500'
                  }`}>Today</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Select Time Slot */}
      {selectedDate && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center
                             justify-center text-xs font-bold">2</span>
            Select Time Slot
          </h2>

          {availableSlots.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-2">😔</p>
              <p className="text-xs font-medium text-gray-600">
                No slots available on this day
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Please select a different date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSlots.map(slot => {
                const isSelected = selectedSlot?.id === slot.id;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-medium
                                transition-all border ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-teal-400'
                    }`}
                  >
                    <span className="block">{DAY_LABELS[slot.day]}</span>
                    <span className="block font-bold mt-0.5">
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Reason */}
      {selectedSlot && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center
                             justify-center text-xs font-bold">3</span>
            Reason for Visit
          </h2>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Describe your symptoms or reason for consultation..."
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {/* Summary + Confirm */}
      {selectedDate && selectedSlot && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-blue-900">Booking Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
            <div>
              <span className="text-blue-500">Doctor:</span>
              <p className="font-medium">Dr. {doctor.full_name}</p>
            </div>
            <div>
              <span className="text-blue-500">Date:</span>
              <p className="font-medium">
                {new Date(selectedDate).toLocaleDateString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
            <div>
              <span className="text-blue-500">Time:</span>
              <p className="font-medium">
                {selectedSlot.start_time} – {selectedSlot.end_time}
              </p>
            </div>
            <div>
              <span className="text-blue-500">Fee:</span>
              <p className="font-medium text-teal-700">
                ₹{Number(doctor.consultation_fee).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="w-full py-3 text-sm font-semibold text-white bg-blue-600
                       rounded-xl hover:bg-blue-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Booking...
              </>
            ) : '📅 Confirm Appointment'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BookAppointmentPage;