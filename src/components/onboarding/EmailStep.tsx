import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, HelpCircle, X } from 'lucide-react';
import { AnimatedEnvelopeIcon, WhoopCircularButton, HeroVideoBackground } from './OnboardingMedia';

export interface EmailStepProps {
  initialEmail?: string;
  onNext: (email: string) => void;
  onBack: () => void;
  onHelp?: () => void;
  isLoading?: boolean;
}

export const EmailStep: React.FC<EmailStepProps> = ({
  initialEmail = '',
  onNext,
  onBack,
  onHelp,
  isLoading = false,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Robust email format validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isValidEmail && !isLoading) {
      onNext(email.trim());
    }
  };

  const handleHelpClick = () => {
    if (onHelp) {
      onHelp();
    } else {
      setShowHelpModal(true);
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
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 font-semibold uppercase">
          STEP 1 OF 3
        </span>

        <button
          type="button"
          onClick={handleHelpClick}
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
          {/* Tilted 3D-styled envelope icon */}
          <div className="mb-2">
            <AnimatedEnvelopeIcon />
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
            Enter Your Email
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed font-normal">
            Get started by entering your email. If you already have an account, use the same email to login.
          </p>

          {/* 3. Input Field */}
          <div className="mt-8 w-full">
            <label
              htmlFor="email-input"
              className="block text-[11px] font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2.5"
            >
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                id="email-input"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-14 bg-[#14181F] border border-white/10 rounded-2xl px-4 text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/50 transition-all shadow-inner font-sans"
              />
            </div>
          </div>
        </motion.div>
      </form>

      {/* 4. Circular Progress Action Button (Bottom-Right) */}
      <div className="relative z-10 pb-6 flex items-center justify-end">
        <WhoopCircularButton
          active={isValidEmail}
          loading={isLoading}
          label="NEXT"
          onClick={() => handleSubmit()}
        />
      </div>

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

              <h3 className="text-lg font-bold text-white">Need Help Signing In?</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                WHOOP accounts use your email address to secure your health metrics, sleep architecture, and paired hardware telemetry.
              </p>
              <ul className="mt-3 space-y-2 text-xs text-zinc-400 list-disc list-inside">
                <li>Existing users will proceed to password verification.</li>
                <li>New users will create a profile and establish biometric baselines.</li>
              </ul>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="mt-6 w-full py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider"
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
