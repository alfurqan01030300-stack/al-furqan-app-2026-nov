export interface SurahMeta {
  number: number;
  name: string;
  ayahCount: number;
  revelationType: 'مكية' | 'مدنية';
  startPage: number;
  endPage: number;
}

export interface MushafAyah {
  number: number;
  numberInSurah: number;
  text: string;
  page: number;
  juz: number;
  hizbQuarter?: number;
}

export interface SurahData {
  meta: SurahMeta;
  ayahs: MushafAyah[];
}

export const ALL_114_SURAHS: SurahMeta[] = [
  { number: 1, name: 'سورة الفاتحة', ayahCount: 7, revelationType: 'مكية', startPage: 1, endPage: 1 },
  { number: 2, name: 'سورة البقرة', ayahCount: 286, revelationType: 'مدنية', startPage: 2, endPage: 49 },
  { number: 3, name: 'سورة آل عمران', ayahCount: 200, revelationType: 'مدنية', startPage: 50, endPage: 76 },
  { number: 4, name: 'سورة النساء', ayahCount: 176, revelationType: 'مدنية', startPage: 77, endPage: 106 },
  { number: 5, name: 'سورة المائدة', ayahCount: 120, revelationType: 'مدنية', startPage: 106, endPage: 127 },
  { number: 6, name: 'سورة الأنعام', ayahCount: 165, revelationType: 'مكية', startPage: 128, endPage: 150 },
  { number: 7, name: 'سورة الأعراف', ayahCount: 206, revelationType: 'مكية', startPage: 151, endPage: 176 },
  { number: 8, name: 'سورة الأنفال', ayahCount: 75, revelationType: 'مدنية', startPage: 177, endPage: 186 },
  { number: 9, name: 'سورة التوبة', ayahCount: 129, revelationType: 'مدنية', startPage: 187, endPage: 207 },
  { number: 10, name: 'سورة يونس', ayahCount: 109, revelationType: 'مكية', startPage: 208, endPage: 221 },
  { number: 11, name: 'سورة هود', ayahCount: 123, revelationType: 'مكية', startPage: 221, endPage: 235 },
  { number: 12, name: 'سورة يوسف', ayahCount: 111, revelationType: 'مكية', startPage: 235, endPage: 248 },
  { number: 13, name: 'سورة الرعد', ayahCount: 43, revelationType: 'مدنية', startPage: 249, endPage: 255 },
  { number: 14, name: 'سورة إبراهيم', ayahCount: 52, revelationType: 'مكية', startPage: 255, endPage: 261 },
  { number: 15, name: 'سورة الحجر', ayahCount: 99, revelationType: 'مكية', startPage: 262, endPage: 267 },
  { number: 16, name: 'سورة النحل', ayahCount: 128, revelationType: 'مكية', startPage: 267, endPage: 281 },
  { number: 17, name: 'سورة الإسراء', ayahCount: 111, revelationType: 'مكية', startPage: 282, endPage: 293 },
  { number: 18, name: 'سورة الكهف', ayahCount: 110, revelationType: 'مكية', startPage: 293, endPage: 304 },
  { number: 19, name: 'سورة مريم', ayahCount: 98, revelationType: 'مكية', startPage: 305, endPage: 312 },
  { number: 20, name: 'سورة طه', ayahCount: 135, revelationType: 'مكية', startPage: 312, endPage: 321 },
  { number: 21, name: 'سورة الأنبياء', ayahCount: 112, revelationType: 'مكية', startPage: 322, endPage: 331 },
  { number: 22, name: 'سورة الحج', ayahCount: 78, revelationType: 'مدنية', startPage: 332, endPage: 341 },
  { number: 23, name: 'سورة المؤمنون', ayahCount: 118, revelationType: 'مكية', startPage: 342, endPage: 349 },
  { number: 24, name: 'سورة النور', ayahCount: 64, revelationType: 'مدنية', startPage: 350, endPage: 359 },
  { number: 25, name: 'سورة الفرقان', ayahCount: 77, revelationType: 'مكية', startPage: 359, endPage: 366 },
  { number: 26, name: 'سورة الشعراء', ayahCount: 227, revelationType: 'مكية', startPage: 367, endPage: 376 },
  { number: 27, name: 'سورة النمل', ayahCount: 93, revelationType: 'مكية', startPage: 377, endPage: 385 },
  { number: 28, name: 'سورة القصص', ayahCount: 88, revelationType: 'مكية', startPage: 385, endPage: 396 },
  { number: 29, name: 'سورة العنكبوت', ayahCount: 69, revelationType: 'مكية', startPage: 396, endPage: 404 },
  { number: 30, name: 'سورة الروم', ayahCount: 60, revelationType: 'مكية', startPage: 404, endPage: 410 },
  { number: 31, name: 'سورة لقمان', ayahCount: 34, revelationType: 'مكية', startPage: 411, endPage: 414 },
  { number: 32, name: 'سورة السجدة', ayahCount: 30, revelationType: 'مكية', startPage: 415, endPage: 417 },
  { number: 33, name: 'سورة الأحزاب', ayahCount: 73, revelationType: 'مدنية', startPage: 418, endPage: 427 },
  { number: 34, name: 'سورة سبأ', ayahCount: 54, revelationType: 'مكية', startPage: 428, endPage: 434 },
  { number: 35, name: 'سورة فاطر', ayahCount: 45, revelationType: 'مكية', startPage: 434, endPage: 440 },
  { number: 36, name: 'سورة يس', ayahCount: 83, revelationType: 'مكية', startPage: 440, endPage: 445 },
  { number: 37, name: 'سورة الصافات', ayahCount: 182, revelationType: 'مكية', startPage: 446, endPage: 452 },
  { number: 38, name: 'سورة ص', ayahCount: 88, revelationType: 'مكية', startPage: 453, endPage: 458 },
  { number: 39, name: 'سورة الزمر', ayahCount: 75, revelationType: 'مكية', startPage: 458, endPage: 467 },
  { number: 40, name: 'سورة غافر', ayahCount: 85, revelationType: 'مكية', startPage: 467, endPage: 476 },
  { number: 41, name: 'سورة فصلت', ayahCount: 54, revelationType: 'مكية', startPage: 477, endPage: 482 },
  { number: 42, name: 'سورة الشورى', ayahCount: 53, revelationType: 'مكية', startPage: 483, endPage: 489 },
  { number: 43, name: 'سورة الزخرف', ayahCount: 89, revelationType: 'مكية', startPage: 489, endPage: 495 },
  { number: 44, name: 'سورة الدخان', ayahCount: 59, revelationType: 'مكية', startPage: 496, endPage: 498 },
  { number: 45, name: 'سورة الجاثية', ayahCount: 37, revelationType: 'مكية', startPage: 499, endPage: 502 },
  { number: 46, name: 'سورة الأحقاف', ayahCount: 35, revelationType: 'مكية', startPage: 502, endPage: 506 },
  { number: 47, name: 'سورة محمد', ayahCount: 38, revelationType: 'مدنية', startPage: 507, endPage: 510 },
  { number: 48, name: 'سورة الفتح', ayahCount: 29, revelationType: 'مدنية', startPage: 511, endPage: 515 },
  { number: 49, name: 'سورة الحجرات', ayahCount: 18, revelationType: 'مدنية', startPage: 515, endPage: 517 },
  { number: 50, name: 'سورة ق', ayahCount: 45, revelationType: 'مكية', startPage: 518, endPage: 520 },
  { number: 51, name: 'سورة الذاريات', ayahCount: 60, revelationType: 'مكية', startPage: 520, endPage: 523 },
  { number: 52, name: 'سورة الطور', ayahCount: 49, revelationType: 'مكية', startPage: 523, endPage: 525 },
  { number: 53, name: 'سورة النجم', ayahCount: 62, revelationType: 'مكية', startPage: 526, endPage: 528 },
  { number: 54, name: 'سورة القمر', ayahCount: 55, revelationType: 'مكية', startPage: 528, endPage: 531 },
  { number: 55, name: 'سورة الرحمن', ayahCount: 78, revelationType: 'مدنية', startPage: 531, endPage: 534 },
  { number: 56, name: 'سورة الواقعة', ayahCount: 96, revelationType: 'مكية', startPage: 534, endPage: 537 },
  { number: 57, name: 'سورة الحديد', ayahCount: 29, revelationType: 'مدنية', startPage: 537, endPage: 541 },
  { number: 58, name: 'سورة المجادلة', ayahCount: 22, revelationType: 'مدنية', startPage: 542, endPage: 545 },
  { number: 59, name: 'سورة الحشر', ayahCount: 24, revelationType: 'مدنية', startPage: 545, endPage: 548 },
  { number: 60, name: 'سورة الممتحنة', ayahCount: 13, revelationType: 'مدنية', startPage: 549, endPage: 551 },
  { number: 61, name: 'سورة الصف', ayahCount: 14, revelationType: 'مدنية', startPage: 551, endPage: 552 },
  { number: 62, name: 'سورة الجمعة', ayahCount: 11, revelationType: 'مدنية', startPage: 553, endPage: 554 },
  { number: 63, name: 'سورة المنافقون', ayahCount: 11, revelationType: 'مدنية', startPage: 554, endPage: 555 },
  { number: 64, name: 'سورة التغابن', ayahCount: 18, revelationType: 'مدنية', startPage: 556, endPage: 557 },
  { number: 65, name: 'سورة الطلاق', ayahCount: 12, revelationType: 'مدنية', startPage: 558, endPage: 559 },
  { number: 66, name: 'سورة التحريم', ayahCount: 12, revelationType: 'مدنية', startPage: 560, endPage: 561 },
  { number: 67, name: 'سورة الملك', ayahCount: 30, revelationType: 'مكية', startPage: 562, endPage: 564 },
  { number: 68, name: 'سورة القلم', ayahCount: 52, revelationType: 'مكية', startPage: 564, endPage: 566 },
  { number: 69, name: 'سورة الحاقة', ayahCount: 52, revelationType: 'مكية', startPage: 566, endPage: 568 },
  { number: 70, name: 'سورة المعارج', ayahCount: 44, revelationType: 'مكية', startPage: 568, endPage: 570 },
  { number: 71, name: 'سورة نوح', ayahCount: 28, revelationType: 'مكية', startPage: 570, endPage: 571 },
  { number: 72, name: 'سورة الجن', ayahCount: 28, revelationType: 'مكية', startPage: 572, endPage: 573 },
  { number: 73, name: 'سورة المزمل', ayahCount: 20, revelationType: 'مكية', startPage: 574, endPage: 575 },
  { number: 74, name: 'سورة المدثر', ayahCount: 56, revelationType: 'مكية', startPage: 575, endPage: 577 },
  { number: 75, name: 'سورة القيامة', ayahCount: 40, revelationType: 'مكية', startPage: 577, endPage: 578 },
  { number: 76, name: 'سورة الإنسان', ayahCount: 31, revelationType: 'مدنية', startPage: 578, endPage: 580 },
  { number: 77, name: 'سورة المرسلات', ayahCount: 50, revelationType: 'مكية', startPage: 580, endPage: 581 },
  { number: 78, name: 'سورة النبأ', ayahCount: 40, revelationType: 'مكية', startPage: 582, endPage: 583 },
  { number: 79, name: 'سورة النازعات', ayahCount: 46, revelationType: 'مكية', startPage: 583, endPage: 584 },
  { number: 80, name: 'سورة عبس', ayahCount: 42, revelationType: 'مكية', startPage: 585, endPage: 585 },
  { number: 81, name: 'سورة التكوير', ayahCount: 29, revelationType: 'مكية', startPage: 586, endPage: 586 },
  { number: 82, name: 'سورة الانفطار', ayahCount: 19, revelationType: 'مكية', startPage: 587, endPage: 587 },
  { number: 83, name: 'سورة المطففين', ayahCount: 36, revelationType: 'مكية', startPage: 587, endPage: 589 },
  { number: 84, name: 'سورة الانشقاق', ayahCount: 25, revelationType: 'مكية', startPage: 589, endPage: 589 },
  { number: 85, name: 'سورة البروج', ayahCount: 22, revelationType: 'مكية', startPage: 590, endPage: 590 },
  { number: 86, name: 'سورة الطارق', ayahCount: 17, revelationType: 'مكية', startPage: 591, endPage: 591 },
  { number: 87, name: 'سورة الأعلى', ayahCount: 19, revelationType: 'مكية', startPage: 591, endPage: 592 },
  { number: 88, name: 'سورة الغاشية', ayahCount: 26, revelationType: 'مكية', startPage: 592, endPage: 592 },
  { number: 89, name: 'سورة الفجر', ayahCount: 30, revelationType: 'مكية', startPage: 593, endPage: 594 },
  { number: 90, name: 'سورة البلد', ayahCount: 20, revelationType: 'مكية', startPage: 594, endPage: 594 },
  { number: 91, name: 'سورة الشمس', ayahCount: 15, revelationType: 'مكية', startPage: 595, endPage: 595 },
  { number: 92, name: 'سورة الليل', ayahCount: 21, revelationType: 'مكية', startPage: 595, endPage: 596 },
  { number: 93, name: 'سورة الضحى', ayahCount: 11, revelationType: 'مكية', startPage: 596, endPage: 596 },
  { number: 94, name: 'سورة الشرح', ayahCount: 8, revelationType: 'مكية', startPage: 596, endPage: 596 },
  { number: 95, name: 'سورة التين', ayahCount: 8, revelationType: 'مكية', startPage: 597, endPage: 597 },
  { number: 96, name: 'سورة العلق', ayahCount: 19, revelationType: 'مكية', startPage: 597, endPage: 597 },
  { number: 97, name: 'سورة القدر', ayahCount: 5, revelationType: 'مكية', startPage: 598, endPage: 598 },
  { number: 98, name: 'سورة البينة', ayahCount: 8, revelationType: 'مدنية', startPage: 598, endPage: 599 },
  { number: 99, name: 'سورة الزلزلة', ayahCount: 8, revelationType: 'مدنية', startPage: 599, endPage: 599 },
  { number: 100, name: 'سورة العاديات', ayahCount: 11, revelationType: 'مكية', startPage: 599, endPage: 600 },
  { number: 101, name: 'سورة القارعة', ayahCount: 11, revelationType: 'مكية', startPage: 600, endPage: 600 },
  { number: 102, name: 'سورة التكاثر', ayahCount: 8, revelationType: 'مكية', startPage: 600, endPage: 600 },
  { number: 103, name: 'سورة العصر', ayahCount: 3, revelationType: 'مكية', startPage: 601, endPage: 601 },
  { number: 104, name: 'سورة الهمزة', ayahCount: 9, revelationType: 'مكية', startPage: 601, endPage: 601 },
  { number: 105, name: 'سورة الفيل', ayahCount: 5, revelationType: 'مكية', startPage: 601, endPage: 601 },
  { number: 106, name: 'سورة قريش', ayahCount: 4, revelationType: 'مكية', startPage: 602, endPage: 602 },
  { number: 107, name: 'سورة الماعون', ayahCount: 7, revelationType: 'مكية', startPage: 602, endPage: 602 },
  { number: 108, name: 'سورة الكوثر', ayahCount: 3, revelationType: 'مكية', startPage: 602, endPage: 602 },
  { number: 109, name: 'سورة الكافرون', ayahCount: 6, revelationType: 'مكية', startPage: 603, endPage: 603 },
  { number: 110, name: 'سورة النصر', ayahCount: 3, revelationType: 'مدنية', startPage: 603, endPage: 603 },
  { number: 111, name: 'سورة المسد', ayahCount: 5, revelationType: 'مكية', startPage: 603, endPage: 603 },
  { number: 112, name: 'سورة الإخلاص', ayahCount: 4, revelationType: 'مكية', startPage: 604, endPage: 604 },
  { number: 113, name: 'سورة الفلق', ayahCount: 5, revelationType: 'مكية', startPage: 604, endPage: 604 },
  { number: 114, name: 'سورة الناس', ayahCount: 6, revelationType: 'مكية', startPage: 604, endPage: 604 },
];

// Built-in instant Uthmani ayahs for Al-Fatiha & short ending Surahs (works offline too)
const SEED_SURAHS: Record<number, MushafAyah[]> = {
  1: [
    { number: 1, numberInSurah: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', page: 1, juz: 1 },
    { number: 2, numberInSurah: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', page: 1, juz: 1 },
    { number: 3, numberInSurah: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', page: 1, juz: 1 },
    { number: 4, numberInSurah: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', page: 1, juz: 1 },
    { number: 5, numberInSurah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', page: 1, juz: 1 },
    { number: 6, numberInSurah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', page: 1, juz: 1 },
    {
      number: 7,
      numberInSurah: 7,
      text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
      page: 1,
      juz: 1,
    },
  ],
  112: [
    { number: 6222, numberInSurah: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', page: 604, juz: 30 },
    { number: 6223, numberInSurah: 2, text: 'اللَّهُ الصَّمَدُ', page: 604, juz: 30 },
    { number: 6224, numberInSurah: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', page: 604, juz: 30 },
    { number: 6225, numberInSurah: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', page: 604, juz: 30 },
  ],
  113: [
    { number: 6226, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', page: 604, juz: 30 },
    { number: 6227, numberInSurah: 2, text: 'مِن شَرِّ مَا خَلَقَ', page: 604, juz: 30 },
    { number: 6228, numberInSurah: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', page: 604, juz: 30 },
    { number: 6229, numberInSurah: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', page: 604, juz: 30 },
    { number: 6230, numberInSurah: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', page: 604, juz: 30 },
  ],
  114: [
    { number: 6231, numberInSurah: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', page: 604, juz: 30 },
    { number: 6232, numberInSurah: 2, text: 'مَلِكِ النَّاسِ', page: 604, juz: 30 },
    { number: 6233, numberInSurah: 3, text: 'إِلَٰهِ النَّاسِ', page: 604, juz: 30 },
    { number: 6234, numberInSurah: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', page: 604, juz: 30 },
    { number: 6235, numberInSurah: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', page: 604, juz: 30 },
    { number: 6236, numberInSurah: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ', page: 604, juz: 30 },
  ],
};

const surahMemoryCache = new Map<number, SurahData>();

export async function fetchSurahWithPages(surahNumber: number): Promise<SurahData> {
  const cached = surahMemoryCache.get(surahNumber);
  if (cached) return cached;

  const meta = ALL_114_SURAHS.find((s) => s.number === surahNumber) || ALL_114_SURAHS[0];

  // Primary Quran Uthmani endpoint (returns exact Madinah Mushaf page numbers 1..604)
  try {
    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`
    );
    if (res.ok) {
      const json = await res.json();
      const rawAyahs = json?.data?.ayahs;
      if (Array.isArray(rawAyahs) && rawAyahs.length > 0) {
        const ayahs: MushafAyah[] = rawAyahs.map((a: any, idx: number) => {
          let txt = String(a.text || '').trim();
          // Strip repeated Bismillah prefix on ayah 1 for Surahs other than Al-Fatiha (1) & At-Tawbah (9)
          if (surahNumber !== 1 && surahNumber !== 9 && idx === 0) {
            txt = txt
              .replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/u, '')
              .replace(/^بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\s*/u, '')
              .trim();
          }
          return {
            number: Number(a.number || idx + 1),
            numberInSurah: Number(a.numberInSurah || idx + 1),
            text: txt,
            page: Number(a.page || meta.startPage),
            juz: Number(a.juz || 1),
            hizbQuarter: a.hizbQuarter ? Number(a.hizbQuarter) : undefined,
          };
        });
        const data: SurahData = { meta, ayahs };
        surahMemoryCache.set(surahNumber, data);
        return data;
      }
    }
  } catch {
    // try fallback endpoint below
  }

  // Fallback Quran JSON CDN
  try {
    const res2 = await fetch(
      `https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/${surahNumber}.json`
    );
    if (res2.ok) {
      const json2 = await res2.json();
      const verses = json2?.verses;
      if (Array.isArray(verses) && verses.length > 0) {
        const pageSpan = Math.max(1, meta.endPage - meta.startPage + 1);
        const ayahs: MushafAyah[] = verses.map((v: any, idx: number) => ({
          number: Number(v.id || idx + 1),
          numberInSurah: Number(v.id || idx + 1),
          text: String(v.text || '').trim(),
          page: Math.min(
            meta.endPage,
            meta.startPage + Math.floor((idx / verses.length) * pageSpan)
          ),
          juz: 1,
        }));
        const data: SurahData = { meta, ayahs };
        surahMemoryCache.set(surahNumber, data);
        return data;
      }
    }
  } catch {
    // fall through to seed or error
  }

  if (SEED_SURAHS[surahNumber]) {
    const seedData: SurahData = { meta, ayahs: SEED_SURAHS[surahNumber] };
    surahMemoryCache.set(surahNumber, seedData);
    return seedData;
  }

  throw new Error('تعذر تحميل آيات السورة حالياً، يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى.');
}

export function toArabicDigits(num: number): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map((ch) => digits[Number(ch)] ?? ch)
    .join('');
}
