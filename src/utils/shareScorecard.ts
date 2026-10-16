export interface ScorecardData {
  recoveryScore: number | null;
  recoveryCategory?: string;
  dailyStrain: number;
  sleepPerformance: number | null;
  currentHrv: number | null;
  restingHr: number | null;
  calories?: number;
  steps?: number;
}

export async function shareWhoopScorecard(data: ScorecardData, isRtl: boolean): Promise<boolean> {
  const recStr = data.recoveryScore !== null ? `${data.recoveryScore}%` : '--';
  const strainStr = data.dailyStrain > 0 ? data.dailyStrain.toFixed(1) : '0.0';
  const sleepStr = data.sleepPerformance !== null ? `${data.sleepPerformance}%` : '--';
  const hrvStr = data.currentHrv !== null ? `${data.currentHrv} ms` : '--';
  const rhrStr = data.restingHr !== null ? `${data.restingHr} bpm` : '--';

  const title = isRtl ? 'بطاقة إنجاز WHOOP 4.0 اليومية' : 'WHOOP 4.0 Daily Scorecard';
  const text = isRtl
    ? `⚡ بطاقة أدائي اليومي من WHOOP 4.0:\n• نسبة الاستشفاء: ${recStr}\n• إجهاد اليوم (Strain): ${strainStr} / 21.0\n• أداء النوم: ${sleepStr}\n• تباين النبض (HRV): ${hrvStr}\n• نبض الراحة (RHR): ${rhrStr}\n\n🔗 تتبع مباشر عبر: https://whoop-4-app.vercel.app`
    : `⚡ My WHOOP 4.0 Daily Biometrics:\n• Recovery: ${recStr}\n• Day Strain: ${strainStr} / 21.0\n• Sleep Performance: ${sleepStr}\n• HRV: ${hrvStr}\n• Resting HR: ${rhrStr}\n\n🔗 Live telemetry via: https://whoop-4-app.vercel.app`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url: 'https://whoop-4-app.vercel.app' });
      return true;
    } catch {
      // User dismissed share dialog
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {}
  }

  return false;
}
