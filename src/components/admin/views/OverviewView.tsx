import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Clock,
  Tv,
  BookOpen,
  Megaphone,
  HeartHandshake,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

interface OverviewViewProps {
  onNavigateTab: (tabId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getOverview().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalPageViews: 0,
    totalUniqueVisitors: 0,
    dailyVisitors: 0,
    registeredUsersCount: 0,
    totalWatchMinutes: 0,
    activeAdCampaignsCount: 0,
    activeAnnouncementsCount: 0,
    donationCampaignActive: false,
  };

  const isEmpty = data?.analyticsEmpty;

  return (
    <div className="space-y-8 select-none">
      {/* Top Banner Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#8b5cf6]/15 via-[#ec4899]/10 to-transparent border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c084fc]">
              MIRAI Control Center Active
            </span>
          </div>
          <h2 className="font-heading text-lg font-bold text-white">
            Welcome to Website Management
          </h2>
          <p className="text-xs text-white/60">
            Real telemetry tracking is enabled. Advertisements and donation campaigns remain disabled until you activate them.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('analytics')}
            className="h-[36px] px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            View Live Analytics
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Page Views */}
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] relative group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Total Page Views</span>
            <div className="p-2 rounded-xl bg-white/5 text-white/70">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.totalPageViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Real tracked client events</p>
        </div>

        {/* Unique Visitors */}
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] relative group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Unique Visitors</span>
            <div className="p-2 rounded-xl bg-white/5 text-[#38bdf8]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.totalUniqueVisitors.toLocaleString()}
          </div>
          <p className="text-[11px] text-white/40 mt-1">{metrics.dailyVisitors} active today</p>
        </div>

        {/* Registered Users */}
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] relative group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Registered Accounts</span>
            <div className="p-2 rounded-xl bg-white/5 text-[#c084fc]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.registeredUsersCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Synced members</p>
        </div>

        {/* Estimated Watch Minutes */}
        <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] relative group hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-white/50 mb-3">
            <span className="text-xs font-medium uppercase tracking-wider">Playback Minutes</span>
            <div className="p-2 rounded-xl bg-white/5 text-[#fbbf24]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
            {metrics.totalWatchMinutes.toLocaleString()}m
          </div>
          <p className="text-[11px] text-white/40 mt-1">Measured streaming time</p>
        </div>
      </div>

      {/* Status Matrix: Ads, Announcements, Donations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ad Status */}
        <div
          onClick={() => onNavigateTab('ads')}
          className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[#8b5cf6]" />
              <span>Advertisements</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                metrics.activeAdCampaignsCount > 0
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              {metrics.activeAdCampaignsCount > 0 ? 'Active' : 'Disabled by Default'}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            {metrics.activeAdCampaignsCount} campaign(s) running. Zero intrusive ads.
          </p>
        </div>

        {/* Announcements Status */}
        <div
          onClick={() => onNavigateTab('announcements')}
          className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ec4899]" />
              <span>Announcements</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                metrics.activeAnnouncementsCount > 0
                  ? 'bg-[#ec4899]/15 text-[#f472b6] border border-[#ec4899]/30'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              {metrics.activeAnnouncementsCount} Live
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Publish alerts, updates, or maintenance warnings on MIRAI.
          </p>
        </div>

        {/* Donation Status */}
        <div
          onClick={() => onNavigateTab('donations')}
          className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#fbbf24]" />
              <span>QR Donation Campaign</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                metrics.donationCampaignActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}
            >
              {metrics.donationCampaignActive ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Voluntary community support. Upload authentic QR payment codes.
          </p>
        </div>
      </div>

      {/* Content Popularity or Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Anime */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-[#8b5cf6]" />
              <span>Top Viewed Anime</span>
            </h3>
            <button
              onClick={() => onNavigateTab('anime-management')}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Manage Catalog →
            </button>
          </div>

          {isEmpty || !data?.topAnime || data.topAnime.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-white/30" />
              <span>No anime playback events recorded yet. Browse anime to generate real statistics.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topAnime.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-white/80 font-medium truncate max-w-[280px]">
                    {i + 1}. {item.title}
                  </span>
                  <span className="text-white/40 font-mono">{item.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Manga */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#ec4899]" />
              <span>Top Read Manga</span>
            </h3>
            <button
              onClick={() => onNavigateTab('manga-management')}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              Manage Catalog →
            </button>
          </div>

          {isEmpty || !data?.topManga || data.topManga.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40">
              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-white/30" />
              <span>No manga reading events recorded yet. Open chapters to populate analytics.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topManga.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-white/80 font-medium truncate max-w-[280px]">
                    {i + 1}. {item.title}
                  </span>
                  <span className="text-white/40 font-mono">{item.count} opens</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
