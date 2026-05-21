import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';
import reviewService from '../../services/reviewService';
import DoctorStatusBadge from '../../components/doctors/DoctorStatusBadge';
import { StarRatingDisplay } from '../../components/reviews/StarRating';
import ReviewCard from '../../components/reviews/ReviewCard';
import { useAuth } from '../../context/AuthContext';

const DAYS = {
  MON:'Monday', TUE:'Tuesday', WED:'Wednesday',
  THU:'Thursday', FRI:'Friday', SAT:'Saturday', SUN:'Sunday'
};

function DoctorDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPatient = user?.role === 'PATIENT';

  const [doctor, setDoctor]     = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [docRes, revRes] = await Promise.allSettled([
          doctorService.getDoctor(id),
          reviewService.getDoctorReviews(id),
        ]);
        if (docRes.status === 'fulfilled') setDoctor(docRes.value.data);
        if (revRes.status === 'fulfilled') {
          setReviews(revRes.value.data || []);
          setSummary(revRes.value.summary);
        }
      } catch {
        toast.error('Doctor not found.');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-teal-500"
        fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (!doctor) return null;

  const initials = doctor.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-gray-500
                   hover:text-teal-600">
        ← Back
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900
                      rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center
                          justify-center text-white font-bold text-xl
                          flex-shrink-0 overflow-hidden">
            {doctor.profile_photo_url
              ? <img src={doctor.profile_photo_url} alt="photo"
                  className="w-16 h-16 object-cover"/>
              : initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold">Dr. {doctor.full_name}</h1>
              <DoctorStatusBadge status={doctor.availability_status} />
            </div>
            <p className="text-teal-200 text-xs mt-0.5">
              {doctor.specialization}
            </p>
            <p className="text-teal-100 text-xs">{doctor.qualification}</p>
            {/* Rating */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <StarRatingDisplay
                rating={doctor.average_rating || 0}
                size="sm"
                showNumber={false}
              />
              <span className="text-xs text-teal-200">
                {Number(doctor.average_rating).toFixed(1)}
                ({doctor.total_reviews} reviews)
              </span>
            </div>
          </div>
        </div>
        {doctor.bio && (
          <p className="text-teal-100 text-xs mt-4 leading-relaxed">
            {doctor.bio}
          </p>
        )}
      </div>

      {/* ON_LEAVE Banner */}
      {doctor.availability_status === 'ON_LEAVE' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
                        flex items-center gap-3">
          <span className="text-2xl">🔴</span>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Doctor is on Leave Today
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              This doctor is not available today. You can check back tomorrow or book for a future date.
            </p>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Experience',   value: `${doctor.experience_years} yrs` },
          { label: 'Consult Fee',  value: `₹${Number(doctor.consultation_fee).toLocaleString()}` },
          { label: 'Rating',       value: `${Number(doctor.average_rating).toFixed(1)} ⭐` },
          { label: 'Reviews',      value: doctor.total_reviews },
        ].map(item => (
          <div key={item.label}
            className="bg-white rounded-xl border border-gray-100
                       shadow-sm p-3 text-center">
            <p className="text-sm font-bold text-teal-700">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Hospital */}
      {doctor.hospital_name && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500
                         uppercase tracking-wide mb-2">Hospital</h3>
          <p className="text-sm font-medium text-gray-900">
            🏥 {doctor.hospital_name}
          </p>
          {doctor.hospital_city && (
            <p className="text-xs text-gray-400 mt-0.5">
              📍 {doctor.hospital_city}
            </p>
          )}
        </div>
      )}

      {/* Slots */}
      {doctor.slots?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500
                         uppercase tracking-wide mb-3">
            Available Slots
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {doctor.slots.filter(s => s.is_active).map(slot => (
              <div key={slot.id}
                className="flex items-center justify-between bg-teal-50
                           border border-teal-100 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-teal-800">
                  {DAYS[slot.day] || slot.day}
                </span>
                <span className="text-xs text-teal-600">
                  {slot.start_time} – {slot.end_time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Preview */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Reviews
            </h3>
            {summary && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRatingDisplay
                  rating={summary.average_rating}
                  size="sm"
                  showNumber={false}
                />
                <span className="text-xs text-gray-500">
                  {summary.average_rating} · {summary.total_reviews} review(s)
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate(`/doctors/${id}/reviews`)}
            className="px-3 py-1.5 text-xs font-medium text-yellow-600
                       border border-yellow-200 rounded-lg hover:bg-yellow-50
                       transition-colors">
            {isPatient ? '⭐ Rate & Review' : 'See All →'}
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            No reviews yet. Be the first to review!
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 2).map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
            {reviews.length > 2 && (
              <button
                onClick={() => navigate(`/doctors/${id}/reviews`)}
                className="w-full text-xs text-blue-600 hover:text-blue-700
                           font-medium py-2 text-center">
                View all {reviews.length} reviews →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pb-6">
        {isPatient && (
          <>
            {doctor.availability_status === 'ON_LEAVE' ? (
              <div className="flex-1 py-3 text-sm font-semibold text-center
                           text-red-500 bg-red-50 border-2 border-red-200
                           rounded-xl cursor-not-allowed">
                🔴 Not Available — On Leave
              </div>
            ) : (
              <button
                onClick={() => navigate(`/appointments/book/${doctor.id}`)}
                className="flex-1 py-3 text-sm font-semibold text-white
                           bg-teal-600 rounded-xl hover:bg-teal-700
                           transition-colors">
                📅 Book Appointment
              </button>
            )}
            <button
              onClick={() => navigate(`/doctors/${id}/reviews`)}
              className="px-5 py-3 text-sm font-semibold text-yellow-600
                         border-2 border-yellow-400 rounded-xl
                         hover:bg-yellow-50 transition-colors">
              ⭐ Review
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default DoctorDetailPage;