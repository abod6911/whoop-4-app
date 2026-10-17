import React, { useState, useEffect } from 'react';
import type { LiveMetrics } from '../types/whoop';
import { biometricEngine } from '../utils/biometricEngine';
import { notificationEngine } from '../services/notificationEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Dumbbell,
  Timer,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface StrengthTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
}

interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  hrAtSet?: number;
}

interface StrengthExercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: ExerciseSet[];
}

const COMMON_EXERCISES = [
  { name: 'Barbell Back Squat', targetMuscle: 'Quads & Glutes' },
  { name: 'Barbell Bench Press', targetMuscle: 'Chest & Triceps' },
  { name: 'Conventional Deadlift', targetMuscle: 'Hamstrings & Back' },
  { name: 'Overhead Shoulder Press', targetMuscle: 'Deltoids & Core' },
  { name: 'Barbell Bent-Over Row', targetMuscle: 'Upper Back & Lats' },
  { name: 'Pull-Ups / Chin-Ups', targetMuscle: 'Lats & Biceps' },
  { name: 'Dumbbell Walking Lunges', targetMuscle: 'Legs & Stabilizers' },
  { name: 'Incline Dumbbell Press', targetMuscle: 'Upper Chest' },
  { name: 'Romanian Deadlift (RDL)', targetMuscle: 'Posterior Chain' },
  { name: 'Cable Lateral Raise', targetMuscle: 'Side Delts' },
  { name: 'Barbell Bicep Curl', targetMuscle: 'Biceps' },
  { name: 'Dips (Weighted)', targetMuscle: 'Triceps & Chest' },
];

const CARDIO_SPORTS = [
  'Running',
  'Cycling',
  'Swimming',
  'HIIT',
  'Functional Fitness',
  'Boxing / MMA',
  'Rowing',
  'Basketball',
  'Soccer',
  'Tennis',
  'Pilates',
  'Walking / Rucking',
];

export const StrengthTrainerModal: React.FC<StrengthTrainerModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'strength' | 'cardio_hiit'>('strength');

  // Strength Trainer State (Starts empty - zero fake workouts)
  const [exercises, setExercises] = useState<StrengthExercise[]>([]);
  const [muscularLoadAccumulator, setMuscularLoadAccumulator] = useState(0);

  // HIIT Interval Timer State
  const [selectedSport, setSelectedSport] = useState('HIIT');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest'>('work');
  const [workDuration, setWorkDuration] = useState(40); // 40s work
  const [restDuration, setRestDuration] = useState(20); // 20s rest
  const [secondsLeft, setSecondsLeft] = useState(40);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(8);

  // HIIT Timer Tick
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Switch phase
            if (intervalPhase === 'work') {
              setIntervalPhase('rest');
              // Play chime cue
              notificationEngine.dispatch({
                type: 'strain',
                title: `ðŸ”” Rest Phase (${restDuration}s)`,
                message: `Catch your breath. Round ${round} complete.`,
              });
              return restDuration;
            } else {
              if (round >= totalRounds) {
                setIsTimerRunning(false);
                notificationEngine.dispatch({
                  type: 'strain',
                  title: 'ðŸ HIIT Workout Finished!',
                  message: `Completed all ${totalRounds} intervals. Great stimulus!`,
                });
                return 0;
              }
              setIntervalPhase('work');
              setRound((r) => r + 1);
              notificationEngine.dispatch({
                type: 'strain',
                title: `ðŸ”¥ Work Interval - Round ${round + 1}`,
                message: `Max effort for ${workDuration}s!`,
              });
              return workDuration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, intervalPhase, round, totalRounds, workDuration, restDuration]);

  // Toggle set completed
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const targetSet = updated[exIndex].sets[setIndex];
    targetSet.completed = !targetSet.completed;

    if (targetSet.completed) {
      targetSet.hrAtSet = metrics.currentHr || undefined;
      // Calculate muscular volume: weight * reps
      const volume = targetSet.weightKg * targetSet.reps;
      const load = (volume / 200.0); // Muscular stimulus units
      setMuscularLoadAccumulator((prev) => prev + load);
      biometricEngine.addMuscularLoad(load);

      // Play cue
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 60]);
      }
    }

    setExercises(updated);
  };

  const handleAddExercise = (name: string, targetMuscle: string) => {
    const newEx: StrengthExercise = {
      id: `ex-${Date.now()}`,
      name,
      targetMuscle,
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, weightKg: 60, reps: 10, completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, weightKg: 60, reps: 10, completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, weightKg: 60, reps: 10, completed: false },
      ],
    };
    setExercises([...exercises, newEx]);
  };

  const handleAddSet = (exIndex: number) => {
    const updated = [...exercises];
    const curSets = updated[exIndex].sets;
    const lastSet = curSets[curSets.length - 1];
    curSets.push({
      id: `s-${Date.now()}`,
      setNumber: curSets.length + 1,
      weightKg: lastSet ? lastSet.weightKg : 60,
      reps: lastSet ? lastSet.reps : 10,
      completed: false,
    });
    setExercises(updated);
  };

  const handleRemoveExercise = (exIndex: number) => {
    setExercises(exercises.filter((_, i) => i !== exIndex));
  };

  const totalCompletedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalVolumeTonnage = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.weightKg * s.reps, 0)
    );
  }, 0);

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#00A3FF]/15 border border-[#00A3FF]/30 flex items-center justify-center text-[#00A3FF]">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-white">
                {isRtl ? 'مدرب القوة والجهد' : 'Strength Trainer & Coach'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                {isRtl ? 'Ù…Ø­Ø±Ùƒ Ø§Ù„Ø¬Ù‡Ø¯ Ø§Ù„Ø¹Ø¶Ù„ÙŠ ÙˆØ§Ù„Ù‚Ù„Ø¨ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±' : 'Live Cardio + Muscular Load Engine'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Strength Trainer vs HIIT Strain Coach */}
        <div className="flex border-b border-white/5 bg-[#12151A]">
          <button
            onClick={() => setActiveTab('strength')}
            className={`flex-1 py-3 text-xs font-black font-condensed uppercase tracking-wider transition-colors relative ${
              activeTab === 'strength' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{isRtl ? 'Ù…Ø¯Ø±Ø¨ Ø§Ù„Ù‚ÙˆØ© WHOOP' : 'WHOOP Strength Trainer'}</span>
            {activeTab === 'strength' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#00A3FF] rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('cardio_hiit')}
            className={`flex-1 py-3 text-xs font-black font-condensed uppercase tracking-wider transition-colors relative ${
              activeTab === 'cardio_hiit' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{isRtl ? 'Ù…Ø¯Ø±Ø¨ ØªÙ…Ø§Ø±ÙŠÙ† HIIT ÙˆØ§Ù„ØªÙ…Ø§Ø±ÙŠÙ† Ø§Ù„Ù‡ÙˆØ§Ø¦ÙŠØ©' : 'HIIT & Cardio Coach'}</span>
            {activeTab === 'cardio_hiit' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#00A3FF] rounded-full" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'strength' ? (
            <>
              {/* Telemetry Summary Banner */}
              <div className="grid grid-cols-3 gap-2 bg-[#16191E] border border-white/5 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] font-condensed uppercase text-zinc-400">
                    {isRtl ? 'Ø§Ù„Ù†Ø¨Ø¶ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±' : 'Live Heart Rate'}
                  </span>
                  <div className="text-xl font-black font-condensed text-white flex items-baseline gap-1 mt-0.5" dir="ltr">
                    {metrics.currentHr ? `${metrics.currentHr}` : '--'}
                    <span className="text-[10px] text-[#00A3FF] font-normal">BPM</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-condensed uppercase text-zinc-400">
                    {isRtl ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø§Øª' : 'Sets Logged'}
                  </span>
                  <div className="text-xl font-black font-condensed text-white mt-0.5" dir="ltr">
                    {totalCompletedSets}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-condensed uppercase text-zinc-400">
                    {isRtl ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø­Ø¬Ù…' : 'Total Volume'}
                  </span>
                  <div className="text-xl font-black font-condensed text-[#16EC06] mt-0.5" dir="ltr">
                    {totalVolumeTonnage > 0 ? `${(totalVolumeTonnage / 1000).toFixed(1)}t` : '0 kg'}
                  </div>
                </div>
              </div>

              {/* Exercises List */}
              <div className="space-y-3">
                {exercises.length === 0 && (
                  <div className="p-6 rounded-2xl bg-[#12151A] border border-white/5 text-center space-y-2">
                    <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400 font-sans">
                      {isRtl ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ…Ø§Ø±ÙŠÙ† Ù…Ø¶Ø§ÙØ© Ø¨Ø¹Ø¯. Ø§Ø®ØªØ± ØªÙ…Ø±ÙŠÙ†Ø§Ù‹ Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø£Ø¯Ù†Ø§Ù‡ Ù„Ø¨Ø¯Ø¡ ØªØ³Ø¬ÙŠÙ„ Ù…Ø¬Ù…ÙˆØ¹Ø§ØªÙƒ.' : 'No movements added yet. Select an exercise below to begin tracking your sets.'}
                    </p>
                  </div>
                )}
                {exercises.map((ex, exIdx) => (
                  <div
                    key={ex.id}
                    className="bg-[#12151A] border border-white/5 rounded-2xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wide">
                          {ex.name}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-condensed">
                          {ex.targetMuscle}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveExercise(exIdx)}
                        className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Sets Table */}
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-12 text-[10px] font-condensed uppercase text-zinc-500 px-2">
                        <span className="col-span-2">{isRtl ? 'Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©' : 'Set'}</span>
                        <span className="col-span-4">{isRtl ? 'Ø§Ù„ÙˆØ²Ù† (ÙƒØº)' : 'Weight (kg)'}</span>
                        <span className="col-span-3">{isRtl ? 'Ø§Ù„ØªÙƒØ±Ø§Ø±' : 'Reps'}</span>
                        <span className="col-span-3 text-end">{isRtl ? 'ØªØ³Ø¬ÙŠÙ„' : 'Log'}</span>
                      </div>

                      {ex.sets.map((s, sIdx) => (
                        <div
                          key={s.id}
                          className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-lg border text-xs font-condensed transition-all ${
                            s.completed
                              ? 'bg-[#16EC06]/10 border-[#16EC06]/30 text-white'
                              : 'bg-[#16191E] border-white/5 text-zinc-300'
                          }`}
                        >
                          <span className="col-span-2 font-black">{s.setNumber}</span>
                          <div className="col-span-4">
                            <input
                              type="number"
                              disabled={s.completed}
                              value={s.weightKg}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const up = [...exercises];
                                up[exIdx].sets[sIdx].weightKg = val;
                                setExercises(up);
                              }}
                              className="w-16 bg-[#0B0D10] border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-bold"
                            />
                          </div>
                          <div className="col-span-3">
                            <input
                              type="number"
                              disabled={s.completed}
                              value={s.reps}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const up = [...exercises];
                                up[exIdx].sets[sIdx].reps = val;
                                setExercises(up);
                              }}
                              className="w-12 bg-[#0B0D10] border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-bold"
                            />
                          </div>
                          <div className="col-span-3 text-right">
                            <button
                              onClick={() => handleToggleSet(exIdx, sIdx)}
                              className={`p-1 rounded-md transition-all ${
                                s.completed
                                  ? 'bg-[#16EC06] text-black font-black'
                                  : 'bg-white/10 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddSet(exIdx)}
                      className="w-full py-1 text-[11px] font-condensed font-bold text-zinc-400 hover:text-white bg-[#16191E] rounded-lg border border-dashed border-white/10 flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isRtl ? 'Ø¥Ø¶Ø§ÙØ© Ù…Ø¬Ù…ÙˆØ¹Ø©' : 'Add Set'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Exercise Quick Selector */}
              <div className="pt-2">
                <span className="text-[11px] font-black uppercase tracking-wider font-condensed text-zinc-400 block mb-2">
                  {isRtl ? '+ Ø¥Ø¶Ø§ÙØ© ØªÙ…Ø±ÙŠÙ† Ù„Ù„Ø¬Ù„Ø³Ø©' : '+ Add Movement to Workout'}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {COMMON_EXERCISES.slice(0, 6).map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleAddExercise(item.name, item.targetMuscle)}
                      className="text-start p-2 rounded-xl bg-[#16191E] border border-white/5 hover:border-zinc-700 active:scale-95 transition-all"
                    >
                      <span className="text-xs font-bold text-white font-sans block truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-condensed block">
                        {item.targetMuscle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* HIIT Interval & Strain Coach Section */}
              <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 text-center space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-condensed font-bold uppercase tracking-wider text-zinc-400">
                    {isRtl ? 'Ù†ÙˆØ¹ Ø§Ù„ØªÙ…Ø±ÙŠÙ†' : 'Sport Mode'}
                  </span>
                  <select
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    className="bg-[#16191E] border border-white/10 text-white text-xs font-condensed font-bold px-2.5 py-1 rounded-full outline-none"
                  >
                    {CARDIO_SPORTS.map((s) => (
                      <option key={s} value={s} className="bg-black text-white">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Circular Interval Visualizer */}
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full border-4 transition-all duration-500 ${
                      intervalPhase === 'work'
                        ? 'border-[#00A3FF] animate-pulse shadow-[0_0_20px_rgba(0,147,233,0.3)]'
                        : 'border-[#16EC06] shadow-[0_0_20px_rgba(22,236,6,0.3)]'
                    }`}
                  />
                  <div className="text-center">
                    <span
                      className={`text-xs font-black uppercase font-condensed tracking-widest ${
                        intervalPhase === 'work' ? 'text-[#00A3FF]' : 'text-[#16EC06]'
                      }`}
                    >
                      {intervalPhase === 'work' ? (isRtl ? 'Ø¬Ù‡Ø¯ Ø£Ù‚ØµÙ‰' : 'WORK HARD') : (isRtl ? 'Ø§Ø³ØªØ±Ø§Ø­Ø© ÙˆØ§Ø³ØªØ´ÙØ§Ø¡' : 'REST & RECOVER')}
                    </span>
                    <div className="text-5xl font-black font-condensed text-white tabular-nums my-1" dir="ltr">
                      {secondsLeft}s
                    </div>
                    <span className="text-[11px] text-zinc-400 font-condensed">
                      {isRtl ? `Ø¬ÙˆÙ„Ø© ${round} / ${totalRounds}` : `Round ${round} / ${totalRounds}`}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setIsTimerRunning(false);
                      setSecondsLeft(workDuration);
                      setIntervalPhase('work');
                      setRound(1);
                    }}
                    className="p-3 rounded-full bg-[#16191E] text-zinc-400 hover:text-white border border-white/10 active:scale-95 transition-transform"
                    title={isRtl ? 'Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø·' : 'Reset'}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-8 py-3 rounded-full font-black font-condensed uppercase tracking-wider text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all ${
                      isTimerRunning
                        ? 'bg-[#FF3344] text-white shadow-red-500/20'
                        : 'bg-[#00A3FF] text-white shadow-[#00A3FF]/30'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isTimerRunning ? (isRtl ? 'Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª' : 'Pause Interval') : (isRtl ? 'Ø¨Ø¯Ø¡ Ø§Ù„ÙØªØ±Ø©' : 'Start Interval')}</span>
                  </button>
                </div>

                {/* Config Work / Rest Times */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="bg-[#16191E] p-2 rounded-xl text-start">
                    <span className="text-[10px] text-zinc-400 font-condensed block">
                      {isRtl ? 'ÙØªØ±Ø© Ø§Ù„Ø¬Ù‡Ø¯ (Ø«Ø§Ù†ÙŠØ©)' : 'Work Interval (s)'}
                    </span>
                    <input
                      type="number"
                      disabled={isTimerRunning}
                      value={workDuration}
                      onChange={(e) => setWorkDuration(Math.max(10, Number(e.target.value)))}
                      className="w-full bg-[#0B0D10] border border-white/10 rounded px-2 py-1 text-sm font-black text-white mt-1"
                      dir="ltr"
                    />
                  </div>
                  <div className="bg-[#16191E] p-2 rounded-xl text-start">
                    <span className="text-[10px] text-zinc-400 font-condensed block">
                      {isRtl ? 'ÙØªØ±Ø© Ø§Ù„Ø±Ø§Ø­Ø© (Ø«Ø§Ù†ÙŠØ©)' : 'Rest Interval (s)'}
                    </span>
                    <input
                      type="number"
                      disabled={isTimerRunning}
                      value={restDuration}
                      onChange={(e) => setRestDuration(Math.max(5, Number(e.target.value)))}
                      className="w-full bg-[#0B0D10] border border-white/10 rounded px-2 py-1 text-sm font-black text-white mt-1"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-white/5 bg-[#0B0D10] flex items-center justify-between text-xs font-condensed">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="w-3.5 h-3.5 text-[#00A3FF]" />
            <span dir="ltr">{isRtl ? `الجهد التراكمي: ${metrics.dailyStrain.toFixed(1)} / 21.0` : `Cumulative Day Strain: ${metrics.dailyStrain.toFixed(1)} / 21.0`}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white text-black font-black uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t('done')}
          </button>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
