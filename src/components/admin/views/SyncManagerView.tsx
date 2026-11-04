import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Activity,
  FileText,
  Boxes,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { authFetch } from '../../../services/authClient';

export interface SyncJob {
  id: string;
  provider_id: string;
  provider_name?: string;
  target_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  synced_items: number;
  failed_items: number;
  message?: string;
  started_at: string;
  completed_at?: string;
}

export interface SyncLog {
  id: string;
  job_id?: string;
  provider_id?: string;
  provider_name?: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: string;
  created_at: string;
}

export const SyncManagerView: React.FC = () => {
  const { showToast } = useApp();
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Start Sync Form
  const [selectedProvider, setSelectedProvider] = useState('provider_hianime_vega');
  const [selectedTarget, setSelectedTarget] = useState('anime');
  const [isStarting, setIsStarting] = useState(false);

  const fetchSyncData = useCallback(async () => {
    try {
      const [jobsRes, logsRes, provRes] = await Promise.all([
        authFetch('/api/admin/sync/jobs'),
        authFetch('/api/admin/sync/logs'),
        authFetch('/api/admin/plugins'),
      ]);

      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.jobs || []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
      if (provRes.ok) {
        const data = await provRes.json();
        setProviders(data.providers || []);
      }
    } catch {
      showToast('Error', 'Failed to fetch sync telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSyncData();
    const interval = setInterval(fetchSyncData, 4000);
    return () => clearInterval(interval);
  }, [fetchSyncData]);

  const handleStartSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      const res = await authFetch('/api/admin/sync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          targetType: selectedTarget,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Sync Started', `Sync job queued for ${selectedProvider}.`, 'success');
        fetchSyncData();
      } else {
        showToast('Error', data.error || 'Failed to start sync.', 'error');
      }
    } catch {
      showToast('Error', 'Failed to start sync job.', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const res = await authFetch(`/api/admin/sync/retry/${jobId}`, { method: 'POST' });
      if (res.ok) {
        showToast('Job Queued', 'Retry initiated.', 'info');
        fetchSyncData();
      }
    } catch {
      showToast('Error', 'Failed to retry job.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
            <RefreshCw className="w-5 h-5 text-[#8b5cf6]" />
            <span>Smart Sync Manager</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Incremental synchronization engine with metadata matching, error resilience, and progress tracking.
          </p>
        </div>

        <button
          onClick={fetchSyncData}
          className="h-9 px-3.5 rounded-xl glass border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8b5cf6]' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Start Sync Card */}
      <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2 mb-1">
          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span>Trigger Incremental Sync</span>
        </h3>
        <p className="text-xs text-white/50 mb-4">
          Poll installed Vega providers to update episode lists, streaming servers, and dubbing tracks without disrupting user playback.
        </p>

        <form onSubmit={handleStartSync} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
              Select Provider
            </label>
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
            >
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:w-48">
            <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
              Target Content
            </label>
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
            >
              <option value="anime">Anime Catalog</option>
              <option value="movie">Movie Catalog</option>
              <option value="schedule">Weekly Schedule</option>
              <option value="all">Full Sync (All Targets)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isStarting}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] cursor-pointer disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Sync Job</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Sync Jobs & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs List */}
        <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <h3 className="font-heading text-sm font-bold text-white flex items-center justify-between mb-3">
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8b5cf6]" />
              <span>Sync Job Execution Queue</span>
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              {jobs.length} jobs recorded
            </span>
          </h3>

          {jobs.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              No sync jobs have been run yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-xs font-bold text-white">
                          {job.provider_name || job.provider_id}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-white/10 text-white/70">
                          {job.target_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block mt-0.5">
                        Started: {new Date(job.started_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          job.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : job.status === 'running'
                            ? 'bg-[#8b5cf6]/10 text-[#c084fc] border border-[#8b5cf6]/20 animate-pulse'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {job.status}
                      </span>

                      {job.status === 'failed' && (
                        <button
                          onClick={() => handleRetryJob(job.id)}
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-white/70"
                          title="Retry"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                      <span>{job.message || 'Processing...'}</span>
                      <span className="font-mono">{job.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          job.status === 'completed'
                            ? 'bg-emerald-400'
                            : job.status === 'failed'
                            ? 'bg-red-400'
                            : 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync Logs */}
        <div className="p-5 rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <h3 className="font-heading text-sm font-bold text-white flex items-center justify-between mb-3">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ec4899]" />
              <span>Real-Time Sync Logs</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Live Stream</span>
          </h3>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-white/40 text-xs">
              No sync log events recorded.
            </div>
          ) : (
            <div className="space-y-2 max-h-[380px] overflow-y-auto no-scrollbar font-mono text-[11px] pr-1">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] flex items-start gap-2.5"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mt-0.5 ${
                      log.level === 'info'
                        ? 'bg-blue-500/20 text-blue-300'
                        : log.level === 'warn'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}
                  >
                    {log.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 leading-snug break-words">{log.message}</p>
                    <span className="text-[10px] text-white/30 block mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
