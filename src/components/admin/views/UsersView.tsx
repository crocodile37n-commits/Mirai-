import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Clock,
  UserX,
  UserCheck,
  Filter,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  const fetchUsers = () => {
    setLoading(true);
    adminApi
      .getUsers(searchQuery, statusFilter === 'all' ? undefined : statusFilter)
      .then((res) => {
        setUsers(res.users);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await adminApi.updateUserStatus(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8b5cf6]" />
            <span>User Management</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Registered member accounts, security statuses, and preference records.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user or email..."
              className="h-[36px] w-[200px] sm:w-[240px] pl-9 pr-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="h-[36px] px-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c0c0e] border border-white/[0.08] max-w-[560px] mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-white mb-1">
            No Registered Users Found
          </h3>
          <p className="text-xs text-white/50 max-w-[380px] mx-auto leading-relaxed">
            Registered members who create accounts on the MIRAI website will appear here with activity records and privacy protections.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0c0c0e] border border-white/[0.08] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-white/40 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Preferences</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div>{u.fullName || u.username}</div>
                      <div className="text-[10px] text-white/40 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white/70">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.status === 'active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        <span className="capitalize">{u.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white/50">{u.createdAt?.split('T')[0]}</td>
                    <td className="py-3.5 px-4 text-white/50">{u.lastActiveAt?.split('T')[0]}</td>
                    <td className="py-3.5 px-4 text-white/60">
                      {(u.favoriteGenres || []).slice(0, 2).join(', ') || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          u.status === 'active'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20'
                        }`}
                      >
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
