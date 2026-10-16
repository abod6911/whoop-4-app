import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Timer,
  X,
  Heart,
  Wind,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { LiveMetrics, UserSettings } from '../types/whoop';
import { biometricEngine } from '../utils/biometricEngine';
import { useLanguage } from '../i18n/LanguageContext';

interface RecoveryTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  settings: UserSettings;
}

export const RecoveryTestModal: React.FC<RecoveryTestModalProps> = ({
  isOpen,
  onClose,
  metrics,
  settings,
}) => {
  const { t, isRtl } = useLanguage();
  const TOTAL_TEST_SEC = 180; // 3 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [testSamples, setTestSamples] = useState<Array<{ hr: number; hrv: number }>>([]);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Relax'>('Inhale');

  const [result, setResult] = useState<{
    rhr: number;
    hrv: number;
    score: number | null;
    category: 'green' | 'yellow' | 'red' | 'calibrating';
  } | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    const cycle = elapsedSec % 12;
    if (cycle < 4) setBreathPhase('Inhale');
    else if (cycle < 6) setBreathPhase('Hold');
    else if (cycle < 10) setBreathPhase('Exhale');
    else setBreathPhase('Relax');
  }, [elapsedSec, isRunning]);

  useEffect(() => {
    let timer: number | null = null;
    if (isRunning && elapsedSec < TOTAL_TEST_SEC) {
      timer = window.setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    } else if (isRunning && elapsedSec >= TOTAL_TEST_SEC) {
      finishTest();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, elapsedSec]);

  useEffect(() => {
    if (isRunning && metrics.currentHr && metrics.currentHr > 0) {
      setTestSamples((prev) => [
        ...prev,
        { hr: metrics.currentHr as number, hrv: metrics.currentHrv || settings.hrvBaseline },
      ]);
    }
  }, [metrics.timestamp, isRunning]);

  const startTest = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setElapsedSec(0);
    setTestSamples([]);
    setResult(null);
  };

  const finishTest = () => {
    setIsRunning(false);
    setIsCompleted(true);

    if (testSamples.length === 0) {
      return;
    }

    const hrSum = testSamples.reduce((acc, s) => acc + s.hr, 0);
    const hrvSum = testSamples.reduce((acc, s) => acc + s.hrv, 0);
    const avgRhr = Math.round(hrSum / testSamples.length);
    const avgHrv = Math.round(hrvSum / testSamples.length);

    const recovery = biometricEngine.calculateRecovery(avgHrv, avgRhr);

    const res = {
      rhr: avgRhr,
      hrv: avgHrv,
      score: recovery.score,
      category: recovery.category,
    };
    setResult(res);

    if (recovery.category === 'green') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16EC06', '#00F0FF', '#ffffff'],
        });
      } catch {}
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((elapsedSec / TOTAL_TEST_SEC) * 100));
  const remainingSec = TOTAL_TEST_SEC - elapsedSec;
  const remMin = Math.floor(remainingSec / 60);
  const remSec = remainingSec % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-[430px] p-6 rounded-[24px] bg-[#16191E] border border-white/10 shadow-2xl space-y-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#16EC06]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'اختبار الاستشفاء الصباحي' : 'Morning Recovery Assessment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-[#222730] text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isRunning && !isCompleted && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-[#16EC06]/10 border border-[#16EC06]/30 text-[#16EC06] flex items-center justify-center mx-auto">
              <Wind className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-white font-sans">
                {isRtl ? 'بروتوكول التنفس الموجه لـ 3 دقائق' : '3-Minute Resonant Paced Protocol'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {isRtl
                  ? 'اجلس باسترخاء وأرخِ كتفيك واتبع إرشادات التنفس. يقيس هذا الاختبار خط الأساس الحقيقي للجهاز العصبي اللاإرادي.'
                  : 'Sit comfortably, relax your shoulders, and follow the paced breathing guide. This calculates your true resting autonomic baseline.'}
              </p>
            </div>

            <button
              onClick={startTest}
              className="w-full py-3.5 rounded-xl bg-[#16EC06] hover:bg-[#13d405] text-black font-black text-xs uppercase tracking-wider font-condensed transition-all shadow-lg shadow-green-500/20 active:scale-98"
            >
              {isRtl ? 'بدء اختبار الاستشفاء (3 دقائق)' : 'Start 3-Minute Assessment'}
            </button>
          </div>
        )}

        {isRunning && (
          <div className="space-y-5 text-center">
            {/* Visual Breath Bubble */}
            <div className="relative flex items-center justify-center py-4">
              <div
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
                  breathPhase === 'Inhale'
                    ? 'scale-110 border-[#16EC06] bg-[#16EC06]/10'
                    : breathPhase === 'Hold'
                    ? 'scale-105 border-[#00F0FF] bg-[#00F0FF]/10'
                    : breathPhase === 'Exhale'
                    ? 'scale-90 border-[#7293B2] bg-[#7293B2]/10'
                    : 'scale-95 border-zinc-600 bg-zinc-900/50'
                }`}
              >
                <span className="text-sm font-black uppercase tracking-wider text-white font-condensed">
                  {breathPhase === 'Inhale' ? t('inhale') : breathPhase === 'Hold' ? t('hold') : breathPhase === 'Exhale' ? t('exhale') : (isRtl ? 'استرخاء' : 'Relax')}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono mt-1" dir="ltr">
                  {metrics.currentHr !== null ? `${metrics.currentHr} BPM` : '--'}
                </span>
              </div>
            </div>

            {/* Time progress */}
            <div className="space-y-1.5 font-mono">
              <div className="text-2xl font-black text-white" dir="ltr">
                {remMin.toString().padStart(2, '0')}:{remSec.toString().padStart(2, '0')}
              </div>
              <div className="h-2 w-full bg-[#0B0D10] rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-[#16EC06] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setIsRunning(false);
                setIsCompleted(false);
              }}
              className="text-xs text-rose-400 hover:underline font-condensed uppercase tracking-wider"
            >
              {t('cancel')}
            </button>
          </div>
        )}

        {isCompleted && result && (
          <div className="space-y-4 text-center">
            <div className="space-y-1">
              <div
                className="text-5xl font-black font-condensed tracking-tight tabular-nums"
                dir="ltr"
                style={{
                  color:
                    result.category === 'green'
                      ? '#16EC06'
                      : result.category === 'yellow'
                      ? '#FFDE00'
                      : '#FF0026',
                }}
              >
                {result.score !== null ? `${result.score}%` : '--'}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-white font-condensed">
                {isRtl
                  ? `استشفاء ${result.category === 'green' ? 'أخضر (ممتاز)' : result.category === 'yellow' ? 'أصفر (معتدل)' : 'أحمر (منخفض)'}`
                  : `${result.category.toUpperCase()} RECOVERY`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-zinc-500 text-[10px] uppercase">{isRtl ? 'معدل تقلب القلب (HRV)' : 'Assessed HRV'}</div>
                <div className="text-xl font-bold text-white mt-0.5" dir="ltr">{result.hrv} ms</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-zinc-500 text-[10px] uppercase">{isRtl ? 'نبض الراحة (RHR)' : 'Resting HR'}</div>
                <div className="text-xl font-bold text-white mt-0.5" dir="ltr">{result.rhr} bpm</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider font-condensed transition-all"
            >
              {isRtl ? 'اعتماد التقييم لليوم' : 'Apply Assessment to Today'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
