import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import FormInput from '../../components/ui/FormInput';
import toast from 'react-hot-toast';

const ROLE_LABELS = {
  PATIENT: 'Patient',
  DOCTOR: 'Doctor',
  HOSPITAL_ADMIN: 'Hospital Admin',
  SUPER_ADMIN: 'Super Admin',
};

function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // ─── Profile Update ──────────────────────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((p) => ({ ...p, [name]: value }));
    if (profileErrors[name]) setProfileErrors((p) => ({ ...p, [name]: '' }));
  };

  const validateProfile = () => {
    const errs = {};
    if (!profileForm.full_name.trim()) errs.full_name = 'Full name is required.';
    if (profileForm.phone_number && !/^\d{10,15}$/.test(profileForm.phone_number))
      errs.phone_number = 'Phone must be 10–15 digits.';
    return errs;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }

    setIsSavingProfile(true);
    try {
      const data = await authService.updateProfile(profileForm);
      updateUser(data.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
      const serverErrs = err.response?.data || {};
      setProfileErrors(serverErrs);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ─── Password Change ─────────────────────────────────────────────────────
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((p) => ({ ...p, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors((p) => ({ ...p, [name]: '' }));
  };

  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.old_password) errs.old_password = 'Current password is required.';
    if (!passwordForm.new_password) errs.new_password = 'New password is required.';
    else if (passwordForm.new_password.length < 8) errs.new_password = 'Min. 8 characters.';
    if (passwordForm.new_password !== passwordForm.new_password_confirm)
      errs.new_password_confirm = 'Passwords do not match.';
    return errs;
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    const errs = validatePassword();
    if (Object.keys(errs).length) { setPasswordErrors(errs); return; }

    setIsSavingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success('Password changed! Please log in again.');
      setPasswordForm({ old_password: '', new_password: '', new_password_confirm: '' });
    } catch (err) {
      const serverErrs = err.response?.data || {};
      if (typeof serverErrs === 'object') {
        const mapped = {};
        Object.entries(serverErrs).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : v;
        });
        setPasswordErrors(mapped);
      }
      toast.error('Failed to change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account information and security settings.</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        {/* Avatar + info header */}
        <div className="flex items-center gap-5 pb-6 mb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                ${user?.role === 'PATIENT' ? 'bg-blue-100 text-blue-700' :
                  user?.role === 'DOCTOR' ? 'bg-green-100 text-green-700' :
                  user?.role === 'HOSPITAL_ADMIN' ? 'bg-purple-100 text-purple-700' :
                  'bg-red-100 text-red-700'}`}>
                {ROLE_LABELS[user?.role]}
              </span>
              {user?.is_verified
                ? <span className="text-xs text-green-600 flex items-center gap-1 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full" />Verified</span>
                : <span className="text-xs text-amber-600 flex items-center gap-1 font-medium"><span className="w-2 h-2 bg-amber-500 rounded-full" />Pending Verification</span>}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Full Name"
              name="full_name"
              value={profileForm.full_name}
              onChange={handleProfileChange}
              error={profileErrors.full_name}
              required
            />
            <FormInput
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={profileForm.phone_number}
              onChange={handleProfileChange}
              error={profileErrors.phone_number}
              placeholder="10–15 digits"
            />
          </div>
          {/* Read-only fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput label="Email Address" name="email" value={user?.email || ''} disabled />
            <FormInput label="Role" name="role" value={ROLE_LABELS[user?.role] || ''} disabled />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSavingProfile} className="btn-primary flex items-center gap-2">
              {isSavingProfile && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Change Password</h3>
        <p className="text-sm text-gray-500 mb-5">Ensure your account stays secure with a strong password.</p>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <FormInput
            label="Current Password"
            name="old_password"
            type="password"
            value={passwordForm.old_password}
            onChange={handlePasswordChange}
            error={passwordErrors.old_password}
            placeholder="Enter current password"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="New Password"
              name="new_password"
              type="password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
              error={passwordErrors.new_password}
              placeholder="Min. 8 characters"
              hint="At least 8 characters."
              required
            />
            <FormInput
              label="Confirm New Password"
              name="new_password_confirm"
              type="password"
              value={passwordForm.new_password_confirm}
              onChange={handlePasswordChange}
              error={passwordErrors.new_password_confirm}
              placeholder="Re-enter new password"
              required
            />
          </div>
          {passwordErrors.non_field_errors && (
            <p className="text-sm text-red-600">{passwordErrors.non_field_errors}</p>
          )}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={isSavingPassword} className="btn-primary flex items-center gap-2">
              {isSavingPassword && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
