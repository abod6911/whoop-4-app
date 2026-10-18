import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, HelpCircle, Activity, Heart, Moon, Flame, AlertCircle, X, Check } from 'lucide-react';
import type { UserProfile, UserSettings } from '../../types/whoop';
import { authService } from '../../services/authService';

export interface ProfileSetupStepProps {
  email: string;
  password: string;
  onBack: () => void;
  onHelp?: () => void;
  onSuccess: (profile: UserProfile) => void;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({
  email,
  password,
  onBack,
  onHelp,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState<number>(20);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Auto-calculated physiological parameters
  const calculatedMaxHr = Math.max(140, Math.min(210, 220 - (age || 20)));
  const defaultRestingHr = 60;
  const defaultHrv = 65;
  const defaultSleepNeed = 7.8;

  const isFormValid = fullName.trim().length >= 2 && age >= 14 && age <= 100 && weightKg > 30 && heightCm > 90;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const userSettings: Partial<UserSettings> = {
        name: fullName.trim(),
        gender,
        age,
        weightKg,
        heightCm,
        maxHr: calculatedMaxHr,
        restingHrBaseline: defaultRestingHr,
        hrvBaseline: defaultHrv,
        sleepNeedHours: defaultSleepNeed,
        profileConfirmed: true,
        language: 'ar',
      };

      const newProfile = await authService.signUp({
        email,
        password,
        fullName: fullName.trim(),
        settings: userSettings,
      });

      onSuccess(newProfile);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#0B0D10] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-[#0093E9]/10 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-[#00F0FF]/5 blur-[100px] pointer-events-none" />

      {/* 1. Header & Navigation */}
      <div className="relative z-10 pt-4 px-6 flex items-center justify-between flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Password"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <span className="text-[9px] font-mono tracking-[0.2em] text-[#00F0FF] uppercase bg-[#00F0FF]/10 px-3 py-1 rounded-full border border-[#00F0FF]/25 font-bold">
          STEP 3 OF 3: BASELINE CALIBRATION
        </span>

        <button
          type="button"
          onClick={() => (onHelp ? onHelp() : setShowInfoModal(true))}
          aria-label="Info"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <HelpCircle className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* 2. Visual Elements & Scrollable Form */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col"
        >
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Calibrate Your Baseline
          </h1>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-normal">
            Enter your physiological metrics so WHOOP algorithms can accurately track your daily strain, calories, and recovery from day one.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullname-input"
                className="block text-[10px] font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5"
              >
                FULL NAME
              </label>
              <input
                id="fullname-input"
                type="text"
                autoFocus
                placeholder="e.g. Mohammad"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 bg-[#14181F] border border-white/10 rounded-2xl px-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50 transition-all shadow-inner"
              />
            </div>

            {/* Gender Segmented Control */}
            <div>
              <label className="block text-[10px] font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase mb-1.5">
                BIOLOGICAL SEX (BMR CALIBRATION)
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#14181F] border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`h-10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gender === 'male'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {gender === 'male' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`h-10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    gender === 'female'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {gender === 'female' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  Female
                </button>
              </div>
            </div>

            {/* Age, Weight, Height Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Age */}
              <div>
                <label
                  htmlFor="age-input"
                  className="block text-[10px] font-mono font-bold tracking-[0.16em] text-zinc-400 uppercase mb-1.5"
                >
                  AGE
                </label>
                <div className="relative">
                  <input
                    id="age-input"
                    type="number"
                    min={14}
                    max={100}
                    value={age || ''}
                    onChange={(e) => setAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-12 bg-[#14181F] border border-white/10 rounded-2xl px-3 text-center text-white text-sm font-bold focus:outline-none focus:border-[#00F0FF] transition-all"
                  />
                </div>
              </div>

              {/* Weight (kg) */}
              <div>
                <label
                  htmlFor="weight-input"
                  className="block text-[10px] font-mono font-bold tracking-[0.16em] text-zinc-400 uppercase mb-1.5"
                >
                  WEIGHT
                </label>
                <div className="relative">
                  <input
                    id="weight-input"
                    type="number"
                    min={30}
                    max={250}
                    value={weightKg || ''}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 bg-[#14181F] border border-white/10 rounded-2xl pl-2 pr-7 text-center text-white text-sm font-bold focus:outline-none focus:border-[#00F0FF] transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 font-bold">
                    kg
                  </span>
                </div>
              </div>

              {/* Height (cm) */}
              <div>
                <label
                  htmlFor="height-input"
                  className="block text-[10px] font-mono font-bold tracking-[0.16em] text-zinc-400 uppercase mb-1.5"
                >
                  HEIGHT
                </label>
                <div className="relative">
                  <input
                    id="height-input"
                    type="number"
                    min={100}
                    max={250}
                    value={heightCm || ''}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 bg-[#14181F] border border-white/10 rounded-2xl pl-2 pr-7 text-center text-white text-sm font-bold focus:outline-none focus:border-[#00F0FF] transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 font-bold">
                    cm
                  </span>
                </div>
              </div>
            </div>

            {/* Auto-Computed Algorithm Preview Card */}
            <div className="p-3.5 rounded-2xl bg-[#14181F]/90 border border-white/10 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
                  WHOOP ALGORITHM AUTO-CALIBRATION
                </span>
                <span className="text-[9px] font-mono text-[#16EC06] bg-[#16EC06]/10 px-2 py-0.5 rounded font-bold">
                  READY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                  <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-mono text-zinc-400 uppercase">MAX HR (EST.)</div>
                    <div className="text-white font-extrabold text-xs">{calculatedMaxHr} <span className="text-[9px] text-zinc-500 font-normal">BPM</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                  <Flame className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-mono text-zinc-400 uppercase">RESTING HR BASELINE</div>
                    <div className="text-white font-extrabold text-xs">{defaultRestingHr} <span className="text-[9px] text-zinc-500 font-normal">BPM</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                  <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-mono text-zinc-400 uppercase">HRV BASELINE</div>
                    <div className="text-white font-extrabold text-xs">{defaultHrv} <span className="text-[9px] text-zinc-500 font-normal">MS</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                  <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="text-[9px] font-mono text-zinc-400 uppercase">SLEEP NEED</div>
                    <div className="text-white font-extrabold text-xs">{defaultSleepNeed} <span className="text-[9px] text-zinc-500 font-normal">HRS</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-2 text-xs font-medium text-red-400"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </div>

      {/* 4. Action Button & Account Creation */}
      <div className="relative z-10 p-6 pt-2 pb-6 bg-gradient-to-t from-[#0B0D10] via-[#0B0D10] to-transparent flex-shrink-0">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => handleSubmit()}
          disabled={!isFormValid || isSubmitting}
          className={`w-full h-14 rounded-full font-extrabold text-xs tracking-[0.16em] uppercase flex items-center justify-center transition-all cursor-pointer ${
            isFormValid && !isSubmitting
              ? 'bg-[#0093E9] text-white shadow-[0_0_25px_rgba(0,147,233,0.45)] hover:shadow-[0_0_35px_rgba(0,147,233,0.7)] hover:bg-[#00A3FF]'
              : 'bg-[#181C23] text-zinc-600 border border-white/5 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>INITIALIZING SECURE PROFILE...</span>
            </div>
          ) : (
            <span>CREATE ACCOUNT & PAIR STRAP</span>
          )}
        </motion.button>
      </div>

      {/* Physiological Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#161A22] border border-white/10 rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-[#0093E9]/20 border border-[#0093E9]/40 flex items-center justify-center mb-4 text-[#00F0FF]">
                <Activity className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white">Why Metrics Matter</h3>
              <div className="mt-3 space-y-2 text-xs text-zinc-300 leading-relaxed">
                <p>
                  WHOOP uses clinical equations to ensure your physiological data is 100% personalized:
                </p>
                <ul className="list-disc list-inside space-y-1 text-zinc-400">
                  <li><strong>BMR Calories:</strong> Mifflin-St Jeor formula requires biological sex, weight, and height.</li>
                  <li><strong>Strain:</strong> Calculated via Banister TRIMP model relative to your Max HR.</li>
                  <li><strong>HR Zones:</strong> Calibrated 5-zone thresholds based on your cardiovascular reserve.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="mt-6 w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
