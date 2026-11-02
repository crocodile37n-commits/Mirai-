import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  X,
  ExternalLink,
  Layers,
  Calendar,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const AnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [livePreview, setLivePreview] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Now');
  const [buttonUrl, setButtonUrl] = useState('');
  const [location, setLocation] = useState('global_top');
  const [frequency, setFrequency] = useState('once_per_session');

  const fetchAnnouncements = () => {
    setLoading(true);
    adminApi.getAnnouncements().then((res) => {
      setAnnouncements(res.announcements || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    const next = !current;
    try {
      await adminApi.toggleAnnouncement(id, next);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: next } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle announcement.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await adminApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    try {
      const res = await adminApi.saveAnnouncement({
        title,
        message,
        imageUrl: imageUrl.trim() || undefined,
        buttonText: buttonText.trim() || undefined,
        buttonUrl: buttonUrl.trim() || undefined,
        location,
        frequency,
        enabled: false, // Disabled by default
      });
      setAnnouncements((prev) => [res.announcement, ...prev]);
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Failed to save announcement.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setImageUrl('');
    setButtonText('Explore Now');
    setButtonUrl('');
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ec4899]" />
            <span>Pop-up &amp; Announcement Manager</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Broadcast messages, maintenance notices, and community announcements across MIRAI.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="h-[38px] px-4 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c0c0e] border border-white/[0.08] max-w-[560px] mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-white mb-1">
            No Announcements Published
          </h3>
          <p className="text-xs text-white/50 max-w-[380px] mx-auto leading-relaxed mb-6">
            Create notices for upcoming server updates, new seasonal anime releases, or feature launches.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            Create Notice
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading text-sm font-bold text-white">{item.title}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                    <span className="capitalize">{item.location.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{item.frequency.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.enabled
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}
                >
                  {item.enabled ? 'Live' : 'Draft (Off)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-white/70 leading-relaxed">
                <p>{item.message}</p>
                {item.buttonText && (
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-white/10 text-white font-bold text-[10px]">
                    {item.buttonText} →
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
                <span className="text-white/40 text-[11px]">
                  Created {item.createdAt?.split('T')[0]}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(item.id, item.enabled)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      item.enabled
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    }`}
                  >
                    {item.enabled ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[500px] rounded-3xl bg-[#0c0c0e] border border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-heading text-base font-bold text-white">Create Announcement</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. MIRAI Fall Season Streaming Notice"
                  className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1">Message Content</label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="The message text displayed to viewers..."
                  className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Display Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-xl bg-[#141418] border border-white/10 text-white focus:outline-none"
                  >
                    <option value="global_top">Top Header Banner (Website-wide)</option>
                    <option value="homepage">Homepage Spotlight</option>
                    <option value="anime_detail">Anime Detail Pages</option>
                    <option value="manga_detail">Manga Detail Pages</option>
                    <option value="viewer_overlay">Optional Viewer Overlay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 font-semibold mb-1">Display Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full h-[38px] px-3 rounded-xl bg-[#141418] border border-white/10 text-white focus:outline-none"
                  >
                    <option value="once_per_session">Once Per Session</option>
                    <option value="once_per_user">Once Per User</option>
                    <option value="always">Always Display</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Action Button Text</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Read More / Update"
                    className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/70 font-semibold mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    placeholder="/browse or https://..."
                    className="w-full h-[38px] px-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="pt-2">
                <span className="block text-white/40 text-[11px] mb-1.5 uppercase font-bold tracking-wider">
                  Live Preview
                </span>
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#8b5cf6]/20 via-[#ec4899]/15 to-transparent border border-white/15 text-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{title || 'Preview Title'}</span>
                    <span className="text-[10px] text-white/40">Close ✕</span>
                  </div>
                  <p className="text-[11px] text-white/70 mt-1">
                    {message || 'Announcement message preview will appear here.'}
                  </p>
                  {buttonText && (
                    <button type="button" className="mt-2 text-[10px] font-bold px-2.5 py-0.5 rounded bg-white text-black">
                      {buttonText}
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black font-bold hover:bg-white/90 cursor-pointer shadow-md"
                >
                  Save Announcement (Draft)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
