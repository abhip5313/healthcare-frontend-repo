import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import hospitalService from '../../services/hospitalService';

const SPECIALTIES_OPTIONS = [
  'Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology',
  'Dermatology','Oncology','Psychiatry','Radiology','ENT',
  'Ophthalmology','Urology','Nephrology','Gastroenterology','Pulmonology',
];

function HospitalRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [form, setForm] = useState({
    hospital_name: '', hospital_type: '', registration_number: '',
    description: '', email: '', phone_number: '', landline_number: '',
    emergency_contact: '', website: '', address: '', city: '',
    state: '', pincode: '', specialties: [],
  });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSpecialtyToggle = (specialty) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospital_type) return toast.error('Please select hospital type.');
    if (form.specialties.length === 0) return toast.error('Select at least one specialty.');

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'specialties') {
          formData.append(k, JSON.stringify(v));
        } else {
          formData.append(k, v);
        }
      });
      if (logoFile) formData.append('logo', logoFile);

      await hospitalService.registerHospital(formData);
      toast.success('Hospital registered! Awaiting Super Admin approval.');
      navigate('/hospital');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs => {
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(m));
        });
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClass = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Register Your Hospital</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below. Your registration will be reviewed by the Super Admin.
        </p>
      </div>

      {/* Status banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
        <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-yellow-800">
          After registration, your hospital status will be <strong>PENDING</strong> until approved by the Super Admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Section 1 — Basic Info */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Hospital Name *</label>
              <input name="hospital_name" value={form.hospital_name} onChange={handleChange}
                required className={inputClass} placeholder="City General Hospital" />
            </div>
            <div>
              <label className={labelClass}>Hospital Type *</label>
              <select name="hospital_type" value={form.hospital_type} onChange={handleChange}
                required className={inputClass}>
                <option value="">Select type</option>
                <option value="GENERAL">General</option>
                <option value="MULTI_SPECIALTY">Multi-Speciality</option>
                <option value="CLINIC">Clinic</option>
                <option value="DIAGNOSTIC">Diagnostic</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Registration Number *</label>
              <input name="registration_number" value={form.registration_number} onChange={handleChange}
                required className={inputClass} placeholder="MH-12345-2020" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} className={inputClass} placeholder="Brief description about your hospital..." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Hospital Logo</label>
              <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])}
                className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md
                           file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Section 2 — Contact */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                required className={inputClass} placeholder="hospital@example.com" />
            </div>
            <div>
              <label className={labelClass}>Phone Number *</label>
              <input name="phone_number" value={form.phone_number} onChange={handleChange}
                required className={inputClass} placeholder="9876543210" />
            </div>
            <div>
              <label className={labelClass}>Landline Number</label>
              <input name="landline_number" value={form.landline_number} onChange={handleChange}
                className={inputClass} placeholder="020-12345678" />
            </div>
            <div>
              <label className={labelClass}>Emergency Contact</label>
              <input name="emergency_contact" value={form.emergency_contact} onChange={handleChange}
                className={inputClass} placeholder="9876500000" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Website</label>
              <input type="url" name="website" value={form.website} onChange={handleChange}
                className={inputClass} placeholder="https://www.hospital.com" />
            </div>
          </div>
        </div>

        {/* Section 3 — Address */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Address
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full Address *</label>
              <textarea name="address" value={form.address} onChange={handleChange}
                required rows={2} className={inputClass} placeholder="Building, Street, Area" />
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <input name="city" value={form.city} onChange={handleChange}
                required className={inputClass} placeholder="Pune" />
            </div>
            <div>
              <label className={labelClass}>State *</label>
              <input name="state" value={form.state} onChange={handleChange}
                required className={inputClass} placeholder="Maharashtra" />
            </div>
            <div>
              <label className={labelClass}>Pincode *</label>
              <input name="pincode" value={form.pincode} onChange={handleChange}
                required className={inputClass} placeholder="411001" />
            </div>
          </div>
        </div>

        {/* Section 4 — Specialties */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1 pb-2 border-b border-gray-100">
            Specialties *
          </h2>
          <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES_OPTIONS.map(s => (
              <button
                type="button" key={s}
                onClick={() => handleSpecialtyToggle(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.specialties.includes(s)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {form.specialties.length > 0 && (
            <p className="text-xs text-blue-600 mt-2">{form.specialties.length} selected</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate('/dashboard')}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg
                       hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2">
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Registering...' : 'Register Hospital'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default HospitalRegisterPage;