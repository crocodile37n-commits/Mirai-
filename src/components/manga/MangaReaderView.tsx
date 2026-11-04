import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Home,
  BookOpen,
  List,
  MessageSquare,
  Settings,
  X,
  Send,
  Sliders,
  ThumbsUp,
  Eye,
  Rows,
  Columns,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { getMangaDetails, getMangaChapters, getMangaChapterPages } from '../../services/animeApi';
import { AnimeMedia, MangaChapter } from '../../types';
import { useApp } from '../../context/AppContext';
import { MiraiAvatar } from '../common/BrandLogo';

interface MangaReaderViewProps {
  mangaId: number;
  initialChapterNumber?: number;
}

interface ChapterComment {
  id: string;
  author: string;
  avatarSeed: string;
  timeAgo: string;
  text: string;
  likes: number;
}

export const MangaReaderView: React.FC<MangaReaderViewProps> = ({
  mangaId,
  initialChapterNumber = 1,
}) => {
  const { navigateToHome, navigateToManga, navigateToMangaDetail, showToast, userProfile } =
    useApp();
  const [manga, setManga] = useState<AnimeMedia | null>(null);
  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [currentChapterNum, setCurrentChapterNum] = useState<number>(initialChapterNumber);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fitMode, setFitMode] = useState<'fit-width' | 'natural'>('fit-width');
  const [readerMode, setReaderMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [horizontalPageIndex, setHorizontalPageIndex] = useState<number>(0);

  const [realPages, setRealPages] = useState<string[]>([]);
  const [loadingPages, setLoadingPages] = useState<boolean>(false);

  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);

  // Chapter drawer search query
  const [chapterFilterQuery, setChapterFilterQuery] = useState('');

  // Comment state
  const [commentInput, setCommentInput] = useState('');
  const [comments, setComments] = useState<Record<number, ChapterComment[]>>({
    1: [
      {
        id: 'c1',
        author: 'SoloReader',
        avatarSeed: 'soloreader',
        timeAgo: '2 hours ago',
        text: 'The art style in this adaptation is absolutely magnificent! Loving the panels.',
        likes: 14,
      },
      {
        id: 'c2',
        author: 'KageShinobi',
        avatarSeed: 'kageshinobi',
        timeAgo: '5 hours ago',
        text: 'That double spread at the climax gave me chills. 10/10 opening!',
        likes: 9,
      },
    ],
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMangaDetails(mangaId).then((m) => {
      if (m) {
        setManga(m);
        const title = m.title.english || m.title.romaji;
        getMangaChapters(m.id, title, m.chaptersCount || 40).then((chList) => {
          setChapters(chList);
        });
      }
    });
  }, [mangaId]);

  useEffect(() => {
    setCurrentChapterNum(initialChapterNumber);
    setHorizontalPageIndex(0);
  }, [initialChapterNumber]);

  // Track scroll progress in vertical mode
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current && readerMode === 'vertical') {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const total = scrollHeight - clientHeight;
        const pct = total > 0 ? Math.round((scrollTop / total) * 100) : 0;
        setScrollProgress(pct);
      }
    };

    const node = containerRef.current;
    node?.addEventListener('scroll', handleScroll, { passive: true });
    return () => node?.removeEventListener('scroll', handleScroll);
  }, [readerMode]);

  // Active chapter
  const currentChapter = useMemo(() => {
    return (
      chapters.find((c) => c.number === currentChapterNum) || {
        id: `ch_${mangaId}_${currentChapterNum}`,
        number: currentChapterNum,
        title: `Chapter ${currentChapterNum}`,
        scanlatorGroup: 'Official / MangaDex',
        pagesCount: 18,
        publishDate: 'Official Release',
        pages: [],
      }
    );
  }, [chapters, currentChapterNum, mangaId]);

  // Fetch real pages when chapter changes
  useEffect(() => {
    if (!currentChapter?.id || currentChapter.id.startsWith('ch_')) {
      setRealPages([]);
      return;
    }
    setLoadingPages(true);
    getMangaChapterPages(currentChapter.id).then((p) => {
      setRealPages(p);
      setLoadingPages(false);
    });
  }, [currentChapter?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (readerMode === 'horizontal') {
          if (horizontalPageIndex < (currentChapter.pages.length || 6) - 1) {
            setHorizontalPageIndex((p) => p + 1);
          } else if (currentChapterNum < (chapters.length || 40)) {
            setCurrentChapterNum((c) => c + 1);
            setHorizontalPageIndex(0);
          }
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (readerMode === 'horizontal') {
          if (horizontalPageIndex > 0) {
            setHorizontalPageIndex((p) => p - 1);
          } else if (currentChapterNum > 1) {
            setCurrentChapterNum((c) => c - 1);
            setHorizontalPageIndex(0);
          }
        }
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      } else if (e.key === 'Escape') {
        setShowChapterDrawer(false);
        setShowCommentDrawer(false);
        setShowSettingsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [readerMode, horizontalPageIndex, currentChapterNum, currentChapter, chapters.length]);

  const pages = realPages.length > 0 ? realPages : (currentChapter.pages || []);
  const totalPages = pages.length;
  const totalChapters = chapters.length || 40;

  // Calculate page number display
  const currentPageEst =
    readerMode === 'vertical'
      ? Math.min(totalPages, Math.max(1, Math.ceil((scrollProgress / 100) * totalPages) || 1))
      : horizontalPageIndex + 1;

  const currentPercent =
    readerMode === 'vertical'
      ? scrollProgress
      : Math.round(((horizontalPageIndex + 1) / totalPages) * 100);

  const containerWidthStyle =
    fitMode === 'fit-width' ? `${Math.round(850 * (zoomLevel / 100))}px` : '100%';

  // Handle mobile tap zones
  const handleViewportTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check if clicked element was a button or drawer
    if ((e.target as HTMLElement).closest('button, input, select, textarea, .drawer-interactive')) {
      return;
    }

    const width = window.innerWidth;
    const clickX = e.clientX;

    // Mobile tap zones
    if (width < 768) {
      if (clickX < width * 0.25) {
        // Tap left 25% = prev
        if (readerMode === 'horizontal') {
          if (horizontalPageIndex > 0) {
            setHorizontalPageIndex((p) => p - 1);
          } else if (currentChapterNum > 1) {
            setCurrentChapterNum((c) => c - 1);
            setHorizontalPageIndex(0);
          }
        }
      } else if (clickX > width * 0.75) {
        // Tap right 25% = next
        if (readerMode === 'horizontal') {
          if (horizontalPageIndex < totalPages - 1) {
            setHorizontalPageIndex((p) => p + 1);
          } else if (currentChapterNum < totalChapters) {
            setCurrentChapterNum((c) => c + 1);
            setHorizontalPageIndex(0);
          }
        }
      } else {
        // Middle 50% = toggle chrome
        setChromeVisible((prev) => !prev);
      }
    }
  };

  const switchChapter = (targetNum: number) => {
    if (targetNum >= 1 && targetNum <= totalChapters) {
      setCurrentChapterNum(targetNum);
      setHorizontalPageIndex(0);
      setShowChapterDrawer(false);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment: ChapterComment = {
      id: `c_${Date.now()}`,
      author: userProfile?.fullName || userProfile?.username || 'Mirai Reader',
      avatarSeed: userProfile?.username || 'user',
      timeAgo: 'Just now',
      text: commentInput.trim(),
      likes: 1,
    };

    setComments((prev) => ({
      ...prev,
      [currentChapterNum]: [newComment, ...(prev[currentChapterNum] || [])],
    }));

    setCommentInput('');
    showToast('Comment Posted', 'Your reaction was shared with readers.', 'success');
  };

  const activeComments = comments[currentChapterNum] || [];

  return (
    <div className="fixed inset-0 z-50 bg-[#060607] text-white flex flex-col select-none overflow-hidden">
      {/* 1.5 MINIMAL TOP CHROME */}
      <header
        className={`h-[52px] bg-[#0c0c0e]/95 backdrop-blur-md border-b border-white/[0.08] px-4 flex items-center justify-between z-30 flex-shrink-0 transition-transform duration-300 ${
          chromeVisible ? 'translate-y-0' : '-translate-y-full md:translate-y-0'
        }`}
      >
        {/* Top-Left: "‹ Library" and Chapter Navigator "‹ Ch. 1 / 360 ›" */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigateToMangaDetail(mangaId)}
            className="text-xs font-semibold text-white/70 hover:text-white px-2.5 py-1 rounded-full hover:bg-white/5 transition-colors mr-1 flex items-center gap-1 border border-white/10"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Library</span>
          </button>

          {/* Chapter Selector Navigator */}
          <div className="flex items-center gap-1 bg-[#121215] border border-white/10 rounded-full px-2 py-0.5 shadow-sm">
            <button
              onClick={() => switchChapter(currentChapterNum - 1)}
              disabled={currentChapterNum <= 1}
              className="p-1 text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
              aria-label="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowChapterDrawer(true)}
              className="text-xs font-bold px-2 text-white hover:text-[#c084fc] transition-colors"
            >
              Ch. {currentChapterNum} / {totalChapters}
            </button>

            <button
              onClick={() => switchChapter(currentChapterNum + 1)}
              disabled={currentChapterNum >= totalChapters}
              className="p-1 text-white/60 hover:text-white disabled:opacity-30 cursor-pointer"
              aria-label="Next Chapter"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="hidden md:inline text-xs font-semibold text-white/50 truncate max-w-[280px] ml-2">
            {manga?.title.english || manga?.title.romaji}
          </span>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          {/* Reader Mode Toggle (Vertical vs Horizontal) */}
          <button
            onClick={() => {
              const next = readerMode === 'vertical' ? 'horizontal' : 'vertical';
              setReaderMode(next);
              showToast(
                'Reading Mode',
                next === 'vertical' ? 'Continuous Webtoon Scroll' : 'Horizontal Page Turn',
                'info'
              );
            }}
            className="h-[32px] px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition-colors"
            title="Toggle reader layout"
          >
            {readerMode === 'vertical' ? (
              <Rows className="w-3.5 h-3.5 text-[#c084fc]" />
            ) : (
              <Columns className="w-3.5 h-3.5 text-[#c084fc]" />
            )}
            <span className="hidden sm:inline capitalize">{readerMode}</span>
          </button>

          <button
            onClick={() => setShowChapterDrawer(true)}
            className="h-[32px] px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chapters</span>
          </button>

          <button
            onClick={() => setShowCommentDrawer(true)}
            className="h-[32px] px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-1.5 relative transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Discussion</span>
            {activeComments.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN READER VIEWPORT */}
      <div
        ref={containerRef}
        onClick={handleViewportTap}
        className="flex-1 overflow-y-auto flex flex-col items-center bg-[#060607] py-2 px-2 relative"
      >
        {loadingPages ? (
          <div className="py-28 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
            <p className="text-xs text-white/50 font-medium">Loading high-resolution chapter pages from MangaDex...</p>
          </div>
        ) : currentChapter.externalUrl ? (
          <div className="w-full max-w-[680px] p-8 rounded-2xl bg-[#0c0c0e] border border-[#8b5cf6]/40 text-center space-y-4 my-10 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 flex items-center justify-center mx-auto text-[#c084fc]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white">
                Official Publisher Reading Source
              </h3>
              <p className="text-xs text-white/60 max-w-[440px] mx-auto mt-1.5 leading-relaxed">
                This chapter is licensed for official release. Read directly through the authorized publisher:
              </p>
            </div>
            <a
              href={currentChapter.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              <span>Open Authorized Reader (MangaPlus)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : pages.length === 0 ? (
          <div className="w-full max-w-[560px] p-8 rounded-2xl bg-[#0c0c0e] border border-white/10 text-center space-y-3 my-12">
            <BookOpen className="w-8 h-8 text-white/30 mx-auto" />
            <h3 className="text-sm font-bold text-white">Chapter {currentChapterNum}</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Official digital pages for this chapter are available via authorized partners.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => switchChapter(currentChapterNum + 1)}
                disabled={currentChapterNum >= totalChapters}
                className="h-[36px] px-5 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Chapter</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : readerMode === 'vertical' ? (
          /* VERTICAL SCROLL MODE (WEBTOON / CONTINUOUS) */
          <div
            style={{ width: '100%', maxWidth: containerWidthStyle }}
            className="flex flex-col items-center space-y-1.5 transition-all duration-200"
          >
            {pages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative w-full overflow-hidden bg-[#101014] rounded-[4px] shadow-2xl"
              >
                <img
                  src={imgUrl}
                  alt={`Page ${idx + 1}`}
                  loading={idx < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="w-full h-auto object-contain block mx-auto pointer-events-none"
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-mono text-white/50 border border-white/10">
                  {idx + 1}
                </span>
              </div>
            ))}

            {/* End of Chapter Card */}
            <div className="w-full py-10 text-center bg-[#0c0c0e] rounded-2xl border border-white/10 mt-6 p-6 shadow-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c084fc] block mb-1">
                Completed Chapter
              </span>
              <h3 className="font-heading text-lg font-bold text-white mb-2">
                End of Chapter {currentChapterNum}
              </h3>
              <p className="text-xs text-white/50 mb-6 max-w-[420px] mx-auto">
                Ready for the next installment of {manga?.title.english || manga?.title.romaji}?
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => switchChapter(currentChapterNum + 1)}
                  disabled={currentChapterNum >= totalChapters}
                  className="h-[38px] px-6 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90 shadow active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowCommentDrawer(true)}
                  className="h-[38px] px-5 rounded-full glass bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/15 transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discuss Chapter</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* HORIZONTAL PAGE TURN MODE */
          <div className="w-full h-full flex flex-col items-center justify-center p-2 relative">
            <div
              style={{ width: '100%', maxWidth: containerWidthStyle }}
              className="relative max-h-[82vh] flex items-center justify-center rounded-lg overflow-hidden bg-[#101014] shadow-2xl border border-white/10"
            >
              <img
                src={pages[horizontalPageIndex]}
                alt={`Page ${horizontalPageIndex + 1}`}
                className="max-h-[82vh] w-auto object-contain mx-auto"
              />

              {/* Prev / Next Page Overlays (Desktop) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (horizontalPageIndex > 0) {
                    setHorizontalPageIndex((p) => p - 1);
                  } else if (currentChapterNum > 1) {
                    setCurrentChapterNum((c) => c - 1);
                    setHorizontalPageIndex(0);
                  }
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full glass bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all shadow-lg"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (horizontalPageIndex < totalPages - 1) {
                    setHorizontalPageIndex((p) => p + 1);
                  } else if (currentChapterNum < totalChapters) {
                    setCurrentChapterNum((c) => c + 1);
                    setHorizontalPageIndex(0);
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full glass bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all shadow-lg"
                aria-label="Next Page"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1.5 BOTTOM-LEFT FLOATING PILL: Page Counter + % Progress */}
      <div
        className={`fixed bottom-4 left-4 z-40 bg-black/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-xs font-mono text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.6)] pointer-events-none transition-transform duration-300 ${
          chromeVisible ? 'translate-y-0' : 'translate-y-16 md:translate-y-0'
        }`}
      >
        Page {currentPageEst} / {totalPages} · {currentPercent}%
      </div>

      {/* 1.5 BOTTOM-RIGHT FLOATING PILL: Zoom Controls (− / Fit / +) */}
      <div
        className={`fixed bottom-4 right-16 sm:right-20 z-40 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-transform duration-300 ${
          chromeVisible ? 'translate-y-0' : 'translate-y-16 md:translate-y-0'
        }`}
      >
        <button
          onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
          className="p-1 hover:text-white text-white/60 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            setFitMode((m) => (m === 'fit-width' ? 'natural' : 'fit-width'));
            setZoomLevel(100);
          }}
          className="text-[11px] font-bold text-white/80 hover:text-white px-1.5 transition-colors"
          title="Click to toggle fit"
        >
          {zoomLevel}%
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
          className="p-1 hover:text-white text-white/60 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1.5 RIGHT-SIDE FIXED VERTICAL ICON RAIL */}
      <div
        className={`fixed top-1/2 -translate-y-1/2 right-3 z-40 hidden sm:flex flex-col gap-2.5 p-2 rounded-full glass bg-black/85 border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.7)]`}
      >
        {/* Home */}
        <button
          onClick={navigateToHome}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Mirai Home"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Manga Library */}
        <button
          onClick={navigateToManga}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Manga Library"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Chapter List Drawer */}
        <button
          onClick={() => setShowChapterDrawer(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="All Chapters"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Discussion Drawer */}
        <button
          onClick={() => setShowCommentDrawer(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors relative"
          title="Chapter Discussion"
        >
          <MessageSquare className="w-4 h-4" />
          {activeComments.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#8b5cf6]" />
          )}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen?.();
            } else {
              document.exitFullscreen?.();
            }
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>

        {/* Next Chapter Arrow */}
        <button
          onClick={() => switchChapter(currentChapterNum + 1)}
          disabled={currentChapterNum >= totalChapters}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 cursor-pointer"
          title="Next Chapter"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* CHAPTER LIST DRAWER */}
      {showChapterDrawer && (
        <div
          onClick={() => setShowChapterDrawer(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] h-full bg-[#0c0c0e] border-l border-white/10 p-5 flex flex-col shadow-2xl drawer-interactive"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Chapter Index ({totalChapters})
                </h3>
                <p className="text-[11px] text-white/40 truncate max-w-[260px]">
                  {manga?.title.english || manga?.title.romaji}
                </p>
              </div>
              <button
                onClick={() => setShowChapterDrawer(false)}
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick search inside drawer */}
            <div className="mt-3 relative">
              <input
                type="text"
                value={chapterFilterQuery}
                onChange={(e) => setChapterFilterQuery(e.target.value)}
                placeholder="Jump to chapter..."
                className="w-full h-[34px] px-3 rounded-lg bg-[#141418] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none"
              />
            </div>

            {/* Chapter Scroll List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04] mt-3 pr-1">
              {chapters
                .filter(
                  (ch) =>
                    !chapterFilterQuery ||
                    ch.number.toString().includes(chapterFilterQuery) ||
                    ch.title.toLowerCase().includes(chapterFilterQuery.toLowerCase())
                )
                .map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => switchChapter(ch.number)}
                    className={`py-3 px-3 flex justify-between items-center cursor-pointer hover:bg-white/5 rounded-xl transition-colors ${
                      ch.number === currentChapterNum
                        ? 'bg-white/10 text-white font-bold border border-white/15'
                        : 'text-white/70'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block">Chapter {ch.number}</span>
                      <span className="text-[10px] text-white/40 truncate max-w-[200px] block">
                        {ch.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40">{ch.publishDate}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER DISCUSSION DRAWER */}
      {showCommentDrawer && (
        <div
          onClick={() => setShowCommentDrawer(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] h-full bg-[#0c0c0e] border-l border-white/10 p-5 flex flex-col shadow-2xl drawer-interactive"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-heading text-sm font-bold text-white">
                  Chapter {currentChapterNum} Discussion
                </h3>
                <p className="text-[11px] text-white/40">
                  {activeComments.length} comments posted
                </p>
              </div>
              <button
                onClick={() => setShowCommentDrawer(false)}
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comment Stream */}
            <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
              {activeComments.length === 0 ? (
                <div className="py-12 text-center text-xs text-white/40">
                  Be the first to share your thoughts on Chapter {currentChapterNum}!
                </div>
              ) : (
                activeComments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-[#121216] border border-white/[0.06] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MiraiAvatar size={22} />
                        <span className="font-bold text-white/90">{c.author}</span>
                      </div>
                      <span className="text-[10px] text-white/40">{c.timeAgo}</span>
                    </div>
                    <p className="text-white/80 leading-relaxed text-[12px]">{c.text}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-white/50">
                      <button
                        onClick={() => {
                          setComments((prev) => ({
                            ...prev,
                            [currentChapterNum]: (prev[currentChapterNum] || []).map((item) =>
                              item.id === c.id ? { ...item, likes: item.likes + 1 } : item
                            ),
                          }));
                        }}
                        className="hover:text-white flex items-center gap-1 transition-colors"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{c.likes}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={`Leave a comment on Ch. ${currentChapterNum}...`}
                className="flex-1 h-[38px] px-3.5 rounded-full bg-[#141418] border border-white/10 text-xs text-white focus:outline-none focus:border-white/30"
              />
              <button
                type="submit"
                className="w-10 h-[38px] rounded-full bg-white text-black flex items-center justify-center flex-shrink-0 hover:bg-white/90 active:scale-95 transition-all"
                aria-label="Post comment"
              >
                <Send className="w-4 h-4 text-black" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
