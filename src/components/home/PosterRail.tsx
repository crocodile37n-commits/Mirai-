import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '../common/SectionHeader';
import { PosterCard } from '../common/PosterCard';
import { AnimeMedia } from '../../types';
import { useApp } from '../../context/AppContext';

interface PosterRailProps {
  eyebrow: string;
  title: string;
  countText?: string;
  items: AnimeMedia[];
  showRank?: boolean;
  genreFilter?: string;
  eagerFirstRow?: boolean;
}

export const PosterRail: React.FC<PosterRailProps> = ({
  eyebrow,
  title,
  countText,
  items,
  showRank = false,
  genreFilter,
  eagerFirstRow = false,
}) => {
  const { navigateToBrowse } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -680 : 680;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <section className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 select-none group/rail">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        countText={countText || `${items.length} titles`}
        onViewAll={() =>
          navigateToBrowse(
            genreFilter
              ? { genre: genreFilter }
              : { search: '' }
          )
        }
      />

      {/* Rail Container with Relative Edge Buttons */}
      <div className="relative">
        {/* Left Circular Chevron Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute -left-3 top-[38%] -translate-y-1/2 z-20 w-[38px] h-[38px] rounded-full glass flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
            aria-label={`Scroll ${title} rail left`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Scrollable Track: Gap ~22px, card width ~160px */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-start gap-[22px] overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1"
        >
          {items.map((anime, index) => (
            <div
              key={anime.id}
              className="flex-shrink-0 w-[150px] sm:w-[165px] md:w-[180px]"
            >
              <PosterCard
                anime={anime}
                rank={showRank ? index + 1 : undefined}
                eagerLoad={eagerFirstRow && index < 6}
                aspectRatio="2/3"
              />
            </div>
          ))}
        </div>

        {/* Right Circular Chevron Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute -right-3 top-[38%] -translate-y-1/2 z-20 w-[38px] h-[38px] rounded-full glass flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-xl"
            aria-label={`Scroll ${title} rail right`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};
