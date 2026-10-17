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
  progress: number; // 0.0 to 1.0
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
  nextMilestone: StreakMilestone | null;
  milestones: StreakMilestone[];
  last30Days: DayStreakItem[];
}

const STORAGE_ACTIVE_DAYS_KEY = 'whoop_streak_active_dates';
const STORAGE_LONGEST_STREAK_KEY = 'whoop_streak_longest_record';

const MILESTONE_DEFINITIONS: Omit<StreakMilestone, 'unlocked' | 'progress' | 'daysRemaining'>[] = [
  {
    id: 'day-1',
    days: 1,
    title: 'First Day on Wrist',
    titleAr: 'اليوم الأول: بداية المسيرة',
    desc: 'You started your biometric health journey with WHOOP.',
    descAr: 'خطوتك الأولى في رصد وتتبع مؤشراتك الفسيولوجية.',
    tier: 'bronze',
  },
  {
    id: 'day-3',
    days: 3,
    title: 'Calibration Phase',
    titleAr: 'مرحلة المعايرة الأولى',
    desc: 'Baseline calibration algorithms are actively learning your body.',
    descAr: 'خوارزميات المعايرة بدأت في فهم إيقاع جسمك الحيوي.',
    tier: 'bronze',
  },
  {
    id: 'day-7',
    days: 7,
    title: '1-Week Club',
    titleAr: 'نادي الأسبوع الأول',
    desc: 'Full 7-day cyclical baseline established.',
    descAr: 'أسبوع كامل من الالتزام وتثبيت منحنيات النوم والتعافي.',
    tier: 'silver',
  },
  {
    id: 'day-14',
    days: 14,
    title: 'Baseline Established',
    titleAr: 'تثبيت خط الأساس',
    desc: '14 consecutive days of clinical RMSSD and strain tracking.',
    descAr: 'تثبيت خط الأساس السريري للـ HRV والجهد البدني بدقة عالية.',
    tier: 'silver',
  },
  {
    id: 'day-21',
    days: 21,
    title: 'Habit Formed',
    titleAr: 'ترسيخ العادة الحيوية',
    desc: 'Scientific neuroscience habit formation milestone unlocked.',
    descAr: 'الوصول لمرحلة تثبيت العادات الفسيولوجية والانضباط الصحي.',
    tier: 'gold',
  },
  {
    id: 'day-30',
    days: 30,
    title: 'Monthly Master',
    titleAr: 'إتقان الشهر الكامل',
    desc: 'One full calendar month of continuous 24/7 telemetry.',
    descAr: 'شهر كامل من التتبع المتواصل على مدار الساعة.',
    tier: 'gold',
  },
  {
    id: 'day-60',
    days: 60,
    title: 'Ironclad Routine',
    titleAr: 'الالتزام الفولاذي',
    desc: 'Two uninterrupted months of physiological dedication.',
    descAr: 'شهران متتاليان من الانضباط الرياضي والتعافي المدروس.',
    tier: 'platinum',
  },
  {
    id: 'day-100',
    days: 100,
    title: 'WHOOP Centurion',
    titleAr: 'نادي المئة يوم (Centurion)',
    desc: 'Elite tier: 100 days of relentless health optimization.',
    descAr: 'مستوى النخبة: 100 يوم من رصد ومضاعفة الكفاءة البدنية.',
    tier: 'diamond',
  },
  {
    id: 'day-365',
    days: 365,
    title: 'Full Year Legend',
    titleAr: 'أسطورة العام الكامل',
    desc: '365 days of 24/7 continuous health tracking mastery.',
    descAr: 'عام كامل متواصل من التحول الجذري في الأداء والصحة.',
    tier: 'diamond',
  },
];

class StreakEngine {
  private listeners: Set<(summary: StreakSummary) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-record today on boot
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

  /**
   * Retrieves all unique recorded active dates (YYYY-MM-DD)
   */
  public getRecordedDates(): Set<string> {
    const dates = new Set<string>();

    if (typeof localStorage === 'undefined') return dates;

    // Load persisted streak list
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_DAYS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => dates.add(d));
        }
      }
    } catch {}

    // Merge with real stored day records from StorageService
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

  /**
   * Mark a day as actively tracked with WHOOP
   */
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

  /**
   * Generates full streak analytics, milestones, and 30-day heatmap
   */
  public getStreakSummary(): StreakSummary {
    const dates = this.getRecordedDates();
    const todayStr = localDateKey();
    const now = new Date();

    // Calculate current consecutive streak backwards from today
    let currentStreak = 0;
    let checkDate = new Date();

    // If today is recorded or strap is worn, start from today
    const isTodayActive = dates.has(todayStr);
    if (!isTodayActive) {
      // Check if yesterday was active (streak might be active pending today's upload)
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const k = localDateKey(checkDate);
      if (dates.has(k)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Default to at least 1 day if device is connected / active today
    if (currentStreak === 0 && isTodayActive) {
      currentStreak = 1;
    }

    // Update longest streak if current exceeds it
    let longestStreak = 0;
    try {
      const savedLongest = parseInt(localStorage.getItem(STORAGE_LONGEST_STREAK_KEY) || '0', 10);
      longestStreak = Math.max(savedLongest, currentStreak, dates.size > 0 ? 1 : 0);
      if (currentStreak > savedLongest) {
        localStorage.setItem(STORAGE_LONGEST_STREAK_KEY, String(currentStreak));
      }
    } catch {
      longestStreak = currentStreak;
    }

    const totalDays = Math.max(dates.size, currentStreak > 0 ? currentStreak : 0);

    // Build Last 30 Days Matrix
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

      // Retrieve real stored metrics for tooltip if available
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

    // Compute Milestones
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
      nextMilestone,
      milestones,
      last30Days,
    };
  }
}

export const streakEngine = new StreakEngine();
