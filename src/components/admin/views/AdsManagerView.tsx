import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  DollarSign,
  MousePointer,
  X,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const AdsManagerView: React.FC = () => {
  const [adsData, setAdsData] = useState<{ globalEnabled: boolean; campaigns: any[] }>({
    globalEnabled: false,
    campaigns: [],
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState('homepage_banner');
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [ctaText, setCtaText] = useState('Learn More');
  const [ctaUrl, setCtaUrl] = useState('https://');
  const [targetPages, setTargetPages] = useState('homepage');
  const [frequency, setFrequency] = useState('once_per_session');

  const fetchAds = () => {
    setLoading(true);
    adminApi.getAds().then((res) => {
      setAdsData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleToggleGlobal = async () => {
    const next = !adsData.globalEnabled;
    try {
      const res = await adminApi.updateAdGlobal(next);
      setAdsData(res.ads);
    } catch (err: any) {
      alert(err.message || 'Failed to update global advertisement switch.');
    }
  };

  const handleToggleCampaign = async (id: string, current: boolean) => {
    const next = !current;
    try {
      await adminApi.toggleAdCampaign(id, next);
      setAdsData((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((c) => (c.id === id ? { ...c, enabled: next } : c)),
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle campaign.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad campaign?')) return;
    try {
      await adminApi.deleteAdCampaign(id);
      setAdsData((prev) => ({
        ...prev,
        campaigns: prev.campaigns.filter((c) => c.id !== id),
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to delete campaign.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !headline) return;

    try {
      const newCamp = await adminApi.saveAdCampaign({
        title,
        format,
        headline,
        bodyText,
        ctaText,
        ctaUrl,
        targetPages: [targetPages],
        displayFrequency: frequency,
        enabled: false, // ALWAYS disabled by default
      });
      setAdsData((prev) => ({
        ...prev,
        campaigns: [newCamp.campaign, ...prev.campaigns],
      }));
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Failed to create campaign.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setHeadline('');
    setBodyText('');
    setCtaText('Learn More');
    setCtaUrl('https://');
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#8b5cf6]" />
            <span>Advertisement Manager</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Configure non-intrusive sponsor promotions. All campaigns are kept disabled by default.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="h-[38px] px-4 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Global Safety Switch Banner */}
      <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                adsData.globalEnabled ? 'bg-[#22c55e] animate-pulse' : 'bg-red-400'
              }`}
            />
            <h3 className="font-heading text-base font-bold text-white">
              Global Advertising Master Switch
            </h3>
          </div>
          <p className="text-xs text-white/60 max-w-[560px]">
            {adsData.globalEnabled
              ? 'Advertisements are currently ENABLED globally. Active individual campaigns will display on designated pages.'
              : 'Advertisements are currently DISABLED globally (Default). No ads will be displayed to any viewers on MIRAI.'}
          </p>
        </div>

        <button
          onClick={handleToggleGlobal}
          className={`h-[40px] px-5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adsData.globalEnabled
              ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          {adsData.globalEnabled ? (
            <>
              <ToggleRight className="w-5 h-5" />
              <span>Ads Active</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5" />
              <span>Disabled (Safe)</span>
            </>
          )}
        </button>
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
        </div>
      ) : adsData.campaigns.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c0c0e] border border-white/[0.08] max-w-[560px] mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-white mb-1">
            No Advertisement Campaigns Configured
          </h3>
          <p className="text-xs text-white/50 max-w-[380px] mx-auto leading-relaxed mb-6">
            As requested, all advertising remains completely dormant. You can draft and preview campaigns anytime without displaying them publicly.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            Draft a Promotion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-heading text-sm font-bold text-white">
            Configured Campaigns ({adsData.campaigns.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adsData.campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-sm font-bold text-white">{camp.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                      {camp.format.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      camp.enabled && adsData.globalEnabled
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    {camp.enabled && adsData.globalEnabled ? 'Live' : 'Off'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-white/70">
                  <p className="font-semibold text-white">{camp.headline}</p>
                  <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">{camp.bodyText}</p>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center gap-3 text-white/40 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {camp.impressions}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3" /> {camp.clicks}
                    </span>
                    <span className="flex items-center gap-1 text-[#22c55e]">
                      <DollarSign className="w-3 h-3" /> ₹{camp.estimatedEarnings}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCampaign(camp.id, camp.enabled)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        camp.enabled
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                          : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      }`}
                    >
                      {camp.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="p-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[500px] rounded-3xl bg-[#0c0c0e] border border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading text-base font-bold text-white">Create New Ad Campaign</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Anime Expo Promotion"
                  className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#8b5cf6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Placement Format</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-xl bg-[#141418] border border-white/10 text-white focus:outline-none"
                  >
                    <option value="homepage_banner">Homepage Banner</option>
                    <option value="content_banner">Content Detail Banner</option>
                    <option value="promotional_popup">One-Time Pop-up</option>
                    <option value="custom_message">Custom Message Bar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-xl bg-[#141418] border border-white/10 text-white focus:outline-none"
                  >
                    <option value="once_per_session">Once Per Session</option>
                    <option value="every_page">Every Page Load</option>
                    <option value="hourly">Hourly Interval</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Headline Text</label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Headline displayed to viewer"
                  className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Body Description</label>
                <textarea
                  rows={2}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Supporting text..."
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Destination URL</label>
                  <input
                    type="url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold hover:bg-white/90 cursor-pointer shadow-md"
                >
                  Save (Disabled by Default)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
