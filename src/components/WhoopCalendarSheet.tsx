import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { storageService } from '../services/StorageService';
import { localDateKey } from '../utils/dateKey';
import { useLanguage } from '../i18n/LanguageContext';

interface WhoopCalendarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

export const WhoopCalendarSheet: React.FC<WhoopCalendarSheetProps> = ({
  isOpen,
  onClose,
  selectedDateStr,
  onSelectDate,
}) => {
  const { t, isRtl } = useLanguage();
  const todayKey = localDateKey();

  // Selected view month & year state
  const initialDate = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return new Date();
  }, [selectedDateStr]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const currentMonthName = isRtl ? monthNamesAr[viewMonth] : monthNames[viewMonth];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    // Prevent navigating into future months
    if (viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth >= today.getMonth())) {
      return;
    }
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build grid of days for the selected month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days = [];

    // Preceding empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    // Days in current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${viewYear}-${monthStr}-${dayStr}`;

      const isFuture = dateKey > todayKey;
      const isToday = dateKey === todayKey;
      const isSelected = dateKey === selectedDateStr;

      // Check stored cycle data for this day
      const stored = storageService.getRealDayState(dateKey);
      let recoveryScore: number | null = null;
      let recoveryCategory: 'green' | 'yellow' | 'red' | null = null;
      let dayStrain = 0;

      if (stored) {
        if (typeof stored.recoveryScore === 'number' && stored.recoveryScore > 0) {
          recoveryScore = stored.recoveryScore;
          const cat = stored.recoveryCategory;
          recoveryCategory = (cat === 'green' || cat === 'yellow' || cat === 'red')
            ? cat
            : (recoveryScore >= 67 ? 'green' : recoveryScore <= 33 ? 'red' : 'yellow');
        }
        if (typeof stored.dayStrain === 'number') {
          dayStrain = stored.dayStrain;
        }
      }

      days.push({
        dayNumber: d,
        dateKey,
        isFuture,
        isToday,
        isSelected,
        hasData: Boolean(stored && (recoveryScore !== null || dayStrain > 0)),
        recoveryScore,
        recoveryCategory,
        dayStrain,
      });
    }

    return days;
  }, [viewYear, viewMonth, todayKey, selectedDateStr]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    let recordedDays = 0;
    let sumRecovery = 0;
    let recoveryCount = 0;
    let sumStrain = 0;

    calendarDays.forEach((day) => {
      if (!day) return;
      if (day.hasData) {
        recordedDays++;
        if (day.recoveryScore !== null) {
          sumRecovery += day.recoveryScore;
          recoveryCount++;
        }
        sumStrain += day.dayStrain;
      }
    });

    return {
      recordedDays,
      avgRecovery: recoveryCount > 0 ? Math.round(sumRecovery / recoveryCount) : null,
      avgStrain: recordedDays > 0 ? Number((sumStrain / recordedDays).toFixed(1)) : null,
    };
  }, [calendarDays]);

  const isCurrentMonthOrFuture = useMemo(() => {
    const today = new Date();
    return viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth >= today.getMonth());
  }, [viewYear, viewMonth]);

  const dayHeaders = isRtl
    ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose}>
        <div className="flex flex-col max-h-[85vh] text-white">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1C212B] border border-white/10 flex items-center justify-center text-[#00A3FF]">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase font-condensed tracking-wider">
                  {isRtl ? 'سجل الدورات الفسيولوجية' : 'PHYSIOLOGICAL CYCLES ARCHIVE'}
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {isRtl ? 'اختر أي يوم لمراجعة كافة التحليلات والخرائط دون إنترنت' : 'Browse full historical charts & biometrics 100% offline'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#0E1116] border-b border-white/5">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg bg-[#181C24] hover:bg-[#202632] text-zinc-300 hover:text-white border border-white/5 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            <span className="text-xs font-black uppercase font-condensed tracking-widest text-zinc-100">
              {currentMonthName} {viewYear}
            </span>

            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonthOrFuture}
              className={`p-1 rounded-lg border border-white/5 transition-colors ${
                isCurrentMonthOrFuture
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border-transparent'
                  : 'bg-[#181C24] hover:bg-[#202632] text-zinc-300 hover:text-white'
              }`}
              title="Next Month"
            >
              <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 overflow-y-auto">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {dayHeaders.map((d, idx) => (
                <div key={idx} className="text-[10px] font-bold font-condensed text-zinc-500 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {calendarDays.map((item, idx) => {
                if (!item) {
                  return <div key={`empty-${idx}`} className="h-13" />;
                }

                const { dayNumber, dateKey, isFuture, isToday, isSelected, hasData, recoveryScore, recoveryCategory, dayStrain } = item;

                let dotColor = '#3A404D';
                if (recoveryCategory === 'green') dotColor = '#16EC06';
                else if (recoveryCategory === 'yellow') dotColor = '#FFDE00';
                else if (recoveryCategory === 'red') dotColor = '#FF3344';

                return (
                  <button
                    key={dateKey}
                    disabled={isFuture}
                    onClick={() => {
                      onSelectDate(dateKey);
                      onClose();
                    }}
                    className={`h-13 rounded-xl p-1 flex flex-col items-center justify-between border transition-all relative ${
                      isFuture
                        ? 'opacity-25 cursor-not-allowed border-transparent bg-transparent'
                        : isSelected
                        ? 'bg-[#1E2532] border-white ring-2 ring-white/50 text-white shadow-lg'
                        : isToday
                        ? 'bg-[#161B23] border-[#00A3FF]/40 text-white hover:border-[#00A3FF]'
                        : hasData
                        ? 'bg-[#12151B] border-white/5 hover:border-white/20 text-zinc-200'
                        : 'bg-[#0E1116] border-transparent hover:border-white/10 text-zinc-500'
                    }`}
                  >
                    {/* Day number & Today badge */}
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className={`text-[11px] font-condensed font-bold tabular-nums ${isSelected ? 'text-white font-black' : isToday ? 'text-[#00A3FF]' : ''}`}>
                        {dayNumber}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A3FF]" />
                      )}
                    </div>

                    {/* Physiological metrics indicators */}
                    <div className="flex items-center justify-center gap-1 my-0.5">
                      {hasData && recoveryCategory ? (
                        <span
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: dotColor }}
                          title={`Recovery: ${recoveryScore}%`}
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                      )}
                    </div>

                    {/* Day Strain text */}
                    <span className="text-[9px] font-condensed tabular-nums font-black text-[#00A3FF] leading-none">
                      {hasData && dayStrain > 0 ? dayStrain.toFixed(1) : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-white/5 text-[10px] font-condensed text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16EC06]" />
                <span>{isRtl ? 'تعافي أخضر (≥67%)' : 'Green (≥67%)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FFDE00]" />
                <span>{isRtl ? 'أصفر (34-66%)' : 'Yellow (34-66%)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF3344]" />
                <span>{isRtl ? 'أحمر (≤33%)' : 'Red (≤33%)'}</span>
              </div>
            </div>

            {/* Monthly stats card */}
            <div className="mt-3 p-3 rounded-xl bg-[#13161C] border border-white/5 flex items-center justify-around text-center">
              <div>
                <span className="block text-[10px] text-zinc-500 font-condensed uppercase">{isRtl ? 'دورات مسجلة' : 'Tracked Cycles'}</span>
                <span className="text-sm font-black font-condensed text-white tabular-nums">{monthlyStats.recordedDays}</span>
              </div>
              <div className="w-[1px] h-6 bg-white/5" />
              <div>
                <span className="block text-[10px] text-zinc-500 font-condensed uppercase">{isRtl ? 'متوسط التعافي' : 'Avg Recovery'}</span>
                <span className="text-sm font-black font-condensed text-[#16EC06] tabular-nums">
                  {monthlyStats.avgRecovery !== null ? `${monthlyStats.avgRecovery}%` : '--'}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-white/5" />
              <div>
                <span className="block text-[10px] text-zinc-500 font-condensed uppercase">{isRtl ? 'متوسط الجهد' : 'Avg Strain'}</span>
                <span className="text-sm font-black font-condensed text-[#00A3FF] tabular-nums">
                  {monthlyStats.avgStrain !== null ? monthlyStats.avgStrain.toFixed(1) : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="p-4 bg-[#0B0D10] border-t border-white/10 flex items-center gap-2">
            <button
              onClick={() => {
                onSelectDate(todayKey);
                onClose();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#1C212B] hover:bg-[#242A36] text-white font-condensed font-black text-xs uppercase tracking-wider border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00A3FF]" />
              <span>{isRtl ? 'العودة إلى دورة اليوم' : 'JUMP TO TODAY’S CYCLE'}</span>
            </button>
          </div>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
