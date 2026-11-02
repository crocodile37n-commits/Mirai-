import React, { useState, useEffect } from 'react';
import {
  Tv,
  Search,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const AnimeManagementView: React.FC = () => {
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any>({ hiddenAnimeIds: [], featuredAnimeIds: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.getContent().then((res) => {
      setAnimeList(res.anime || []);
      setOverrides(res.overrides || { hiddenAnimeIds: [], featuredAnimeIds: [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleToggleHide = async (id: number, currentHidden: boolean) => {
    const next = !currentHidden;
    try {
      const res = await adminApi.toggleContentVisibility('anime', id, next);
      setOverrides(res.overrides);
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility.');
    }
  };

  const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
    const next = !currentFeatured;
    try {
      const res = await adminApi.toggleContentFeatured('anime', id, next);
      setOverrides(res.overrides);
    } catch (err: any) {
      alert(err.message || 'Failed to update featured status.');
    }
  };

  const filtered = animeList.filter((a) => {
    const title = (a.title.english || a.title.romaji || '').toLowerCase();
    return title.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-[#8b5cf6]" />
            <span>Anime Catalog Management</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Manage titles, catalog visibility, and spotlight featured selections.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search anime catalog..."
            className="h-[36px] w-[220px] pl-9 pr-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((anime) => {
            const isHidden = (overrides.hiddenAnimeIds || []).includes(anime.id);
            const isFeatured = (overrides.featuredAnimeIds || []).includes(anime.id);
            const title = anime.title.english || anime.title.romaji;

            return (
              <div
                key={anime.id}
                className={`p-4 rounded-2xl bg-[#0c0c0e] border transition-all flex gap-3.5 ${
                  isHidden ? 'opacity-50 border-red-500/20' : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="w-[70px] h-[95px] rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 relative">
                  <img
                    src={anime.coverImage.medium || anime.coverImage.large}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {isFeatured && (
                    <span className="absolute top-1 left-1 p-1 rounded-md bg-[#8b5cf6] text-white shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-xs font-bold text-white truncate" title={title}>
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-white/50 mt-1">
                      <span>{anime.format || 'TV'}</span>
                      <span>•</span>
                      <span>{anime.episodes ? `${anime.episodes} EPS` : 'Releasing'}</span>
                      <span>•</span>
                      <span className="text-[#fbbf24] flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.5'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleToggleHide(anime.id, isHidden)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isHidden
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-white/70'
                      }`}
                    >
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isHidden ? 'Hidden' : 'Visible'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleFeatured(anime.id, isFeatured)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isFeatured
                          ? 'bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30'
                          : 'bg-white/5 hover:bg-white/10 text-white/50'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isFeatured ? 'Featured' : 'Feature'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
