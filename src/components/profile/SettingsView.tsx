import React from 'react';
import { LogOut } from 'lucide-react';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { userSettings, updateUserSettings, showToast, logout, resetToCleanState, isAuthenticated } = useApp();

  const toggleFolder = (folder: string) => {
    const current = userSettings.ignoreFolders || [];
    const next = current.includes(folder)
      ? current.filter((f) => f !== folder)
      : [...current, folder];
    updateUserSettings({ ignoreFolders: next });
  };

  const handleLogout = () => {
    logout();
  };

  const allFolders = ['Watching', 'On Hold', 'Plan to Watch', 'Dropped', 'Completed'];
  const audioOptions = ['None', 'SUB', 'DUB'] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[26px] font-extrabold text-white">
          Settings
        </h1>
        <p className="text-xs text-white/60 mt-0.5">
          Customize your viewing experience
        </p>
      </div>

      {/* One large solid card (radius 16, hairline) */}
      <div className="rounded-[16px] bg-[#0c0c0e] border border-white/[0.08] overflow-hidden shadow-xl divide-y divide-white/[0.08]">
        {/* ===================== */}
        {/* PLAYBACK SECTION      */}
        {/* ===================== */}
        <div className="p-6 space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 block mb-3">
            PLAYBACK
          </span>

          {/* Auto-play next episode */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Auto-play next episode
              </span>
            </div>
            <ToggleSwitch
              checked={userSettings.autoPlayNext}
              onChange={(val) => updateUserSettings({ autoPlayNext: val })}
            />
          </div>

          {/* Auto-play on page load */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Auto-play on page load
              </span>
            </div>
            <ToggleSwitch
              checked={userSettings.autoPlayPageLoad}
              onChange={(val) => updateUserSettings({ autoPlayPageLoad: val })}
            />
          </div>

          {/* Auto skip intro */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Auto skip intro
              </span>
            </div>
            <ToggleSwitch
              checked={userSettings.autoSkipIntro}
              onChange={(val) => updateUserSettings({ autoSkipIntro: val })}
            />
          </div>

          {/* Enable Dub audio */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Enable Dub audio
              </span>
            </div>
            <ToggleSwitch
              checked={userSettings.enableDubAudio}
              onChange={(val) => updateUserSettings({ enableDubAudio: val })}
            />
          </div>

          {/* Prefer original audio */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Prefer original audio
              </span>
              <p className="text-xs text-white/40 mt-0.5">
                Play Japanese audio track by default.
              </p>
            </div>
            <ToggleSwitch
              checked={userSettings.preferOriginalAudio}
              onChange={(val) => updateUserSettings({ preferOriginalAudio: val })}
            />
          </div>
        </div>

        {/* ===================== */}
        {/* PRIVACY SECTION       */}
        {/* ===================== */}
        <div className="p-6 space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 block mb-3">
            PRIVACY
          </span>

          {/* Show live watch status */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Show live watch status
              </span>
              <p className="text-xs text-white/40 mt-0.5">
                Others can see what you're currently watching.
              </p>
            </div>
            <ToggleSwitch
              checked={userSettings.showLiveWatchStatus}
              onChange={(val) => updateUserSettings({ showLiveWatchStatus: val })}
            />
          </div>

          {/* Show comments on home */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Show comments on home
              </span>
            </div>
            <ToggleSwitch
              checked={userSettings.showCommentsOnHome}
              onChange={(val) => updateUserSettings({ showCommentsOnHome: val })}
            />
          </div>

          {/* Public watchlist */}
          <div className="flex items-center justify-between min-h-[46px]">
            <div>
              <span className="text-sm font-semibold text-white block">
                Public watchlist
              </span>
              <p className="text-xs text-white/40 mt-0.5">
                Let others see your anime list.
              </p>
            </div>
            <ToggleSwitch
              checked={userSettings.publicWatchlist}
              onChange={(val) => updateUserSettings({ publicWatchlist: val })}
            />
          </div>
        </div>

        {/* ===================== */}
        {/* LANGUAGE SECTION      */}
        {/* ===================== */}
        <div className="p-6 flex items-center justify-between min-h-[56px]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 block mb-1">
              LANGUAGE
            </span>
            <span className="text-sm font-semibold text-white">
              Anime title language
            </span>
          </div>

          <div className="inline-flex p-1 rounded-full bg-[#121215] border border-white/10">
            <button
              onClick={() => updateUserSettings({ titleLanguage: 'English' })}
              className={`h-[30px] px-3.5 rounded-full text-xs font-bold transition-all ${
                userSettings.titleLanguage === 'English'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => updateUserSettings({ titleLanguage: 'Japanese' })}
              className={`h-[30px] px-3.5 rounded-full text-xs font-bold transition-all ${
                userSettings.titleLanguage === 'Japanese'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Japanese
            </button>
          </div>
        </div>

        {/* =========================== */}
        {/* CONNECTED ACCOUNTS SECTION  */}
        {/* =========================== */}
        <div className="p-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 block mb-3">
            CONNECTED ACCOUNTS
          </span>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5865f2] flex items-center justify-center text-white flex-shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  Discord
                </span>
                <p className="text-xs text-white/40 mt-0.5">
                  Link your Discord account for quick one-click authentication.
                </p>
              </div>
            </div>

            <button
              onClick={() => showToast('Discord Account', 'Your Discord account is connected as KuroNeko26#0001', 'info')}
              className="h-[34px] px-4 rounded-full bg-[#5865f2] text-white text-xs font-semibold hover:bg-[#4752c4] transition-all shadow active:scale-95 flex-shrink-0"
            >
              Connect Discord
            </button>
          </div>
        </div>

        {/* ===================== */}
        {/* NOTIFICATIONS SECTION */}
        {/* ===================== */}
        <div className="p-6 space-y-5">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/40 block mb-1">
            NOTIFICATIONS
          </span>

          {/* Ignore folders */}
          <div>
            <span className="text-sm font-semibold text-white block">
              Ignore folders
            </span>
            <p className="text-xs text-white/40 mt-0.5 mb-2.5">
              Disable notifications from selected lists.
            </p>
            <div className="flex flex-wrap gap-2">
              {allFolders.map((folder) => {
                const isSelected = userSettings.ignoreFolders?.includes(folder);

                return (
                  <button
                    key={folder}
                    onClick={() => toggleFolder(folder)}
                    className={`h-[30px] px-3.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {folder}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ignore audio type */}
          <div>
            <span className="text-sm font-semibold text-white block">
              Ignore audio type
            </span>
            <p className="text-xs text-white/40 mt-0.5 mb-2.5">
              Skip notifications for a specific audio type.
            </p>
            <div className="flex gap-2">
              {audioOptions.map((opt) => {
                const isSelected = userSettings.ignoreAudioType === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => updateUserSettings({ ignoreAudioType: opt })}
                    className={`h-[30px] px-4 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===================== */}
        {/* LOG OUT / RESET BARS  */}
        {/* ===================== */}
        <div className="flex flex-col divide-y divide-white/[0.08]">
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full h-[46px] bg-[rgba(127,29,29,0.25)] hover:bg-[rgba(127,29,29,0.4)] text-[#ef4444] font-semibold text-xs flex items-center justify-center gap-2 transition-colors active:opacity-90"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          )}

          <button
            onClick={resetToCleanState}
            className="w-full h-[42px] bg-white/[0.02] hover:bg-white/[0.06] text-white/50 hover:text-white/80 font-mono text-[11px] flex items-center justify-center gap-2 transition-colors active:opacity-90"
          >
            <span>Wipe Local Data & Reset to Guest State</span>
          </button>
        </div>
      </div>
    </div>
  );
};
