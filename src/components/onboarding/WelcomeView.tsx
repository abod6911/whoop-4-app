import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WhoopEmblemIcon } from '../WhoopLogo';

export interface WelcomeViewProps {
  onHaveDevice: () => void;
  onNoDevice: () => void;
  onSignIn?: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onHaveDevice,
  onNoDevice,
  onSignIn,
}) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [canInteract, setCanInteract] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be deferred until user interaction on mobile
      });
    }

    const timer = setTimeout(() => {
      setCanInteract(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] max-w-md mx-auto bg-[#0B0D10] text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Ambient Hero Video Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Subtle glowing fallback mesh gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#11141A] via-[#0B0D10] to-[#050608]">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-[#0093E9]/15 blur-[90px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[240px] h-[240px] rounded-full bg-[#00F0FF]/10 blur-[80px]" />
        </div>

        {!videoError && (
          <video
            ref={videoRef}
            src="/assets/hero-reel.mp4"
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => {
              // Try fallback path if first path fails
              if (videoRef.current && videoRef.current.src.endsWith('/assets/hero-reel.mp4')) {
                videoRef.current.src = '/videos/hero-reel.mp4';
              } else {
                setVideoError(true);
              }
            }}
            className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-80' : 'opacity-0'
            }`}
          />
        )}

        {/* Smooth dark gradient overlays matching official WHOOP design */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0B0D10]/80" />
      </div>

      {/* Top Bar / Ambient Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 pt-10 px-6 flex items-center justify-between"
      >
        <div className="w-8" />
        <span className="text-[10px] font-mono tracking-[0.25em] text-zinc-400 font-semibold uppercase">
          WHOOP LIFE
        </span>
        <div className="w-8" />
      </motion.div>

      {/* 2. WHOOP Branding & Centered Illuminated Logo (Fades in gently at 1s) */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto px-6 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center"
        >
          {/* Radial ambient backlight glow */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-[#0093E9]/20 via-[#00F0FF]/25 to-white/10 blur-2xl animate-pulse pointer-events-none" />

          {/* Centered illuminated WHOOP squircle emblem */}
          <div className="relative w-24 h-24 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/20 p-4 shadow-[0_0_35px_rgba(0,147,233,0.35)] flex items-center justify-center">
            <WhoopEmblemIcon size={64} variant="squircle" />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-3xl font-black uppercase tracking-[0.28em] text-white"
          >
            WHOOP
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 text-xs font-mono tracking-widest text-zinc-300 uppercase"
          >
            Always On. Never Compromise.
          </motion.p>
        </motion.div>
      </div>

      {/* 3. Action Pills & Required Subtitle (3-Second Cinematic Intro Delay) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 3.0, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 pb-8 px-6 flex flex-col gap-3 ${
          canInteract ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Subtitle: A WHOOP Device is Required */}
        <p className="text-[11px] font-mono tracking-[0.2em] text-zinc-400 text-center uppercase font-medium">
          A WHOOP Device is Required
        </p>

        {/* Primary: I HAVE A WHOOP DEVICE */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onHaveDevice}
          className="w-full h-14 rounded-full bg-white text-black font-extrabold text-sm tracking-[0.14em] uppercase shadow-[0_4px_25px_rgba(255,255,255,0.25)] hover:bg-zinc-200 transition-all flex items-center justify-center cursor-pointer"
        >
          I HAVE A WHOOP DEVICE
        </motion.button>

        {/* Secondary: I DO NOT HAVE A WHOOP DEVICE */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onNoDevice}
          className="w-full h-14 rounded-full bg-white/10 backdrop-blur-xl text-white font-bold text-sm tracking-[0.12em] uppercase border border-white/15 hover:bg-white/15 transition-all flex items-center justify-center cursor-pointer"
        >
          I DO NOT HAVE A WHOOP DEVICE
        </motion.button>

        {/* Optional Sign In Link */}
        {onSignIn && (
          <button
            onClick={onSignIn}
            className="mt-1 text-xs font-mono text-zinc-400 hover:text-white transition-colors text-center tracking-wider py-1 cursor-pointer"
          >
            Already have an account? <span className="text-[#00F0FF] underline underline-offset-4 font-semibold">Sign In</span>
          </button>
        )}
      </motion.div>
    </div>
  );
};
