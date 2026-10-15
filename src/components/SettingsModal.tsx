import React, { useState } from 'react';
import type { UserSettings } from '../types/whoop';
import { storageService, type DayBaseline } from '../services/StorageService';
import {
  X,
  Sliders,
  Calendar,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onResetCounters: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
  onResetCounters,
}) => {
  const [form, setForm] = useState<UserSettings>({ ...currentSettings });
  const [baselines] = useState<DayBaseline[]>(() => storageService.get7DayBaselines());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTanakaMaxHr = () => {
    // Tanaka formula: 208 - 0.7 * age
    const est = Math.round(208 - 0.7 * form.age);
    setForm((prev) => ({ ...prev, maxHr: est }));
  };

  const handleFoxMaxHr = () => {
    // Fox formula: 220 - age
    const est = Math.round(220 - form.age);
    setForm((prev) => ({ ...prev, maxHr: est }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSaveMessage('Biometrics saved successfully!');
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1000);
  };

  const handleWipeDatabase = async () => {
    if (confirm('Warning: This will delete all recorded sessions and raw packets from IndexedDB. Proceed?')) {
      await storageService.clearRawPackets();
      alert('IndexedDB raw packets cleared.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl bg-whoop-card border border-whoop-border shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-whoop-border/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-whoop-surface text-whoop-cyan">
              <Sliders className="w-5 h-5 text-whoop-cyan" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Biometrics & Engine Settings</h2>
              <p className="text-xs text-whoop-muted">Calibrate HR zones, strain curves, and recovery baselines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-whoop-surface hover:bg-whoop-border text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Athlete Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age (Years)</label>
              <input
                type="number"
                min="14"
                max="100"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                min="35"
                max="250"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Max HR (BPM)</label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleTanakaMaxHr}
                    className="text-[10px] text-whoop-cyan hover:underline"
                    title="Tanaka formula: 208 - 0.7 * age"
                  >
                    Tanaka
                  </button>
                  <span className="text-slate-600 text-[10px]">|</span>
                  <button
                    type="button"
                    onClick={handleFoxMaxHr}
                    className="text-[10px] text-whoop-cyan hover:underline"
                    title="Fox formula: 220 - age"
                  >
                    220-Age
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="130"
                max="230"
                value={form.maxHr}
                onChange={(e) => setForm({ ...form, maxHr: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Baseline Resting HR (BPM)</label>
              <input
                type="number"
                min="35"
                max="90"
                value={form.restingHrBaseline}
                onChange={(e) => setForm({ ...form, restingHrBaseline: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Baseline HRV RMSSD (ms)</label>
              <input
                type="number"
                min="15"
                max="180"
                value={form.hrvBaseline}
                onChange={(e) => setForm({ ...form, hrvBaseline: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-whoop-bg border border-whoop-border text-xs text-white focus:outline-none focus:border-whoop-cyan font-mono"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Typical athletic baseline range is 45ms – 95ms. Used for calculating daily Recovery scores (0-100%).
              </p>
            </div>
          </div>

          {/* 7-Day Baseline History Summary */}
          <div className="pt-3 border-t border-whoop-border/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-whoop-muted mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>7-Day Rolling Baselines</span>
            </h3>

            <div className="overflow-x-auto rounded-xl bg-whoop-bg/80 border border-whoop-border/70 p-2">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-400 text-[10px] border-b border-whoop-border">
                    <th className="pb-1.5 font-normal">Date</th>
                    <th className="pb-1.5 font-normal">RHR</th>
                    <th className="pb-1.5 font-normal">HRV (RMSSD)</th>
                    <th className="pb-1.5 font-normal">Recovery</th>
                    <th className="pb-1.5 font-normal">Strain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-whoop-border/50 text-[11px]">
                  {baselines.map((b) => (
                    <tr key={b.date} className="hover:bg-whoop-surface/50">
                      <td className="py-1 text-slate-300">{b.date}</td>
                      <td className="py-1 text-white">{b.rhr} BPM</td>
                      <td className="py-1 text-whoop-cyan">{b.hrv} ms</td>
                      <td className="py-1">
                        <span
                          className={`font-bold ${
                            b.recoveryScore >= 67
                              ? 'text-whoop-green'
                              : b.recoveryScore <= 33
                              ? 'text-whoop-crimson'
                              : 'text-whoop-amber'
                          }`}
                        >
                          {b.recoveryScore}%
                        </span>
                      </td>
                      <td className="py-1 text-whoop-crimson font-bold">{b.dayStrain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-whoop-border/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetCounters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-whoop-surface hover:bg-whoop-hover text-slate-300 text-xs font-semibold border border-whoop-border transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Day Strain</span>
              </button>
              <button
                type="button"
                onClick={handleWipeDatabase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear DB</span>
              </button>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-whoop-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

          {saveMessage && (
            <div className="text-center text-xs font-bold text-whoop-green animate-pulse">
              {saveMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
