import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileText,
  ShieldCheck,
  ExternalLink,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { BrandLogo, MiraiAvatar } from '../common/BrandLogo';
import { useApp } from '../../context/AppContext';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'analytics'
  | 'settings'
  | 'admin-account'
  | 'system-logs';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab = 'overview',
  onTabChange,
}) => {
  const { navigateToHome, userProfile, logout, showToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems: Array<{ id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'overview', label: 'Dashboard & Live Activity', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'analytics', label: 'Real-Time Analytics', icon: BarChart3 },
    { id: 'admin-account', label: 'Admin Accounts & Security', icon: ShieldCheck },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'system-logs', label: 'Audit Logs', icon: FileText },
  ];

  const handleNavClick = (tabId: AdminTab) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#060607] text-white flex select-none overflow-x-hidden font-sans">
      {/* Background Ambient Violet Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-[20%] w-[600px] h-[600px] rounded-full bg-[#8b5cf6]/10 blur-[140px]" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[#ec4899]/5 blur-[160px]" />
      </div>

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* SIDEBAR NAVIGATION (Desktop Fixed, Mobile Slide-over) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[270px] bg-[#0c0c0e]/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandLogo onClick={navigateToHome} />
              <span className="px-2 py-0.5 rounded-[6px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[10px] font-bold tracking-wider uppercase">
                Admin
              </span>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              aria-label="Close admin menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-white/50 bg-white/[0.03] p-2 rounded-xl border border-white/[0.06]">
            <span className="flex items-center gap-1.5 text-[#22c55e] font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              Node: AP-SE1 (Tokyo)
            </span>
            <span className="text-[10px] text-white/40 font-mono">v80.4.1</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-3 mb-2">
            Control Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full h-[40px] px-3.5 rounded-xl flex items-center justify-between text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-[0_4px_16px_rgba(255,255,255,0.2)]'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-black/15 text-black font-bold'
                        : 'bg-white/10 text-white/60'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/[0.06]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-3 mb-2">
              Public Interface
            </div>

            <button
              onClick={navigateToHome}
              className="w-full h-[38px] px-3.5 rounded-xl flex items-center justify-between text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-[#8b5cf6]" />
                <span>Exit to Mirai Web</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-white/30" />
            </button>
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3.5 border-t border-white/[0.08] bg-black/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2.5 min-w-0">
              <MiraiAvatar size={34} avatarUrl={userProfile?.avatarUrl} />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {userProfile?.fullName || userProfile?.username || 'Admin Operator'}
                </p>
                <p className="text-[10px] text-white/40 truncate">Role: Super Administrator</p>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                showToast('Signed Out', 'Admin session terminated.', 'info');
              }}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:pl-[270px] flex flex-col min-h-screen relative z-10">
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-30 h-[64px] bg-[#0c0c0e]/80 backdrop-blur-xl border-b border-white/[0.08] px-5 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white"
              aria-label="Open admin sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb info */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <span>Console</span>
                <span>/</span>
                <span className="text-white/80 font-medium capitalize">{activeTab}</span>
              </div>
              <h1 className="font-heading text-sm sm:text-base font-extrabold text-white tracking-tight">
                {activeTab === 'overview'
                  ? 'Real-Time Operational Analytics'
                  : activeTab === 'analytics'
                  ? 'Real-Time Traffic & Streaming Telemetry'
                  : activeTab === 'users'
                  ? 'User Directory & Access Control'
                  : activeTab === 'admin-account'
                  ? 'Administrator Accounts & Security'
                  : activeTab === 'system-logs'
                  ? 'System Logs & Security Audit'
                  : 'Website Global Settings'}
              </h1>
            </div>
          </div>

          {/* Top Bar Quick Controls */}
          <div className="flex items-center gap-3">
            {/* Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#c084fc] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span>Admin Plane Online</span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => showToast('Notifications', 'No unresolved system incidents.', 'info')}
              className="relative w-9 h-9 rounded-full glass flex items-center justify-center text-white/70 hover:text-white hover:scale-105 active:scale-95 transition-all"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#8b5cf6]" />
            </button>

            {/* Quick Add Content Action */}
            <button
              onClick={() => showToast('Catalog Ingest', 'Ready for batch ingestion.', 'info')}
              className="h-[36px] px-4 rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_12px_rgba(255,255,255,0.2)] active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Content</span>
            </button>
          </div>
        </header>

        {/* Dynamic Admin Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
};
