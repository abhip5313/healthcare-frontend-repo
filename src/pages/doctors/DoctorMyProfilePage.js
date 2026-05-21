import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import doctorService from '../../services/doctorService';
import hospitalService from '../../services/hospitalService';
import DoctorStatusBadge from '../../components/doctors/DoctorStatusBadge';

const SPECIALIZATIONS = [
  'Cardiology','Neurology','Orthopedics','Pediatrics','Gynecology',
  'Dermatology','Oncology','Psychiatry','Radiology','ENT',
  'Ophthalmology','Urology','Nephrology','Gastroenterology',
  'Pulmonology','General Medicine','Surgery','Emergency Medicine',
];

const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const DAY_LABELS = {
  MON:'Monday', TUE:'Tuesday', WED:'Wednesday',
  THU:'Thursday', FRI:'Friday', SAT:'Saturday', SUN:'Sunday'
};

// ── Progress Bar Component ─────────────────────────────────────────────────
function ProfileProgress({ doctor, slots }) {
  const steps = [
    {
      label: 'Account Created',
      done: true,
      icon: '✅',
    },
    {
      label: 'Profile Registered',
      done: !!doctor,
      icon: doctor ? '✅' : '📝',
    },
    {
      label: 'Hospital Selected',
      done: !!doctor?.hospital_name,
      icon: doctor?.hospital_name ? '✅' : '🏥',
    },
    {
      label: 'Slots Added',
      done: slots.length > 0,
      icon: slots.length > 0 ? '✅' : '🕐',
    },
    {
      label: 'Profile Approved',
      done: doctor?.status === 'APPROVED',
      icon: doctor?.status === 'APPROVED' ? '✅' :
            doctor?.status === 'REJECTED' ? '❌' : '⏳',
    },
  ];

  const completed = steps.filter(s => s.done).length;
  const percent   = Math.round((completed / steps.length) * 100);

  const barColor =
    percent === 100 ? 'bg-green-500' :
    percent >= 60   ? 'bg-blue-500'  :
    percent >= 40   ? 'bg-yellow-500': 'bg-red-400';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Profile Completion
        </h3>
        <span className={`text-sm font-bold ${
          percent === 100 ? 'text-green-600' :
          percent >= 60   ? 'text-blue-600'  : 'text-yellow-600'
        }`}>
          {percent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className={`flex items-center gap-2.5 px-3 py-2
            rounded-lg text-xs transition-all ${
              step.done
                ? 'bg-green-50 text-green-700'
                : 'bg-gray-50 text-gray-500'
            }`}>
            <span className="text-sm">{step.icon}</span>
            <span className={`font-medium ${step.done ? '' : 'text-gray-400'}`}>
              {step.label}
            </span>
            {step.done && (
              <span className="ml-auto text-green-500 text-xs">Done</span>
            )}
          </div>
        ))}
      </div>

      {/* Message */}
      <p className={`text-xs mt-3 text-center font-medium ${
        percent === 100 ? 'text-green-600' :
        percent >= 60   ? 'text-blue-600'  : 'text-gray-500'
      }`}>
        {percent === 100
          ? '🎉 Profile 100% complete! You are live on the platform.'
          : percent >= 60
          ? '🔄 Almost there! Complete remaining steps.'
          : '👇 Fill in your details below to get started.'}
      </p>
    </div>
  );
}

// ── Register Form (shown when no profile) ─────────────────────────────────
function DoctorRegisterForm({ onSuccess }) {
  const [loading, setLoading]         = useState(false);
  const [hospitals, setHospitals]     = useState([]);
  const [hospLoading, setHospLoading] = useState(true);
  const [photoFile, setPhotoFile]     = useState(null);
  const [form, setForm] = useState({
    hospital: '', specialization: '', qualification: '',
    experience_years: '', license_number: '', consultation_fee: '', bio: '',
  });

  useEffect(() => {
    hospitalService.listHospitals()
      .then(res => {
        const list = res.data || res.results || [];
        setHospitals(list.filter(h => h.status === 'APPROVED'));
      })
      .catch(() => toast.error('Could not load hospitals.'))
      .finally(() => setHospLoading(false));
  }, []);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hospital) return toast.error('Please select a hospital.');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('profile_photo', photoFile);
      await doctorService.registerDoctor(fd);
      toast.success('Profile registered! Awaiting hospital admin approval.');
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(String(m)))
        );
      } else {
        toast.error('Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white";
  const lbl = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Notice */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3
                      flex items-start gap-2">
        <span className="text-lg mt-0.5">📋</span>
        <p className="text-xs text-teal-800">
          Complete your professional profile below.
          After submission, your <strong>hospital admin</strong> will review and approve.
        </p>
      </div>

      {/* Professional Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2
                       border-b border-gray-100">
          Professional Information
        </h3>
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
              onChange={handleChange} rows={2} className={inp}
              placeholder="Brief professional summary..."/>
          </div>

        </div>
      </div>

      {/* Hospital */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2
                       border-b border-gray-100">
          Select Hospital *
        </h3>

        {hospLoading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="animate-spin w-4 h-4 text-teal-500"
              fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Loading hospitals...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-red-800 mb-1">
              ⚠️ No Approved Hospitals Found
            </p>
            <p className="text-xs text-red-600">
              Ask Hospital Admin to register → Super Admin to approve → then come back.
            </p>
          </div>
        ) : (
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

            {/* Selected hospital preview */}
            {form.hospital && (() => {
              const sel = hospitals.find(
                h => String(h.id) === String(form.hospital)
              );
              return sel ? (
                <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-teal-800">
                    🏥 {sel.hospital_name}
                  </p>
                  <p className="text-xs text-teal-600 mt-0.5">
                    📍 {sel.city}, {sel.state}
                  </p>
                  {sel.specialties?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sel.specialties.slice(0, 3).map((s, i) => (
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

      {/* Photo */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2
                       border-b border-gray-100">
          Profile Photo
        </h3>
        <input type="file" accept="image/*"
          onChange={e => setPhotoFile(e.target.files[0])}
          className="w-full text-xs text-gray-600
                     file:mr-3 file:py-1.5 file:px-3 file:rounded-md
                     file:border-0 file:text-xs file:font-medium
                     file:bg-teal-50 file:text-teal-700
                     hover:file:bg-teal-100 cursor-pointer"/>
        {photoFile && (
          <p className="text-xs text-teal-600 mt-2">✓ {photoFile.name}</p>
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pb-4">
        <button type="submit"
          disabled={loading || hospLoading || hospitals.length === 0}
          className="px-8 py-2.5 text-sm font-medium text-white bg-teal-600
                     rounded-lg hover:bg-teal-700 disabled:opacity-50
                     disabled:cursor-not-allowed flex items-center gap-2
                     transition-colors">
          {loading && (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {loading ? 'Registering...' : '📝 Submit Doctor Profile'}
        </button>
      </div>
    </form>
  );
}

// ── Signature Section ──────────────────────────────────────────────────────
function SignatureSection({ doctor, onRefresh }) {
  const [sigFile, setSigFile]       = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [preview, setPreview]       = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSigFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!sigFile) return toast.error('Please select a signature image first.');
    setUploading(true);
    try {
      await doctorService.uploadSignature(sigFile);
      toast.success('Signature uploaded! It will now appear on prescriptions.');
      setSigFile(null);
      setPreview(null);
      onRefresh();
    } catch {
      toast.error('Failed to upload signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove your signature? It will no longer appear on prescriptions.')) return;
    setDeleting(true);
    try {
      await doctorService.deleteSignature();
      toast.success('Signature removed.');
      onRefresh();
    } catch {
      toast.error('Failed to remove signature.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">
        ✍️ Doctor Signature
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Upload your signature image (PNG with transparent background preferred).
        It will automatically appear on every prescription PDF you generate.
      </p>

      {/* Current Signature Preview */}
      {doctor?.signature_url && !preview && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Current Signature:</p>
          <div className="inline-block bg-gray-50 border border-gray-200 rounded-lg p-3">
            <img
              src={doctor.signature_url}
              alt="Doctor signature"
              className="h-16 max-w-xs object-contain"
            />
          </div>
          <div className="mt-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-700 font-medium
                         disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Removing...' : '✕ Remove Signature'}
            </button>
          </div>
        </div>
      )}

      {/* New File Preview */}
      {preview && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Preview (not saved yet):</p>
          <div className="inline-block bg-gray-50 border border-dashed border-teal-300 rounded-lg p-3">
            <img
              src={preview}
              alt="Signature preview"
              className="h-16 max-w-xs object-contain"
            />
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer">
          <span className="px-4 py-2 text-xs font-medium text-teal-700 border border-teal-300
                           rounded-lg hover:bg-teal-50 transition-colors inline-block">
            {doctor?.signature_url ? '🔄 Replace Signature' : '📤 Upload Signature'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {sigFile && (
          <>
            <span className="text-xs text-gray-500 truncate max-w-[140px]">
              {sigFile.name}
            </span>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 text-xs font-medium text-white bg-teal-600
                         rounded-lg hover:bg-teal-700 disabled:opacity-50
                         transition-colors flex items-center gap-1.5"
            >
              {uploading && (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {uploading ? 'Saving...' : '✓ Save Signature'}
            </button>
            <button
              onClick={() => { setSigFile(null); setPreview(null); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        💡 Tip: Use a transparent PNG (white background will also work).
        Recommended size: 400×150 pixels.
      </p>
    </div>
  );
}


// ── Profile Edit Section ────────────────────────────────────────────────────
function ProfileEditSection({ doctor, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [form, setForm] = useState({
    specialization:   doctor.specialization   || '',
    qualification:    doctor.qualification    || '',
    experience_years: doctor.experience_years || '',
    consultation_fee: doctor.consultation_fee || '',
    bio:              doctor.bio              || '',
    availability_status: doctor.availability_status || 'AVAILABLE',
  });

  // doctor prop बदलला तर form reset करा
  useEffect(() => {
    setForm({
      specialization:   doctor.specialization   || '',
      qualification:    doctor.qualification    || '',
      experience_years: doctor.experience_years || '',
      consultation_fee: doctor.consultation_fee || '',
      bio:              doctor.bio              || '',
      availability_status: doctor.availability_status || 'AVAILABLE',
    });
  }, [doctor]);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.specialization) return toast.error('Specialization required.');
    if (!form.qualification)  return toast.error('Qualification required.');
    if (!form.experience_years || form.experience_years < 0)
      return toast.error('Valid experience required.');
    if (!form.consultation_fee || form.consultation_fee < 0)
      return toast.error('Valid consultation fee required.');

    setSaving(true);
    try {
      await doctorService.updateMyProfile(form);
      toast.success('Profile updated successfully!');
      setEditing(false);
      onRefresh();
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(String(m)))
        );
      } else {
        toast.error('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white";
  const lbl = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">✏️ Edit Profile</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-xs font-medium text-teal-700 border border-teal-300
                       rounded-lg hover:bg-teal-50 transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-300
                         rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-medium text-white bg-teal-600
                         rounded-lg hover:bg-teal-700 disabled:opacity-50
                         transition-colors flex items-center gap-1.5"
            >
              {saving && (
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {saving ? 'Saving...' : '✓ Save'}
            </button>
          </div>
        )}
      </div>

      {/* View mode */}
      {!editing && (
        <div className="p-5 grid grid-cols-2 gap-3 text-xs text-gray-600">
          <div>
            <span className="text-gray-400 block mb-0.5">Specialization</span>
            <span className="font-medium">{doctor.specialization}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Qualification</span>
            <span className="font-medium">{doctor.qualification}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Experience</span>
            <span className="font-medium">{doctor.experience_years} years</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Consultation Fee</span>
            <span className="font-medium text-teal-700">
              ₹{Number(doctor.consultation_fee || 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Availability</span>
            <span className={
              doctor.availability_status === 'ON_LEAVE'
                ? 'font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-xs'
                : doctor.availability_status === 'BUSY'
                ? 'font-semibold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full text-xs'
                : 'font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full text-xs'
            }>
              {doctor.availability_status === 'ON_LEAVE' ? '🔴 On Leave'
                : doctor.availability_status === 'BUSY' ? '🟡 Busy'
                : '🟢 Available'}
            </span>
          </div>
          {doctor.bio && (
            <div className="col-span-2">
              <span className="text-gray-400 block mb-0.5">Bio</span>
              <span>{doctor.bio}</span>
            </div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className={lbl}>Specialization *</label>
              <select name="specialization" value={form.specialization}
                onChange={handleChange} className={inp}>
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={lbl}>Availability</label>
              <select name="availability_status" value={form.availability_status}
                onChange={handleChange} className={inp}>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={lbl}>Qualification *</label>
              <input name="qualification" value={form.qualification}
                onChange={handleChange} className={inp}
                placeholder="MBBS, MD Cardiology — AIIMS Delhi"/>
            </div>

            <div>
              <label className={lbl}>Experience (Years) *</label>
              <input type="number" name="experience_years"
                value={form.experience_years}
                onChange={handleChange} min="0" max="60" className={inp}/>
            </div>

            <div>
              <label className={lbl}>Consultation Fee (₹) *</label>
              <input type="number" name="consultation_fee"
                value={form.consultation_fee}
                onChange={handleChange} min="0" className={inp}/>
            </div>

            <div className="sm:col-span-2">
              <label className={lbl}>Bio</label>
              <textarea name="bio" value={form.bio}
                onChange={handleChange} rows={3} className={inp}
                placeholder="Brief professional summary..."/>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ── Slot Manager ───────────────────────────────────────────────────────────

// Helper: returns today's day key e.g. 'MON', 'TUE', ...
function getTodayDayKey() {
  const jsDay = new Date().getDay(); // 0=Sun,1=Mon,...,6=Sat
  const map = [6, 0, 1, 2, 3, 4, 5]; // map JS getDay() → DAYS index
  return DAYS[map[jsDay]];
}

// Helper: returns current time as "HH:MM" string
function getCurrentTimeStr() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Helper: given a DAYS key ('MON','TUE',...), returns the next Date object
// today if dayKey === todayKey, otherwise the coming week's date
function getNextDateForDay(dayKey) {
  const todayIdx  = DAYS.indexOf(getTodayDayKey());
  const targetIdx = DAYS.indexOf(dayKey);
  let diff = targetIdx - todayIdx;
  if (diff < 0) diff += 7;
  const d = new Date();
  d.setDate(d.getDate() + diff);
  return d;
}

// Helper: format Date as "DD Mon" e.g. "21 May"
function formatShortDate(date) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function SlotManager({ slots, onRefresh, isOnLeave }) {
  const todayKey = getTodayDayKey();
  const todayDate = new Date();
  const todayLabel = `${todayDate.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][todayDate.getMonth()]}`;

  const [newSlot, setNewSlot] = useState(() => {
    const nowDate = new Date();
    nowDate.setMinutes(0, 0, 0);
    nowDate.setHours(nowDate.getHours() + 1);
    const hh  = String(nowDate.getHours()).padStart(2, '0');
    const ehh = String(Math.min(nowDate.getHours() + 1, 23)).padStart(2, '0');
    return {
      day: todayKey,
      start_time: `${hh}:00`,
      end_time: nowDate.getHours() < 23 ? `${ehh}:00` : '23:59',
    };
  });
  const [slotLoading, setSlotLoading] = useState(false);

  // If selected day is today, the minimum allowed start_time is current time
  const isToday      = newSlot.day === todayKey;
  const currentTime  = getCurrentTimeStr();
  const minStartTime = isToday ? currentTime : undefined;

  // When day changes, reset start/end if new day is today and current values are in the past
  const handleDayChange = (e) => {
    const day = e.target.value;
    const nowStr = getCurrentTimeStr();
    const todayNow = getTodayDayKey();

    let start = newSlot.start_time;
    let end   = newSlot.end_time;

    if (day === todayNow && start <= nowStr) {
      // Push start to next hour
      const nowDate = new Date();
      nowDate.setMinutes(0, 0, 0);
      nowDate.setHours(nowDate.getHours() + 1);
      const hh = String(nowDate.getHours()).padStart(2, '0');
      start = `${hh}:00`;
      const endH = String(nowDate.getHours() + 1).padStart(2, '0');
      end = nowDate.getHours() < 23 ? `${endH}:00` : `23:59`;
    }

    setNewSlot(p => ({ ...p, day, start_time: start, end_time: end }));
  };

  // When start_time changes, auto-fix end_time if it's ≤ start
  const handleStartTimeChange = (e) => {
    const start = e.target.value;
    let end = newSlot.end_time;
    if (end <= start) {
      const [h, m] = start.split(':').map(Number);
      const endH = h < 23 ? String(h + 1).padStart(2, '0') : '23';
      const endM = h < 23 ? String(m).padStart(2, '0') : '59';
      end = `${endH}:${endM}`;
    }
    setNewSlot(p => ({ ...p, start_time: start, end_time: end }));
  };

  const handleAdd = async () => {
    if (isOnLeave) return toast.error('You are on leave today. Slots cannot be modified.');
    // Validation 1: end must be after start
    if (newSlot.start_time >= newSlot.end_time) {
      return toast.error('Start time must be before end time.');
    }

    // Validation 2: if today's day is selected, start_time must be > current time
    if (isToday && newSlot.start_time <= currentTime) {
      return toast.error(
        `Today's slots must start after current time (${currentTime}). Please select a future time.`
      );
    }

    setSlotLoading(true);
    try {
      await doctorService.addSlot(newSlot);
      toast.success('Slot added!');
      onRefresh();
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
               || err.response?.data?.detail
               || 'Failed to add slot.';
      toast.error(msg);
    } finally {
      setSlotLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (isOnLeave) return toast.error('You are on leave today. Slots cannot be modified.');
    try {
      await doctorService.deleteSlot(id);
      toast.success('Slot removed.');
      onRefresh();
    } catch {
      toast.error('Failed to remove slot.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        🕐 Availability Slots
      </h3>

      {/* ON_LEAVE warning */}
      {isOnLeave && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200
                        rounded-lg px-3 py-2">
          <span className="text-sm">🔴</span>
          <p className="text-xs text-red-800">
            <strong>You are on Leave today</strong> — slots cannot be added or removed while on leave.
          </p>
        </div>
      )}

      {/* Today warning banner */}
      {isToday && (
        <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200
                        rounded-lg px-3 py-2">
          <span className="text-sm">⚠️</span>
          <p className="text-xs text-amber-800">
            <strong>Today</strong> selected — only slots after{' '}
            <strong>{currentTime}</strong> (current time) are allowed.
          </p>
        </div>
      )}

      {/* Add Slot Row */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3
                      bg-gray-50 rounded-lg border border-gray-100">
        <select value={newSlot.day}
          onChange={handleDayChange}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-md
                     focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white">
          {DAYS.map(d => {
            const date = getNextDateForDay(d);
            const dateStr = formatShortDate(date);
            const isT = d === todayKey;
            return (
              <option key={d} value={d}>
                {DAY_LABELS[d]} — {dateStr}{isT ? ' (Today)' : ''}
              </option>
            );
          })}
        </select>

        <input
          type="time"
          value={newSlot.start_time}
          min={minStartTime}
          onChange={handleStartTimeChange}
          className={`px-2 py-1.5 text-xs border rounded-md
                     focus:outline-none focus:ring-1 focus:ring-teal-500
                     ${isToday && newSlot.start_time <= currentTime
                       ? 'border-red-400 bg-red-50'
                       : 'border-gray-300'}`}
        />

        <span className="text-xs text-gray-400 font-medium">to</span>

        <input type="time" value={newSlot.end_time}
          onChange={e => setNewSlot(p => ({ ...p, end_time: e.target.value }))}
          className="px-2 py-1.5 text-xs border border-gray-300 rounded-md
                     focus:outline-none focus:ring-1 focus:ring-teal-500"/>

        <button onClick={handleAdd} disabled={slotLoading}
          className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600
                     rounded-md hover:bg-teal-700 disabled:opacity-50
                     transition-colors flex items-center gap-1">
          {slotLoading ? '...' : '+ Add'}
        </button>
      </div>

      {/* Slot List */}
      {slots.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-400">
          <p className="text-2xl mb-1">🗓️</p>
          No slots added yet. Add your availability above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {slots.map(slot => (
            <div key={slot.id}
              className="flex items-center justify-between bg-teal-50
                         border border-teal-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-teal-800 w-20">
                  {DAY_LABELS[slot.day]}
                </span>
                <span className="text-xs text-teal-600">
                  {slot.start_time} – {slot.end_time}
                </span>
              </div>
              <button onClick={() => handleDelete(slot.id)}
                className="text-xs text-red-400 hover:text-red-600
                           font-medium transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function DoctorMyProfilePage() {
  const [doctor, setDoctor]   = useState(null);
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [profileRes, slotRes] = await Promise.allSettled([
        doctorService.getMyProfile(),
        doctorService.getSlots(),
      ]);
      console.log('=== PROFILE DEBUG ===');
      console.log('profileRes:', profileRes);
      console.log('profileRes.value:', profileRes?.value);
      console.log('profileRes.value.data:', profileRes?.value?.data);
      if (profileRes.status === 'fulfilled') {
        setDoctor(profileRes.value.data);
      }
      if (slotRes.status === 'fulfilled') {
        setSlots(slotRes.value.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

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

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Doctor Profile
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {doctor
              ? 'Manage your professional profile and availability'
              : 'Complete your profile to start accepting patients'}
          </p>
        </div>
        {doctor && <DoctorStatusBadge status={doctor.status} />}
      </div>

      {/* ── Progress Bar ── always visible ─────────────────── */}
      <ProfileProgress doctor={doctor} slots={slots} />

      {/* ── If NO profile yet → Show Register Form ─────────── */}
      {!doctor && (
        <DoctorRegisterForm onSuccess={fetchAll} />
      )}

      {/* ── If profile exists → Show Details ───────────────── */}
      {doctor && (
        <>
          {/* Status banners */}
          {doctor.status === 'PENDING' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl
                            p-4 flex items-center gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <p className="text-xs font-semibold text-yellow-800">
                  Awaiting Hospital Admin Approval
                </p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Your profile has been submitted.
                  The hospital admin will review and approve it soon.
                </p>
              </div>
            </div>
          )}

          {doctor.status === 'APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-xl
                            p-4 flex items-center gap-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="text-xs font-semibold text-green-800">
                  Profile Approved — You're Live!
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  Patients can now find and book appointments with you.
                </p>
              </div>
            </div>
          )}

          {doctor.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-800 mb-1">
                ❌ Profile Rejected
              </p>
              <p className="text-xs text-red-700">
                {doctor.rejection_reason || 'Please contact your hospital admin.'}
              </p>
            </div>
          )}

          {/* Profile Details Card — name + hospital (read-only) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 px-5 py-4 text-white">
              <h2 className="font-bold text-base">Dr. {doctor.full_name}</h2>
              <p className="text-teal-200 text-xs mt-0.5">{doctor.specialization}</p>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div>
                <span className="text-gray-400 block mb-0.5">License No.</span>
                <span className="font-medium">{doctor.license_number}</span>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">Hospital</span>
                <span className="font-medium">{doctor.hospital_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Editable Profile Fields */}
          <ProfileEditSection doctor={doctor} onRefresh={fetchAll} />

          {/* Slots — only show if approved */}
          {doctor.status === 'APPROVED' && (
            <SignatureSection doctor={doctor} onRefresh={fetchAll} />
          )}

          {/* Slots — only show if approved */}
          {doctor.status === 'APPROVED' && (
            <SlotManager slots={slots} onRefresh={fetchAll} isOnLeave={doctor.availability_status === "ON_LEAVE"} />
          )}

          {/* Slots hint if pending */}
          {doctor.status === 'PENDING' && (
            <div className="bg-gray-50 border border-dashed border-gray-200
                            rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">
                🕐 Availability slots can be added after your profile is approved.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DoctorMyProfilePage;