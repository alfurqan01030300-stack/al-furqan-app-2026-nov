import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Palette,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  ALL_114_SURAHS,
  fetchSurahWithPages,
  MushafAyah,
  SurahData,
  SurahMeta,
  toArabicDigits,
} from '../data/surahsIndex';
import {
  parseAyahTajweed,
  TAJWEED_RULE_LIST,
  TAJWEED_RULES,
  TajweedRuleId,
} from '../utils/tajweedParser';

export const MushafTajweedView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSurahMeta, setSelectedSurahMeta] = useState<SurahMeta | null>(null);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showTajweedColors, setShowTajweedColors] = useState(true);
  const [fontSizePx, setFontSizePx] = useState<number>(28);
  const [inspectedRule, setInspectedRule] = useState<{
    ruleId: TajweedRuleId;
    word: string;
  } | null>(null);

  const filteredSurahs = useMemo(() => {
    const q = searchTerm.trim().replace(/^سورة\s+/u, '');
    if (!q) return ALL_114_SURAHS;
    return ALL_114_SURAHS.filter((s) => {
      const cleanName = s.name.replace(/^سورة\s+/u, '');
      return (
        cleanName.includes(q) ||
        s.name.includes(q) ||
        String(s.number) === q
      );
    });
  }, [searchTerm]);

  const openSurah = async (meta: SurahMeta) => {
    setSelectedSurahMeta(meta);
    setCurrentPageIndex(0);
    setInspectedRule(null);
    setLoadError(null);
    setLoadingSurah(true);
    try {
      const data = await fetchSurahWithPages(meta.number);
      setSurahData(data);
    } catch (err: any) {
      setLoadError(
        err?.message || 'تعذر تحميل السورة الآن. يرجى التأكد من الاتصال بالإنترنت.'
      );
      setSurahData(null);
    } finally {
      setLoadingSurah(false);
    }
  };

  // Group ayahs into authentic Mushaf pages
  const mushafPages = useMemo(() => {
    if (!surahData) return [];
    const pageMap = new Map<number, MushafAyah[]>();
    for (const ayah of surahData.ayahs) {
      const p = ayah.page || 1;
      const list = pageMap.get(p) || [];
      list.push(ayah);
      pageMap.set(p, list);
    }
    return Array.from(pageMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, ayahs]) => ({
        pageNumber,
        ayahs,
      }));
  }, [surahData]);

  useEffect(() => {
    if (currentPageIndex >= mushafPages.length && mushafPages.length > 0) {
      setCurrentPageIndex(0);
    }
  }, [mushafPages.length, currentPageIndex]);

  const activePage = mushafPages[currentPageIndex] || null;

  // Pre-parse Tajweed spans only for the currently visible Mushaf page
  const parsedPageAyahs = useMemo(() => {
    if (!activePage) return [];
    return activePage.ayahs.map((ayah) => ({
      ...ayah,
      words: parseAyahTajweed(ayah.text),
    }));
  }, [activePage]);

  // ---------------------------------------------------------------------------
  // VIEW 1: 114 SURAHS INDEX (الفاتحة -> الناس بالترتيب)
  // ---------------------------------------------------------------------------
  if (!selectedSurahMeta) {
    return (
      <div
        dir="rtl"
        className="w-full max-w-full overflow-x-hidden space-y-5 pb-12 font-cairo"
      >
        <div className="furqan-card rounded-2xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0a4d2e] border-2 border-[#c9a227] flex items-center justify-center text-[#c9a227] shrink-0 shadow">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold text-[#0a4d2e]">
                المصحف المجود — القرآن الكريم كاملاً
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                جميع السور (١١٤ سورة) مرتبة من الفاتحة إلى الناس مع تلوين أحكام التجويد — قراءة فقط للجميع
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a4d2e] text-[#F3E5AB] text-xs font-extrabold self-start sm:self-auto shrink-0 border border-[#c9a227]/60">
            <Palette className="w-4 h-4 text-[#c9a227]" />
            <span>قراءة بأحكام التجويد الملونة</span>
          </span>
        </div>

        {/* Search bar */}
        <div className="furqan-card rounded-2xl p-3.5 shadow">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9a7510] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم السورة أو رقمها (مثال: البقرة، الكهف، يس، 36)..."
              className="w-full bg-white border border-[#c9a227] rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-[#0a4d2e] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0a4d2e]/30"
            />
          </div>
        </div>

        {/* Surahs Grid (Ordered 1 -> 114) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSurahs.map((surah) => (
            <button
              key={surah.number}
              type="button"
              onClick={() => openSurah(surah)}
              className="w-full text-right furqan-card hover:bg-[#fff9e0] rounded-2xl p-4 border-2 border-[#c9a227]/75 hover:border-[#0a4d2e] shadow-sm hover:shadow-lg transition cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-[#0a4d2e] border border-[#c9a227] text-[#F3E5AB] font-extrabold text-sm flex items-center justify-center shrink-0 tabular-nums">
                  {toArabicDigits(surah.number)}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold font-amiri text-[#0a4d2e] truncate">
                    {surah.name}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                    {surah.revelationType} • {toArabicDigits(surah.ayahCount)} آية
                  </p>
                </div>
              </div>

              <div className="text-left shrink-0">
                <span className="inline-block px-2.5 py-1 rounded-lg bg-[#0a4d2e]/10 text-[#0a4d2e] text-[11px] font-extrabold">
                  صـ {toArabicDigits(surah.startPage)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {filteredSurahs.length === 0 && (
          <div className="furqan-card rounded-2xl p-8 text-center text-sm font-bold text-slate-600">
            لا توجد سورة مطابقة للبحث «{searchTerm}».
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW 2: MUSHAF PAGE-BY-PAGE READER WITH COLORED TAJWEED
  // ---------------------------------------------------------------------------
  return (
    <div
      dir="rtl"
      className="w-full max-w-full overflow-x-hidden space-y-4 pb-12 font-cairo"
    >
      {/* Reader Controls Top Bar */}
      <div className="furqan-card rounded-2xl p-4 shadow-lg flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedSurahMeta(null);
              setSurahData(null);
              setInspectedRule(null);
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#0a4d2e] hover:bg-[#0d5936] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowRight className="w-4 h-4 text-[#c9a227]" />
            <span>فهرس السور (١١٤)</span>
          </button>

          <div className="text-center flex-1 min-w-[140px]">
            <h2 className="text-lg sm:text-2xl font-extrabold font-amiri text-[#0a4d2e]">
              {selectedSurahMeta.name}
            </h2>
            <p className="text-[11px] font-bold text-[#9a7510]">
              {selectedSurahMeta.revelationType} • {toArabicDigits(selectedSurahMeta.ayahCount)} آية
              {activePage ? ` • صفحة المصحف: ${toArabicDigits(activePage.pageNumber)}` : ''}
            </p>
          </div>

          {/* Font Size & Tajweed Colors Toggle */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.max(20, s - 2))}
              title="تصغير الخط"
              className="w-9 h-9 rounded-xl bg-white border border-[#c9a227] text-[#0a4d2e] flex items-center justify-center cursor-pointer hover:bg-[#fff9e0]"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.min(40, s + 2))}
              title="تكبير الخط"
              className="w-9 h-9 rounded-xl bg-white border border-[#c9a227] text-[#0a4d2e] flex items-center justify-center cursor-pointer hover:bg-[#fff9e0]"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowTajweedColors((prev) => !prev)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 border cursor-pointer transition ${
                showTajweedColors
                  ? 'bg-[#0a4d2e] text-[#fffdf5] border-[#c9a227]'
                  : 'bg-white text-[#0a4d2e] border-[#c9a227]'
              }`}
            >
              {showTajweedColors ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-[#c9a227]" />
                  <span>إخفاء ألوان التجويد</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#0a4d2e]" />
                  <span>إظهار ألوان التجويد</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Inspected Tajweed Rule Inspector Box */}
        <div
          className="rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2 transition"
          style={{
            backgroundColor: inspectedRule
              ? TAJWEED_RULES[inspectedRule.ruleId].bgTint
              : '#fff9e6',
            borderColor: inspectedRule
              ? TAJWEED_RULES[inspectedRule.ruleId].color
              : '#c9a227',
          }}
        >
          {inspectedRule ? (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg text-white font-extrabold text-xs shrink-0"
                style={{ backgroundColor: TAJWEED_RULES[inspectedRule.ruleId].color }}
              >
                {TAJWEED_RULES[inspectedRule.ruleId].name}
              </span>
              <span className="font-amiri text-base font-bold text-[#0a4d2e]">
                «{inspectedRule.word}»
              </span>
              <span className="text-slate-700 font-semibold">
                — {TAJWEED_RULES[inspectedRule.ruleId].description}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#0a4d2e] font-bold">
              <Info className="w-4 h-4 text-[#9a7510] shrink-0" />
              <span>
                اضغط على أي حرف أو موضع ملون داخل الآيات لعرض اسم حكم التجويد وشرحه.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Loading / Error State */}
      {loadingSurah && (
        <div className="furqan-card rounded-3xl p-10 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#0a4d2e] animate-spin mx-auto" />
          <p className="text-sm font-extrabold text-[#0a4d2e]">
            جاري تجهيز صفحات {selectedSurahMeta.name} بأحكام التجويد...
          </p>
        </div>
      )}

      {!loadingSurah && loadError && (
        <div className="furqan-card rounded-3xl p-6 text-center space-y-3 border-2 border-red-400">
          <p className="text-sm font-bold text-red-700">{loadError}</p>
          <button
            type="button"
            onClick={() => openSurah(selectedSurahMeta)}
            className="px-4 py-2 rounded-xl bg-[#0a4d2e] text-white text-xs font-extrabold cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Mushaf Page Frame (Read-only, Crisp Uthmani Arabic, Page-by-Page) */}
      {!loadingSurah && !loadError && activePage && (
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-[#fffdf5] border-[3px] border-[#c9a227] rounded-3xl p-4 sm:p-8 shadow-2xl space-y-5 relative select-text">
            {/* Inner Gold Frame Header */}
            <div className="border-2 border-[#c9a227]/60 rounded-2xl py-2.5 px-4 bg-[#fff8df] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#0a4d2e]">
                {selectedSurahMeta.name}
              </span>
              <span className="text-xs font-extrabold text-[#9a7510]">
                الجزء {toArabicDigits(activePage.ayahs[0]?.juz || 1)} • صفحة{' '}
                {toArabicDigits(activePage.pageNumber)} من المصحف
              </span>
            </div>

            {/* Bismillah Header (First page of every surah except Surah 1 & Surah 9) */}
            {currentPageIndex === 0 &&
              selectedSurahMeta.number !== 1 &&
              selectedSurahMeta.number !== 9 && (
                <div className="text-center py-2 border-b border-[#c9a227]/35">
                  <p
                    className="font-amiri font-bold text-[#0a4d2e] leading-loose"
                    style={{ fontSize: `${Math.max(24, fontSizePx - 2)}px` }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                </div>
              )}

            {/* Verses Flow (Connected Mushaf Page Layout) */}
            <div
              dir="rtl"
              className="font-amiri text-justify text-[#0a2e1d] px-1 sm:px-3"
              style={{
                fontSize: `${fontSizePx}px`,
                lineHeight: 2.25,
                wordSpacing: '0.08em',
              }}
            >
              {parsedPageAyahs.map((ayah) => (
                <React.Fragment key={ayah.numberInSurah}>
                  {ayah.words.map((wordSpans, wIdx) => (
                    <React.Fragment key={`${ayah.numberInSurah}-w-${wIdx}`}>
                      <span>
                        {wordSpans.map((seg, sIdx) => {
                          if (!showTajweedColors || !seg.rule) {
                            return <span key={sIdx}>{seg.text}</span>;
                          }
                          const ruleMeta = TAJWEED_RULES[seg.rule];
                          return (
                            <span
                              key={sIdx}
                              role="button"
                              tabIndex={0}
                              title={`${ruleMeta.name}: ${seg.word}`}
                              onClick={() =>
                                setInspectedRule({
                                  ruleId: seg.rule!,
                                  word: seg.word,
                                })
                              }
                              onMouseEnter={() =>
                                setInspectedRule({
                                  ruleId: seg.rule!,
                                  word: seg.word,
                                })
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setInspectedRule({
                                    ruleId: seg.rule!,
                                    word: seg.word,
                                  });
                                }
                              }}
                              style={{ color: ruleMeta.color }}
                              className="cursor-pointer transition-opacity hover:opacity-80"
                            >
                              {seg.text}
                            </span>
                          );
                        })}
                      </span>{' '}
                    </React.Fragment>
                  ))}
                  <span
                    aria-label={`الآية ${ayah.numberInSurah}`}
                    className="inline-block text-[#9a7510] font-bold mx-1 select-none"
                    style={{ fontSize: `${Math.max(18, Math.round(fontSizePx * 0.78))}px` }}
                  >
                    ﴿{toArabicDigits(ayah.numberInSurah)}﴾
                  </span>{' '}
                </React.Fragment>
              ))}
            </div>

            {/* Page-by-Page Navigation Bar */}
            <div className="pt-4 border-t border-[#c9a227]/40 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentPageIndex === 0}
                onClick={() => {
                  setCurrentPageIndex((p) => Math.max(0, p - 1));
                  setInspectedRule(null);
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0a4d2e] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4 text-[#c9a227]" />
                <span>الصفحة السابقة</span>
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold text-[#0a4d2e] tabular-nums">
                <span>
                  صفحة {toArabicDigits(currentPageIndex + 1)} من{' '}
                  {toArabicDigits(mushafPages.length)} (المصحف صـ{' '}
                  {toArabicDigits(activePage.pageNumber)})
                </span>
                {mushafPages.length > 1 && (
                  <select
                    aria-label="الانتقال إلى صفحة"
                    value={currentPageIndex}
                    onChange={(e) => {
                      setCurrentPageIndex(Number(e.target.value));
                      setInspectedRule(null);
                    }}
                    className="bg-white border border-[#c9a227] rounded-lg px-2 py-1 text-xs font-bold text-[#0a4d2e] cursor-pointer"
                  >
                    {mushafPages.map((pg, idx) => (
                      <option key={pg.pageNumber} value={idx}>
                        صفحة {toArabicDigits(idx + 1)} (مصحف صـ {toArabicDigits(pg.pageNumber)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="button"
                disabled={currentPageIndex >= mushafPages.length - 1}
                onClick={() => {
                  setCurrentPageIndex((p) => Math.min(mushafPages.length - 1, p + 1));
                  setInspectedRule(null);
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0a4d2e] text-[#fffdf5] border border-[#c9a227] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <span>الصفحة التالية</span>
                <ChevronLeft className="w-4 h-4 text-[#c9a227]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tajweed Color Legend Key Below Mushaf */}
      <section className="w-full max-w-4xl mx-auto furqan-card rounded-3xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c9a227]/40 pb-2.5">
          <h3 className="text-sm sm:text-base font-extrabold text-[#0a4d2e] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#c9a227]" />
            <span>مفتاح ألوان أحكام التجويد</span>
          </h3>
          <span className="text-[11px] font-bold text-[#9a7510]">
            المصحف للقراءة فقط • اضغط على أي لون لقراءة تعريف الحكم
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {TAJWEED_RULE_LIST.map((rule) => (
            <button
              key={rule.id}
              type="button"
              onClick={() =>
                setInspectedRule({
                  ruleId: rule.id,
                  word: rule.category,
                })
              }
              className="text-right rounded-xl p-2.5 border border-[#c9a227]/50 bg-white hover:bg-[#fff9e6] transition cursor-pointer flex items-center gap-2"
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 border border-black/15"
                style={{ backgroundColor: rule.color }}
              />
              <div className="min-w-0">
                <p
                  className="text-xs font-extrabold truncate"
                  style={{ color: rule.color }}
                >
                  {rule.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{rule.category}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
