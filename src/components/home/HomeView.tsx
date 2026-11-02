import React, { useState, useEffect } from 'react';
import { HeroSpotlight } from './HeroSpotlight';
import { GenresStrip } from './GenresStrip';
import { ResumeWatchingSection } from './ResumeWatchingSection';
import { QuickWatchlistSection } from './QuickWatchlistSection';
import { PosterRail } from './PosterRail';
import { Top10Charts } from './Top10Charts';
import { getBatchedHomeData, HomeRailsData } from '../../services/animeApi';
import { useApp } from '../../context/AppContext';

export const HomeView: React.FC = () => {
  const { favorites, isAuthenticated } = useApp();
  const [data, setData] = useState<HomeRailsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getBatchedHomeData().then((homeData) => {
      if (isMounted) {
        setData(homeData);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="w-full min-h-screen bg-black">
        {/* Skeleton hero */}
        <div className="w-full h-[580px] bg-[#0c0c0e] animate-pulse flex items-center justify-center">
          <div className="w-28 h-36 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  // Find saved items for quick watchlist
  const watchlistItems = data.trending.filter((item) => favorites.includes(item.id));

  return (
    <div className="w-full bg-black min-h-screen">
      {/* 4.1 Hero spotlight */}
      <HeroSpotlight items={data.spotlight} />

      {/* 4.2 Genres strip */}
      <GenresStrip />

      {/* 4.3 Resume Watching (Only for authenticated users with active progress) */}
      {isAuthenticated && <ResumeWatchingSection />}

      {/* 4.4 Quick Watchlist (Only for authenticated users with saved items) */}
      {isAuthenticated && watchlistItems.length > 0 && (
        <QuickWatchlistSection watchlistItems={watchlistItems} />
      )}

      {/* 4.5 Six Poster Rails with Distinct Filters */}
      {/* 1. Trending This Week */}
      <PosterRail
        eyebrow="TRENDING NOW"
        title="Trending This Week"
        countText="12 titles"
        items={data.trending}
        showRank={true}
        eagerFirstRow={true}
      />

      {/* 2. All Time Popular */}
      <PosterRail
        eyebrow="MOST POPULAR"
        title="All Time Popular"
        countText="12 titles"
        items={data.popular}
        showRank={true}
      />

      {/* 3. New Season Arrivals */}
      <PosterRail
        eyebrow="FRESH THIS SEASON"
        title="New Season Arrivals"
        countText="10 titles"
        items={data.seasonal}
        showRank={true}
      />

      {/* 4. Action Zone */}
      <PosterRail
        eyebrow="HIGH ENERGY"
        title="Action Zone"
        countText="10 titles"
        items={data.action}
        showRank={true}
        genreFilter="Action"
      />

      {/* 5. Romance & Drama */}
      <PosterRail
        eyebrow="STORIES TO FEEL"
        title="Romance & Drama"
        countText="10 titles"
        items={data.romance}
        showRank={true}
        genreFilter="Romance"
      />

      {/* 6. Highest Rated Gems */}
      <PosterRail
        eyebrow="COMMUNITY PICKS"
        title="Highest Rated Gems"
        countText="10 titles"
        items={data.topRated}
        showRank={true}
      />

      {/* 4.6 Top 10 Charts */}
      <Top10Charts
        trending={data.top10Trending}
        popular={data.top10Popular}
        topRated={data.top10TopRated}
      />
    </div>
  );
};
