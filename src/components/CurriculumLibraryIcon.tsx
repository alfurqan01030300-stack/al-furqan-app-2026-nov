import React from 'react';

interface CurriculumLibraryIconProps {
  onClick?: () => void;
  active?: boolean;
  label?: string;
  compact?: boolean;
}

/**
 * أيقونة "المقررات كلها" / "كل المناهج" المميزة على شكل مكتبة كتب ملونة
 * تظهر بشكل دائم وثابت في أعلى لوحة المدرس وفي القائمة الجانبية (وللطالب وولي الأمر بمناهجهم فقط).
 */
export const CurriculumLibraryBadgeSvg: React.FC<{ className?: string }> = ({
  className = 'w-7 h-7',
}) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    {/* Shelf base */}
    <rect x="3" y="32" width="34" height="4" rx="2" fill="#D4AF37" />
    {/* Emerald book */}
    <rect x="5" y="8" width="7" height="23" rx="1.8" fill="#10B981" stroke="#ECFDF5" strokeWidth="1" />
    <line x1="7" y1="13" x2="10" y2="13" stroke="#ECFDF5" strokeWidth="1.2" />
    {/* Amber / Gold book */}
    <rect x="13" y="5" width="7.5" height="26" rx="1.8" fill="#F59E0B" stroke="#FFFBEB" strokeWidth="1" />
    <line x1="15" y1="11" x2="18.5" y2="11" stroke="#FFFBEB" strokeWidth="1.2" />
    {/* Sky Blue book */}
    <rect x="21.5" y="10" width="7" height="21" rx="1.8" fill="#0EA5E9" stroke="#F0F9FF" strokeWidth="1" />
    <line x1="23.5" y1="15" x2="26.5" y2="15" stroke="#F0F9FF" strokeWidth="1.2" />
    {/* Tilted Coral / Rose book */}
    <g transform="rotate(-11 32 22)">
      <rect x="29" y="9" width="6.5" height="22" rx="1.6" fill="#F43F5E" stroke="#FFF1F2" strokeWidth="1" />
      <line x1="30.8" y1="14" x2="33.8" y2="14" stroke="#FFF1F2" strokeWidth="1.2" />
    </g>
  </svg>
);

export const CurriculumLibraryIcon: React.FC<CurriculumLibraryIconProps> = ({
  onClick,
  active = false,
  label = 'المقررات كلها',
  compact = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border-2 font-extrabold transition cursor-pointer whitespace-nowrap shrink-0 ${
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-xs sm:text-sm'
      } ${
        active
          ? 'bg-[#c9a227] text-[#07241B] border-[#fffdf5] shadow-lg'
          : 'bg-[#07241B]/90 hover:bg-[#145A43] text-[#F9E79F] border-[#D4AF37]/65 shadow'
      }`}
    >
      <CurriculumLibraryBadgeSvg className={compact ? 'w-6 h-6 shrink-0' : 'w-7 h-7 shrink-0'} />
      <span>{label}</span>
    </button>
  );
};
