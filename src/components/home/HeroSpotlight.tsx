import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { AnimeMedia } from '../../types';
import { useApp } from '../../context/AppContext';

interface HeroSpotlightProps {
  items: AnimeMedia[];
}

export const HeroSpotlight: React.FC<HeroSpotlightProps> = ({ items }) => {
  const { navigateToDetail, navigateToWatch, navigateToBrowse } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoRotateRef = useRef<number | null>(null);

  const total = items.length || 1;
  const currentAnime = items[currentIndex] || items[0];

  useEffect(() => {
    if (isPaused || total <= 1) return;

    autoRotateRef.current = window.setInterval(() => {
      if (document.hidden) return;
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 7000);

    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [isPaused, total]);

  if (!currentAnime) return null;

  const displayTitle = currentAnime.title.english || currentAnime.title.romaji;
  const banner =
    currentAnime.bannerImage ||
    currentAnime.coverImage.extraLarge ||
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80';

  const scorePercentage = currentAnime.averageScore || 83;
  const episodesDisplay = currentAnime.episodes ? `${currentAnime.episodes} EP` : '10 EP';
  const yearDisplay = currentAnime.seasonYear || 2026;
  const genresDisplay = (currentAnime.genres || ['ACTION', 'DRAMA', 'SCI-FI'])
    .slice(0, 3)
    .join(' — ')
    .toUpperCase();

  const isCyberpunk = currentAnime.title.romaji?.toLowerCase().includes('cyberpunk') ||
                      currentAnime.title.english?.toLowerCase().includes('cyberpunk');

  // Helper to get neighbor items for the 7-card fan
  const getItemAtOffset = (offset: number) => {
    const idx = (currentIndex + offset + total * 10) % total;
    return items[idx] || currentAnime;
  };

  const leftCard3 = getItemAtOffset(-3);
  const leftCard2 = getItemAtOffset(-2);
  const leftCard1 = getItemAtOffset(-1);
  const centerCard = currentAnime;
  const rightCard1 = getItemAtOffset(1);
  const rightCard2 = getItemAtOffset(2);
  const rightCard3 = getItemAtOffset(3);

  const slideNumberFormatted = String(currentIndex + 1).padStart(2, '0');

  return (
    <section
      aria-label="Spotlight Featured Anime"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full h-[620px] md:h-[660px] overflow-hidden bg-black select-none"
    >
      {/* Background Banner with Dark Overlays and Bottom Gradient */}
      <div className="absolute inset-0">
        <img
          key={currentAnime.id}
          src={banner}
          alt={displayTitle}
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-[center_30%] transition-opacity duration-700 ease-in-out opacity-45 scale-[1.02]"
        />
        {/* Soft side vignette & dark backdrop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-black" />
        {/* Bottom 35% gradient to pure black */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Top Labels under Navbar: "— SPOTLIGHT / 01" and "10 TOTAL" */}
      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-8 pt-20 flex items-center justify-between text-[11px] font-bold text-white/50 tracking-[0.2em] uppercase z-10">
        <div className="flex items-center gap-2">
          <span className="w-4 h-[2px] bg-white/60 inline-block" />
          <span>SPOTLIGHT / {slideNumberFormatted}</span>
        </div>
        <span>{String(total).padStart(2, '0')} TOTAL</span>
      </div>

      {/* Centred Hero Content */}
      <div className="relative max-w-[1100px] mx-auto px-4 h-[calc(100%-110px)] flex flex-col items-center justify-center text-center z-10">
        {/* Card Fan (Centred 7-card fan matching Screenshot 8dbaff1d) */}
        <div className="relative flex items-center justify-center h-[210px] w-full max-w-[800px] mb-4">
          {/* Left Card 3 (-18°) */}
          <div
            onClick={() => setCurrentIndex((prev) => (prev - 3 + total) % total)}
            className="absolute -translate-x-[240px] w-[95px] h-[135px] rounded-[14px] overflow-hidden border border-white/10 shadow-2xl transform -rotate-[18deg] opacity-35 hover:opacity-70 transition-all cursor-pointer hidden lg:block bg-neutral-900 z-[1]"
          >
            <img
              src={leftCard3.coverImage.medium || leftCard3.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Left Card 2 (-12°) */}
          <div
            onClick={() => setCurrentIndex((prev) => (prev - 2 + total) % total)}
            className="absolute -translate-x-[160px] w-[110px] h-[155px] rounded-[14px] overflow-hidden border border-white/10 shadow-2xl transform -rotate-[12deg] opacity-55 hover:opacity-85 transition-all cursor-pointer hidden sm:block bg-neutral-900 z-[2]"
          >
            <img
              src={leftCard2.coverImage.medium || leftCard2.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Left Card 1 (-6°) */}
          <div
            onClick={() => setCurrentIndex((prev) => (prev - 1 + total) % total)}
            className="absolute -translate-x-[85px] w-[125px] h-[175px] rounded-[16px] overflow-hidden border border-white/15 shadow-2xl transform -rotate-[6deg] opacity-75 hover:opacity-95 transition-all cursor-pointer bg-neutral-900 z-[3]"
          >
            <img
              src={leftCard1.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Center Focused Poster (~140x190 with ~2px white border) */}
          <div
            onClick={() => navigateToDetail(centerCard.id)}
            className="relative z-10 w-[140px] h-[195px] rounded-[16px] overflow-hidden border-2 border-white shadow-[0_20px_50px_rgba(0,0,0,0.95)] cursor-pointer group bg-neutral-900 hover:scale-105 transition-all duration-300"
          >
            <img
              src={centerCard.coverImage.large || centerCard.coverImage.extraLarge}
              alt={displayTitle}
              fetchPriority="high"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </div>

          {/* Right Card 1 (+6°) */}
          <div
            onClick={() => setCurrentIndex((prev) => (prev + 1) % total)}
            className="absolute translate-x-[85px] w-[125px] h-[175px] rounded-[16px] overflow-hidden border border-white/15 shadow-2xl transform rotate-[6deg] opacity-75 hover:opacity-95 transition-all cursor-pointer bg-neutral-900 z-[3]"
          >
            <img
              src={rightCard1.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Right Card 2 (+12°) */}
          <div
            onClick={() => setCurrentIndex((prev) => (prev + 2) % total)}
            className="absolute translate-x-[160px] w-[110px] h-[155px] rounded-[14px] overflow-hidden border border-white/10 shadow-2xl transform rotate-[12deg] opacity-55 hover:opacity-85 transition-all cursor-pointer hidden sm:block bg-neutral-900 z-[2]"
          >
            <img
              src={rightCard2.coverImage.medium || rightCard2.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Right Card 3 (+18°) */}
          <div
            onClick={() => setCurrentIndex((prev) => (prev + 3) % total)}
            className="absolute translate-x-[240px] w-[95px] h-[135px] rounded-[14px] overflow-hidden border border-white/10 shadow-2xl transform rotate-[18deg] opacity-35 hover:opacity-70 transition-all cursor-pointer hidden lg:block bg-neutral-900 z-[1]"
          >
            <img
              src={rightCard3.coverImage.medium || rightCard3.coverImage.large}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Meta Line: Small bordered chip with dot "● ONA" + plain tracked uppercase text */}
        <div className="flex items-center justify-center gap-2.5 text-[11px] font-semibold text-white/70 tracking-[0.14em] uppercase mb-2">
          {/* Bordered format chip with dot */}
          <span className="px-2 py-0.5 rounded-[4px] border border-white/25 bg-black/40 text-white font-bold flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>{currentAnime.format || 'ONA'}</span>
          </span>

          <span>SCORE — {scorePercentage}%</span>
          <span className="text-white/30">|</span>
          <span>{episodesDisplay}</span>
          <span className="text-white/30">|</span>
          <span>{yearDisplay}</span>
        </div>

        {/* Title Treatment: Stylized graphic logo or bold sans title */}
        {isCyberpunk ? (
          <div
            onClick={() => navigateToDetail(currentAnime.id)}
            className="cursor-pointer max-w-[620px] my-1 group transition-transform hover:scale-105"
          >
            {/* Cyberpunk Edgerunners Stylized Graphic Treatment */}
            <div className="font-heading font-black text-4xl sm:text-5xl md:text-6xl text-[#fbee23] tracking-tight uppercase italic drop-shadow-[0_0_20px_rgba(251,238,35,0.4)]">
              CYBERPUNK
            </div>
            <div className="text-xs sm:text-sm font-extrabold tracking-[0.35em] text-[#00e5ff] uppercase -mt-1">
              ///// EDGERUNNERS /////
            </div>
          </div>
        ) : (
          <h1
            onClick={() => navigateToDetail(currentAnime.id)}
            className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-white tracking-tight line-clamp-1 max-w-[880px] drop-shadow-md cursor-pointer hover:text-white/90"
          >
            {displayTitle}
          </h1>
        )}

        {/* Genres Line: ACTION — DRAMA — SCI-FI */}
        <p className="mt-2 text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase">
          {genresDisplay}
        </p>

        {/* Buttons Row: Side by side, always visible glass pills */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => navigateToWatch(currentAnime.id, 1)}
            className="h-[38px] px-6 rounded-full glass bg-white/[0.12] hover:bg-white/[0.22] border border-white/20 text-white text-[11px] font-bold tracking-[0.12em] uppercase transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Watch Now</span>
          </button>
          <button
            onClick={() => navigateToBrowse({ type: 'ANIME' })}
            className="h-[38px] px-6 rounded-full glass bg-white/5 hover:bg-white/10 border border-white/15 text-white/90 text-[11px] font-bold tracking-[0.12em] uppercase transition-all active:scale-95"
          >
            Browse Catalogue
          </button>
        </div>
      </div>

      {/* Decorative Faint Numeral (e.g. "04") in Bottom-Right Corner (Partially Cropped) */}
      <div className="absolute -bottom-6 right-8 font-heading font-black text-[120px] md:text-[160px] text-white/[0.05] leading-none pointer-events-none select-none">
        {slideNumberFormatted}
      </div>
    </section>
  );
};
