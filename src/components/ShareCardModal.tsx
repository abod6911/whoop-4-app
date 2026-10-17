import React, { useRef, useState, useEffect } from 'react';
import type { LiveMetrics, SessionRecord, UserSettings } from '../types/whoop';
import {
  Share2,
  Download,
  Copy,
  Check,
  X,
  Activity,
  HeartPulse,
  Flame,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { hapticLight, hapticMedium, hapticSuccess } from '../utils/haptics';
import { localDateKey } from '../utils/dateKey';

export type ShareCardType = 'recovery' | 'strain' | 'activity';

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: ShareCardType;
  metrics: LiveMetrics;
  settings: UserSettings;
  session?: SessionRecord | null;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  isOpen,
  onClose,
  initialType = 'recovery',
  metrics,
  settings,
  session,
}) => {
  const { t, isRtl } = useLanguage();
  const [cardType, setCardType] = useState<ShareCardType>(initialType);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCardType(initialType);
    }
  }, [isOpen, initialType]);

  // Re-draw canvas whenever cardType or metrics change
  useEffect(() => {
    if (!isOpen) return;
    renderScorecardCanvas();
  }, [isOpen, cardType, metrics, settings, session, isRtl]);

  if (!isOpen) return null;

  const renderScorecardCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render at 1080 x 1920 (High-Resolution 9:16 Instagram Story Canvas)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Deep OLED Black Background
    ctx.fillStyle = '#07090C';
    ctx.fillRect(0, 0, W, H);

    // 2. Ambient Colored Radial Glow based on theme
    let primaryColor = '#16EC06'; // Green
    let glowColor = 'rgba(22, 236, 6, 0.15)';
    if (cardType === 'strain') {
      primaryColor = '#0093E9'; // Blue / Cyan
      glowColor = 'rgba(0, 147, 233, 0.15)';
    } else if (cardType === 'activity') {
      primaryColor = '#00F0FF';
      glowColor = 'rgba(0, 240, 255, 0.15)';
    } else {
      if (metrics.recoveryCategory === 'yellow') {
        primaryColor = '#FFDE00';
        glowColor = 'rgba(255, 222, 0, 0.15)';
      } else if (metrics.recoveryCategory === 'red') {
        primaryColor = '#FF0026';
        glowColor = 'rgba(255, 0, 38, 0.15)';
      }
    }

    const radial = ctx.createRadialGradient(W / 2, 600, 50, W / 2, 600, 700);
    radial.addColorStop(0, glowColor);
    radial.addColorStop(1, 'rgba(7, 9, 12, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // 3. Subtle grid lines / border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, W - 100, H - 100);

    // 4. Header: WHOOP 4.0 Emblem & Brand
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('W H O O P', W / 2, 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('4.0 BIOMETRIC SCORECARD', W / 2, 185);

    // Date & Athlete
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 22px monospace';
    ctx.fillText(`${dateStr}  •  ${(settings.name || 'ATHLETE').toUpperCase()}`, W / 2, 230);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 270);
    ctx.lineTo(W - 100, 270);
    ctx.stroke();

    // --- CARD SPECIFIC CONTENT ---
    if (cardType === 'recovery') {
      // Large Circular Recovery Gauge
      const cx = W / 2;
      const cy = 680;
      const radius = 260;

      // Track arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Filled arc
      const score = metrics.recoveryScore || 0;
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (score / 100) * (Math.PI * 2);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.stroke();

      // Recovery % in center
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 160px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(score > 0 ? `${score}%` : '--', cx, cy + 40);

      ctx.fillStyle = primaryColor;
      ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const catText = score >= 67 ? 'GREEN RECOVERY' : score >= 34 ? 'YELLOW RECOVERY' : score > 0 ? 'RED RECOVERY' : 'CALIBRATING';
      ctx.fillText(catText, cx, cy + 110);

      // Key Recovery Metrics Grid (HRV, RHR, Sleep Need)
      const gridY = 1120;
      drawStatTile(ctx, 100, gridY, 410, 180, 'HRV (RMSSD)', metrics.currentHrv ? `${metrics.currentHrv} ms` : '--', primaryColor);
      drawStatTile(ctx, 570, gridY, 410, 180, 'RESTING HR', metrics.restingHr ? `${metrics.restingHr} bpm` : '--', '#FFFFFF');

      drawStatTile(ctx, 100, gridY + 220, 410, 180, 'SLEEP PERFORMANCE', metrics.sleepPerformance ? `${metrics.sleepPerformance}%` : '--', '#7293B2');
      drawStatTile(ctx, 570, gridY + 220, 410, 180, 'RESPIRATORY RATE', metrics.respiratoryRate ? `${metrics.respiratoryRate} rpm` : '--', '#FFFFFF');

    } else if (cardType === 'strain') {
      // Large Day Strain Gauge
      const cx = W / 2;
      const cy = 680;
      const radius = 260;

      // Track arc
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Filled arc (strain out of 21.0)
      const strainVal = Number(metrics.dailyStrain.toFixed(1));
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.min(21, strainVal) / 21) * (Math.PI * 2);
      ctx.strokeStyle = '#0093E9';
      ctx.lineWidth = 36;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.stroke();

      // Strain value in center
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 160px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(strainVal.toFixed(1), cx, cy + 40);

      ctx.fillStyle = '#00B4D8';
      ctx.font = '900 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('DAY STRAIN / 21.0', cx, cy + 110);

      // Strain Stats Grid
      const gridY = 1120;
      drawStatTile(ctx, 100, gridY, 410, 180, 'ACTIVE CALORIES', `${Math.round(metrics.activeCalories)} kcal`, '#FF8A00');
      drawStatTile(ctx, 570, gridY, 410, 180, 'TOTAL CALORIES', `${Math.round(metrics.totalCalories)} kcal`, '#FFFFFF');

      drawStatTile(ctx, 100, gridY + 220, 410, 180, 'AVERAGE HR', metrics.avgHr ? `${metrics.avgHr} bpm` : '--', '#00F0FF');
      drawStatTile(ctx, 570, gridY + 220, 410, 180, 'MAX HEART RATE', metrics.maxHr ? `${metrics.maxHr} bpm` : '--', '#FF0026');

    } else {
      // Activity Breakdown Card
      const targetSession = session || {
        sport: 'Cardio Workout',
        strain: metrics.dailyStrain > 0 ? Number(metrics.dailyStrain.toFixed(1)) : 8.5,
        durationSec: 1800,
        avgHr: metrics.avgHr || 142,
        maxHr: metrics.maxHr || 168,
        calories: Math.round(metrics.activeCalories) || 240,
        avgHrv: metrics.currentHrv || 55,
      };

      const cx = W / 2;
      const cy = 600;

      // Activity Tag
      ctx.fillStyle = '#00F0FF';
      ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('COMPLETED WORKOUT', cx, 400);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText((targetSession.sport || 'WORKOUT').toUpperCase(), cx, 480);

      // Main Activity Strain Display
      ctx.fillStyle = '#0093E9';
      ctx.font = '900 170px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(targetSession.strain.toFixed(1), cx, 740);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '800 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('ACTIVITY STRAIN', cx, 810);

      const mins = Math.round(targetSession.durationSec / 60);
      const gridY = 960;
      drawStatTile(ctx, 100, gridY, 410, 180, 'DURATION', `${mins} MIN`, '#FFFFFF');
      drawStatTile(ctx, 570, gridY, 410, 180, 'CALORIES', `${targetSession.calories} KCAL`, '#FF8A00');

      drawStatTile(ctx, 100, gridY + 220, 410, 180, 'AVG HEART RATE', `${targetSession.avgHr} BPM`, '#00F0FF');
      drawStatTile(ctx, 570, gridY + 220, 410, 180, 'MAX HEART RATE', `${targetSession.maxHr} BPM`, '#FF0026');

      drawStatTile(ctx, 100, gridY + 440, 880, 160, 'AUTONOMIC HRV', `${targetSession.avgHrv} MS`, '#16EC06');
    }

    // 5. Footer Branding
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, H - 200);
    ctx.lineTo(W - 100, H - 200);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('WHOOP 4.0 TELEMETRY ENGINE', W / 2, H - 140);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '600 20px monospace';
    ctx.fillText('LIVE AT: WHOOP-4-APP.VERCEL.APP', W / 2, H - 100);
  };

  const drawStatTile = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    value: string,
    valColor: string
  ) => {
    // Tile Background
    ctx.fillStyle = '#11141A';
    ctx.fillRect(x, y, w, h);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 30, y + 55);

    // Value
    ctx.fillStyle = valColor;
    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(value, x + 30, y + 125);
  };

  // Export & Share Handlers
  const handleShareNative = async () => {
    hapticMedium();
    setIsExporting(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `whoop-${cardType}-${localDateKey()}.png`, { type: 'image/png' });

        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `WHOOP 4.0 ${cardType.toUpperCase()} Card`,
            text: `Check out my daily WHOOP 4.0 telemetry scorecard!`,
            files: [file],
          });
          hapticSuccess();
        } else if (navigator.share) {
          await navigator.share({
            title: `WHOOP 4.0 ${cardType.toUpperCase()} Card`,
            text: `My WHOOP 4.0 Biometrics: Recovery ${metrics.recoveryScore ?? '--'}% • Strain ${metrics.dailyStrain.toFixed(1)} / 21.0`,
            url: 'https://whoop-4-app.vercel.app',
          });
          hapticSuccess();
        } else {
          handleDownloadPng();
        }
        setIsExporting(false);
      }, 'image/png');
    } catch {
      setIsExporting(false);
    }
  };

  const handleDownloadPng = () => {
    hapticMedium();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `whoop-${cardType}-${localDateKey()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    hapticSuccess();
  };

  const handleCopyText = async () => {
    hapticLight();
    const recStr = metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '--';
    const strainStr = metrics.dailyStrain.toFixed(1);
    const hrvStr = metrics.currentHrv ? `${metrics.currentHrv} ms` : '--';
    const rhrStr = metrics.restingHr ? `${metrics.restingHr} bpm` : '--';

    const text = isRtl
      ? `⚡ بطاقة WHOOP 4.0 اليومية:\n• التعافي: ${recStr}\n• الجهد (Strain): ${strainStr} / 21.0\n• تقلب النبض (HRV): ${hrvStr}\n• نبض الراحة: ${rhrStr}\n\nhttps://whoop-4-app.vercel.app`
      : `⚡ WHOOP 4.0 Scorecard:\n• Recovery: ${recStr}\n• Strain: ${strainStr} / 21.0\n• HRV: ${hrvStr}\n• RHR: ${rhrStr}\n\nhttps://whoop-4-app.vercel.app`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      hapticSuccess();
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-[420px] max-h-[92vh] overflow-y-auto rounded-[28px] bg-[#12151A] border border-white/10 shadow-2xl p-4 text-white space-y-3.5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-xs font-black uppercase tracking-wider font-condensed">
              {isRtl ? 'مشاركة بطاقة الأداء الاجتماعية' : 'Social Scorecard Share'}
            </h3>
          </div>
          <button
            onClick={() => {
              hapticLight();
              onClose();
            }}
            className="p-1.5 rounded-full bg-[#1E232B] text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Type Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#0B0D10] border border-white/5 font-condensed text-xs font-black uppercase tracking-wider">
          <button
            onClick={() => {
              hapticLight();
              setCardType('recovery');
            }}
            className={`py-2 rounded-lg transition-all ${
              cardType === 'recovery'
                ? 'bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isRtl ? 'التعافي' : 'Recovery'}
          </button>
          <button
            onClick={() => {
              hapticLight();
              setCardType('strain');
            }}
            className={`py-2 rounded-lg transition-all ${
              cardType === 'strain'
                ? 'bg-[#0093E9]/20 text-[#0093E9] border border-[#0093E9]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isRtl ? 'الجهد' : 'Strain'}
          </button>
          <button
            onClick={() => {
              hapticLight();
              setCardType('activity');
            }}
            className={`py-2 rounded-lg transition-all ${
              cardType === 'activity'
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {isRtl ? 'النشاط' : 'Activity'}
          </button>
        </div>

        {/* Live Canvas Preview (Scaled down for preview) */}
        <div className="relative w-full aspect-[9/14] bg-[#07090C] rounded-2xl overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 font-condensed">
          <button
            onClick={handleShareNative}
            disabled={isExporting}
            className="w-full py-3 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all shadow-lg shadow-white/10"
          >
            <Share2 className="w-4 h-4" />
            <span>{isRtl ? 'مشاركة عبر إنستغرام وتطبيقات التواصل' : 'Share to Instagram / Stories'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPng}
              className="py-2.5 rounded-xl bg-[#1E232B] border border-white/10 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#282F3A] active:scale-98 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'حفظ الصورة (PNG)' : 'Download PNG'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 rounded-xl bg-[#1E232B] border border-white/10 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#282F3A] active:scale-98 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#16EC06]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ النص' : 'Copy Text')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
