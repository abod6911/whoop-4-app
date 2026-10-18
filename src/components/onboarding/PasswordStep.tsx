import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, HelpCircle, Eye, EyeOff, AlertCircle, X, KeyRound } from 'lucide-react';
import type { UserProfile } from '../../types/whoop';
import { authService } from '../../services/authService';
import { AnimatedWhoopSeal, WhoopCircularButton, HeroVideoBackground } from './OnboardingMedia';

export interface PasswordStepProps {
  email: string;
  onBack: () => void;
  onHelp?: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  onNewUserPassword: (password: string) => void;
  onForgotPassword?: () => void;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  email,
  onBack,
  onHelp,
  onLoginSuccess,
  onNewUserPassword,
  onForgotPassword,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Minimum 6 characters required
  const isPasswordValid = password.length >= 6;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isPasswordValid || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const isExisting = await authService.isEmailRegistered(email);

      if (isExisting) {
        // Authenticate existing user with cryptographic SHA-256 verification
        const profile = await authService.login(email, password);
        onLoginSuccess(profile);
      } else {
        // New account: Pass password to baseline profile setup step
        onNewUserPassword(password);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid password. Please check your credentials and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleForgotClick = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setShowForgotModal(true);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#0B0D10] text-white flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Ambient Hero Video Backdrop */}
      <HeroVideoBackground overlayOpacity={0.78} />

      {/* 1. Header & Navigation */}
      <div className="relative z-10 pt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Email"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 font-semibold uppercase">
          STEP 2 OF 3
        </span>

        <button
          type="button"
          onClick={() => (onHelp ? onHelp() : setShowHelpModal(true))}
          aria-label="Help"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <HelpCircle className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* 2. Visual Elements & Copy */}
      <form onSubmit={handleSubmit} className="relative z-10 flex-1 flex flex-col justify-center my-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-start"
        >
          {/* Animated WHOOP seal emblem */}
          <div className="mb-2">
            <AnimatedWhoopSeal />
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
            Enter Your Password
          </h1>

          {/* Subtitle & User's Email Badge */}
          <div className="mt-2 text-sm text-zinc-400 leading-relaxed font-normal">
            <span>Enter the password linked to this email to continue:</span>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#00F0FF] shadow-inner">
              <span className="truncate max-w-[240px]">{email}</span>
            </div>
          </div>

          {/* 3. Password Input & Controls */}
          <div className="mt-6 w-full">
            <label
              htmlFor="password-input"
              className="block text-[11px] font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2.5"
            >
              PASSWORD
            </label>

            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="••••••••"
                className={`w-full h-14 bg-[#14181F] border rounded-2xl pl-4 pr-12 text-white text-base placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner font-sans ${
                  errorMessage
                    ? 'border-red-500/80 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                    : 'border-white/10 focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50'
                }`}
              />

              {/* Show / Hide Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 stroke-[2]" />
                ) : (
                  <Eye className="w-5 h-5 stroke-[2]" />
                )}
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-2.5 flex items-center gap-2 text-xs font-medium text-red-400"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password Link Button */}
            <div className="mt-3.5 flex justify-start">
              <button
                type="button"
                onClick={handleForgotClick}
                className="text-[11px] font-mono font-bold tracking-[0.16em] text-[#00F0FF] hover:text-[#0093E9] uppercase hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                FORGOT PASSWORD?
              </button>
            </div>
          </div>
        </motion.div>
      </form>

      {/* 4. Circular Action Button & Progress Ring (Bottom-Right) */}
      <div className="relative z-10 pb-6 flex items-center justify-end">
        <WhoopCircularButton
          active={isPasswordValid}
          loading={isVerifying}
          label="NEXT"
          onClick={() => handleSubmit()}
        />
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
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
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-[#0093E9]/20 border border-[#0093E9]/40 flex items-center justify-center mb-4 text-[#00F0FF]">
                <KeyRound className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white">Password Recovery</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                WHOOP uses local client-side cryptographic hashing (SHA-256) stored in your device's isolated secure IndexedDB container.
              </p>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                If you forgot your password for this profile, you can either sign in with another profile or register a new one to calibrate fresh biometrics.
              </p>

              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="mt-6 w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider"
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
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
                onClick={() => setShowHelpModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-[#0093E9]/20 border border-[#0093E9]/40 flex items-center justify-center mb-4 text-[#00F0FF]">
                <HelpCircle className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-white">Password Security</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                Your password must be at least 6 characters long and is securely salted and hashed using the Web Cryptography API.
              </p>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="mt-6 w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
