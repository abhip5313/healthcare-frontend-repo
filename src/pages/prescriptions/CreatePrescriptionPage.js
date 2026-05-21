import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import prescriptionService from '../../services/prescriptionService';

function CreatePrescriptionPage() {
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(false);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patient:        '',
    diagnosis:      '',
    instructions:   '',
    follow_up_date: '',
  });
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', duration: '', instructions: '' }
  ]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res   = await api.get('/appointments/doctor-appointments/');
        const raw   = res.data;
        const appts = raw.data || raw.results || [];

        console.log('Appointments:', appts); // debug

        const seen = {};
        const list = [];

        appts.forEach(a => {
          // फक्त CONFIRMED किंवा COMPLETED appointments चे patients
          if (
            !seen[a.patient_name] &&
            ['CONFIRMED', 'COMPLETED'].includes(a.status)
          ) {
            seen[a.patient_name] = true;
            list.push({
              patient_id: a.patient_id,   // ← backend ने patient_id पाठवला तर
              name:       a.patient_name,
              appt_id:    a.id,           // ← fallback
            });
          }
        });

        console.log('Patient list:', list); // debug
        setPatients(list);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      }
    };

    fetchPatients();
  }, []);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleMedChange = (i, field, val) =>
    setMedicines(prev =>
      prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m)
    );

  const addMedicine = () =>
    setMedicines(prev => [
      ...prev,
      { name: '', dosage: '', duration: '', instructions: '' }
    ]);

  const removeMedicine = (i) =>
    setMedicines(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.patient)   return toast.error('Please select a patient.');
    if (!form.diagnosis) return toast.error('Please enter diagnosis.');

    const validMeds = medicines.filter(
      m => m.name.trim() && m.dosage.trim() && m.duration.trim()
    );
    if (validMeds.length === 0)
      return toast.error('Add at least one complete medicine (name, dosage, duration).');

    setLoading(true);
    try {
      // patient_id असेल तर तो वापर, नाहीतर appointment वरून patient काढ
      const selectedPatient = patients.find(
        p => String(p.appt_id) === String(form.patient)
      );

      let patientId = selectedPatient?.patient_id;

      // patient_id नसेल तर appointment detail वरून काढ
      if (!patientId) {
        const apptRes = await api.get(
          `/appointments/${selectedPatient?.appt_id}/`
        );
        const apptData = apptRes.data?.data || apptRes.data;
        // appointment detail मध्ये patient info असतो
        // patient email वरून user ID काढणे कठीण आहे
        // म्हणून backend fix करणे best आहे
        patientId = apptData?.patient_id;
      }

      if (!patientId) {
        // Backend मध्ये patient_id नाही — appointment ID वापरून patient काढतो
        // हा fallback आहे
        toast.error(
          'Could not get patient ID. Please add patient_id to appointment serializer.'
        );
        setLoading(false);
        return;
      }

      const payload = {
        patient:        patientId,
        diagnosis:      form.diagnosis,
        instructions:   form.instructions,
        follow_up_date: form.follow_up_date || null,
        medicines:      validMeds,
      };

      console.log('Sending payload:', payload); // debug

      await prescriptionService.createPrescription(payload);
      toast.success('Prescription created successfully!');
      navigate('/prescriptions');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        Object.values(data).forEach(msgs =>
          (Array.isArray(msgs) ? msgs : [msgs])
            .forEach(m => toast.error(String(m)))
        );
      } else {
        toast.error('Failed to create prescription.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
               focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white`;
  const lbl = "block text-xs font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Write Prescription</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Create a prescription for your patient
          </p>
        </div>
        <button onClick={() => navigate('/prescriptions')}
          className="text-xs text-gray-500 hover:text-gray-700">
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Patient + Diagnosis */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2
                         border-b border-gray-100">
            Patient & Diagnosis
          </h2>
          <div className="space-y-3">

            {/* Patient Dropdown */}
            <div>
              <label className={lbl}>Patient *</label>
              <select name="patient" value={form.patient}
                onChange={handleChange} required className={inp}>
                <option value="">-- Select Patient --</option>
                {patients.map((p, i) => (
                  <option key={i} value={p.appt_id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {patients.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ No patients found. Patients appear after appointments are
                  CONFIRMED or COMPLETED.
                </p>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <label className={lbl}>Diagnosis *</label>
              <textarea name="diagnosis" value={form.diagnosis}
                onChange={handleChange} required rows={2}
                className={inp}
                placeholder="Primary diagnosis..."/>
            </div>

            {/* Instructions */}
            <div>
              <label className={lbl}>General Instructions</label>
              <textarea name="instructions" value={form.instructions}
                onChange={handleChange} rows={2}
                className={inp}
                placeholder="Rest, diet, lifestyle instructions..."/>
            </div>

            {/* Follow-up */}
            <div>
              <label className={lbl}>Follow-up Date</label>
              <input type="date" name="follow_up_date"
                value={form.follow_up_date}
                onChange={handleChange}
                className={inp}
                min={new Date().toISOString().split('T')[0]}/>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-2
                          border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Medicines ({medicines.length})
            </h2>
            <button type="button" onClick={addMedicine}
              className="px-3 py-1.5 text-xs font-medium text-teal-600
                         border border-teal-200 rounded-lg hover:bg-teal-50">
              + Add Medicine
            </button>
          </div>

          <div className="space-y-4">
            {medicines.map((med, i) => (
              <div key={i}
                className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">
                    Medicine {i + 1}
                  </span>
                  {medicines.length > 1 && (
                    <button type="button" onClick={() => removeMedicine(i)}
                      className="text-xs text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Medicine Name *</label>
                    <input value={med.name}
                      onChange={e => handleMedChange(i, 'name', e.target.value)}
                      className={inp}
                      placeholder="e.g. Paracetamol 500mg"/>
                  </div>
                  <div>
                    <label className={lbl}>Dosage *</label>
                    <input value={med.dosage}
                      onChange={e => handleMedChange(i, 'dosage', e.target.value)}
                      className={inp}
                      placeholder="e.g. 1-0-1"/>
                  </div>
                  <div>
                    <label className={lbl}>Duration *</label>
                    <input value={med.duration}
                      onChange={e => handleMedChange(i, 'duration', e.target.value)}
                      className={inp}
                      placeholder="e.g. 5 days"/>
                  </div>
                  <div>
                    <label className={lbl}>Instructions</label>
                    <input value={med.instructions}
                      onChange={e => handleMedChange(i, 'instructions', e.target.value)}
                      className={inp}
                      placeholder="e.g. After meals"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate('/prescriptions')}
            className="px-5 py-2 text-sm font-medium text-gray-600 bg-white
                       border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-teal-600
                       rounded-lg hover:bg-teal-700 disabled:opacity-50
                       flex items-center gap-2">
            {loading && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {loading ? 'Creating...' : '💊 Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreatePrescriptionPage;