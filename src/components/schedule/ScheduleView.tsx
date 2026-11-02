import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { getWeeklySchedule, WEEKLY_SCHEDULE_DATA } from '../../services/animeApi';
import { ScheduleAiringItem } from '../../types';
import { useApp } from '../../context/AppContext';

export const ScheduleView: React.FC = () => {
  const { navigateToDetail } = useApp();
  const [selectedDay, setSelectedDay] = useState<string>('Saturday');
  const [scheduleItems, setScheduleItems] = useState<ScheduleAiringItem[]>([]);
  const [loading, setLoading] = useState(true);

  const days = [
    { name: 'Sunday', count: 18 },
    { name: 'Monday', count: 14 },
    { name: 'Tuesday', count: 16 },
    { name: 'Wednesday', count: 21 },
    { name: 'Thursday', count: 19 },
    { name: 'Friday', count: 22 },
    { name: 'Saturday', count: 24 },
  ];

  useEffect(() => {
    setLoading(true);
    getWeeklySchedule(selectedDay).then((items) => {
      setScheduleItems(items);
      setLoading(false);
    });
  }, [selectedDay]);

  const dateChipText = `${selectedDay}, Oct 31`;

  return (
    <div className="w-full min-h-screen bg-black text-white pt-24 pb-20 select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header: Centred calendar icon + "Weekly Airing Schedule" */}
        <div className="text-center max-w-[680px] mx-auto mb-8">
          <div className="inline-flex items-center justify-center gap-2.5 mb-2">
            <Calendar className="w-6 h-6 text-[#f472b6]" />
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Weekly Airing Schedule
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-white/60">
            Find out when new episodes of your favorite anime are airing this week.
          </p>
        </div>

        {/* Day Tabs: Row of 7 pills, Sunday -> Saturday */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-5">
          {days.map((d) => {
            const isSelected = selectedDay === d.name;

            return (
              <button
                key={d.name}
                onClick={() => setSelectedDay(d.name)}
                className={`h-[34px] px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all flex-shrink-0 ${
                  isSelected
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'bg-[#0c0c0e] hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                <span>{d.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-black/15 text-black font-extrabold' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {d.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Chip: Centred dark pill e.g. "Saturday, Oct 31" */}
        <div className="flex justify-center mb-12">
          <div className="h-[30px] px-4 rounded-full bg-[#0c0c0e] border border-white/15 text-xs font-bold text-white/80 shadow-sm flex items-center">
            {dateChipText}
          </div>
        </div>

        {/* Vertical Timeline: Centre line with alternating cards */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#f472b6] animate-spin" />
          </div>
        ) : (
          <div className="relative max-w-[940px] mx-auto">
            {/* Center Vertical Hairline */}
            <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] bg-white/15 hidden md:block" />

            {/* Alternating Events */}
            <div className="space-y-10 md:space-y-12">
              {scheduleItems.map((item, index) => {
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={item.id}
                    className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0"
                  >
                    {/* Left Slot: Card if even, Time if odd */}
                    <div
                      className={`w-full md:w-[420px] flex ${
                        isEven ? 'justify-end' : 'justify-end md:pr-10 text-right'
                      }`}
                    >
                      {isEven ? (
                        /* Airing Card on Left */
                        <div
                          onClick={() => navigateToDetail(item.animeId)}
                          className="w-full sm:w-[360px] p-3 rounded-[14px] bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex gap-3.5 shadow-md group"
                        >
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-[55px] h-[80px] rounded-[8px] object-cover bg-neutral-900 flex-shrink-0 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-white/60 mb-0.5">
                              <Clock className="w-3 h-3 text-[#f472b6]" />
                              <span>{item.timeJST}</span>
                            </div>
                            <h3 className="font-heading text-xs font-bold text-white truncate group-hover:text-white">
                              {item.title}
                            </h3>
                            <span className="text-[11px] text-white/40 block mt-0.5 font-medium">
                              Episode {item.episodeNumber}
                            </span>
                            <div className="flex gap-1 mt-1.5">
                              {item.genres.slice(0, 2).map((g) => (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/60"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-white/40 line-clamp-1 mt-1.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Time Display on Left */
                        <div className="hidden md:block">
                          <span className="font-heading text-lg font-extrabold text-white tracking-wide block">
                            {item.timeJST}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block mt-0.5">
                            AIRING EVENT
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hollow Circular Node on Center Line */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-black border-2 border-white/60 z-10 items-center justify-center shadow" />

                    {/* Right Slot: Time if even, Card if odd */}
                    <div
                      className={`w-full md:w-[420px] flex ${
                        !isEven ? 'justify-start' : 'justify-start md:pl-10 text-left'
                      }`}
                    >
                      {!isEven ? (
                        /* Airing Card on Right */
                        <div
                          onClick={() => navigateToDetail(item.animeId)}
                          className="w-full sm:w-[360px] p-3 rounded-[14px] bg-[#0c0c0e] hover:bg-[#121215] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex gap-3.5 shadow-md group"
                        >
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-[55px] h-[80px] rounded-[8px] object-cover bg-neutral-900 flex-shrink-0 group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-white/60 mb-0.5">
                              <Clock className="w-3 h-3 text-[#f472b6]" />
                              <span>{item.timeJST}</span>
                            </div>
                            <h3 className="font-heading text-xs font-bold text-white truncate group-hover:text-white">
                              {item.title}
                            </h3>
                            <span className="text-[11px] text-white/40 block mt-0.5 font-medium">
                              Episode {item.episodeNumber}
                            </span>
                            <div className="flex gap-1 mt-1.5">
                              {item.genres.slice(0, 2).map((g) => (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/60"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-white/40 line-clamp-1 mt-1.5">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Time Display on Right */
                        <div className="hidden md:block">
                          <span className="font-heading text-lg font-extrabold text-white tracking-wide block">
                            {item.timeJST}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block mt-0.5">
                            AIRING EVENT
                          </span>
                        </div>
                      )}
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
