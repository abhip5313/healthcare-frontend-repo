import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import prescriptionService from '../../services/prescriptionService';

function PrescriptionDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [rx, setRx]               = useState(null);
  const [loading, setLoading]     = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    prescriptionService.getPrescription(id)
      .then(data => setRx(data.data))
      .catch(() => {
        toast.error('Prescription not found.');
        navigate('/prescriptions');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── PDF Download Handler ─────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const token    = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:8000/api/v1/prescriptions/${id}/download-pdf/`,
        {
          method:  'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('PDF download failed.');
      }

      const blob     = await response.blob();
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `prescription-RX-${String(id).padStart(4,'0')}-${rx?.patient_name?.replace(/\s+/g,'_') || 'patient'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Prescription PDF downloaded!');
    } catch (err) {
      toast.error('PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center py-24">
      <svg className="animate-spin w-8 h-8 text-teal-500"
        fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (!rx) return null;

  return (
    <div className="max-w-xl mx-auto space-y-4">

      {/* Back */}
      <button onClick={() => navigate('/prescriptions')}
        className="flex items-center gap-1.5 text-xs text-gray-500
                   hover:text-teal-600 transition-colors">
        ← Back to Prescriptions
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900
                      rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💊</span>
            <div>
              <h1 className="font-bold text-base">Prescription</h1>
              <p className="text-teal-200 text-xs mt-0.5">
                {new Date(rx.created_at).toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric',
                  month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
          {/* RX ID Badge */}
          <div className="bg-white/20 rounded-lg px-3 py-1.5 text-right">
            <p className="text-xs text-teal-200">Prescription ID</p>
            <p className="text-sm font-bold text-white">
              RX-{String(rx.id).padStart(4,'0')}
            </p>
          </div>
        </div>
      </div>

      {/* Doctor + Patient Info */}
      <div className="grid grid-cols-2 gap-3">
        {/* Doctor */}
        <div className="bg-blue-50 border border-blue-100
                        rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-blue-500 mb-2
                        uppercase tracking-wide">
            👨‍⚕️ Doctor
          </p>
          <p className="text-sm font-bold text-gray-900">
            {rx.doctor_name}
          </p>
          <p className="text-xs text-teal-600 font-medium mt-0.5">
            {rx.doctor_specialization}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            🏥 {rx.hospital_name || 'N/A'}
          </p>
        </div>

        {/* Patient */}
        <div className="bg-green-50 border border-green-100
                        rounded-xl shadow-sm p-4">
          <p className="text-xs font-semibold text-green-500 mb-2
                        uppercase tracking-wide">
            🧑 Patient
          </p>
          <p className="text-sm font-bold text-gray-900">
            {rx.patient_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            📞 {rx.patient_phone || 'N/A'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            ✉️ {rx.patient_email}
          </p>
        </div>
      </div>

      {/* Diagnosis */}
      <div className="bg-white rounded-xl border border-gray-100
                      shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500
                       uppercase tracking-wide mb-2">
          🔍 Diagnosis
        </h3>
        <p className="text-sm font-medium text-gray-800">
          {rx.diagnosis}
        </p>
      </div>

      {/* Medicines */}
      <div className="bg-white rounded-xl border border-gray-100
                      shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500
                       uppercase tracking-wide mb-3">
          💊 Medicines Prescribed ({rx.medicines?.length || 0})
        </h3>
        <div className="space-y-2.5">
          {rx.medicines?.map((med, i) => (
            <div key={i}
              className="flex items-start gap-3 p-3 bg-teal-50
                         border border-teal-100 rounded-lg">
              {/* Number badge */}
              <div className="w-6 h-6 bg-teal-600 rounded-full
                              flex items-center justify-center
                              text-white text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {med.name}
                </p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                  <span className="bg-white border border-teal-100
                                   px-2 py-0.5 rounded-full">
                    💊 {med.dosage}
                  </span>
                  <span className="bg-white border border-teal-100
                                   px-2 py-0.5 rounded-full">
                    ⏱ {med.duration}
                  </span>
                </div>
                {med.instructions && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    📝 {med.instructions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* General Instructions */}
      {rx.instructions && (
        <div className="bg-white rounded-xl border border-gray-100
                        shadow-sm p-4">
          <h3 className="text-xs font-semibold text-gray-500
                         uppercase tracking-wide mb-2">
            📋 General Instructions
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {rx.instructions}
          </p>
        </div>
      )}

      {/* Follow-up Date */}
      {rx.follow_up_date && (
        <div className="bg-orange-50 border border-orange-200
                        rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">🔄</span>
          <div>
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              Follow-up Date
            </p>
            <p className="text-sm font-bold text-orange-800 mt-0.5">
              {new Date(rx.follow_up_date).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric',
                month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        </div>
      )}

      {/* ── Download PDF Button ── */}
      <div className="pb-6">
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="flex items-center justify-center gap-2 w-full py-3.5
                     text-sm font-semibold text-white bg-teal-600 rounded-xl
                     hover:bg-teal-700 active:bg-teal-800 transition-colors
                     disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
        >
          {pdfLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                     a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Download Prescription PDF
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-2">
          PDF includes doctor signature, patient details & all medicines
        </p>
      </div>

    </div>
  );
}

export default PrescriptionDetailPage;