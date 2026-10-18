import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Lock, ShieldCheck, BatteryCharging, Bluetooth, Check, RefreshCw } from 'lucide-react';
import { WhoopEmblemIcon } from '../WhoopLogo';

/**
 * 1. Ambient Hero Video Backdrop with smooth fallback gradient & poster
 */
export const HeroVideoBackground: React.FC<{
  className?: string;
  overlayOpacity?: number;
}> = ({ className = '', overlayOpacity = 0.55 }) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be deferred until user interaction on mobile
      });
    }
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}>
      {/* Fallback ambient animated mesh gradient if video takes time to load */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#10141A] via-[#0B0D10] to-[#050608]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-[#0093E9]/10 blur-[100px] animate-pulse" />
      </div>

      {!videoFailed && (
        <video
          ref={videoRef}
          src="/assets/videos/hero-reel.mp4"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoFailed(true)}
          className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-85' : 'opacity-0'
          }`}
        />
      )}

      {/* Dark vignette overlays matching official WHOOP aesthetics */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0B0D10] via-black/40 to-black/60"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 bg-radial from-transparent via-[#0B0D10]/40 to-[#0B0D10]" />
    </div>
  );
};

/**
 * 2. Animated Circular Next Button with Blue Glow and WHOOP Spinner
 */
export const WhoopCircularButton: React.FC<{
  active: boolean;
  loading?: boolean;
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}> = ({ active, loading = false, label = 'NEXT', onClick, disabled = false }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      {label && (
        <span
          className={`text-xs font-black tracking-widest uppercase font-condensed transition-colors ${
            active && !disabled ? 'text-white' : 'text-zinc-600'
          }`}
        >
          {label}
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        disabled={!active || disabled || loading}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
          active && !disabled
            ? 'bg-[#0093E9] text-white shadow-[0_0_25px_rgba(0,147,233,0.45)] hover:shadow-[0_0_35px_rgba(0,147,233,0.7)] hover:bg-[#00A3FF]'
            : 'bg-[#181C23] text-zinc-600 border border-white/5 cursor-not-allowed'
        }`}
      >
        {/* Animated outer progress ring while active */}
        {active && !loading && (
          <svg className="absolute -inset-1 w-16 h-16 pointer-events-none -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2"
              strokeDasharray="182"
              strokeDashoffset="30"
              className="opacity-70 transition-all duration-500"
            />
          </svg>
        )}

        {/* Loading spinner */}
        {loading ? (
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <WhoopEmblemIcon size={16} className="absolute w-3 h-3 text-white" />
          </div>
        ) : (
          <ArrowRight className={`w-6 h-6 stroke-[2.5] transition-transform ${active ? 'translate-x-0.5' : ''}`} />
        )}
      </button>
    </div>
  );
};

/**
 * 3. Animated Tilted 3D Envelope Icon (Email Step)
 */
export const AnimatedEnvelopeIcon: React.FC = () => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: -6 }}
      animate={{ scale: 1, opacity: 1, rotate: -3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative w-20 h-16 flex items-center justify-center"
    >
      <div className="w-16 h-12 rounded-xl bg-gradient-to-br from-[#2A313C] to-[#12161D] border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden group">
        {/* Envelope fold styling */}
        <div className="absolute top-0 inset-x-0 h-6 border-b border-white/10 bg-gradient-to-b from-[#353D4A] to-transparent clip-path-polygon" />
        <div className="w-7 h-7 rounded-lg bg-[#0093E9]/20 flex items-center justify-center border border-[#0093E9]/40">
          <Mail className="w-4 h-4 text-[#00F0FF]" />
        </div>
      </div>
      <div className="absolute -bottom-1 inset-x-3 h-2 bg-[#00F0FF]/15 blur-md rounded-full" />
    </motion.div>
  );
};

/**
 * 4. Animated WHOOP Seal Emblem (Password Step)
 */
export const AnimatedWhoopSeal: React.FC = () => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-20 h-20 flex items-center justify-center"
    >
      {/* Outer pulsing ring */}
      <div className="absolute inset-0 rounded-full border border-dashed border-[#00F0FF]/40 animate-[spin_20s_linear_infinite]" />
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#1E232B] to-[#0B0D10] border border-white/15 flex items-center justify-center shadow-2xl shadow-[#00F0FF]/20">
        <WhoopEmblemIcon size={24} className="w-7 h-7 text-white" />
      </div>
    </motion.div>
  );
};

/**
 * 5. Pairing Step 1: Unbox Your Device Illustration
 */
export const UnboxIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[280px] h-[220px] mx-auto flex items-center justify-center gap-6">
      {/* WHOOP Strap Sensor */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-28 h-48 rounded-[28px] bg-gradient-to-b from-[#181C23] via-[#12151B] to-[#0A0C0F] border border-white/10 p-3 shadow-2xl flex flex-col items-center justify-between relative"
      >
        <div className="w-full h-8 rounded-t-xl bg-[#222731] border-b border-white/5 flex items-center justify-center">
          <span className="text-[9px] font-mono tracking-widest text-zinc-400 font-bold">WHOOP 4.0</span>
        </div>
        <div className="w-14 h-20 rounded-2xl bg-[#0B0D10] border border-white/10 flex items-center justify-center shadow-inner">
          <WhoopEmblemIcon size={24} className="w-7 h-7 text-white/90" />
        </div>
        <div className="w-full h-4 rounded-b-xl bg-[#1C2028]" />
      </motion.div>

      {/* Wireless Battery Pack */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-24 h-36 rounded-[24px] bg-gradient-to-b from-[#222731] via-[#161A22] to-[#0E1015] border border-white/10 p-2.5 shadow-2xl flex flex-col items-center justify-between"
      >
        <div className="w-3 h-1 rounded-full bg-[#16EC06] shadow-[0_0_8px_#16EC06]" />
        <div className="w-10 h-10 rounded-xl bg-[#0B0D10] border border-white/5 flex items-center justify-center">
          <BatteryCharging className="w-5 h-5 text-[#16EC06]" />
        </div>
        <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">BATTERY PACK</span>
      </motion.div>
    </div>
  );
};

/**
 * 6. Pairing Step 2: Put On Your WHOOP (Clasp Animation)
 */
export const PutOnIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[280px] h-[220px] mx-auto flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-44 h-44 rounded-full border-4 border-dashed border-zinc-700/60 flex items-center justify-center"
      >
        {/* Wrist silhouette */}
        <div className="w-32 h-32 rounded-full bg-[#13161C] border border-white/5 flex items-center justify-center">
          {/* Clasp Mechanism */}
          <motion.div
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-12 rounded-xl bg-gradient-to-r from-[#20252E] via-[#2A313E] to-[#20252E] border-2 border-white/20 shadow-2xl flex items-center justify-between px-3"
          >
            <div className="w-2 h-6 bg-zinc-600 rounded-sm" />
            <WhoopEmblemIcon size={16} className="w-4 h-4 text-white" />
            <div className="w-2 h-6 bg-zinc-600 rounded-sm" />
          </motion.div>
        </div>

        {/* Pulse indicators */}
        <div className="absolute top-2 w-3 h-3 rounded-full bg-[#00F0FF] animate-ping" />
      </motion.div>
    </div>
  );
};

/**
 * 7. Pairing Step 3: Wake Up Your WHOOP (Charger Sliding Over Sensor)
 */
export const WakeUpIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[280px] h-[220px] mx-auto flex flex-col items-center justify-center">
      {/* Sliding Battery Pack */}
      <motion.div
        animate={{ y: [0, 22, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-16 rounded-2xl bg-gradient-to-b from-[#2A313D] to-[#181C23] border border-white/20 shadow-2xl flex items-center justify-center gap-2 z-10"
      >
        <div className="w-2 h-2 rounded-full bg-[#16EC06] shadow-[0_0_10px_#16EC06]" />
        <span className="text-[9px] font-mono text-zinc-300 font-bold uppercase tracking-wider">CHARGER</span>
      </motion.div>

      {/* Sensor Pod on Strap */}
      <div className="-mt-3 w-32 h-24 rounded-3xl bg-gradient-to-b from-[#15181F] to-[#0A0C0F] border border-white/10 p-2 shadow-2xl flex items-center justify-center">
        <div className="w-20 h-14 rounded-xl bg-[#050608] border border-white/5 flex items-center justify-center">
          <WhoopEmblemIcon size={24} className="w-6 h-6 text-white/80" />
        </div>
      </div>
    </div>
  );
};

/**
 * 8. Pairing Step 4: Check for Pairing Mode (Pulsing Blue LED)
 */
export const PairingModeIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[280px] h-[220px] mx-auto flex items-center justify-center">
      {/* Side view of sensor */}
      <div className="relative w-48 h-32 rounded-3xl bg-gradient-to-r from-[#181C23] via-[#222732] to-[#12151B] border border-white/15 p-4 shadow-2xl flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-black uppercase text-white font-condensed">WHOOP 4.0</div>
          <div className="text-[9px] font-mono text-zinc-400">LED INDICATOR</div>
        </div>

        {/* Pulsing Blue LED with Glowing Target Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 rounded-full border border-[#0093E9] animate-ping opacity-75" />
          <div className="absolute w-8 h-8 rounded-full bg-[#00F0FF]/30 blur-sm animate-pulse" />
          <div className="w-4 h-4 rounded-full bg-[#00F0FF] shadow-[0_0_15px_#00F0FF]" />
        </div>
      </div>
    </div>
  );
};

/**
 * 9. Pairing Step 5: Select Your Device Illustration
 */
export const DeviceSelectedIllustration: React.FC<{ deviceName?: string }> = ({
  deviceName = 'WHOOP 4C1664807',
}) => {
  return (
    <div className="relative w-full max-w-[280px] h-[160px] mx-auto flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full p-4 rounded-2xl bg-[#141820] border-2 border-[#0093E9]/50 shadow-2xl shadow-[#0093E9]/15 flex items-center gap-3.5"
      >
        <div className="w-12 h-12 rounded-xl bg-[#0093E9]/20 border border-[#0093E9]/40 flex items-center justify-center">
          <Bluetooth className="w-6 h-6 text-[#00F0FF] animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono text-[#00F0FF] font-bold uppercase tracking-wider block">
            READY TO PAIR
          </span>
          <h4 className="text-sm font-black text-white font-condensed truncate">{deviceName}</h4>
          <span className="text-[10px] text-zinc-400 font-sans block">Tap to complete setup</span>
        </div>

        <div className="w-6 h-6 rounded-full bg-[#16EC06]/20 border border-[#16EC06]/40 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-[#16EC06] stroke-[3]" />
        </div>
      </motion.div>
    </div>
  );
};
