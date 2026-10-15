import React, { useState } from 'react';
import type { UserSettings, SessionRecord } from '../../types/whoop';
import { storageService, type DayBaseline } from '../../services/StorageService';
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
  const [baselines] = useState<DayBaseline[]>(() => storageService.get7DayBaselines());
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
      baselines,
      sessions,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoop-complete-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleWipeData = async () => {
    if (confirm('Warning: This will clear all recorded sessions and raw packets from IndexedDB. Proceed?')) {
      await storageService.clearRawPackets();
      onRefreshSessions();
      alert('IndexedDB cleared.');
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* 1. Athlete Biometrics Form Card */}
      <div className="p-5 rounded-2xl bg-whoop-card border border-whoop-border space-y-4">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-whoop-blue" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              Athlete Profile & Biometrics
            </h3>
          </div>
          <span className="text-[10px] font-mono text-whoop-muted">
            LOCAL ENGINE
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 font-condensed">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-whoop-gray mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-blue font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-whoop-gray mb-1">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-blue font-sans"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-whoop-gray mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white font-mono focus:outline-none focus:border-whoop-blue"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-whoop-gray mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white font-mono focus:outline-none focus:border-whoop-blue"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase text-whoop-gray">Max HR (bpm)</label>
                <div className="flex gap-1 text-[9px]">
                  <button type="button" onClick={handleTanaka} className="text-[#00B4D8] hover:underline">Tanaka</button>
                  <span className="text-zinc-600">|</span>
                  <button type="button" onClick={handleFox} className="text-[#00B4D8] hover:underline">220-Age</button>
                </div>
              </div>
              <input
                type="number"
                value={form.maxHr}
                onChange={(e) => setForm({ ...form, maxHr: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white font-mono focus:outline-none focus:border-whoop-blue"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-whoop-gray mb-1">
                Baseline RHR (bpm)
              </label>
              <input
                type="number"
                value={form.restingHrBaseline}
                onChange={(e) => setForm({ ...form, restingHrBaseline: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white font-mono focus:outline-none focus:border-whoop-blue"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold uppercase text-whoop-gray mb-1">
                Baseline HRV RMSSD (ms)
              </label>
              <input
                type="number"
                value={form.hrvBaseline}
                onChange={(e) => setForm({ ...form, hrvBaseline: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-surface border border-whoop-border text-xs text-white font-mono focus:outline-none focus:border-whoop-blue"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-whoop-blue hover:bg-[#00B4D8] text-black font-black text-xs uppercase tracking-wider font-condensed flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Biometrics & Recalculate Baselines</span>
          </button>

          {saveStatus && (
            <div className="text-center text-xs font-bold text-whoop-green font-condensed animate-pulse">
              {saveStatus}
            </div>
          )}
        </form>
      </div>

      {/* 2. 7-Day Rolling Baseline History Table */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-2">
        <div className="flex items-center justify-between border-b border-whoop-border/60 pb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-whoop-blue" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              7-Day Rolling Baselines
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl bg-whoop-surface/60 border border-whoop-border p-2">
          <table className="w-full text-left font-mono text-[11px]">
            <thead>
              <tr className="text-whoop-muted text-[10px] border-b border-whoop-border/80">
                <th className="pb-1">Date</th>
                <th className="pb-1">RHR</th>
                <th className="pb-1">HRV</th>
                <th className="pb-1">Recov</th>
                <th className="pb-1">Strain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-whoop-border/40">
              {baselines.map((b) => (
                <tr key={b.date} className="hover:bg-whoop-surface">
                  <td className="py-1 text-whoop-gray">{b.date.slice(5)}</td>
                  <td className="py-1 text-white">{b.rhr}</td>
                  <td className="py-1 text-[#00B4D8]">{b.hrv}ms</td>
                  <td className="py-1 font-bold" style={{ color: b.recoveryScore >= 67 ? '#16EC06' : b.recoveryScore >= 34 ? '#FFDE00' : '#FF0026' }}>
                    {b.recoveryScore}%
                  </td>
                  <td className="py-1 text-whoop-blue font-bold">{b.dayStrain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Data Management & Export Card */}
      <div className="p-4 rounded-2xl bg-whoop-card border border-whoop-border space-y-3 font-condensed">
        <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-whoop-border/60 pb-2">
          Offline Data Management
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={exportAllData}
            className="py-2.5 px-3 rounded-xl bg-whoop-surface hover:bg-whoop-border text-white border border-whoop-border font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-whoop-blue" />
            <span>Export Backup (JSON)</span>
          </button>

          <button
            onClick={onResetDayCounters}
            className="py-2.5 px-3 rounded-xl bg-whoop-surface hover:bg-whoop-border text-whoop-gray hover:text-white border border-whoop-border font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Day Strain</span>
          </button>
        </div>

        <button
          onClick={handleWipeData}
          className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-whoop-red border border-whoop-red/30 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Wipe IndexedDB Database</span>
        </button>
      </div>
    </div>
  );
};
