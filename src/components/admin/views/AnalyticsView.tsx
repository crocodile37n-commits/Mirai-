import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Layers,
  Search,
  Eye,
  Tv,
  BookOpen,
  MousePointerClick,
  Info,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';

export const AnalyticsView: React.FC = () => {
  const [range, setRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.getAnalytics(range).then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [range]);

  const isEmpty = !data || data.isEmpty || data.totalEvents === 0;

  return (
    <div className="space-y-6 select-none">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#8b5cf6]" />
            <span>Website Analytics &amp; Traffic</span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Real visitor events and telemetry collected from user interactions.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="inline-flex p-1 rounded-full bg-[#0c0c0e] border border-white/10">
          {(['24h', '7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`h-[30px] px-3.5 rounded-full text-xs font-semibold uppercase transition-all ${
                range === r
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#8b5cf6] animate-spin" />
        </div>
      ) : isEmpty ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-[#0c0c0e] border border-white/[0.08] max-w-[640px] mx-auto my-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-white mb-1">
            No Analytics Events Collected Yet
          </h3>
          <p className="text-xs text-white/50 max-w-[420px] mx-auto leading-relaxed mb-6">
            MIRAI does not generate synthetic numbers. Real events will begin streaming here immediately as visitors navigate the anime directory, watch episodes, and read manga chapters.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70">
            <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span>Telemetry endpoint listening at /api/analytics/event</span>
          </div>
        </div>
      ) : (
        /* Analytics Visualizations */
        <div className="space-y-6">
          {/* Timeline Bar Chart */}
          <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08]">
            <h3 className="font-heading text-sm font-bold text-white mb-4">
              Daily Activity Timeline ({data.totalEvents} Total Events)
            </h3>

            {/* Simple Bar Chart Representation */}
            <div className="h-[220px] flex items-end gap-2 pt-6 pb-2 border-b border-white/10 overflow-x-auto no-scrollbar">
              {data.dailyTimeline.map((day: any) => {
                const total = day.pageViews + day.plays + day.reads;
                const maxInSet = Math.max(...data.dailyTimeline.map((d: any) => d.pageViews + d.plays + d.reads), 1);
                const heightPct = Math.max(10, Math.round((total / maxInSet) * 100));

                return (
                  <div key={day.date} className="flex-1 min-w-[40px] flex flex-col items-center gap-2 group">
                    <div className="text-[10px] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {total}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#8b5cf6] to-[#d946ef] hover:brightness-125 transition-all relative"
                      title={`${day.date}: ${day.pageViews} views, ${day.plays} plays, ${day.reads} reads`}
                    />
                    <span className="text-[9px] font-mono text-white/40 rotate-45 origin-left whitespace-nowrap mt-1">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 text-xs text-white/50 justify-center">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                <span>Page Views</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" />
                <span>Streaming &amp; Reading</span>
              </span>
            </div>
          </div>

          {/* Breakdown & Top Pages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Distribution */}
            <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08]">
              <h3 className="font-heading text-sm font-bold text-white mb-4">
                Event Type Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(data.eventTypesBreakdown || {}).map(([type, count]: [string, any]) => {
                  const pct = Math.round((count / data.totalEvents) * 100);
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/80 capitalize font-medium">
                          {type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-white/40 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-[#8b5cf6] rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Hit Pages */}
            <div className="p-6 rounded-3xl bg-[#0c0c0e] border border-white/[0.08]">
              <h3 className="font-heading text-sm font-bold text-white mb-4">
                Most Visited Pages
              </h3>
              <div className="divide-y divide-white/[0.04]">
                {data.topPages.map((page: any, idx: number) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="text-white/70 font-mono truncate max-w-[260px]">
                      {page.path}
                    </span>
                    <span className="text-white font-bold font-mono">{page.count} hits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
