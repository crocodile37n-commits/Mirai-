import React from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ConnectionsView: React.FC = () => {
  const { showToast } = useApp();

  const services = [
    {
      name: 'Discord',
      description: 'One-click sign-in and rich activity status sync.',
      connected: true,
      account: 'KuroNeko26#0001',
      color: '#5865f2',
    },
    {
      name: 'AniList',
      description: 'Synchronize your anime progress and list scoring directly with AniList.',
      connected: true,
      account: 'KuroNeko26',
      color: '#02a9ff',
    },
    {
      name: 'MyAnimeList',
      description: 'Import ratings, history, and status with automatic bi-directional sync.',
      connected: false,
      account: null,
      color: '#2e51a2',
    },
    {
      name: 'Crunchyroll',
      description: 'Cross-link simulcast watchlist and release schedule calendar.',
      connected: false,
      account: null,
      color: '#f47521',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[26px] font-extrabold text-white">
          Connected Accounts
        </h1>
        <p className="text-xs text-white/60 mt-0.5">
          Integrate third-party services and sync your streaming data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="p-5 rounded-[16px] bg-[#0c0c0e] border border-white/[0.08] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading text-sm font-bold text-white flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: svc.color }}
                  />
                  {svc.name}
                </span>
                {svc.connected ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#22c55e] text-[10px] font-bold flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40">Not linked</span>
                )}
              </div>
              <p className="text-xs text-white/60 leading-relaxed mb-3">
                {svc.description}
              </p>
              {svc.account && (
                <div className="text-[11px] font-mono text-white/40 mb-4 bg-white/5 px-2.5 py-1 rounded-md inline-block">
                  @{svc.account}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                showToast(
                  svc.connected ? `${svc.name} Settings` : `Connect ${svc.name}`,
                  svc.connected ? `Managing synced preferences for ${svc.name}` : `Opening auth flow for ${svc.name}`,
                  'info'
                );
              }}
              className={`h-[34px] px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                svc.connected
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  : 'bg-white text-black hover:bg-white/90 shadow'
              }`}
            >
              <span>{svc.connected ? 'Manage Sync' : `Connect ${svc.name}`}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
