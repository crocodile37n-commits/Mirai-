import React, { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink } from 'lucide-react';

export const PublicAnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/public/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements && data.announcements.length > 0) {
          const first = data.announcements[0];
          // Check if previously dismissed in this session
          const sessionDismissed = sessionStorage.getItem(`mirai_dismissed_${first.id}`);
          if (!sessionDismissed) {
            setAnnouncement(first);
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`mirai_dismissed_${announcement.id}`, 'true');
    } catch {}
  };

  return (
    <aside aria-label="Website announcement" className="relative z-30 w-full bg-gradient-to-r from-[#8b5cf6]/25 via-[#ec4899]/20 to-[#8b5cf6]/25 border-b border-white/10 text-white px-4 py-2 text-xs backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="w-4 h-4 text-[#c084fc] flex-shrink-0" />
          <span className="font-bold truncate">{announcement.title}:</span>
          <span className="text-white/80 truncate">{announcement.message}</span>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {announcement.buttonText && announcement.buttonUrl && (
            <a
              href={announcement.buttonUrl}
              className="px-3 py-1 rounded-full bg-white text-black font-bold text-[11px] hover:bg-white/90 transition-all flex items-center gap-1 shadow-sm"
            >
              <span>{announcement.buttonText}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={handleDismiss}
            aria-label="Close announcement"
            className="p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
