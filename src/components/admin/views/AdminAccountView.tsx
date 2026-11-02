import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Clock,
  Shield,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

interface AdminAccountViewProps {
  adminEmail: string;
  onLogout: () => void;
}

export const AdminAccountView: React.FC<AdminAccountViewProps> = ({
  adminEmail,
  onLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!currentPassword) {
      setStatusMsg({ type: 'error', text: 'Current password is required to authorize changes.' });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await adminApi.updateAccount(
        currentPassword,
        newEmail.trim() || undefined,
        newPassword.trim() || undefined
      );
      setStatusMsg({
        type: 'success',
        text: 'Administrator credentials updated securely with Scrypt cryptographic hashing.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update credentials.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-[760px]">
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8b5cf6]" />
            <span>Administrator Account &amp; Credentials</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Backend-verified master credentials and active session control.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="h-[36px] px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Current Admin Identity Card */}
      <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Site Owner &amp; Administrator</span>
              <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[9px] font-bold uppercase tracking-wider">
                Full Authorization
              </span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-0.5">{adminEmail}</p>
          </div>
        </div>

        <div className="text-right text-xs text-white/40 hidden sm:block">
          <span className="flex items-center gap-1.5 justify-end text-[#22c55e] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Session Active
          </span>
          <span className="text-[10px] mt-0.5 block">Expires in 24h</span>
        </div>
      </div>

      {/* Update Credentials Form */}
      <form onSubmit={handleUpdate} className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4 text-xs">
        <h3 className="font-heading text-sm font-bold text-white mb-2 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#8b5cf6]" />
          <span>Update Admin Credentials</span>
        </h3>

        <div>
          <label className="block text-white/70 font-semibold mb-1">
            Current Master Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password to authorize changes"
              className="w-full h-[38px] pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
          <div>
            <label className="block text-white/70 font-semibold mb-1">
              New Administrator Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full h-[38px] pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">
              New Password (Optional)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full h-[38px] pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {newPassword && (
          <div>
            <label className="block text-white/70 font-semibold mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-[38px] pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="h-[40px] px-6 rounded-xl bg-white text-black font-bold hover:bg-white/90 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Update Admin Credentials'}
          </button>
        </div>
      </form>
    </div>
  );
};
