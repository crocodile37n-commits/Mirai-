import React from 'react';

interface AccentHeadingProps {
  title: string;
  subtext?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AccentHeading: React.FC<AccentHeadingProps> = ({
  title,
  subtext,
  className = '',
  size = 'md',
}) => {
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3px-wide white vertical bar ~20px tall */}
      <span className="w-[3px] h-5 bg-white rounded-full flex-shrink-0" />
      <div className="flex items-baseline gap-3">
        <h2 className={`font-heading font-bold text-white tracking-wider uppercase ${textSize}`}>
          {title}
        </h2>
        {subtext && <span className="text-xs text-white/40 font-medium">{subtext}</span>}
      </div>
    </div>
  );
};
