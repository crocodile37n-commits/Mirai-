import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Save,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Languages,
  ArrowUpDown,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { authFetch } from '../../../services/authClient';

export const LanguageSettingsView: React.FC = () => {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    supportedLanguages: [
      { code: 'ja', name: 'Japanese (Original Audio)', default: true, badge: 'SUB' },
      { code: 'hi', name: 'Hindi Dubbed', default: false, badge: 'HINDI DUB' },
      { code: 'en', name: 'English Dubbed', default: false, badge: 'ENG DUB' },
    ],
    dubbingPriorityOrder: ['hi', 'ja', 'en'],
    fallbackPolicy: 'prompt_user', // 'prompt_user' | 'auto_sub'
    missingDubNotice: 'Hindi Dub is not currently available for this title. You can watch in Japanese with English Subtitles.',
    autoMatchByTitle: true,
  });

  useEffect(() => {
    authFetch('/api/admin/language-settings')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setSettings(prev => ({ ...prev, ...data.config }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/admin/language-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        showToast('Settings Saved', 'Language & Dubbing configuration updated.', 'success');
      } else {
        showToast('Error', 'Failed to save language settings.', 'error');
      }
    } catch {
      showToast('Error', 'Connection error while saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const list = [...settings.dubbingPriorityOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    setSettings({ ...settings, dubbingPriorityOrder: list });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
            <Globe2 className="w-5 h-5 text-[#8b5cf6]" />
            <span>Smart Language & Dubbing System</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Configure Hindi Dub priorities, language fallback rules, and user audio prompt notifications.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:opacity-95 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#8b5cf6]" />
          <span>Loading language preferences...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Main settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Priority Ordering Card */}
            <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Volume2 className="w-4 h-4 text-[#8b5cf6]" />
                <span>Audio Track Priority Ordering</span>
              </h3>
              <p className="text-xs text-white/50 mb-4">
                When a user opens an anime or movie, the player selects the audio track in this priority order.
              </p>

              <div className="space-y-2">
                {settings.dubbingPriorityOrder.map((code, idx) => {
                  const lang = settings.supportedLanguages.find(l => l.code === code);
                  const name = lang?.name || code;
                  const badge = lang?.badge || code.toUpperCase();

                  return (
                    <div
                      key={code}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white/10 font-mono text-xs font-bold text-white/80 flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-heading text-sm font-bold text-white block">
                            {name}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">
                            Language code: {code}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30">
                          {badge}
                        </span>
                        <div className="flex flex-col gap-1 ml-2">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMovePriority(idx, 'up')}
                            className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-20 text-white text-[10px] cursor-pointer"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === settings.dubbingPriorityOrder.length - 1}
                            onClick={() => handleMovePriority(idx, 'down')}
                            className="p-1 rounded bg-white/5 hover:bg-white/15 disabled:opacity-20 text-white text-[10px] cursor-pointer"
                            title="Move Down"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fallback policy */}
            <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-pink-400" />
                <span>Fallback Behavior when Hindi Dub is Missing</span>
              </h3>
              <p className="text-xs text-white/50 mb-4">
                Strict requirement: Never pretend Hindi dub exists if not authorized/available. Prompt the user clearly.
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-white/20 transition-colors">
                  <input
                    type="radio"
                    name="fallbackPolicy"
                    checked={settings.fallbackPolicy === 'prompt_user'}
                    onChange={() => setSettings({ ...settings, fallbackPolicy: 'prompt_user' })}
                    className="mt-0.5 accent-[#8b5cf6]"
                  />
                  <div>
                    <span className="font-heading text-xs font-bold text-white block">
                      Prompt User with Notice Banner (Recommended)
                    </span>
                    <span className="text-[11px] text-white/50 block mt-0.5 leading-relaxed">
                      Inform the viewer that Hindi dub is unavailable and offer a smooth one-click switch to Japanese (Original) or English.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] cursor-pointer hover:border-white/20 transition-colors">
                  <input
                    type="radio"
                    name="fallbackPolicy"
                    checked={settings.fallbackPolicy === 'auto_sub'}
                    onChange={() => setSettings({ ...settings, fallbackPolicy: 'auto_sub' })}
                    className="mt-0.5 accent-[#8b5cf6]"
                  />
                  <div>
                    <span className="font-heading text-xs font-bold text-white block">
                      Auto-Fallback to Japanese Audio + English Subtitles
                    </span>
                    <span className="text-[11px] text-white/50 block mt-0.5 leading-relaxed">
                      Seamlessly load Japanese audio stream with a subtle toast message.
                    </span>
                  </div>
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1.5">
                  Missing Dub Notice Message
                </label>
                <textarea
                  rows={2}
                  value={settings.missingDubNotice}
                  onChange={e => setSettings({ ...settings, missingDubNotice: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Column 3: Live Preview */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
              <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Player Notice Preview</span>
              </h3>
              <p className="text-[11px] text-white/50 mb-4">
                This is how the missing dubbing banner will appear to viewers:
              </p>

              {/* Preview Banner */}
              <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-200 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white text-xs">
                      Hindi Dub Unavailable
                    </span>
                    <span className="text-[11px] text-white/70 block mt-0.5 leading-relaxed">
                      {settings.missingDubNotice}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-pink-500/20">
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded bg-white text-black font-bold text-[10px] shadow"
                  >
                    Play in Japanese
                  </button>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded bg-white/10 text-white font-medium text-[10px]"
                  >
                    English Dub
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08]">
              <h4 className="font-heading text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#8b5cf6]" />
                <span>Multi-Audio Metadata Matcher</span>
              </h4>
              <p className="text-[11px] text-white/50 leading-relaxed">
                MIRAI's intelligent streaming router inspects episode audio tracks from installed providers. If Hindi Dub metadata is matched from HiAnime or Vega resolvers, the player will expose it under the audio language switcher automatically.
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
