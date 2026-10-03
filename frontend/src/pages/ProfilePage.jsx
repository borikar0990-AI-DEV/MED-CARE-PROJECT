import { Bell, Camera, KeyRound, LogOut, Mail, Save, User } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LoadingSpinner } from "../components/common/Feedback";
import { ConfirmationModal } from "../components/common/Modals";
import { Toggle } from "../components/common/Toggle";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/UIContext";
import { extractErrorMessage } from "../services/api";
import { userService } from "../services/resourceServices";
import { getPasswordStrength } from "../utils/validators";

function SectionCard({ title, description, children }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 dark:bg-surface-dark dark:ring-white/5 sm:p-6">
      <p className="font-display text-base font-semibold text-slate-900 dark:text-white">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:text-white";

export default function ProfilePage() {
  const { user, updateUser, logoutAllSessions } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    date_of_birth: user?.date_of_birth || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [notifBrowser, setNotifBrowser] = useState(user?.notif_browser_enabled ?? true);
  const [notifEmail, setNotifEmail] = useState(user?.notif_email_enabled ?? false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [pwError, setPwError] = useState(null);
  const [savingPw, setSavingPw] = useState(false);

  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userService.updateProfile({ ...form, date_of_birth: form.date_of_birth || null });
      updateUser(updated);
      showToast("Profile updated.", "success");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const updated = await userService.uploadPhoto(file);
      updateUser(updated);
      showToast("Profile photo updated.", "success");
    } catch (err) {
      showToast(extractErrorMessage(err, "Couldn't upload that image."), "error");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const saveNotifPrefs = async (patch) => {
    setSavingNotifs(true);
    try {
      const updated = await userService.updateProfile(patch);
      updateUser(updated);
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
    } finally {
      setSavingNotifs(false);
    }
  };

  const toggleBrowserNotifs = (value) => {
    setNotifBrowser(value);
    saveNotifPrefs({ notif_browser_enabled: value });
  };
  const toggleEmailNotifs = (value) => {
    setNotifEmail(value);
    saveNotifPrefs({ notif_email_enabled: value });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(null);
    if (!getPasswordStrength(pwForm.newPassword).meetsMinimum) {
      setPwError("New password must be at least 8 characters, with a letter and a number.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmNewPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await userService.changePassword(pwForm);
      showToast("Password updated.", "success");
      setPwForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setPwError(extractErrorMessage(err, "Could not change your password."));
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllSessions();
      navigate("/login");
    } catch (err) {
      showToast(extractErrorMessage(err), "error");
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account details and preferences.</p>

      <div className="mt-6 flex flex-col gap-5">
        <SectionCard title="Basic Information">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-xl font-semibold text-accent-700 dark:bg-accent-900/50 dark:text-accent-300">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-soft hover:bg-primary-600"
              >
                {uploadingPhoto ? <LoadingSpinner size={13} /> : <Camera size={13} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400"><Mail size={12} /> {user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                <User size={13} className="mr-1 inline" /> Full Name
              </label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Optional" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Date of Birth</label>
              <input type="date" value={form.date_of_birth || ""} onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={savingProfile} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60">
                {savingProfile ? <LoadingSpinner size={15} /> : <Save size={15} />} Save Changes
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Notification Preferences" description="Choose how MediCare should remind you.">
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
            <label className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200"><Bell size={16} className="text-slate-400" /> Browser notifications</span>
              <Toggle checked={notifBrowser} disabled={savingNotifs} onChange={toggleBrowserNotifs} label="Toggle browser notifications" />
            </label>
            <label className="flex items-center justify-between py-3">
              <span className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-200"><Mail size={16} className="text-slate-400" /> Email notifications</span>
              <Toggle checked={notifEmail} disabled={savingNotifs} onChange={toggleEmailNotifs} label="Toggle email notifications" />
            </label>
          </div>
          {notifEmail && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Note: outbound email isn't configured in this demo build — this preference is saved and the backend hook is in place, but no email will actually be sent.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Change Password">
          {pwError && <div className="mb-3 rounded-xl bg-danger-50 px-4 py-2.5 text-sm text-danger-700 dark:bg-danger-900/20 dark:text-danger-300">{pwError}</div>}
          <form onSubmit={handleChangePassword} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                <KeyRound size={13} className="mr-1 inline" /> Current Password
              </label>
              <input type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className={inputClass} required autoComplete="current-password" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className={inputClass} required autoComplete="new-password" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm New Password</label>
              <input type="password" value={pwForm.confirmNewPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmNewPassword: e.target.value }))} className={inputClass} required autoComplete="new-password" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={savingPw} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-primary-600 disabled:opacity-60">
                {savingPw ? <LoadingSpinner size={15} /> : <KeyRound size={15} />} Update Password
              </button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Sessions" description="Sign out of MediCare on every device where you're currently logged in.">
          <button
            type="button"
            onClick={() => setConfirmLogoutAll(true)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-danger-600 ring-1 ring-danger-200 hover:bg-danger-50 dark:text-danger-400 dark:ring-danger-900/50 dark:hover:bg-danger-900/20"
          >
            <LogOut size={15} /> Logout from all sessions
          </button>
        </SectionCard>
      </div>

      <ConfirmationModal
        open={confirmLogoutAll}
        onClose={() => setConfirmLogoutAll(false)}
        onConfirm={handleLogoutAll}
        loading={loggingOutAll}
        title="Logout from all sessions?"
        description="You'll be signed out on every device, including this one, and will need to log in again."
        confirmLabel="Logout everywhere"
      />
    </div>
  );
}
