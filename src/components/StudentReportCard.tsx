import React from 'react';

export interface StudentReportCardData {
  studentName: string;
  parentName: string;
  courseName: string;
  teacherName: string;
  halaqaName: string;
  statusLabel: string;
  levelLabel: string;
  completedJuz: number;
  currentSurah: string;
  stars: number;
  reportDate: string;
  newMemorization: string;
  nearRevision: string;
  farRevision: string;
  reportNotes: string;
  teacherNote: string;
  completionDate: string;
  logoUrl?: string;
}

interface StudentReportCardProps {
  reportRef: React.RefObject<HTMLDivElement | null>;
  data: StudentReportCardData;
}

export const StudentReportCard: React.FC<StudentReportCardProps> = ({ reportRef, data }) => {
  const fontCairo = "'Cairo', sans-serif";
  const fontAmiri = "'Amiri', 'Cairo', serif";

  const mainStudentRows = [
    { label: 'اسم الطالب', value: data.studentName || '—', dir: 'rtl' as const, highlight: true },
    { label: 'ولي الأمر', value: data.parentName || '—', dir: 'rtl' as const },
    { label: 'الكورس', value: data.courseName || data.halaqaName || '—', dir: 'rtl' as const },
    {
      label: 'التقدم بالقرآن',
      value: `أتم ${data.completedJuz} / 30 جزء • السورة الحالية: ${data.currentSurah || 'الفاتحة'}`,
      dir: 'rtl' as const,
    },
    { label: 'الحالة', value: `${data.statusLabel} • المستوى: ${data.levelLabel}`, dir: 'rtl' as const },
    { label: 'رصيد النجوم', value: `${data.stars} / 10 ⭐`, dir: 'rtl' as const },
  ];

  return (
    <div
      ref={reportRef}
      id="report-card"
      dir="rtl"
      style={{
        direction: 'rtl',
        fontFamily: fontCairo,
        backgroundColor: '#FFF8E7',
        border: '5px solid #D4AF37',
        borderRadius: '20px',
        padding: '7px',
        color: '#1e293b',
        boxSizing: 'border-box',
        width: '100%',
        textAlign: 'center',
        lineHeight: 1.65,
        overflow: 'visible',
      }}
    >
      {/* Inner Gold Border to form Double Gold Frame */}
      <div
        style={{
          border: '2.5px solid #C9A227',
          borderRadius: '14px',
          padding: '24px 20px',
          backgroundColor: '#FFF8E7',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        {/* Top: Academy Logo -> Bismillah -> Academy Name in Brown */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          {data.logoUrl && data.logoUrl.trim() !== '' ? (
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                border: '3px solid #D4AF37',
                backgroundColor: '#0B3D2E',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <img
                src={data.logoUrl}
                alt="شعار أكاديمية الفرقان"
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: '78px',
                height: '78px',
                borderRadius: '50%',
                border: '3px solid #D4AF37',
                backgroundColor: '#0B3D2E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <div
                style={{
                  width: '66px',
                  height: '66px',
                  borderRadius: '50%',
                  border: '1px dashed #F3E5AB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: fontAmiri,
                    fontSize: '30px',
                    fontWeight: 800,
                    color: '#F3E5AB',
                    lineHeight: 1,
                  }}
                >
                  ★
                </span>
              </div>
            </div>
          )}

          <p
            style={{
              margin: '0 0 6px 0',
              fontSize: '18px',
              fontWeight: 700,
              color: '#0B3D2E',
              fontFamily: fontAmiri,
            }}
          >
            بسم الله الرحمن الرحيم
          </p>

          <h4
            style={{
              margin: '0 0 14px 0',
              fontSize: '18px',
              fontWeight: 800,
              color: '#78350F',
              fontFamily: fontCairo,
            }}
          >
            أكاديمية الفرقان العالمية لتحفيظ القرآن الكريم
          </h4>

          {/* Dark Green Box (#0B3D2E) with Gold Text */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#0B3D2E',
              border: '2px solid #D4AF37',
              borderRadius: '14px',
              padding: '12px 16px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <span
              style={{
                color: '#F3E5AB',
                fontSize: '18px',
                fontWeight: 800,
                fontFamily: fontCairo,
                display: 'block',
              }}
            >
              تقرير متابعة حفظ وتلاوة القرآن الكريم
            </span>
          </div>
        </div>

        {/* Centered Student Data in Clear Large Arabic Font */}
        <div
          style={{
            backgroundColor: '#FFFDF6',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '16px',
            padding: '16px 14px',
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {mainStudentRows.map((item) => (
              <div
                key={item.label}
                style={{
                  width: '100%',
                  paddingBottom: '8px',
                  borderBottom: '1px dashed rgba(201, 162, 39, 0.35)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#78350F',
                    fontFamily: fontCairo,
                    marginBottom: '2px',
                  }}
                >
                  {item.label}
                </div>
                <div
                  dir={item.dir}
                  style={{
                    fontSize: item.highlight ? '22px' : '16px',
                    fontWeight: 800,
                    color: item.highlight ? '#0B3D2E' : '#1e293b',
                    fontFamily: item.highlight ? fontAmiri : fontCairo,
                    wordBreak: 'break-word',
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}

            {/* Daily Memorization Details Summary Centered */}
            <div
              style={{
                width: '100%',
                paddingTop: '4px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '1px solid rgba(201, 162, 39, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78350F' }}>الحفظ الجديد</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0B3D2E' }}>
                  {data.newMemorization || '—'}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '1px solid rgba(201, 162, 39, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78350F' }}>الماضي القريب</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0B3D2E' }}>
                  {data.nearRevision || '—'}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '1px solid rgba(201, 162, 39, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78350F' }}>الماضي البعيد</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0B3D2E' }}>
                  {data.farRevision || '—'}
                </div>
              </div>
              <div
                style={{
                  backgroundColor: '#FFF8E7',
                  border: '1px solid rgba(201, 162, 39, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78350F' }}>المعلم / الحلقة</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0B3D2E' }}>
                  {data.teacherName || 'إدارة التحفيظ'}
                  {data.halaqaName ? ` — ${data.halaqaName}` : ''}
                </div>
              </div>
            </div>

            {(data.reportNotes || data.teacherNote) && (
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#FFF8E7',
                  border: '1px solid rgba(201, 162, 39, 0.35)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78350F' }}>
                  ملاحظات وتوجيه المعلم
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  {data.teacherNote || data.reportNotes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Light Gold Box: وسام التميز والتفوق (إتمام 10 نجوم) */}
        <div
          style={{
            backgroundColor: '#FFF3CC',
            border: '2px solid #D4AF37',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '14px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '17px',
              fontWeight: 800,
              color: '#78350F',
              fontFamily: fontCairo,
            }}
          >
            🏅 وسام التميز والتفوق (إتمام 10 نجوم)
          </span>
        </div>

        {/* Hadith */}
        <div
          style={{
            textAlign: 'center',
            padding: '10px 12px',
            marginBottom: '14px',
            borderTop: '1.5px solid rgba(212, 175, 55, 0.45)',
            borderBottom: '1.5px solid rgba(212, 175, 55, 0.45)',
            backgroundColor: 'rgba(11, 61, 46, 0.04)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#0B3D2E',
              fontFamily: fontAmiri,
            }}
          >
            قال رسول الله ﷺ «خيركم من تعلم القرآن وعلمه»
          </p>
        </div>

        {/* Completion Date */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: '#0B3D2E',
              fontFamily: fontCairo,
            }}
          >
            تاريخ الإتمام:{' '}
            <span dir="ltr" style={{ display: 'inline-block' }}>
              {data.completionDate || data.reportDate}
            </span>
          </span>
        </div>

        {/* Footer: Seal & Logo of Academy + Academy Management Approval */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1.5px solid rgba(212, 175, 55, 0.45)',
          }}
        >
          {/* Official Seal & Academy Title */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'right',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                border: '2.5px solid #D4AF37',
                backgroundColor: '#0B3D2E',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#F3E5AB',
                  fontFamily: fontAmiri,
                  lineHeight: 1.1,
                }}
              >
                ★
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#ffffff',
                  fontFamily: fontCairo,
                }}
              >
                ختم معتمد
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#0B3D2E',
                  fontFamily: fontCairo,
                }}
              >
                ختم وشعار
              </div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#78350F',
                  fontFamily: fontCairo,
                }}
              >
                أكاديمية الفرقان العالمية لتحفيظ القرآن الكريم
              </div>
            </div>
          </div>

          {/* Management Approval */}
          <div style={{ textAlign: 'left', marginInlineStart: 'auto' }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#0B3D2E',
                fontFamily: fontCairo,
              }}
            >
              اعتماد إدارة الأكاديمية
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#78350F',
                fontFamily: fontAmiri,
              }}
            >
              أكاديمية الفرقان العالمية
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
