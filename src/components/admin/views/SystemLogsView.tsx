import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Download,
  AlertTriangle,
  Info,
  Clock,
  Loader2,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { authFetch } from '../../../services/authClient';

export interface AuditLogItem {
  id: string;
  action: string;
  actor_email?: string;
  actor_role?: string;
  target?: string;
  details?: string;
  ip_hash?: string;
  created_at: string;
}

export const SystemLogsView: React.FC = () => {
  const { showToast } = useApp();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch {
      showToast('Error', 'Failed to fetch audit telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `mirai_audit_logs_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Export Complete', 'Audit log file downloaded.', 'success');
    } catch {
      showToast('Export Failed', 'Could not export logs.', 'error');
    }
  };

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      (log.actor_email && log.actor_email.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q));

    const matchesFilter =
      filterAction === 'all' ||
      (filterAction === 'auth' && log.action.includes('login')) ||
      (filterAction === 'security' && (log.action.includes('unauthorized') || log.action.includes('failed'))) ||
      (filterAction === 'plugin' && log.action.includes('plugin'));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-[#8b5cf6]" />
            <span>System Logs & Security Audit Telemetry</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Live forensic tracking of administrative actions, user authentications, and plugin events stored in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            className="h-9 px-3 rounded-xl glass border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8b5cf6]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExport}
            className="h-9 px-3.5 rounded-xl glass border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search logs by action, actor, or details..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="h-10 px-3 rounded-xl bg-[#0c0c0e] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
          >
            <option value="all">All Events</option>
            <option value="auth">Logins & Auth</option>
            <option value="security">Security & Failures</option>
            <option value="plugin">Plugins & Streams</option>
          </select>
        </div>

        <div className="text-xs text-white/60 font-mono">
          Showing <strong className="text-white">{filtered.length}</strong> of {logs.length} events
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="py-20 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#8b5cf6]" />
          <span>Retrieving audit records...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass border border-white/[0.08] p-8">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="font-heading text-sm font-bold text-white">No Logs Found</h3>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
            No system log records matched your query.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl glass bg-[#0c0c0e]/80 border border-white/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-white/40 font-semibold uppercase text-[10px] bg-white/[0.02]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4 text-right">IP Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                {filtered.map(log => {
                  const isSecurity =
                    log.action.includes('unauthorized') || log.action.includes('failed');
                  const isPlugin = log.action.includes('plugin');

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-white/50 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            isSecurity
                              ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                              : isPlugin
                              ? 'bg-[#8b5cf6]/20 text-[#c084fc] border border-[#8b5cf6]/30'
                              : 'bg-white/5 text-white/80 border border-white/10'
                          }`}
                        >
                          {isSecurity && <ShieldAlert className="w-3 h-3 text-red-400" />}
                          <span>{log.action}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-white/80">
                        {log.actor_email ? (
                          <span>{log.actor_email}</span>
                        ) : (
                          <span className="text-white/30 italic">System Agent</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-white/70 max-w-md break-words">
                        {log.details || '—'}
                      </td>

                      <td className="py-3 px-4 text-right text-white/40 text-[10px]">
                        {log.ip_hash || 'local'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
