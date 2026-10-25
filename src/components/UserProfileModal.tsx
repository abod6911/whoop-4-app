/**
 * UserProfileModal.tsx
 * 
 * Athlete Profile, Avatar Upload, Biometric Calibration & Data Backup Suite
 */

import React, { useState, useRef, useEffect } from 'react';
import type { UserSettings } from '../types/whoop';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import { useLanguage } from '../i18n/LanguageContext';
import { whoopDb } from '../services/whoopDatabase';
import { localDateKey } from '../utils/dateKey';
import {
  Camera,
  Trash2,
  CheckCircle2,
  Save,
  Download,
  Upload,
  Heart,
  Activity,
  Moon,
  Footprints,
  User,
  Sparkles,
  RefreshCw,
  X,
  Bell,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onDataRestored?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

const ACCENT_COLORS = [
  { id: 'green', hex: '#16EC06', labelEn: 'Recovery Green', labelAr: 'أخضر الاستشفاء' },
  { id: 'blue', hex: '#0093E9', labelEn: 'Strain Blue', labelAr: 'أزرق الجهد' },
  { id: 'purple', hex: '#9B51E0', labelEn: 'Cyber Purple', labelAr: 'بنفسجي سيبراني' },
  { id: 'gold', hex: '#FFB800', labelEn: 'Stealth Gold', labelAr: 'ذهبي نخبوي' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onDataRestored,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const { t, isRtl } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<UserSettings>({ ...settings });
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Sync state whenever modal opens or settings change
  useEffect(() => {
    if (isOpen) {
      setForm({ ...settings });
      setSaveFeedback(false);
      setBackupFeedback(null);
    }
  }, [isOpen, settings]);

  // Compute initials from name
  const getInitials = (nameStr: string): string => {
    const clean = nameStr.trim();
    if (!clean) return 'AB';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
      return clean.slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Client-Side Canvas Image Processing & Compression (Center-Crop 256x256 WebP/JPEG)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        canvas.width = 256;
        canvas.height = 256;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);

        // Try WebP at 0.85 quality, fallback to JPEG
        let dataUrl = canvas.toDataURL('image/webp', 0.85);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        setForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input for re-upload
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, avatarUrl: undefined }));
  };

  // Tanaka Formula: 208 - 0.7 * age
  const handleTanakaCalc = () => {
    const max = Math.round(208 - 0.7 * (form.age || 28));
    setForm((prev) => ({ ...prev, maxHr: max }));
  };

  // Fox Formula: 220 - age
  const handleFoxCalc = () => {
    const max = Math.round(220 - (form.age || 28));
    setForm((prev) => ({ ...prev, maxHr: max }));
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...form,
      name: form.name.trim() || 'Athlete',
      handle: form.handle?.trim().startsWith('@') ? form.handle.trim() : `@${form.handle?.trim() || 'athlete'}`,
      age: Math.max(12, Math.min(100, Number(form.age) || 28)),
      weightKg: Math.max(30, Math.min(250, Number(form.weightKg) || 75)),
      heightCm: Math.max(100, Math.min(230, Number(form.heightCm) || 178)),
      maxHr: Math.max(120, Math.min(230, Number(form.maxHr) || 192)),
      restingHrBaseline: Math.max(35, Math.min(110, Number(form.restingHrBaseline) || 52)),
      hrvBaseline: Math.max(10, Math.min(250, Number(form.hrvBaseline) || 65)),
      sleepNeedHours: Math.max(4.0, Math.min(14.0, Number(form.sleepNeedHours) || 8.0)),
      stepGoal: Math.max(1000, Math.min(50000, Number(form.stepGoal) || 10000)),
      profileConfirmed: true,
    };

    onSaveSettings(updated);
    whoopDb.saveUserProfile(updated).catch(() => {});
    setSaveFeedback(true);
    setTimeout(() => {
      setSaveFeedback(false);
      onClose();
    }, 900);
  };

  // Data Export (JSON)
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const dump = await whoopDb.exportDatabaseToJson();
      const blob = new Blob([dump], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whoop-vault-backup-${localDateKey()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupFeedback(isRtl ? 'تم تصدير النسخة الاحتياطية بنجاح!' : 'Backup exported successfully!');
    } catch (err) {
      setBackupFeedback(isRtl ? 'فشل تصدير النسخة الاحتياطية' : 'Backup export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setBackupFeedback(null), 3500);
    }
  };

  // Data Import (JSON)
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const res = await whoopDb.importDatabaseFromJson(text);
        if (res.success) {
          // Attempt to restore user profile from database
          const restoredProfile = await whoopDb.getUserProfile();
          if (restoredProfile) {
            const restoredSettings: UserSettings = {
              name: restoredProfile.name,
              handle: restoredProfile.handle,
              avatarUrl: restoredProfile.avatarUrl,
              avatarColor: restoredProfile.avatarColor,
              age: restoredProfile.age,
              gender: restoredProfile.gender,
              weightKg: restoredProfile.weightKg,
              heightCm: restoredProfile.heightCm,
              maxHr: restoredProfile.maxHr,
              restingHrBaseline: restoredProfile.restingHrBaseline,
              hrvBaseline: restoredProfile.hrvBaseline,
              sleepNeedHours: restoredProfile.sleepNeedHours,
              stepGoal: restoredProfile.stepGoal,
            };
            setForm(restoredSettings);
            onSaveSettings(restoredSettings);
          }
          setBackupFeedback(isRtl ? `تمت استعادة ${res.recordCount} سجلاً بنجاح!` : `Restored ${res.recordCount} records!`);
          if (onDataRestored) onDataRestored();
        } else {
          setBackupFeedback(res.message);
        }
      } catch (err: any) {
        setBackupFeedback(isRtl ? 'ملف النسخة الاحتياطية غير صالح' : 'Invalid backup JSON file');
      } finally {
        setIsImporting(false);
        setTimeout(() => setBackupFeedback(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedHex = form.avatarColor || '#16EC06';

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel
        onClose={onClose}
        enableDrag={false}
        className="h-[92vh] max-h-[92vh] bg-[#0E1116] flex flex-col p-0 overflow-hidden border-t sm:border border-white/10 select-none"
      >
        {/* Sticky Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#14181F] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#16EC06]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white font-condensed">
                {isRtl ? 'الملف الشخصي والمعايرة الحيوية' : 'Athlete Profile & Biometrics'}
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                {isRtl ? 'تخصيص الهوية ومعادلات الجهد والاستشفاء' : 'Customize identity & physiological baselines'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenNotifications && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotifications();
                }}
                className="relative w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title={isRtl ? 'مركز الإشعارات' : 'Notification Center'}
                aria-label="Notification Center"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#0093E9] text-[8px] font-black flex items-center justify-center text-white ring-2 ring-black">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 text-zinc-200">
          
          {/* SECTION 1: Avatar & Identity Card */}
          <div className="p-4 rounded-2xl bg-[#141820] border border-white/5 space-y-4">
            <div className="flex items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-full p-[2.5px] transition-all shadow-lg flex items-center justify-center overflow-hidden bg-[#1E2530]"
                  style={{ border: `2.5px solid ${selectedHex}` }}
                >
                  {form.avatarUrl ? (
                    <img
                      src={form.avatarUrl}
                      alt={form.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-xl font-black font-condensed text-white tracking-widest">
                      {getInitials(form.name)}
                    </span>
                  )}
                </div>

                {/* Camera upload badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#16EC06] text-black hover:scale-105 active:scale-95 transition-all shadow-md"
                  title={isRtl ? 'تغيير الصورة' : 'Change Photo'}
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </div>

              {/* Upload Actions & Details */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold font-condensed transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'رفع صورة' : 'Upload Photo'}</span>
                  </button>

                  {form.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#FF3344] text-xs font-bold font-condensed transition-all flex items-center gap-1"
                      title={isRtl ? 'حذف الصورة' : 'Remove Photo'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'حذف' : 'Remove'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  {isRtl
                    ? 'يتم قص الصورة تلقائياً لمربع 256x256 وضغطها لتوفير الذاكرة.'
                    : 'Auto-crops to 256x256 square & compresses to lightweight WebP.'}
                </p>
              </div>
            </div>

            {/* Accent Ring Color Presets */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-condensed">
                {isRtl ? 'لون الحلقة والهوية الرياضية' : 'Accent Ring & Identity Color'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_COLORS.map((col) => {
                  const isSelected = selectedHex.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, avatarColor: col.hex }))}
                      className={`p-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all text-[11px] font-bold font-condensed ${
                        isSelected
                          ? 'border-white/40 bg-white/10 text-white'
                          : 'border-white/5 bg-black/20 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="truncate">{isRtl ? col.labelAr : col.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Name & Handle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-condensed">
                  {isRtl ? 'الاسم الظاهر' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ahmed"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-bold focus:border-[#16EC06] focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-condensed">
                  {isRtl ? 'المعرّف الرياضي' : 'Athlete Handle'}
                </label>
                <input
                  type="text"
                  value={form.handle || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, handle: e.target.value }))}
                  placeholder="@athlete"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[#00F0FF] text-xs font-mono font-bold focus:border-[#00F0FF] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Physical & Body Characteristics */}
          <div className="p-4 rounded-2xl bg-[#141820] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-[#0093E9]" />
              <h3 className="text-xs font-black uppercase tracking-wider font-condensed">
                {isRtl ? 'القياسات البدنية (لحساب الأيض BMR والسعرات)' : 'Body Metrics (BMR & Caloric Expenditure)'}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Age */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'العمر' : 'Age'}
                </label>
                <input
                  type="number"
                  min="12"
                  max="100"
                  value={form.age}
                  onChange={(e) => setForm((prev) => ({ ...prev, age: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono font-bold focus:border-[#0093E9] focus:outline-none"
                />
              </div>

              {/* Sex */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'الجنس البيولوجي' : 'Biological Sex'}
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                  className="w-full px-2.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-bold focus:border-[#0093E9] focus:outline-none"
                >
                  <option value="male">{isRtl ? 'ذكر' : 'Male'}</option>
                  <option value="female">{isRtl ? 'أنثى' : 'Female'}</option>
                </select>
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'الوزن (كجم)' : 'Weight (kg)'}
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={form.weightKg}
                  onChange={(e) => setForm((prev) => ({ ...prev, weightKg: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono font-bold focus:border-[#0093E9] focus:outline-none"
                />
              </div>

              {/* Height */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'الطول (سم)' : 'Height (cm)'}
                </label>
                <input
                  type="number"
                  min="100"
                  max="230"
                  value={form.heightCm || 178}
                  onChange={(e) => setForm((prev) => ({ ...prev, heightCm: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono font-bold focus:border-[#0093E9] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Cardiovascular & Physiological Baselines */}
          <div className="p-4 rounded-2xl bg-[#141820] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Heart className="w-4 h-4 text-[#FF3344]" />
                <h3 className="text-xs font-black uppercase tracking-wider font-condensed">
                  {isRtl ? 'معايرة القلب والجهد (Strain & Recovery)' : 'Cardiac & Strain Calibration'}
                </h3>
              </div>
            </div>

            {/* Max HR with Tanaka/Fox buttons */}
            <div className="p-3 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-white font-condensed">
                  {isRtl ? 'أقصى معدل للنبض (Max HR)' : 'Max Heart Rate (Max HR)'}
                </label>
                <span className="text-xs font-black font-mono text-[#FF3344]">{form.maxHr} BPM</span>
              </div>
              <input
                type="number"
                min="120"
                max="230"
                value={form.maxHr}
                onChange={(e) => setForm((prev) => ({ ...prev, maxHr: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono font-bold focus:border-[#FF3344] focus:outline-none"
              />
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-zinc-500">{isRtl ? 'حساب تلقائي:' : 'Auto Calc:'}</span>
                <button
                  type="button"
                  onClick={handleTanakaCalc}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-zinc-300 transition-colors"
                >
                  {isRtl ? 'تانكا (208 - 0.7 × العمر)' : 'Tanaka (208 - 0.7*age)'}
                </button>
                <button
                  type="button"
                  onClick={handleFoxCalc}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-zinc-300 transition-colors"
                >
                  {isRtl ? 'فوكس (220 - العمر)' : 'Fox (220 - age)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Baseline RHR */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'نبض الراحة المرجعي (RHR)' : 'Baseline Resting HR'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="35"
                    max="110"
                    value={form.restingHrBaseline}
                    onChange={(e) => setForm((prev) => ({ ...prev, restingHrBaseline: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono font-bold focus:border-[#16EC06] focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-mono">BPM</span>
                </div>
              </div>

              {/* Baseline HRV */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'الـ HRV المرجعي (RMSSD)' : 'Baseline HRV (RMSSD)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="250"
                    value={form.hrvBaseline}
                    onChange={(e) => setForm((prev) => ({ ...prev, hrvBaseline: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono font-bold focus:border-[#16EC06] focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-mono">MS</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Daily Goals & Circadian Targets */}
          <div className="p-4 rounded-2xl bg-[#141820] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Footprints className="w-4 h-4 text-[#16EC06]" />
              <h3 className="text-xs font-black uppercase tracking-wider font-condensed">
                {isRtl ? 'الأهداف اليومية والنوم' : 'Daily Targets & Sleep Baseline'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Step Goal */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'هدف الخطوات اليومي' : 'Daily Step Target'}
                </label>
                <input
                  type="number"
                  step="500"
                  min="1000"
                  max="50000"
                  value={form.stepGoal || 10000}
                  onChange={(e) => setForm((prev) => ({ ...prev, stepGoal: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[#16EC06] text-xs font-mono font-bold focus:border-[#16EC06] focus:outline-none"
                />
              </div>

              {/* Sleep Need Hours */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">
                  {isRtl ? 'احتياج النوم الأساسي' : 'Baseline Sleep Need'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="4.0"
                    max="14.0"
                    value={form.sleepNeedHours}
                    onChange={(e) => setForm((prev) => ({ ...prev, sleepNeedHours: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-[#9B51E0] text-xs font-mono font-bold focus:border-[#9B51E0] focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-mono">HRS</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Data Portability & IndexedDB Vault Backup */}
          <div className="p-4 rounded-2xl bg-[#141820] border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
              <h3 className="text-xs font-black uppercase tracking-wider font-condensed">
                {isRtl ? 'النسخ الاحتياطي وحفظ البيانات (Data Portability)' : 'Data Portability & Vault Backup'}
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {isRtl
                ? 'بياناتك الحيوية مخزنة محلياً بالكامل على جهازك. يمكنك تصدير نسخة كاملة أو استعادتها في أي وقت.'
                : 'All telemetry is 100% on-device. Export your full physiological vault or restore historical records anytime.'}
            </p>

            {backupFeedback && (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-bold text-white font-condensed">
                <AlertCircle className="w-4 h-4 text-[#16EC06] flex-shrink-0" />
                <span>{backupFeedback}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 transition-all flex items-center justify-center gap-2 text-white text-xs font-black font-condensed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? (isRtl ? 'جاري التصدير...' : 'Exporting...') : (isRtl ? 'تصدير نسخة (JSON)' : 'Export Backup')}</span>
              </button>

              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                disabled={isImporting}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-98 transition-all flex items-center justify-center gap-2 text-[#00F0FF] text-xs font-black font-condensed"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isImporting ? (isRtl ? 'جاري الاستعادة...' : 'Restoring...') : (isRtl ? 'استعادة بيانات (JSON)' : 'Restore Backup')}</span>
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </div>
          </div>

          {/* Sticky Save Button Bar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#16EC06] to-[#00F0FF] text-black font-black text-sm uppercase tracking-wider font-condensed flex items-center justify-center gap-2 shadow-lg shadow-[#16EC06]/20 active:scale-[0.98] transition-all hover:opacity-95"
            >
              {saveFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>{isRtl ? 'تم حفظ التعديلات بنجاح!' : 'Changes Saved Successfully!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>{isRtl ? 'حفظ وتحديث القياسات' : 'Save & Calibrate Profile'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </SheetPanel>
    </SheetBackdrop>
  );
};

export default UserProfileModal;
