import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import toast from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/auth`
  : 'http://localhost:8000/api/v1/auth';

const ROLE_OPTIONS = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'HOSPITAL_ADMIN', label: 'Hospital Admin' },
];

const ROLE_INFO = {
  PATIENT: { color: 'blue', desc: 'Book appointments, view prescriptions & medical records.' },
  DOCTOR: { color: 'green', desc: 'Manage appointments, write prescriptions, consult patients.' },
  HOSPITAL_ADMIN: { color: 'purple', desc: 'Manage hospital, verify doctors & hospital operations.' },
};

// ─── OTP Input Component ──────────────────────────────────────────────────────
function OTPInput({ value, onChange, length = 6 }) {
  const refsContainer = React.useRef([]);
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
    <div className="flex gap-2 justify-center my-4">
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
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-primary-400 rounded-lg outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-200 text-gray-800"
        />
      ))}
    </div>
  );
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);

  React.useEffect(() => {
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
    <span className={remaining < 60 ? 'text-red-500 font-bold' : 'text-primary-600 font-bold'}>
      {m}:{s}
    </span>
  );
}

// ─── Main RegisterPage ────────────────────────────────────────────────────────
const STEPS = { FORM: 'form', EMAIL_OTP: 'email_otp', SUCCESS: 'success' };

function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.FORM);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    role: 'PATIENT',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [sessionEmail, setSessionEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required.';
    else if (formData.full_name.trim().length < 3) errs.full_name = 'Name must be at least 3 characters.';

    if (!formData.email) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address.';

    if (formData.phone_number && !/^\d{10,15}$/.test(formData.phone_number))
      errs.phone_number = 'Phone must be 10–15 digits.';

    if (!formData.role) errs.role = 'Please select your role.';

    if (!formData.password) errs.password = 'Password is required.';
    else if (formData.password.length < 8) errs.password = 'Password must be at least 8 characters.';

    if (!formData.password_confirm) errs.password_confirm = 'Please confirm your password.';
    else if (formData.password !== formData.password_confirm)
      errs.password_confirm = 'Passwords do not match.';

    return errs;
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/send-otp/`, formData);
      setSessionEmail(formData.email);
      setOtpExpired(false);
      setStep(STEPS.EMAIL_OTP);
      toast.success('OTP sent to your email!');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
        toast.error('Please fix the errors below.');
      } else {
        toast.error(data?.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify Email OTP ────────────────────────────────────────────────
  const handleVerifyEmail = async () => {
    if (emailOtp.length < 6) { toast.error('Please enter the 6-digit OTP.'); return; }
    setIsLoading(true);
    try {
      await axios.post(`${API_BASE}/verify-email-otp/`, {
        email: sessionEmail,
        otp: emailOtp,
      });
      await handleCompleteRegistration();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Complete Registration ───────────────────────────────────────────
  const handleCompleteRegistration = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/complete-registration/`, {
        email: sessionEmail,
      });
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setStep(STEPS.SUCCESS);
      toast.success('Account created successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setIsLoading(true);
    setOtpExpired(false);
    try {
      await axios.post(`${API_BASE}/resend-otp/`, { email: sessionEmail });
      setEmailOtp('');
      toast.success('OTP resent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleInfo = ROLE_INFO[formData.role];

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-2xl p-8">

        {/* ── Step 1: Registration Form ── */}
        {step === STEPS.FORM && (
          <>
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-500 text-sm mt-1">Join the HealthCare Platform</p>
            </div>

            {selectedRoleInfo && (
              <div className={`mb-5 p-3 rounded-lg text-sm border
                ${formData.role === 'PATIENT' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  formData.role === 'DOCTOR' ? 'bg-green-50 border-green-200 text-green-700' :
                  'bg-purple-50 border-purple-200 text-purple-700'}`}>
                <p className="font-medium">{formData.role.replace('_', ' ')}</p>
                <p className="text-xs mt-0.5 opacity-80">{selectedRoleInfo.desc}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormInput
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                error={errors.full_name}
                placeholder="Your full name"
                required
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="abc@gmail.com"
                required
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <FormInput
                label="Phone Number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                error={errors.phone_number}
                placeholder="your phone number"
                hint="Optional — 10 to 15 digits"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />

              <FormSelect
                label="Register As"
                name="role"
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                options={ROLE_OPTIONS}
                required
              />

              {/* Password */}
              <div className="w-full">
                <label className="input-label">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-400 focus:ring-red-400 bg-red-50' : ''}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
              </div>

              <FormInput
                label="Confirm Password"
                name="password_confirm"
                type={showPassword ? 'text' : 'password'}
                value={formData.password_confirm}
                onChange={handleChange}
                error={errors.password_confirm}
                placeholder="Re-enter your password"
                required
              />

              {errors.non_field_errors && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {errors.non_field_errors}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base mt-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP & Continue'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── Step 2: Email OTP ── */}
        {step === STEPS.EMAIL_OTP && (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">📧</div>
              <h1 className="text-2xl font-bold text-gray-900">Verify Your Email</h1>
              <p className="text-gray-500 text-sm mt-1">
                OTP sent to <span className="font-semibold text-gray-700">{sessionEmail}</span>
              </p>
            </div>

            <OTPInput value={emailOtp} onChange={setEmailOtp} />

            <div className="text-center text-sm text-gray-500 mb-4">
              OTP expires in: {!otpExpired
                ? <CountdownTimer seconds={600} onExpire={() => setOtpExpired(true)} />
                : <span className="text-red-500 font-semibold">Expired!</span>
              }
            </div>

            <button
              onClick={handleVerifyEmail}
              disabled={isLoading || emailOtp.length < 6}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : 'Verify Email OTP'}
            </button>

            <div className="text-center mt-4 space-y-2">
              <button
                onClick={handleResend}
                disabled={isLoading}
                className="text-sm text-primary-600 hover:underline"
              >
                Didn't receive OTP? Resend
              </button>
              <br />
              <button
                onClick={() => { setStep(STEPS.FORM); setEmailOtp(''); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ← Go back and edit your details
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === STEPS.SUCCESS && (
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900">Account Created!</h1>
            <p className="text-gray-500 text-sm mt-2">Redirecting to your dashboard...</p>
            <div className="mt-4 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-primary-600 rounded-full animate-spin" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default RegisterPage;