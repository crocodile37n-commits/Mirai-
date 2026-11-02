import React from 'react';
import { Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalToast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'warning'
      ? AlertTriangle
      : Info;

  const iconColor =
    toast.type === 'success'
      ? 'text-[#22c55e]'
      : toast.type === 'warning'
      ? 'text-[#f5c518]'
      : 'text-[#8b5cf6]';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-[380px] p-4 rounded-[14px] glass bg-[#0c0c0e]/95 border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.8)] flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200">
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 min-w-0 pr-1">
        <h5 className="font-heading text-xs font-bold text-white">
          {toast.title}
        </h5>
        <p className="text-[11px] text-white/60 leading-snug mt-0.5">
          {toast.message}
        </p>
      </div>
      <button
        onClick={dismissToast}
        className="text-white/40 hover:text-white transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
