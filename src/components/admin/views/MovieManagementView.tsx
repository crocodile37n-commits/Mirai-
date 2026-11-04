import React, { useState, useEffect, useCallback } from 'react';
import {
  Clapperboard,
  Search,
  Plus,
  Trash2,
  Star,
  Clock,
  Calendar,
  Globe,
  Film,
  Sparkles,
  Loader2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { authFetch } from '../../../services/authClient';

export interface MovieItem {
  id: string;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path: string;
  backdrop_path?: string;
  release_year: number;
  duration_minutes: number;
  rating: number;
  genres: string[];
  languages: string[];
  created_at: string;
}

export const MovieManagementView: React.FC = () => {
  const { showToast } = useApp();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add movie modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    originalTitle: '',
    overview: '',
    posterPath: '',
    backdropPath: '',
    releaseYear: 2024,
    durationMinutes: 110,
    rating: 8.5,
    genres: 'Animation, Adventure, Fantasy',
    languages: 'Japanese, Hindi, English',
  });

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const res = await authFetch(`/api/admin/movies${q}`);
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch {
      showToast('Error', 'Failed to fetch movies.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete movie "${title}" from catalog?`)) return;

    try {
      const res = await authFetch(`/api/admin/movies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMovies(prev => prev.filter(m => m.id !== id));
        showToast('Movie Deleted', `Deleted "${title}".`, 'info');
      }
    } catch {
      showToast('Error', 'Failed to delete movie.', 'error');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Validation Error', 'Movie title is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const genresList = form.genres.split(',').map(s => s.trim()).filter(Boolean);
      const langsList = form.languages.split(',').map(s => s.trim()).filter(Boolean);

      const res = await authFetch('/api/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          originalTitle: form.originalTitle,
          overview: form.overview,
          posterPath: form.posterPath,
          backdropPath: form.backdropPath,
          releaseYear: form.releaseYear,
          durationMinutes: form.durationMinutes,
          rating: form.rating,
          genres: genresList,
          languages: langsList,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Movie Added', `"${form.title}" added to catalog.`, 'success');
        setAddModalOpen(false);
        setForm({
          title: '',
          originalTitle: '',
          overview: '',
          posterPath: '',
          backdropPath: '',
          releaseYear: 2024,
          durationMinutes: 110,
          rating: 8.5,
          genres: 'Animation, Adventure, Fantasy',
          languages: 'Japanese, Hindi, English',
        });
        fetchMovies();
      } else {
        showToast('Error', data.error || 'Failed to add movie.', 'error');
      }
    } catch {
      showToast('Error', 'Failed to create movie record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
            <Clapperboard className="w-5 h-5 text-[#ec4899]" />
            <span>Movie Catalog & Streaming Management</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Independent movie management architecture with dedicated posters, duration, multi-audio & subtitles.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.35)] hover:opacity-95 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Movie</span>
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search movie title or original name..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08]">
            Catalog: <strong className="text-white">{movies.length} Movies</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
            Hindi Dub Enabled: <strong className="text-white">Active</strong>
          </span>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="py-20 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#ec4899]" />
          <span>Loading movies database...</span>
        </div>
      ) : movies.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass border border-white/[0.08] p-8">
          <Clapperboard className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="font-heading text-sm font-bold text-white">No Movies Found</h3>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
            {search ? 'No movies matched your search filter.' : 'Click "Add New Movie" to register a film.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {movies.map(movie => (
            <div
              key={movie.id}
              className="rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] hover:border-white/25 transition-all overflow-hidden flex flex-col shadow-[0_4px_24px_rgba(0,0,0,0.5)] group"
            >
              {/* Poster Image Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-black/60">
                <img
                  src={movie.backdrop_path || movie.poster_path}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-black/30 to-transparent" />

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-amber-400 font-bold text-[11px] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3">
                  <h4 className="font-heading text-sm font-bold text-white truncate drop-shadow">
                    {movie.title}
                  </h4>
                  {movie.original_title && (
                    <p className="text-[10px] text-white/60 truncate font-mono">
                      {movie.original_title}
                    </p>
                  )}
                </div>
              </div>

              {/* Body Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {movie.overview || 'No overview provided.'}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#ec4899]" />
                      <span>{movie.release_year}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8b5cf6]" />
                      <span>{movie.duration_minutes}m</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {movie.genres.slice(0, 3).map((g, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/70"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-[#f472b6]">
                      <Globe className="w-3 h-3" />
                      <span className="truncate max-w-[140px] font-medium">
                        {movie.languages.join(', ')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(movie.id, movie.title)}
                      className="p-1 rounded text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete movie"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Movie Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl glass bg-[#0e0e12] border border-white/15 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] relative">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <Clapperboard className="w-5 h-5 text-[#ec4899]" />
              <span>Add Movie to Catalog</span>
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Register metadata, posters, audio languages, and duration for movie streaming.
            </p>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Movie Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Suzume no Tojimari"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Original Title (Japanese / Romanized)
                </label>
                <input
                  type="text"
                  value={form.originalTitle}
                  onChange={e => setForm({ ...form, originalTitle: e.target.value })}
                  placeholder="すずめの戸締まり"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Overview / Synopsis
                </label>
                <textarea
                  rows={3}
                  value={form.overview}
                  onChange={e => setForm({ ...form, overview: e.target.value })}
                  placeholder="Plot summary of the film..."
                  className="w-full p-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    value={form.posterPath}
                    onChange={e => setForm({ ...form, posterPath: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Backdrop Banner URL
                  </label>
                  <input
                    type="url"
                    value={form.backdropPath}
                    onChange={e => setForm({ ...form, backdropPath: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    value={form.releaseYear}
                    onChange={e => setForm({ ...form, releaseYear: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#ec4899] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={form.durationMinutes}
                    onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#ec4899] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Rating (0-10)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.rating}
                    onChange={e => setForm({ ...form, rating: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#ec4899] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Supported Audio Languages (Comma-separated)
                </label>
                <input
                  type="text"
                  value={form.languages}
                  onChange={e => setForm({ ...form, languages: e.target.value })}
                  placeholder="Japanese, Hindi, English"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#ec4899] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.35)] cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Film...</span>
                    </>
                  ) : (
                    <span>Add Movie</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
