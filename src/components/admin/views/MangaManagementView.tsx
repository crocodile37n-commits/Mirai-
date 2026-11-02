import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Eye,
  EyeOff,
  Star,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const MangaManagementView: React.FC = () => {
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any>({ hiddenMangaIds: [], featuredMangaIds: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminApi.getContent().then((res) => {
      setMangaList(res.manga || []);
      setOverrides(res.overrides || { hiddenMangaIds: [], featuredMangaIds: [] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleToggleHide = async (id: number, currentHidden: boolean) => {
    const next = !currentHidden;
    try {
      const res = await adminApi.toggleContentVisibility('manga', id, next);
      setOverrides(res.overrides);
    } catch (err: any) {
      alert(err.message || 'Failed to update visibility.');
    }
  };

  const handleToggleFeatured = async (id: number, currentFeatured: boolean) => {
    const next = !currentFeatured;
    try {
      const res = await adminApi.toggleContentFeatured('manga', id, next);
      setOverrides(res.overrides);
    } catch (err: any) {
      alert(err.message || 'Failed to update featured status.');
    }
  };

  const filtered = mangaList.filter((m) => {
    const title = (m.title.english || m.title.romaji || '').toLowerCase();
    return title.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#ec4899]" />
            <span>Manga Catalog Management</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Manage manga/manhwa/manhua availability, catalog visibility, and featured listings.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search manga catalog..."
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
          {filtered.map((manga) => {
            const isHidden = (overrides.hiddenMangaIds || []).includes(manga.id);
            const isFeatured = (overrides.featuredMangaIds || []).includes(manga.id);
            const title = manga.title.english || manga.title.romaji;

            return (
              <div
                key={manga.id}
                className={`p-4 rounded-2xl bg-[#0c0c0e] border transition-all flex gap-3.5 ${
                  isHidden ? 'opacity-50 border-red-500/20' : 'border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="w-[70px] h-[95px] rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 relative">
                  <img
                    src={manga.coverImage.medium || manga.coverImage.large}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {manga.country && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-bold text-white border border-white/10">
                      {manga.country}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-xs font-bold text-white truncate" title={title}>
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-white/50 mt-1">
                      <span>{manga.mangaType || 'MANGA'}</span>
                      <span>•</span>
                      <span>{manga.chaptersCount ? `${manga.chaptersCount} CH` : 'Ongoing'}</span>
                      <span>•</span>
                      <span className="text-[#fbbf24] flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {manga.averageScore ? (manga.averageScore / 10).toFixed(1) : '9.0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => handleToggleHide(manga.id, isHidden)}
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
                      onClick={() => handleToggleFeatured(manga.id, isFeatured)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isFeatured
                          ? 'bg-[#ec4899]/20 text-[#f472b6] border border-[#ec4899]/30'
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
