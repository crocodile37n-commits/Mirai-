import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Star, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { browseAnimeOrManga } from '../../services/animeApi';
import { AnimeMedia } from '../../types';

export const SearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen, navigateToDetail } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [searchOpen]);

  // Debounced search (300ms) with cancellation
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await browseAnimeOrManga({
          search: query.trim(),
          perPage: 8,
        });
        if (!controller.signal.aborted) {
          setResults(res.media);
          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-[640px] bg-[#0c0c0e] border border-white/15 rounded-[20px] shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anime, movies, manga by title or genre..."
            className="flex-1 bg-transparent border-none text-white text-[15px] placeholder-white/40 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/40 hover:text-white p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono text-white/40">
            ESC
          </kbd>
        </div>

        {/* Results Box */}
        <div className="max-h-[420px] overflow-y-auto p-2">
          {loading ? (
            <div className="p-8 text-center text-sm text-white/40">Searching catalog...</div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((anime) => {
                const title = anime.title.english || anime.title.romaji;
                const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : '8.0';

                return (
                  <div
                    key={anime.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigateToDetail(anime.id);
                    }}
                    className="flex items-center gap-3.5 p-2 rounded-[12px] hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <img
                      src={anime.coverImage.medium || anime.coverImage.large}
                      alt=""
                      className="w-10 h-14 rounded-md object-cover flex-shrink-0 bg-neutral-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading text-sm font-bold text-white truncate group-hover:text-[#f472b6] transition-colors">
                        {title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5">
                        <span className="flex items-center gap-1 text-[#f5c518]">
                          <Star className="w-3 h-3 fill-current" />
                          {score}
                        </span>
                        <span>•</span>
                        <span>{anime.format || 'TV'}</span>
                        <span>•</span>
                        <span>{anime.episodes ? `${anime.episodes} EP` : 'Ongoing'}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all mr-2" />
                  </div>
                );
              })}
            </div>
          ) : query ? (
            <div className="p-8 text-center text-sm text-white/40">
              No matching anime found for "{query}".
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-white/40 space-y-2">
              <p>Type to search across thousands of anime and manga.</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Action', 'Fantasy', 'Romance', 'Frieren', 'Bleach', 'One Piece'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
