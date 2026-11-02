import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Globe, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { getWeeklySchedule, getScheduleCounts } from '../../services/animeApi';
import { ScheduleAiringItem } from '../../types';
import { useApp } from '../../context/AppContext';

export const ScheduleView: React.FC = () => {
  const { navigateToDetail } = useApp();

  // Dynamically resolve today's day of week
  const daysList = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysList[new Date().getDay()];

  const [selectedDay, setSelectedDay] = useState<string>(todayName);
  const [scheduleItems, setScheduleItems] = useState<ScheduleAiringItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [useLocalTime, setUseLocalTime] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  // Live timer tick every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch counts on mount
  useEffect(() => {
    getScheduleCounts().then((c) => {
      if (c && Object.keys(c).length > 0) {
        setCounts(c);
      }
    });
  }, []);

  // Fetch schedule items when selected day changes
  useEffect(() => {
    setLoading(true);
    getWeeklySchedule(selectedDay).then((items) => {
      setScheduleItems(items || []);
      setLoading(false);
      // Update count for selected day if not yet available
      if (items) {
        setCounts((prev) => ({ ...prev, [selectedDay]: items.length }));
      }
    });
  }, [selectedDay]);

  // Calculate the calendar date for the selected day in current week
  const dateChipText = useMemo(() => {
    const now = new Date();
    const currentDayIdx = now.getDay();
    const targetDayIdx = daysList.indexOf(selectedDay);
    const diffDays = targetDayIdx - currentDayIdx;
    const targetDate = new Date(now.getTime() + diffDays * 86400000);
    return targetDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDay]);

  // Format time based on user's timezone toggle
  const formatAiringTime = (item: ScheduleAiringItem) => {
    if (!item.airingTimestamp) return item.timeJST;
    const date = new Date(item.airingTimestamp * 1000);

    if (useLocalTime) {
      return (
        date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }) + ' Local'
      );
    }

    return item.timeJST;
  };

  // Real-time countdown calculation
  const getCountdownBadge = (timestamp?: number) => {
    if (!timestamp) return null;
    const diffSec = timestamp - Math.floor(currentTimeMs / 1000);

    if (diffSec <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Aired / Releasing
        </span>
      );
    }

    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;

    let countdownStr = '';
    if (days > 0) {
      countdownStr = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      countdownStr = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      countdownStr = `${minutes}m ${seconds}s`;
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f472b6]/15 border border-[#f472b6]/30 text-[10px] font-bold text-[#f472b6]">
        <Clock className="w-3 h-3 text-[#f472b6]" />
        Air in {countdownStr}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen bg-black text-white pt-24 pb-20 select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header: Centred calendar icon + "Weekly Airing Schedule" */}
        <div className="text-center max-w-[680px] mx-auto mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-2">
            <Calendar className="w-6 h-6 text-[#f472b6]" />
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Weekly Airing Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-white/60">
            Live broadcasts and episode countdowns updated directly from AniList official schedules.
          </p>
        </div>

        {/* Timezone Toggle Pill & Today Indicator */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c0c0e] border border-white/10 text-xs text-white/70">
            <Globe className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span>Timezone:</span>
            <button
              type="button"
              onClick={() => setUseLocalTime(false)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                !useLocalTime ? 'bg-[#8b5cf6] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              JST (Tokyo)
            </button>
            <button
              type="button"
              onClick={() => setUseLocalTime(true)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                useLocalTime ? 'bg-[#8b5cf6] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              My Local Time
            </button>
          </div>
        </div>

        {/* Day Tabs: Row of 7 pills, Sunday -> Saturday */}
        <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-5">
          {daysList.map((dayName) => {
            const isSelected = selectedDay === dayName;
            const isToday = dayName === todayName;
            const count = counts[dayName] !== undefined ? counts[dayName] : 0;

            return (
              <button
                key={dayName}
                onClick={() => setSelectedDay(dayName)}
                className={`h-[36px] px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-lg scale-105'
                    : 'bg-[#0c0c0e] hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                <span>{dayName}</span>
                {isToday && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${isSelected ? 'bg-black text-white' : 'bg-[#f472b6] text-black'}`}>
                    Today
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-black/15 text-black font-extrabold' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Chip: Centred dark pill */}
        <div className="flex justify-center mb-10">
          <div className="h-[32px] px-4 rounded-full bg-[#0c0c0e] border border-white/15 text-xs font-bold text-white/90 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f472b6]" />
            <span>{dateChipText}</span>
            <span className="text-white/40">({scheduleItems.length} airing shows)</span>
          </div>
        </div>

        {/* Vertical Timeline / Cards Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#f472b6] animate-spin" />
            <p className="text-xs text-white/40 font-medium">Fetching live AniList schedules...</p>
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="max-w-[480px] mx-auto p-8 rounded-2xl bg-[#0c0c0e] border border-white/10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-white/40 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Airing Events for {selectedDay}</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              AniList schedule data shows no officially confirmed broadcasts for this date. Check other days of the week above.
            </p>
          </div>
        ) : (
          <div className="relative max-w-[960px] mx-auto">
            {/* Center Vertical Hairline on medium+ screens */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] bg-white/15 hidden md:block" />

            {/* Alternating Events */}
            <div className="space-y-8 md:space-y-10">
              {scheduleItems.map((item, index) => {
                const isEven = index % 2 === 0;
                const timeLabel = formatAiringTime(item);
                const countdown = getCountdownBadge(item.airingTimestamp);

                const renderCard = () => (
                  <div
                    onClick={() => navigateToDetail(item.animeId)}
                    className="w-full sm:w-[410px] p-3.5 rounded-[14px] bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/25 transition-all cursor-pointer flex gap-3.5 shadow-md group relative overflow-hidden"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-[62px] h-[90px] rounded-[8px] object-cover bg-neutral-900 flex-shrink-0 group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/70">
                          <Clock className="w-3 h-3 text-[#f472b6]" />
                          <span>{timeLabel}</span>
                        </div>
                        {countdown}
                      </div>

                      <h3 className="font-heading text-xs font-bold text-white truncate group-hover:text-[#f472b6] transition-colors">
                        {item.title}
                      </h3>

                      <span className="text-[11px] text-[#8b5cf6] font-semibold block mt-0.5">
                        Episode {item.episodeNumber}
                      </span>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/60"
                          >
                            {g}
                          </span>
                        ))}
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-white/40 line-clamp-1 mt-1.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );

                const renderTimeSlot = () => (
                  <div className="hidden md:flex flex-col justify-center">
                    <span className="font-heading text-lg font-extrabold text-white tracking-wide block">
                      {timeLabel}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b5cf6] block mt-0.5">
                      EPISODE {item.episodeNumber} AIRING
                    </span>
                  </div>
                );

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0"
                  >
                    {/* Left Slot: Card if even, Time if odd */}
                    <div
                      className={`w-full md:w-[440px] flex ${
                        isEven ? 'justify-end' : 'justify-end md:pr-10 text-right'
                      }`}
                    >
                      {isEven ? renderCard() : renderTimeSlot()}
                    </div>

                    {/* Hollow Circular Node on Center Line */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border-2 border-[#f472b6] z-10 items-center justify-center shadow" />

                    {/* Right Slot: Time if even, Card if odd */}
                    <div
                      className={`w-full md:w-[440px] flex ${
                        !isEven ? 'justify-start' : 'justify-start md:pl-10 text-left'
                      }`}
                    >
                      {!isEven ? renderCard() : renderTimeSlot()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
