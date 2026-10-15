import React, { useState } from 'react';
import type { UserSettings, SessionRecord } from '../../types/whoop';
import { storageService } from '../../services/StorageService';
import {
  Sliders,
  Calendar,
  Save,
  RotateCcw,
  Trash2,
  Download,
  FileCode,
  FileSpreadsheet,
  ShieldCheck,
  User,
  Info,
} from 'lucide-react';

interface MoreViewProps {
  settings: UserSettings;
  sessions: SessionRecord[];
  onSaveSettings: (settings: UserSettings) => void;
  onResetDayCounters: () => void;
  onRefreshSessions: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  settings,
  sessions,
  onSaveSettings,
  onResetDayCounters,
  onRefreshSessions,
}) => {
  const [form, setForm] = useState<UserSettings>({ ...settings });
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleTanaka = () => {
    const max = Math.round(208 - 0.7 * form.age);
    setForm((prev) => ({ ...prev, maxHr: max }));
  };

  const handleFox = () => {
    const max = Math.round(220 - form.age);
    setForm((prev) => ({ ...prev, maxHr: max }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSaveStatus('Biometrics updated successfully!');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const exportAllData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      settings: form,
      sessions,
      daysHistory: storageService.getDaysHistory(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoop-real-telemetry-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWipeData = async () => {
    if (confirm('Warning: This will clear all recorded telemetry sessions and raw packets from IndexedDB. Proceed?')) {
      await storageService.clearRawPackets();
      onResetDayCounters();
      onRefreshSessions();
      alert('Local storage cleared.');
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* 1. Athlete Biometrics Form Card */}
      <div className="p-5 rounded-[20px] bg-[#16191E] border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#0093E9]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Athlete Profile & Biometrics
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            LOCAL ENGINE
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 font-condensed">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white focus:outline-none focus:border-[#0093E9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white focus:outline-none focus:border-[#0093E9]"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Age ({form.age} yrs)
              </label>
              <input
                type="number"
                min={12}
                max={100}
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-[#0093E9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Weight ({form.weightKg} kg)
              </label>
              <input
                type="number"
                min={30}
                max={250}
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-[#0093E9]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                Resting HR Baseline
              </label>
              <input
                type="number"
                min={30}
                max={100}
                value={form.restingHrBaseline}
                onChange={(e) => setForm({ ...form, restingHrBaseline: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-[#0093E9]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                HRV Baseline (RMSSD ms)
              </label>
              <input
                type="number"
                min={10}
                max={250}
                value={form.hrvBaseline}
                onChange={(e) => setForm({ ...form, hrvBaseline: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-[#0093E9]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase text-zinc-400">
                Max Heart Rate ({form.maxHr} BPM)
              </label>
              <div className="flex gap-2 text-[10px]">
                <button type="button" onClick={handleFox} className="text-[#0093E9] hover:underline">
                  Fox (220-age)
                </button>
                <button type="button" onClick={handleTanaka} className="text-[#0093E9] hover:underline">
                  Tanaka
                </button>
              </div>
            </div>
            <input
              type="number"
              min={120}
              max={230}
              value={form.maxHr}
              onChange={(e) => setForm({ ...form, maxHr: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0D10] border border-white/5 text-xs text-white font-mono focus:outline-none focus:border-[#0093E9]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0093E9] hover:bg-[#00B4D8] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Baselines</span>
          </button>

          {saveStatus && (
            <div className="text-center text-xs font-bold text-[#16EC06] animate-pulse">
              {saveStatus}
            </div>
          )}
        </form>
      </div>

      {/* 2. Data Management & Export Card */}
      <div className="p-5 rounded-[20px] bg-[#16191E] border border-white/5 space-y-3 font-condensed">
        <h3 className="text-xs font-black uppercase tracking-wider text-white">
          Data Export & Storage Management
        </h3>

        <div className="space-y-2">
          <button
            onClick={exportAllData}
            className="w-full py-3 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-[#0093E9]" />
            <span>Export Real Sensor Data (JSON)</span>
          </button>

          <button
            onClick={onResetDayCounters}
            className="w-full py-3 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-[#FFDE00]" />
            <span>Reset Today's Day Strain & Counters</span>
          </button>

          <button
            onClick={handleWipeData}
            className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF0026] border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Wipe Local IndexedDB Telemetry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
