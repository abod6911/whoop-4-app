import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartbeatBadgeProps {
  bpm: number | null;
  onWrist?: boolean | null;
  className?: string;
}

export const HeartbeatBadge: React.FC<HeartbeatBadgeProps> = ({
  bpm,
  onWrist = true,
  className = '',
}) => {
  const validBpm = bpm && bpm > 30 ? bpm : null;
  const pulseDuration = validBpm ? Math.max(0.35, 60 / validBpm) : 1.2;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181C23] border border-white/10 shadow-sm ${className}`}
    >
      <motion.div
        animate={validBpm ? { scale: [1, 1.22, 1, 1.15, 1] } : { scale: 1 }}
        transition={
          validBpm
            ? {
                duration: pulseDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
        className="flex items-center justify-center text-[#FF3344]"
      >
        <Heart className="w-3.5 h-3.5 fill-current" />
      </motion.div>

      <span className="text-xs font-black font-condensed tracking-wider text-white" dir="ltr">
        {validBpm ? `${validBpm} BPM` : onWrist === false ? 'OFF WRIST' : '-- BPM'}
      </span>

      {validBpm && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF3344] animate-ping" />
      )}
    </div>
  );
};

interface EcgWaveProps {
  bpm: number | null;
  height?: number;
  className?: string;
  speedPxPerSec?: number;
}

export const EcgWave: React.FC<EcgWaveProps> = ({
  bpm,
  height = 70,
  className = '',
  speedPxPerSec = 70,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bpmRef = useRef<number | null>(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let currentPhase = 0; // 0..1 in current cardiac cycle

    // Sample buffer for the width of the canvas
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    let width = canvas.clientWidth || 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const buffer: number[] = new Array(Math.ceil(width)).fill(0);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.clientWidth || 320;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    // Compute P-Q-R-S-T voltage (-1.0 to 1.0) for a given cycle phase (0 to 1)
    const computePQRST = (p: number): number => {
      // 0.00 - 0.12 : Isoelectric baseline
      if (p < 0.12) return 0;

      // 0.12 - 0.22 : P wave (atrial depolarization)
      if (p < 0.22) {
        const u = (p - 0.12) / 0.10;
        return 0.18 * Math.sin(u * Math.PI);
      }

      // 0.22 - 0.30 : PR segment
      if (p < 0.30) return 0;

      // 0.30 - 0.33 : Q wave (septal depolarization)
      if (p < 0.33) {
        const u = (p - 0.30) / 0.03;
        return -0.22 * Math.sin(u * Math.PI);
      }

      // 0.33 - 0.38 : R wave (ventricular depolarization peak)
      if (p < 0.38) {
        const u = (p - 0.33) / 0.05;
        return 1.0 * Math.sin(u * Math.PI);
      }

      // 0.38 - 0.43 : S wave (downward spike)
      if (p < 0.43) {
        const u = (p - 0.38) / 0.05;
        return -0.38 * Math.sin(u * Math.PI);
      }

      // 0.43 - 0.54 : ST segment
      if (p < 0.54) return 0;

      // 0.54 - 0.72 : T wave (ventricular repolarization)
      if (p < 0.72) {
        const u = (p - 0.54) / 0.18;
        return 0.32 * Math.sin(u * Math.PI);
      }

      // 0.72 - 1.00 : TP segment
      return 0;
    };

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const currentBpm = bpmRef.current && bpmRef.current > 35 ? bpmRef.current : null;
      const cycleDuration = currentBpm ? 60 / currentBpm : 1.5;

      // Advance phase by elapsed time
      if (currentBpm) {
        currentPhase = (currentPhase + dt / cycleDuration) % 1;
      } else {
        currentPhase = (currentPhase + dt / 2.0) % 1;
      }

      // Add new samples according to speedPxPerSec
      const pxToAdvance = Math.max(1, Math.round(speedPxPerSec * dt));
      for (let i = 0; i < pxToAdvance; i++) {
        const subPhase = (currentPhase + (i / pxToAdvance) * (dt / cycleDuration)) % 1;
        const val = currentBpm ? computePQRST(subPhase) : 0.04 * Math.sin(now * 0.002);
        buffer.shift();
        buffer.push(val);
      }

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridStep = 18;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw ECG Line
      const midY = height * 0.54;
      const scaleY = height * 0.42;

      ctx.save();
      ctx.strokeStyle = '#FF3344';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255, 51, 68, 0.65)';
      ctx.shadowBlur = 8;

      ctx.beginPath();
      for (let x = 0; x < buffer.length; x++) {
        const y = midY - buffer[x] * scaleY;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lead cursor point at right edge
      const lastY = midY - buffer[buffer.length - 1] * scaleY;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(buffer.length - 1, lastY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [height, speedPxPerSec]);

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl bg-[#0D1015] border border-white/5 ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="block w-full"
      />
    </div>
  );
};

export const PulsingHeartIcon: React.FC<{
  bpm?: number | null;
  size?: number;
  className?: string;
}> = ({ bpm, size = 16, className = '' }) => {
  const validBpm = bpm && bpm > 30 ? bpm : null;
  const pulseDuration = validBpm ? Math.max(0.35, 60 / validBpm) : 1.1;

  return (
    <motion.div
      animate={{
        scale: [1, 1.28, 0.95, 1.18, 1],
        filter: [
          'drop-shadow(0 0 2px rgba(255, 51, 68, 0.4))',
          'drop-shadow(0 0 10px rgba(255, 51, 68, 0.95))',
          'drop-shadow(0 0 4px rgba(255, 51, 68, 0.5))',
          'drop-shadow(0 0 9px rgba(255, 51, 68, 0.85))',
          'drop-shadow(0 0 2px rgba(255, 51, 68, 0.4))',
        ],
      }}
      transition={{
        duration: pulseDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`inline-flex items-center justify-center text-[#FF3344] ${className}`}
    >
      <Heart style={{ width: size, height: size }} className="fill-current stroke-[2]" />
    </motion.div>
  );
};

export const DynamicSvgEcgWave: React.FC<{
  className?: string;
  strokeColor?: string;
  height?: number;
}> = ({ className = '', strokeColor = '#00F0FF', height = 28 }) => {
  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
      <svg
        viewBox="0 0 300 40"
        preserveAspectRatio="none"
        className="w-full h-full stroke-current"
        style={{ color: strokeColor }}
      >
        <defs>
          <linearGradient id="ecgWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#16EC06" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0 20 L 30 20 L 35 15 L 40 25 L 45 20 L 60 20 L 65 6 L 70 34 L 75 14 L 80 20 L 100 20 L 110 12 L 120 20 L 150 20 L 180 20 L 185 15 L 190 25 L 195 20 L 210 20 L 215 6 L 220 34 L 225 14 L 230 20 L 250 20 L 260 12 L 270 20 L 300 20"
          fill="none"
          stroke="url(#ecgWaveGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, pathOffset: 0 }}
          animate={{
            pathLength: [0.6, 1, 0.6],
            pathOffset: [0, 1, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </svg>
    </div>
  );
};
