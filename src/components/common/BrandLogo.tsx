import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md', onClick }) => {
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none cursor-pointer group ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label="MIRAI Home"
    >
      {/* MIRAI Futuristic Geometric Emblem */}
      <div className={`relative ${iconSize} flex items-center justify-center`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_10px_rgba(139,92,246,0.65)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105"
        >
          {/* Futuristic faceted prism emblem */}
          <path
            d="M16 3L27 9.5V22.5L16 29L5 22.5V9.5L16 3Z"
            stroke="url(#mirai-border-grad)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M16 7L23 11V21L16 25L9 21V11L16 7Z"
            fill="url(#mirai-fill-grad)"
            opacity="0.85"
          />
          {/* Central stylized 'M' nexus lines */}
          <path
            d="M11 19V13L16 17.5L21 13V19"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Center luminous spark */}
          <circle cx="16" cy="17.5" r="1.5" fill="#f472b6" />

          <defs>
            <linearGradient id="mirai-border-grad" x1="5" y1="3" x2="27" y2="29" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6" />
              <stop offset="0.5" stopColor="#ec4899" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="mirai-fill-grad" x1="9" y1="7" x2="23" y2="25" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4c1d95" stopOpacity="0.8" />
              <stop offset="1" stopColor="#831843" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark: "MI" (white) + "RAI" (violet accent) */}
      <span className={`font-heading ${textSize} font-black tracking-tight leading-none uppercase`}>
        <span className="text-white">MI</span>
        <span className="text-[#8b5cf6]">RAI</span>
      </span>
    </div>
  );
};

export const MiraiAvatar: React.FC<{
  size?: number;
  className?: string;
  avatarUrl?: string | null;
  onClick?: () => void;
  alt?: string;
}> = ({
  size = 40,
  className = '',
  avatarUrl,
  onClick,
  alt = 'Avatar',
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  React.useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`rounded-full bg-[#121216] border border-white/20 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {avatarUrl && !imgFailed ? (
        <img
          src={avatarUrl}
          alt={alt}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5 drop-shadow-[0_0_6px_rgba(139,92,246,0.8)]"
        >
          <path
            d="M16 5L26 11V21L16 27L6 21V11L16 5Z"
            fill="url(#avatar-grad)"
          />
          <path
            d="M11 19V13L16 17.5L21 13V19"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="avatar-grad" x1="6" y1="5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      )}
    </div>
  );
};

// Backwards-compatibility alias
export const PurpleCloverAvatar = MiraiAvatar;

