import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import medicalRecordService from '../../services/medicalRecordService';

const RECORD_TYPES = [
  { value: 'REPORT',       label: '🧪 Lab Report' },
  { value: 'SCAN',         label: '🔬 Scan / X-Ray / MRI' },
  { value: 'PRESCRIPTION', label: '💊 Prescription' },
  { value: 'DISCHARGE',    label: '🏥 Discharge Summary' },
  { value: 'OTHER',        label: '📄 Other' },
];

function MedicalRecordUploadPage() {
  const navigate      = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile]       = useState(null);
  const [form, setForm] = useState({
    record_type: 'REPORT',
    title: '',
    description: '',
    record_date: new Date().toISOString().split('T')[0],
  });

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to upload.');

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append('file', file);
      await medicalRecordService.uploadRecord(fd);
      toast.success('Medical record uploaded successfully!');
      navigate('/records');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs]).forEach(m => toast.error(String(m)))
        );
      } else {
        toast.error('Upload failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const lbl = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Upload Medical Record</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload reports, scans, prescriptions, or other health documents
          </p>
        </div>
        <button onClick={() => navigate('/records')}
          className="text-xs text-gray-500 hover:text-gray-700">← Back</button>
      </div>

      {/* Accepted formats notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3
                      flex items-center gap-3">
        <span className="text-xl">📎</span>
        <p className="text-xs text-blue-800">
          Accepted formats: <strong>PDF, JPG, PNG, DOCX</strong> — Max size 10MB
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">

          {/* Record Type */}
          <div>
            <label className={lbl}>Record Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RECORD_TYPES.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm(p => ({ ...p, record_type: t.value }))}
                  className={`py-2.5 px-3 rounded-lg text-xs font-medium border
                              transition-all text-left ${
                    form.record_type === t.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={lbl}>Title *</label>
            <input name="title" value={form.title}
              onChange={handleChange} required className={inp}
              placeholder="e.g. Blood Test Report - May 2024"/>
          </div>

          {/* Description */}
          <div>
            <label className={lbl}>Description</label>
            <textarea name="description" value={form.description}
              onChange={handleChange} rows={2} className={inp}
              placeholder="Brief description of this record..."/>
          </div>

          {/* Record Date */}
          <div>
            <label className={lbl}>Record Date *</label>
            <input type="date" name="record_date" value={form.record_date}
              onChange={handleChange} required className={inp}
              max={new Date().toISOString().split('T')[0]}/>
          </div>

          {/* File Upload */}
          <div>
            <label className={lbl}>File *</label>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center
                             transition-colors ${
              file ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <input type="file" id="file-input"
                accept=".pdf,.jpg,.jpeg,.png,.docx"
                onChange={e => setFile(e.target.files[0])}
                className="hidden"/>
              <label htmlFor="file-input" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-2xl mb-1">✅</p>
                    <p className="text-sm font-medium text-blue-700">{file.name}</p>
                    <p className="text-xs text-blue-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📁</p>
                    <p className="text-sm font-medium text-gray-600">
                      Click to select file
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, JPG, PNG, DOCX up to 10MB
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate('/records')}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white
                       border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading || !file}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600
                       rounded-lg hover:bg-blue-700 disabled:opacity-50
                       flex items-center gap-2">
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Uploading...' : '⬆️ Upload Record'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MedicalRecordUploadPage;