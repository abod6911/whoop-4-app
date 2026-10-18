import { localDateKey } from '../utils/dateKey';
import { storageService } from './StorageService';

export interface StreakMilestone {
  id: string;
  days: number;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  unlocked: boolean;
  progress: number;
  daysRemaining: number;
}

export interface DayStreakItem {
  date: string;
  dayNum: number;
  dayLabel: string;
  dayLabelAr: string;
  status: 'active' | 'missed' | 'today';
  isToday: boolean;
  strain?: number;
  recovery?: number;
}

export interface StreakSummary {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  consistencyRate: number;
  streakStartDate: string;
  nextMilestone: StreakMilestone | null;
  milestones: StreakMilestone[];
  last30Days: DayStreakItem[];
}

const STORAGE_ACTIVE_DAYS_KEY = 'whoop_streak_active_dates';
const STORAGE_LONGEST_STREAK_KEY = 'whoop_streak_longest_record';

const MILESTONE_DEFINITIONS: Omit<StreakMilestone, 'unlocked' | 'progress' | 'daysRemaining'>[] = [
  {
    id: 'cycle-7',
    days: 7,
    title: '7 Cycles Tracked',
    titleAr: '7 دورات متتالية',
    desc: 'Full weekly circadian and baseline cycle recorded.',
    descAr: 'اكتمال رصد دورة النوم والتعافي الأسبوعية.',
    tier: 'silver',
  },
  {
    id: 'cycle-14',
    days: 14,
    title: '14 Cycles Tracked',
    titleAr: '14 دورة متتالية',
    desc: 'Physiological HRV & RHR baseline stabilized.',
    descAr: 'تثبيت خط الأساس الفسيولوجي لمعدل النبض والـ HRV.',
    tier: 'silver',
  },
  {
    id: 'cycle-30',
    days: 30,
    title: '30 Cycles Tracked',
    titleAr: '30 دورة متتالية',
    desc: 'Complete monthly strain & recovery profile.',
    descAr: 'ملف فسيولوجي شهري متكامل للجهد والتعافي.',
    tier: 'gold',
  },
  {
    id: 'cycle-60',
    days: 60,
    title: '60 Cycles Tracked',
    titleAr: '60 دورة متتالية',
    desc: 'Long-term cardiovascular adaptation tracking.',
    descAr: 'رصد تكيفات الجهاز القلبي والتدريب طويل المدى.',
    tier: 'platinum',
  },
  {
    id: 'cycle-100',
    days: 100,
    title: '100 Cycles Tracked',
    titleAr: '100 دورة متتالية',
    desc: 'Elite consistency tier in physiological monitoring.',
    descAr: 'فئة النخبة في استمرارية الرصد الفسيولوجي.',
    tier: 'diamond',
  },
  {
    id: 'cycle-365',
    days: 365,
    title: '365 Cycles Tracked',
    titleAr: '365 دورة متتالية',
    desc: 'Annual longitudinal human performance dataset.',
    descAr: 'اكتمال عام كامل من البيانات الفسيولوجية المرجعية.',
    tier: 'diamond',
  },
];

class StreakEngine {
  private listeners: Set<(summary: StreakSummary) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.recordDayActivity(localDateKey());
    }
  }

  public subscribe(cb: (summary: StreakSummary) => void): () => void {
    this.listeners.add(cb);
    cb(this.getStreakSummary());
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    const summary = this.getStreakSummary();
    this.listeners.forEach((cb) => {
      try {
        cb(summary);
      } catch (err) {
        console.warn('Streak listener error:', err);
      }
    });
  }

  public getRecordedDates(): Set<string> {
    const dates = new Set<string>();

    if (typeof localStorage === 'undefined') return dates;

    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_DAYS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => dates.add(d));
        }
      }
    } catch {}

    try {
      const history = storageService.getDaysHistory(60);
      history.forEach((rec) => {
        if (rec.dayStrain > 0 || rec.recoveryScore !== null || rec.hoursAsleep) {
          dates.add(rec.date);
        }
      });
    } catch {}

    return dates;
  }

  public recordDayActivity(dateStr: string = localDateKey()): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const current = this.getRecordedDates();
      if (!current.has(dateStr)) {
        current.add(dateStr);
        const arr = Array.from(current).sort();
        localStorage.setItem(STORAGE_ACTIVE_DAYS_KEY, JSON.stringify(arr));
        this.recalculateLongestStreak(current);
        this.notify();
      }
    } catch {}
  }

  private recalculateLongestStreak(dates: Set<string>): number {
    const sorted = Array.from(dates).sort();
    let max = 0;
    let current = 0;
    let prevTime = 0;

    for (const d of sorted) {
      const t = new Date(d + 'T12:00:00').getTime();
      if (prevTime === 0) {
        current = 1;
      } else {
        const diffDays = Math.round((t - prevTime) / 86400000);
        if (diffDays === 1) {
          current++;
        } else if (diffDays > 1) {
          current = 1;
        }
      }
      if (current > max) max = current;
      prevTime = t;
    }

    try {
      const saved = parseInt(localStorage.getItem(STORAGE_LONGEST_STREAK_KEY) || '0', 10);
      if (max > saved) {
        localStorage.setItem(STORAGE_LONGEST_STREAK_KEY, String(max));
      } else {
        max = saved;
      }
    } catch {}

    return max;
  }

  public getStreakSummary(): StreakSummary {
    const dates = this.getRecordedDates();
    const todayStr = localDateKey();
    const now = new Date();

    let currentStreak = 0;
    let checkDate = new Date();
    let streakStartDateStr = todayStr;

    const isTodayActive = dates.has(todayStr);
    if (!isTodayActive) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const k = localDateKey(checkDate);
      if (dates.has(k)) {
        currentStreak++;
        streakStartDateStr = k;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (dates.size === 0) {
      currentStreak = 0;
      streakStartDateStr = todayStr;
    }

    let longestStreak = 0;
    try {
      const savedLongest = parseInt(localStorage.getItem(STORAGE_LONGEST_STREAK_KEY) || '0', 10);
      longestStreak = dates.size > 0 ? Math.max(savedLongest, currentStreak) : 0;
      if (currentStreak > savedLongest && currentStreak > 0) {
        localStorage.setItem(STORAGE_LONGEST_STREAK_KEY, String(currentStreak));
      }
    } catch {
      longestStreak = currentStreak;
    }

    const totalDays = dates.size;

    const last30Days: DayStreakItem[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

    let activeInLast30 = 0;

    for (let i = 29; i >= 0; i--) {
      const target = new Date();
      target.setDate(now.getDate() - i);
      const targetKey = localDateKey(target);
      const isToday = targetKey === todayStr;
      const isActive = dates.has(targetKey);

      if (isActive) activeInLast30++;

      const stored = storageService.getRealDayState(targetKey);

      last30Days.push({
        date: targetKey,
        dayNum: target.getDate(),
        dayLabel: dayNames[target.getDay()],
        dayLabelAr: dayNamesAr[target.getDay()],
        status: isToday ? (isActive ? 'active' : 'today') : isActive ? 'active' : 'missed',
        isToday,
        strain: stored?.dayStrain,
        recovery: stored?.recoveryScore ?? undefined,
      });
    }

    const consistencyRate = Math.round((activeInLast30 / 30) * 100);

    let nextMilestone: StreakMilestone | null = null;

    const milestones: StreakMilestone[] = MILESTONE_DEFINITIONS.map((m) => {
      const unlocked = currentStreak >= m.days;
      const progress = Math.min(1.0, Math.max(0.0, currentStreak / m.days));
      const daysRemaining = Math.max(0, m.days - currentStreak);

      const computed: StreakMilestone = {
        ...m,
        unlocked,
        progress,
        daysRemaining,
      };

      if (!unlocked && !nextMilestone) {
        nextMilestone = computed;
      }

      return computed;
    });

    return {
      currentStreak,
      longestStreak,
      totalDays,
      consistencyRate,
      streakStartDate: streakStartDateStr,
      nextMilestone,
      milestones,
      last30Days,
    };
  }
}

export const streakEngine = new StreakEngine();
