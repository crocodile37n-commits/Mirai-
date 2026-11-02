import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { navigateToBrowse, navigateToProfile, navigateToSignUp, showToast } = useApp();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#000000] border-t border-white/[0.08] mt-20 pt-16 pb-10 text-white select-none">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Four-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-14">
          {/* Column 1: Brand Column (wider ~35%) */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col items-start pr-0 lg:pr-8">
            <BrandLogo size="lg" />
            <p className="mt-4 text-[14px] leading-relaxed text-white/60 max-w-[360px]">
              Your premium destination for streaming anime and reading manga. Discover trending series,
              track your watchlist, and explore stories in pristine HD.
            </p>

            {/* Circular Discord Button */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://discord.gg/NGPDgYNxy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join MIRAI Discord"
                className="w-9 h-9 rounded-full bg-[#121215] border border-white/10 flex items-center justify-center text-[#5865f2] hover:bg-[#5865f2] hover:text-white hover:border-[#5865f2] transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="https://discord.gg/NGPDgYNxy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/40 hover:text-white transition-colors"
              >
                Connect on Discord
              </a>
            </div>
          </div>

          {/* Column 2: EXPLORE ANIME */}
          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="font-heading text-[12px] font-extrabold uppercase tracking-[0.1em] text-white mb-4">
              Explore Anime
            </h4>
            <ul className="space-y-3 text-[13px] text-white/60">
              <li>
                <button
                  onClick={() => navigateToBrowse({ sort: 'TRENDING_DESC' } as any)}
                  className="hover:text-white transition-colors"
                >
                  Trending Now
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToBrowse({ sort: 'POPULARITY_DESC' } as any)}
                  className="hover:text-white transition-colors"
                >
                  Most Popular
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToBrowse({ sort: 'SCORE_DESC' } as any)}
                  className="hover:text-white transition-colors"
                >
                  Top Rated
                </button>
              </li>
              <li>
                <button
                  onClick={() => showToast('Schedule', 'Airing schedule is updated in real-time.', 'info')}
                  className="hover:text-white transition-colors"
                >
                  Airing Schedule
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToBrowse({ genre: 'Action' })}
                  className="hover:text-white transition-colors"
                >
                  Genre Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: MANGA & MEDIA */}
          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="font-heading text-[12px] font-extrabold uppercase tracking-[0.1em] text-white mb-4">
              Manga & Media
            </h4>
            <ul className="space-y-3 text-[13px] text-white/60">
              <li>
                <button
                  onClick={() => navigateToBrowse({ type: 'MANGA' })}
                  className="hover:text-white transition-colors"
                >
                  Manga Reader
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToBrowse({ format: 'MOVIE' } as any)}
                  className="hover:text-white transition-colors"
                >
                  Anime Movies
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToBrowse({ format: 'OVA' } as any)}
                  className="hover:text-white transition-colors"
                >
                  TV Shorts & OVAs
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToProfile('continue')}
                  className="hover:text-white transition-colors"
                >
                  My Watchlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToProfile('profile')}
                  className="hover:text-white transition-colors"
                >
                  User Profile
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: DATA & COMMUNITY */}
          <div className="md:col-span-4 lg:col-span-3">
            <h4 className="font-heading text-[12px] font-extrabold uppercase tracking-[0.1em] text-white mb-4">
              Data & Community
            </h4>
            <ul className="space-y-3 text-[13px] text-white/60">
              <li>
                <a
                  href="https://anilist.co"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <span>AniList API</span>
                </a>
              </li>
              <li>
                <a
                  href="https://graphql.anilist.co"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GraphQL Endpoint
                </a>
              </li>
              <li>
                <button
                  onClick={() => showToast('Community Guidelines', 'Respect members, avoid spoilers, and enjoy streaming!', 'info')}
                  className="hover:text-white transition-colors"
                >
                  Community Guidelines
                </button>
              </li>
              <li>
                <button
                  onClick={navigateToSignUp}
                  className="hover:text-white transition-colors text-[#8b5cf6] font-medium"
                >
                  Create Free Account
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Second Hairline & Bottom Row */}
        <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Copyright */}
          <p className="text-[12px] text-white/60 text-center md:text-left">
            © 2026 <strong className="font-bold text-white">MIRAI</strong>. Designed for anime &amp; manga enthusiasts.
          </p>

          {/* Centre: Disclaimer */}
          <p className="text-[11px] text-white/40 text-center max-w-[540px] leading-relaxed">
            Disclaimer: MIRAI does not store any files on its server. All contents are provided by
            non-affiliated third parties.
          </p>

          {/* Right: Scroll to top pill */}
          <button
            onClick={scrollToTop}
            className="h-[32px] px-4 rounded-full bg-[#121215] hover:bg-white/10 border border-white/10 text-[12px] font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1.5 flex-shrink-0 active:scale-95"
            aria-label="Scroll back to top"
          >
            <span>↑</span>
            <span>Top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
