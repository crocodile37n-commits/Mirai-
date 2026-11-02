import React, { useState, useRef } from 'react';
import { Star, Heart } from 'lucide-react';
import { AnimeMedia } from '../../types';
import { useApp } from '../../context/AppContext';
import { HoverPreviewCard } from './HoverPreviewCard';

interface PosterCardProps {
  anime: AnimeMedia;
  rank?: number;
  showHoverPreview?: boolean;
  aspectRatio?: '2/3' | '5/7';
  className?: string;
  eagerLoad?: boolean;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  anime,
  rank,
  showHoverPreview = true,
  aspectRatio = '2/3',
  className = '',
  eagerLoad = false,
}) => {
  const {
    navigateToDetail,
    navigateToWatch,
    navigateToMangaDetail,
    navigateToReader,
    isFavorited,
    toggleFavorite,
  } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPos, setPreviewPos] = useState({ x: 0, y: 0, placeAbove: false, alignRight: false });
  const hoverTimeoutRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isManga =
    anime.format === 'MANGA' ||
    anime.format === 'MANHWA' ||
    anime.format === 'MANHUA' ||
    Boolean(anime.mangaType);

  const favorited = isFavorited(anime.id);
  const displayTitle = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.2';

  const epCountDisplay = isManga
    ? anime.chaptersCount
      ? `${anime.chaptersCount} CH`
      : 'CH. 1+'
    : anime.format === 'MOVIE'
    ? '1 EP'
    : anime.status === 'RELEASING'
    ? 'ONGOING'
    : anime.episodes
    ? `${anime.episodes} EP`
    : '12 EP';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!showHoverPreview) return;

    // Detect touch device - don't trigger hover preview on touch
    if (window.matchMedia('(hover: none)').matches) return;

    hoverTimeoutRef.current = window.setTimeout(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const placeAbove = spaceBelow < 340;
        const alignRight = rect.right + 290 > window.innerWidth;

        setPreviewPos({
          x: alignRight ? rect.right : rect.left,
          y: placeAbove ? rect.top : rect.bottom,
          placeAbove,
          alignRight,
        });
        setShowPreview(true);
      }
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowPreview(false);
  };

  const handleCardClick = () => {
    setShowPreview(false);
    if (isManga) {
      navigateToMangaDetail(anime.id);
    } else {
      navigateToDetail(anime.id);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(false);
    if (isManga) {
      navigateToReader(anime.id, 1);
    } else {
      navigateToWatch(anime.id, 1);
    }
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(anime.id);
  };

  const aspectClass = aspectRatio === '5/7' ? 'aspect-[5/7]' : 'aspect-[2/3]';

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className={`group relative flex flex-col cursor-pointer select-none transition-transform duration-200 ease-out hover:-translate-y-1 ${className}`}
    >
      {/* Poster Image Container */}
      <div
        className={`relative w-full ${aspectClass} rounded-[16px] overflow-hidden bg-[#0c0c0e] border border-white/[0.08] group-hover:border-white/20 transition-colors shadow-md`}
      >
        <img
          src={anime.coverImage.large || anime.coverImage.extraLarge}
          alt={displayTitle}
          loading={eagerLoad ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Rank pill or Country chip on top-left */}
        {rank !== undefined ? (
          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full glass text-[11px] font-bold text-white shadow-sm">
            #{rank}
          </div>
        ) : anime.country ? (
          <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-[4px] bg-black/80 backdrop-blur-md text-[9px] font-bold text-white border border-white/10 shadow-sm">
            {anime.country}
          </div>
        ) : null}

        {/* Heart Favorite button on top-right */}
        <button
          type="button"
          onClick={handleHeartClick}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 z-10 w-[30px] h-[30px] rounded-full glass flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
            favorited ? 'text-[#f472b6] bg-white/20' : 'text-white/80 hover:text-white'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform ${favorited ? 'fill-[#f472b6]' : ''}`}
          />
        </button>

        {/* Hover Centred "▶ Play" / "▶ Read" Glass Pill */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <button
            type="button"
            onClick={handlePlayClick}
            className="pointer-events-auto h-[32px] px-3.5 rounded-full glass bg-black/40 hover:bg-black/60 text-white text-[12px] font-bold tracking-wide flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <span className="text-[#8b5cf6] text-[11px]">▶</span>
            <span>{isManga ? 'Read' : 'Play'}</span>
          </button>
        </div>
      </div>

      {/* Info Below Image (~8-10px gap) */}
      <div className="mt-2.5 px-0.5">
        <h3
          title={displayTitle}
          className="font-heading text-[13px] font-bold text-white line-clamp-1 leading-snug tracking-tight group-hover:text-white/90"
        >
          {displayTitle}
        </h3>

        {/* Meta row: 3 items justified */}
        <div className="mt-1 flex items-center justify-between text-[11px] font-medium uppercase text-white/60 tracking-wider">
          <span className="truncate">{anime.format || 'TV'}</span>
          <span className="flex items-center gap-0.5 text-[#f5c518] font-bold mx-1">
            <Star className="w-2.5 h-2.5 fill-current" />
            <span>{score}</span>
          </span>
          <span className="text-right whitespace-nowrap">{epCountDisplay}</span>
        </div>
      </div>

      {/* Floating Hover Preview Card (delayed hover intent) */}
      {showPreview && (
        <HoverPreviewCard
          anime={anime}
          position={previewPos}
          onClose={() => setShowPreview(false)}
          onClick={handleCardClick}
        />
      )}
    </div>
  );
};
