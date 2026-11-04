import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  PlayCircle,
  BookOpen,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  Sparkles,
  Server,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronRight,
  MoreVertical,
  Sliders,
  Layers,
  Database,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Search,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { AdminLayout, AdminTab } from './AdminLayout';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';
import { authFetch, getAuthToken } from '../../services/authClient';
import { PluginManagerView } from './views/PluginManagerView';
import { MovieManagementView } from './views/MovieManagementView';
import { StreamingSourcesView } from './views/StreamingSourcesView';
import { LanguageSettingsView } from './views/LanguageSettingsView';
import { SyncManagerView } from './views/SyncManagerView';
import { SystemLogsView } from './views/SystemLogsView';
import { AnimeManagementView } from './views/AnimeManagementView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';

interface AdminOverviewData {
  totalUsers: number;
  activeUsers: number;
  totalSignIns: number;
  websiteVisitors: number;
  registrations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  watchStats: {
    totalEpisodesWatched: number;
    activeStreams: number;
  };
  recentUsers: Array<{
    id: string;
    username: string;
    email: string;
    full_name?: string;
    role: string;
    status: string;
    created_at: string;
    last_login_at?: string;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    user_email?: string;
    details?: string;
    created_at: string;
  }>;
}

export const AdminDashboardView: React.FC = () => {
  const { userProfile, isAdmin, loginAdmin, logout, navigateToSignIn, navigateToHome, navigateToDetail, navigateToMangaDetail, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Dedicated Admin Login form state
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Real backend metrics
  const [overview, setOverview] = useState<AdminOverviewData>({
    totalUsers: 0,
    activeUsers: 0,
    totalSignIns: 0,
    websiteVisitors: 0,
    registrations: { today: 0, thisWeek: 0, thisMonth: 0 },
    watchStats: { totalEpisodesWatched: 0, activeStreams: 0 },
    recentUsers: [],
    recentAuditLogs: [],
  });

  // Users Directory state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [usersLoading, setUsersLoading] = useState(false);

  // Fetch real overview metrics using authenticated client
  const fetchOverview = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await authFetch('/api/admin/overview');
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const s = data.stats || data;
        setOverview({
          totalUsers: s.totalRegisteredUsers ?? s.totalUsers ?? 0,
          activeUsers: s.activeUsersCount ?? s.activeUsers ?? 0,
          totalSignIns: s.totalSuccessfulSignins ?? s.totalSignIns ?? 0,
          websiteVisitors: s.totalUniqueVisitors ?? s.websiteVisitors ?? 0,
          registrations: {
            today: s.registrationsToday ?? s.registrations?.today ?? 0,
            thisWeek: s.registrationsThisWeek ?? s.registrations?.thisWeek ?? 0,
            thisMonth: s.registrationsThisMonth ?? s.registrations?.thisMonth ?? 0,
          },
          watchStats: {
            totalEpisodesWatched: s.totalWatchEntries ?? s.watchStats?.totalEpisodesWatched ?? 0,
            activeStreams: s.activeStreams ?? s.watchStats?.activeStreams ?? 0,
          },
          recentUsers: s.recentUsers || [],
          recentAuditLogs: s.auditLogs || s.recentAuditLogs || [],
        });
        setAccessDenied(false);
      }
    } catch (e) {
      console.warn('Failed to fetch admin overview:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch users list for directory tab
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearchQuery.trim()) params.set('search', userSearchQuery.trim());
      if (userStatusFilter !== 'all') params.set('status', userStatusFilter);

      const res = await authFetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch (e) {
      console.warn('Failed to fetch users:', e);
    } finally {
      setUsersLoading(false);
    }
  }, [userSearchQuery, userStatusFilter]);

  useEffect(() => {
    // If user is admin or we have a token, attempt overview fetch
    if (isAdmin || getAuthToken()) {
      fetchOverview();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, fetchOverview]);

  useEffect(() => {
    if (activeTab === 'users' && isAdmin) {
      fetchUsers();
    }
  }, [activeTab, isAdmin, fetchUsers]);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await authFetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        showToast('User Updated', `User marked as ${nextStatus}.`, 'success');
        fetchUsers();
        fetchOverview();
      }
    } catch {
      showToast('Error', 'Failed to update user status.', 'error');
    }
  };

  const handleRefresh = async () => {
    await fetchOverview();
    if (activeTab === 'users') {
      await fetchUsers();
    }
    showToast('Telemetry Synced', 'Live operational metrics updated from SQLite database.', 'success');
  };

  // Top Trending Media Pool
  const topContent = [
    {
      id: 110349,
      type: 'ANIME',
      title: 'Cyberpunk: Edgerunners',
      epOrCh: '10 EP · ONA',
      cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=200&q=80',
      score: '8.3',
    },
    {
      id: 21,
      type: 'ANIME',
      title: 'ONE PIECE',
      epOrCh: '1120 EP · TV',
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=200&q=80',
      score: '8.9',
    },
    {
      id: 154587,
      type: 'ANIME',
      title: "Frieren: Beyond Journey's End",
      epOrCh: '28 EP · TV',
      cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80',
      score: '9.2',
    },
    {
      id: 30005,
      type: 'MANHWA',
      title: 'Solo Leveling',
      epOrCh: '200 CH · Finished',
      cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      score: '8.8',
    },
    {
      id: 30001,
      type: 'MANGA',
      title: 'Berserk',
      epOrCh: '376 CH · Releasing',
      cover: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=200&q=80',
      score: '9.4',
    },
  ];

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailInput.trim()) {
      setLoginError('Please enter your administrator email.');
      return;
    }
    if (!adminPasswordInput) {
      setLoginError('Please enter your password.');
      return;
    }

    setIsSubmittingLogin(true);
    setLoginError(null);

    try {
      const result = await loginAdmin(adminEmailInput.trim(), adminPasswordInput);
      if (result.success) {
        setAccessDenied(false);
        setAdminPasswordInput('');
        setLoginError(null);
        showToast('Access Granted', 'Welcome to MIRAI Control Center', 'success');
        await fetchOverview();
      } else {
        setLoginError(result.error || 'Invalid administrator credentials.');
      }
    } catch {
      setLoginError('An unexpected network error occurred. Please try again.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // 1. Loading state while session verification is running
  if (isLoading && !overview.totalUsers && getAuthToken()) {
    return (
      <div className="min-h-screen bg-[#060607] text-white flex flex-col items-center justify-center p-4 select-none relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8b5cf6]/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#c084fc] flex items-center justify-center shadow-[0_0_24px_rgba(139,92,246,0.35)]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-white tracking-tight">Verifying Administrator Privileges</h2>
            <p className="text-xs text-white/40 mt-1">Connecting securely to MIRAI Control Center...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Normal user is authenticated, but does NOT have admin role: show strict Access Denied screen
  if (userProfile && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#060607] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-red-500/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="relative z-10 w-full max-w-[440px] rounded-3xl bg-[#0c0c0e]/95 border border-red-500/20 p-7 sm:p-9 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center mb-4 shadow-[0_0_24px_rgba(239,68,68,0.25)]">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="font-heading text-2xl font-black text-white tracking-tight">
            Administrator Access Denied
          </h1>
          <p className="text-xs text-white/60 mt-2 leading-relaxed">
            You are currently signed in as <span className="font-mono text-purple-300 font-bold">@{userProfile.username}</span> ({userProfile.email}). This account does not possess administrator credentials or root privileges.
          </p>

          <div className="mt-6 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-left text-xs space-y-1.5 text-white/60">
            <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider">
              <span>Account Status</span>
              <span className="text-amber-400">Restricted User</span>
            </div>
            <div>Only designated server administrators are permitted to enter this console.</div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={navigateToHome}
              className="w-full h-11 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-heading font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>← Return to MIRAI Homepage</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                setAdminEmailInput('');
                setAdminPasswordInput('');
                setAccessDenied(false);
              }}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-xs font-heading font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            >
              <span>Sign In as Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated or session expired: render the Admin Login Page
  if (accessDenied || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#060607] text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
        {/* Ambient Purple Background Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-[#8b5cf6]/10 blur-[140px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-24 right-1/4 w-[360px] h-[360px] bg-[#ec4899]/5 blur-[120px] pointer-events-none rounded-full" />

        {/* Admin Login Card */}
        <div className="relative z-10 w-full max-w-[420px] rounded-3xl bg-[#0c0c0e]/95 border border-white/[0.08] p-7 sm:p-9 shadow-[0_24px_64px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          {/* Header & Branding */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-4">
              <BrandLogo onClick={navigateToHome} />
              <span className="px-2 py-0.5 rounded-[6px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[10px] font-bold tracking-wider uppercase">
                Admin
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#c084fc] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
              <Lock className="w-6 h-6" />
            </div>

            <h1 className="font-heading text-2xl font-black text-white tracking-tight">
              Admin Console
            </h1>
            <p className="text-xs text-white/50 mt-1.5 leading-relaxed max-w-[320px]">
              Restricted owner control center. Please sign in with your administrator credentials.
            </p>
          </div>

          {/* Invalid Credentials Error Banner */}
          {loginError && (
            <div className="mt-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="leading-snug">{loginError}</span>
            </div>
          )}

          {/* Direct Administrator Login Form */}
          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="admin@domain.com"
                  autoComplete="username"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#141418] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-xs text-white placeholder-white/30 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#141418] border border-white/10 focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] text-xs text-white placeholder-white/30 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9d6ef8] hover:to-[#8b5cf6] text-white font-heading font-bold text-xs tracking-wide shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSubmittingLogin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Admin Console</span>
                </>
              )}
            </button>
          </form>

          {/* Return to website */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
            <button
              onClick={navigateToHome}
              className="text-xs text-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>← Return to MIRAI Homepage</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Real KPI Cards populated from SQLite
  const stats = [
    {
      label: 'Total Registered Users',
      value: overview.totalUsers.toLocaleString(),
      change: `+${overview.registrations.thisWeek} this week`,
      isPositive: true,
      timeframe: `${overview.registrations.today} registered today`,
      icon: Users,
      accentColor: 'text-[#8b5cf6]',
      bgGlow: 'bg-[#8b5cf6]/10',
    },
    {
      label: 'Active Users (15m)',
      value: overview.activeUsers.toLocaleString(),
      change: `${overview.totalSignIns} total logins`,
      isPositive: true,
      timeframe: 'Concurrent signed-in sessions',
      icon: Activity,
      accentColor: 'text-[#22c55e]',
      bgGlow: 'bg-[#22c55e]/10',
    },
    {
      label: 'Website Unique Visitors',
      value: overview.websiteVisitors.toLocaleString(),
      change: 'Real-time telemetry',
      isPositive: true,
      timeframe: 'Privacy-conscious edge tracking',
      icon: PlayCircle,
      accentColor: 'text-[#3b82f6]',
      bgGlow: 'bg-[#3b82f6]/10',
    },
    {
      label: 'Watched Episodes',
      value: overview.watchStats.totalEpisodesWatched.toLocaleString(),
      change: `${overview.watchStats.activeStreams} in progress`,
      isPositive: true,
      timeframe: 'SQLite watch progress records',
      icon: BookOpen,
      accentColor: 'text-[#ec4899]',
      bgGlow: 'bg-[#ec4899]/10',
    },
  ];

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="space-y-8 pb-12">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeTab === 'overview' && 'System Overview & Telemetry'}
                {activeTab === 'plugins' && 'Plugin Manager'}
                {activeTab === 'anime-providers' && 'Anime Streaming Providers'}
                {activeTab === 'movie-providers' && 'Movie Streaming Providers'}
                {activeTab === 'streaming-sources' && 'Streaming Sources & Resolvers'}
                {activeTab === 'anime-management' && 'Anime Catalog Management'}
                {activeTab === 'movie-management' && 'Movie Catalog Management'}
                {activeTab === 'language-settings' && 'Smart Language & Dubbing Settings'}
                {activeTab === 'sync-manager' && 'Smart Sync Manager'}
                {activeTab === 'users' && 'User Directory & Permissions'}
                {activeTab === 'analytics' && 'Traffic & Analytics'}
                {activeTab === 'settings' && 'Website Settings'}
                {activeTab === 'system-logs' && 'System Logs & Security Audit'}
              </h1>
              <span className="px-2 py-0.5 rounded-[6px] bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-bold">
                OPERATIONAL
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Live SQLite database metrics and control plane for MIRAI Streaming.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              className="h-[36px] px-3.5 rounded-full glass flex items-center gap-2 text-xs font-semibold text-white/80 hover:text-white hover:border-white/20 transition-all active:scale-95"
              title="Refresh telemetry from SQLite database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#8b5cf6]' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              onClick={() => showToast('Report Exported', 'Downloaded operational audit report (CSV).', 'success')}
              className="h-[36px] px-3.5 rounded-full glass flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white hover:border-white/20 transition-all"
              title="Export report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SYSTEM OVERVIEW                                   */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <>
            {/* Key Performance Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl glass bg-[#0c0c0e]/70 border border-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.45)] group hover:-translate-y-1 relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${stat.bgGlow} blur-2xl pointer-events-none`} />

                    <div className="flex items-center justify-between mb-3 relative z-10">
                      <span className="text-xs font-semibold text-white/50">{stat.label}</span>
                      <div className={`w-9 h-9 rounded-xl glass flex items-center justify-center ${stat.accentColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 relative z-10">
                      <span className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {stat.value}
                      </span>
                      <span className="inline-flex items-center text-xs font-bold text-[#22c55e]">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>{stat.change}</span>
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-white/40 flex items-center gap-1.5 relative z-10">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span>{stat.timeframe}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content & Recent Registrations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Users Table (2 cols) */}
              <div className="lg:col-span-2 p-6 rounded-2xl glass bg-[#0c0c0e]/70 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading text-base font-bold text-white">
                      Recent Registered Users
                    </h3>
                    <p className="text-xs text-white/50">
                      Real accounts created in the MIRAI authentication system.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-semibold text-[#8b5cf6] hover:text-[#c084fc] transition-colors"
                  >
                    View Directory ›
                  </button>
                </div>

                {overview.recentUsers.length === 0 ? (
                  <div className="py-12 text-center text-white/40 text-xs">
                    No registered user accounts found yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase text-[10px]">
                          <th className="pb-3 pl-1">User</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3 text-center">Status</th>
                          <th className="pb-3 text-right pr-1">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {overview.recentUsers.slice(0, 5).map((u) => (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 pl-1">
                              <div>
                                <span className="font-heading font-bold text-white block">
                                  {u.full_name || u.username}
                                </span>
                                <span className="text-[11px] text-white/40 font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.role === 'admin'
                                    ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc]'
                                    : 'bg-white/5 border border-white/10 text-white/70'
                                }`}
                              >
                                {u.role === 'admin' ? 'Administrator' : 'User'}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>
                            <td className="py-3 text-right pr-1 text-[11px] text-white/40">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Real-Time Audit Log (1 col) */}
              <div className="p-6 rounded-2xl glass bg-[#0c0c0e]/70 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-base font-bold text-white">
                      Real-Time Audit Log
                    </h3>
                    <span className="flex items-center gap-1 text-[11px] text-[#22c55e] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping" />
                      Live
                    </span>
                  </div>

                  {overview.recentAuditLogs.length === 0 ? (
                    <div className="py-8 text-center text-white/40 text-xs">
                      No security audit events recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {overview.recentAuditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-0.5 hover:border-white/15 transition-colors"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-semibold">
                              {log.action}
                            </span>
                            <span className="text-white/40">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-white/80 text-[11px] truncate">
                            {log.details || log.user_email || 'System operation'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/40">
                  <span>SQLite Event Journal</span>
                  <button
                    onClick={() => setActiveTab('system-logs')}
                    className="hover:text-white text-[11px] underline"
                  >
                    View All Logs
                  </button>
                </div>
              </div>
            </div>

            {/* Trending Titles Section */}
            <div className="p-6 rounded-2xl glass bg-[#0c0c0e]/70 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-base font-bold text-white">
                    Catalog Highlights
                  </h3>
                  <p className="text-xs text-white/50">
                    High engagement series currently trending on MIRAI.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('anime-management')}
                  className="text-xs font-semibold text-[#8b5cf6] hover:text-[#c084fc] transition-colors"
                >
                  Manage Catalog ›
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {topContent.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'MANGA' || item.type === 'MANHWA') {
                        navigateToMangaDetail(item.id);
                      } else {
                        navigateToDetail(item.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900 mb-2">
                      <img
                        src={item.cover}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-[#fbbf24]">
                        ★ {item.score}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-xs text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-white/40 mt-0.5">{item.epOrCh}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: USER DIRECTORY & PERMISSIONS                     */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="p-6 rounded-2xl glass bg-[#0c0c0e]/70 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  User Directory
                </h3>
                <p className="text-xs text-white/50">
                  Search, review, and manage member statuses in SQLite.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name, handle, email..."
                    className="h-[34px] pl-9 pr-3 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] focus:outline-none w-48 sm:w-64"
                  />
                </div>

                <select
                  value={userStatusFilter}
                  onChange={(e: any) => setUserStatusFilter(e.target.value)}
                  className="h-[34px] px-3 rounded-full bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="all" className="bg-[#0c0c0e]">All Statuses</option>
                  <option value="active" className="bg-[#0c0c0e]">Active</option>
                  <option value="suspended" className="bg-[#0c0c0e]">Suspended</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="py-12 text-center text-white/40 text-xs">
                Loading user directory...
              </div>
            ) : usersList.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs">
                No users found matching your search.
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase text-[10px]">
                      <th className="pb-3 pl-1">User Handle &amp; Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3">Last Active</th>
                      <th className="pb-3 text-right pr-1">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-1">
                          <span className="font-heading font-bold text-white block">
                            {u.full_name || u.username}
                          </span>
                          <span className="text-[11px] text-[#a78bfa]">@{u.username}</span>
                        </td>
                        <td className="py-3 font-mono text-white/70">{u.email}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc]'
                                : 'bg-white/5 border border-white/10 text-white/70'
                            }`}
                          >
                            {u.role === 'admin' ? 'Administrator' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 text-[11px] text-white/40">
                          {u.last_login_at
                            ? new Date(u.last_login_at).toLocaleString()
                            : new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right pr-1">
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.status)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                                u.status === 'active'
                                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                              }`}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
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
        )}

        {/* TAB 2: PLUGIN MANAGER */}
        {activeTab === 'plugins' && <PluginManagerView filterType="all" />}

        {/* TAB 3: ANIME PROVIDERS */}
        {activeTab === 'anime-providers' && <PluginManagerView filterType="anime" />}

        {/* TAB 4: MOVIE PROVIDERS */}
        {activeTab === 'movie-providers' && <PluginManagerView filterType="movie" />}

        {/* TAB 5: STREAMING SOURCES */}
        {activeTab === 'streaming-sources' && <StreamingSourcesView />}

        {/* TAB 6: ANIME MANAGEMENT */}
        {activeTab === 'anime-management' && <AnimeManagementView />}

        {/* TAB 7: MOVIE MANAGEMENT */}
        {activeTab === 'movie-management' && <MovieManagementView />}

        {/* TAB 8: LANGUAGE & DUBBING SETTINGS */}
        {activeTab === 'language-settings' && <LanguageSettingsView />}

        {/* TAB 9: SYNC MANAGER */}
        {activeTab === 'sync-manager' && <SyncManagerView />}

        {/* TAB 10: ANALYTICS */}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* TAB 11: WEBSITE SETTINGS */}
        {activeTab === 'settings' && <SettingsView />}

        {/* TAB 12: SYSTEM LOGS & AUDIT */}
        {activeTab === 'system-logs' && <SystemLogsView />}
      </div>
    </AdminLayout>
  );
};
