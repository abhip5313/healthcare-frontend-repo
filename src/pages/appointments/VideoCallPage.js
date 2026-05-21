import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import toast from 'react-hot-toast';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';

function VideoCallPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const callContainerRef = useRef(null);
  const callFrameRef     = useRef(null);
  const doctorIdRef      = useRef(null);  // closure-safe doctor id

  const [status,   setStatus]   = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    /**
     * React Strict Mode मध्ये useEffect mount → cleanup → re-mount असं होतं.
     * `destroyed` flag async function ला सांगतो:
     * "cleanup झाली आहे, frame बनवू नकोस."
     * हाच एकमेव reliable pattern आहे async + Strict Mode साठी.
     */
    let destroyed = false;

    const initCall = async () => {
      try {
        // Step 1: Backend ला join-meeting call करा
        const data = await appointmentService.joinMeeting(id);

        // await नंतर cleanup झाली असेल तर बाहेर पडा
        if (destroyed) return;

        if (!data.success) {
          setErrorMsg(data.message || 'Meeting link मिळाली नाही.');
          setStatus('error');
          return;
        }

        const { meeting_link, token, doctor_id } = data;
        if (doctor_id) {
          setDoctorId(doctor_id);
          doctorIdRef.current = doctor_id; // ref मध्ये पण save करा — closure safe
        }
        setStatus('joining');

        // Step 2: आधीचा कुठला DailyIframe instance असेल तर destroy करा
        try {
          const existing = DailyIframe.getCallInstance();
          if (existing) {
            await existing.destroy();
          }
        } catch (_) {
          // existing instance नसेल तर ignore
        }

        if (destroyed) return;

        // Step 3: नवीन frame बनवा
        const frame = DailyIframe.createFrame(callContainerRef.current, {
          iframeStyle: {
            position:     'absolute',
            top:          0,
            left:         0,
            width:        '100%',
            height:       '100%',
            border:       'none',
            borderRadius: 0,
          },
          showLeaveButton:      true,
          showFullscreenButton: true,
          showLocalVideo:       true,
          showParticipantsBar:  true,
        });

        callFrameRef.current = frame;

        // Step 4: Events
        frame.on('joining-meeting', () => setStatus('joining'));

        frame.on('joined-meeting', () => {
          setStatus('in-call');
          toast.success('Meeting join झाली! 🎥');
        });

        frame.on('left-meeting', () => {
          setStatus('ended');
          toast('Meeting संपली.', { icon: '👋' });
          const isPatient = user?.role === 'PATIENT';
          const targetDoctorId = doctorIdRef.current;
          console.log('[VideoCall] left-meeting fired');
          console.log('[VideoCall] user.role:', user?.role);
          console.log('[VideoCall] isPatient:', isPatient);
          console.log('[VideoCall] doctorIdRef.current:', targetDoctorId);
          setTimeout(() => {
            if (isPatient && targetDoctorId) {
              navigate(`/doctors/${targetDoctorId}/reviews`);
            } else {
              navigate(`/appointments/${id}`);
            }
          }, 2000);
        });

        frame.on('error', (e) => {
          if (destroyed) return;
          setErrorMsg(e?.errorMsg || 'Meeting error आला.');
          setStatus('error');
        });

        // Step 5: Join — token key पाठवूच नका जर नसेल (Daily strict आहे)
        const joinOptions = {
          url:      meeting_link,
          userName: user?.full_name || user?.email || 'User',
        };
        if (token) joinOptions.token = token;
        await frame.join(joinOptions);

      } catch (err) {
        if (destroyed) return;
        const msg = err?.response?.data?.message || err.message || 'Meeting join करता आली नाही.';
        setErrorMsg(msg);
        setStatus('error');
        toast.error(msg);
      }
    };

    initCall();

    return () => {
      destroyed = true;
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [id]);

  // ─── IMPORTANT FIX ────────────────────────────────────────────────────────
  // callContainerRef चा <div> नेहमी DOM मध्ये असणे गरजेचे आहे.
  // जर आपण loading/joining/error/ended states मध्ये वेगळे JSX return केले
  // तर callContainerRef.current = null होतो, आणि DailyIframe.createFrame()
  // null container वर call होतो → blank screen येतो.
  //
  // Solution: एकच return — container नेहमी render करायचा,
  // overlay divs त्यावर absolute position करायचे.
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col" style={{ zIndex: 9999 }}>

      {/* ── Top bar: फक्त in-call मध्ये दाखवा ── */}
      {status === 'in-call' && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium">Live Consultation</span>
          </div>
          <button
            onClick={() => navigate(`/appointments/${id}`)}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      )}

      {/* ── Daily iframe container — नेहमी DOM मध्ये असतो ── */}
      <div
        ref={callContainerRef}
        className="flex-1 w-full overflow-hidden"
        style={{ minHeight: 0, position: 'relative' }}
      />

      {/* ── Loading overlay (फक्त backend call होईपर्यंत) ── */}
      {status === 'loading' && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium">Meeting तयार होतेय...</p>
          <p className="text-gray-400 text-sm">कृपया थांबा</p>
        </div>
      )}

      {/* NOTE: 'joining' state मध्ये overlay नाही — Daily चा स्वतःचा UI दिसतो */}

      {/* ── Error overlay ── */}
      {status === 'error' && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4 px-4">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium text-center">Meeting join होऊ शकली नाही</p>
          <p className="text-red-400 text-sm text-center max-w-sm">{errorMsg}</p>
          <button
            onClick={() => navigate(`/appointments/${id}`)}
            className="mt-4 px-6 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-100"
          >
            ← Appointment वर परत जा
          </button>
        </div>
      )}

      {/* ── Ended overlay ── */}
      {status === 'ended' && (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-white text-lg font-medium">Meeting संपली 👋</p>
          <p className="text-gray-400 text-sm">Appointment page वर जातोय...</p>
        </div>
      )}

    </div>
  );
}

export default VideoCallPage;