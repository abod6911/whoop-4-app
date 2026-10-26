import React, { useEffect, useRef } from 'react';
import type { StreakTierConfig } from '../../services/streakMilestoneEngine';

interface StreakParticleCanvasProps {
  tier: StreakTierConfig;
  burstTrigger?: number;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  phase: number;
  // Vortex / Angular properties
  angle?: number;
  dist?: number;
  radialSpeed?: number;
  // Supernova fountain
  isFountain?: boolean;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  lineWidth: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  alphaBase: number;
  speed: number;
  phase: number;
}

export const StreakParticleCanvas: React.FC<StreakParticleCanvasProps> = ({
  tier,
  burstTrigger = 0,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevBurstTriggerRef = useRef<number>(burstTrigger);
  const lastShockwaveTimeRef = useRef<number>(Date.now());

  // Particles and rings state refs to avoid recreation
  const particlesRef = useRef<Particle[]>([]);
  const ringsRef = useRef<ShockwaveRing[]>([]);
  const starsRef = useRef<Star[]>([]);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({
    width: 320,
    height: 240,
    dpr: 1,
  });

  // Spawn a milestone burst explosion
  const triggerMilestoneBurst = (centerX: number, centerY: number, currentTier: StreakTierConfig) => {
    // 1. Concentric shockwave rings
    const ringColors = [
      currentTier.colors.primary,
      currentTier.colors.secondary,
      currentTier.colors.accent || currentTier.colors.core,
    ];

    ringColors.forEach((col, idx) => {
      ringsRef.current.push({
        x: centerX,
        y: centerY,
        radius: 6 + idx * 8,
        maxRadius: Math.max(sizeRef.current.width, sizeRef.current.height) * 0.9,
        speed: 4.5 + idx * 1.5,
        alpha: 0.95,
        lineWidth: 3.5 - idx * 0.8,
        color: col,
      });
    });

    // 2. High-energy radial explosion particles
    const burstCount = 65;
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 2.0;
      const palette = currentTier.colors.particlePalette;
      const col = palette[Math.floor(Math.random() * palette.length)];

      particlesRef.current.push({
        x: centerX + Math.cos(angle) * 4,
        y: centerY + Math.sin(angle) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        radius: Math.random() * 3.0 + 1.8,
        color: col,
        alpha: 1.0,
        maxAlpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 45 + 30),
        phase: Math.random() * Math.PI,
      });
    }
  };

  // Trigger burst when prop changes
  useEffect(() => {
    if (burstTrigger !== prevBurstTriggerRef.current) {
      prevBurstTriggerRef.current = burstTrigger;
      const { width, height } = sizeRef.current;
      triggerMilestoneBurst(width / 2, height * 0.42, tier);
    }
  }, [burstTrigger, tier]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize stars for nebula modes
    const initStars = (w: number, h: number) => {
      const stars: Star[] = [];
      for (let i = 0; i < 40; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.4 + 0.6,
          alphaBase: Math.random() * 0.6 + 0.2,
          speed: Math.random() * 0.05 + 0.02,
          phase: Math.random() * Math.PI * 2,
        });
      }
      starsRef.current = stars;
    };

    // Resize handler with High-DPI support
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2 for performance
      const width = Math.max(rect.width, 240);
      const height = Math.max(rect.height, 200);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      sizeRef.current = { width, height, dpr };

      initStars(width, height);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvas);

    // Initial shockwave on mount
    triggerMilestoneBurst(sizeRef.current.width / 2, sizeRef.current.height * 0.42, tier);

    let time = 0;

    const spawnThermalParticle = (w: number, h: number, currentTier: StreakTierConfig): Particle => {
      const palette = currentTier.colors.particlePalette;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const isFountain = currentTier.canvas.supernovaFountain && Math.random() > 0.4;

      if (isFountain) {
        // Supernova fountain launches upwards from center-bottom
        return {
          x: w / 2 + (Math.random() - 0.5) * 36,
          y: h * 0.75,
          vx: (Math.random() - 0.5) * 4.2,
          vy: -(Math.random() * 4.5 + 3.0),
          radius: Math.random() * (currentTier.canvas.sizeMax - currentTier.canvas.sizeMin) + currentTier.canvas.sizeMin,
          color,
          alpha: 0,
          maxAlpha: Math.random() * 0.35 + 0.65,
          life: 0,
          maxLife: Math.floor(Math.random() * 60 + 50),
          phase: Math.random() * Math.PI * 2,
          isFountain: true,
        };
      }

      if (currentTier.canvas.vortexMode) {
        // Vortex swirl around flame center
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 85 + 25;
        return {
          x: w / 2 + Math.cos(angle) * dist,
          y: h * 0.42 + Math.sin(angle) * (dist * 0.55),
          vx: 0,
          vy: -0.4 * currentTier.canvas.baseSpeed,
          radius: Math.random() * (currentTier.canvas.sizeMax - currentTier.canvas.sizeMin) + currentTier.canvas.sizeMin,
          color,
          alpha: 0,
          maxAlpha: Math.random() * 0.4 + 0.5,
          life: 0,
          maxLife: Math.floor(Math.random() * 70 + 60),
          phase: Math.random() * Math.PI * 2,
          angle,
          dist,
          radialSpeed: (Math.random() * 0.02 + 0.015) * currentTier.canvas.baseSpeed,
        };
      }

      // Standard rising thermal embers
      const spreadX = w * 0.65;
      return {
        x: w / 2 + (Math.random() - 0.5) * spreadX,
        y: h * 0.5 + Math.random() * (h * 0.45),
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 1.2 + 0.5) * currentTier.canvas.baseSpeed,
        radius: Math.random() * (currentTier.canvas.sizeMax - currentTier.canvas.sizeMin) + currentTier.canvas.sizeMin,
        color,
        alpha: 0,
        maxAlpha: Math.random() * 0.4 + 0.5,
        life: 0,
        maxLife: Math.floor(Math.random() * 80 + 70),
        phase: Math.random() * Math.PI * 2,
      };
    };

    // 60FPS Render Loop
    const render = () => {
      time++;
      const { width, height, dpr } = sizeRef.current;
      const centerX = width / 2;
      const centerY = height * 0.42;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Nebula Aurora Backdrop if enabled
      if (tier.canvas.nebulaMode) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Cloud 1: Primary Aurora Color
        const grad1 = ctx.createRadialGradient(
          centerX + Math.sin(time * 0.015) * 50,
          centerY - 10,
          10,
          centerX,
          centerY,
          width * 0.55
        );
        grad1.addColorStop(0, tier.colors.glowRgba);
        grad1.addColorStop(0.5, 'rgba(123, 44, 191, 0.15)');
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        // Cloud 2: Secondary / Cyan Glow
        const grad2 = ctx.createRadialGradient(
          centerX - Math.cos(time * 0.012) * 45,
          centerY + 20,
          10,
          centerX,
          centerY,
          width * 0.45
        );
        grad2.addColorStop(0, 'rgba(0, 245, 212, 0.16)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, width, height);

        // Stars
        starsRef.current.forEach((s) => {
          const starAlpha = s.alphaBase + Math.sin(time * s.speed + s.phase) * 0.25;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, starAlpha)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }

      // 2. Periodic shockwaves if interval set
      if (tier.canvas.shockwaveIntervalMs > 0) {
        const now = Date.now();
        if (now - lastShockwaveTimeRef.current >= tier.canvas.shockwaveIntervalMs) {
          lastShockwaveTimeRef.current = now;
          ringsRef.current.push({
            x: centerX,
            y: centerY,
            radius: 8,
            maxRadius: width * 0.65,
            speed: 2.2,
            alpha: 0.6,
            lineWidth: 1.8,
            color: tier.colors.primary,
          });
        }
      }

      // 3. Render Shockwave Rings
      const activeRings: ShockwaveRing[] = [];
      ringsRef.current.forEach((ring) => {
        ring.radius += ring.speed;
        const progress = ring.radius / ring.maxRadius;
        ring.alpha = Math.max(0, (1 - progress) * 0.85);

        if (ring.alpha > 0.01 && ring.radius < ring.maxRadius) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.strokeStyle = ring.color;
          ctx.globalAlpha = ring.alpha;
          ctx.lineWidth = ring.lineWidth * (1 - progress * 0.4);
          ctx.stroke();
          ctx.restore();
          activeRings.push(ring);
        }
      });
      ringsRef.current = activeRings;

      // 4. Manage Particle Pool
      const targetParticleCount = tier.canvas.particleCount;
      while (particlesRef.current.length < targetParticleCount) {
        particlesRef.current.push(spawnThermalParticle(width, height, tier));
      }

      // 5. Update and Draw Particles
      const nextParticles: Particle[] = [];
      particlesRef.current.forEach((p) => {
        p.life++;

        if (p.isFountain) {
          // Supernova parabolic fountain
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.11; // Gravity
          p.vx *= 0.99;
        } else if (tier.canvas.vortexMode && p.angle !== undefined && p.dist !== undefined) {
          // Vortex spiral
          p.angle += p.radialSpeed || 0.02;
          p.dist -= 0.15;
          p.x = centerX + Math.cos(p.angle) * p.dist;
          p.y = centerY + Math.sin(p.angle) * (p.dist * 0.55);
          p.y -= 0.4; // slight upward drift
        } else {
          // Standard thermal turbulence
          p.x += p.vx + Math.sin(p.phase + time * 0.04) * (tier.canvas.turbulence * 0.35);
          p.y += p.vy;
        }

        // Fade in and out
        const lifeRatio = p.life / p.maxLife;
        if (lifeRatio < 0.2) {
          p.alpha = (lifeRatio / 0.2) * p.maxAlpha;
        } else {
          p.alpha = (1 - (lifeRatio - 0.2) / 0.8) * p.maxAlpha;
        }

        // Keep particle if alive
        if (p.life < p.maxLife && p.y > 0 && p.alpha > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.8, p.radius * (1 - lifeRatio * 0.3)), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
          ctx.shadowColor = p.color;
          ctx.shadowBlur = Math.min(8, p.radius * 2.5);
          ctx.fill();
          ctx.restore();
          nextParticles.push(p);
        } else if (nextParticles.length < targetParticleCount) {
          // Respawn
          nextParticles.push(spawnThermalParticle(width, height, tier));
        }
      });
      particlesRef.current = nextParticles;

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [tier]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full select-none ${className}`}
    />
  );
};
