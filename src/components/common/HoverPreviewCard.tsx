import React from 'react';
import { Star } from 'lucide-react';
import { AnimeMedia } from '../../types';

interface HoverPreviewCardProps {
  anime: AnimeMedia;
  position: { x: number; y: number; placeAbove?: boolean; alignRight?: boolean };
  onClose: () => void;
  onClick: () => void;
}

export const HoverPreviewCard: React.FC<HoverPreviewCardProps> = ({
  anime,
  position,
  onClick,
}) => {
  const displayTitle = anime.title.english || anime.title.romaji;
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.2';
  const year = anime.seasonYear || 2024;
  const banner = anime.bannerImage || anime.coverImage.extraLarge || anime.coverImage.large;

  return (
    <div
      style={{
        top: position.placeAbove ? `${position.y - 335}px` : `${position.y + 20}px`,
        left: position.alignRight ? `${position.x - 290}px` : `${position.x}px`,
      }}
      onClick={onClick}
      className="fixed z-50 w-[290px] h-[325px] rounded-[16px] bg-[#111114] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden cursor-pointer flex flex-col pointer-events-auto transition-opacity duration-200 animate-in fade-in"
    >
      {/* Top banner strip (~85px) */}
      <div className="relative h-[85px] w-full bg-[#18181c] overflow-hidden flex-shrink-0">
        <img
          src={banner}
          alt={displayTitle}
          className="w-full h-full object-cover opacity-60"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111114]/40 to-[#111114]" />
      </div>

      {/* Content overlapping banner */}
      <div className="relative px-3.5 -mt-8 flex gap-3 items-start flex-shrink-0">
        <div className="w-[52px] h-[75px] rounded-[8px] border border-white/15 overflow-hidden flex-shrink-0 bg-[#0c0c0e] shadow-md">
          <img
            src={anime.coverImage.medium || anime.coverImage.large}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="pt-8 min-w-0 flex-1">
          <h3 className="font-heading text-xs font-bold uppercase text-white line-clamp-2 leading-tight">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/60">
            <span className="flex items-center text-[#f5c518] font-semibold gap-0.5">
              <Star className="w-3 h-3 fill-current" />
              {score}
            </span>
            <span>•</span>
            <span>{anime.format || 'TV'}</span>
            <span>•</span>
            <span>{year}</span>
          </div>
        </div>
      </div>

      {/* Genre Chips */}
      <div className="px-3.5 mt-2.5 flex flex-wrap gap-1.5">
        {(anime.genres || ['Action', 'Fantasy']).slice(0, 3).map((g) => (
          <span
            key={g}
            className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/70"
          >
            {g}
          </span>
        ))}
      </div>

      {/* Description clamped */}
      <div className="px-3.5 mt-2 flex-1 overflow-hidden">
        <p className="text-[12px] text-white/60 leading-relaxed line-clamp-3">
          {anime.description?.replace(/<[^>]*>?/gm, '') ||
            'Follow the journey of intrepid heroes embarking across realms uncharted, fighting treacherous adversaries and unraveling cosmic mysteries.'}
        </p>
      </div>

      {/* Hairline divider & Click footer */}
      <div className="mt-auto border-t border-white/10 px-3.5 py-2.5 bg-black/20 flex items-center justify-between text-[11px] text-white/50">
        <span className="flex items-center gap-1 hover:text-white transition-colors">
          <span className="text-[#8b5cf6]">▶</span> Click to view details
        </span>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">MIRAI</span>
      </div>
    </div>
  );
};
