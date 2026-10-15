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
import { metricsEngine } from '../services/MetricsEngine';
import { storageService } from '../services/StorageService';

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
  const TOTAL_TEST_SEC = 180; // 3 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [testSamples, setTestSamples] = useState<Array<{ hr: number; hrv: number }>>([]);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Relax'>('Inhale');

  const [result, setResult] = useState<{
    rhr: number;
    hrv: number;
    score: number;
    category: 'green' | 'yellow' | 'red';
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
    if (isRunning && metrics.currentHr > 0) {
      setTestSamples((prev) => [...prev, { hr: metrics.currentHr, hrv: metrics.currentHrv }]);
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

    const recovery = metricsEngine.calculateRecovery(avgHrv, avgRhr);

    const res = {
      rhr: avgRhr,
      hrv: avgHrv,
      score: recovery.score,
      category: recovery.category,
    };
    setResult(res);

    storageService.updateTodayBaseline(avgRhr, avgHrv, recovery.score, metrics.dailyStrain);

    if (recovery.category === 'green') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E676', '#00F0FF', '#ffffff'],
        });
      } catch {}
    }
  };

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((elapsedSec / TOTAL_TEST_SEC) * 100));
  const remainingSec = TOTAL_TEST_SEC - elapsedSec;
  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-whoop-card border border-whoop-border shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-whoop-surface hover:bg-whoop-border text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-whoop-green border border-whoop-green/30 mb-2">
            <Timer className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide">3-Minute Morning Recovery Assessment</h2>
          <p className="text-xs text-whoop-muted max-w-sm mx-auto">
            Sit comfortably, breathe deeply, and allow your Whoop 4.0 strap to record clean parasympathetic HRV & resting heart rate.
          </p>
        </div>

        {!isRunning && !isCompleted ? (
          <div className="space-y-6 text-center">
            <div className="p-4 rounded-2xl bg-whoop-bg/60 border border-whoop-border/70 space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-center gap-2 text-whoop-cyan font-bold">
                <Wind className="w-4 h-4" />
                <span>Resonant Paced Breathing Protocol</span>
              </div>
              <p>Follow the breathing circle: 4s Inhale, 2s Hold, 4s Exhale, 2s Rest.</p>
              <div className="flex justify-center gap-4 pt-2 font-mono text-[11px] text-slate-400">
                <span>Baseline HRV: <b className="text-white">{settings.hrvBaseline} ms</b></span>
                <span>Baseline RHR: <b className="text-white">{settings.restingHrBaseline} BPM</b></span>
              </div>
            </div>

            <button
              onClick={startTest}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              Begin 3-Minute Assessment
            </button>
          </div>
        ) : isRunning ? (
          <div className="space-y-6 text-center">
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full border-4 border-whoop-green/30 transition-all duration-1000 ${
                  breathPhase === 'Inhale'
                    ? 'scale-110 border-whoop-cyan shadow-xl shadow-cyan-500/20'
                    : breathPhase === 'Exhale'
                    ? 'scale-90 border-emerald-500 shadow-xl shadow-emerald-500/20'
                    : 'scale-100 border-whoop-green'
                }`}
              />

              <div className="text-center z-10 space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-widest text-whoop-muted">
                  {breathPhase}
                </span>
                <div className="text-3xl font-black font-mono text-white">
                  {mins}:{secs.toString().padStart(2, '0')}
                </div>
                <div className="text-[11px] font-mono text-whoop-green flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-whoop-green" />
                  <span>{metrics.currentHr} BPM</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          result && (
            <div className="space-y-6 text-center animate-in zoom-in-95">
              <div className="p-5 rounded-2xl bg-whoop-bg/80 border border-whoop-border space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor:
                      result.category === 'green'
                        ? 'rgba(0, 230, 118, 0.15)'
                        : result.category === 'yellow'
                        ? 'rgba(255, 179, 0, 0.15)'
                        : 'rgba(255, 51, 102, 0.15)',
                    color:
                      result.category === 'green'
                        ? '#00E676'
                        : result.category === 'yellow'
                        ? '#FFB300'
                        : '#FF3366',
                  }}
                >
                  {result.category === 'green' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{result.category.toUpperCase()} RECOVERY • {result.score}%</span>
                </div>

                <div className="text-5xl font-black font-mono text-white tracking-tight">
                  {result.score}%
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-whoop-border/60">
                  <div className="p-3 rounded-xl bg-whoop-card border border-whoop-border/50">
                    <div className="text-[10px] uppercase font-bold text-whoop-muted">Official RMSSD</div>
                    <div className="text-xl font-black font-mono text-whoop-cyan mt-0.5">{result.hrv} ms</div>
                    <div className="text-[10px] text-slate-400">Baseline: {settings.hrvBaseline} ms</div>
                  </div>
                  <div className="p-3 rounded-xl bg-whoop-card border border-whoop-border/50">
                    <div className="text-[10px] uppercase font-bold text-whoop-muted">Resting HR</div>
                    <div className="text-xl font-black font-mono text-white mt-0.5">{result.rhr} BPM</div>
                    <div className="text-[10px] text-slate-400">Baseline: {settings.restingHrBaseline} BPM</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-2">
                  {result.category === 'green'
                    ? 'Your autonomic nervous system is fully restored and primed for maximum athletic output. High strain target recommended today (14.0 - 18.0).'
                    : result.category === 'yellow'
                    ? 'Moderate physiological readiness. You can undertake moderate workouts, but watch your fatigue accumulation.'
                    : 'Elevated sympathetic tone and suppressed HRV detected. Prioritize sleep, hydration, and light active recovery today.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startTest}
                  className="flex-1 py-3 rounded-xl bg-whoop-surface hover:bg-whoop-hover text-slate-300 text-xs font-bold border border-whoop-border flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retest</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-whoop-cyan hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
