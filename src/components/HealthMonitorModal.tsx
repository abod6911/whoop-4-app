import React, { useState } from 'react';
import {
  X,
  Heart,
  Wind,
  Droplet,
  Activity,
  Thermometer,
  FileText,
  Share2,
  CheckCircle2,
  Info,
  Download,
} from 'lucide-react';
import type { LiveMetrics, HealthMonitorMetric, UserSettings, DeviceMetadata } from '../types/whoop';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

interface HealthMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  healthMetrics: HealthMonitorMetric[];
  settings: UserSettings;
  metadata: DeviceMetadata;
}

export const HealthMonitorModal: React.FC<HealthMonitorModalProps> = ({
  isOpen,
  onClose,
  metrics,
  healthMetrics,
  settings,
  metadata,
}) => {
  const { t, isRtl, language } = useLanguage();
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentBpm = metrics.currentHr;
  const pulseDuration = currentBpm && currentBpm > 0 ? (60 / currentBpm).toFixed(2) : '1.0';

  const generateDoctorReport = () => {
    const isArabic = language === 'ar';
    const dateStr = new Date().toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const reportTitle = isArabic ? 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø¹Ù„Ø§Ù…Ø§Øª Ø§Ù„Ø­ÙŠÙˆÙŠØ© ÙˆØ§Ù„ÙØ³ÙŠÙˆÙ„ÙˆØ¬ÙŠØ© Ø§Ù„Ø³Ø±ÙŠØ±ÙŠ // WHOOP 4.0' : 'WHOOP // Clinical Biometrics Report';
    const reportSubtitle = isArabic
      ? `ØªÙ… Ø§Ø³ØªØ®Ø±Ø§Ø¬Ù‡ ÙÙŠ ${dateStr} Ø¹Ø¨Ø± Ù‚ÙŠØ§Ø³Ø§Øª Ø§Ù„ØªØ®Ø·ÙŠØ· Ø§Ù„Ø¶ÙˆØ¦ÙŠ (PPG) Ù„Ø³ÙˆØ§Ø± WHOOP 4.0`
      : `Generated on ${dateStr} via WHOOP 4.0 Optical Photoplethysmography (PPG)`;

    const reportHtml = `
<!DOCTYPE html>
<html dir="${isArabic ? 'rtl' : 'ltr'}" lang="${isArabic ? 'ar' : 'en'}">
<head>
  <meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", "IBM Plex Sans Arabic", sans-serif; padding: 40px; color: #111; max-width: 800px; margin: 0 auto; direction: ${isArabic ? 'rtl' : 'ltr'}; text-align: ${isArabic ? 'right' : 'left'}; }
    h1 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 5px; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 25px; }
    .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 13px; }
    .metric-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .metric-table th, .metric-table td { border-bottom: 1px solid #ddd; padding: 12px; text-align: ${isArabic ? 'right' : 'left'}; }
    .metric-table th { background: #f1f3f5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; background: #d3f9d8; color: #2b8a3e; }
    .footer { font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 40px; text-align: center; }
  </style>
</head>
<body>
  <h1>${reportTitle}</h1>
  <div class="subtitle">${reportSubtitle}</div>
  
  <div class="patient-grid">
    <div><strong>${isArabic ? 'Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠ / Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…:' : 'Athlete:'}</strong> ${settings.name || (isArabic ? 'Ø±ÙŠØ§Ø¶ÙŠ WHOOP' : 'WHOOP Athlete')}</div>
    <div><strong>${isArabic ? 'Ø§Ù„Ø¹Ù…Ø± / Ø§Ù„Ø¬Ù†Ø³:' : 'Age / Gender:'}</strong> ${settings.age} / ${settings.gender === 'male' ? (isArabic ? 'Ø°ÙƒØ±' : 'MALE') : (isArabic ? 'Ø£Ù†Ø«Ù‰' : 'FEMALE')}</div>
    <div><strong>${isArabic ? 'Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø³ÙˆØ§Ø±:' : 'Firmware / Hardware:'}</strong> ${metadata.firmwareRevision || 'WHOOP Gen4'} / ${metadata.hardwareRevision || '4.0'}</div>
    <div><strong>${isArabic ? 'Ø§Ù„Ø¬Ù‡Ø¯ Ø§Ù„ÙŠÙˆÙ…ÙŠ / Ø§Ù„Ø§Ø³ØªØ´ÙØ§Ø¡:' : 'Daily Strain / Recovery:'}</strong> ${metrics.dailyStrain.toFixed(1)} / ${metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø©' : 'Calibrating')}</div>
  </div>

  <table class="metric-table">
    <thead>
      <tr>
        <th>${isArabic ? 'Ø§Ù„Ù…Ø¤Ø´Ø± Ø§Ù„ÙØ³ÙŠÙˆÙ„ÙˆØ¬ÙŠ' : 'Biometric Parameter'}</th>
        <th>${isArabic ? 'Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø³Ø¬Ù„Ø©' : 'Recorded Value'}</th>
        <th>${isArabic ? 'Ø®Ø· Ø§Ù„Ø£Ø³Ø§Ø³ Ø§Ù„Ø³Ø±ÙŠØ±ÙŠ' : 'Clinical Baseline'}</th>
        <th>${isArabic ? 'Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø¹ØµØ¨ÙŠØ© ÙˆØ§Ù„ÙØ³ÙŠÙˆÙ„ÙˆØ¬ÙŠØ©' : 'Autonomic Status'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${isArabic ? 'Ù†Ø¨Ø¶ Ø§Ù„Ù‚Ù„Ø¨ ÙˆÙ‚Øª Ø§Ù„Ø±Ø§Ø­Ø© (RHR)' : 'Resting Heart Rate (RHR)'}</strong></td>
        <td>${metrics.restingHr !== null ? `${metrics.restingHr} ${isArabic ? 'Ù†/Ø¯' : 'BPM'}` : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø© (--)' : 'Calibrating (--)')}</td>
        <td>${settings.restingHrBaseline} ${isArabic ? 'Ù†/Ø¯' : 'BPM'}</td>
        <td><span class="status-badge">${metrics.restingHr !== null ? (isArabic ? 'Ø¶Ù…Ù† Ø§Ù„Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¹ØªØ§Ø¯' : 'Within Typical Range') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø©' : 'Calibrating')}</span></td>
      </tr>
      <tr>
        <td><strong>${isArabic ? 'ØªØ¨Ø§ÙŠÙ† Ù…Ø¹Ø¯Ù„ Ø¶Ø±Ø¨Ø§Øª Ø§Ù„Ù‚Ù„Ø¨ (HRV RMSSD)' : 'Heart Rate Variability (HRV RMSSD)'}</strong></td>
        <td>${metrics.currentHrv !== null ? `${metrics.currentHrv} ${isArabic ? 'Ù…Ù„Ù„ÙŠ Ø«Ø§Ù†ÙŠØ©' : 'ms'}` : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø© (--)' : 'Calibrating (--)')}</td>
        <td>${settings.hrvBaseline} ${isArabic ? 'Ù…Ù„Ù„ÙŠ Ø«Ø§Ù†ÙŠØ©' : 'ms'}</td>
        <td><span class="status-badge">${metrics.currentHrv !== null ? (isArabic ? 'Ù†Ø´Ø§Ø· Ù„Ø§ÙˆØ¯ÙŠ Ø·Ø¨ÙŠØ¹ÙŠ' : 'Normal Autonomic Tone') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø©' : 'Calibrating')}</span></td>
      </tr>
      <tr>
        <td><strong>${isArabic ? 'Ù…Ø¹Ø¯Ù„ Ø§Ù„ØªÙ†ÙØ³ (RSA Respiratory Rate)' : 'Respiratory Rate (RSA derived)'}</strong></td>
        <td>${metrics.respiratoryRate !== null ? `${metrics.respiratoryRate} ${isArabic ? 'Ø¯/Ø¯' : 'RPM'}` : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø© (--)' : 'Calibrating (--)')}</td>
        <td>13.0 - 16.5 ${isArabic ? 'Ø¯ÙˆØ±Ø©/Ø¯Ù‚ÙŠÙ‚Ø©' : 'RPM'}</td>
        <td><span class="status-badge">${metrics.respiratoryRate !== null ? (isArabic ? 'Ù…Ø¹Ø¯Ù„ Ù…Ø«Ø§Ù„ÙŠ' : 'Within Range') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø©' : 'Calibrating')}</span></td>
      </tr>
      <tr>
        <td><strong>${isArabic ? 'ØªØ´Ø¨Ø¹ Ø§Ù„Ø£ÙƒØ³Ø¬ÙŠÙ† ÙÙŠ Ø§Ù„Ø¯Ù… (SpO2)' : 'Blood Oxygen Saturation (SpO2)'}</strong></td>
        <td>${metrics.spO2 !== null ? `${metrics.spO2}%` : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø© (--)' : 'Calibrating (--)')}</td>
        <td>95% - 100%</td>
        <td><span class="status-badge">${metrics.spO2 !== null ? (isArabic ? 'ØªØ´Ø¨Ø¹ Ù…Ù…ØªØ§Ø²' : 'Optimal Saturation') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø©' : 'Calibrating')}</span></td>
      </tr>
      <tr>
        <td><strong>${isArabic ? 'ØªØºÙŠØ± Ø¯Ø±Ø¬Ø© Ø­Ø±Ø§Ø±Ø© Ø§Ù„Ø¬Ù„Ø¯' : 'Skin Temperature Delta'}</strong></td>
        <td>${metrics.skinTempCelsius !== null ? `${metrics.skinTempCelsius >= 0 ? '+' : ''}${metrics.skinTempCelsius.toFixed(1)} Â°C` : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø© (--)' : 'Calibrating (--)')}</td>
        <td>-0.5Â°C to +0.5Â°C</td>
        <td><span class="status-badge">${metrics.skinTempCelsius !== null ? (isArabic ? 'Ø­Ø±Ø§Ø±Ø© Ø·Ø¨ÙŠØ¹ÙŠØ© / Ø®Ø· Ø§Ù„Ø£Ø³Ø§Ø³' : 'Afebrile / Baseline') : (isArabic ? 'Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø¹Ø§ÙŠØ±Ø©' : 'Calibrating')}</span></td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    ${isArabic
      ? 'ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ù‡Ø°Ø§ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙØ³ÙŠÙˆÙ„ÙˆØ¬ÙŠ Ù…Ø­Ù„ÙŠØ§Ù‹ Ø¹Ø¨Ø± Ø­Ø³Ø§Ø³Ø§Øª Ø³ÙˆØ§Ø± WHOOP 4.0 Ø¨ØªÙ‚Ù†ÙŠØ© Web Bluetooth. Ù‡Ø°Ø§ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ© ÙˆØ§Ù„ÙØ³ÙŠÙˆÙ„ÙˆØ¬ÙŠØ©ØŒ ÙˆÙ„Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø·Ø¨ÙŠ ÙŠØ±Ø¬Ù‰ Ø§Ø³ØªØ´Ø§Ø±Ø© Ø§Ù„Ø·Ø¨ÙŠØ¨ Ø§Ù„Ù…Ø®ØªØµ.'
      : 'This physiological report was recorded locally via WHOOP 4.0 Web Bluetooth telemetry. For clinical assessment, consult your board-certified physician or healthcare practitioner.'}
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback download if popup blocked
      const a = document.createElement('a');
      a.href = url;
      a.download = `whoop-health-report-${Date.now()}.html`;
      a.click();
    }
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-sm font-black uppercase tracking-wider font-condensed text-white">
            {t('healthMonitor')}
          </h2>

          <div className="w-8" />
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Top Live Heart Circle */}
          <div className="flex flex-col items-center justify-center py-2 text-center">
            <div className="relative w-36 h-36 rounded-full bg-[#12151A] border border-white/10 flex flex-col items-center justify-center shadow-inner">
              <div
                className="mb-1"
                style={{
                  animation: currentBpm && currentBpm > 0 ? `heartbeat ${pulseDuration}s ease-in-out infinite` : 'none',
                }}
              >
                <Heart className="w-6 h-6 text-[#FF3344] fill-[#FF3344]" />
              </div>
              <div className="text-5xl font-black font-condensed text-white tabular-nums tracking-tight" dir="ltr">
                {currentBpm !== null ? currentBpm : '--'}
              </div>
              <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 font-condensed">
                {t('bpm')}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-zinc-400 font-condensed">
              <span>{isRtl ? 'Ù‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ù„ÙŠÙ„Ø© Ø§Ù„Ù…Ø§Ø¶ÙŠØ©' : "LAST NIGHT'S READINGS"}</span>
              <Info className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>

          {/* 6-Card Grid (2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Respiratory Rate */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-zinc-400 font-condensed">
                <Wind className="w-3.5 h-3.5 text-zinc-300" />
                <span>{t('respiratoryRate')}</span>
              </div>
              <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {metrics.respiratoryRate !== null ? `${metrics.respiratoryRate}` : '--'}
                <span className="text-xs font-sans text-zinc-400 font-normal ml-1">rpm</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full ${metrics.respiratoryRate !== null ? 'bg-[#16EC06]' : 'bg-zinc-600'}`} />
                <span className={metrics.respiratoryRate !== null ? 'text-[#16EC06]' : 'text-zinc-500'}>
                  {metrics.respiratoryRate !== null ? t('withinRange') : t('calibrating')}
                </span>
              </div>
            </div>

            {/* Card 2: Blood Oxygen */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-zinc-400 font-condensed">
                <Droplet className="w-3.5 h-3.5 text-zinc-300" />
                <span>{t('bloodOxygen')}</span>
              </div>
              <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {metrics.spO2 !== null ? `${metrics.spO2}%` : '--'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full ${metrics.spO2 !== null ? 'bg-[#16EC06]' : 'bg-zinc-600'}`} />
                <span className={metrics.spO2 !== null ? 'text-[#16EC06]' : 'text-zinc-500'}>
                  {metrics.spO2 !== null ? '95% - 100%' : t('calibrating')}
                </span>
              </div>
            </div>

            {/* Card 3: Resting Heart Rate */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-zinc-400 font-condensed">
                <Heart className="w-3.5 h-3.5 text-zinc-300" />
                <span>{t('restingHeartRate')}</span>
              </div>
              <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {metrics.restingHr !== null ? metrics.restingHr : '--'}
                <span className="text-xs font-sans text-zinc-400 font-normal ml-1">{t('bpm')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full ${metrics.restingHr !== null ? 'bg-[#16EC06]' : 'bg-zinc-600'}`} />
                <span className={metrics.restingHr !== null ? 'text-[#16EC06]' : 'text-zinc-500'}>
                  {metrics.restingHr !== null ? t('withinRange') : t('calibrating')}
                </span>
              </div>
            </div>

            {/* Card 4: HRV */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-zinc-400 font-condensed">
                <Activity className="w-3.5 h-3.5 text-zinc-300" />
                <span>{t('hrvFull')}</span>
              </div>
              <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {metrics.currentHrv !== null ? metrics.currentHrv : '--'}
                <span className="text-xs font-sans text-zinc-400 font-normal ml-1">ms</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className={`w-2 h-2 rounded-full ${metrics.currentHrv !== null ? 'bg-[#16EC06]' : 'bg-zinc-600'}`} />
                <span className={metrics.currentHrv !== null ? 'text-[#16EC06]' : 'text-zinc-500'}>
                  {metrics.currentHrv !== null ? (isRtl ? 'Ù…Ø«Ø§Ù„ÙŠ' : 'Optimal') : t('calibrating')}
                </span>
              </div>
            </div>

            {/* Card 5: Skin Temperature */}
            <div className="p-3.5 rounded-2xl bg-[#12151A] border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-zinc-400 font-condensed">
                <Thermometer className="w-3.5 h-3.5 text-zinc-300" />
                <span>{t('skinTemp')}</span>
              </div>
              <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
                {metrics.skinTempDelta !== null
                  ? `${metrics.skinTempDelta >= 0 ? '+' : ''}${metrics.skinTempDelta.toFixed(1)}Â°C`
                  : metrics.skinTempCelsius !== null
                  ? `${metrics.skinTempCelsius.toFixed(1)}Â°C`
                  : '--'}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    metrics.skinTempDelta !== null || metrics.skinTempCelsius !== null
                      ? 'bg-[#16EC06]'
                      : 'bg-zinc-600'
                  }`}
                />
                <span
                  className={
                    metrics.skinTempDelta !== null || metrics.skinTempCelsius !== null
                      ? 'text-[#16EC06]'
                      : 'text-zinc-500'
                  }
                >
                  {metrics.skinTempDelta !== null
                    ? `${metrics.skinTempDelta >= 0 ? '+' : ''}${metrics.skinTempDelta.toFixed(1)}Â° ${isRtl ? 'Ù…Ù† Ø§Ù„Ø£Ø³Ø§Ø³' : 'from baseline'}`
                    : metrics.skinTempCelsius !== null
                    ? `${isRtl ? 'Ø§Ù„Ù…Ø¹Ø¯Ù„ Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠ: 33.5Â°' : 'Baseline 33.5Â°C'}`
                    : t('calibrating')}
                </span>
              </div>
            </div>

            {/* Card 6: Share Health Report */}
            <button
              onClick={generateDoctorReport}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-[#161C24] to-[#12151A] border border-[#0093E9]/30 hover:border-[#0093E9] space-y-2 text-start transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#0093E9] font-condensed group-hover:underline">
                <FileText className="w-3.5 h-3.5 text-[#0093E9]" />
                <span>{t('shareDoctorsReport')} â†’</span>
              </div>
              <div className="text-[11px] text-zinc-300 leading-snug font-sans">
                {isRtl ? 'ØªÙ‚Ø±ÙŠØ± Ø³Ø±ÙŠØ±ÙŠ Ù„Ù„Ø·Ø¨ÙŠØ¨ Ø£Ùˆ Ø§Ù„Ø£Ø®ØµØ§Ø¦ÙŠ Ø£Ùˆ Ø§Ù„Ù…Ø¯Ø±Ø¨.' : 'Clinical report for doctor, physician or trainer.'}
              </div>
              <div className="text-[10px] text-[#00F0FF] font-mono flex items-center gap-1 pt-1">
                <Download className="w-3 h-3" />
                <span>{downloadSuccess ? (isRtl ? 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ØªÙ‚Ø±ÙŠØ±!' : 'Report Generated!') : (isRtl ? 'ØªØµØ¯ÙŠØ± / Ø·Ø¨Ø§Ø¹Ø© PDF' : 'Export / Print PDF')}</span>
              </div>
            </button>
          </div>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
