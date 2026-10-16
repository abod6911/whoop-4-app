import React, { useState } from 'react';
import {
  Users,
  Trophy,
  Flame,
  Activity,
  Moon,
  ChevronRight,
  BookOpen,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import { useLanguage } from '../../i18n/LanguageContext';

interface CommunityViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  metrics,
  settings,
}) => {
  const { t, isRtl } = useLanguage();
  const [metricTab, setMetricTab] = useState<'strain' | 'recovery' | 'sleep'>('strain');
  const [timeScope, setTimeScope] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const learnArticles = [
    {
      title: isRtl ? 'كيف يتنبأ تقلب نبضات القلب (HRV) بالتعافي الذاتي للجسم' : 'How HRV Predicts Autonomic Recovery',
      category: isRtl ? 'العلوم الطبية الحيوية' : 'BIOMEDICAL SCIENCE',
      readTime: isRtl ? '3 دقائق قراءة' : '3 min read',
      tag: 'HRV',
    },
    {
      title: isRtl ? 'دور نوم الموجة البطيئة (SWS) العميق في ترميم وبناء الأنسجة' : 'The Role of SWS Slow Wave Sleep in Tissue Repair',
      category: isRtl ? 'بنية النوم' : 'SLEEP ARCHITECTURE',
      readTime: isRtl ? '4 دقائق قراءة' : '4 min read',
      tag: 'SLEEP',
    },
    {
      title: isRtl ? 'تمارين الكارديو في المنطقة 2 وزيادة كثافة الميتوكوندريا' : 'Zone 2 Cardio & Mitochondrial Density',
      category: isRtl ? 'فسيولوجيا التحمل' : 'ENDURANCE PHYSIOLOGY',
      readTime: isRtl ? '5 دقائق قراءة' : '5 min read',
      tag: 'STRAIN',
    },
    {
      title: isRtl ? 'تنشيط العصب الحائر (المبهم) عبر التنفس بتردد الرنين 0.1 هرتز' : 'Vagal Nerve Activation via 0.1Hz Resonance',
      category: isRtl ? 'علم الأعصاب' : 'NEUROLOGY',
      readTime: isRtl ? '3 دقائق قراءة' : '3 min read',
      tag: 'RECOVERY',
    },
  ];

  // Benchmark Teams with User's Real Metric Integrated
  const teams = [
    { name: isRtl ? 'رياضيو العالم' : 'Athletes Global', members: 124500, userRank: 4, leaderScore: '16.8' },
    { name: isRtl ? 'فريق HRV العالي' : 'Team High HRV', members: 34200, userRank: 12, leaderScore: '15.4' },
    { name: isRtl ? 'القوة والإعداد البدني' : 'Strength & Conditioning', members: 58900, userRank: 2, leaderScore: '14.9' },
    { name: isRtl ? 'نادي التحمل' : 'Endurance Club', members: 82100, userRank: 8, leaderScore: '18.2' },
  ];

  const currentScore =
    metricTab === 'strain'
      ? (metrics.dailyStrain > 0 ? metrics.dailyStrain.toFixed(1) : '5.5')
      : metricTab === 'recovery'
      ? (metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '88%')
      : (metrics.sleepPerformance !== null ? `${metrics.sleepPerformance}%` : '100%');

  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">
      {/* 1. Learn Carousel */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0093E9]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'التعلم والعلوم الرياضية' : 'Learn & Science'}
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">{isRtl ? 'مرر للمزيد' : 'SWIPE FOR MORE'}</span>
        </div>

        <div className="overflow-x-auto flex gap-3 no-scrollbar pb-1">
          {learnArticles.map((art, idx) => (
            <div
              key={idx}
              className="min-w-[260px] p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2.5 flex-shrink-0"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#0093E9] uppercase font-bold">{art.category}</span>
                <span className="text-zinc-500">{art.readTime}</span>
              </div>
              <h4 className="text-xs font-bold text-white font-sans line-clamp-2 leading-snug">
                {art.title}
              </h4>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="bg-[#222730] text-zinc-300 px-2 py-0.5 rounded font-mono">
                  #{art.tag}
                </span>
                <span className="text-[#00F0FF] flex items-center gap-0.5">
                  {isRtl ? '← قراءة المقال' : 'Read article →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Teams Leaderboard Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FFDE00]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'لوائح الصدارة والفرق العالمية' : 'Global Leaderboards & Teams'}
            </h3>
          </div>

          {/* Time Scope Toggle: DAILY / MON-SUN / MONTHLY */}
          <div className="flex items-center gap-1 bg-[#16191E] border border-white/5 p-0.5 rounded-full text-[9px] font-condensed font-black uppercase">
            {(['daily', 'weekly', 'monthly'] as const).map((s) => {
              const scopeLabels = {
                daily: isRtl ? 'يومي' : 'daily',
                weekly: isRtl ? 'أسبوعي' : 'MON-SUN',
                monthly: isRtl ? 'شهري' : 'monthly',
              };
              return (
                <button
                  key={s}
                  onClick={() => setTimeScope(s)}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    timeScope === s ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {scopeLabels[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metric Selector Tabs: STRAIN | RECOVERY | SLEEP */}
        <div className="grid grid-cols-3 gap-1 bg-[#16191E] p-1 rounded-2xl border border-white/5 text-center">
          {(['strain', 'recovery', 'sleep'] as const).map((m) => {
            const isActive = metricTab === m;
            const labels = {
              strain: t('dayStrain'),
              recovery: t('recoveryScore'),
              sleep: t('sleep'),
            };
            return (
              <button
                key={m}
                onClick={() => setMetricTab(m)}
                className={`py-1.5 text-xs font-black uppercase tracking-wider font-condensed rounded-xl transition-all ${
                  isActive ? 'bg-[#222730] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>

        {/* User Rank Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#161C24] via-[#12151A] to-[#16191E] border border-[#0093E9]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0093E9]/20 text-[#0093E9] border border-[#0093E9]/40 flex items-center justify-center font-black font-condensed text-sm">
              #4
            </div>
            <div>
              <div className="text-xs font-bold text-white font-sans flex items-center gap-1.5">
                <span>{settings.name || (isRtl ? 'أنت' : 'YOU')}</span>
                <span className="text-[9px] bg-[#16EC06]/20 text-[#16EC06] px-1.5 py-0.2 rounded font-mono font-bold">
                  {isRtl ? 'ساعة متصلة' : 'LIVE STRAP'}
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                {isRtl ? 'مجموعة الرياضيين العالمية' : 'Athletes Global Cohort'}
              </div>
            </div>
          </div>

          <div className={isRtl ? 'text-left' : 'text-right'}>
            <div className="text-2xl font-black font-condensed text-white tabular-nums" dir="ltr">
              {currentScore}
            </div>
            <div className="text-[10px] text-zinc-500 font-condensed uppercase tracking-wider">
              {metricTab === 'strain' ? t('dayStrain') : metricTab === 'recovery' ? t('recoveryScore') : t('sleep')}
            </div>
          </div>
        </div>

        {/* Global Team Cards List */}
        <div className="space-y-2">
          {teams.map((tItem, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#16191E] border border-white/5 flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#222730] text-zinc-400 flex items-center justify-center text-xs font-black font-mono">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-sans">{tItem.name}</div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {tItem.members.toLocaleString()} {isRtl ? 'عضو' : 'members'} • {isRtl ? 'المتصدر:' : 'Leader:'} {tItem.leaderScore}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {isRtl ? `الترتيب #${tItem.userRank}` : `Rank #${tItem.userRank}`}
                </span>
                <ChevronRight className={`w-4 h-4 text-zinc-600 ${isRtl ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
