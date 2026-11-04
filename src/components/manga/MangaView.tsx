import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Compass,
  TrendingUp,
  Clock,
  Flame,
  Search,
  X,
} from 'lucide-react';
import { getMangaDiscoveryData, searchManga } from '../../services/animeApi';
import { AnimeMedia } from '../../types';
import { useApp } from '../../context/AppContext';
import { SectionHeader } from '../common/SectionHeader';
import { PosterCard } from '../common/PosterCard';

export const MangaView: React.FC = () => {
  const { navigateToMangaDetail, navigateToReader, navigateToBrowse } = useApp();
  const [discovery, setDiscovery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);

  // Manga search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnimeMedia[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Carousel refs for smooth horizontal scrolling
  const topViewedScrollRef = useRef<HTMLDivElement>(null);
  const topRatedScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMangaDiscoveryData().then((data) => {
      setDiscovery(data);
      setLoading(false);
    });
  }, []);

  // Hero carousel auto-advance every 7 seconds
  useEffect(() => {
    if (!discovery || !discovery.hero || discovery.hero.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % discovery.hero.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [discovery]);

  // Search debounce effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeout = setTimeout(() => {
      searchManga(searchQuery.trim()).then((res) => {
        setSearchResults(res || []);
        setSearchLoading(false);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const offset = direction === 'left' ? -550 : 550;
      ref.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (loading || !discovery) {
    return (
      <div className="w-full min-h-screen bg-[#060607] flex items-center justify-center pt-24">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
      </div>
    );
  }

  const heroList = (discovery.hero || []) as AnimeMedia[];
  const featured = heroList[heroIndex] || heroList[0];
  const featuredTitle = featured?.title.english || featured?.title.romaji || 'Featured Manga';

  return (
    <div className="w-full min-h-screen bg-[#060607] text-white select-none pb-24">
      {/* 1.1 HERO SPOTLIGHT CAROUSEL FOR MANGA */}
      <section className="relative w-full min-h-[500px] md:h-[580px] overflow-hidden bg-[#060607] flex items-center pt-16 sm:pt-20">
        {/* Cinematic Backdrop with Multi-Stop Vignette */}
        <div className="absolute inset-0">
          <img
            key={featured.id}
            src={featured.bannerImage || featured.coverImage.extraLarge}
            alt={featuredTitle}
            fetchPriority="high"
            className="w-full h-full object-cover object-[center_35%] opacity-35 scale-105 transition-opacity duration-700 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060607] via-[#060607]/80 to-[#060607]/40 md:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-[#060607]/70 to-transparent" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#060607]/40 to-[#060607]" />
        </div>

        {/* Hero Content Inner */}
        <div className="relative max-w-[1440px] mx-auto px-6 sm:px-8 w-full py-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 z-10">
          {/* Portrait Cover */}
          <div
            onClick={() => navigateToMangaDetail(featured.id)}
            className="w-[180px] h-[260px] sm:w-[200px] sm:h-[290px] rounded-2xl overflow-hidden border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex-shrink-0 cursor-pointer group hover:scale-[1.03] transition-all duration-300 relative"
          >
            <img
              src={featured.coverImage.large || featured.coverImage.extraLarge}
              alt={featuredTitle}
              className="w-full h-full object-cover"
            />
            {featured.country && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-sm">
                {featured.country}
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
              <span className="text-[11px] font-bold text-white px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                Quick View
              </span>
            </div>
          </div>

          {/* Text & Action Controls */}
          <div className="max-w-[760px] text-center md:text-left flex-1 min-w-0">
            {/* Meta Line: Type chip, score, views */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs font-semibold text-white/70 uppercase tracking-wider mb-2.5">
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] font-bold text-[11px]">
                {featured.mangaType || featured.format || 'MANGA'}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-[#fbbf24] font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                {featured.averageScore ? (featured.averageScore / 10).toFixed(1) : '9.2'}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1 text-white/60">
                <Eye className="w-3.5 h-3.5" />
                {featured.viewsCount || '15M views'}
              </span>
              {featured.chaptersCount && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="text-white/60">{featured.chaptersCount} Chapters</span>
                </>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight line-clamp-2 drop-shadow-md">
              {featuredTitle}
            </h1>

            <p className="mt-3 text-xs sm:text-sm text-white/70 line-clamp-3 leading-relaxed max-w-[680px]">
              {featured.description}
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => navigateToReader(featured.id, 1)}
                className="h-[40px] px-6 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-all flex items-center gap-2 shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-black" />
                <span>READ NOW</span>
              </button>

              <button
                onClick={() => navigateToMangaDetail(featured.id)}
                className="h-[40px] px-6 rounded-full glass bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/15 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>VIEW DETAILS</span>
              </button>

              <button
                onClick={() => navigateToBrowse({ type: 'MANGA' })}
                className="h-[40px] px-5 rounded-full text-white/70 hover:text-white text-xs font-medium hover:bg-white/5 transition-colors hidden sm:flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>BROWSE CATALOGUE</span>
              </button>
            </div>

            {/* Spotlight Carousel Thumb Dots / Selector */}
            <div className="mt-8 flex items-center justify-center md:justify-start gap-2">
              {heroList.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setHeroIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === heroIndex ? 'w-8 bg-[#8b5cf6]' : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MANGA CATALOG SEARCH BAR */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-8 mt-10">
        <div className="relative max-w-[640px] mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manga catalog by title (e.g. Chainsaw Man, Dandadan, Berserk)..."
              className="w-full h-[46px] pl-11 pr-10 rounded-full bg-[#0c0c0e] border border-white/10 hover:border-white/20 focus:border-[#8b5cf6] text-xs font-medium text-white placeholder-white/40 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 p-1 rounded-full text-white/40 hover:text-white transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Search Results */}
        {searchQuery.trim() && (
          <div className="mt-8 p-6 rounded-2xl bg-[#0c0c0e]/95 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[#8b5cf6]" />
                <span>Search Results for "{searchQuery}"</span>
              </h3>
              <span className="text-xs text-white/50">{searchResults.length} manga found</span>
            </div>

            {searchLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-xs text-white/50 text-center py-8">
                No manga found matching "{searchQuery}". Try another keyword or author.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.map((manga) => (
                  <PosterCard
                    key={manga.id}
                    anime={manga}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 1.1 TOP VIEWED TITLES: Horizontal rail with visible circular chevrons */}
      <section className="relative max-w-[1440px] mx-auto px-6 sm:px-8 mt-14">
        <SectionHeader
          eyebrow="HIGH ENGAGEMENT"
          title="Top Viewed Titles"
          countText={`${discovery.topViewed.length} titles`}
          onViewAll={() => navigateToBrowse({ type: 'MANGA' })}
        />

        <div className="relative group/rail">
          {/* Left Visible Circular Chevron */}
          <button
            onClick={() => scrollContainer(topViewedScrollRef, 'left')}
            className="absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-20 w-10 h-10 rounded-full glass bg-[#0c0c0e]/90 hover:bg-[#1a1a20] border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
            aria-label="Scroll top viewed left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Horizontal Scroll Track */}
          <div
            ref={topViewedScrollRef}
            className="flex items-start gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
          >
            {discovery.topViewed.map((manga: AnimeMedia, idx: number) => {
              const title = manga.title.english || manga.title.romaji;
              return (
                <div
                  key={manga.id}
                  onClick={() => navigateToMangaDetail(manga.id)}
                  className="flex-shrink-0 w-[160px] sm:w-[175px] cursor-pointer group"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/10 group-hover:border-white/25 transition-all shadow-md group-hover:-translate-y-1">
                    <img
                      src={manga.coverImage.large || manga.coverImage.extraLarge}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Rank Indicator */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-sm">
                      #{idx + 1}
                    </span>

                    {/* Country Chip */}
                    {manga.country && (
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-[9px] font-bold text-white/90 border border-white/10">
                        {manga.country}
                      </span>
                    )}
                  </div>

                  <h4 className="font-heading text-xs font-bold text-white truncate mt-2.5 group-hover:text-[#c084fc] transition-colors">
                    {title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-white/50 mt-1">
                    <span className="flex items-center gap-1 text-[#fbbf24] font-semibold">
                      <Star className="w-3 h-3 fill-current" />
                      {manga.averageScore ? (manga.averageScore / 10).toFixed(1) : '9.0'}
                    </span>
                    <span className="flex items-center gap-1 text-white/50">
                      <Eye className="w-3 h-3" />
                      {manga.viewsCount || '10M'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Visible Circular Chevron */}
          <button
            onClick={() => scrollContainer(topViewedScrollRef, 'right')}
            className="absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-20 w-10 h-10 rounded-full glass bg-[#0c0c0e]/90 hover:bg-[#1a1a20] border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
            aria-label="Scroll top viewed right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 1.1 RECENTLY ADDED & UPDATED: 3-column Card Grid */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-8 mt-16">
        <SectionHeader
          eyebrow="FRESH CHAPTERS"
          title="Recently Added &amp; Updated"
          countText="Updated daily"
          onViewAll={() => navigateToBrowse({ type: 'MANGA' })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {discovery.recentlyUpdated.map((manga: AnimeMedia) => {
            const title = manga.title.english || manga.title.romaji;
            const latestChNum = manga.chaptersCount || 40;

            return (
              <div
                key={manga.id}
                className="p-4 rounded-2xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all flex gap-4 group hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
              >
                {/* Poster with country flag and green new-chapter pulse dot */}
                <div
                  onClick={() => navigateToMangaDetail(manga.id)}
                  className="relative w-[90px] h-[130px] rounded-xl overflow-hidden bg-[#141418] flex-shrink-0 cursor-pointer shadow-md"
                >
                  <img
                    src={manga.coverImage.medium || manga.coverImage.large}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Country Flag Chip */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-[9px] font-bold text-white border border-white/10">
                    {manga.country || 'JP'}
                  </span>

                  {/* Green Pulse Dot for New Chapter */}
                  {manga.hasNewChapter && (
                    <span
                      title="New chapter available"
                      className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]" />
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/70">
                        {manga.mangaType || 'MANGA'}
                      </span>
                      <span className="text-[11px] text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Recently</span>
                      </span>
                    </div>

                    <h3
                      onClick={() => navigateToMangaDetail(manga.id)}
                      className="font-heading text-sm font-bold text-white truncate cursor-pointer hover:text-[#c084fc] transition-colors"
                      title={title}
                    >
                      {title}
                    </h3>

                    <p className="text-[11px] text-white/60 truncate mt-1">
                      {manga.latestChapterTitle || `Ch. ${latestChNum}: The Awakening`}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold text-[#22c55e] px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30">
                        Available
                      </span>
                      {manga.author && (
                        <span className="text-[11px] text-white/40 truncate">
                          by {manga.author}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* "Read Latest Chapter" link with book icon */}
                  <button
                    onClick={() => navigateToReader(manga.id, latestChNum)}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#c084fc] transition-colors self-start group/btn"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#8b5cf6] group-hover/btn:translate-x-0.5 transition-transform" />
                    <span>Read Latest Chapter</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 1.1 TOP RATED ALL-TIME: Horizontal rail with chevrons */}
      <section className="relative max-w-[1440px] mx-auto px-6 sm:px-8 mt-16">
        <SectionHeader
          eyebrow="CRITICALLY ACCLAIMED"
          title="Top Rated All-Time"
          countText={`${discovery.topRated.length} masterpieces`}
          onViewAll={() => navigateToBrowse({ type: 'MANGA' })}
        />

        <div className="relative group/rail">
          {/* Left Circular Chevron */}
          <button
            onClick={() => scrollContainer(topRatedScrollRef, 'left')}
            className="absolute -left-3 sm:-left-4 top-[38%] -translate-y-1/2 z-20 w-10 h-10 rounded-full glass bg-[#0c0c0e]/90 hover:bg-[#1a1a20] border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
            aria-label="Scroll top rated left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Horizontal Rail */}
          <div
            ref={topRatedScrollRef}
            className="flex items-start gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-1"
          >
            {discovery.topRated.map((manga: AnimeMedia) => (
              <div
                key={manga.id}
                onClick={() => navigateToMangaDetail(manga.id)}
                className="flex-shrink-0 w-[160px] sm:w-[175px] cursor-pointer group"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/10 group-hover:border-white/25 transition-all shadow-md group-hover:-translate-y-1">
                  <img
                    src={manga.coverImage.large || manga.coverImage.extraLarge}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-bold text-[#fbbf24] border border-white/10 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{manga.averageScore ? (manga.averageScore / 10).toFixed(1) : '9.0'}</span>
                  </div>
                </div>
                <h4 className="font-heading text-xs font-bold text-white truncate mt-2.5 group-hover:text-[#c084fc] transition-colors">
                  {manga.title.english || manga.title.romaji}
                </h4>
                <p className="text-[11px] text-white/40 truncate mt-0.5">
                  {manga.genres?.slice(0, 2).join(' · ')}
                </p>
              </div>
            ))}
          </div>

          {/* Right Circular Chevron */}
          <button
            onClick={() => scrollContainer(topRatedScrollRef, 'right')}
            className="absolute -right-3 sm:-right-4 top-[38%] -translate-y-1/2 z-20 w-10 h-10 rounded-full glass bg-[#0c0c0e]/90 hover:bg-[#1a1a20] border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.8)] transition-all cursor-pointer"
            aria-label="Scroll top rated right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 1.1 POPULAR & TRENDING GRID (6 cols desktop -> 4 md -> 2 mobile) */}
      <section className="max-w-[1440px] mx-auto px-6 sm:px-8 mt-16">
        <SectionHeader
          eyebrow="GLOBAL READERSHIP"
          title="Popular &amp; Trending Manga"
          countText={`${discovery.popular.length} series`}
          onViewAll={() => navigateToBrowse({ type: 'MANGA' })}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
          {discovery.popular.map((manga: AnimeMedia) => (
            <div
              key={manga.id}
              onClick={() => navigateToMangaDetail(manga.id)}
              className="cursor-pointer"
            >
              <PosterCard anime={manga} showHoverPreview={false} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
