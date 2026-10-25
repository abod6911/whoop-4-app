import React, { useState, useEffect } from 'react';
import { whoopBleEngine, type ImuDiagnosticTelemetry } from '../services/whoopBleEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { AnimatedStepCounter } from './AnimatedStepCounter';
import { Activity, Footprints, Radio, Zap, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ImuDiagnosticHudProps {
  className?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export const ImuDiagnosticHud: React.FC<ImuDiagnosticHudProps> = ({
  className = '',
  isCollapsible = false,
  defaultExpanded = true,
}) => {
  const { isRtl } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [diag, setDiag] = useState<ImuDiagnosticTelemetry>(() => whoopBleEngine.getImuDiagnostic());
  const [isTestPulsing, setIsTestPulsing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsub = whoopBleEngine.onImuDiagnostic((telemetry) => {
      setDiag(telemetry);
    });
    return unsub;
  }, []);

  const handleManualTestStep = () => {
    setIsTestPulsing(true);
    whoopBleEngine.testLiveStepPacket();
    setFeedback(isRtl ? '✓ خطوة اختبار (+1)' : '✓ Test Step (+1)');
    setTimeout(() => setIsTestPulsing(false), 500);
    setTimeout(() => setFeedback(null), 2500);
  };

  const isAboveThreshold = diag.currentMag >= diag.threshold;
  const magPercentage = Math.min(100, Math.max(0, (diag.currentMag / (diag.threshold * 1.5)) * 100));
  const thresholdPercentage = Math.min(100, (diag.threshold / (diag.threshold * 1.5)) * 100);

  return (
    <div
      className={`rounded-2xl bg-[#0E1116] border border-white/10 overflow-hidden shadow-xl transition-all duration-300 ${
        isAboveThreshold ? 'border-[#16EC06]/40 shadow-[0_0_20px_rgba(22,236,6,0.15)]' : ''
      } ${className}`}
    >
      {/* HUD Header */}
      <div className="p-3.5 sm:p-4 bg-[#14171D] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center">
            <Radio className={`w-4 h-4 text-[#00F0FF] ${diag.packetsPerSec > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-white font-condensed tracking-wider">
                {isRtl ? 'لوحة تشخيص حساس الحركة (IMU Live HUD)' : 'WHOOP 4.0 IMU Diagnostic HUD'}
              </span>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                  diag.packetsPerSec > 0
                    ? 'bg-[#16EC06]/20 text-[#16EC06] border border-[#16EC06]/40'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    diag.packetsPerSec > 0 ? 'bg-[#16EC06] animate-ping' : 'bg-zinc-500'
                  }`}
                />
                {diag.packetsPerSec > 0 ? `${diag.packetsPerSec} pkts/s` : 'IDLE / 0 pkts/s'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
              {isRtl
                ? 'مراقبة فورية للتدفق الخام والتسارع ومقارنة القوة بالعتبة (1.12G)'
                : 'Real-time telemetry stream, 3-axis vectors & peak threshold gating'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {feedback && (
            <span className="text-[10px] font-condensed font-bold text-[#16EC06] animate-pulse hidden sm:inline">
              {feedback}
            </span>
          )}
          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {(!isCollapsible || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-3.5 sm:p-4 space-y-3.5"
          >
            {/* Top Grid: 4 Metric Panels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Metric 1: IMU Packets / Sec */}
              <div className="p-3 rounded-xl bg-[#090B0E] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold font-condensed uppercase tracking-wider text-zinc-400 block">
                  {isRtl ? 'حزم/ثانية (Packets/Sec)' : 'IMU Packets / Sec'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black font-mono text-white tabular-nums">
                    {diag.packetsPerSec}
                  </span>
                  <span className="text-[10px] text-[#00F0FF] font-mono">Hz</span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono block truncate">
                  Total: {diag.totalPackets.toLocaleString()}
                </span>
              </div>

              {/* Metric 2: Raw Accel (X, Y, Z) */}
              <div className="p-3 rounded-xl bg-[#090B0E] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold font-condensed uppercase tracking-wider text-zinc-400 block">
                  {isRtl ? 'قيم التسارع الخام (X, Y, Z)' : 'Raw Accel (X, Y, Z)'}
                </span>
                <div className="text-[11px] font-mono font-bold text-zinc-200 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-rose-400">X:</span>
                    <span className="tabular-nums text-white">{diag.rawX}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#16EC06]">Y:</span>
                    <span className="tabular-nums text-white">{diag.rawY}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#00F0FF]">Z:</span>
                    <span className="tabular-nums text-white">{diag.rawZ}</span>
                  </div>
                </div>
              </div>

              {/* Metric 3: Current Mag (G) vs Threshold */}
              <div className="p-3 rounded-xl bg-[#090B0E] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold font-condensed uppercase tracking-wider text-zinc-400 block">
                  {isRtl ? 'القوة المحسوبة vs العتبة' : 'Current Mag (G) / Thresh'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xl font-black font-mono tabular-nums ${
                      isAboveThreshold ? 'text-[#16EC06] drop-shadow-[0_0_8px_rgba(22,236,6,0.6)]' : 'text-zinc-200'
                    }`}
                  >
                    {diag.currentMag.toFixed(3)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">G</span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                  <span>Req: {diag.threshold.toFixed(2)} G</span>
                  {isAboveThreshold ? (
                    <span className="text-[#16EC06] font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> PEAK
                    </span>
                  ) : (
                    <span className="text-zinc-500">BELOW</span>
                  )}
                </div>
              </div>

              {/* Metric 4: Total Steps Detected */}
              <div className="p-3 rounded-xl bg-[#090B0E] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold font-condensed uppercase tracking-wider text-zinc-400 block">
                  {isRtl ? 'إجمالي الخطوات المحسوبة' : 'Total Steps Detected'}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black font-mono text-[#16EC06] tabular-nums">
                    <AnimatedStepCounter value={diag.totalSteps} />
                  </span>
                  <span className="text-[10px] text-zinc-400 font-condensed font-bold uppercase">
                    {isRtl ? 'خطوة' : 'steps'}
                  </span>
                </div>
                <span className="text-[9px] text-[#00F0FF] font-mono block">
                  Cadence: {diag.cadence} SPM
                </span>
              </div>
            </div>

            {/* Acceleration Magnitude Progress Gauge */}
            <div className="p-3 rounded-xl bg-[#090B0E] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-400 font-bold uppercase font-condensed">
                  {isRtl ? 'مؤشر التسارع الحي مقابل عتبة الخطوة (1.12G)' : 'Live Vector Magnitude vs Peak Gate (1.12 G)'}
                </span>
                <span className="text-zinc-300">
                  {diag.currentMag.toFixed(3)} G / 1.68 G Max
                </span>
              </div>

              <div className="relative w-full h-3 bg-zinc-800/80 rounded-full overflow-hidden border border-white/5">
                {/* Active vector magnitude fill */}
                <motion.div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isAboveThreshold
                      ? 'bg-gradient-to-r from-[#00F0FF] to-[#16EC06]'
                      : 'bg-gradient-to-r from-zinc-600 to-[#00F0FF]'
                  }`}
                  style={{ width: `${magPercentage}%` }}
                />

                {/* Vertical 1.12 G Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_#ffffff] z-10"
                  style={{ left: `${thresholdPercentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>0.00 G (Rest)</span>
                <span className="text-white font-bold">▲ 1.12 G Threshold</span>
                <span>1.68 G+</span>
              </div>
            </div>

            {/* Test Step Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
              <div className="text-[11px] text-zinc-400 font-sans flex items-center gap-1.5 self-start sm:self-center">
                <Zap className="w-3.5 h-3.5 text-[#FFDE00]" />
                <span>
                  {isRtl
                    ? 'اختبار حلقة التفاعل الفوري في واجهة المستخدم (DSP StepDetector → UI State)'
                    : 'Instant pipeline verification: Triggers DSP step & validates end-to-end UI reactivity'}
                </span>
              </div>

              <button
                onClick={handleManualTestStep}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-condensed font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                  isTestPulsing
                    ? 'bg-[#16EC06] text-black shadow-[#16EC06]/40 scale-105'
                    : 'bg-gradient-to-r from-[#00F0FF] to-[#0093E9] text-black hover:opacity-90 shadow-cyan-500/20'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>{isRtl ? 'فحص خطوة تجريبية (+1)' : 'Test Step (+1)'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
