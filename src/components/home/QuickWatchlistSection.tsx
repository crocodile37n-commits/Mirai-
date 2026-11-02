import React from 'react';
import { SectionHeader } from '../common/SectionHeader';
import { PosterCard } from '../common/PosterCard';
import { useApp } from '../../context/AppContext';
import { AnimeMedia } from '../../types';

interface QuickWatchlistSectionProps {
  watchlistItems: AnimeMedia[];
}

export const QuickWatchlistSection: React.FC<QuickWatchlistSectionProps> = ({
  watchlistItems,
}) => {
  const { navigateToBrowse, navigateToProfile } = useApp();

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-14 select-none">
      <SectionHeader
        eyebrow="SAVED FOR LATER"
        title="Quick Watchlist"
        countText={watchlistItems.length > 0 ? `${watchlistItems.length} titles` : undefined}
        onViewAll={() => navigateToProfile('favorites')}
      />

      {watchlistItems.length === 0 ? (
        /* Empty State Wide Rounded Panel (~80px tall) */
        <div className="w-full h-[84px] rounded-[16px] bg-[#0c0c0e] border border-white/[0.08] flex items-center justify-between px-6">
          <p className="text-[12px] text-white/60">Your watchlist is empty.</p>
          <button
            onClick={() => navigateToBrowse({ type: 'ANIME' })}
            className="h-[32px] px-4 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-bold text-white border border-white/10 transition-all active:scale-95"
          >
            Browse Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {watchlistItems.slice(0, 6).map((anime) => (
            <PosterCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
};
