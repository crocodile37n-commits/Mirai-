import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, BookOpen, Search, SlidersHorizontal, Shield, ShieldAlert, X } from 'lucide-react';
import { AccentHeading } from '../common/AccentHeading';
import { PosterCard } from '../common/PosterCard';
import { browseAnimeOrManga } from '../../services/animeApi';
import { AnimeMedia } from '../../types';
import { useApp } from '../../context/AppContext';

export const BrowseView: React.FC = () => {
  const { nav } = useApp();
  const [mediaType, setMediaType] = useState<'ANIME' | 'MANGA'>(
    nav.browseFilter?.type === 'MANGA' ? 'MANGA' : 'ANIME'
  );
  const [searchQuery, setSearchQuery] = useState(nav.browseFilter?.search || '');
  const [selectedGenre, setSelectedGenre] = useState<string>(nav.browseFilter?.genre || 'All');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');
  const [selectedSort, setSelectedSort] = useState<string>('TRENDING_DESC');
  const [isMatureMode, setIsMatureMode] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  const [items, setItems] = useState<AnimeMedia[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync when nav filter changes
  useEffect(() => {
    if (nav.browseFilter?.type) {
      setMediaType(nav.browseFilter.type);
    }
    if (nav.browseFilter?.genre) {
      setSelectedGenre(nav.browseFilter.genre);
    }
    if (nav.browseFilter?.search !== undefined) {
      setSearchQuery(nav.browseFilter.search);
    }
  }, [nav.browseFilter]);

  // Debounced fetch
  useEffect(() => {
    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const result = await browseAnimeOrManga({
          type: mediaType,
          search: searchQuery,
          genre: selectedGenre,
          format: selectedFormat,
          sort: selectedSort,
          isAdult: isMatureMode,
          perPage: 48,
        });

        if (!controller.signal.aborted) {
          setItems(result.media);
          setTotalCount(result.total || result.media.length);
          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [mediaType, searchQuery, selectedGenre, selectedFormat, selectedSort, isMatureMode]);

  const genres = [
    'All',
    'Action',
    'Adventure',
    'Comedy',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
    'Psychological',
    'Romance',
    'Sci-Fi',
    'Slice of Life',
    'Supernatural',
  ];

  return (
    <div className="min-w-0 max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 select-none">
      {/* 1. Anime | Manga segmented toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="inline-flex p-1 rounded-full glass bg-[#0c0c0e] border border-white/10 shadow-sm">
          <button
            onClick={() => setMediaType('ANIME')}
            className={`h-[34px] px-5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              mediaType === 'ANIME'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Anime</span>
          </button>
          <button
            onClick={() => setMediaType('MANGA')}
            className={`h-[34px] px-5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              mediaType === 'MANGA'
                ? 'bg-white text-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Manga</span>
          </button>
        </div>
      </div>

      {/* 2. Search row: full width glass input with Filters button */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search for ${mediaType.toLowerCase()}...`}
            className="w-full h-[44px] pl-11 pr-10 rounded-full glass bg-[#0c0c0e]/80 border border-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          className={`h-[44px] px-5 rounded-full border text-xs font-bold flex items-center gap-2 transition-all ${
            showFilterDrawer
              ? 'bg-white text-black border-white'
              : 'glass bg-[#0c0c0e] text-white border-white/10 hover:border-white/20'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </button>
      </div>

      {/* Manga Format Quick Pills: All / Manga / Manhwa / Manhua / OEL */}
      {mediaType === 'MANGA' && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'MANGA', label: 'Manga (JP)' },
            { id: 'MANHWA', label: 'Manhwa (KR)' },
            { id: 'MANHUA', label: 'Manhua (CN)' },
            { id: 'OEL', label: 'OEL' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setSelectedFormat(pill.id)}
              className={`h-[30px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                selectedFormat === pill.id
                  ? 'bg-white text-black border-white font-bold shadow-sm'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter drawer (toggled) */}
      {showFilterDrawer && (
        <div className="p-5 mb-5 rounded-[16px] bg-[#0c0c0e] border border-white/10 space-y-4 animate-in fade-in duration-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
              Genre
            </span>
            <div className="flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`h-[28px] px-3 rounded-full text-xs font-medium border transition-all ${
                    selectedGenre === g
                      ? 'bg-white text-black border-white font-bold'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                Format
              </span>
              {mediaType === 'MANGA' ? (
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full h-[36px] px-3 rounded-[10px] bg-[#121215] border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Formats</option>
                  <option value="MANGA">Manga (JP)</option>
                  <option value="MANHWA">Manhwa (KR)</option>
                  <option value="MANHUA">Manhua (CN)</option>
                </select>
              ) : (
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full h-[36px] px-3 rounded-[10px] bg-[#121215] border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Formats</option>
                  <option value="TV">TV Series</option>
                  <option value="MOVIE">Movie</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA</option>
                </select>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                Sort By
              </span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full h-[36px] px-3 rounded-[10px] bg-[#121215] border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="TRENDING_DESC">Trending</option>
                <option value="POPULARITY_DESC">Most Popular</option>
                <option value="SCORE_DESC">Top Rated</option>
                <option value="START_DATE_DESC">Recently Released</option>
              </select>
            </div>

            {mediaType === 'MANGA' && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                  Source
                </span>
                <select
                  className="w-full h-[36px] px-3 rounded-[10px] bg-[#121215] border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">All Providers</option>
                  <option value="Atsu">Atsu Scans</option>
                  <option value="MangaBall">MangaBall</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Safety panel: Wide rounded panel (~60px tall) */}
      <div className="w-full h-[60px] rounded-[14px] bg-[#0c0c0e] border border-white/[0.08] px-5 flex items-center justify-between mb-8 shadow-sm">
        <div>
          <h4 className="text-[13px] font-bold text-white">
            {isMatureMode
              ? `Mature ${mediaType === 'MANGA' ? 'Manga' : 'Anime'} (18+)`
              : `Safe ${mediaType === 'MANGA' ? 'manga' : 'anime'}`}
          </h4>
          <p className="text-[11px] text-white/40">
            {isMatureMode ? 'Adult 18+ titles are visible' : 'Adult titles are hidden'}
          </p>
        </div>

        {/* Segmented control Safe / 18+ Mature */}
        <div className="inline-flex p-1 rounded-full bg-black/60 border border-white/10">
          <button
            onClick={() => setIsMatureMode(false)}
            className={`h-[28px] px-3.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              !isMatureMode
                ? 'bg-white text-black shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Safe</span>
          </button>
          <button
            onClick={() => setIsMatureMode(true)}
            className={`h-[28px] px-3.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              isMatureMode
                ? 'bg-[#ef4444] text-white shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>18+ Mature</span>
          </button>
        </div>
      </div>

      {/* 4. Heading: Accent-bar "Discover Anime", subtext "48 anime shown" */}
      <div className="flex items-center justify-between mb-6">
        <AccentHeading
          title={mediaType === 'MANGA' ? 'Discover Manga' : 'Discover Anime'}
          subtext={`${items.length} titles shown`}
          size="lg"
        />
      </div>

      {/* 5. Grid: 6 columns at desktop, 5 >=1100, 4 >=900, 3 >=640, 2 below */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col">
              <div className="w-full aspect-[2/3] rounded-[16px] bg-[#0c0c0e] border border-white/5" />
              <div className="h-3.5 bg-white/10 rounded mt-3 w-3/4" />
              <div className="h-2.5 bg-white/5 rounded mt-1.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {items.map((anime) => (
            <PosterCard
              key={anime.id}
              anime={anime}
              showHoverPreview={false} // No hover preview on browse as per spec
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-base text-white/50">No titles match your active filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('All');
              setSelectedFormat('ALL');
            }}
            className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
