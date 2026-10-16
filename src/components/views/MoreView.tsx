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
  Globe,
} from 'lucide-react';
import { whoopBleEngine } from '../../services/whoopBleEngine';
import { useLanguage } from '../../i18n/LanguageContext';
import { whoopDb } from '../../services/whoopDatabase';

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
  const { language, setLanguage, t, isRtl } = useLanguage();
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
    setSaveStatus(t('savedSuccessfully'));
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const exportAllData = async () => {
    try {
      const dump = await whoopDb.exportDatabaseToJson();
      const blob = new Blob([dump], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whoop-dexie-vault-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
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
    }
  };

  const exportDaysToCSV = async () => {
    try {
      const csv = await whoopDb.exportDailyToCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whoop-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
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
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (file.name.endsWith('.json')) {
          // Import into Dexie DB
          try {
            await whoopDb.importDatabaseFromJson(text);
          } catch {}

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
          setImportStatus('JSON vault successfully imported!');
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
          <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
          <span>{isRtl ? 'العودة لقائمة المزيد' : 'BACK TO MORE MENU'}</span>
        </button>
      )}

      {/* 1. MAIN MENU SCREEN (02:43 in Video) */}
      {subScreen === 'menu' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">{t('more')}</h2>
            <p className="text-xs text-zinc-400 font-sans">
              {isRtl
                ? 'إدارة سوار WHOOP 4.0 ومعدلاتك الحيوية وإعدادات اللغة ومستودع البيانات.'
                : 'Manage WHOOP 4.0 hardware, biometric baselines, language, and data.'}
            </p>
          </div>

          <div className="rounded-[24px] bg-[#12151A] border border-white/5 divide-y divide-white/5 overflow-hidden">
            {/* QUICK LANGUAGE SWITCHER ROW */}
            <div className="w-full p-4 flex items-center justify-between text-start">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Globe className="w-5 h-5 text-zinc-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('language')} / LANGUAGE
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {language === 'ar' ? 'العربية (مفعلة)' : 'English (Active)'}
                  </div>
                </div>
              </div>

              {/* Language Toggle Buttons */}
              <div className="flex items-center gap-1 bg-[#0B0D10] p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-condensed font-black uppercase transition-all ${
                    language === 'en'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-condensed font-black uppercase transition-all ${
                    language === 'ar'
                      ? 'bg-[#16EC06] text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* DEVICE SETTINGS */}
            <button
              onClick={() => setSubScreen('device')}
              className="w-full p-4 flex items-center justify-between text-start hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('deviceSettings')}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {metadata.connected
                      ? `${metadata.name} (${t('connected')} • ${metadata.batteryLevel ?? '--'}%)`
                      : t('disconnected')}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* MY ACCOUNT */}
            <button
              onClick={() => setSubScreen('account')}
              className="w-full p-4 flex items-center justify-between text-start hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <User className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('myAccount')}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {settings.name || 'Athlete'} • {isRtl ? 'خط الأساس الفسيولوجي' : 'Baselines & Physiology'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* APP SETTINGS */}
            <button
              onClick={() => setSubScreen('app_settings')}
              className="w-full p-4 flex items-center justify-between text-start hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Sliders className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('appSettings')}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {isRtl ? 'تغيير اللغة، الإشعارات ومستودع البيانات' : 'Language, Notifications & Data Vault'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* PRIVACY SETTINGS */}
            <button
              onClick={() => setSubScreen('privacy')}
              className="w-full p-4 flex items-center justify-between text-start hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('privacy')}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {isRtl ? 'تخزين محلي آمن 100% بدون سحابة' : '100% Offline Local BLE Storage'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* TUTORIALS */}
            <button
              onClick={() => setSubScreen('tutorials')}
              className="w-full p-4 flex items-center justify-between text-start hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <HelpCircle className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('tutorials')}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {isRtl ? 'ارتداء الحساس، تقلب النبض والشحن' : 'Sensor Placement, HRV & Charging'}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
            </button>

            {/* ABOUT */}
            <button
              onClick={() => setSubScreen('about')}
              className="w-full p-4 flex items-center justify-between text-start hover:bg-[#161C24] transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0B0D10] border border-white/5 flex items-center justify-center text-white">
                  <Info className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-sans">
                    {t('about')}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    WHOOP 4.0 Local Web Bluetooth
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover:text-white transition-colors ${isRtl ? 'rotate-180' : ''}`} />
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
              {t('biometricProfile')}
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              {t('biometricProfileDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  {t('athleteName')}
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
                  {t('genderLabel')}
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  {t('ageYears')}
                </label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 25 })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  {t('weightKg')}
                </label>
                <input
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: parseFloat(e.target.value) || 75 })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  {t('heightCm')}
                </label>
                <input
                  type="number"
                  value={form.heightCm ?? 178}
                  onChange={(e) => setForm({ ...form, heightCm: parseInt(e.target.value) || 178 })}
                  className="w-full bg-[#0B0D10] border border-white/10 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#0093E9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-zinc-400 font-condensed block mb-1">
                  {t('restingHrBaseline')}
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
                  {t('hrvBaseline')}
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
                  {t('maxHrBpm')}: {form.maxHr}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleTanaka}
                    className="text-[9px] bg-[#222730] text-zinc-300 px-2 py-0.5 rounded font-mono hover:text-white"
                  >
                    {t('tanakaFormula')}
                  </button>
                  <button
                    type="button"
                    onClick={handleFox}
                    className="text-[9px] bg-[#222730] text-zinc-300 px-2 py-0.5 rounded font-mono hover:text-white"
                  >
                    {t('foxFormula')}
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
              <span>{t('saveBiometrics')}</span>
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
          {/* Language Preference Card (خيار اللغة) */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-[#16EC06]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase font-sans">
                    {t('language')} / LANGUAGE
                  </div>
                  <div className="text-[10px] text-zinc-400 font-sans">
                    {isRtl ? 'اختر لغة واجهة التطبيق' : 'Choose app display language'}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold font-condensed px-2.5 py-0.5 rounded-full bg-[#16EC06]/15 text-[#16EC06] border border-[#16EC06]/30">
                {language === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Arabic Option */}
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`p-3.5 rounded-xl border text-start transition-all flex items-center justify-between ${
                  language === 'ar'
                    ? 'bg-[#16EC06]/10 border-[#16EC06]/40 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-[#16EC06]/40'
                    : 'bg-[#1A1F26] border-white/5 text-zinc-400 hover:text-white hover:bg-[#222832]'
                }`}
              >
                <div>
                  <div className="text-sm font-black font-condensed">العربية</div>
                  <div className="text-[10px] font-mono text-zinc-400">Arabic (RTL)</div>
                </div>
                {language === 'ar' && <CheckCircle2 className="w-4 h-4 text-[#16EC06]" />}
              </button>

              {/* English Option */}
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`p-3.5 rounded-xl border text-start transition-all flex items-center justify-between ${
                  language === 'en'
                    ? 'bg-[#0093E9]/10 border-[#0093E9]/40 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-[#0093E9]/40'
                    : 'bg-[#1A1F26] border-white/5 text-zinc-400 hover:text-white hover:bg-[#222832]'
                }`}
              >
                <div>
                  <div className="text-sm font-black font-condensed">English</div>
                  <div className="text-[10px] font-mono text-zinc-400">الإنجليزية (LTR)</div>
                </div>
                {language === 'en' && <CheckCircle2 className="w-4 h-4 text-[#0093E9]" />}
              </button>
            </div>
          </div>

          {/* Notifications Quick Link */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#222730] flex items-center justify-center text-[#0093E9]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase font-sans">{t('notificationCenter')}</div>
                <div className="text-[10px] text-zinc-400 font-sans">
                  {isRtl ? 'اختبار الأصوات والاهتزازات والتنبيهات الذكية' : 'Test chimes, haptics and push alerts'}
                </div>
              </div>
            </div>
            <button
              onClick={onOpenNotifications}
              className="px-3 py-1.5 rounded-full bg-white text-black font-condensed font-black text-xs uppercase"
            >
              {isRtl ? 'فتح' : 'Open'}
            </button>
          </div>

          {/* Official WHOOP CSV & JSON Vault */}
          <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
                {t('dataVault')}
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                {isRtl
                  ? 'استيراد سجلات WHOOP الرسمية أو تصدير بياناتك الحيوية المحلية.'
                  : 'Ingest historical official WHOOP export archives or export local telemetry.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={exportDaysToCSV}
                className="p-3 rounded-xl bg-[#1A1F26] hover:bg-[#222832] border border-white/5 text-start text-xs font-condensed font-black uppercase text-white flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#0093E9]" />
                <span>{t('exportCsv')}</span>
              </button>

              <button
                onClick={exportAllData}
                className="p-3 rounded-xl bg-[#1A1F26] hover:bg-[#222832] border border-white/5 text-start text-xs font-condensed font-black uppercase text-white flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#16EC06]" />
                <span>{t('backupJson')}</span>
              </button>
            </div>

            <div className="pt-2">
              <label className="w-full p-3 rounded-xl bg-[#0B0D10] border border-dashed border-white/20 hover:border-[#0093E9] text-center cursor-pointer block transition-colors">
                <Upload className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300 font-condensed block">
                  {t('importWhoop')}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                  {isRtl ? 'انقر أو اسحب ملف التصدير الرسمي' : 'Click or drag official export file'}
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
              <div className="text-xs font-bold text-white font-sans uppercase">{t('resetTodayStrain')}</div>
              <div className="text-[10px] text-zinc-500 font-sans">
                {isRtl ? 'تصفير تراكم إجهاد اليوم TRIMP' : 'Clear daily TRIMP accumulator'}
              </div>
            </div>
            <button
              onClick={onResetDayCounters}
              className="px-3 py-1.5 rounded-full bg-[#FF0026]/20 border border-[#FF0026]/40 text-[#FF0026] text-xs font-condensed font-black uppercase hover:bg-[#FF0026]/30"
            >
              {t('reset')}
            </button>
          </div>
        </div>
      )}

      {/* 5. PRIVACY SUB-SCREEN */}
      {subScreen === 'privacy' && (
        <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white font-condensed">
            <ShieldCheck className="w-5 h-5 text-[#16EC06]" />
            <span>{t('privacyTitle')}</span>
          </div>
          <p className="text-xs text-zinc-300 font-sans leading-relaxed">
            {t('privacySubtitle')}
          </p>
        </div>
      )}

      {/* 6. TUTORIALS SUB-SCREEN */}
      {subScreen === 'tutorials' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1.5">
            <h4 className="text-xs font-bold text-white font-sans uppercase">
              {isRtl ? '1. طريقة الارتداء الصحيحة للسوار' : '1. Proper Strap Placement'}
            </h4>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isRtl
                ? 'ارتدِ سوار WHOOP 4.0 على مسافة بوصة واحدة فوق عظمة المعصم. اجعل الحزام محكماً حتى تظل أضواء الحساسات الخضراء وتحت الحمراء ملامسة للجلد بثبات أثناء الحركة.'
                : 'Wear the WHOOP 4.0 one inch above your wrist bone. Keep the band snug so green/infrared optical LEDs remain firmly against skin during heavy movement.'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#12151A] border border-white/5 space-y-1.5">
            <h4 className="text-xs font-bold text-white font-sans uppercase">
              {isRtl ? '2. فهم العلاقة بين HRV ونبض الراحة RHR' : '2. Understanding HRV vs. RHR'}
            </h4>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {isRtl
                ? 'يعكس تباين معدل ضربات القلب (HRV) مرونة جهازك العصبي الذاتي. عندما ينخفض نبض الراحة ويرتفع HRV، يكون جسمك في أوج الاستعداد للجهد والتدريب المكثف.'
                : 'HRV reflects autonomic resilience. When resting heart rate drops and HRV rises, your body is ready for peak training exertion.'}
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
            {t('aboutTitle')}
          </h3>
          <p className="text-xs text-zinc-400 font-sans leading-relaxed">
            {t('aboutDesc')}
          </p>
          <div className="pt-2 text-[10px] text-zinc-500 font-mono">
            APP VERSION: 4.6.312 (BUILD 340289)
          </div>
        </div>
      )}
    </div>
  );
};
