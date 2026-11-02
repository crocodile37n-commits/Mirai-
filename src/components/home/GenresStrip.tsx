import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Isekai',
  'Magic',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
];

export const GenresStrip: React.FC = () => {
  const { navigateToBrowse } = useApp();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#000000] border-y border-white/[0.08] py-3 select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        {/* Purple-tinted pill label "GENRES" */}
        <div className="flex-shrink-0 h-[28px] px-3 rounded-full bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 text-[#a78bfa] text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
          <Compass className="w-3.5 h-3.5" />
          <span>GENRES</span>
        </div>

        {/* Scroll Left Chevron */}
        <button
          onClick={() => scroll('left')}
          className="w-7 h-7 rounded-full bg-[#0c0c0e] hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0"
          aria-label="Scroll genres left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable Row of Genre Chips */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => navigateToBrowse({ genre })}
              className="h-[26px] px-3 rounded-full bg-[#0c0c0e] hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/70 hover:text-white transition-all flex-shrink-0 whitespace-nowrap active:scale-95"
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Scroll Right Chevron */}
        <button
          onClick={() => scroll('right')}
          className="w-7 h-7 rounded-full bg-[#0c0c0e] hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0"
          aria-label="Scroll genres right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
