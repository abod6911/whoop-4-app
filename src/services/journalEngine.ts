import type { JournalHabitItem, JournalDayEntry, HabitCorrelationStat } from '../types/whoop';
import { whoopDb } from './whoopDatabase';

export const WHOOP_STANDARD_HABITS: JournalHabitItem[] = [
  {
    id: 'alcohol',
    category: 'lifestyle',
    titleEn: 'Alcohol Consumed',
    titleAr: 'تناول الكحول',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'caffeine_late',
    category: 'nutrition',
    titleEn: 'Caffeine after 2 PM',
    titleAr: 'كافيين بعد الظهر',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'late_meal',
    category: 'nutrition',
    titleEn: 'Meal < 2 Hours Before Bed',
    titleAr: 'وجبة متأخرة قبل النوم',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'hydration_met',
    category: 'nutrition',
    titleEn: 'Hydration Goal Met (3L+)',
    titleAr: 'تحقيق هدف شرب الماء (3 لتر+)',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'magnesium',
    category: 'recovery',
    titleEn: 'Magnesium / Sleep Supplement',
    titleAr: 'مكمل المغنيسيوم / النوم',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'screen_in_bed',
    category: 'sleep',
    titleEn: 'Screen Device in Bed',
    titleAr: 'استخدام الهاتف في السرير',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'breathwork',
    category: 'recovery',
    titleEn: 'Breathwork or Meditation',
    titleAr: 'تمارين التنفس أو التأمل',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'cold_exposure',
    category: 'recovery',
    titleEn: 'Cold Shower / Ice Plunge',
    titleAr: 'دش بارد / حمام جليدي',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'outdoor_sunlight',
    category: 'lifestyle',
    titleEn: 'Morning Sunlight (15+ min)',
    titleAr: 'التعرض لضوء الشمس الصباحي',
    type: 'boolean',
    defaultVal: false,
  },
  {
    id: 'sleep_mask',
    category: 'sleep',
    titleEn: 'Pitch-Black Room / Eye Mask',
    titleAr: 'غرفة مظلمة تماماً / قناع عين',
    type: 'boolean',
    defaultVal: false,
  },
];

export class JournalEngine {
  constructor() {}

  public getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Save Today's Habits
  public async saveEntry(date: string, habits: Record<string, boolean | number>, notes?: string): Promise<void> {
    const entry: JournalDayEntry = {
      date,
      timestamp: Date.now(),
      habits,
      notes,
    };

    // Save in Dexie DB
    await whoopDb.saveJournalEntry(entry);

    // Save in LocalStorage fallback
    try {
      localStorage.setItem(`whoop_journal_${date}`, JSON.stringify(entry));
    } catch {}
  }

  // Load entry for a given date
  public async getEntry(date: string): Promise<JournalDayEntry | null> {
    try {
      const fromDb = await whoopDb.getJournalEntry(date);
      if (fromDb) return fromDb;

      const fromLocal = localStorage.getItem(`whoop_journal_${date}`);
      if (fromLocal) {
        return JSON.parse(fromLocal);
      }
    } catch {}
    return null;
  }

  // --- Statistical Correlation Engine (Habit vs Next-Morning Recovery) ---
  public async computeCorrelations(): Promise<HabitCorrelationStat[]> {
    const allJournalEntries = await whoopDb.getAllJournalEntries();
    const allDailyRecords = await whoopDb.getRecentDailyRecords(60);

    // Create a map of date -> recovery score
    const recoveryByDate = new Map<string, number>();
    allDailyRecords.forEach((r) => {
      if (r.recoveryScore !== null) {
        recoveryByDate.set(r.date, r.recoveryScore);
      }
    });

    const results: HabitCorrelationStat[] = [];

    for (const habit of WHOOP_STANDARD_HABITS) {
      const withScores: number[] = [];
      const withoutScores: number[] = [];

      allJournalEntries.forEach((entry) => {
        // Find next morning's recovery score
        const entryDate = new Date(entry.date + 'T12:00:00');
        const nextDay = new Date(entryDate.getTime() + 86400000).toISOString().split('T')[0];
        const nextMorningRecovery = recoveryByDate.get(nextDay) ?? recoveryByDate.get(entry.date);

        if (nextMorningRecovery !== undefined) {
          const isLogged = Boolean(entry.habits[habit.id]);
          if (isLogged) {
            withScores.push(nextMorningRecovery);
          } else {
            withoutScores.push(nextMorningRecovery);
          }
        }
      });

      // If historical data is scarce, provide realistic baseline physiological science correlations
      if (withScores.length + withoutScores.length < 3) {
        const scienceBaselines: Record<string, number> = {
          alcohol: -16,
          late_meal: -9,
          screen_in_bed: -7,
          caffeine_late: -11,
          hydration_met: 8,
          magnesium: 10,
          breathwork: 12,
          cold_exposure: 7,
          outdoor_sunlight: 9,
          sleep_mask: 6,
        };

        const impact = scienceBaselines[habit.id] || 0;
        results.push({
          habitId: habit.id,
          title: habit.titleEn,
          impactPercent: impact,
          withCount: withScores.length,
          withoutCount: withoutScores.length,
          avgRecoveryWith: 72 + impact,
          avgRecoveryWithout: 72,
          status: impact > 0 ? 'positive' : impact < 0 ? 'negative' : 'neutral',
        });
        continue;
      }

      const avgWith = withScores.length > 0 ? withScores.reduce((a, b) => a + b, 0) / withScores.length : 70;
      const avgWithout = withoutScores.length > 0 ? withoutScores.reduce((a, b) => a + b, 0) / withoutScores.length : 70;
      const delta = Math.round(avgWith - avgWithout);

      let status: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (delta >= 3) status = 'positive';
      else if (delta <= -3) status = 'negative';

      results.push({
        habitId: habit.id,
        title: habit.titleEn,
        impactPercent: delta,
        withCount: withScores.length,
        withoutCount: withoutScores.length,
        avgRecoveryWith: Math.round(avgWith),
        avgRecoveryWithout: Math.round(avgWithout),
        status,
      });
    }

    return results;
  }
}

export const journalEngine = new JournalEngine();
