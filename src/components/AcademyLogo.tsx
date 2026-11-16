import React, { useId } from 'react';

interface AcademyLogoProps {
  logoUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBorder?: boolean;
  /** Forces rendering the official Academy circular seal emblem */
  preferOfficialSeal?: boolean;
}

const OFFICIAL_LOGIN_SEAL_SRC =
  '/assets/aistudio/WhatsApp_Image_2026-11-14_at_9.12.30_AM_b29e1dd7.jpg';

export const AcademyLogo: React.FC<AcademyLogoProps> = ({
  logoUrl,
  className = '',
  size = 'md',
  showBorder = true,
  preferOfficialSeal = false,
}) => {
  const uid = useId().replace(/:/g, '');
  const clipId = `academy-seal-clip-${uid}`;

  const sizeMap = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-28 h-28',
    '2xl': 'w-40 h-40 sm:w-44 sm:h-44',
  };

  const selectedBox = sizeMap[size] || sizeMap.md;

  if (!preferOfficialSeal && logoUrl && logoUrl.trim() !== '') {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex items-center justify-center bg-[#FDFBF7] mx-auto shrink-0 ${selectedBox} ${
          showBorder
            ? 'border-[3px] border-[#C9A227] shadow-[0_6px_24px_rgba(201,162,39,0.28)]'
            : ''
        } ${className}`}
      >
        <img
          src={logoUrl}
          alt="شعار أكاديمية الفرقان"
          className="w-full h-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full flex items-center justify-center select-none mx-auto shrink-0 ${selectedBox} ${
        showBorder ? 'drop-shadow-[0_8px_20px_rgba(11,93,46,0.2)]' : ''
      } ${className}`}
      aria-label="شعار أكاديمية الفرقان العالمية لتعليم القرآن والمواد الشرعية"
    >
      <svg
        viewBox="0 0 560 560"
        className="w-full h-full block"
        role="img"
        aria-label="أكاديمية الفرقان العالمية لتعليم القرآن والمواد الشرعية - الشيخ عبد المجيد مسعد"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="280" cy="280" r="264" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <image
            href={OFFICIAL_LOGIN_SEAL_SRC}
            x="-224"
            y="-64"
            width="1008"
            height="2128"
            preserveAspectRatio="none"
          />
        </g>
        <circle
          cx="280"
          cy="280"
          r="264"
          fill="none"
          stroke="#C9A227"
          strokeWidth="4"
        />
      </svg>
    </div>
  );
};
