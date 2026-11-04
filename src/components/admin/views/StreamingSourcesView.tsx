import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  Tv,
  Film,
  Globe,
  Radio,
  Loader2,
  Volume2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { authFetch } from '../../../services/authClient';

export interface SourceItem {
  id: string;
  media_id: string;
  media_type: 'anime' | 'movie';
  episode_id?: string;
  provider_id: string;
  server_name: string;
  video_url: string;
  format: string;
  quality: string;
  audio_language: string;
  is_dub: boolean;
  subtitles: any[];
  is_active: boolean;
  created_at: string;
}

export const StreamingSourcesView: React.FC = () => {
  const { showToast } = useApp();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'anime' | 'movie'>('all');

  // Add source modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    mediaId: '',
    mediaType: 'anime' as 'anime' | 'movie',
    episodeId: '1',
    providerId: 'provider_hianime_vega',
    serverName: 'MegaCloud HD',
    videoUrl: '',
    format: 'hls',
    quality: '1080p',
    audioLanguage: 'ja',
    isDub: false,
  });

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = typeFilter !== 'all' ? `?mediaType=${typeFilter}` : '';
      const res = await authFetch(`/api/admin/streaming-sources${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources || []);
      }
    } catch {
      showToast('Error', 'Failed to fetch streaming sources.', 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showToast]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this streaming source?')) return;
    try {
      const res = await authFetch(`/api/admin/streaming-sources/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSources(prev => prev.filter(s => s.id !== id));
        showToast('Source Deleted', 'Streaming server entry removed.', 'info');
      }
    } catch {
      showToast('Error', 'Failed to delete streaming source.', 'error');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mediaId.trim() || !form.videoUrl.trim() || !form.serverName.trim()) {
      showToast('Validation Error', 'Media ID, Server Name, and Video URL are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/admin/streaming-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Source Created', `Added source on ${form.serverName}.`, 'success');
        setAddModalOpen(false);
        setForm({
          mediaId: '',
          mediaType: 'anime',
          episodeId: '1',
          providerId: 'provider_hianime_vega',
          serverName: 'MegaCloud HD',
          videoUrl: '',
          format: 'hls',
          quality: '1080p',
          audioLanguage: 'ja',
          isDub: false,
        });
        fetchSources();
      } else {
        showToast('Error', data.error || 'Failed to add source.', 'error');
      }
    } catch {
      showToast('Error', 'Failed to connect to backend.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = sources.filter(s => {
    const q = search.toLowerCase();
    return (
      s.server_name.toLowerCase().includes(q) ||
      s.media_id.toLowerCase().includes(q) ||
      s.video_url.toLowerCase().includes(q) ||
      s.provider_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#8b5cf6]" />
            <span>Streaming Sources & Server Resolution</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Map authorized streaming mirrors, HLS/MP4 streams, audio tracks (Hindi Dub / Sub) and CDNs.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:opacity-95 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Streaming Source</span>
        </button>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by server name, media ID, or provider..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="h-10 px-3 rounded-xl bg-[#0c0c0e] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
          >
            <option value="all">All Media</option>
            <option value="anime">Anime Only</option>
            <option value="movie">Movies Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08]">
            Sources: <strong className="text-white">{sources.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            HLS Engine: <strong className="text-white">Active</strong>
          </span>
        </div>
      </div>

      {/* Sources Table */}
      {loading ? (
        <div className="py-20 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#8b5cf6]" />
          <span>Scanning streaming servers...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass border border-white/[0.08] p-8">
          <Layers className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="font-heading text-sm font-bold text-white">No Sources Configured</h3>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
            {search ? 'No servers match your search.' : 'Add your first authorized streaming source above.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase text-[10px] bg-white/[0.02]">
                  <th className="py-3 px-4">Server / Provider</th>
                  <th className="py-3 px-4">Media Target</th>
                  <th className="py-3 px-4">Format & Quality</th>
                  <th className="py-3 px-4">Audio Track</th>
                  <th className="py-3 px-4">Stream URL</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(source => (
                  <tr key={source.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-heading font-bold text-white">
                          {source.server_name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                        {source.provider_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            source.media_type === 'anime'
                              ? 'bg-[#8b5cf6]/20 text-[#c084fc]'
                              : 'bg-[#ec4899]/20 text-[#f472b6]'
                          }`}
                        >
                          {source.media_type}
                        </span>
                        <span className="font-mono text-white/80">ID: {source.media_id}</span>
                      </div>
                      {source.episode_id && (
                        <span className="text-[10px] text-white/40 block mt-0.5">
                          Ep: {source.episode_id}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/80 text-[10px] uppercase mr-1.5">
                        {source.format}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold">{source.quality}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-[#8b5cf6]" />
                        <span className="font-bold text-white uppercase text-[11px]">
                          {source.audio_language}
                        </span>
                        {source.is_dub && (
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/20 border border-pink-500/30 text-pink-300 text-[9px] font-bold">
                            DUB
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px] truncate font-mono text-[11px] text-white/50">
                      {source.video_url}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(source.id)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Remove source"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Source Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass bg-[#0e0e12] border border-white/15 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] relative">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8b5cf6]" />
              <span>Add Streaming Source</span>
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Configure a video server stream with audio track and subtitle metadata.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Media Target *
                  </label>
                  <select
                    value={form.mediaType}
                    onChange={e => setForm({ ...form, mediaType: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
                  >
                    <option value="anime">Anime Series</option>
                    <option value="movie">Movie</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Media ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.mediaId}
                    onChange={e => setForm({ ...form, mediaId: e.target.value })}
                    placeholder="e.g. 110349 or movie_suzume"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                  />
                </div>
              </div>

              {form.mediaType === 'anime' && (
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Episode Number
                  </label>
                  <input
                    type="text"
                    value={form.episodeId}
                    onChange={e => setForm({ ...form, episodeId: e.target.value })}
                    placeholder="1"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Server Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.serverName}
                    onChange={e => setForm({ ...form, serverName: e.target.value })}
                    placeholder="e.g. MegaCloud HD or VidStream"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Provider ID
                  </label>
                  <input
                    type="text"
                    value={form.providerId}
                    onChange={e => setForm({ ...form, providerId: e.target.value })}
                    placeholder="provider_hianime_vega"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Video Stream URL (.m3u8 / .mp4) *
                </label>
                <input
                  type="url"
                  required
                  value={form.videoUrl}
                  onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                  placeholder="https://stream.server.net/master.m3u8"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Format
                  </label>
                  <select
                    value={form.format}
                    onChange={e => setForm({ ...form, format: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
                  >
                    <option value="hls">HLS (.m3u8)</option>
                    <option value="mp4">MP4 Direct</option>
                    <option value="embed">Embed Frame</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Quality
                  </label>
                  <select
                    value={form.quality}
                    onChange={e => setForm({ ...form, quality: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
                  >
                    <option value="1080p">1080p (FHD)</option>
                    <option value="720p">720p (HD)</option>
                    <option value="4K">4K Ultra</option>
                    <option value="Auto">Auto Adapt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Audio Language
                  </label>
                  <select
                    value={form.audioLanguage}
                    onChange={e => setForm({ ...form, audioLanguage: e.target.value, isDub: e.target.value !== 'ja' })}
                    className="w-full h-10 px-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
                  >
                    <option value="ja">Japanese (Original)</option>
                    <option value="hi">Hindi Dubbed</option>
                    <option value="en">English Dubbed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Stream...</span>
                    </>
                  ) : (
                    <span>Register Source</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
