import React from 'react';
import { X, Check, RotateCcw, Sliders, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

export interface DashboardPreferences {
  hrv: boolean;
  sleep: boolean;
  stress: boolean;
  strainRecovery: boolean;
  steps: boolean;
  calories: boolean;
  respiratory: boolean;
  leanMass: boolean;
}

export const DEFAULT_DASHBOARD_PREFS: DashboardPreferences = {
  hrv: true,
  sleep: true,
  stress: true,
  strainRecovery: true,
  steps: true,
  calories: true,
  respiratory: true,
  leanMass: true,
};

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: DashboardPreferences;
  onSavePreferences: (prefs: DashboardPreferences) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const { t, isRtl } = useLanguage();
  const [localPrefs, setLocalPrefs] = React.useState<DashboardPreferences>(preferences);

  React.useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences, isOpen]);

  const toggle = (key: keyof DashboardPreferences) => {
    setLocalPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleReset = () => {
    setLocalPrefs(DEFAULT_DASHBOARD_PREFS);
  };

  const handleSave = () => {
    onSavePreferences(localPrefs);
    onClose();
  };

  const items: Array<{
    key: keyof DashboardPreferences;
    titleEn: string;
    titleAr: string;
    descEn: string;
    descAr: string;
  }> = [
    {
      key: 'hrv',
      titleEn: 'Heart Rate Variability (HRV)',
      titleAr: 'تباين معدل ضربات القلب (HRV)',
      descEn: 'Autonomic nervous system recovery and baseline delta',
      descAr: 'مؤشر توازن الجهاز العصبي المستقل ومقارنته بالخط الأساسي',
    },
    {
      key: 'sleep',
      titleEn: 'Sleep Performance',
      titleAr: 'أداء وكفاءة النوم',
      descEn: 'Sleep scored against biological sleep need',
      descAr: 'نسبة ساعات النوم الفعلية مقارنة بالحاجة الفسيولوجية',
    },
    {
      key: 'stress',
      titleEn: 'Stress Monitor Graph',
      titleAr: 'مخطط مراقب الإجهاد والتوتر',
      descEn: 'Real-time physiological stress curve (0.0 – 3.0)',
      descAr: 'منحنى التوتر الفسيولوجي المباشر وحالات الإجهاد اليومي',
    },
    {
      key: 'strainRecovery',
      titleEn: 'Strain & Recovery 7-Day Chart',
      titleAr: 'رسم الجهد والاستشفاء الأسبوعي',
      descEn: 'Dual-axis historical comparison over rolling 7 days',
      descAr: 'مقارنة مزدوجة المحاور للجهد والاستشفاء خلال آخر 7 أيام',
    },
    {
      key: 'steps',
      titleEn: 'Steps & Cadence',
      titleAr: 'الخطوات ومعدل الخطو',
      descEn: 'IMU accelerometer step count and cadence dynamics',
      descAr: 'حساب الخطوات من حساس الحركة وتسارع المشي والجري',
    },
    {
      key: 'calories',
      titleEn: 'Total Caloric Burn',
      titleAr: 'إجمالي السعرات الحرارية المحروقة',
      descEn: 'Mifflin BMR combined with Keytel active HR expenditure',
      descAr: 'الأيض الأساسي BMR مع الحرق النشط المبني على نبض القلب',
    },
    {
      key: 'respiratory',
      titleEn: 'Respiratory Rate',
      titleAr: 'معدل التنفس الليلي',
      descEn: 'Nocturnal breaths per minute (RPM) clinical metric',
      descAr: 'عدد الأنفاس بالدقيقة أثناء النوم ومؤشر الاستجابة المناعية',
    },
    {
      key: 'leanMass',
      titleEn: 'Lean Body Mass',
      titleAr: 'كتلة الجسم الصافية',
      descEn: 'Calculated fat-free body composition estimate',
      descAr: 'تقدير الكتلة العضلية والأنسجة الخالية من الدهون',
    },
  ];

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00A3FF]/10 text-[#00A3FF] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white font-condensed">
                {isRtl ? 'تخصيص لوحة المؤشرات' : 'Customize Dashboard'}
              </h2>
              <p className="text-[11px] text-zinc-400 font-sans">
                {isRtl ? 'اختر المؤشرات التي تود إظهارها في شاشة اليوم' : 'Select metrics to show on your daily dashboard'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle List */}
        <div className="p-4 space-y-2.5 overflow-y-auto no-scrollbar flex-1">
          {items.map((item) => {
            const isEnabled = localPrefs[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                  isEnabled
                    ? 'bg-[#141820] border-white/15 shadow-sm'
                    : 'bg-[#101317]/50 border-white/5 opacity-55'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 transition-colors ${
                      isEnabled ? 'bg-[#00A3FF]/20 text-[#00A3FF]' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-sans">
                      {isRtl ? item.titleAr : item.titleEn}
                    </div>
                    <div className="text-[10.5px] text-zinc-400 font-sans mt-0.5">
                      {isRtl ? item.descAr : item.descEn}
                    </div>
                  </div>
                </div>

                {/* Custom iOS Toggle Switch */}
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                    isEnabled ? 'bg-[#16EC06]' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isEnabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#12151B] border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isRtl ? 'استعادة الافتراضي' : 'Reset'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-colors"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-[#00A3FF] hover:bg-[#0081cc] text-white text-xs font-black uppercase tracking-wider font-condensed flex items-center gap-1.5 shadow-lg shadow-[#00A3FF]/20 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isRtl ? 'حفظ التفضيلات' : 'Save'}</span>
            </button>
          </div>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
