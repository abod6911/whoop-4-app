import React, { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw, Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import type { LiveMetrics } from '../types/whoop';
import { useLanguage } from '../i18n/LanguageContext';

interface HrvBreathePacerProps {
  metrics: LiveMetrics;
  onClose?: () => void;
}

type PacerPattern = 'coherence' | 'relax' | 'box';

interface PatternConfig {
  name: string;
  desc: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const PATTERNS: Record<PacerPattern, PatternConfig> = {
  coherence: {
    name: 'Resonant Coherence (5.5s - 5.5s)',
    desc: 'Maximal baroreflex HRV synchronization (0.1 Hz)',
    inhale: 5.5,
    holdIn: 0,
    exhale: 5.5,
    holdOut: 0,
  },
  relax: {
    name: 'Vagal Down-Regulation (4s - 6s)',
    desc: 'Extended exhalation stimulates parasympathetic brake',
    inhale: 4,
    holdIn: 0,
    exhale: 6,
    holdOut: 0,
  },
  box: {
    name: 'Tactical Box Breathing (4-4-4-4)',
    desc: 'Acute stress mitigation & mental clarity',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
  },
};

export const HrvBreathePacer: React.FC<HrvBreathePacerProps> = ({ metrics }) => {
  const { t, isRtl } = useLanguage();
  const [patternKey, setPatternKey] = useState<PacerPattern>('coherence');
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'holdIn' | 'exhale' | 'holdOut'>('inhale');
  const [phaseProgress, setPhaseProgress] = useState(0); // 0 to 1
  const [sessionSeconds, setSessionSeconds] = useState(120); // 2 min session
  const [completed, setCompleted] = useState(false);

  const cfg = PATTERNS[patternKey];

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let currentPhase: 'inhale' | 'holdIn' | 'exhale' | 'holdOut' = 'inhale';
    let phaseElapsed = 0;

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      if (isActive && !completed) {
        phaseElapsed += deltaSec;
        let phaseDuration = cfg.inhale;
        if (currentPhase === 'holdIn') phaseDuration = cfg.holdIn;
        else if (currentPhase === 'exhale') phaseDuration = cfg.exhale;
        else if (currentPhase === 'holdOut') phaseDuration = cfg.holdOut;

        if (phaseElapsed >= phaseDuration) {
          phaseElapsed = 0;
          // Advance phase
          if (currentPhase === 'inhale') {
            currentPhase = cfg.holdIn > 0 ? 'holdIn' : 'exhale';
          } else if (currentPhase === 'holdIn') {
            currentPhase = 'exhale';
          } else if (currentPhase === 'exhale') {
            currentPhase = cfg.holdOut > 0 ? 'holdOut' : 'inhale';
          } else {
            currentPhase = 'inhale';
          }
          setPhase(currentPhase);
        }

        const dur =
          currentPhase === 'inhale'
            ? cfg.inhale
            : currentPhase === 'holdIn'
            ? cfg.holdIn
            : currentPhase === 'exhale'
            ? cfg.exhale
            : cfg.holdOut;

        setPhaseProgress(Math.min(1, phaseElapsed / (dur || 1)));

        // Decrement session timer
        setSessionSeconds((prev) => {
          if (prev <= 0.05) {
            setIsActive(false);
            setCompleted(true);
            return 0;
          }
          return prev - deltaSec;
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isActive, completed, cfg]);

  const getRingScale = () => {
    if (!isActive) return 1;
    if (phase === 'inhale') return 1 + phaseProgress * 0.45; // expand
    if (phase === 'holdIn') return 1.45;
    if (phase === 'exhale') return 1.45 - phaseProgress * 0.45; // contract
    return 1;
  };

  const getPhaseInstruction = () => {
    if (!isActive) return isRtl ? 'اضغط لبدء جلسة التنفس' : 'TAP TO START BREATHE';
    if (phase === 'inhale') return isRtl ? 'شهيق عميق...' : 'INHALE DEEPLY...';
    if (phase === 'holdIn') return isRtl ? 'حبس النفس...' : 'HOLD...';
    if (phase === 'exhale') return isRtl ? 'زفير بطيء...' : 'EXHALE SLOWLY...';
    return isRtl ? 'استرخاء...' : 'REST...';
  };

  const getPhaseColor = () => {
    if (phase === 'inhale') return '#00F0FF';
    if (phase === 'holdIn') return '#0093E9';
    if (phase === 'exhale') return '#16EC06';
    return '#7395B7';
  };

  const coherencePercent = metrics.currentHrv ? Math.min(98, Math.max(45, Math.round(metrics.currentHrv * 1.1))) : 72;

  return (
    <div className="rounded-[24px] bg-[#12151A] border border-white/5 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-[#00F0FF]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
            {isRtl ? 'منظم التنفس والتوافق الحيوي (HRV)' : 'HRV Biofeedback Breathe Pacer'}
          </h3>
        </div>

        <span className="text-[10px] font-mono text-[#00F0FF] uppercase" dir="ltr">
          {isRtl ? 'التوافق: ' : 'Coherence: '}{coherencePercent}%
        </span>
      </div>

      {/* Pattern Selector Pills */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#0B0D10] p-1 rounded-xl border border-white/5">
        {(['coherence', 'relax', 'box'] as PacerPattern[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPatternKey(p);
              setIsActive(false);
              setPhase('inhale');
              setPhaseProgress(0);
              setSessionSeconds(120);
              setCompleted(false);
            }}
            className={`py-1.5 rounded-lg text-[10px] font-black font-condensed uppercase tracking-wider transition-all ${
              patternKey === p ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {p === 'coherence'
              ? (isRtl ? '5.5ث رنين' : '5.5s Resonant')
              : p === 'relax'
              ? (isRtl ? '4-6ث استرخاء' : '4-6 Relax')
              : (isRtl ? 'مربع 4-4' : '4-4-4-4 Box')}
          </button>
        ))}
      </div>

      {/* Dynamic Expanding / Contracting Breathing Sphere */}
      <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-2">
        {/* Outer glowing ripple ring */}
        <div
          className="absolute rounded-full border-2 transition-transform duration-100 ease-linear shadow-lg"
          style={{
            width: '120px',
            height: '120px',
            transform: `scale(${getRingScale()})`,
            borderColor: getPhaseColor(),
            boxShadow: `0 0 35px ${getPhaseColor()}40`,
          }}
        />

        {/* Inner Core */}
        <div className="relative z-10 w-24 h-24 rounded-full bg-[#0B0D10] border border-white/10 flex flex-col items-center justify-center text-center p-2">
          <span
            className="text-[10px] font-black font-condensed uppercase tracking-widest transition-colors"
            style={{ color: getPhaseColor() }}
          >
            {getPhaseInstruction()}
          </span>
          <div className="flex items-center gap-1 text-white font-mono text-xs mt-1" dir="ltr">
            <Heart className="w-3 h-3 text-[#FF0026] fill-[#FF0026]" />
            <span className="font-bold tabular-nums">
              {metrics.currentHr ? `${metrics.currentHr}` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Timer & Controls */}
      <div className="flex items-center justify-between pt-1 text-xs font-condensed">
        <div className="text-zinc-400">
          {isRtl ? 'مدة الجلسة: ' : 'Session Time: '}
          <span className="text-white font-bold" dir="ltr">{Math.ceil(sessionSeconds)}s</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsActive(false);
              setSessionSeconds(120);
              setPhase('inhale');
              setPhaseProgress(0);
              setCompleted(false);
            }}
            className="p-2 rounded-full bg-[#16191E] border border-white/10 text-zinc-400 hover:text-white active:scale-95"
            title={isRtl ? 'إعادة ضبط' : 'Reset'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-5 py-1.5 rounded-full font-black uppercase tracking-wider text-xs flex items-center gap-1.5 active:scale-95 transition-all ${
              isActive
                ? 'bg-zinc-700 text-white'
                : 'bg-[#00F0FF] text-black font-bold shadow-md shadow-[#00F0FF]/20'
            }`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isActive ? (isRtl ? 'إيقاف مؤقت' : 'Pause') : (isRtl ? 'بدء التنفس' : 'Start Pacer')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
