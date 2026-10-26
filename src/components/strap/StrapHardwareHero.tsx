import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../i18n/LanguageContext';
import { Zap, Vibrate, Sparkles } from 'lucide-react';
import { hapticMedium, hapticLight } from '../../utils/haptics';
import type { StrapFinish } from './StrapStatusPill';

interface StrapHardwareHeroProps {
  finish: StrapFinish;
  onFinishChange: (finish: StrapFinish) => void;
  isConnected: boolean;
  isCharging: boolean;
  onTapStrap: () => void;
  className?: string;
}

export const StrapHardwareHero: React.FC<StrapHardwareHeroProps> = ({
  finish,
  onFinishChange,
  isConnected,
  isCharging,
  onTapStrap,
  className = '',
}) => {
  const { isRtl } = useLanguage();
  const [isTapped, setIsTapped] = useState(false);

  const handleStrapClick = () => {
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 500);
    hapticMedium();
    onTapStrap();
  };

  const currentImgSrc =
    finish === 'onyx' ? '/whoop-strap-onyx.jpg' : '/whoop-strap-platinum.jpg';

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* 1. Hardware Finish Switcher (Top Right or Centered Swatches) */}
      <div className="flex items-center justify-center gap-1.5 mb-2 z-20">
        <button
          onClick={() => {
            hapticLight();
            onFinishChange('onyx');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-condensed font-black uppercase tracking-wider transition-all ${
            finish === 'onyx'
              ? 'bg-zinc-800 text-white border border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.15)] scale-105'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
          }`}
          title={isRtl ? 'سوار أونيكس أسود تيتانيوم' : 'Stealth Onyx Edition'}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-500 shadow-inner" />
          <span>{isRtl ? 'أونيكس أسود' : 'Onyx Black'}</span>
        </button>

        <button
          onClick={() => {
            hapticLight();
            onFinishChange('platinum');
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-condensed font-black uppercase tracking-wider transition-all ${
            finish === 'platinum'
              ? 'bg-zinc-800 text-white border border-[#E5E7EB]/40 shadow-[0_0_14px_rgba(229,231,235,0.25)] scale-105'
              : 'bg-white/5 text-zinc-400 hover:text-white border border-white/5'
          }`}
          title={isRtl ? 'سوار فضي بلاتينيوم مصقول' : 'Brushed Platinum Edition'}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-zinc-400 via-white to-zinc-300 border border-white shadow-sm" />
          <span>{isRtl ? 'فضي بلاتينيوم' : 'Platinum Silver'}</span>
        </button>
      </div>

      {/* 2. Floor Reflection & Biometric Studio Radial Aura */}
      <div
        className="absolute w-[290px] sm:w-[340px] h-[220px] rounded-full pointer-events-none transition-all duration-700 -z-0"
        style={{
          bottom: '10px',
          background: isConnected
            ? isCharging
              ? 'radial-gradient(ellipse at 50% 75%, rgba(0, 240, 255, 0.22) 0%, rgba(22, 236, 6, 0.15) 35%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 75%, rgba(22, 236, 6, 0.22) 0%, rgba(0, 163, 255, 0.05) 45%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 75%, rgba(0, 163, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 35%, transparent 70%)',
          filter: 'blur(28px)',
        }}
      />

      {/* 3. Hero Strap Interactive Floating Container */}
      <motion.div
        animate={{
          y: isTapped ? [0, -4, 0] : [0, -6, 0],
          scale: isTapped ? 0.97 : 1,
        }}
        transition={{
          y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.2 },
        }}
        onClick={handleStrapClick}
        className="relative cursor-pointer max-w-[270px] sm:max-w-[300px] w-full flex flex-col items-center group py-1"
        title={
          isConnected
            ? isRtl
              ? 'انقر لاختبار الاهتزاز وقراءة حالة السوار'
              : 'Tap to test haptics & trigger sensor pulse'
            : isRtl
            ? 'انقر لربط السوار'
            : 'Tap to pair strap'
        }
      >
        {/* Bare Strap Studio Photography with CSS Radial Gradient Mask (Eliminates ALL crop edges) */}
        <div
          className="relative w-full h-[250px] flex items-center justify-center overflow-hidden"
          style={{
            maskImage:
              'radial-gradient(ellipse 85% 85% at 50% 50%, black 52%, rgba(0,0,0,0.85) 75%, transparent 96%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 85% at 50% 50%, black 52%, rgba(0,0,0,0.85) 75%, transparent 96%)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={finish}
              src={currentImgSrc}
              alt={finish === 'onyx' ? 'WHOOP 4.0 Stealth Onyx' : 'WHOOP 4.0 Brushed Platinum'}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] mix-blend-lighten select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
            />
          </AnimatePresence>

          {/* Interactive Haptic Wave Ripple on Tap */}
          {isTapped && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-[#16EC06] pointer-events-none"
            />
          )}

          {/* Animated Wireless Energy Transfer Inductive Arc (when Battery Pack is Attached / Charging) */}
          {isCharging && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Energy Glow Ring */}
              <motion.div
                animate={{
                  scale: [0.85, 1.15, 0.85],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  duration: 2.0,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-36 h-36 rounded-full border border-[#00F0FF]/40 shadow-[0_0_25px_rgba(0,240,255,0.4)]"
              />

              {/* Streaming Charging Particles */}
              <motion.div
                animate={{
                  y: [-15, 5, -15],
                  opacity: [0.2, 0.8, 0.2],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-16 right-16 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-[9px] font-mono text-[#00F0FF] shadow-lg backdrop-blur-md"
              >
                <Zap className="w-2.5 h-2.5 fill-current animate-pulse text-[#00F0FF]" />
                <span>INDUCTIVE CHARGE</span>
              </motion.div>
            </div>
          )}
        </div>

        {/* Tap Prompt Hint */}
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono tracking-wider group-hover:text-zinc-300 transition-colors">
          <Vibrate className="w-3 h-3 text-[#16EC06]" />
          <span>
            {isConnected
              ? isRtl
                ? 'انقر لاختبار الاهتزاز اللمسي'
                : 'Tap for Haptic Vibration'
              : isRtl
              ? 'انقر للاقتران بالبلوتوث'
              : 'Tap to Pair via Bluetooth'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
