import React, { useState } from 'react';
import { X, Sparkles, User, Phone, BookOpen, Clock, CheckCircle2, MessageSquare, Send } from 'lucide-react';
import { cleanWhatsAppNumber } from '../utils/storage';

interface TrialLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentName: string;
    parentPhone: string;
    stageOrAge: string;
    notes?: string;
    preferredTime?: string;
  }) => Promise<void> | void;
  managerWhatsApp?: string;
}

export const TrialLessonModal: React.FC<TrialLessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  managerWhatsApp = '',
}) => {
  const [studentName, setStudentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [stageOrAge, setStageOrAge] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentPhone.trim() || !stageOrAge.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة (اسم الطالب، رقم تليفون ولي الأمر، والمرحلة / السن)');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        studentName: studentName.trim(),
        parentPhone: parentPhone.trim(),
        stageOrAge: stageOrAge.trim(),
        notes: notes.trim(),
        preferredTime: preferredTime.trim(),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting trial lesson request:', err);
      alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setStudentName('');
    setParentPhone('');
    setStageOrAge('');
    setNotes('');
    setPreferredTime('');
    onClose();
  };

  const whatsappMessage = encodeURIComponent(
    `السلام عليكم ورحمة الله وبركاته،\nأرغب في تأكيد طلب الحصة التجريبية المجانية في أكاديمية الفرقان الدولية:\n- اسم الطالب: ${studentName}\n- المرحلة / السن: ${stageOrAge}\n- رقم ولي الأمر: ${parentPhone}${preferredTime ? `\n- الموعد المفضل: ${preferredTime}` : ''}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0B3D2E] border-2 border-[#D4AF37]/50 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#145A43] via-[#0B3D2E] to-[#145A43] p-5 sm:p-6 border-b border-[#D4AF37]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37] text-[#07241B] flex items-center justify-center font-bold shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-amiri text-white flex items-center gap-2">
                حصة تجريبية مجانية
                <span className="text-[11px] font-sans font-extrabold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#07241B]">
                  مجاناً 100%
                </span>
              </h3>
              <p className="text-xs text-[#F3E5AB]">
                سجل بياناتك وسيتم التنسيق معك فوراً لتحديد موعد الحلقة القرآنية
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {isSubmitted ? (
            /* Success Feedback View */
            <div className="py-6 text-center space-y-5 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-bold font-amiri text-white">
                  تم تسجيل طلب الحصة التجريبية بنجاح! 🎉
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                  تم حفظ طلب الطالب <strong className="text-[#F3E5AB]">({studentName})</strong> في قاعدة البيانات السحابية، وسيظهر لدى إدارة الأكاديمية للتواصل معك وتحديد موعد الحلقة التجريبية.
                </p>
              </div>

              {managerWhatsApp && (
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber(managerWhatsApp)}?text=${whatsappMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] font-extrabold text-sm shadow-[0_4px_15px_rgba(37,211,102,0.35)] transition cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>مراسلة إدارة الأكاديمية على واتساب مباشرة الآن</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                  اسم الطالب الكامل <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: عبد الله أحمد المنصوري"
                    className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                  <User className="w-4 h-4 text-[#D4AF37]/70 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Parent Phone */}
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                  رقم تليفون / واتساب ولي الأمر <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="مثال: +966501234567 أو 01012345678"
                    dir="ltr"
                    className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-sm text-right"
                  />
                  <Phone className="w-4 h-4 text-[#25D366] absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  سنتواصل معك عبر هذا الرقم لتأكيد موعد الحصة وإرسال رابط الغرفة.
                </p>
              </div>

              {/* Stage or Age */}
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                  المرحلة الدراسية أو السن <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={stageOrAge}
                    onChange={(e) => setStageOrAge(e.target.value)}
                    placeholder="مثال: 9 سنوات (ابتدائي) أو القاعدة النورانية أو حفظ متقدم"
                    className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                  <BookOpen className="w-4 h-4 text-[#D4AF37]/70 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Quick Age Selectors */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['أطفال (4-6 سنوات)', 'ابتدائي (7-12 سنة)', 'ناشئة (13-17 سنة)', 'كبار / جامعي', 'تجويد وقراءات'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStageOrAge(option)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[#145A43]/50 hover:bg-[#145A43] text-slate-300 hover:text-white border border-[#D4AF37]/20 transition cursor-pointer"
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Preferred Time / Days (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                  الوقت أو اليوم المفضل للحصة (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    placeholder="مثال: مساءً بعد العصر، أو يوم السبت والأحد"
                    className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                  <Clock className="w-4 h-4 text-[#D4AF37]/70 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-[#F3E5AB] mb-1.5">
                  ملاحظات أو مستوى الحفظ الحالي (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يحفظ جزء عم، يحتاج تركيز على أحكام التجويد، إلخ..."
                  className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-sm resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="gold-gradient-btn flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold shadow-[0_4px_15px_rgba(212,175,55,0.35)] cursor-pointer transition active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#07241B]" />
                  <span>{isSubmitting ? 'جاري الحفظ بالسحابة...' : 'تأكيد طلب الحصة التجريبية'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
