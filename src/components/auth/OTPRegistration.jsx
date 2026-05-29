/**
 * OTPRegistration.jsx — Email OTP only
 * Phone OTP काढला आहे.
 *
 * Usage:
 *   import OTPRegistration from './components/auth/OTPRegistration';
 *   <OTPRegistration onSuccess={(userData) => navigate('/dashboard')} />
 */

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/auth`
  : 'http://localhost:8000/api/v1/auth';

// ─── OTP Input Boxes ──────────────────────────────────────────────────────────
function OTPInput({ value, onChange, length = 6 }) {
  const refsContainer = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/, '');
    const newDigits = [...digits];
    newDigits[i] = val;
    onChange(newDigits.join(''));
    if (val && i < length - 1) refsContainer.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refsContainer.current[i - 1]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refsContainer.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          style={{
            width: '48px', height: '56px', textAlign: 'center',
            fontSize: '24px', fontWeight: 'bold', border: '2px solid #764ba2',
            borderRadius: '8px', outline: 'none', color: '#333',
          }}
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) { clearInterval(timer); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return (
    <span style={{ color: remaining < 60 ? '#e74c3c' : '#764ba2', fontWeight: 'bold' }}>
      {m}:{s}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OTPRegistration({ onSuccess }) {
  const STEPS = { FORM: 'form', EMAIL_OTP: 'email_otp', SUCCESS: 'success' };

  const [step, setStep] = useState(STEPS.FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionEmail, setSessionEmail] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'PATIENT',
    password: '',
    password_confirm: '',
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
    setError('');
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const res = await axios.post(`${API_BASE}/send-otp/`, form);
      setSessionEmail(form.email);
      setSuccess(res.data.message);
      setOtpExpired(false);
      setStep(STEPS.EMAIL_OTP);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setFieldErrors(data.errors);
      else setError(data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify Email OTP ──────────────────────────────────────────────
  const handleVerifyEmail = async () => {
    if (emailOtp.length < 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/verify-email-otp/`, {
        email: sessionEmail,
        otp: emailOtp,
      });
      await handleCompleteRegistration();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Complete Registration ─────────────────────────────────────────
  const handleCompleteRegistration = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/complete-registration/`, {
        email: sessionEmail,
      });
      setStep(STEPS.SUCCESS);
      setSuccess(res.data.message);
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (onSuccess) setTimeout(() => onSuccess(res.data), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setLoading(true);
    setError('');
    setOtpExpired(false);
    try {
      const res = await axios.post(`${API_BASE}/resend-otp/`, { email: sessionEmail });
      setSuccess(res.data.message);
      setEmailOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const cardStyle = {
    maxWidth: '480px', margin: '40px auto', background: '#fff',
    borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
  };
  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '24px', textAlign: 'center', color: '#fff',
  };
  const bodyStyle = { padding: '32px' };
  const inputStyle = {
    width: '100%', padding: '12px 16px', border: '1px solid #ddd',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginTop: '4px',
  };
  const errorInputStyle = { ...inputStyle, borderColor: '#e74c3c', background: '#fff5f5' };
  const btnStyle = {
    width: '100%', padding: '14px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', border: 'none', borderRadius: '8px',
    fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px',
  };
  const alertStyle = (type) => ({
    padding: '12px 16px', borderRadius: '8px', marginBottom: '16px',
    background: type === 'error' ? '#ffeaea' : '#eaffea',
    color: type === 'error' ? '#c0392b' : '#27ae60',
    border: `1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'}`,
    fontSize: '14px',
  });

  const FieldError = ({ field }) =>
    fieldErrors[field] ? (
      <p style={{ color: '#e74c3c', fontSize: '12px', margin: '4px 0 0' }}>
        ⚠️ {Array.isArray(fieldErrors[field]) ? fieldErrors[field][0] : fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '22px' }}>
          {step === STEPS.FORM && '📝 Create Account'}
          {step === STEPS.EMAIL_OTP && '📧 Verify Your Email'}
          {step === STEPS.SUCCESS && '🎉 Welcome!'}
        </h2>
        <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: '14px' }}>
          {step === STEPS.FORM && 'Secure registration via Email OTP'}
          {step === STEPS.EMAIL_OTP && `OTP sent to ${sessionEmail}`}
          {step === STEPS.SUCCESS && 'Your account has been created successfully'}
        </p>
      </div>

      <div style={bodyStyle}>
        {error && <div style={alertStyle('error')}>❌ {error}</div>}
        {success && step !== STEPS.SUCCESS && <div style={alertStyle('success')}>✅ {success}</div>}

        {/* ── Step 1: Registration Form ── */}
        {step === STEPS.FORM && (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Full Name *</label>
              <input style={fieldErrors.full_name ? errorInputStyle : inputStyle}
                name="full_name" value={form.full_name}
                onChange={handleFormChange} placeholder="Your full name" required />
              <FieldError field="full_name" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Email *</label>
              <input style={fieldErrors.email ? errorInputStyle : inputStyle}
                type="email" name="email" value={form.email}
                onChange={handleFormChange} placeholder="email@example.com" required />
              <FieldError field="email" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>
                Mobile Number <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span>
              </label>
              <input style={fieldErrors.phone_number ? errorInputStyle : inputStyle}
                type="tel" name="phone_number" value={form.phone_number}
                onChange={handleFormChange} placeholder="10-digit mobile number" />
              <FieldError field="phone_number" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Register As *</label>
              <select style={inputStyle} name="role" value={form.role}
                onChange={handleFormChange} required>
                <option value="PATIENT">Patient</option>
                <option value="DOCTOR">Doctor</option>
                <option value="HOSPITAL_ADMIN">Hospital Admin</option>
              </select>
              <FieldError field="role" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Password *</label>
              <input style={fieldErrors.password ? errorInputStyle : inputStyle}
                type="password" name="password" value={form.password}
                onChange={handleFormChange} placeholder="Min. 8 characters" required />
              <FieldError field="password" />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>Confirm Password *</label>
              <input style={fieldErrors.password_confirm ? errorInputStyle : inputStyle}
                type="password" name="password_confirm" value={form.password_confirm}
                onChange={handleFormChange} placeholder="Re-enter your password" required />
              <FieldError field="password_confirm" />
            </div>

            <button style={btnStyle} type="submit" disabled={loading}>
              {loading ? '⏳ Sending OTP...' : '📨 Send OTP'}
            </button>
          </form>
        )}

        {/* ── Step 2: Email OTP ── */}
        {step === STEPS.EMAIL_OTP && (
          <div>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
              Enter the 6-digit OTP sent to <strong>{sessionEmail}</strong>
            </p>
            <OTPInput value={emailOtp} onChange={setEmailOtp} />
            <div style={{ textAlign: 'center', margin: '16px 0', color: '#666' }}>
              OTP expires in:{' '}
              {!otpExpired
                ? <CountdownTimer seconds={600} onExpire={() => setOtpExpired(true)} />
                : <span style={{ color: '#e74c3c' }}>Expired!</span>
              }
            </div>
            <button style={btnStyle} onClick={handleVerifyEmail}
              disabled={loading || emailOtp.length < 6}>
              {loading ? '⏳ Verifying...' : '✅ Verify Email OTP'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={handleResend} disabled={loading}
                style={{ background: 'none', border: 'none', color: '#764ba2', cursor: 'pointer', textDecoration: 'underline' }}>
                Didn't receive OTP? Resend
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={() => { setStep(STEPS.FORM); setError(''); setSuccess(''); setEmailOtp(''); }}
                style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px' }}>
                ← Go back and edit your details
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === STEPS.SUCCESS && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ color: '#27ae60' }}>Account Created!</h3>
            <p style={{ color: '#666' }}>{success}</p>
            <p style={{ color: '#999', fontSize: '14px' }}>Redirecting to your dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}