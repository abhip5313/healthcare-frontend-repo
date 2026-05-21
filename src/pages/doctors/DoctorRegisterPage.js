import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';
import hospitalService from '../../services/hospitalService';

const SPECIALIZATIONS = [
  'Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology',
  'Dermatology','Oncology','Psychiatry','Radiology','ENT',
  'Ophthalmology','Urology','Nephrology','Gastroenterology',
  'Pulmonology','General Medicine','Surgery','Emergency Medicine',
];

function DoctorRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(false);
  const [hospitals, setHospitals]   = useState([]);
  const [hospLoading, setHospLoading] = useState(true);
  const [photoFile, setPhotoFile]   = useState(null);
  const [form, setForm] = useState({
    hospital: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    license_number: '',
    consultation_fee: '',
    bio: '',
  });

  // ── Fetch approved hospitals ──────────────────────────────────────────
  useEffect(() => {
    const fetchHospitals = async () => {
      setHospLoading(true);
      try {
        // Direct API call with axios
        const response = await hospitalService.listHospitals();
        console.log('Hospital API response:', response); // debug

        // Handle both paginated and non-paginated responses
        let list = [];
        if (Array.isArray(response)) {
          list = response;
        } else if (response.data && Array.isArray(response.data)) {
          list = response.data;
        } else if (response.results && Array.isArray(response.results)) {
          list = response.results;
        }

        // Filter only APPROVED (just in case)
        const approved = list.filter(h => h.status === 'APPROVED');
        setHospitals(approved.length > 0 ? approved : list);

        if (list.length === 0) {
          toast.error('No approved hospitals found. Please contact Super Admin.');
        }
      } catch (err) {
        console.error('Hospital fetch failed:', err);
        toast.error('Could not load hospitals list.');
      } finally {
        setHospLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospital) return toast.error('Please select a hospital.');
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (photoFile) formData.append('profile_photo', photoFile);
      await doctorService.registerDoctor(formData);
      toast.success('Doctor profile registered! Awaiting hospital admin approval.');
      navigate('/doctors/my-profile');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(String(m)))
        );
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-teal-500`;
  const lbl = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Register as a Doctor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in your professional details. Awaiting hospital admin approval after submit.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 mb-6
                      flex items-center gap-3">
        <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none"
          stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-xs text-teal-800">
          Only <strong>approved hospitals</strong> are shown in the dropdown below.
          Hospital must be approved by Super Admin first.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Professional Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2
                         border-b border-gray-100">
            Professional Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Specialization *</label>
              <select name="specialization" value={form.specialization}
                onChange={handleChange} required className={inp}>
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={lbl}>License Number *</label>
              <input name="license_number" value={form.license_number}
                onChange={handleChange} required className={inp}
                placeholder="MCI-12345-2020"/>
            </div>

            <div className="sm:col-span-2">
              <label className={lbl}>Qualification *</label>
              <input name="qualification" value={form.qualification}
                onChange={handleChange} required className={inp}
                placeholder="MBBS, MD Cardiology — AIIMS Delhi"/>
            </div>

            <div>
              <label className={lbl}>Experience (Years) *</label>
              <input type="number" name="experience_years"
                value={form.experience_years}
                onChange={handleChange} required min="0" max="60"
                className={inp} placeholder="5"/>
            </div>

            <div>
              <label className={lbl}>Consultation Fee (₹) *</label>
              <input type="number" name="consultation_fee"
                value={form.consultation_fee}
                onChange={handleChange} required min="0"
                className={inp} placeholder="500"/>
            </div>

            <div className="sm:col-span-2">
              <label className={lbl}>Bio</label>
              <textarea name="bio" value={form.bio}
                onChange={handleChange} rows={3} className={inp}
                placeholder="Brief professional summary..."/>
            </div>
          </div>
        </div>

        {/* Hospital Selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2
                         border-b border-gray-100">
            Select Hospital *
          </h2>

          {hospLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
              <svg className="animate-spin w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading hospitals...
            </div>
          ) : hospitals.length === 0 ? (
            /* No approved hospitals */
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-red-800 mb-1">
                ⚠️ No Approved Hospitals Found
              </p>
              <p className="text-xs text-red-700 mb-3">
                A hospital must be registered and approved by the Super Admin
                before doctors can register under it.
              </p>
              <div className="space-y-1 text-xs text-red-600">
                <p>Steps to fix:</p>
                <p>1. Hospital Admin → Register Hospital</p>
                <p>2. Super Admin → Approve Hospital</p>
                <p>3. Then come back here to register</p>
              </div>
            </div>
          ) : (
            /* Hospital dropdown */
            <div className="space-y-3">
              <select name="hospital" value={form.hospital}
                onChange={handleChange} required className={inp}>
                <option value="">-- Select your hospital --</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.hospital_name} — {h.city}, {h.state}
                  </option>
                ))}
              </select>

              {/* Show selected hospital info */}
              {form.hospital && (() => {
                const selected = hospitals.find(h => String(h.id) === String(form.hospital));
                return selected ? (
                  <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-teal-800">
                      {selected.hospital_name}
                    </p>
                    <p className="text-xs text-teal-600 mt-0.5">
                      📍 {selected.city}, {selected.state} &nbsp;|&nbsp;
                      🏥 {selected.hospital_type?.replace('_', '-')}
                    </p>
                    {selected.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selected.specialties.slice(0, 4).map((s, i) => (
                          <span key={i} className="bg-teal-100 text-teal-700
                                                   text-xs px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              <p className="text-xs text-gray-400">
                {hospitals.length} approved hospital(s) available
              </p>
            </div>
          )}
        </div>

        {/* Profile Photo */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2
                         border-b border-gray-100">
            Profile Photo
          </h2>
          <input type="file" accept="image/*"
            onChange={e => setPhotoFile(e.target.files[0])}
            className="w-full text-xs text-gray-600
                       file:mr-3 file:py-1.5 file:px-3 file:rounded-md
                       file:border-0 file:text-xs file:font-medium
                       file:bg-teal-50 file:text-teal-700
                       hover:file:bg-teal-100 cursor-pointer"/>
          {photoFile && (
            <p className="text-xs text-teal-600 mt-2">
              ✓ {photoFile.name} selected
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate('/dashboard')}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white
                       border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
            disabled={loading || hospLoading || hospitals.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-teal-600
                       rounded-lg hover:bg-teal-700 disabled:opacity-50
                       disabled:cursor-not-allowed flex items-center gap-2">
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Registering...' : 'Register Doctor Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DoctorRegisterPage;