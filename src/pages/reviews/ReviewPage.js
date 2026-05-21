import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import reviewService from '../../services/reviewService';
import doctorService from '../../services/doctorService';
import { StarRatingInput, StarRatingDisplay } from '../../components/reviews/StarRating';
import ReviewCard from '../../components/reviews/ReviewCard';
import { useAuth } from '../../context/AuthContext';

// ── Rating breakdown bar ──────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-4">{star}★</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-gray-400 w-6 text-right">{count}</span>
    </div>
  );
}

function ReviewPage() {
  const { id: doctorId } = useParams(); // Route uses :id — alias to doctorId
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const isPatient    = user?.role === 'PATIENT';

  const [doctor, setDoctor]   = useState(null);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [rating, setRating]         = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm]     = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [doctorRes, reviewRes] = await Promise.allSettled([
        doctorService.getDoctor(doctorId),
        reviewService.getDoctorReviews(doctorId),
      ]);

      if (doctorRes.status === 'fulfilled') {
        setDoctor(doctorRes.value.data);
      }

      if (reviewRes.status === 'fulfilled') {
        const data = reviewRes.value;
        setReviews(data.data || []);
        setSummary(data.summary);
        setMyReview(data.my_review);

        // Pre-fill form if already reviewed
        if (data.my_review) {
          setRating(data.my_review.rating);
          setReviewText(data.my_review.review || '');
          setIsAnonymous(data.my_review.is_anonymous);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating.');

    setSubmitting(true);
    try {
      await reviewService.submitDoctorReview({
        doctor:       parseInt(doctorId),
        rating,
        review:       reviewText,
        is_anonymous: isAnonymous,
      });
      toast.success(myReview ? 'Review updated!' : 'Review submitted!');
      setShowForm(false);
      fetchAll();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(String(m)))
        );
      } else {
        toast.error('Failed to submit review.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await reviewService.deleteDoctorReview(reviewId);
      toast.success('Review deleted.');
      fetchAll();
    } catch {
      toast.error('Failed to delete review.');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-yellow-400"
        fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Back buttons */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/doctors/${doctorId}`)}
          className="flex items-center gap-1.5 text-xs text-gray-500
                     hover:text-blue-600 transition-colors">
          ← Back to Doctor Profile
        </button>
        <span className="text-gray-300 text-xs">|</span>
        <button onClick={() => navigate('/appointments')}
          className="flex items-center gap-1.5 text-xs text-gray-500
                     hover:text-green-600 transition-colors">
          📋 My Appointments
        </button>
      </div>

      {/* Doctor header */}
      {doctor && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500
                        rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center
                            justify-center text-white font-bold text-xl">
              {doctor.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-base">Dr. {doctor.full_name}</h1>
              <p className="text-yellow-100 text-xs mt-0.5">
                {doctor.specialization}
              </p>
              <p className="text-yellow-200 text-xs">
                {doctor.hospital_name}
              </p>
            </div>
            {summary && (
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {summary.average_rating}
                </p>
                <StarRatingDisplay
                  rating={summary.average_rating}
                  size="sm"
                  showNumber={false}
                />
                <p className="text-yellow-200 text-xs mt-0.5">
                  {summary.total_reviews} review(s)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rating Summary */}
      {summary && summary.total_reviews > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Rating Summary
          </h2>
          <div className="flex items-start gap-6">
            {/* Big number */}
            <div className="text-center flex-shrink-0">
              <p className="text-5xl font-bold text-gray-900">
                {summary.average_rating}
              </p>
              <StarRatingDisplay
                rating={summary.average_rating}
                size="md"
                showNumber={false}
              />
              <p className="text-xs text-gray-400 mt-1">
                out of 5
              </p>
            </div>

            {/* Bars */}
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => (
                <RatingBar
                  key={star}
                  star={star}
                  count={summary.breakdown[star] || 0}
                  total={summary.total_reviews}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* My Existing Review */}
      {myReview && !showForm && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-yellow-800">
              ⭐ Your Review
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="px-3 py-1 text-xs font-medium text-blue-600
                           border border-blue-200 rounded-lg hover:bg-blue-50">
                Edit
              </button>
              <button
                onClick={() => handleDelete(myReview.id)}
                className="px-3 py-1 text-xs font-medium text-red-600
                           border border-red-200 rounded-lg hover:bg-red-50">
                Delete
              </button>
            </div>
          </div>
          <StarRatingDisplay rating={myReview.rating} size="sm" showNumber={false} />
          {myReview.review && (
            <p className="text-xs text-gray-700 mt-2">"{myReview.review}"</p>
          )}
        </div>
      )}

      {/* Write Review Form */}
      {isPatient && (!myReview || showForm) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            {myReview ? '✏️ Edit Your Review' : '⭐ Write a Review'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Your Rating *
              </label>
              <StarRatingInput
                value={rating}
                onChange={setRating}
                size="lg"
              />
            </div>

            {/* Review Text */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Your Review (optional)
              </label>
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                rows={3}
                placeholder="Share your experience with this doctor..."
                className="w-full px-3 py-2.5 text-sm border border-gray-300
                           rounded-lg focus:outline-none focus:ring-2
                           focus:ring-yellow-400 resize-none"
              />
            </div>

            {/* Anonymous toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-yellow-500 rounded border-gray-300
                           focus:ring-yellow-400"
              />
              <label htmlFor="anonymous"
                className="text-xs text-gray-600 cursor-pointer">
                Post as anonymous
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 text-xs font-medium text-gray-600
                             bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="flex-1 py-2.5 text-xs font-medium text-white
                           bg-yellow-500 rounded-lg hover:bg-yellow-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  myReview ? '✏️ Update Review' : '⭐ Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            All Reviews ({reviews.length})
          </h2>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl
                          border border-gray-100">
            <p className="text-3xl mb-2">⭐</p>
            <p className="text-sm font-medium text-gray-600">
              No reviews yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Be the first to review Dr. {doctor?.full_name}
            </p>
          </div>
        ) : (
          reviews.map(review => (
            <ReviewCard
              key={review.id}
              review={review}
              canDelete={myReview?.id === review.id}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ReviewPage;