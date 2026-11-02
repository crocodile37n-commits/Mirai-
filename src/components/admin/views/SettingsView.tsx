import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Save,
  Globe,
  Sliders,
  Bell,
  Lock,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    websiteName: 'MIRAI',
    maintenanceMode: false,
    maintenanceNotice: 'MIRAI is undergoing scheduled maintenance.',
    allowRegistrations: true,
    analyticsTracking: true,
    contactEmail: 'ghjklasdfg420@gmail.com',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((res) => {
      if (res.settings) setSettings(res.settings);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await adminApi.updateSettings(settings);
      setSettings(res.settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none max-w-[840px]">
      <div className="pb-4 border-b border-white/10">
        <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#8b5cf6]" />
          <span>Website Global Settings</span>
        </h2>
        <p className="text-xs text-white/50 mt-0.5">
          Maintenance mode, registration permissions, and system controls.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Website settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Maintenance Mode Card */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Maintenance Mode</span>
              </h3>
              <p className="text-white/50 text-[11px] max-w-[480px]">
                When enabled, visitors will see a clean maintenance banner instead of streaming pages. Administrators remain unrestricted.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`h-[30px] px-3.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                settings.maintenanceMode
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {settings.maintenanceMode ? 'Maintenance ON' : 'Normal Operation'}
            </button>
          </div>

          {settings.maintenanceMode && (
            <div className="pt-2">
              <label className="block text-white/70 font-semibold mb-1">
                Custom Maintenance Notice Message
              </label>
              <textarea
                rows={2}
                value={settings.maintenanceNotice || ''}
                onChange={(e) => setSettings({ ...settings, maintenanceNotice: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Website Identification & Contact */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4">
          <h3 className="font-heading text-sm font-bold text-white">General Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 font-semibold mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.websiteName || 'MIRAI'}
                onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-white/70 font-semibold mb-1">Administrator Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Permissions & Security */}
        <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08] space-y-4">
          <h3 className="font-heading text-sm font-bold text-white">Registration &amp; Telemetry</h3>

          <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
            <div>
              <span className="font-semibold text-white block">Allow Public Member Sign-ups</span>
              <span className="text-[11px] text-white/40">
                Permit new users to create accounts on the website.
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, allowRegistrations: !settings.allowRegistrations })
              }
              className={`h-[28px] px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                settings.allowRegistrations
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {settings.allowRegistrations ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-semibold text-white block">Real Analytics Tracking</span>
              <span className="text-[11px] text-white/40">
                Collect anonymized telemetry for watch time, episode plays, and page hits.
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, analyticsTracking: !settings.analyticsTracking })
              }
              className={`h-[28px] px-3 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                settings.analyticsTracking
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              {settings.analyticsTracking ? 'Active' : 'Paused'}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="h-[42px] px-6 rounded-xl bg-white text-black font-bold hover:bg-white/90 cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
