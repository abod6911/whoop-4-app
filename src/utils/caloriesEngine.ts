import type { UserSettings } from '../types/whoop';

export interface CaloriesState {
  activeCalories: number;
  bmrCalories: number;
  totalCalories: number;
  lastCalculatedDate: string;
}

export class CaloriesEngine {
  private activeCalories = 0;
  private currentDate = this.getTodayDateString();

  constructor() {
    this.loadPersistedState();
  }

  private getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getStorageKey(dateStr = this.currentDate): string {
    return `whoop_calories_${dateStr}`;
  }

  public loadPersistedState(dateStr = this.getTodayDateString()): void {
    this.currentDate = dateStr;
    try {
      const saved = localStorage.getItem(this.getStorageKey(dateStr));
      if (saved) {
        const parsed = JSON.parse(saved);
        this.activeCalories = typeof parsed.activeCalories === 'number' ? parsed.activeCalories : 0;
      } else {
        this.activeCalories = 0;
      }
    } catch {
      this.activeCalories = 0;
    }
  }

  public persistState(dateStr = this.currentDate): void {
    try {
      localStorage.setItem(
        this.getStorageKey(dateStr),
        JSON.stringify({
          activeCalories: this.activeCalories,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // Ignore quota error
    }
  }

  /**
   * Calculates Basal Metabolic Rate (BMR) for 24 hours using the clinical Mifflin-St Jeor equation.
   * Men:   BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
   * Women: BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) - 161
   */
  public calculateDailyBmr(settings: UserSettings): number {
    const { gender, weightKg, heightCm, age } = settings;
    const h = heightCm || 178;
    const w = weightKg || 75;
    const a = age || 28;

    if (gender === 'female') {
      return 10 * w + 6.25 * h - 5 * a - 161;
    }
    return 10 * w + 6.25 * h - 5 * a + 5;
  }

  /**
   * Calculates BMR calories burned from midnight (00:00:00) until the current moment.
   */
  public getBmrCaloriesElapsed(settings: UserSettings, atDate = new Date()): number {
    const dailyBmr = this.calculateDailyBmr(settings);
    const minutesElapsed =
      atDate.getHours() * 60 +
      atDate.getMinutes() +
      atDate.getSeconds() / 60;
    return Math.round((dailyBmr / 1440) * minutesElapsed);
  }

  /**
   * Evaluates Keytel et al. clinical equation for active calorie expenditure per second.
   * Active calories are burned only when HR exceeds the user's active threshold (RHR + 10 bpm).
   */
  public calculateActiveCaloriesPerSecond(
    bpm: number,
    rhr: number,
    settings: UserSettings
  ): number {
    const activeThreshold = Math.max(45, rhr + 10);
    if (bpm <= activeThreshold) {
      return 0;
    }

    const { gender, weightKg, age } = settings;
    const w = weightKg || 75;
    const a = age || 28;

    let calPerMin = 0;
    if (gender === 'female') {
      calPerMin = (-20.4022 + 0.4472 * bpm - 0.1263 * w + 0.074 * a) / 4.184;
    } else {
      calPerMin = (-55.0969 + 0.6309 * bpm + 0.1988 * w + 0.2017 * a) / 4.184;
    }

    const perSec = calPerMin / 60.0;
    return perSec > 0 ? perSec : 0;
  }

  /**
   * Ingests a heart rate beat/sample and integrates active calories.
   */
  public ingestSample(
    bpm: number,
    rhr: number,
    settings: UserSettings,
    elapsedSeconds = 1
  ): number {
    const today = this.getTodayDateString();
    if (today !== this.currentDate) {
      this.loadPersistedState(today);
    }

    const perSec = this.calculateActiveCaloriesPerSecond(bpm, rhr, settings);
    this.activeCalories += perSec * elapsedSeconds;

    return this.activeCalories;
  }

  public getActiveCalories(): number {
    return Math.round(this.activeCalories);
  }

  public getTotalCalories(settings: UserSettings): number {
    const bmr = this.getBmrCaloriesElapsed(settings);
    return Math.round(bmr + this.activeCalories);
  }

  public getState(settings: UserSettings): CaloriesState {
    const bmr = this.getBmrCaloriesElapsed(settings);
    const active = Math.round(this.activeCalories);
    return {
      activeCalories: active,
      bmrCalories: bmr,
      totalCalories: bmr + active,
      lastCalculatedDate: this.currentDate,
    };
  }

  public resetDay(): void {
    this.activeCalories = 0;
    this.persistState();
  }
}

export const caloriesEngine = new CaloriesEngine();
