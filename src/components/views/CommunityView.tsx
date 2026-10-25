import React, { useState } from 'react';
import {
  Trophy,
  BookOpen,
  Share2,
} from 'lucide-react';
import type { LiveMetrics, UserSettings } from '../../types/whoop';
import { useLanguage } from '../../i18n/LanguageContext';
import { ArticleModal } from '../ArticleModal';
import { shareWhoopScorecard } from '../../utils/shareScorecard';

interface CommunityViewProps {
  metrics: LiveMetrics;
  settings: UserSettings;
  onOpenBreathePacer?: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  metrics,
  settings,
  onOpenBreathePacer,
}) => {
  const { t, isRtl } = useLanguage();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const learnArticles = [
    {
      id: 'hrv',
      title: isRtl ? 'كيف يتنبأ تقلب نبضات القلب (HRV) بالتعافي الذاتي للجسم' : 'How HRV Predicts Autonomic Recovery',
      category: isRtl ? 'العلوم الطبية الحيوية' : 'BIOMEDICAL SCIENCE',
      readTime: isRtl ? '5 دقائق قراءة' : '5 min read',
      tag: 'HRV',
    },
    {
      id: 'sws',
      title: isRtl ? 'دور نوم الموجة البطيئة (SWS) العميق في ترميم وبناء الأنسجة' : 'The Role of SWS Slow Wave Sleep in Tissue Repair',
      category: isRtl ? 'بنية النوم' : 'SLEEP ARCHITECTURE',
      readTime: isRtl ? '4 دقائق قراءة' : '4 min read',
      tag: 'SLEEP',
    },
    {
      id: 'zone2',
      title: isRtl ? 'تمارين الكارديو في المنطقة 2 وزيادة كثافة الميتوكوندريا' : 'Zone 2 Cardio & Mitochondrial Density',
      category: isRtl ? 'فسيولوجيا التحمل' : 'ENDURANCE PHYSIOLOGY',
      readTime: isRtl ? '5 دقائق قراءة' : '5 min read',
      tag: 'STRAIN',
    },
    {
      id: 'vagus',
      title: isRtl ? 'تنشيط العصب الحائر (المبهم) عبر التنفس بتردد الرنين 0.1 هرتز' : 'Vagal Nerve Activation via 0.1Hz Resonance',
      category: isRtl ? 'علم الأعصاب' : 'NEUROLOGY',
      readTime: isRtl ? '3 دقائق قراءة' : '3 min read',
      tag: 'RECOVERY',
    },
  ];

  const handleShare = async () => {
    const success = await shareWhoopScorecard(
      {
        recoveryScore: metrics.recoveryScore,
        recoveryCategory: metrics.recoveryCategory,
        dailyStrain: metrics.dailyStrain,
        sleepPerformance: metrics.sleepPerformance,
        currentHrv: metrics.currentHrv,
        restingHr: metrics.restingHr,
      },
      isRtl
    );
    if (success) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };


  return (
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">
      {/* 1. Learn & Science Carousel */}
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
          {learnArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticleId(art.id)}
              className="min-w-[260px] p-4 rounded-2xl bg-[#16191E] border border-white/5 space-y-2.5 flex-shrink-0 cursor-pointer hover:border-zinc-600 transition-all active:scale-98 group"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#0093E9] uppercase font-bold">{art.category}</span>
                <span className="text-zinc-500">{art.readTime}</span>
              </div>
              <h4 className="text-xs font-bold text-white font-sans line-clamp-2 leading-snug group-hover:text-[#00F0FF] transition-colors">
                {art.title}
              </h4>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="bg-[#222730] text-zinc-300 px-2 py-0.5 rounded font-mono">
                  #{art.tag}
                </span>
                <span className="text-[#00F0FF] flex items-center gap-0.5 font-bold">
                  {isRtl ? '← قراءة المقال' : 'Read article →'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Official WHOOP Scorecard Sharing */}
      <div className="p-4 rounded-[24px] bg-[#12151A] border border-white/5 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#00F0FF]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-condensed">
              {isRtl ? 'بطاقة الأداء الحيوية الحقيقية' : 'Live Biometric Scorecard'}
            </h3>
          </div>
          <button
            onClick={handleShare}
            className={`flex items-center gap-1 text-xs font-condensed font-black tracking-wider transition-colors ${
              shared ? 'text-[#16EC06]' : 'text-[#00F0FF] hover:underline'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shared ? (isRtl ? 'تم النسخ!' : 'COPIED!') : (isRtl ? 'مشاركة' : 'SHARE')}</span>
          </button>
        </div>

        {/* Real Live Metrics Snapshot Grid */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#16191E] border border-white/5">
          <div
            className="w-10 h-10 rounded-full p-[1.5px] overflow-hidden flex items-center justify-center bg-[#1E2530] flex-shrink-0"
            style={{ border: `2px solid ${settings.avatarColor || '#16EC06'}` }}
          >
            {settings.avatarUrl ? (
              <img src={settings.avatarUrl} alt={settings.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-xs font-black font-condensed text-white">
                {settings.name?.slice(0, 2).toUpperCase() || 'AB'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white font-condensed truncate">
              {settings.name || 'Athlete'}
            </div>
            <div className="text-[10px] text-[#00F0FF] font-mono truncate">
              {settings.handle || '@athlete'}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">{t('recoveryScore')}</div>
            <div className="text-lg font-black font-condensed text-white tabular-nums mt-0.5">
              {metrics.recoveryScore !== null ? `${metrics.recoveryScore}%` : '--'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">{t('dayStrain')}</div>
            <div className="text-lg font-black font-condensed text-[#0093E9] tabular-nums mt-0.5" dir="ltr">
              {metrics.dailyStrain.toFixed(1)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#16191E] border border-white/5">
            <div className="text-[10px] font-bold uppercase text-zinc-400 font-condensed">{t('hrv')}</div>
            <div className="text-lg font-black font-condensed text-white tabular-nums mt-0.5" dir="ltr">
              {metrics.currentHrv !== null ? `${metrics.currentHrv} ms` : '--'}
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          {isRtl
            ? 'شارك مقاييسك الحيوية المباشرة المسجلة من سوار WHOOP 4.0 بدقة مع مدربك أو زملائك في التدريب.'
            : 'Share your authentic, real-time biometrics recorded directly from your WHOOP 4.0 strap with your coach or training partners.'}
        </p>
      </div>

      {/* Leaderboards / teams need an online service; this build is fully local, so nothing is invented. */}
      <div className="p-5 rounded-[24px] bg-[#12151A] border border-white/5 text-center space-y-2">
        <Trophy className="w-6 h-6 text-zinc-600 mx-auto" />
        <div className="text-xs font-black uppercase tracking-wider text-white font-condensed">
          {isRtl ? 'الفرق ولوائح الصدارة' : 'Teams & Leaderboards'}
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {isRtl
            ? 'تحتاج هذه الميزة إلى خدمة متصلة بالإنترنت. هذا الإصدار يعمل محلياً بالكامل ولا يعرض ترتيباً أو أعضاءً غير حقيقيين.'
            : 'This feature needs an online service. This build runs fully on-device, so no rankings or member counts are shown.'}
        </p>
      </div>

      {/* Interactive Science & Physiology Article Modal */}
      <ArticleModal
        articleId={selectedArticleId}
        onClose={() => setSelectedArticleId(null)}
        onOpenBreathePacer={onOpenBreathePacer}
      />
    </div>
  );
};
