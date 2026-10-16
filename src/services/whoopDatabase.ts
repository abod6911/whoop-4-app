import Dexie, { type Table } from 'dexie';
import type {
  UserProfileEntity,
  RealtimeTelemetryEntity,
  DailyRecordEntity,
  JournalEntryEntity,
  WorkoutEntity,
  UserSettings,
} from '../types/whoop';

export class WhoopPulseDatabase extends Dexie {
  user_profile!: Table<UserProfileEntity, string>;
  realtime_telemetry!: Table<RealtimeTelemetryEntity, number>;
  daily_records!: Table<DailyRecordEntity, string>;
  journal_entries!: Table<JournalEntryEntity, string>;
  workouts!: Table<WorkoutEntity, string>;

  constructor() {
    super('WhoopPulseProductionDB');
    this.version(1).stores({
      user_profile: 'id',
      realtime_telemetry: '++id, timestamp',
      daily_records: 'date, timestamp, dayStrain, recoveryScore',
      journal_entries: 'date, timestamp',
      workouts: 'id, startTime, sport, type',
    });
  }

  // --- User Profile ---
  public async saveUserProfile(settings: UserSettings): Promise<void> {
    const profile: UserProfileEntity = {
      id: 'current_user',
      name: settings.name,
      age: settings.age,
      gender: settings.gender,
      weightKg: settings.weightKg,
      heightCm: settings.heightCm || 178,
      maxHr: settings.maxHr,
      restingHrBaseline: settings.restingHrBaseline,
      hrvBaseline: settings.hrvBaseline,
      sleepNeedHours: settings.sleepNeedHours,
      updatedAt: Date.now(),
    };
    await this.user_profile.put(profile);
  }

  public async getUserProfile(): Promise<UserProfileEntity | undefined> {
    return this.user_profile.get('current_user');
  }

  // --- Real-time Telemetry Samples (Buffered) ---
  public async logTelemetry(sample: Omit<RealtimeTelemetryEntity, 'id'>): Promise<number> {
    const id = await this.realtime_telemetry.add(sample);
    // Keep max 10,000 recent samples in local Dexie to manage memory efficiently
    const count = await this.realtime_telemetry.count();
    if (count > 10000) {
      const oldest = await this.realtime_telemetry.orderBy('id').limit(2000).keys();
      await this.realtime_telemetry.bulkDelete(oldest as number[]);
    }
    return id;
  }

  public async getRecentTelemetry(limit = 300): Promise<RealtimeTelemetryEntity[]> {
    return this.realtime_telemetry.orderBy('timestamp').reverse().limit(limit).toArray();
  }

  // --- Daily Records ---
  public async saveDailyRecord(record: DailyRecordEntity): Promise<string> {
    await this.daily_records.put(record);
    return record.date;
  }

  public async getDailyRecord(date: string): Promise<DailyRecordEntity | undefined> {
    return this.daily_records.get(date);
  }

  public async getRecentDailyRecords(limit = 30): Promise<DailyRecordEntity[]> {
    return this.daily_records.orderBy('date').reverse().limit(limit).toArray();
  }

  // --- Journal Entries ---
  public async saveJournalEntry(entry: JournalEntryEntity): Promise<string> {
    await this.journal_entries.put(entry);
    return entry.date;
  }

  public async getJournalEntry(date: string): Promise<JournalEntryEntity | undefined> {
    return this.journal_entries.get(date);
  }

  public async getAllJournalEntries(): Promise<JournalEntryEntity[]> {
    return this.journal_entries.orderBy('date').reverse().toArray();
  }

  // --- Workouts ---
  public async saveWorkout(workout: WorkoutEntity): Promise<string> {
    await this.workouts.put(workout);
    return workout.id;
  }

  public async getWorkouts(limit = 50): Promise<WorkoutEntity[]> {
    return this.workouts.orderBy('startTime').reverse().limit(limit).toArray();
  }

  // --- Full Backup: JSON Export ---
  public async exportDatabaseToJson(): Promise<string> {
    const profiles = await this.user_profile.toArray();
    const daily = await this.daily_records.toArray();
    const journal = await this.journal_entries.toArray();
    const workouts = await this.workouts.toArray();

    const dump = {
      exportVersion: 1,
      appName: 'WHOOP 4.0 Local Web App',
      exportedAt: new Date().toISOString(),
      user_profile: profiles,
      daily_records: daily,
      journal_entries: journal,
      workouts,
    };

    return JSON.stringify(dump, null, 2);
  }

  // --- Full Backup: JSON Import ---
  public async importDatabaseFromJson(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON format');
      }

      await this.transaction('rw', [this.user_profile, this.daily_records, this.journal_entries, this.workouts], async () => {
        if (Array.isArray(parsed.user_profile)) {
          for (const item of parsed.user_profile) {
            await this.user_profile.put(item);
          }
        }
        if (Array.isArray(parsed.daily_records)) {
          for (const item of parsed.daily_records) {
            await this.daily_records.put(item);
          }
        }
        if (Array.isArray(parsed.journal_entries)) {
          for (const item of parsed.journal_entries) {
            await this.journal_entries.put(item);
          }
        }
        if (Array.isArray(parsed.workouts)) {
          for (const item of parsed.workouts) {
            await this.workouts.put(item);
          }
        }
      });

      return { success: true, message: 'Database successfully imported!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Import failed: ${msg}` };
    }
  }

  // --- CSV Export for Data Analytics ---
  public async exportDailyToCsv(): Promise<string> {
    const records = await this.daily_records.orderBy('date').toArray();
    if (records.length === 0) {
      return 'date,dayStrain,recoveryScore,activeCalories,totalCalories,steps,rhr,hrv,hoursAsleep,sleepPerformance\n';
    }

    const headers = [
      'date',
      'dayStrain',
      'recoveryScore',
      'recoveryCategory',
      'activeCalories',
      'bmrCalories',
      'totalCalories',
      'steps',
      'cadence',
      'rhr',
      'hrv',
      'hoursAsleep',
      'hoursInBed',
      'sleepPerformance',
      'stressAvg',
      'skinTempDelta',
      'spO2Avg',
    ];

    const rows = records.map((r) => [
      r.date,
      r.dayStrain,
      r.recoveryScore ?? '',
      r.recoveryCategory,
      r.activeCalories,
      r.bmrCalories,
      r.totalCalories,
      r.steps,
      r.cadence,
      r.rhr ?? '',
      r.hrv ?? '',
      r.hoursAsleep ?? '',
      r.hoursInBed ?? '',
      r.sleepPerformance ?? '',
      r.stressAvg ?? '',
      r.skinTempDelta ?? '',
      r.spO2Avg ?? '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
}

export const whoopDb = new WhoopPulseDatabase();
