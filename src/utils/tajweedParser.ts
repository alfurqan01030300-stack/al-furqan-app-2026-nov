export type TajweedRuleId =
  | 'izhar'
  | 'idgham'
  | 'iqlab'
  | 'ikhfa'
  | 'madd_muttasil'
  | 'madd_munfasil'
  | 'madd_lazim'
  | 'madd_badal'
  | 'qalqalah'
  | 'ghunnah'
  | 'tafkheem'
  | 'tarqeeq';

export interface TajweedRuleMeta {
  id: TajweedRuleId;
  name: string;
  category: string;
  color: string;
  bgTint: string;
  description: string;
}

export const TAJWEED_RULES: Record<TajweedRuleId, TajweedRuleMeta> = {
  izhar: {
    id: 'izhar',
    name: 'الإظهار الحلقي',
    category: 'النون الساكنة والتنوين',
    color: '#15803D',
    bgTint: '#DCFCE7',
    description: 'نطق النون الساكنة أو التنوين نطقاً واضحاً دون غنة زائدة قبل حروف الحلق (ء هـ ع ح غ خ).',
  },
  idgham: {
    id: 'idgham',
    name: 'الإدغام',
    category: 'النون الساكنة والتنوين',
    color: '#2563EB',
    bgTint: '#DBEAFE',
    description: 'إدخال النون الساكنة أو التنوين في الحرف التالي من حروف (يرملون) بحيث يصيران حرفاً واحداً مشدداً.',
  },
  iqlab: {
    id: 'iqlab',
    name: 'الإقلاب',
    category: 'النون الساكنة والتنوين',
    color: '#9333EA',
    bgTint: '#F3E8FF',
    description: 'قلب النون الساكنة أو التنوين ميماً مخفاة بغنة بمقدار حركتين عند ملاقاتها حرف الباء.',
  },
  ikhfa: {
    id: 'ikhfa',
    name: 'الإخفاء الحقيقي',
    category: 'النون الساكنة والتنوين',
    color: '#EA580C',
    bgTint: '#FFEDD5',
    description: 'النطق بالنون الساكنة أو التنوين بحالة بين الإظهار والإدغام مع بقاء الغنة حركتين.',
  },
  madd_muttasil: {
    id: 'madd_muttasil',
    name: 'المد الواجب المتصل',
    category: 'المدود',
    color: '#DC2626',
    bgTint: '#FEE2E2',
    description: 'وقوع الهمزة بعد حرف المد في كلمة واحدة، ويمد بمقدار 4 أو 5 حركات.',
  },
  madd_munfasil: {
    id: 'madd_munfasil',
    name: 'المد الجائز المنفصل',
    category: 'المدود',
    color: '#E11D48',
    bgTint: '#FFE4E6',
    description: 'وقوع حرف المد في آخر كلمة والهمزة في أول الكلمة التالية، ويمد 4 أو 5 حركات.',
  },
  madd_lazim: {
    id: 'madd_lazim',
    name: 'المد اللازم',
    category: 'المدود',
    color: '#881337',
    bgTint: '#FCE7F3',
    description: 'مجيء سكون أصلي أو حرف مشدد بعد حرف المد، ويمد لزوماً بمقدار 6 حركات.',
  },
  madd_badal: {
    id: 'madd_badal',
    name: 'مد البدل',
    category: 'المدود',
    color: '#D97706',
    bgTint: '#FEF3C7',
    description: 'تقدم الهمزة على حرف المد (مثل: آمَنُوا / أُوتُوا / إِيمَانًا)، ويمد بمقدار حركتين.',
  },
  qalqalah: {
    id: 'qalqalah',
    name: 'القلقلة',
    category: 'الصفات',
    color: '#0D9488',
    bgTint: '#CCFBF1',
    description: 'اهتزاز الصوت عند النطق بأحد حروف (ق ط ب ج د) حال سكونها.',
  },
  ghunnah: {
    id: 'ghunnah',
    name: 'الغنة',
    category: 'النون والميم',
    color: '#C026D3',
    bgTint: '#FAE8FF',
    description: 'صوت يخرج من الخيشوم في النون والميم المشددتين وحكم الميم الساكنة بمقدار حركتين.',
  },
  tafkheem: {
    id: 'tafkheem',
    name: 'التفخيم',
    category: 'التفخيم والترقيق',
    color: '#0369A1',
    bgTint: '#E0F2FE',
    description: 'تسمين وتغليظ الحرف عند النطق به في حروف الاستعلاء (خص ضغط قظ) والراء/لام لفظ الجلالة المفخمة.',
  },
  tarqeeq: {
    id: 'tarqeeq',
    name: 'الترقيق',
    category: 'التفخيم والترقيق',
    color: '#65A30D',
    bgTint: '#ECFCCB',
    description: 'تنحيف صوت الحرف عند النطق به مثل الراء المكسورة ولام لفظ الجلالة المسبوقة بكسر.',
  },
};

export const TAJWEED_RULE_LIST: TajweedRuleMeta[] = Object.values(TAJWEED_RULES);

export interface TajweedCharSpan {
  text: string;
  rule?: TajweedRuleId;
  word: string;
}

const HARAKAT_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;
const IZHAR_LETTERS = new Set(['ء', 'أ', 'إ', 'آ', 'ؤ', 'ئ', 'ه', 'ع', 'ح', 'غ', 'خ']);
const IDGHAM_LETTERS = new Set(['ي', 'ر', 'م', 'ل', 'و', 'ن', 'ى']);
const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د']);
const TAFKHEEM_LETTERS = new Set(['خ', 'ص', 'ض', 'غ', 'ط', 'ق', 'ظ']);
const IKHFA_LETTERS = new Set([
  'ت',
  'ث',
  'ج',
  'د',
  'ذ',
  'ز',
  'س',
  'ش',
  'ص',
  'ض',
  'ط',
  'ظ',
  'ف',
  'ق',
  'ك',
]);
const HAMZA_START_LETTERS = new Set(['ء', 'أ', 'إ', 'آ', 'ٱ']);
const SUKOON_MARKS = ['\u0652', '\u06E1']; // ْ and Uthmani head-of-khah ۡ
const SHADDA = '\u0651';
const MADD_TILDE = '\u0653'; // ٓ
const TANWEEN_MARKS = ['\u064B', '\u064C', '\u064D', '\u08F0', '\u08F1', '\u08F2']; // ً ٌ ٍ
const FATHA = '\u064E';
const DAMMA = '\u064F';
const KASRA = '\u0650';

interface GraphemeCluster {
  base: string;
  marks: string;
  full: string;
}

function splitWordClusters(word: string): GraphemeCluster[] {
  const clusters: GraphemeCluster[] = [];
  for (const ch of word) {
    if (HARAKAT_REGEX.test(ch) || ch === '\u06E2' || ch === '\u06ED') {
      if (clusters.length > 0) {
        clusters[clusters.length - 1].marks += ch;
        clusters[clusters.length - 1].full += ch;
      } else {
        clusters.push({ base: ch, marks: '', full: ch });
      }
    } else {
      clusters.push({ base: ch, marks: '', full: ch });
    }
  }
  return clusters;
}

function stripMarks(str: string): string {
  return str.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1-\u06E4]/g, '');
}

function hasAny(marks: string, chars: string[]): boolean {
  return chars.some((c) => marks.includes(c));
}

function classifyNoonOrTanweenFollow(nextBase: string | undefined): TajweedRuleId | undefined {
  if (!nextBase) return undefined;
  if (nextBase === 'ب') return 'iqlab';
  if (IZHAR_LETTERS.has(nextBase)) return 'izhar';
  if (IDGHAM_LETTERS.has(nextBase)) return 'idgham';
  if (IKHFA_LETTERS.has(nextBase)) return 'ikhfa';
  return undefined;
}

export function parseAyahTajweed(ayahText: string): TajweedCharSpan[][] {
  const words = ayahText.trim().split(/\s+/).filter(Boolean);

  return words.map((word, wIdx) => {
    const nextWord = words[wIdx + 1] || '';
    const prevWord = words[wIdx - 1] || '';
    const clusters = splitWordClusters(word);
    const nextClusters = nextWord ? splitWordClusters(nextWord) : [];
    const prevClusters = prevWord ? splitWordClusters(prevWord) : [];
    const plainWord = stripMarks(word);
    const isAllahWord =
      plainWord === 'الله' ||
      plainWord === 'لله' ||
      plainWord === 'ٱلله' ||
      plainWord === 'بالله' ||
      plainWord === 'تالله' ||
      plainWord === 'والله' ||
      plainWord === 'فالله';

    const assignedRules: (TajweedRuleId | undefined)[] = new Array(clusters.length).fill(undefined);

    for (let i = 0; i < clusters.length; i++) {
      const cur = clusters[i];
      const next = clusters[i + 1];
      const prev = clusters[i - 1];
      const followBase = next ? next.base : nextClusters[0]?.base;

      // 1. Small high meem (iqlab indicator in Uthmani) or Noon Sukoon / Tanween rules
      const isNoonSukoon =
        cur.base === 'ن' &&
        (hasAny(cur.marks, SUKOON_MARKS) ||
          (!hasAny(cur.marks, [FATHA, DAMMA, KASRA, SHADDA]) &&
            !cur.marks.includes(TANWEEN_MARKS[0]) &&
            !cur.marks.includes(TANWEEN_MARKS[1]) &&
            !cur.marks.includes(TANWEEN_MARKS[2]) &&
            cur.marks === ''));

      const hasTanween = hasAny(cur.marks, TANWEEN_MARKS);

      if (cur.marks.includes('\u06E2') || cur.marks.includes('\u06ED')) {
        assignedRules[i] = 'iqlab';
        continue;
      }

      if (isNoonSukoon || hasTanween) {
        const rule = classifyNoonOrTanweenFollow(followBase);
        if (rule) {
          assignedRules[i] = rule;
          continue;
        }
      }

      // 2. Ghunnah: Shadda on Noon or Meem, or Meem Sakinah before Meem/Ba
      if ((cur.base === 'ن' || cur.base === 'م') && cur.marks.includes(SHADDA)) {
        assignedRules[i] = 'ghunnah';
        continue;
      }
      if (
        cur.base === 'م' &&
        (hasAny(cur.marks, SUKOON_MARKS) || (!hasAny(cur.marks, [FATHA, DAMMA, KASRA, SHADDA]) && i < clusters.length)) &&
        (followBase === 'ب' || followBase === 'م')
      ) {
        assignedRules[i] = 'ghunnah';
        continue;
      }

      // 3. Madd rules: Badal, Lazim, Muttasil, Munfasil
      if (cur.base === 'آ') {
        assignedRules[i] = 'madd_badal';
        continue;
      }
      if (
        (cur.base === 'ء' || cur.base === 'أ' || cur.base === 'إ' || cur.base === 'ؤ' || cur.base === 'ئ') &&
        next &&
        (next.base === 'ا' || next.base === 'و' || next.base === 'ي' || next.base === 'ى') &&
        !next.marks.includes(FATHA) &&
        !next.marks.includes(DAMMA) &&
        !next.marks.includes(KASRA) &&
        !next.marks.includes(SHADDA) &&
        !next.marks.includes(MADD_TILDE)
      ) {
        assignedRules[i] = 'madd_badal';
        assignedRules[i + 1] = 'madd_badal';
        continue;
      }

      if (cur.marks.includes(MADD_TILDE)) {
        // Check what follows inside word vs next word
        let restHasHamzaInWord = false;
        let restHasShaddaInWord = false;
        for (let k = i + 1; k < clusters.length; k++) {
          if (clusters[k].marks.includes(SHADDA)) {
            restHasShaddaInWord = true;
            break;
          }
          if (HAMZA_START_LETTERS.has(clusters[k].base) || clusters[k].base === 'ؤ' || clusters[k].base === 'ئ') {
            restHasHamzaInWord = true;
            break;
          }
        }
        if (restHasShaddaInWord || (!next && clusters.length <= 4 && words.length === 1)) {
          assignedRules[i] = 'madd_lazim';
        } else if (restHasHamzaInWord) {
          assignedRules[i] = 'madd_muttasil';
        } else if (!next && nextClusters[0] && HAMZA_START_LETTERS.has(nextClusters[0].base)) {
          assignedRules[i] = 'madd_munfasil';
        } else {
          assignedRules[i] = 'madd_lazim';
        }
        continue;
      }

      // 4. Qalqalah: ق ط ب ج د when Sakinah (or end of ayah stop)
      if (QALQALAH_LETTERS.has(cur.base)) {
        const isLastClusterOfAyah = wIdx === words.length - 1 && i === clusters.length - 1;
        if (hasAny(cur.marks, SUKOON_MARKS) || (isLastClusterOfAyah && !cur.marks.includes(SHADDA))) {
          assignedRules[i] = 'qalqalah';
          continue;
        }
      }

      // 5. Tafkheem & Tarqeeq
      if (isAllahWord && cur.base === 'ل') {
        // Check preceding vowel (same word prefix or previous word last cluster)
        const prevMarkSource =
          i > 0
            ? clusters[i - 1].marks
            : prevClusters.length > 0
            ? prevClusters[prevClusters.length - 1].marks
            : '';
        if (prevMarkSource.includes(KASRA)) {
          assignedRules[i] = 'tarqeeq';
        } else {
          assignedRules[i] = 'tafkheem';
        }
        continue;
      }

      if (TAFKHEEM_LETTERS.has(cur.base)) {
        assignedRules[i] = 'tafkheem';
        continue;
      }

      if (cur.base === 'ر') {
        if (cur.marks.includes(KASRA)) {
          assignedRules[i] = 'tarqeeq';
        } else if (cur.marks.includes(FATHA) || cur.marks.includes(DAMMA)) {
          assignedRules[i] = 'tafkheem';
        } else if (prev && prev.marks.includes(KASRA)) {
          assignedRules[i] = 'tarqeeq';
        } else if (prev && (prev.marks.includes(FATHA) || prev.marks.includes(DAMMA))) {
          assignedRules[i] = 'tafkheem';
        }
      }
    }

    // Group adjacent clusters with the exact same rule into spans inside the word
    const spans: TajweedCharSpan[] = [];
    for (let i = 0; i < clusters.length; i++) {
      const rule = assignedRules[i];
      const text = clusters[i].full;
      if (spans.length > 0 && spans[spans.length - 1].rule === rule) {
        spans[spans.length - 1].text += text;
      } else {
        spans.push({ text, rule, word });
      }
    }
    return spans;
  });
}
