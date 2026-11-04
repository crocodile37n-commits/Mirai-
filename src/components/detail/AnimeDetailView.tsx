import React, { useState, useEffect } from 'react';
import { Star, Play, Plus, Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { AccentHeading } from '../common/AccentHeading';
import { PosterCard } from '../common/PosterCard';
import { getAnimeDetails, generateEpisodesForAnime } from '../../services/animeApi';
import { AnimeMedia, EpisodeItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface AnimeDetailViewProps {
  animeId: number;
}

export const AnimeDetailView: React.FC<AnimeDetailViewProps> = ({ animeId }) => {
  const { navigateToWatch, isFavorited, toggleFavorite, showToast } = useApp();
  const [anime, setAnime] = useState<AnimeMedia | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [episodePage, setEpisodePage] = useState(0); // 0 = 1-12, 1 = 13-24, etc.

  const EPISODES_PER_PAGE = 12;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAnimeDetails(animeId).then((res) => {
      if (!isMounted) return;
      if (res) {
        setAnime(res);
        const epList = generateEpisodesForAnime(res);
        setEpisodes(epList);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [animeId]);

  if (loading || !anime) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center pt-24">
        <div className="w-10 h-10 border-2 border-white/20 border-t-[#f472b6] rounded-full animate-spin" />
      </div>
    );
  }

  const primaryTitle = anime.title.english || anime.title.romaji;
  const secondaryTitle = anime.title.english ? anime.title.romaji : anime.title.native;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.4';
  const year = anime.seasonYear || 2024;
  const totalEps = anime.episodes || episodes.length;
  const studioName = anime.studios?.nodes?.[0]?.name || 'Madhouse';
  const seasonText = `${anime.season || 'Summer'} ${year}`;

  const favorited = isFavorited(anime.id);

  // Filter episodes by search
  const filteredEpisodes = episodes.filter((ep) =>
    episodeSearch
      ? ep.number.toString().includes(episodeSearch.trim()) ||
        ep.title.toLowerCase().includes(episodeSearch.toLowerCase())
      : true
  );

  const totalPages = Math.ceil(episodes.length / EPISODES_PER_PAGE);
  const displayedEpisodes = episodeSearch
    ? filteredEpisodes
    : episodes.slice(episodePage * EPISODES_PER_PAGE, (episodePage + 1) * EPISODES_PER_PAGE);

  const startEp = episodePage * EPISODES_PER_PAGE + 1;
  const endEp = Math.min((episodePage + 1) * EPISODES_PER_PAGE, episodes.length);

  // Default characters fallback if nodes are empty
  const characters =
    anime.characters?.nodes && anime.characters.nodes.length > 0
      ? anime.characters.nodes
      : [
          { id: 1, name: { full: 'Protagonist' }, role: 'MAIN' as const, image: { large: anime.coverImage.medium, medium: null } },
          { id: 2, name: { full: 'Allied Fighter' }, role: 'MAIN' as const, image: { large: null, medium: null } },
          { id: 3, name: { full: 'Sage Mentor' }, role: 'SUPPORTING' as const, image: { large: null, medium: null } },
        ];

  // Recommendations fallback
  const recommendations =
    anime.recommendations?.nodes
      ?.map((r) => r.mediaRecommendation)
      .filter(Boolean)
      .slice(0, 5) || [];

  return (
    <div className="min-w-0 max-w-[1440px] mx-auto pb-20 select-none">
      {/* 6.1 Hero Banner (~310px tall visible) */}
      <div className="relative w-full h-[310px] md:h-[350px] overflow-hidden bg-black">
        <img
          src={anime.bannerImage || anime.coverImage.extraLarge}
          alt={primaryTitle}
          fetchPriority="high"
          className="w-full h-full object-cover object-[center_30%] opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
      </div>

      {/* Main Detail Container */}
      <div className="max-w-[1260px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Poster & Header Row */}
        <div className="relative -mt-[140px] md:-mt-[160px] flex flex-col md:flex-row gap-8 items-start mb-10 z-10">
          {/* Left: Overlapping Poster (~195x290) */}
          <div className="w-[195px] flex-shrink-0 mx-auto md:mx-0">
            <div className="w-[195px] h-[290px] rounded-[16px] overflow-hidden bg-[#0c0c0e] border border-white/15 shadow-[0_20px_45px_rgba(0,0,0,0.9)]">
              <img
                src={anime.coverImage.large || anime.coverImage.extraLarge}
                alt={primaryTitle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Left Column Actions under Poster */}
            <div className="mt-4 flex flex-col gap-2.5 w-full">
              <button
                onClick={() => navigateToWatch(anime.id, 1)}
                className="w-full h-[36px] rounded-full bg-[#121215] hover:bg-white/15 border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span>Play Episode 1</span>
              </button>

              <button
                onClick={() => {
                  toggleFavorite(anime.id);
                  showToast(favorited ? 'Removed' : 'Added to List', `${primaryTitle} updated.`, 'info');
                }}
                className={`w-full h-[36px] rounded-full border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  favorited
                    ? 'bg-[#f472b6]/20 border-[#f472b6]/40 text-[#f472b6]'
                    : 'bg-[#0c0c0e] hover:bg-white/10 border-white/15 text-white'
                }`}
              >
                {favorited ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{favorited ? 'In Your List' : '+ Add to List'}</span>
              </button>
            </div>

            {/* 6.2 ANIME INFO Section */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <AccentHeading title="Anime Info" size="sm" className="mb-4" />
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Format:</span>
                  <span className="font-semibold text-white">{anime.format || 'TV'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Studio:</span>
                  <span className="font-semibold text-white">{studioName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Episodes:</span>
                  <span className="font-semibold text-white">{totalEps} released</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Duration:</span>
                  <span className="font-semibold text-white">
                    {anime.duration || 24} mins
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/[0.06]">
                  <span className="text-white/40">Season:</span>
                  <span className="font-semibold text-white">{seasonText}</span>
                </div>
                {anime.title.native && (
                  <div className="flex justify-between items-baseline py-1 border-b border-white/[0.06]">
                    <span className="text-white/40">Native Title:</span>
                    <span className="font-semibold text-white text-right max-w-[110px] truncate">
                      {anime.title.native}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Content */}
          <div className="flex-1 min-w-0 pt-0 md:pt-16">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white leading-tight tracking-tight line-clamp-2">
              {primaryTitle}
            </h1>
            {secondaryTitle && (
              <p className="mt-1 text-base md:text-[17px] text-white/60 font-medium truncate">
                {secondaryTitle}
              </p>
            )}

            {/* Chips row */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="h-[30px] px-3 rounded-full border border-white/30 bg-white/10 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm">
                <Star className="w-3.5 h-3.5 text-[#f5c518] fill-[#f5c518]" />
                <span>{score}</span>
              </span>
              <span className="h-[30px] px-3 rounded-full border border-white/15 text-xs font-semibold text-white/80 flex items-center">
                {year}
              </span>
              <span className="h-[30px] px-3 rounded-full border border-white/15 text-xs font-semibold text-white/80 flex items-center">
                {anime.format || 'TV'}
              </span>
              <span className="h-[30px] px-3 rounded-full border border-white/15 text-xs font-semibold text-white/80 flex items-center">
                {totalEps} eps released
              </span>
              <span className="h-[30px] px-3 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 text-xs font-bold text-[#22c55e] flex items-center">
                {anime.status || 'RELEASING'}
              </span>
            </div>

            {/* Genre chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(anime.genres || ['Action', 'Fantasy']).map((g) => (
                <span
                  key={g}
                  className="h-[26px] px-3 rounded-full border border-white/10 text-xs text-white/70 flex items-center bg-white/5"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Synopsis paragraph */}
            <div className="mt-5 max-w-[920px]">
              <p className="text-[14.5px] leading-[1.75] text-white/65">
                {anime.description?.replace(/<[^>]*>?/gm, '') ||
                  'The fateful adventure begins as an ensemble of characters uncover secrets held within the ancient territories. Striking animation, intricate worldbuilding, and emotional payoffs await.'}
                {' '}
                <span className="text-white/40 text-xs">(Source: AniList)</span>
              </p>
            </div>

            {/* 6.3 Right Column: SELECT EPISODE */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <AccentHeading
                  title="Select Episode"
                  subtext={
                    episodes.length > 0
                      ? `${episodes.length} released episodes`
                      : 'Awaiting provider synchronization'
                  }
                  size="md"
                />

                {episodes.length > 0 && (
                  <span className="text-xs text-white/40 font-medium">
                    {startEp}–{endEp} of {episodes.length}
                  </span>
                )}
              </div>

              {episodes.length === 0 ? (
                /* Clean Empty Episode State */
                <div className="p-8 rounded-[16px] bg-[#0c0c0e] border border-white/[0.08] text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                    <Play className="w-5 h-5 ml-0.5" />
                  </div>
                  <h4 className="font-heading text-sm font-bold text-white">No Indexed Episodes Yet</h4>
                  <p className="text-xs text-white/50 max-w-[420px] mx-auto leading-relaxed">
                    Episode streams for this title have not been indexed by your provider adapter. Once a streaming source is attached, playable episodes will automatically appear here.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => navigateToWatch(anime.id, 1)}
                      className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 transition-all active:scale-95 shadow-md"
                    >
                      Open Player Standby
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Episode Search & Range Pager */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={episodeSearch}
                        onChange={(e) => setEpisodeSearch(e.target.value)}
                        placeholder={`Find episode 1–${episodes.length}`}
                        className="w-full h-[36px] pl-9 pr-4 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                      />
                    </div>

                    {/* Range Selector Group */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => setEpisodePage((p) => Math.max(0, p - 1))}
                        disabled={episodePage === 0}
                        className="w-8 h-8 rounded-full bg-[#0c0c0e] border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Previous episode range"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="h-[36px] px-3.5 rounded-full bg-[#0c0c0e] border border-white/10 text-xs font-semibold text-white flex items-center gap-1">
                        <span>Episodes {startEp}–{endEp}</span>
                      </div>

                      <button
                        onClick={() => setEpisodePage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={episodePage >= totalPages - 1}
                        className="w-8 h-8 rounded-full bg-[#0c0c0e] border border-white/10 flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                        aria-label="Next episode range"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Episode Pills: ~105x34px, wrapping */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {displayedEpisodes.map((ep) => (
                      <button
                        key={ep.number}
                        onClick={() => navigateToWatch(anime.id, ep.number)}
                        className="h-[34px] px-3 rounded-full border border-white/15 bg-[#0c0c0e] hover:bg-white/10 hover:border-white/30 text-xs font-semibold text-white/90 hover:text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 group"
                      >
                        <Play className="w-3 h-3 text-[#8b5cf6] group-hover:scale-110 transition-transform" />
                        <span>Episode {ep.number}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* CHARACTERS (Accent-bar): 3-column grid with circular avatar */}
              <div className="mt-12 pt-8 border-t border-white/10">
                <AccentHeading title="Characters" size="md" className="mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((char) => {
                    const hasImage = Boolean(char.image?.large || char.image?.medium);

                    return (
                      <div
                        key={char.id}
                        className="flex items-center gap-3.5 p-2.5 rounded-[14px] bg-[#0c0c0e] border border-white/[0.08]"
                      >
                        {/* Circular Avatar ~50px */}
                        <div className="w-[50px] h-[50px] rounded-full overflow-hidden flex-shrink-0 border border-white/10 bg-[#16161a] flex items-center justify-center">
                          {hasImage ? (
                            <img
                              src={char.image.large || char.image.medium || ''}
                              alt={char.name.full}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            /* Purple-tinted placeholder with 'NO IMAGE' text */
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#8b5cf6]/10 text-[#a78bfa] p-1 text-center">
                              <span className="text-[9px] font-black tracking-tighter uppercase leading-none">
                                NO
                              </span>
                              <span className="text-[8px] font-black tracking-tighter uppercase leading-none">
                                IMAGE
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-heading text-xs font-bold text-white truncate">
                            {char.name.full}
                          </h4>
                          <span className="text-[10px] font-extrabold tracking-wider uppercase text-white/40 block mt-0.5">
                            {char.role || 'MAIN'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* YOU MIGHT ALSO LIKE (Accent-bar): 5-column poster grid */}
              {recommendations.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/10">
                  <AccentHeading title="You Might Also Like" size="md" className="mb-6" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommendations.map((rec) => (
                      <PosterCard key={rec.id} anime={rec} showHoverPreview={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
