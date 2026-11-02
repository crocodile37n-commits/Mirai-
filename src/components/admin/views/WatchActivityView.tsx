import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  CheckCircle,
  BookOpen,
  Search,
  MousePointer,
  Filter,
  Info,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const WatchActivityView: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchActivity = () => {
    setLoading(true);
    adminApi
      .getWatchActivity(
        categoryFilter === 'all' ? undefined : categoryFilter,
        typeFilter === 'all' ? undefined : typeFilter
      )
      .then((res) => {
        setEvents(res.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchActivity();
  }, [categoryFilter, typeFilter]);

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'episode_start':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8b5cf6]/15 text-[#c084fc] border border-[#8b5cf6]/30">
            <Play className="w-2.5 h-2.5" /> Episode Play
          </span>
        );
      case 'episode_complete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
            <CheckCircle className="w-2.5 h-2.5" /> Finished
          </span>
        );
      case 'chapter_open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ec4899]/15 text-[#f472b6] border border-[#ec4899]/30">
            <BookOpen className="w-2.5 h-2.5" /> Read Chapter
          </span>
        );
      case 'search_query':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Search className="w-2.5 h-2.5" /> Search
          </span>
        );
      case 'feature_click':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <MousePointer className="w-2.5 h-2.5" /> Feature
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70">
            {type.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8b5cf6]" />
            <span>Watch &amp; Reading Activity Stream</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Real telemetry events captured from video player sessions and manga readers.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-[36px] px-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="anime">Anime Only</option>
            <option value="manga">Manga Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-[36px] px-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white focus:outline-none"
          >
            <option value="all">All Event Types</option>
            <option value="episode_start">Episode Plays</option>
            <option value="chapter_open">Manga Opens</option>
            <option value="search_query">Search Queries</option>
            <option value="feature_click">Feature Clicks</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0c0c0e] border border-white/[0.08] max-w-[560px] mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-white mb-1">
            No Recent Streaming or Reading Activity
          </h3>
          <p className="text-xs text-white/50 max-w-[380px] mx-auto leading-relaxed">
            Events stream in real-time when viewers press play on an episode or navigate manga pages.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#0c0c0e] border border-white/[0.08] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-white/40 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Title / Query</th>
                  <th className="py-3 px-4">Path</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 font-mono text-right">Visitor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-white/50 font-mono text-[11px] whitespace-nowrap">
                      {evt.isoDate ? evt.isoDate.replace('T', ' ').slice(0, 19) : 'Just now'}
                    </td>
                    <td className="py-3 px-4">{getEventBadge(evt.type)}</td>
                    <td className="py-3 px-4 font-medium text-white max-w-[240px] truncate">
                      {evt.targetTitle || evt.metadata?.query || evt.path}
                    </td>
                    <td className="py-3 px-4 text-white/40 font-mono text-[11px] truncate max-w-[180px]">
                      {evt.path}
                    </td>
                    <td className="py-3 px-4 text-white/60 uppercase text-[10px] font-semibold">
                      {evt.category || 'general'}
                    </td>
                    <td className="py-3 px-4 text-right text-white/30 font-mono text-[11px]">
                      #{evt.ipHash?.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
