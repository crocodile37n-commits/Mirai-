import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const alerts = [
    {
      id: 1,
      title: 'Episode 19 Airing Alert',
      time: 'In 6 days',
      desc: 'One Piece Episode 1121 is scheduled for broadcast this Thursday.',
      unread: true,
    },
    {
      id: 2,
      title: 'New Season 2026 Announced',
      time: '2 hours ago',
      desc: 'Fall lineup preview is now live with 48 new anime titles available to stream.',
      unread: true,
    },
    {
      id: 3,
      title: 'Discord Login Connected',
      time: 'Yesterday',
      desc: 'Temporary sign-in token generated successfully.',
      unread: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-[26px] font-extrabold text-white">
          Notifications
        </h1>
        <p className="text-xs text-white/60 mt-0.5">
          Broadcast alerts, schedule updates, and system notices
        </p>
      </div>

      <div className="rounded-[16px] bg-[#0c0c0e] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
        {alerts.map((alert) => (
          <div key={alert.id} className="p-4 flex items-start gap-3.5 hover:bg-white/[0.02] transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/15 flex items-center justify-center text-[#a78bfa] flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-heading text-xs font-bold text-white flex items-center gap-2">
                  <span>{alert.title}</span>
                  {alert.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f472b6]" />
                  )}
                </h4>
                <span className="text-[10px] text-white/40">{alert.time}</span>
              </div>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
