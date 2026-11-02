import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  countText?: string;
  onViewAll?: () => void;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  countText,
  onViewAll,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-2 select-none mb-6 ${className}`}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 mb-1">
          {eyebrow}
        </p>
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-white tracking-[-0.02em]">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {countText && (
          <span className="text-xs font-medium text-white/40 hidden sm:inline">
            {countText}
          </span>
        )}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="h-[34px] px-4 rounded-full bg-[#0c0c0e] hover:bg-white/10 text-xs font-semibold text-white/90 border border-white/15 transition-all flex items-center gap-1 group active:scale-95"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
