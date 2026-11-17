export type FeeStatus = 'paid' | 'unpaid'; // دفع | لم يدفع بعد

export type StudentLevel = 'excellent' | 'medium' | 'weak'; // ممتاز | متوسط | ضعيف

export type AttendanceStatus = 'present' | 'absent'; // حضر | غاب

export type AppRole = 'admin' | 'teacher' | 'parent' | 'student';

export type TeacherGender = 'ذكر' | 'أنثى';

export type TeacherStatus = 'pending' | 'active' | 'rejected';

export interface TeacherCertificate {
  id?: string;
  name: string;
  imageUrl: string;
}

export interface FollowUpReport {
  id: string;
  date: string;
  newMemorization: string; // حفظ جديد
  nearRevision: string;    // ماضي قريب
  farRevision: string;     // ماضي بعيد
  surahFrom?: string;      // السور من
  surahTo?: string;        // إلى
  reportNotes?: string;    // الملاحظات
  assistantName?: string;  // اسم المساعد
  halaqaName?: string;     // الحلقة
  teacherName?: string;    // المعلم
  teacherPhone?: string;   // رقم المعلم
  level: StudentLevel;     // مستوى الطالب
  teacherNote: string;     // تعليق إضافي / توجيه المعلم
  createdAt: number;
}

export interface CertificateRecord {
  id: string;
  studentId: string;
  studentName: string;
  juzName: string;          // اسم الجزء أو الإنجاز (مثال: جزء عم / تكريم 10 نجوم)
  completionDate: string;   // تاريخ الإتمام
  type: 'juz' | 'stars';
  createdAt: number;
}

export type EducationSystem = 'general' | 'azhar'; // مصري عام | أزهري

export type TeacherSystemChoice = 'general' | 'azhar' | 'both'; // مصري عام | أزهري | الاثنين مع بعض

export type EducationStage = 'ابتدائي' | 'إعدادي' | 'ثانوي';

export type SecondaryTrack = 'علمي علوم' | 'علمي رياضة' | 'أدبي';

export type StudyScope = 'single' | 'all'; // مادة واحدة فقط | كل المواد

export type TeacherStudyMode = 'single' | 'multiple'; // مادة واحدة فقط | مواد متعددة

export interface Student {
  id: string;
  name: string;             // اسم الطالب
  age: number | string;     // السن
  stage?: string;           // المرحلة (ابتدائي / إعدادي / ثانوي / أخرى)
  educationSystem?: EducationSystem; // مصري عام | أزهري
  gradeLevel?: string;      // الصف الدراسي (الأول .. السادس / الثالث)
  track?: SecondaryTrack | ''; // الشعبة للثانوي (علمي علوم / علمي رياضة / أدبي)
  studyScope?: StudyScope;  // مادة واحدة فقط | كل المواد
  selectedSubjects?: string[]; // المادة أو المواد المسجل بها الطالب
  registeredBySelf?: boolean;
  ownerUid?: string;
  phone: string;            // رقم الهاتف / الواتساب
  course: string;           // الكورس
  feeStatus: FeeStatus;     // حالة الرسوم: لم يدفع بعد / دفع
  notes: string;            // ملاحظات
  parentName: string;       // اسم ولي الأمر
  parentPhone: string;      // رقم واتساب ولي الأمر
  assignedTeacherId?: string;
  halaqaId?: string;        // معرف الحلقة
  halaqaName?: string;      // اسم الحلقة
  registeredDate: string;
  reports?: FollowUpReport[]; // سجل تقارير المتابعة
  // الميزات الاحترافية:
  stars?: number;             // عدد النجوم الحالية (0 إلى 10)
  totalStarsEarned?: number;  // إجمالي النجوم المكتسبة
  starCyclesCompleted?: number; // عدد مرات إتمام 10 نجوم
  completedJuz?: number;      // عدد الأجزاء المحفوظة (0 إلى 30)
  currentSurah?: string;      // السورة الحالية
  subscriptionAmount?: number; // قيمة الاشتراك الشهري
  nextPaymentDate?: string;   // ميعاد تجديد الاشتراك القادم (YYYY-MM-DD)
  lastPaymentDate?: string;   // تاريخ آخر دفع
  certificates?: CertificateRecord[]; // الشهادات الصادرة للطالب
}

export interface Teacher {
  id: string;
  name: string;             // الاسم
  phone: string;            // الهاتف / الواتساب
  normalizedPhone?: string; // الرقم الموحد (01... 11 رقم)
  password?: string;        // كلمة المرور (اختيارية للتوافق السابق)
  passwordHash?: string;    // هاش كلمة المرور للتحقق الآمن
  role?: 'teacher';         // الدور في Firestore
  status?: TeacherStatus;   // pending | active | rejected
  registeredBySelf?: boolean; // هل سجل بنفسه من شاشة التسجيل
  ownerUid?: string;
  avatarUrl?: string;       // صورة المعلم الشخصية (اختياري)
  specialization: string;   // المادة / التخصص (شرعية / عربية / انجليزية / ...)
  birthDate?: string;       // تاريخ الميلاد (YYYY-MM-DD)
  age?: number;             // السن
  gender?: TeacherGender;   // النوع (ذكر / أنثى)
  location?: string;        // المحافظة / البلد
  teachingSystems?: TeacherSystemChoice; // مصري عام | أزهري | الاثنين مع بعض
  teachingMode?: TeacherStudyMode;       // مادة واحدة فقط | مواد متعددة
  teachingStages?: EducationStage[];     // المراحل التي يدرسها
  teachingGrades?: string[];             // الصفوف التي يدرسها
  teachingTrack?: SecondaryTrack | '';   // الشعبة إن وجدت
  subjects?: string[];      // المواد التي يدرسها
  dailyHours?: number;      // عدد الساعات المتاحة في اليوم
  availablePeriod?: 'صباحي' | 'مسائي' | 'الاتنين'; // المواعيد المتاحة
  experienceYears?: number; // سنوات الخبرة
  certificates?: TeacherCertificate[]; // الشهادات والإجازات المرفقة مع صورها
  notes?: string;
  sessionRate?: number;     // سعر الحصة لحساب المرتب تلقائياً
  createdAt: number;
}

export type DayOfWeek = 'السبت' | 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | 'الجمعة';

export interface HalaqaGroup {
  id: string;
  name: string;             // اسم الحلقة (مثال: حلقة النور)
  teacherId: string;        // معرف المعلم
  teacherName: string;      // اسم المعلم
  subject: string;          // المادة (قرآن كريم / لغة عربية / ...)
  scheduleTime: string;     // المواعيد (مثال: السبت والثلاثاء 5:00 مساءً)
  day?: DayOfWeek;
  zoomUrl?: string;         // رابط زوم
  notes?: string;
  createdAt: number;
}

export interface ScheduleAppointment {
  id: string;
  studentId: string;
  studentName: string;      // الطالب
  teacherId: string;
  teacherName: string;      // المعلم
  day: DayOfWeek;           // اليوم
  time: string;             // الوقت
  courseType?: string;      // نوع الحلقة (حفظ فردي / جماعي / تجويد)
  sessionUrl?: string;      // رابط الزووم / التيمز (اختياري)
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  scheduleId?: string;
  halaqaId?: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  date: string;             // YYYY-MM-DD
  status: AttendanceStatus; // حضر | غاب
  createdAt: number;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  date: string;             // YYYY-MM-DD
  monthKey: string;         // YYYY-MM
  notes?: string;
  createdAt: number;
}

export interface ExamGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  gradeLabel: string;
  notes?: string;
  gradedAt: number;
}

export interface Exam {
  id: string;
  ownerUid?: string;
  title: string;
  subject: string;
  examDate: string;
  maxScore: number;
  teacherId: string;
  teacherName: string;
  halaqaId?: string;
  halaqaName?: string;
  description?: string;
  grades: ExamGradeRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface StudentExamResult {
  examId: string;
  examTitle: string;
  subject: string;
  examDate: string;
  teacherName: string;
  maxScore: number;
  score: number;
  gradeLabel: string;
  notes?: string;
  gradedAt: number;
}

export interface HomeworkAssignment {
  id: string;
  ownerUid?: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  educationSystem?: EducationSystem | 'both';
  stage?: string;
  gradeLevel?: string;
  title: string;
  description?: string;
  dueDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeacherRating {
  id: string;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  rating: number;           // 1 to 5
  comment?: string;
  date: string;
  createdAt: number;
}

export interface AcademySettings {
  academyName: string;      // اسم الأكاديمية
  logoDataUrl: string;      // شعار الأكاديمية (Base64 أو رابط)
  loginBannerUrl?: string;  // صورة صفحة الدخول
  managerWhatsApp: string;  // رقم واتساب مدير الأكاديمية
  managerPin?: string;      // الرقم السري الخاص بمدير الأكاديمية
  managerPinConfigured?: boolean; // هل قام المدير بإنشاء رقم سري لأول مرة؟
  slogan?: string;
  previewDescription?: string; // وصف معاينة الرابط في واتساب وفيسبوك
  previewUpdatedAt?: number;   // توقيت آخر تحديث لبيانات المعاينة (لكسر الكاش)
  email?: string;
  address?: string;
  currency?: string;        // العملة الافتراضية (ج.م / ر.س)
  defaultSessionRate?: number; // سعر الحصة الافتراضي للمعلم
  defaultSubscriptionAmount?: number; // قيمة الاشتراك الافتراضي للطالب
}

export type TrialLessonStatus = 'new' | 'contacted' | 'scheduled' | 'enrolled' | 'cancelled';

export interface TrialLesson {
  id: string;
  studentName: string;      // اسم الطالب
  parentPhone: string;      // رقم تليفون / واتساب ولي الأمر
  stageOrAge: string;       // المرحلة الدراسية أو السن
  notes?: string;           // ملاحظات أو رغبات
  preferredTime?: string;   // الوقت أو اليوم المفضل
  status: TrialLessonStatus; // حالة المتابعة
  createdAt: number;        // تاريخ ووقت الطلب
}

export interface LinkedGoogleAccount {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  linkedAt: number;
}

export interface AppLocalAccount {
  fullName: string;
  phone: string;
  normalizedPhone: string;
  passwordHash: string;
  password?: string;
  role?: AppRole;
  createdAt: number;
  updatedAt: number;
}

export type TrashEntityType = 'student' | 'teacher' | 'schedule' | 'halaqa' | 'trialLesson';

export interface TrashItem {
  id: string;
  entityId: string;
  entityType: TrashEntityType;
  title: string;
  subtitle?: string;
  data: Student | Teacher | ScheduleAppointment | HalaqaGroup | TrialLesson;
  deletedAt: number;
  purgeAt: number; // deletedAt + 30 days in ms
}

export interface ParentRecord {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  password?: string;
  passwordHash?: string;
  role?: 'parent';
  studentIds: string[];
  studentNames: string[];
  updatedAt: number;
}

export interface FirebaseConnectionStats {
  configured: boolean;
  hasCustomApiKey: boolean;
  connected: boolean;
  projectId: string;
  studentsCount: number;
  teachersCount: number;
  parentsCount: number;
  certificatesCount: number;
  pendingSyncCount: number;
  lastCheckedAt: number | null;
  reason?: string;
}
