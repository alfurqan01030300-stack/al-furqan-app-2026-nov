import React from 'react';
import { EDUCATION_SYSTEM_LABELS, TEACHER_SYSTEM_LABELS } from '../data/curricula';
import { EducationSystem, TeacherSystemChoice } from '../types';

export type CurriculumEmblemMode = 'all' | EducationSystem | TeacherSystemChoice;

interface CurriculumEmblemIconProps {
  mode?: CurriculumEmblemMode;
  size?: 'sm' | 'md' | 'lg';
  showCaption?: boolean;
}

/**
 * أيقونة التقديم المميزة:
 * مصحف مفتوح في المنتصف، تحيط به عناصر المناهج حسب النظام المختار:
 * - كتاب مدرسي
 * - آلة حاسبة (للرياضيات)
 * - أنبوبة علوم (للعلوم والكيمياء والأحياء والفيزياء)
 * - ميزان الفقه (للعلوم الشرعية الأزهرية)
 * - حرف عربي "ع" (للغة العربية)
 * بدون أي حرف R نهائياً.
 */
export const CurriculumEmblemIcon: React.FC<CurriculumEmblemIconProps> = ({
  mode = 'all',
  size = 'lg',
  showCaption = true,
}) => {
  const showAzharElements = mode === 'all' || mode === 'both' || mode === 'azhar';
  const showGeneralElements = mode === 'all' || mode === 'both' || mode === 'general';

  const dim =
    size === 'sm'
      ? 'w-20 h-20'
      : size === 'md'
      ? 'w-28 h-28'
      : 'w-36 h-36 sm:w-40 sm:h-40';

  const caption =
    mode === 'general'
      ? `مناهج النظام: ${EDUCATION_SYSTEM_LABELS.general}`
      : mode === 'azhar'
      ? `مناهج النظام: ${EDUCATION_SYSTEM_LABELS.azhar}`
      : mode === 'both'
      ? `المناهج: ${TEACHER_SYSTEM_LABELS.both}`
      : 'شعار المناهج الشاملة (عام + أزهري)';

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className={`${dim} relative shrink-0`}>
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full drop-shadow-xl"
          role="img"
          aria-label="أيقونة مناهج أكاديمية الفرقان"
        >
          <defs>
            <radialGradient id="furqanEmblemBg" cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#145A43" />
              <stop offset="65%" stopColor="#0B3D2E" />
              <stop offset="100%" stopColor="#062219" />
            </radialGradient>
            <linearGradient id="furqanGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F9E79F" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#9A7510" />
            </linearGradient>
            <linearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF5" />
              <stop offset="100%" stopColor="#F4E9C9" />
            </linearGradient>
          </defs>

          {/* Outer Emerald Medallion + Gold Ring */}
          <circle cx="120" cy="120" r="114" fill="url(#furqanEmblemBg)" stroke="url(#furqanGoldGrad)" strokeWidth="6" />
          <circle cx="120" cy="120" r="102" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.65" />

          {/* Top Left: Arabic Letter "ع" (اللغة العربية - Always visible) */}
          <g transform="translate(46, 48)">
            <circle cx="18" cy="18" r="19" fill="#07241B" stroke="#D4AF37" strokeWidth="2" />
            <text
              x="18"
              y="25"
              textAnchor="middle"
              fill="#F9E79F"
              fontSize="24"
              fontWeight="900"
              fontFamily="'Amiri', 'Cairo', serif"
            >
              ع
            </text>
          </g>

          {/* Top Right: Textbook (كتاب مدرسي - Always visible, highlighted on General/Both) */}
          <g transform="translate(156, 48)" opacity={showGeneralElements ? 1 : 0.9}>
            <circle cx="18" cy="18" r="19" fill="#07241B" stroke="#38BDF8" strokeWidth="2" />
            <rect x="8" y="8" width="20" height="20" rx="3" fill="#0284C7" stroke="#E0F2FE" strokeWidth="1.4" />
            <line x1="13" y1="8" x2="13" y2="28" stroke="#BAE6FD" strokeWidth="1.5" />
            <line x1="16" y1="14" x2="24" y2="14" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="16" y1="19" x2="24" y2="19" stroke="#E0F2FE" strokeWidth="1.4" strokeLinecap="round" />
          </g>

          {/* Bottom Left: Calculator (آلة حاسبة) */}
          <g transform="translate(42, 146)" opacity={showGeneralElements || mode === 'azhar' ? 1 : 0.45}>
            <circle cx="18" cy="18" r="19" fill="#07241B" stroke="#F59E0B" strokeWidth="2" />
            <rect x="10" y="7" width="16" height="22" rx="2.5" fill="#FDE68A" stroke="#92400E" strokeWidth="1.4" />
            <rect x="12.5" y="9.5" width="11" height="5" rx="1" fill="#065F46" />
            <circle cx="14" cy="18" r="1.4" fill="#92400E" />
            <circle cx="18" cy="18" r="1.4" fill="#92400E" />
            <circle cx="22" cy="18" r="1.4" fill="#92400E" />
            <circle cx="14" cy="22" r="1.4" fill="#92400E" />
            <circle cx="18" cy="22" r="1.4" fill="#92400E" />
            <circle cx="22" cy="22" r="1.4" fill="#92400E" />
            <circle cx="14" cy="25.8" r="1.4" fill="#92400E" />
            <rect x="16.8" y="24.5" width="6.5" height="2.6" rx="1" fill="#B45309" />
          </g>

          {/* Bottom Right: Science Test Tube (أنبوبة علوم) */}
          <g transform="translate(160, 146)">
            <circle cx="18" cy="18" r="19" fill="#07241B" stroke="#34D399" strokeWidth="2" />
            <g transform="rotate(25 18 18)">
              <rect x="14" y="6" width="8" height="21" rx="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.6" />
              <path d="M14.5 17 H21.5 V23 A3.5 3.5 0 0 1 14.5 23 Z" fill="#10B981" />
              <line x1="12.5" y1="6" x2="23.5" y2="6" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="17" cy="14" r="1.1" fill="#34D399" />
              <circle cx="19.5" cy="12" r="0.9" fill="#6EE7B7" />
            </g>
          </g>

          {/* Top Center: Scales of Fiqh (ميزان الفقه - emphasized in Azhar / All / Both) */}
          <g transform="translate(102, 22)" opacity={showAzharElements ? 1 : 0.22}>
            <circle cx="18" cy="18" r="18" fill="#07241B" stroke="#D4AF37" strokeWidth="2" />
            <line x1="18" y1="8" x2="18" y2="27" stroke="#F9E79F" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="27" x2="23" y2="27" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="12" x2="28" y2="12" stroke="#F9E79F" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M8 12 L5.5 19 H10.5 Z" fill="none" stroke="#D4AF37" strokeWidth="1.2" />
            <path d="M5 19 Q8 22.5 11 19 Z" fill="#D4AF37" />
            <path d="M28 12 L25.5 19 H30.5 Z" fill="none" stroke="#D4AF37" strokeWidth="1.2" />
            <path d="M25 19 Q28 22.5 31 19 Z" fill="#D4AF37" />
          </g>

          {/* Center Hero: Open Mushaf on Gold Rahle Stand */}
          <g transform="translate(65, 78)">
            {/* Subtle halo */}
            <circle cx="55" cy="44" r="46" fill="#D4AF37" opacity="0.14" />
            {/* Wooden Rahle X-base */}
            <path d="M26 70 L55 54 L84 70 L78 78 L55 64 L32 78 Z" fill="url(#furqanGoldGrad)" stroke="#785908" strokeWidth="1.4" />
            {/* Left Mushaf Page */}
            <path
              d="M55 24 C42 18, 22 18, 12 24 L12 60 C22 54, 42 54, 55 62 Z"
              fill="url(#paperGrad)"
              stroke="#B8860B"
              strokeWidth="2"
            />
            {/* Right Mushaf Page */}
            <path
              d="M55 24 C68 18, 88 18, 98 24 L98 60 C88 54, 68 54, 55 62 Z"
              fill="url(#paperGrad)"
              stroke="#B8860B"
              strokeWidth="2"
            />
            {/* Center Spine */}
            <line x1="55" y1="24" x2="55" y2="62" stroke="#9A7510" strokeWidth="2.4" />
            {/* Calligraphy decorative lines on pages */}
            <line x1="20" y1="31" x2="47" y2="31" stroke="#0B3D2E" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
            <line x1="20" y1="38" x2="47" y2="38" stroke="#0B3D2E" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
            <line x1="20" y1="45" x2="45" y2="45" stroke="#0B3D2E" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
            <line x1="63" y1="31" x2="90" y2="31" stroke="#0B3D2E" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
            <line x1="63" y1="38" x2="90" y2="38" stroke="#0B3D2E" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
            <line x1="65" y1="45" x2="90" y2="45" stroke="#0B3D2E" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
          </g>

          {/* Bottom Banner Ribbon */}
          <rect x="64" y="188" width="112" height="24" rx="12" fill="#07241B" stroke="url(#furqanGoldGrad)" strokeWidth="2" />
          <text
            x="120"
            y="204"
            textAnchor="middle"
            fill="#F9E79F"
            fontSize="11.5"
            fontWeight="800"
            fontFamily="'Cairo', sans-serif"
          >
            أكاديمية الفرقان
          </text>
        </svg>
      </div>

      {showCaption && (
        <span className="inline-flex items-center px-3 py-1 rounded-xl bg-[#0a4d2e] text-[#F3E5AB] border border-[#c9a227]/60 text-xs font-extrabold whitespace-nowrap">
          {caption}
        </span>
      )}
    </div>
  );
};
