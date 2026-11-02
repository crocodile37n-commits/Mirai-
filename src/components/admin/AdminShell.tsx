import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Tv,
  BookOpen,
  Activity,
  Megaphone,
  Sparkles,
  HeartHandshake,
  DollarSign,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { OverviewView } from './views/OverviewView';
import { AnalyticsView } from './views/AnalyticsView';
import { UsersView } from './views/UsersView';
import { AnimeManagementView } from './views/AnimeManagementView';
import { MangaManagementView } from './views/MangaManagementView';
import { WatchActivityView } from './views/WatchActivityView';
import { AdsManagerView } from './views/AdsManagerView';
import { AnnouncementsView } from './views/AnnouncementsView';
import { DonationManagerView } from './views/DonationManagerView';
import { RevenueView } from './views/RevenueView';
import { SettingsView } from './views/SettingsView';
import { AdminAccountView } from './views/AdminAccountView';
import { adminApi } from '../../services/adminApi';

interface AdminShellProps {
  adminEmail: string;
  onExitAdmin: () => void;
}

export const AdminShell: React.FC<AdminShellProps> = ({ adminEmail, onExitAdmin }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const handleLogout = async () => {
    await adminApi.logout();
    onExitAdmin();
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'anime-management', label: 'Anime Management', icon: Tv },
    { id: 'manga-management', label: 'Manga Management', icon: BookOpen },
    { id: 'watch-activity', label: 'Watch Activity', icon: Activity },
    { id: 'ads', label: 'Advertisement Manager', icon: Megaphone, badge: 'OFF' },
    { id: 'announcements', label: 'Pop-up & Announcements', icon: Sparkles },
    { id: 'donations', label: 'QR Donation Campaign', icon: HeartHandshake },
    { id: 'revenue', label: 'Revenue & Earnings', icon: DollarSign },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'account', label: 'Admin Account', icon: ShieldCheck },
  ];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigateTab={setActiveTab} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'users':
        return <UsersView />;
      case 'anime-management':
        return <AnimeManagementView />;
      case 'manga-management':
        return <MangaManagementView />;
      case 'watch-activity':
        return <WatchActivityView />;
      case 'ads':
        return <AdsManagerView />;
      case 'announcements':
        return <AnnouncementsView />;
      case 'donations':
        return <DonationManagerView />;
      case 'revenue':
        return <RevenueView />;
      case 'settings':
        return <SettingsView />;
      case 'account':
        return <AdminAccountView adminEmail={adminEmail} onLogout={handleLogout} />;
      default:
        return <OverviewView onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060607] text-white flex flex-col md:flex-row select-none">
      {/* Mobile Top Header */}
      <div className="md:hidden h-[60px] bg-[#0c0c0e] border-b border-white/10 px-4 flex items-center justify-between sticky top-0 z-40">
        <BrandLogo onClick={onExitAdmin} />
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 w-[270px] bg-[#0c0c0e] border-r border-white/10 flex flex-col transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Area */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <BrandLogo onClick={onExitAdmin} />
            <span className="text-[10px] uppercase font-bold text-[#c084fc] tracking-wider block mt-1">
              Admin Control Center
            </span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items (13 items) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full h-[40px] px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#8b5cf6]/20 to-[#ec4899]/15 border border-[#8b5cf6]/40 text-white font-bold shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-[#c084fc]' : 'text-white/40'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-white/10 text-white/50 border border-white/10">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* 13. Logout in sidebar */}
          <div className="pt-2 border-t border-white/[0.08] mt-2">
            <button
              onClick={handleLogout}
              className="w-full h-[38px] px-3.5 rounded-xl flex items-center gap-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>13. Logout</span>
            </button>
          </div>
        </nav>

        {/* Footer Link to Public Website */}
        <div className="p-3.5 border-t border-white/[0.08] bg-black/40">
          <button
            onClick={onExitAdmin}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs flex items-center justify-between transition-colors"
          >
            <span>Public MIRAI Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Desktop Bar */}
        <header className="hidden md:flex h-[64px] bg-[#0c0c0e]/80 backdrop-blur-md border-b border-white/10 px-8 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white capitalize font-semibold">
              {activeTab.replace(/-/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right text-xs">
              <span className="text-white font-bold block">{adminEmail}</span>
              <span className="text-[10px] text-white/40 uppercase font-mono">Master Administrator</span>
            </div>
            <button
              onClick={onExitAdmin}
              className="h-[32px] px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>View Site</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Active Tab View */}
        <div className="flex-1 p-5 sm:p-8 max-w-[1400px] w-full">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
};
