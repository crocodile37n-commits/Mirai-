import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  LogOut,
  UserPlus,
  Trash2,
  ShieldAlert,
  Loader2,
  Check,
  Crown,
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
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Administrators list state
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  // Invite admin modal / form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdministrators = async () => {
    try {
      setLoadingAdmins(true);
      const res = await adminApi.getAdministrators();
      if (res.success) {
        setAdminsList(res.administrators || []);
        setInvitations(res.invitations || []);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchAdministrators();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!currentPassword) {
      setStatusMsg({ type: 'error', text: 'Current password is required to authorize password update.' });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.updateAccount(currentPassword, undefined, newPassword);
      setStatusMsg({
        type: 'success',
        text: 'Administrator password updated successfully and secured with bcrypt hashing.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update credentials. Check your current password.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg(null);

    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteMsg({ type: 'error', text: 'Please enter a valid administrator Gmail/email address.' });
      return;
    }

    setIsInviting(true);
    try {
      const res = await adminApi.inviteAdministrator(inviteEmail.trim());
      setInviteMsg({
        type: 'success',
        text: res.message || `Administrator permissions granted to ${inviteEmail.trim()}.`,
      });
      setInviteEmail('');
      await fetchAdministrators();
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.message || 'Failed to invite administrator.' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevokeAdmin = async (email: string) => {
    if (!window.confirm(`Revoke administrator access for ${email}?`)) return;

    try {
      const res = await adminApi.revokeAdministrator(email);
      await fetchAdministrators();
      alert(res.message || `Revoked administrator access for ${email}.`);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke administrator.');
    }
  };

  return (
    <div className="space-y-8 select-none max-w-[840px]">
      {/* Header */}
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8b5cf6]" />
            <span>Administrator Accounts &amp; Security</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Backend-verified master credentials, multi-admin management, and secure password changes.
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

      {/* Current Admin Identity Card */}
      <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Site Administrator</span>
              <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[9px] font-bold uppercase tracking-wider">
                Root Access
              </span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-0.5">{adminEmail}</p>
          </div>
        </div>

        <div className="text-right text-xs text-white/40 hidden sm:block">
          <span className="flex items-center gap-1.5 justify-end text-[#22c55e] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" /> Session Active
          </span>
          <span className="text-[10px] mt-0.5 block">Session secured with Bearer token</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: ADD TRUSTED ADMINISTRATOR GMAIL               */}
      {/* ======================================================== */}
      <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-5">
        <div>
          <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#8b5cf6]" />
            <span>Add Trusted Administrator Gmail</span>
          </h3>
          <p className="text-white/50 text-xs mt-1 leading-relaxed">
            Invite another administrator by email address. They will be granted verified administrator privileges on the backend and can sign in using their own credentials or Google login.
          </p>
        </div>

        {inviteMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              inviteMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {inviteMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{inviteMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleInviteSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. coadmin@gmail.com"
              className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isInviting}
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9d6ef8] hover:to-[#8b5cf6] text-white text-xs font-heading font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            <span>Grant Admin Access</span>
          </button>
        </form>

        {/* Existing Administrators Table */}
        <div className="pt-3 border-t border-white/[0.06]">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-3">
            Authorized Administrators ({adminsList.length})
          </h4>

          {loadingAdmins ? (
            <div className="py-6 text-center text-white/40 text-xs">Loading administrators...</div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase text-[10px]">
                    <th className="pb-2.5">Email</th>
                    <th className="pb-2.5">Role</th>
                    <th className="pb-2.5 text-center">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {adminsList.map((adm) => (
                    <tr key={adm.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-mono text-white/90">
                        <div className="flex items-center gap-2">
                          <span>{adm.email}</span>
                          {adm.isOwner && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold uppercase">
                              Owner
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[10px] font-bold">
                          Administrator
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          {adm.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!adm.isOwner && adm.email !== adminEmail && (
                          <button
                            onClick={() => handleRevokeAdmin(adm.email)}
                            className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: CHANGE ADMIN PASSWORD                         */}
      {/* ======================================================== */}
      <form onSubmit={handleUpdatePassword} className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4 text-xs">
        <h3 className="font-heading text-sm font-bold text-white mb-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#8b5cf6]" />
          <span>Change Administrator Password</span>
        </h3>
        <p className="text-white/50 text-xs">
          Update the password used to sign in to the MIRAI Admin Console. Passwords are salted and hashed securely using bcrypt.
        </p>

        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
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

        <div>
          <label className="block text-white/70 font-semibold mb-1">
            Current Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password to authorize changes"
              className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.06]">
          <div>
            <label className="block text-white/70 font-semibold mb-1">
              New Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">
              Confirm New Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-6 rounded-xl bg-white text-black font-bold hover:bg-white/90 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </div>
      </form>
    </div>
  );
};
