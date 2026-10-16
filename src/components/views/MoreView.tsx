import React, { useState } from 'react';
import type { UserSettings, SessionRecord, DeviceMetadata, GattServiceInfo, RawBlePacket } from '../../types/whoop';
import { storageService } from '../../services/StorageService';
import { StrapLabView } from './StrapLabView';
import {
  ChevronRight,
  ChevronLeft,
  Smartphone,
  User,
  Sliders,
  ShieldCheck,
  HelpCircle,
  Info,
  Download,
  Upload,
  RotateCcw,
  Save,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { whoopBleEngine } from '../../services/whoopBleEngine';

interface MoreViewProps {
  settings: UserSettings;
  sessions: SessionRecord[];
  metadata: DeviceMetadata;
  services: GattServiceInfo[];
  packets: RawBlePacket[];
  onConnectBle: (mode?: 'filtered' | 'all') => void;
  onDisconnectBle: () => void;
  onClearPackets: () => void;
  onSaveSettings: (settings: UserSettings) => void;
  onResetDayCounters: () => void;
  onRefreshSessions: () => void;
  onOpenNotifications?: () => void;
}

type SubScreen = 'menu' | 'device' | 'account' | 'app_settings' | 'privacy' | 'tutorials' | 'about';

export const MoreView: React.FC<MoreViewProps> = ({
  settings,
  sessions,
  metadata,
  services,
  packets,
  onConnectBle,
  onDisconnectBle,
  onClearPackets,
  onSaveSettings,
  onResetDayCounters,
  onRefreshSessions,
  onOpenNotifications,
}) => {
  const [subScreen, setSubScreen] = useState<SubScreen>('menu');
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
                  recoveryScore: d.recoveryScore || null,
                  recoveryCategory: d.recoveryCategory || 'calibrating',
                  rhr: d.rhr || null,
                  hrv: d.hrv || null,
                  activeCalories: d.activeCalories || 0,
                  zoneSeconds: d.zoneSeconds || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                });
              }
            });
          }
          if (parsed.settings) {
            onSaveSettings(parsed.settings);
            setForm(parsed.settings);
          }
          setImportStatus('JSON backup successfully imported!');
          onRefreshSessions();
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n');
          let importedCount = 0;
          lines.slice(1).forEach((line) => {
            const cols = line.split(',');
            if (cols.length >= 7 && cols[0]) {
              const date = cols[0].trim();
              const dayStrain = parseFloat(cols[2]) || 0;
              const recoveryScore = parseInt(cols[3], 10) || null;
              const rhr = parseInt(cols[5], 10) || null;
              const hrv = parseInt(cols[6], 10) || null;
              const cal = parseInt(cols[7], 10) || 0;

              let cat: any = 'calibrating';
              if (recoveryScore !== null) {
                cat = recoveryScore >= 67 ? 'green' : recoveryScore >= 34 ? 'yellow' : 'red';
              }

              storageService.saveRealDayState(date, {
                dayStrain,
                recoveryScore,
                recoveryCategory: cat,
                rhr,
                hrv,
                activeCalories: cal,
                zoneSeconds: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              });
              importedCount++;
            }
          });
          setImportStatus(`Successfully parsed ${importedCount} days from WHOOP CSV!`);
          onRefreshSessions();
        }
      } catch (err) {
        setImportStatus('Error parsing file: ' + String(err));
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-300">
      {/* SubScreen Back Navigation */}
      {subScreen !== 'menu' && (
        <button
          onClick={() => setSubScreen('menu')}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider font-condensed text-zinc-400 hover:text-white transition-colors pt-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>BACK TO MORE MENU</span>
        </button>
      )}

      {/* 1. MAIN MENU SCREEN (02:43 in Video) */}
      {subScreen === 'menu' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">More</h2>
            <p className="text-xs text-zinc-400 font-sans">
              Manage WHOOP 4.0 hardware, biometric baselines, and data.
            </p>
          </div>

          <div className="rounded-[24px] bg-[#12151A] border border-white/5 divide-y divide-white/5 overflow-hidden">
            {/* DEVICE SETTINGS */}
            <button
              onClick={() => setSubScreen('device')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5 text-[#0093E9]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    DEVICE SETTINGS
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {metadata.connected ? `${metadata.name} (Connected • ${metadata.batteryLevel ?? '--'}%)` : 'Strap Disconnected'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* MY ACCOUNT */}
            <button
              onClick={() => setSubScreen('account')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <User className="w-5 h-5 text-[#16EC06]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    MY ACCOUNT
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {settings.name || 'Athlete'} • Baselines & Physiology
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* APP SETTINGS */}
            <button
              onClick={() => setSubScreen('app_settings')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Sliders className="w-5 h-5 text-[#7293B2]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    APP SETTINGS
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Notifications, Data Vault & Reset
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* PRIVACY SETTINGS */}
            <button
              onClick={() => setSubScreen('privacy')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-[#FFDE00]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    PRIVACY SETTINGS
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    100% Offline Local BLE Storage
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* TUTORIALS */}
            <button
              onClick={() => setSubScreen('tutorials')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <HelpCircle className="w-5 h-5 text-[#00F0FF]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    TUTORIALS
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Sensor Placement, HRV & Charging
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            {/* ABOUT */}
            <button
              onClick={() => setSubScreen('about')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Info className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    ABOUT
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    WHOOP 4.0 Local Web Bluetooth
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Official App Version Footer */}
          <div className="text-center py-4 space-y-1">
            <div className="text-xs font-mono font-bold text-zinc-500">
              APP VERSION: 4.6.312 (BUILD 340289)
            </div>
            <div className="text-[10px] text-zinc-600 font-mono">
              WHOOP // REVERSE-ENGINEERED BLE ENGINE
            </div>
          </div>
        </div>
      )}

      {/* 2. DEVICE SETTINGS SUB-SCREEN */}
      {subScreen === 'device' && (
        <StrapLabView
          metadata={metadata}
          services={services}
          packets={packets}
          onConnectBle={onConnectBle}
          onDisconnectBle={onDisconnectBle}
          onClearPackets={onClearPackets}
          onRefreshGattTree={() => whoopBleEngine.scanFullGattTree()}
        />
      )}

      {/* 3. MY ACCOUNT SUB-SCREEN (Biometrics Form) */}
      {subScreen === 'account' && (
        <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
              Biometric Profile & Physiology
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              These baselines calibrate your daily Strain brackets and normal CDF Recovery.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  Athlete Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 25 })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  Resting HR Baseline
                </label>
                <input
                  type="number"
                  value={form.restingHrBaseline}
                  onChange={(e) => setForm({ ...form, restingHrBaseline: parseInt(e.target.value) || 52 })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  HRV Baseline (ms)
                </label>
                <input
                  type="number"
                  value={form.hrvBaseline}
                  onChange={(e) => setForm({ ...form, hrvBaseline: parseInt(e.target.value) || 65 })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed">
                  Max HR (BPM): {form.maxHr}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTanaka}
                    className="text-[9px] bg-[#222730] text-zinc-300 px-2 py-0.5 rounded font-mono hover:text-white"
                  >
                    Tanaka (208 - 0.7*Age)
                  </button>
                  <button
                    type="button"
                    onClick={handleFox}
                    className="text-[9px] bg-[#222730] text-zinc-300 px-2 py-0.5 rounded font-mono hover:text-white"
                  >
                    Fox (220 - Age)
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={form.maxHr}
                onChange={(e) => setForm({ ...form, maxHr: parseInt(e.target.value) || 190 })}
                className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-condensed font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Biometrics</span>
            </button>

            {saveStatus && (
              <div className="p-2.5 rounded-xl bg-[#0D2E1C] border border-[#16EC06]/30 text-xs text-[#16EC06] text-center font-mono font-bold">
                {saveStatus}
              </div>
            )}
          </form>
        </div>
      )}

      {/* 4. APP SETTINGS & DATA VAULT SUB-SCREEN */}
      {subScreen === 'app_settings' && (
        <div className="space-y-4">
          {/* Notifications Quick Link */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-[#0093E9]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase font-sans">Notification Center</div>
                <div className="text-[10px] text-zinc-400 font-sans">Test chimes, haptics and push alerts</div>
              </div>
            </div>
            <button
              onClick={onOpenNotifications}
              className="px-3 py-1.5 rounded-full bg-white text-black font-condensed font-black text-xs uppercase"
            >
              Open
            </button>
          </div>

          {/* Official WHOOP CSV & JSON Vault */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                Data Vault & Official Import / Export
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                Ingest historical official WHOOP export archives or export local telemetry.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportDaysToCSV}
                className="p-3 rounded-xl bg-[#1A1F26] hover:bg-[#222832] border border-white/5 text-left text-xs font-condensed font-black uppercase text-white flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#0093E9]" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={exportAllData}
                className="p-3 rounded-xl bg-[#1A1F26] hover:bg-[#222832] border border-white/5 text-left text-xs font-condensed font-black uppercase text-white flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#16EC06]" />
                <span>Backup JSON</span>
              </button>
            </div>

            <div className="pt-2">
              <label className="w-full p-3 rounded-xl bg-[#0B0D10] border border-dashed border-white/20 hover:border-[#0093E9] text-center cursor-pointer block transition-colors">
                <Upload className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed block">
                  Import WHOOP (.CSV or .JSON)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                  Click or drag official export file
                </span>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-xl bg-[#0D2E1C] border border-[#16EC06]/30 text-xs text-[#16EC06] text-center font-mono font-bold">
                {importStatus}
              </div>
            )}
          </div>

          {/* Reset Day Counters */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white font-sans uppercase">Reset Today's Strain</div>
              <div className="text-[10px] text-zinc-500 font-sans">Clear daily TRIMP accumulator</div>
            </div>
            <button
              onClick={onResetDayCounters}
              className="px-3 py-1.5 rounded-full bg-[#FF0026]/20 border border-[#FF0026]/40 text-[#FF0026] text-xs font-condensed font-black uppercase hover:bg-[#FF0026]/30"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* 5. PRIVACY SUB-SCREEN */}
      {subScreen === 'privacy' && (
        <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white font-condensed">
            <ShieldCheck className="w-5 h-5 text-[#16EC06]" />
            <span>Privacy & Local Storage</span>
          </div>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            This WHOOP 4.0 application is 100% offline-first. All optical photoplethysmography (PPG) samples, beat-to-beat RR intervals, and sleep records are processed on your device CPU and stored inside browser IndexedDB/LocalStorage. No health data ever leaves your computer.
          </p>
        </div>
      )}

      {/* 6. TUTORIALS SUB-SCREEN */}
      {subScreen === 'tutorials' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1.5">
            <h4 className="text-xs font-bold text-white font-sans uppercase">1. Proper Strap Placement</h4>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              Wear the WHOOP 4.0 one inch above your wrist bone. Keep the band snug so green/infrared optical LEDs remain firmly against skin during heavy movement.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1.5">
            <h4 className="text-xs font-bold text-white font-sans uppercase">2. Understanding HRV vs. RHR</h4>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              HRV reflects autonomic resilience. When resting heart rate drops and HRV rises, your body is ready for peak training exertion.
            </p>
          </div>
        </div>
      )}

      {/* 7. ABOUT SUB-SCREEN */}
      {subScreen === 'about' && (
        <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[#161C24] mx-auto flex items-center justify-center text-white font-black font-condensed text-xl">
            W
          </div>
          <h3 className="text-sm font-bold text-white font-sans uppercase">
            WHOOP 4.0 Local Web Bluetooth
          </h3>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            An independent, 100% local, subscription-free web platform designed to extract and visualize clinical telemetry directly from your physical WHOOP 4.0 strap.
          </p>
          <div className="pt-2 text-[10px] text-zinc-500 font-mono">
            APP VERSION: 4.6.312 (BUILD 340289)
          </div>
        </div>
      )}
    </div>
  );
};
