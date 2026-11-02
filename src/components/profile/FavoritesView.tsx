import React, { useState } from 'react';
import { FolderOpen, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PosterCard } from '../common/PosterCard';
import { AccentHeading } from '../common/AccentHeading';
import { FALLBACK_TRENDING, FALLBACK_SPOTLIGHT, FALLBACK_ROMANCE, MANGA_DIRECTORY_POOL } from '../../services/animeApi';

export const FavoritesView: React.FC = () => {
  const { favorites, navigateToBrowse } = useApp();
  const [filterType, setFilterType] = useState<'ALL' | 'ANIME' | 'MANGA'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'rating'>('recent');

  // Pool of all items
  const allPool = [
    ...FALLBACK_SPOTLIGHT,
    ...FALLBACK_TRENDING,
    ...FALLBACK_ROMANCE,
    ...MANGA_DIRECTORY_POOL,
  ];

  // Unique favorited items
  const favoritedMap = new Map();
  allPool.forEach((item) => {
    if (favorites.includes(item.id) && !favoritedMap.has(item.id)) {
      favoritedMap.set(item.id, item);
    }
  });

  let favoritedItems = Array.from(favoritedMap.values());

  if (filterType === 'ANIME') {
    favoritedItems = favoritedItems.filter((i) => i.format !== 'MANGA' && i.format !== 'MANHWA');
  } else if (filterType === 'MANGA') {
    favoritedItems = favoritedItems.filter((i) => i.format === 'MANGA' || i.format === 'MANHWA' || i.format === 'MANHUA');
  }

  if (sortBy === 'az') {
    favoritedItems.sort((a, b) =>
      (a.title.english || a.title.romaji).localeCompare(b.title.english || b.title.romaji)
    );
  } else if (sortBy === 'rating') {
    favoritedItems.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
  }

  return (
    <div className="w-full min-h-screen bg-black text-white pt-24 pb-20 select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top-left: Accent-bar "My Watchlist" (Matches Screenshot 20fb6351) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <AccentHeading title="My Watchlist" size="lg" />

          {/* Filter tabs if populated */}
          {favorites.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="inline-flex p-1 rounded-full bg-[#0c0c0e] border border-white/10">
                {(['ALL', 'ANIME', 'MANGA'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilterType(tab)}
                    className={`h-[28px] px-3.5 rounded-full text-xs font-semibold transition-all ${
                      filterType === tab
                        ? 'bg-white text-black font-bold shadow-sm'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-[34px] px-3 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white/80 focus:outline-none"
              >
                <option value="recent">Recently Added</option>
                <option value="az">A – Z</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          )}
        </div>

        {/* Empty State (Matches Screenshot 20fb6351 Exactly) */}
        {favorites.length === 0 || favoritedItems.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
            {/* ~90px dark circular badge with muted lilac open folder icon */}
            <div className="w-[90px] h-[90px] rounded-full bg-[#121217] border border-white/10 flex items-center justify-center shadow-inner mb-6">
              <FolderOpen className="w-10 h-10 text-[#a78bfa] stroke-[1.5]" />
            </div>

            {/* "Your Watchlist is Empty" (bold ~20px) */}
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">
              Your Watchlist is Empty
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-white/60 max-w-[460px] leading-relaxed mb-6">
              Explore our vast catalog of anime and add your favorites to keep track of them here.
            </p>

            {/* "🔍 Browse Anime" Pill (~40px tall, dark fill, hairline border, bold white text) */}
            <button
              onClick={() => navigateToBrowse({ type: 'ANIME' })}
              className="h-[40px] px-6 rounded-full bg-[#0c0c0e] hover:bg-white/10 border border-white/15 text-white text-xs font-bold tracking-wide flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Search className="w-4 h-4 text-white/70" />
              <span>Browse Anime</span>
            </button>
          </div>
        ) : (
          /* Populated Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {favoritedItems.map((anime) => (
              <PosterCard key={anime.id} anime={anime} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
