import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  QrCode,
  Image,
  Upload,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const DonationManagerView: React.FC = () => {
  const [campaign, setCampaign] = useState<any>({
    enabled: false,
    title: 'Support MIRAI Development',
    message: 'Please support MIRAI — Donate just ₹1.',
    characterImageUrl: '',
    qrCodeImageUrl: '',
    upiId: '',
    targetLocations: ['support_section'],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    adminApi.getDonations().then((res) => {
      if (res.donation) setCampaign(res.donation);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('QR code image should be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCampaign((prev: any) => ({
          ...prev,
          qrCodeImageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCampaign((prev: any) => ({
          ...prev,
          characterImageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await adminApi.updateDonations(campaign);
      setCampaign(res.donation);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save donation campaign.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTarget = (loc: string) => {
    const current = campaign.targetLocations || [];
    const next = current.includes(loc)
      ? current.filter((l: string) => l !== loc)
      : [...current, loc];
    setCampaign({ ...campaign, targetLocations: next });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-[960px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#fbbf24]" />
            <span>QR Donation Campaign Manager</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Configure optional community support. Donations are strictly voluntary and never interrupt playback.
          </p>
        </div>

        {/* Master Switch */}
        <button
          type="button"
          onClick={() => setCampaign({ ...campaign, enabled: !campaign.enabled })}
          className={`h-[38px] px-4 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            campaign.enabled
              ? 'bg-[#22c55e] text-black shadow-md'
              : 'bg-white/10 text-white/70 border border-white/20 hover:text-white'
          }`}
        >
          {campaign.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          <span>{campaign.enabled ? 'Campaign Live' : 'Campaign Off (Default)'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Donation campaign settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4 text-xs">
          <h3 className="font-heading text-sm font-bold text-white mb-2">Campaign Details</h3>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Campaign Title</label>
            <input
              type="text"
              required
              value={campaign.title || ''}
              onChange={(e) => setCampaign({ ...campaign, title: e.target.value })}
              placeholder="e.g. Please support MIRAI — Donate just ₹1."
              className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#fbbf24]"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">Support Message</label>
            <textarea
              rows={3}
              required
              value={campaign.message || ''}
              onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
              placeholder="Explain how voluntary community support helps keep servers fast and free..."
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-white/70 font-semibold mb-1">UPI ID (Optional)</label>
            <input
              type="text"
              value={campaign.upiId || ''}
              onChange={(e) => setCampaign({ ...campaign, upiId: e.target.value })}
              placeholder="e.g. yourname@upi or bank handle"
              className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none font-mono"
            />
          </div>

          {/* QR Code Upload (Real Owner QR Code) */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="block text-white/70 font-semibold mb-1">
              Upload Official Payment QR Code
            </label>
            <p className="text-[11px] text-white/40 mb-2">
              Must be your authentic payment QR image. Synthetic QR codes are never generated.
            </p>
            <div className="flex items-center gap-3">
              <label className="h-[36px] px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold flex items-center gap-2 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload QR Image</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleQrUpload}
                  className="hidden"
                />
              </label>
              {campaign.qrCodeImageUrl && (
                <span className="text-[11px] text-[#22c55e] flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> QR Loaded
                </span>
              )}
            </div>
          </div>

          {/* Character Artwork Upload / URL */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="block text-white/70 font-semibold mb-1">
              Anime Character Mascot / Artwork (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={campaign.characterImageUrl || ''}
                onChange={(e) => setCampaign({ ...campaign, characterImageUrl: e.target.value })}
                placeholder="Image URL or upload below"
                className="flex-1 h-[36px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
              <label className="h-[36px] px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center gap-1 cursor-pointer">
                <Image className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Target Locations */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="block text-white/70 font-semibold mb-2">Display Locations</label>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { id: 'homepage', label: 'Homepage Card' },
                { id: 'detail_pages', label: 'Content Detail Pages' },
                { id: 'popup', label: 'Optional Pop-up' },
                { id: 'support_section', label: 'Support Section (Footer/Nav)' },
              ].map((loc) => {
                const checked = (campaign.targetLocations || []).includes(loc.id);
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => toggleTarget(loc.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      checked
                        ? 'bg-[#fbbf24]/10 border-[#fbbf24]/40 text-[#fbbf24] font-bold'
                        : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {loc.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full h-[40px] rounded-xl bg-white text-black font-bold hover:bg-white/90 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Donation Campaign'}
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-white/50" />
              <span>Public Appearance Preview</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                campaign.enabled
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/40 border border-white/10'
              }`}
            >
              {campaign.enabled ? 'Live on Site' : 'Currently Dormant'}
            </span>
          </div>

          {/* Actual Card Render */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c0c0e] to-[#141418] border border-white/15 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* QR Code container */}
              <div className="w-[140px] h-[140px] rounded-2xl bg-white p-2.5 flex items-center justify-center flex-shrink-0 shadow-xl border border-black/10">
                {campaign.qrCodeImageUrl ? (
                  <img
                    src={campaign.qrCodeImageUrl}
                    alt="Payment QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2 text-neutral-400">
                    <QrCode className="w-10 h-10 mx-auto text-neutral-300 mb-1" />
                    <span className="text-[9px] font-mono block">Upload QR in Admin</span>
                  </div>
                )}
              </div>

              {/* Text & Message */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fbbf24]/15 border border-[#fbbf24]/30 text-[#fbbf24] text-[10px] font-bold uppercase tracking-wider mb-2">
                  Voluntary Contribution
                </span>
                <h4 className="font-heading text-base font-extrabold text-white leading-snug">
                  {campaign.title || 'Support MIRAI Development'}
                </h4>
                <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                  {campaign.message || 'Please support MIRAI — Donate just ₹1.'}
                </p>

                {campaign.upiId && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
                    <span>UPI:</span>
                    <strong className="text-white">{campaign.upiId}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] text-[10px] text-white/40 text-center">
              Contributions are 100% voluntary and keep streaming free and non-intrusive.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
