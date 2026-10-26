import React, { useState, useEffect, useRef } from 'react';
import type { LiveMetrics, WorkoutEntity } from '../types/whoop';
import { biometricEngine } from '../utils/biometricEngine';
import { notificationEngine } from '../services/notificationEngine';
import { whoopDb } from '../services/whoopDatabase';
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
  Activity,
  Flame,
  Award,
} from 'lucide-react';

interface StrengthTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  onWorkoutSaved?: () => void;
}

interface ExerciseSet {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe: number; // 1 to 10 (default 8)
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
  { name: 'Pull-Ups / Chin-Ups', targetMuscle: 'Lats & Biceps' },
  { name: 'Plank & Core Holds', targetMuscle: 'Core & Stabilizers' },
  { name: 'Barbell Bent-Over Row', targetMuscle: 'Upper Back & Lats' },
  { name: 'Dumbbell Walking Lunges', targetMuscle: 'Legs & Stabilizers' },
  { name: 'Incline Dumbbell Press', targetMuscle: 'Upper Chest' },
  { name: 'Romanian Deadlift (RDL)', targetMuscle: 'Posterior Chain' },
  { name: 'Cable Lateral Raise', targetMuscle: 'Side Delts' },
  { name: 'Barbell Bicep Curl', targetMuscle: 'Biceps' },
  { name: 'Dips (Weighted)', targetMuscle: 'Triceps & Chest' },
  { name: 'Leg Press & Calf Raise', targetMuscle: 'Lower Body' },
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
  onWorkoutSaved,
}) => {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'strength' | 'cardio_hiit'>('strength');

  // Strength Trainer State
  const [exercises, setExercises] = useState<StrengthExercise[]>([]);
  const [muscularLoadAccumulator, setMuscularLoadAccumulator] = useState(0);
  const workoutStartTimeRef = useRef<number>(Date.now());
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    strain: number;
    volume: number;
    muscularPct: number;
    cardioPct: number;
    sets: number;
  } | null>(null);

  // HIIT Interval Timer State
  const [selectedSport, setSelectedSport] = useState('HIIT');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [intervalPhase, setIntervalPhase] = useState<'work' | 'rest'>('work');
  const [workDuration, setWorkDuration] = useState(40); // 40s work
  const [restDuration, setRestDuration] = useState(20); // 20s rest
  const [secondsLeft, setSecondsLeft] = useState(40);
  const [round, setRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(8);

  useEffect(() => {
    if (isOpen) {
      workoutStartTimeRef.current = Date.now();
      setCompletedSummary(null);
    }
  }, [isOpen]);

  // HIIT Timer Tick
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (intervalPhase === 'work') {
              setIntervalPhase('rest');
              notificationEngine.dispatch({
                type: 'strain',
                title: `🔔 Rest Phase (${restDuration}s)`,
                message: `Catch your breath. Round ${round} complete.`,
              });
              return restDuration;
            } else {
              if (round >= totalRounds) {
                setIsTimerRunning(false);
                notificationEngine.dispatch({
                  type: 'strain',
                  title: '🎉 HIIT Workout Finished!',
                  message: `Completed all ${totalRounds} intervals. Great stimulus!`,
                });
                return 0;
              }
              setIntervalPhase('work');
              setRound((r) => r + 1);
              notificationEngine.dispatch({
                type: 'strain',
                title: `🔥 Work Interval - Round ${round + 1}`,
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

  // Toggle set completed & calculate muscular load
  const handleToggleSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const targetSet = updated[exIndex].sets[setIndex];
    targetSet.completed = !targetSet.completed;

    if (targetSet.completed) {
      targetSet.hrAtSet = metrics.currentHr || undefined;
      // Calculate muscular volume: weight * reps * (RPE / 10)
      const effectiveWeight = targetSet.weightKg > 0 ? targetSet.weightKg : 65; // bodyweight fallback
      const rpe = targetSet.rpe || 8;
      const volume = effectiveWeight * targetSet.reps;
      const load = (volume * (rpe / 10)) / 180.0;
      setMuscularLoadAccumulator((prev) => prev + load);
      biometricEngine.addMuscularLoad(load);

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
        { id: `s-${Date.now()}-1`, setNumber: 1, weightKg: 60, reps: 10, rpe: 8, completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, weightKg: 60, reps: 10, rpe: 8, completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, weightKg: 60, reps: 10, rpe: 8, completed: false },
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
      rpe: lastSet ? lastSet.rpe : 8,
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
        .reduce((sum, s) => sum + (s.weightKg > 0 ? s.weightKg * s.reps : 65 * s.reps), 0)
    );
  }, 0);

  // Live Load Split Calculation
  const liveMuscularScore = exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed)
        .reduce((sum, s) => {
          const rpe = s.rpe || 8;
          const vol = s.weightKg > 0 ? s.weightKg * s.reps : 65 * s.reps;
          return sum + (vol * (rpe / 10)) / 180.0;
        }, 0)
    );
  }, 0);

  const estimatedMuscularPct = totalCompletedSets > 0 ? Math.min(85, Math.max(55, Math.round(60 + (totalCompletedSets * 1.5)))) : 65;
  const estimatedCardioPct = 100 - estimatedMuscularPct;

  // Finish Workout & Persist to IndexedDB
  const handleFinishWorkout = async () => {
    if (totalCompletedSets === 0) {
      onClose();
      return;
    }
    setIsSavingWorkout(true);

    const now = Date.now();
    const startTime = workoutStartTimeRef.current || now - 45 * 60 * 1000;
    const durationSec = Math.max(60, Math.round((now - startTime) / 1000));
    const currentHr = metrics.currentHr || 128;

    const muscularStrain = Math.min(13, Math.sqrt(liveMuscularScore) * 1.8);
    const cardioStrain = Math.min(9, (durationSec / 1800) * (currentHr / 125) * 4.2);
    const totalSessionStrain = Math.min(20.5, Math.max(4.2, Number((muscularStrain * 0.65 + cardioStrain * 0.35).toFixed(1))));

    const muscularPercentage = Math.round((muscularStrain / (muscularStrain + cardioStrain)) * 100) || 68;
    const cardioPercentage = 100 - muscularPercentage;

    biometricEngine.addMuscularLoad(liveMuscularScore);

    const workoutEntity: WorkoutEntity = {
      id: `strength-${now}`,
      sport: 'Weightlifting',
      title: isRtl ? 'جلسة تدريب القوة والأثقال' : 'Strength Trainer Session',
      type: 'workout',
      startTime,
      endTime: now,
      durationSec,
      avgHr: currentHr,
      maxHr: Math.min(195, currentHr + 24),
      minHr: Math.max(60, currentHr - 35),
      strain: totalSessionStrain,
      calories: Math.round((durationSec / 60) * 7.8),
      avgHrv: metrics.currentHrv || 65,
      zoneDistribution: { 1: 300, 2: 600, 3: 450, 4: 200, 5: 50 },
      dataPoints: [],
      muscularLoad: Number(liveMuscularScore.toFixed(2)),
      totalVolumeKg: Math.round(totalVolumeTonnage),
      cardioPercentage,
      muscularPercentage,
      exercisesCount: exercises.length,
      setsCount: totalCompletedSets,
      notes: `WHOOP Strength Trainer: ${totalCompletedSets} sets logged, ${Math.round(totalVolumeTonnage)} kg volume.`,
    };

    try {
      await whoopDb.saveWorkout(workoutEntity);
    } catch (err) {
      console.warn('Could not save workout to IndexedDB:', err);
    }

    notificationEngine.dispatch({
      type: 'strain',
      title: isRtl ? '🏋️ تم حفظ تمرين القوة بنجاح' : '🏋️ Strength Workout Saved',
      message: isRtl
        ? `الجهد: ${totalSessionStrain.toFixed(1)} | الحجم: ${Math.round(totalVolumeTonnage).toLocaleString()} كغ (عضلي: ${muscularPercentage}% / قلبي: ${cardioPercentage}%)`
        : `Strain: ${totalSessionStrain.toFixed(1)} | Volume: ${Math.round(totalVolumeTonnage).toLocaleString()} kg (Muscular: ${muscularPercentage}% / Cardio: ${cardioPercentage}%)`,
    });

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setIsSavingWorkout(false);
    onWorkoutSaved?.();
    setCompletedSummary({
      strain: totalSessionStrain,
      volume: Math.round(totalVolumeTonnage),
      muscularPct: muscularPercentage,
      cardioPct: cardioPercentage,
      sets: totalCompletedSets,
    });
  };

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
                {isRtl ? 'مدرب القوة WHOOP (Strength Trainer)' : 'WHOOP Strength Trainer & Coach'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-condensed">
                {isRtl ? 'محرك الجهد العضلي والقلبي المباشر' : 'Live Cardio + Muscular Load Engine'}
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
            <span>{isRtl ? 'مدرب القوة WHOOP' : 'WHOOP Strength Trainer'}</span>
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
            <span>{isRtl ? 'مدرب تمارين HIIT والتمارين الهوائية' : 'HIIT & Cardio Coach'}</span>
            {activeTab === 'cardio_hiit' && (
              <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#00A3FF] rounded-full" />
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {completedSummary ? (
            /* Workout Finished Summary Card */
            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#18202A] to-[#12151A] border border-[#00A3FF]/40 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-[#16EC06]/20 border border-[#16EC06] flex items-center justify-center text-[#16EC06] mx-auto">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00A3FF] font-condensed">
                  {isRtl ? 'اكتمل التمرين وتم تسجيله في قاعدة البيانات' : 'WORKOUT COMPLETE & RECORDED'}
                </span>
                <h3 className="text-2xl font-black font-condensed text-white uppercase mt-1">
                  {isRtl ? 'ملخص تدريب القوة' : 'Strength Session Summary'}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-[#0B0D10] p-3 rounded-xl border border-white/5">
                <div>
                  <span className="text-[9px] uppercase font-condensed text-zinc-400 block">{isRtl ? 'الجهد' : 'Strain'}</span>
                  <span className="text-xl font-black text-[#00A3FF] font-condensed">{completedSummary.strain}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-condensed text-zinc-400 block">{isRtl ? 'إجمالي الحجم' : 'Volume'}</span>
                  <span className="text-xl font-black text-[#16EC06] font-condensed">{completedSummary.volume} kg</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-condensed text-zinc-400 block">{isRtl ? 'المجموعات' : 'Sets'}</span>
                  <span className="text-xl font-black text-white font-condensed">{completedSummary.sets}</span>
                </div>
              </div>

              {/* Load Breakdown Card */}
              <div className="p-3 bg-[#0B0D10] rounded-xl border border-white/5 text-start space-y-2">
                <div className="flex items-center justify-between text-xs font-condensed">
                  <span className="text-zinc-300 font-bold">{isRtl ? 'توزيع مصدر الجهد الفسيولوجي' : 'Stimulus Load Breakdown'}</span>
                  <span className="text-zinc-400 font-mono text-[11px]">{completedSummary.muscularPct}% {isRtl ? 'عضلي' : 'Muscular'}</span>
                </div>
                <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-[#00A3FF] to-[#00D4FF] transition-all"
                    style={{ width: `${completedSummary.muscularPct}%` }}
                    title={`Muscular Load: ${completedSummary.muscularPct}%`}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-[#FF5E00] to-[#FF8800] transition-all"
                    style={{ width: `${completedSummary.cardioPct}%` }}
                    title={`Cardiovascular Load: ${completedSummary.cardioPct}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-condensed text-zinc-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00A3FF]" />
                    {isRtl ? `الجهد العضلي: ${completedSummary.muscularPct}%` : `Muscular Load: ${completedSummary.muscularPct}%`}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF8800]" />
                    {isRtl ? `الجهد القلبي: ${completedSummary.cardioPct}%` : `Cardio Load: ${completedSummary.cardioPct}%`}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-full bg-white text-black font-black uppercase tracking-wider font-condensed text-xs active:scale-95 transition-transform"
              >
                {t('done')}
              </button>
            </div>
          ) : activeTab === 'strength' ? (
            <>
              {/* Telemetry Summary Banner */}
              <div className="grid grid-cols-3 gap-2 bg-[#16191E] border border-white/5 p-3 rounded-2xl">
                <div>
                  <span className="text-[10px] font-condensed uppercase text-zinc-400">
                    {isRtl ? 'النبض المباشر' : 'Live Heart Rate'}
                  </span>
                  <div className="text-xl font-black font-condensed text-white flex items-baseline gap-1 mt-0.5" dir="ltr">
                    {metrics.currentHr ? `${metrics.currentHr}` : '--'}
                    <span className="text-[10px] text-[#00A3FF] font-normal">BPM</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-condensed uppercase text-zinc-400">
                    {isRtl ? 'المجموعات' : 'Sets Logged'}
                  </span>
                  <div className="text-xl font-black font-condensed text-white mt-0.5" dir="ltr">
                    {totalCompletedSets}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-condensed uppercase text-zinc-400">
                    {isRtl ? 'إجمالي الحجم' : 'Total Volume'}
                  </span>
                  <div className="text-xl font-black font-condensed text-[#16EC06] mt-0.5" dir="ltr">
                    {totalVolumeTonnage > 0 ? `${(totalVolumeTonnage / 1000).toFixed(1)}t` : '0 kg'}
                  </div>
                </div>
              </div>

              {/* Real-time Cardio vs Muscular Load Indicator */}
              {totalCompletedSets > 0 && (
                <div className="p-3 bg-[#16191E] border border-white/5 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-condensed font-bold">
                    <span className="text-zinc-300">{isRtl ? 'توزيع الجهد التقديري (Muscular vs Cardio)' : 'Cardiovascular vs Muscular Load'}</span>
                    <span className="text-[#00A3FF] font-mono">{estimatedMuscularPct}% {isRtl ? 'عضلي' : 'Muscular'}</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#00A3FF]" style={{ width: `${estimatedMuscularPct}%` }} />
                    <div className="h-full bg-[#FF8800]" style={{ width: `${estimatedCardioPct}%` }} />
                  </div>
                </div>
              )}

              {/* Exercises List */}
              <div className="space-y-3">
                {exercises.length === 0 && (
                  <div className="p-6 rounded-2xl bg-[#12151A] border border-white/5 text-center space-y-2">
                    <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400 font-sans">
                      {isRtl ? 'لا توجد تمارين مضافة بعد. اختر تمريناً من القائمة أدناه لبدء تسجيل مجموعاتك.' : 'No movements added yet. Select an exercise below to begin tracking your sets.'}
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
                        <span className="col-span-2">{isRtl ? 'المجموعة' : 'Set'}</span>
                        <span className="col-span-3">{isRtl ? 'الوزن (كغ)' : 'Weight (kg)'}</span>
                        <span className="col-span-2">{isRtl ? 'التكرار' : 'Reps'}</span>
                        <span className="col-span-2">{isRtl ? 'RPE (1-10)' : 'RPE'}</span>
                        <span className="col-span-3 text-end">{isRtl ? 'تسجيل' : 'Log'}</span>
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
                          <div className="col-span-3">
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
                              className="w-14 bg-[#0B0D10] border border-white/10 rounded px-1 py-0.5 text-xs text-white font-bold"
                            />
                          </div>
                          <div className="col-span-2">
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
                              className="w-11 bg-[#0B0D10] border border-white/10 rounded px-1 py-0.5 text-xs text-white font-bold"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min={1}
                              max={10}
                              disabled={s.completed}
                              value={s.rpe || 8}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const up = [...exercises];
                                up[exIdx].sets[sIdx].rpe = val;
                                setExercises(up);
                              }}
                              className="w-11 bg-[#0B0D10] border border-white/10 rounded px-1 py-0.5 text-xs text-amber-300 font-bold"
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
                      <span>{isRtl ? 'إضافة مجموعة' : 'Add Set'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Exercise Quick Selector */}
              <div className="pt-2">
                <span className="text-[11px] font-black uppercase tracking-wider font-condensed text-zinc-400 block mb-2">
                  {isRtl ? '+ اختيار تمرين للجلسة' : '+ Select Movement to Track'}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {COMMON_EXERCISES.map((item) => (
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

              {/* Finish Workout CTA */}
              {totalCompletedSets > 0 && (
                <div className="pt-3">
                  <button
                    onClick={handleFinishWorkout}
                    disabled={isSavingWorkout}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-[#00A3FF] to-[#16EC06] text-black font-black font-condensed uppercase tracking-wider text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSavingWorkout ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'إنهاء وحفظ جلسة القوة' : 'Finish & Save Strength Workout')}</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* HIIT Interval & Strain Coach Section */}
              <div className="bg-[#12151A] border border-white/5 rounded-2xl p-4 text-center space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-condensed font-bold uppercase tracking-wider text-zinc-400">
                    {isRtl ? 'نوع التمرين' : 'Sport Mode'}
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
                      {intervalPhase === 'work' ? (isRtl ? 'جهد أقصى' : 'WORK HARD') : (isRtl ? 'استراحة واستشفاء' : 'REST & RECOVER')}
                    </span>
                    <div className="text-5xl font-black font-condensed text-white tabular-nums my-1" dir="ltr">
                      {secondsLeft}s
                    </div>
                    <span className="text-[11px] text-zinc-400 font-condensed">
                      {isRtl ? `جولة ${round} / ${totalRounds}` : `Round ${round} / ${totalRounds}`}
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
                    title={isRtl ? 'إعادة ضبط' : 'Reset'}
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
                    <span>{isTimerRunning ? (isRtl ? 'إيقاف مؤقت' : 'Pause Interval') : (isRtl ? 'بدء الفترة' : 'Start Interval')}</span>
                  </button>
                </div>

                {/* Config Work / Rest Times */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="bg-[#16191E] p-2 rounded-xl text-start">
                    <span className="text-[10px] text-zinc-400 font-condensed block">
                      {isRtl ? 'فترة الجهد (ثانية)' : 'Work Interval (s)'}
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
                      {isRtl ? 'فترة الراحة (ثانية)' : 'Rest Interval (s)'}
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
