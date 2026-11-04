import React, { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  RefreshCw,
  Power,
  Trash2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Search,
  Globe,
  Film,
  Tv,
  Layers,
  Sparkles,
  Loader2,
  Code2,
  Check,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { authFetch } from '../../../services/authClient';

export interface ProviderItem {
  id: string;
  name: string;
  type: 'anime' | 'movie' | 'both';
  version: string;
  base_url: string;
  is_enabled: boolean;
  health_status: 'healthy' | 'degraded' | 'offline';
  capabilities: string[];
  settings: Record<string, any>;
  supported_languages: string[];
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

interface PluginManagerViewProps {
  filterType?: 'all' | 'anime' | 'movie';
}

export const PluginManagerView: React.FC<PluginManagerViewProps> = ({ filterType = 'all' }) => {
  const { showToast } = useApp();
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: string; latencyMs?: number; message: string } | null>(null);

  // Install modal
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [installForm, setInstallForm] = useState({
    name: '',
    type: 'anime' as 'anime' | 'movie' | 'both',
    version: '1.0.0',
    baseUrl: '',
    repositoryUrl: '',
    capabilities: 'search, catalog, episodes, servers, sources',
    supportedLanguages: 'Japanese, English, Hindi',
  });
  const [isInstalling, setIsInstalling] = useState(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = filterType !== 'all' ? `?type=${filterType}` : '';
      const res = await authFetch(`/api/admin/plugins${typeParam}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      showToast('Error', 'Failed to fetch providers.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterType, showToast]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleToggle = async (provider: ProviderItem) => {
    const nextState = !provider.is_enabled;
    try {
      const res = await authFetch(`/api/admin/plugins/${provider.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: nextState }),
      });
      if (res.ok) {
        setProviders(prev =>
          prev.map(p => (p.id === provider.id ? { ...p, is_enabled: nextState } : p))
        );
        showToast(
          'Provider Toggled',
          `${provider.name} is now ${nextState ? 'ENABLED' : 'DISABLED'}.`,
          'success'
        );
      }
    } catch {
      showToast('Error', 'Failed to toggle provider.', 'error');
    }
  };

  const handleTestConnectivity = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await authFetch(`/api/admin/plugins/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestResult({
          id,
          status: data.status,
          latencyMs: data.latencyMs,
          message: data.message,
        });
        setProviders(prev =>
          prev.map(p => (p.id === id ? { ...p, health_status: data.status } : p))
        );
        showToast(
          data.status === 'healthy' ? 'Provider Healthy' : 'Provider Warning',
          `${data.message} (${data.latencyMs}ms)`,
          data.status === 'healthy' ? 'success' : 'info'
        );
      } else {
        showToast('Test Failed', data.error || 'Connection failed.', 'error');
      }
    } catch {
      showToast('Test Error', 'Failed to test provider connectivity.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (provider: ProviderItem) => {
    if (!window.confirm(`Are you sure you want to uninstall provider "${provider.name}"?`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/admin/plugins/${provider.id}`, { method: 'DELETE' });
      if (res.ok) {
        setProviders(prev => prev.filter(p => p.id !== provider.id));
        showToast('Provider Removed', `Uninstalled ${provider.name}.`, 'info');
      }
    } catch {
      showToast('Error', 'Failed to remove provider.', 'error');
    }
  };

  const handleInstallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installForm.name.trim() || (!installForm.baseUrl.trim() && !installForm.repositoryUrl.trim())) {
      showToast('Missing Fields', 'Name and Base URL or Repo URL are required.', 'error');
      return;
    }

    setIsInstalling(true);
    try {
      const caps = installForm.capabilities.split(',').map(s => s.trim()).filter(Boolean);
      const langs = installForm.supportedLanguages.split(',').map(s => s.trim()).filter(Boolean);

      const res = await authFetch('/api/admin/plugins/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: installForm.name,
          type: installForm.type,
          version: installForm.version,
          baseUrl: installForm.baseUrl || installForm.repositoryUrl,
          repositoryUrl: installForm.repositoryUrl,
          capabilities: caps,
          supportedLanguages: langs,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Plugin Installed', `Provider "${installForm.name}" installed.`, 'success');
        setInstallModalOpen(false);
        setInstallForm({
          name: '',
          type: 'anime',
          version: '1.0.0',
          baseUrl: '',
          repositoryUrl: '',
          capabilities: 'search, catalog, episodes, servers, sources',
          supportedLanguages: 'Japanese, English, Hindi',
        });
        fetchProviders();
      } else {
        showToast('Installation Failed', data.error || 'Failed to install provider.', 'error');
      }
    } catch {
      showToast('Error', 'An error occurred during provider installation.', 'error');
    } finally {
      setIsInstalling(false);
    }
  };

  const filtered = providers.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.base_url.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2.5">
            <Boxes className="w-5 h-5 text-[#8b5cf6]" />
            <span>
              {filterType === 'anime'
                ? 'Anime Streaming Providers'
                : filterType === 'movie'
                ? 'Movie Streaming Providers'
                : 'Plugin Manager & Providers'}
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Modular streaming provider architecture compatible with Zenda-Cross Vega provider standards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProviders}
            className="h-9 px-3 rounded-xl glass border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-2 transition-all active:scale-95"
            title="Refresh providers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8b5cf6]' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setInstallModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:opacity-95 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add / Install Provider</span>
          </button>
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search provider by name, domain, or type..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#0c0c0e] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08]">
            Total: <strong className="text-white">{providers.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Active: <strong className="text-white">{providers.filter(p => p.is_enabled).length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#c084fc]">
            Vega Ready: <strong className="text-white">Active</strong>
          </span>
        </div>
      </div>

      {/* Providers Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-white/40 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#8b5cf6]" />
          <span>Scanning provider registry...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass border border-white/[0.08] p-8">
          <Boxes className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="font-heading text-sm font-bold text-white">No Providers Found</h3>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
            {search ? 'No providers matched your search.' : 'Click "Add / Install Provider" to register a streaming provider plugin.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(provider => {
            const isTesting = testingId === provider.id;
            const res = testResult?.id === provider.id ? testResult : null;

            return (
              <div
                key={provider.id}
                className={`p-5 rounded-2xl glass border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  provider.is_enabled
                    ? 'bg-[#0c0c0e]/80 border-white/[0.12] hover:border-white/25 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
                    : 'bg-[#0a0a0c]/60 border-white/[0.05] opacity-75'
                }`}
              >
                {/* Top Row: Title, Type badge, Health */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading text-sm font-bold text-white truncate">
                          {provider.name}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          v{provider.version}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 truncate mt-0.5 font-mono">
                        {provider.base_url}
                      </p>
                    </div>

                    {/* Content Type Badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 flex items-center gap-1 ${
                        provider.type === 'anime'
                          ? 'bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#c084fc]'
                          : provider.type === 'movie'
                          ? 'bg-[#ec4899]/20 border border-[#ec4899]/40 text-[#f472b6]'
                          : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                      }`}
                    >
                      {provider.type === 'anime' ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      <span>{provider.type}</span>
                    </span>
                  </div>

                  {/* Health status indicator */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          provider.health_status === 'healthy'
                            ? 'bg-emerald-400 animate-pulse'
                            : provider.health_status === 'degraded'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                        }`}
                      />
                      <span className="text-[11px] font-medium capitalize text-white/70">
                        {provider.health_status}
                      </span>
                    </div>

                    {provider.is_enabled ? (
                      <span className="text-[10px] text-emerald-400 font-semibold ml-auto">Active</span>
                    ) : (
                      <span className="text-[10px] text-white/40 font-semibold ml-auto">Disabled</span>
                    )}
                  </div>

                  {/* Capabilities tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {provider.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-white/60 font-mono"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>

                  {/* Supported Languages */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/50">
                    <Globe className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    <span>Languages: </span>
                    <span className="text-white/80 font-medium truncate">
                      {provider.supported_languages.join(', ')}
                    </span>
                  </div>

                  {/* Test result message banner if just tested */}
                  {res && (
                    <div
                      className={`mt-3 p-2 rounded-lg text-[11px] flex items-center justify-between gap-2 ${
                        res.status === 'healthy'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                      }`}
                    >
                      <span className="truncate">{res.message}</span>
                      {res.latencyMs !== undefined && (
                        <span className="font-mono font-bold flex-shrink-0">{res.latencyMs}ms</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggle(provider)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        provider.is_enabled
                          ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                          : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                      }`}
                      title={provider.is_enabled ? 'Disable Provider' : 'Enable Provider'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{provider.is_enabled ? 'Enabled' : 'Disabled'}</span>
                    </button>

                    <button
                      onClick={() => handleTestConnectivity(provider.id)}
                      disabled={isTesting}
                      className="h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Test Connection"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8b5cf6]" />
                      ) : (
                        <Activity className="w-3.5 h-3.5 text-[#8b5cf6]" />
                      )}
                      <span>Test</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(provider)}
                    className="h-8 w-8 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center cursor-pointer"
                    title="Uninstall Provider"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Install Provider Modal */}
      {installModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl glass bg-[#0e0e12] border border-white/15 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.8)] relative">
            <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#8b5cf6]" />
              <span>Install Streaming Provider</span>
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Add a new provider plugin using repository URL (e.g. Zenda-Cross/vega-providers) or API gateway.
            </p>

            <form onSubmit={handleInstallSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Provider Name *
                </label>
                <input
                  type="text"
                  required
                  value={installForm.name}
                  onChange={e => setInstallForm({ ...installForm, name: e.target.value })}
                  placeholder="e.g. Vega Zoro Multi-Server"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Target Type
                  </label>
                  <select
                    value={installForm.type}
                    onChange={e => setInstallForm({ ...installForm, type: e.target.value as any })}
                    className="w-full h-10 px-3 rounded-xl bg-[#141418] border border-white/10 text-xs text-white focus:border-[#8b5cf6] outline-none"
                  >
                    <option value="anime">Anime Provider</option>
                    <option value="movie">Movie Provider</option>
                    <option value="both">Universal (Anime & Movie)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={installForm.version}
                    onChange={e => setInstallForm({ ...installForm, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Base API / Gateway Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  value={installForm.baseUrl}
                  onChange={e => setInstallForm({ ...installForm, baseUrl: e.target.value })}
                  placeholder="https://api.consumet.org/anime/zoro"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Vega Provider Repo URL (Optional)
                </label>
                <input
                  type="text"
                  value={installForm.repositoryUrl}
                  onChange={e => setInstallForm({ ...installForm, repositoryUrl: e.target.value })}
                  placeholder="https://github.com/Zenda-Cross/vega-providers"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-white/70 uppercase mb-1">
                  Supported Languages (Comma-separated)
                </label>
                <input
                  type="text"
                  value={installForm.supportedLanguages}
                  onChange={e => setInstallForm({ ...installForm, supportedLanguages: e.target.value })}
                  placeholder="Japanese, English, Hindi"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#141418] border border-white/10 text-xs text-white placeholder-white/30 focus:border-[#8b5cf6] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setInstallModalOpen(false)}
                  className="h-10 px-4 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInstalling}
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.35)] cursor-pointer disabled:opacity-50"
                >
                  {isInstalling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Installing...</span>
                    </>
                  ) : (
                    <span>Register Provider</span>
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
