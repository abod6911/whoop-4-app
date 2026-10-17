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
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

interface RecoveryTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  settings: UserSettings;
  onApplied?: () => void;
}

export const RecoveryTestModal: React.FC<RecoveryTestModalProps> = ({
  isOpen,
  onClose,
  metrics,
  settings,
  onApplied,
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

  const progressPercent = Math.min(100, Math.round((elapsedSec / TOTAL_TEST_SEC) * 100));
  const remainingSec = TOTAL_TEST_SEC - elapsedSec;
  const remMin = Math.floor(remainingSec / 60);
  const remSec = remainingSec % 60;

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="p-6 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#16EC06]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ø§Ø³ØªØ´ÙØ§Ø¡ Ø§Ù„ØµØ¨Ø§Ø­ÙŠ' : 'Morning Recovery Assessment'}
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
                {isRtl ? 'Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„ Ø§Ù„ØªÙ†ÙØ³ Ø§Ù„Ù…ÙˆØ¬Ù‡ Ù„Ù€ 3 Ø¯Ù‚Ø§Ø¦Ù‚' : '3-Minute Resonant Paced Protocol'}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {isRtl
                  ? 'Ø§Ø¬Ù„Ø³ Ø¨Ø§Ø³ØªØ±Ø®Ø§Ø¡ ÙˆØ£Ø±Ø®Ù ÙƒØªÙÙŠÙƒ ÙˆØ§ØªØ¨Ø¹ Ø¥Ø±Ø´Ø§Ø¯Ø§Øª Ø§Ù„ØªÙ†ÙØ³. ÙŠÙ‚ÙŠØ³ Ù‡Ø°Ø§ Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø± Ø®Ø· Ø§Ù„Ø£Ø³Ø§Ø³ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ù„Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø¹ØµØ¨ÙŠ Ø§Ù„Ù„Ø§Ø¥Ø±Ø§Ø¯ÙŠ.'
                  : 'Sit comfortably, relax your shoulders, and follow the paced breathing guide. This calculates your true resting autonomic baseline.'}
              </p>
            </div>

            <button
              onClick={startTest}
              className="w-full py-3.5 rounded-xl bg-[#16EC06] hover:bg-[#13d405] text-black font-black text-xs uppercase tracking-wider font-condensed transition-all shadow-lg shadow-green-500/20 active:scale-98"
            >
              {isRtl ? 'Ø¨Ø¯Ø¡ Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ø§Ø³ØªØ´ÙØ§Ø¡ (3 Ø¯Ù‚Ø§Ø¦Ù‚)' : 'Start 3-Minute Assessment'}
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
                  {breathPhase === 'Inhale' ? t('inhale') : breathPhase === 'Hold' ? t('hold') : breathPhase === 'Exhale' ? t('exhale') : (isRtl ? 'Ø§Ø³ØªØ±Ø®Ø§Ø¡' : 'Relax')}
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
                      : '#FF3344',
                }}
              >
                {result.score !== null ? `${result.score}%` : '--'}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-white font-condensed">
                {isRtl
                  ? `Ø§Ø³ØªØ´ÙØ§Ø¡ ${result.category === 'green' ? 'Ø£Ø®Ø¶Ø± (Ù…Ù…ØªØ§Ø²)' : result.category === 'yellow' ? 'Ø£ØµÙØ± (Ù…Ø¹ØªØ¯Ù„)' : 'Ø£Ø­Ù…Ø± (Ù…Ù†Ø®ÙØ¶)'}`
                  : `${result.category.toUpperCase()} RECOVERY`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-zinc-500 text-[10px] uppercase">{isRtl ? 'Ù…Ø¹Ø¯Ù„ ØªÙ‚Ù„Ø¨ Ø§Ù„Ù‚Ù„Ø¨ (HRV)' : 'Assessed HRV'}</div>
                <div className="text-xl font-bold text-white mt-0.5" dir="ltr">{result.hrv} ms</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0D10] border border-white/5">
                <div className="text-zinc-500 text-[10px] uppercase">{isRtl ? 'Ù†Ø¨Ø¶ Ø§Ù„Ø±Ø§Ø­Ø© (RHR)' : 'Resting HR'}</div>
                <div className="text-xl font-bold text-white mt-0.5" dir="ltr">{result.rhr} bpm</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (result && result.score !== null) {
                  biometricEngine.applyManualRecoveryAssessment(
                    result.score,
                    result.category as 'green' | 'yellow' | 'red',
                    result.rhr,
                    result.hrv
                  );
                  if (onApplied) onApplied();
                }
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider font-condensed transition-all active:scale-98 shadow-lg hover:bg-zinc-200"
            >
              {isRtl ? 'Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ù„Ù„ÙŠÙˆÙ…' : 'Apply Assessment to Today'}
            </button>
          </div>
        )}
      </SheetPanel>
    </SheetBackdrop>
  );
};
