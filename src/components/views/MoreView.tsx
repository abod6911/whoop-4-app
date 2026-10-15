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

  const [importStatus, setImportStatus] = useState<string | null>(null);

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

  const exportDaysToCSV = () => {
    const days = storageService.getDaysHistory();
    let csv = 'Date,Label,DayStrain,RecoveryScore,RecoveryCategory,RHR_BPM,HRV_RMSSD_ms,Calories\n';
    days.forEach((d) => {
      csv += `${d.date},${d.label},${d.dayStrain},${d.recoveryScore || ''},${d.recoveryCategory},${d.rhr || ''},${d.hrv || ''},${d.activeCalories}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whoop-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (parsed.daysHistory && Array.isArray(parsed.daysHistory)) {
            parsed.daysHistory.forEach((d: any) => {
              if (d.date) {
                storageService.saveRealDayState(d.date, {
                  dayStrain: d.dayStrain || 0,
                  activeCalories: d.activeCalories || 0,
                  rhr: d.rhr || null,
                  hrv: d.hrv || null,
                  recoveryScore: d.recoveryScore || null,
                  recoveryCategory: d.recoveryCategory || 'calibrating',
                  zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                });
              }
            });
            setImportStatus(`Successfully restored ${parsed.daysHistory.length} historical records!`);
            onRefreshSessions();
          }
        } else {
          // Parse official WHOOP physiological_cycles.csv or generic CSV
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) throw new Error('CSV is empty');
          const header = lines[0].split(',').map((h) => h.trim().toLowerCase());

          // Find column indices
          const dateIdx = header.findIndex((h) => h.includes('cycle start') || h.includes('date'));
          const recoveryIdx = header.findIndex((h) => h.includes('recovery score') || h.includes('recovery'));
          const rhrIdx = header.findIndex((h) => h.includes('resting heart rate') || h.includes('rhr'));
          const hrvIdx = header.findIndex((h) => h.includes('heart rate variability') || h.includes('hrv'));
          const strainIdx = header.findIndex((h) => h.includes('day strain') || h.includes('strain'));
          const calIdx = header.findIndex((h) => h.includes('energy burned') || h.includes('calories') || h.includes('cal'));

          let importedCount = 0;
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''));
            if (cols.length < 2) continue;

            let dateStr = cols[dateIdx >= 0 ? dateIdx : 0];
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
            else if (dateStr.includes(' ')) dateStr = dateStr.split(' ')[0];

            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

            const recVal = recoveryIdx >= 0 ? Number(cols[recoveryIdx]) : null;
            const rhrVal = rhrIdx >= 0 ? Number(cols[rhrIdx]) : null;
            const hrvVal = hrvIdx >= 0 ? Number(cols[hrvIdx]) : null;
            const strainVal = strainIdx >= 0 ? Number(cols[strainIdx]) : 0;
            const calVal = calIdx >= 0 ? Number(cols[calIdx]) : 0;

            const recCat = recVal !== null ? (recVal >= 67 ? 'green' : recVal <= 33 ? 'red' : 'yellow') : 'calibrating';

            storageService.saveRealDayState(dateStr, {
              dayStrain: isNaN(strainVal) ? 0 : strainVal,
              activeCalories: isNaN(calVal) ? 0 : calVal,
              rhr: isNaN(rhrVal as number) ? null : rhrVal,
              hrv: isNaN(hrvVal as number) ? null : hrvVal,
              recoveryScore: isNaN(recVal as number) ? null : recVal,
              recoveryCategory: recCat,
              zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            });
            importedCount++;
          }

          setImportStatus(`Imported ${importedCount} days from WHOOP CSV export!`);
          onRefreshSessions();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setImportStatus(`Import failed: ${msg}`);
      }
    };
    reader.readAsText(file);
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
          Data Import / Export & Storage Vault
        </h3>

        {/* Import Official WHOOP CSV/JSON */}
        <div className="p-3.5 rounded-xl bg-[#0B0D10] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase">
              <FileSpreadsheet className="w-4 h-4 text-[#16EC06]" />
              Import Official WHOOP Data
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">.CSV / .JSON</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Upload your official WHOOP export file (e.g. <code className="text-white">physiological_cycles.csv</code>) to restore your previous historical Recovery & Strain scores without cloud servers.
          </p>

          <label className="w-full py-2.5 rounded-xl bg-[#16191E] border border-dashed border-white/10 hover:border-zinc-500 text-xs font-bold uppercase tracking-wider text-center text-white cursor-pointer flex items-center justify-center gap-2 transition-all">
            <Download className="w-3.5 h-3.5 text-[#16EC06] rotate-180" />
            <span>Select .CSV or .JSON File</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {importStatus && (
            <div className="text-center text-xs font-bold text-[#16EC06] bg-[#16EC06]/10 border border-[#16EC06]/20 p-2 rounded-lg animate-in fade-in">
              {importStatus}
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportDaysToCSV}
            className="py-2.5 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#16EC06]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportAllData}
            className="py-2.5 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
          >
            <FileCode className="w-3.5 h-3.5 text-[#0093E9]" />
            <span>Export JSON</span>
          </button>
        </div>

        <div className="space-y-2 pt-2 border-t border-white/5">
          <button
            onClick={onResetDayCounters}
            className="w-full py-2.5 rounded-xl bg-[#0B0D10] hover:bg-[#12151A] border border-white/5 text-zinc-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FFDE00]" />
            <span>Reset Today's Strain & Counters</span>
          </button>

          <button
            onClick={handleWipeData}
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-[#FF0026] border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe Local IndexedDB Telemetry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
