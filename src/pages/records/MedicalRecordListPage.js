import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import medicalRecordService from '../../services/medicalRecordService';

const TYPE_CONFIG = {
  REPORT:       { label: 'Lab Report',        icon: '🧪', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  SCAN:         { label: 'Scan/X-Ray/MRI',    icon: '🔬', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  PRESCRIPTION: { label: 'Prescription',      icon: '💊', color: 'bg-teal-50 text-teal-700 border-teal-100' },
  DISCHARGE:    { label: 'Discharge Summary', icon: '🏥', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  OTHER:        { label: 'Other',             icon: '📄', color: 'bg-gray-50 text-gray-700 border-gray-100' },
};

function MedicalRecordListPage() {
  const navigate          = useNavigate();
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filterType, setFilterType] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = filterType ? { record_type: filterType } : {};
      const data   = await medicalRecordService.getMyRecords(params);
      setRecords(data.data || []);
    } catch {
      toast.error('Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, [filterType]);

  const handleDelete = async (id) => {
    try {
      await medicalRecordService.deleteRecord(id);
      toast.success('Record deleted.');
      setDeleteId(null);
      fetchRecords();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Medical Records</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload and manage your health documents
          </p>
        </div>
        <button onClick={() => navigate('/records/upload')}
          className="px-4 py-2 text-xs font-medium text-white bg-blue-600
                     rounded-lg hover:bg-blue-700 transition-colors">
          + Upload Record
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterType === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, val]) => (
          <button key={key} onClick={() => setFilterType(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterType === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {val.icon} {val.label}
          </button>
        ))}
      </div>

      {/* Records List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium text-gray-600">No medical records found</p>
          <p className="text-xs text-gray-400 mt-1">Upload your reports, scans and prescriptions.</p>
          <button onClick={() => navigate('/records/upload')}
            className="mt-4 px-5 py-2 text-xs font-medium text-white
                       bg-blue-600 rounded-lg hover:bg-blue-700">
            Upload First Record
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {records.map(record => {
            const cfg = TYPE_CONFIG[record.record_type] || TYPE_CONFIG.OTHER;
            return (
              <div key={record.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {/* Type badge + icon */}
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1
                                    rounded-full text-xs font-medium border ${cfg.color}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <button onClick={() => setDeleteId(record.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
                  {record.title}
                </h3>

                {/* Description */}
                {record.description && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {record.description}
                  </p>
                )}

                {/* Meta */}
                <div className="text-xs text-gray-400 space-y-0.5 mb-3">
                  <p>📅 {new Date(record.record_date).toLocaleDateString('en-IN')}</p>
                  {record.doctor_name && <p>👨‍⚕️ {record.doctor_name}</p>}
                </div>

                {/* Download */}
                {record.file_url && (
                  <a href={record.file_url} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-2
                               text-xs font-medium text-blue-600 border border-blue-200
                               rounded-lg hover:bg-blue-50 transition-colors">
                    ⬇️ View / Download
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-3xl mb-3">🗑️</p>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Delete Record?</h3>
            <p className="text-xs text-gray-500 mb-5">
              This action cannot be undone. The file will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2 text-xs font-medium text-gray-600
                           bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 text-xs font-medium text-white
                           bg-red-600 rounded-lg hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalRecordListPage;