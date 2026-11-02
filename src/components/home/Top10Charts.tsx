import React from 'react';
import { Flame, BarChart3, Trophy, Star } from 'lucide-react';
import { AccentHeading } from '../common/AccentHeading';
import { AnimeMedia } from '../../types';
import { useApp } from '../../context/AppContext';

interface Top10ChartsProps {
  trending: AnimeMedia[];
  popular: AnimeMedia[];
  topRated: AnimeMedia[];
}

export const Top10Charts: React.FC<Top10ChartsProps> = ({
  trending,
  popular,
  topRated,
}) => {
  const { navigateToDetail } = useApp();

  const columns = [
    {
      title: 'Trending',
      icon: Flame,
      iconColor: 'text-[#ef4444]',
      items: trending.slice(0, 10),
    },
    {
      title: 'Most Popular',
      icon: BarChart3,
      iconColor: 'text-[#8b5cf6]',
      items: popular.slice(0, 10),
    },
    {
      title: 'Top Rated',
      icon: Trophy,
      iconColor: 'text-[#f5c518]',
      items: topRated.slice(0, 10),
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 select-none">
      <AccentHeading title="Top 10 Charts" size="lg" className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
        {columns.map((col) => {
          const Icon = col.icon;

          return (
            <div key={col.title} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center gap-2.5 pb-4 mb-3 border-b border-white/[0.08]">
                <Icon className={`w-5 h-5 ${col.iconColor}`} />
                <h3 className="font-heading text-lg font-bold text-white tracking-wide">
                  {col.title}
                </h3>
              </div>

              {/* 10 Rows */}
              <div className="flex flex-col gap-2">
                {col.items.map((anime, index) => {
                  const rank = index + 1;
                  const formattedRank = String(rank).padStart(2, '0');
                  const isTop3 = rank <= 3;
                  const displayTitle = anime.title.english || anime.title.romaji;
                  const score = anime.averageScore ? `${anime.averageScore}%` : '85%';
                  const epCount = anime.episodes ? `${anime.episodes} Ep` : 'Ongoing';
                  const genres = (anime.genres || ['Action']).slice(0, 2).join(', ').toUpperCase();

                  return (
                    <div
                      key={anime.id}
                      onClick={() => navigateToDetail(anime.id)}
                      className="group flex items-center h-[58px] px-3.5 rounded-[14px] bg-[#0c0c0e] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
                    >
                      {/* Rank Number (01-10) with Gold/Amber tint for 01-03 */}
                      <span
                        className={`font-heading text-[24px] font-extrabold w-[36px] flex-shrink-0 tracking-tight ${
                          isTop3 ? 'text-[#f5c518]' : 'text-white/40 group-hover:text-white/70'
                        }`}
                      >
                        {formattedRank}
                      </span>

                      {/* Poster Thumbnail (~40x56) */}
                      <div className="w-[38px] h-[48px] rounded-[8px] overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0 mr-3">
                        <img
                          src={anime.coverImage.medium || anime.coverImage.large}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Title & Meta */}
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-heading text-[13px] font-bold text-white truncate group-hover:text-white leading-tight">
                          {displayTitle}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/40">
                          <span>{anime.format || 'TV'}</span>
                          <span>•</span>
                          <span>{epCount}</span>
                          <span>•</span>
                          <span className="flex items-center text-[#f5c518] font-semibold gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {score}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold tracking-wider text-white/30 truncate mt-0.5 uppercase">
                          {genres}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
