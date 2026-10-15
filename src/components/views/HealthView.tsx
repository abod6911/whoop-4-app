import React, { useEffect, useRef } from 'react';
import type { LiveMetrics, HealthMonitorMetric, UserSettings, DeviceMetadata } from '../../types/whoop';
import { biometricEngine } from '../../utils/biometricEngine';
import {
  Activity,
  Heart,
  Wind,
  Droplet,
  Thermometer,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface HealthViewProps {
  metrics: LiveMetrics;
  healthMetrics: HealthMonitorMetric[];
  settings: UserSettings;
  metadata: DeviceMetadata;
}

export const HealthView: React.FC<HealthViewProps> = ({
  metrics,
  healthMetrics,
  settings,
  metadata,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live ECG Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let step = 0;
    const points: number[] = new Array(80).fill(40);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle dark grid
      ctx.strokeStyle = '#181D26';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Generate ECG-like waveform point if connected
      const hr = metrics.currentHr;
      let nextY = 40;
      if (hr && hr > 0) {
        step = (step + 1) % 40;
        if (step === 10) nextY = 32; // P wave
        else if (step === 15) nextY = 42; // Q
        else if (step === 17) nextY = 8; // R spike
        else if (step === 19) nextY = 65; // S
        else if (step === 25) nextY = 30; // T wave
        else nextY = 40 + (Math.sin(step * 0.2) * 1.5);
      }

      points.push(nextY);
      points.shift();

      // Draw ECG line
      ctx.beginPath();
      ctx.strokeStyle = hr && hr > 0 ? '#00F0FF' : '#52525B';
      ctx.lineWidth = 2;
      ctx.shadowColor = hr && hr > 0 ? '#00F0FF' : 'transparent';
      ctx.shadowBlur = hr && hr > 0 ? 8 : 0;

      for (let i = 0; i < points.length; i++) {
        const x = (i / (points.length - 1)) * width;
        const y = points[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing leading dot
      if (hr && hr > 0) {
        const leadX = width - 2;
        const leadY = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(leadX, leadY, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [metrics.currentHr]);

  // Stress Data
  const stressTimeline = biometricEngine.getStressTimeline();
  const stressScore = metrics.stressScore;
  const stressCategory = metrics.stressCategory;

  // Healthspan
  const { whoopAge, paceOfAging } = biometricEngine.calculateHealthspan();

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Live Scrolling Heart Rate ECG/PPG Waveform */}
      <div className="rounded-[20px] bg-[#16191E] border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                metrics.currentHr ? 'bg-[#00F0FF] animate-ping' : 'bg-zinc-600'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Live Optical PPG / ECG Stream
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-2xl font-black font-condensed text-white tabular-nums">
              {metrics.currentHr !== null ? metrics.currentHr : '--'}
            </span>
            <span className="text-[10px] text-zinc-400 font-sans">BPM</span>
          </div>
        </div>

        {/* Oscilloscope Canvas */}
        <div className="relative rounded-xl bg-[#080A0E] border border-white/5 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={380}
            height={80}
            className="w-full h-20 block"
          />
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-zinc-500">
            {metadata.connected ? '25 Hz OPTICAL PPG' : 'NO SENSOR CONNECTED'}
          </div>
        </div>
      </div>

      {/* 2. Real Autonomic Stress Monitor (0.0 to 3.0 Scale) */}
      <div className="rounded-[20px] bg-[#16191E] border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FFDE00]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Stress Monitor (0.0 - 3.0 Scale)
            </h3>
          </div>

          <span
            className={`text-xs font-black font-condensed uppercase px-2 py-0.5 rounded-full ${
              stressCategory === 'low'
                ? 'bg-[#0D3528] text-[#16EC06]'
                : stressCategory === 'medium'
                ? 'bg-[#3A2E14] text-[#FFDE00]'
                : stressCategory === 'high'
                ? 'bg-[#351515] text-[#FF8A00]'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {stressCategory ? `${stressCategory} Stress` : 'Calibrating'}
          </span>
        </div>

        {/* Half-Circle Gauge Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-4xl font-black font-condensed text-white tabular-nums">
              {stressScore !== null ? stressScore.toFixed(1) : '--'}
            </div>
            <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
              Current Autonomic Arousal
            </div>
          </div>

          {/* Scale Legend */}
          <div className="text-right text-[10px] font-mono space-y-0.5">
            <div className="text-[#16EC06]">0.0 - 0.9: Restful / Low</div>
            <div className="text-[#FFDE00]">1.0 - 1.9: Active / Medium</div>
            <div className="text-[#FF8A00]">2.0 - 3.0: High Exertion</div>
          </div>
        </div>

        {/* 24-Hour Stress Timeline Chart */}
        <div className="h-32 w-full pt-1">
          {stressTimeline.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stressTimeline} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="stressGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8A00" stopOpacity={0.6} />
                    <stop offset="50%" stopColor="#FFDE00" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#16EC06" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="timeLabel"
                  stroke="#52525B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                />
                <YAxis
                  domain={[0, 3]}
                  stroke="#52525B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  ticks={[1.0, 2.0, 3.0]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#101318',
                    borderColor: '#262B35',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: unknown) => [`${val}`, 'Stress Score']}
                />
                <ReferenceLine y={1.0} stroke="#FFDE00" strokeDasharray="2 2" />
                <ReferenceLine y={2.0} stroke="#FF8A00" strokeDasharray="2 2" />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#FFDE00"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#stressGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-sans">
              Collecting continuous stress intervals from live sensor...
            </div>
          )}
        </div>
      </div>

      {/* 3. Healthspan / Biological Age (WHOOP Age & Pace of Aging) */}
      <div className="rounded-[20px] bg-[#16191E] border border-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#16EC06]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Healthspan & Biological Age
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            CHRONOLOGICAL: {settings.age} YRS
          </span>
        </div>

        <div className="flex items-center justify-around py-2">
          {/* Glowing Green Particle Circle */}
          <div className="relative w-28 h-28 rounded-full border-2 border-[#16EC06]/30 flex flex-col items-center justify-center bg-[#0D241C]/40 shadow-[0_0_30px_rgba(22,236,6,0.15)]">
            <span className="text-4xl font-black font-condensed text-white tracking-tight tabular-nums">
              {whoopAge !== null ? whoopAge : '--'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#16EC06] font-condensed">
              WHOOP AGE
            </span>
          </div>

          {/* Pace of Aging Badge & Explanations */}
          <div className="space-y-1.5 max-w-[180px]">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D3528] text-[#16EC06] border border-[#16EC06]/30 text-xs font-black font-condensed uppercase tracking-wide">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{paceOfAging !== null ? `${paceOfAging}x Pace` : 'Calibrating'}</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              {whoopAge !== null && whoopAge < settings.age
                ? `Your biological autonomic capacity is ${settings.age - whoopAge} years younger than your calendar age.`
                : 'Maintain optimal HRV and low resting heart rate to slow cellular aging velocity.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. 5-Column Vertical Health Monitor Matrix */}
      <div className="rounded-[20px] bg-[#16191E] border border-white/5 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16EC06]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              5-Metric Vital Signs Matrix
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            30-Day Baselines
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          {healthMetrics.map((m) => {
            const isOk = m.value !== null;
            return (
              <div
                key={m.key}
                className="p-2 rounded-xl bg-[#0B0D10] border border-white/5 flex flex-col justify-between h-24"
              >
                <div className="text-[9px] font-black uppercase tracking-wider text-zinc-400 font-condensed truncate">
                  {m.key === 'respiratoryRate' ? 'RESP' : m.key === 'bloodOxygen' ? 'SPO2' : m.key === 'restingHeartRate' ? 'RHR' : m.key === 'hrv' ? 'HRV' : 'TEMP'}
                </div>

                <div className="my-auto">
                  <div className="text-sm font-black font-condensed text-white tabular-nums">
                    {m.value !== null ? m.value : '--'}
                  </div>
                  <div className="text-[9px] text-zinc-500 font-sans">{m.unit}</div>
                </div>

                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOk ? 'bg-[#16EC06]' : 'bg-zinc-600'
                    }`}
                  />
                  <span className="text-[8px] font-bold uppercase font-condensed text-zinc-400">
                    {isOk ? 'OK' : 'CALIB'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
