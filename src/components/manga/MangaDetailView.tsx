import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Eye,
  BookOpen,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  Plus,
  Share2,
  Calendar,
  Globe,
  Sparkles,
} from 'lucide-react';
import { getMangaChapters, getMangaDetails } from '../../services/animeApi';
import { AnimeMedia, MangaChapter } from '../../types';
import { useApp } from '../../context/AppContext';
import { AccentHeading } from '../common/AccentHeading';
import { PosterCard } from '../common/PosterCard';

interface MangaDetailViewProps {
  mangaId: number;
}

export const MangaDetailView: React.FC<MangaDetailViewProps> = ({ mangaId }) => {
  const { navigateToManga, navigateToReader, isFavorited, toggleFavorite, showToast } = useApp();
  const [manga, setManga] = useState<AnimeMedia | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [mobileInfoExpanded, setMobileInfoExpanded] = useState(false);

  const chapterListRef = useRef<HTMLDivElement>(null);
  const CHAPTERS_PER_PAGE = 20;

  useEffect(() => {
    getMangaDetails(mangaId).then((m) => {
      if (m) {
        setManga(m);
        const title = m.title.english || m.title.romaji;
        getMangaChapters(m.id, title, m.chaptersCount || 40).then((chList) => {
          setChapters(chList);
        });
      }
    });
    setCurrentPage(1);
  }, [mangaId]);

  if (!manga) return null;

  const displayTitle = manga.title.english || manga.title.romaji;
  const favorited = isFavorited(manga.id);
  const totalChapters = chapters.length;

  // Filter & Sort chapters
  let filtered = chapters.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.number.toString().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.scanlatorGroup?.toLowerCase().includes(q)
    );
  });

  if (sortOrder === 'asc') {
    filtered = [...filtered].sort((a, b) => a.number - b.number);
  } else {
    filtered = [...filtered].sort((a, b) => b.number - a.number);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / CHAPTERS_PER_PAGE));
  const paginatedChapters = filtered.slice(
    (currentPage - 1) * CHAPTERS_PER_PAGE,
    currentPage * CHAPTERS_PER_PAGE
  );

  const scrollToChapters = () => {
    chapterListRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link Copied', `Share link for "${displayTitle}" copied to clipboard.`, 'info');
  };

  // Recommended related series from AniList
  const relatedPool = (manga.recommendations?.nodes?.map((n) => n.mediaRecommendation).filter(Boolean) || []) as AnimeMedia[];

  return (
    <div className="w-full min-h-screen bg-[#060607] text-white select-none pb-24">
      {/* 1.3 HERO BANNER WITH VIGNETTE */}
      <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] overflow-hidden bg-[#060607]">
        <img
          src={manga.bannerImage || manga.coverImage.extraLarge}
          alt={displayTitle}
          fetchPriority="high"
          className="w-full h-full object-cover object-[center_30%] opacity-30 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060607] via-[#060607]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060607]/80 via-transparent to-[#060607]/80" />
      </div>

      {/* Main Content Container */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb "‹ Manga library" */}
        <div className="relative -mt-14 mb-4 z-10 flex items-center justify-between">
          <button
            onClick={navigateToManga}
            className="text-xs font-semibold text-white/70 hover:text-white inline-flex items-center gap-1.5 transition-colors bg-[#0c0c0e]/80 hover:bg-[#141418] px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Manga library</span>
          </button>

          <button
            onClick={handleShare}
            className="text-xs font-semibold text-white/60 hover:text-white inline-flex items-center gap-1.5 transition-colors bg-[#0c0c0e]/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
            title="Share Manga"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Poster & Header Info Grid */}
        <div className="relative flex flex-col md:flex-row gap-8 items-start mb-12 z-10">
          {/* Left Column: Overlapping Poster & Metadata Panel */}
          <div className="w-full md:w-[220px] flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="w-[190px] sm:w-[220px] h-[280px] sm:h-[320px] rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.8)] relative group">
              <img
                src={manga.coverImage.large || manga.coverImage.extraLarge}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              {manga.country && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 shadow-sm">
                  {manga.country}
                </span>
              )}
            </div>

            {/* Favorite / Bookmark Button */}
            <button
              onClick={() => {
                toggleFavorite(manga.id);
                showToast(
                  favorited ? 'Removed from Library' : 'Added to Library',
                  `${displayTitle} has been updated in your library.`,
                  'info'
                );
              }}
              className={`w-full max-w-[220px] h-[38px] mt-3 rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
                favorited
                  ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-[#c084fc]'
                  : 'bg-[#0c0c0e] hover:bg-[#1a1a20] border-white/15 text-white'
              }`}
            >
              {favorited ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{favorited ? 'In Your Library' : '+ Add to Library'}</span>
            </button>

            {/* Mobile Accordion Toggle for Manga Info */}
            <div className="w-full md:hidden mt-4">
              <button
                onClick={() => setMobileInfoExpanded(!mobileInfoExpanded)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0c0c0e] border border-white/10 flex items-center justify-between text-xs font-bold text-white/80"
              >
                <span>Series Metadata</span>
                {mobileInfoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Manga Info Side Panel (Always visible on desktop, accordion on mobile) */}
            <div
              className={`w-full max-w-[220px] text-xs space-y-2.5 mt-5 pt-4 border-t border-white/10 ${
                mobileInfoExpanded ? 'block' : 'hidden md:block'
              }`}
            >
              <AccentHeading title="Series Info" size="sm" className="mb-2" />
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-white/40">Format:</span>
                <span className="font-semibold text-white">{manga.mangaType || 'MANGA'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-white/40">Origin:</span>
                <span className="font-semibold text-white">
                  {manga.country === 'KR'
                    ? 'South Korea'
                    : manga.country === 'CN'
                    ? 'China'
                    : 'Japan'}
                </span>
              </div>
              {manga.author && (
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Author:</span>
                  <span className="font-semibold text-white truncate max-w-[130px]" title={manga.author}>
                    {manga.author}
                  </span>
                </div>
              )}
              {manga.artist && (
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Artist:</span>
                  <span className="font-semibold text-white truncate max-w-[130px]" title={manga.artist}>
                    {manga.artist}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-white/40">Chapters:</span>
                <span className="font-semibold text-white">{totalChapters} chapters</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/[0.06]">
                <span className="text-white/40">Status:</span>
                <span className="font-semibold text-[#22c55e]">{manga.status || 'RELEASING'}</span>
              </div>
              {manga.seasonYear && (
                <div className="flex justify-between py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Year:</span>
                  <span className="font-semibold text-white">{manga.seasonYear}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Title, Metadata Row, Synopsis, Hero Buttons */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {/* Format Badge */}
            <span className="inline-block px-2.5 py-0.5 rounded-[6px] bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc] text-[10px] font-bold uppercase tracking-wider mb-2.5">
              {manga.mangaType || manga.format || 'MANGA'}
            </span>

            {/* H1 Title */}
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
              {displayTitle}
            </h1>

            {/* Meta Row: Rating, Chapter count, Views, Status pill */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs">
              <span className="h-[30px] px-3 rounded-full border border-white/20 bg-white/10 font-bold text-white flex items-center gap-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 text-[#fbbf24] fill-[#fbbf24]" />
                <span>{manga.averageScore ? (manga.averageScore / 10).toFixed(1) : '9.0'}</span>
              </span>
              <span className="h-[30px] px-3 rounded-full border border-white/15 bg-[#0c0c0e] text-white/80 flex items-center">
                {totalChapters} chapters
              </span>
              <span className="h-[30px] px-3 rounded-full border border-white/15 bg-[#0c0c0e] text-white/80 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{manga.viewsCount || '12M views'}</span>
              </span>
              <span className="h-[30px] px-3.5 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e] font-bold flex items-center">
                {manga.status || 'RELEASING'}
              </span>
            </div>

            {/* Author / Artist Credit Line */}
            {(manga.author || manga.artist) && (
              <div className="mt-3 text-xs text-white/60">
                {manga.author && (
                  <span>
                    Story by <strong className="text-white/90">{manga.author}</strong>
                  </span>
                )}
                {manga.author && manga.artist && <span> · </span>}
                {manga.artist && (
                  <span>
                    Art by <strong className="text-white/90">{manga.artist}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Genre Pills */}
            <div className="mt-3.5 flex flex-wrap justify-center md:justify-start gap-1.5">
              {(manga.genres || ['Action', 'Adventure', 'Fantasy']).map((g) => (
                <span
                  key={g}
                  className="px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-[11px] text-white/70 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis with Show More Toggle */}
            <div className="mt-4 text-xs sm:text-sm text-white/70 leading-relaxed max-w-[840px] mx-auto md:mx-0">
              <p className={showFullDesc ? '' : 'line-clamp-3'}>{manga.description}</p>
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-1 text-white/90 hover:text-white font-semibold text-xs inline-flex items-center gap-1 transition-colors"
              >
                <span>{showFullDesc ? 'Show Less' : 'Show More'}</span>
                {showFullDesc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Three Action Buttons: Read First (Ch. 1), Read Latest (Ch. N), Chapters ⌄ */}
            <div className="mt-6 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => navigateToReader(manga.id, 1)}
                className="h-[40px] px-6 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(255,255,255,0.2)] active:scale-95"
              >
                <BookOpen className="w-4 h-4 text-black" />
                <span>Read First (Ch. 1)</span>
              </button>

              <button
                onClick={() => navigateToReader(manga.id, totalChapters)}
                className="h-[40px] px-5 rounded-full glass bg-white/5 hover:bg-white/15 text-white text-xs font-semibold border border-white/20 transition-all active:scale-95"
              >
                Read Latest (Ch. {totalChapters})
              </button>

              <button
                onClick={scrollToChapters}
                className="h-[40px] px-4 rounded-full text-white/70 hover:text-white text-xs font-semibold hover:bg-white/5 transition-all flex items-center gap-1"
              >
                <span>Chapters</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 1.4 CHAPTERS LIST PANEL */}
        <div ref={chapterListRef} className="pt-10 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <AccentHeading
              title="Chapter Archive"
              subtext={`${filtered.length} released chapters`}
              size="md"
            />

            {/* Search, Sort, View Toggle */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search chapter..."
                  className="w-[180px] sm:w-[220px] h-[36px] pl-8 pr-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Sort Order Button */}
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="h-[36px] px-3.5 rounded-full bg-[#0c0c0e] hover:bg-white/10 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 transition-all"
                title={`Sort ${sortOrder === 'desc' ? 'Ascending (oldest first)' : 'Descending (newest first)'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase text-[10px] font-bold tracking-wider">
                  {sortOrder}
                </span>
              </button>

              {/* View Mode Toggle */}
              <div className="inline-flex p-0.5 rounded-full bg-[#0c0c0e] border border-white/10">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="List view"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-full transition-all ${
                    viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mirrored Top Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-white/50 mb-4 pb-2 border-b border-white/[0.06]">
              <span>
                Page {currentPage} of {totalPages} ({filtered.length} chapters)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-[#0c0c0e] hover:bg-[#141418] border border-white/10 disabled:opacity-30 transition-all cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-[#0c0c0e] hover:bg-[#141418] border border-white/10 disabled:opacity-30 transition-all cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Chapter Content: List, Grid, or Clean Empty State */}
          {chapters.length === 0 ? (
            <div className="rounded-2xl bg-[#0c0c0e] border border-white/[0.08] p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-white/30 mx-auto" />
              <h4 className="font-heading text-sm font-bold text-white">No Chapters Indexed</h4>
              <p className="text-xs text-white/50 max-w-[420px] mx-auto leading-relaxed">
                Chapters for this manga will appear once synchronized from your MangaDex or backend provider adapter.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-[#0c0c0e] border border-white/[0.08] p-10 text-center space-y-2">
              <p className="text-xs text-white/40">No chapters match "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[#c084fc] hover:underline"
              >
                Clear Search Filter
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="rounded-2xl bg-[#0c0c0e] border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden">
              {paginatedChapters.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => navigateToReader(manga.id, ch.number)}
                  className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.05] transition-colors group ${
                    ch.isRead ? 'opacity-65' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <span className="font-heading text-xs font-bold text-white w-14 sm:w-16 flex-shrink-0">
                      Ch. {ch.number}
                    </span>
                    <span className="text-xs text-white/90 group-hover:text-white truncate font-medium">
                      {ch.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 text-xs text-white/40 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-[4px] bg-white/5 border border-white/10 text-[10px]">
                      {ch.scanlatorGroup} · {ch.pagesCount}p
                    </span>
                    <span className="hidden sm:inline text-[11px]">{ch.publishDate}</span>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {paginatedChapters.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => navigateToReader(manga.id, ch.number)}
                  className="p-3.5 rounded-xl bg-[#0c0c0e] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer hover:bg-white/[0.05] group"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span className="group-hover:text-[#c084fc] transition-colors">
                      Ch. {ch.number}
                    </span>
                    <span className="text-[10px] text-white/40 font-normal">{ch.pagesCount}p</span>
                  </div>
                  <p className="text-[11px] text-white/50 truncate mt-1">{ch.title}</p>
                  <div className="text-[10px] text-white/30 mt-2 flex justify-between items-center">
                    <span>{ch.scanlatorGroup}</span>
                    <span>{ch.publishDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mirrored Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-white/50 mt-6 pt-4 border-t border-white/[0.06]">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-[#0c0c0e] hover:bg-[#141418] border border-white/10 disabled:opacity-30 transition-all cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg bg-[#0c0c0e] hover:bg-[#141418] border border-white/10 disabled:opacity-30 transition-all cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RELATED / RECOMMENDED SERIES AT BOTTOM */}
        <div className="mt-16 pt-10 border-t border-white/10">
          <AccentHeading
            title="You May Also Like"
            subtext="Readers of this series also enjoyed"
            size="md"
            className="mb-6"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {relatedPool.map((item: AnimeMedia) => (
              <PosterCard key={item.id} anime={item} showHoverPreview={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
