import React from 'react';
import { X, BookOpen, Clock, Tag, Activity, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export interface ArticleData {
  id: string;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  readTimeEn: string;
  readTimeAr: string;
  tag: string;
  summaryEn: string;
  summaryAr: string;
  sections: Array<{
    headingEn: string;
    headingAr: string;
    bodyEn: string;
    bodyAr: string;
  }>;
  takeawayEn: string;
  takeawayAr: string;
}

export const SCIENCE_ARTICLES: Record<string, ArticleData> = {
  hrv: {
    id: 'hrv',
    titleEn: 'HRV Predictability & Autonomic Nervous System Tone',
    titleAr: 'تنبؤات تباين نبضات القلب (HRV) وتوازن الجهاز العصبي المستقل',
    categoryEn: 'AUTONOMIC PHYSIOLOGY',
    categoryAr: 'فسيولوجيا الجهاز العصبي',
    readTimeEn: '5 min read',
    readTimeAr: '5 دقائق قراءة',
    tag: 'RECOVERY',
    summaryEn:
      'Heart Rate Variability (HRV) is the definitive non-invasive biomarker reflecting the dynamic interplay between the sympathetic and parasympathetic nervous systems.',
    summaryAr:
      'يعد تباين معدل ضربات القلب (HRV) المؤشر الحيوي الأدق وغير التدخلي لتقييم التوازن الديناميكي بين الجهاز العصبي الودي ونظير الودي.',
    sections: [
      {
        headingEn: '1. The Sinoatrial Node & Micro-Millisecond Timing',
        headingAr: '١. العقدة الجيبية الأذينية ودقة أجزاء المللي ثانية',
        bodyEn:
          'A healthy heart does not beat like a rigid metronome. The sinoatrial (SA) node receives competing inputs from the sympathetic ("accelerator") and parasympathetic ("brake") pathways. When autonomic adaptability is high, RR-intervals fluctuate by tens of milliseconds from beat to beat, producing elevated Root Mean Square of Successive Differences (RMSSD).',
        bodyAr:
          'القلب السليم لا ينبض بدقة ميكانيكية متطابقة كالمسرع. تتلقى العقدة الجيبية الأذينية (SA) إشارات متزامنة من المسار العصبي الودي (المسرع) ونظير الودي (المكبح). عندما تكون المرونة العصبية في ذروتها، تتفاوت فترات RR-intervals بعشرات المللي ثانية بين نبضة وأخرى، مما يرفع مؤشر RMSSD.',
      },
      {
        headingEn: '2. Why WHOOP Measures Exclusively During Slow-Wave Sleep',
        headingAr: '٢. لماذا يقيس WHOOP التباين حصراً أثناء نوم الموجة البطيئة؟',
        bodyEn:
          'Daytime HRV is heavily polluted by external confounders—body posture, hydration, caffeine, mental stress, and environmental temperature. To isolate true systemic recovery, WHOOP samples RR-intervals exclusively during the deepest Stage 3 Slow-Wave Sleep (SWS) cycle of each night, ensuring zero cognitive interference.',
        bodyAr:
          'يتأثر قياس HRV أثناء النهار بعوامل خارجية مشوشة كالكافيين، وضعية الجسم، الترطيب، والضغط النفسي. لعزل الاستشفاء الحقيقي الصافي، يقوم سوار WHOOP بجمع بيانات فترات النبض حصراً خلال أعمق دورة نوم بطيء (SWS المرحلة الثالثة) في الليل لضمان انعدام أي تشويش.',
      },
      {
        headingEn: '3. Clinical Takeaways for Training & Lifestyle',
        headingAr: '٣. الدلالات الرياضية والسريرية للتدريب ونمط الحياة',
        bodyEn:
          'A significant negative deviation from your 14-day rolling baseline indicates accumulated autonomic fatigue, systemic inflammation, late-night alcohol ingestion, or an impending viral infection before clinical symptoms arise. Conversely, high baseline-aligned HRV signals peak parasympathetic capacity for high cardiovascular strain.',
        bodyAr:
          'أي هبوط حاد دون خطك المرجعي لآخر 14 يوماً يشير إلى إرهاق عصبي تراكمي، أو التهاب جهازي، أو استهلاك الكحول، أو عدوى فيروسية كامنة قبل ظهور أعراضها. وفي المقابل، يدل ارتفاع HRV على جهوزية قصوى لتحمل أقصى درجات الجهد العضلي والقلبي.',
      },
    ],
    takeawayEn:
      'Key Protocol: Prioritize sleep consistency, stop eating 3 hours before bed, and adjust daily training intensity according to your morning recovery score.',
    takeawayAr:
      'القاعدة الذهبية: حافظ على ثبات مواعيد النوم، توقف عن تناول الطعام قبل 3 ساعات من النوم، واضبط شدة تمرينك اليومي بناءً على نسبة استشفائك الصباحية.',
  },
  sws: {
    id: 'sws',
    titleEn: 'The Role of SWS Slow-Wave Sleep in Tissue Repair & Neurogenesis',
    titleAr: 'دور نوم الموجة البطيئة (SWS) العميق في ترميم الأنسجة والتجدد العصبي',
    categoryEn: 'SLEEP ARCHITECTURE',
    categoryAr: 'بنية وهندسة النوم',
    readTimeEn: '4 min read',
    readTimeAr: '4 دقائق قراءة',
    tag: 'SLEEP',
    summaryEn:
      'Slow-Wave Sleep (Stage 3 NREM) is the biological epicenter of muscular hyper-restoration, growth hormone secretion, and brain waste clearance.',
    summaryAr:
      'يعد نوم الموجة البطيئة (المرحلة الثالثة من النوم غير المصحوب بحركات العين السريعة) المركز الفسيولوجي لترميم العضلات، وإفراز هرمون النمو، وتطهير الدماغ.',
    sections: [
      {
        headingEn: '1. Delta Waves & Endocrine Cascade',
        headingAr: '١. موجات دلتا والتحفيز الهرموني',
        bodyEn:
          'During SWS, electroencephalogram (EEG) readings demonstrate synchronized high-amplitude delta waves (0.5 – 4 Hz). In this state, up to 70% of the daily pulse of Human Growth Hormone (HGH) is released into systemic circulation, stimulating cellular mitosis, myofibrillar protein synthesis, and bone remodeling.',
        bodyAr:
          'خلال نوم SWS، تظهر قراءات الدماغ موجات دلتا متزامنة عالية التردد (0.5 إلى 4 هرتز). في هذه المرحلة الدقيقة يتم إفراز نحو 70% من إجمالي هرمون النمو البشري (HGH) اليومي في مجرى الدم، مما يحفز التئام الألياف العضلية وتجديد الخلايا.',
      },
      {
        headingEn: '2. The Glymphatic Flushing System',
        headingAr: '٢. نظام التصريف الغليمفاوي في الدماغ',
        bodyEn:
          'During slow-wave sleep, interstitial space within the brain expands by roughly 60%, allowing cerebrospinal fluid (CSF) to rapidly wash away neurotoxic metabolic byproducts, including beta-amyloid and tau proteins associated with neurodegeneration.',
        bodyAr:
          'أثناء النوم العميق، تتسع المسافات الخلالية بين خلايا الدماغ بنسبة 60% تقريباً، مما يسمح للسائل النخاعي (CSF) بغسل وتصريف الفضلات الأيضية السامة مثل بروتينات بيتا أميلويد وتاو المرتبطة بالتدهور العصبي.',
      },
    ],
    takeawayEn:
      'Target: Aim for 1.5 to 2.0 hours of deep SWS sleep each night by keeping your bedroom below 19°C (66°F) and eliminating blue light before bed.',
    takeawayAr:
      'الهدف: احرص على تحقيق 1.5 إلى 2 ساعة من النوم العميق ليلياً عبر الحفاظ على حرارة الغرفة دون 19 درجة مئوية ومنع الشاشات الضوئية الزرقاء قبل النوم.',
  },
  zone2: {
    id: 'zone2',
    titleEn: 'Zone 2 Cardio & Mitochondrial Density',
    titleAr: 'تمارين الكارديو في المنطقة 2 وزيادة كثافة الميتوكوندريا',
    categoryEn: 'ENDURANCE PHYSIOLOGY',
    categoryAr: 'فسيولوجيا التحمل والأيض',
    readTimeEn: '5 min read',
    readTimeAr: '5 دقائق قراءة',
    tag: 'STRAIN',
    summaryEn:
      'Zone 2 cardiovascular training is the single most powerful stimulus for increasing mitochondrial volume and metabolic fat oxidation efficiency.',
    summaryAr:
      'تعتبر تمارين المنطقة 2 القلبية الحافز الفسيولوجي الأقوى لمضاعفة حجم الميتوكوندريا ورفع كفاءة أكسدة الدهون كمصدر طاقة نقي ومستدام.',
    sections: [
      {
        headingEn: '1. Cellular Bioenergetics & Lactate Clearance',
        headingAr: '١. كيمياء الطاقة الخلوية والتخلص من اللاكتات',
        bodyEn:
          'Zone 2 corresponds to the exercise intensity where blood lactate concentrations stay strictly below 2.0 mmol/L. At this exact threshold, Type I slow-twitch muscle fibers dominate energy production using beta-oxidation of fatty acids without generating unbuffered hydrogen ions.',
        bodyAr:
          'توافق المنطقة 2 شدة التمرين التي يبقى فيها تركيز حمض اللاكتيك في الدم دون 2.0 مليمول/لتر. في هذا النطاق، تعتمد الألياف العضلية البطيئة على أكسدة الأحماض الدهنية حصراً دون استنزاف مخازن الجليكوجين أو تراكم أيونات الهيدروجين المسببة للإجهاد.',
      },
      {
        headingEn: '2. Mitochondrial Biogenesis via PGC-1alpha',
        headingAr: '٢. تخليق الميتوكوندريا عبر مسار PGC-1α',
        bodyEn:
          'Sustained low-intensity aerobic strain triggers transcription of PGC-1α, the master regulator of mitochondrial biogenesis. Over weeks of consistent volume, muscles develop denser networks of mitochondria and capillary beds, dramatically enhancing your physiological aerobic ceiling.',
        bodyAr:
          'الجهد الهوائي المستمر ومنخفض الشدة ينشط مسار PGC-1α الخلوي المسؤول عن تكاثر الميتوكوندريا. مع الاستمرارية، تبني العضلات شبكات أوعية دموية دقيقة وميتوكوندريا أكثر كثافة، مما يرفع سقف طاقتك الرياضية ويخفض نبض قلبك أثناء الراحة.',
      },
    ],
    takeawayEn:
      'Prescription: Spend 150–180 minutes weekly in Zone 2 (conversational pace, 60–70% HR max) to build an unbreakable aerobic engine.',
    takeawayAr:
      'البرنامج المقترح: خصص 150 إلى 180 دقيقة أسبوعياً في المنطقة 2 (بسرعة تسمح لك بالحديث دون انقطاع النفس، 60-70% من النبض الأقصى).',
  },
  vagus: {
    id: 'vagus',
    titleEn: 'Vagal Nerve Activation via 0.1Hz Resonance Breathing',
    titleAr: 'تنشيط العصب الحائر (المبهم) عبر التنفس بتردد الرنين 0.1 هرتز',
    categoryEn: 'NEUROLOGY & BREATHWORK',
    categoryAr: 'علم الأعصاب والتحكم التنفسي',
    readTimeEn: '3 min read',
    readTimeAr: '3 دقائق قراءة',
    tag: 'RECOVERY',
    summaryEn:
      'Resonance frequency breathwork synchronizes cardiac rhythms and pulmonary dynamics to induce immediate parasympathetic dominance.',
    summaryAr:
      'يعمل التنفس بتردد الرنين على مزامنة نبضات القلب مع حركة الرئتين لإحداث استجابة استرخاء فورية وتنشيط مباشر للجهاز العصبي نظير الودي.',
    sections: [
      {
        headingEn: '1. The 0.1 Hz Baroreceptor Resonance Phenomenon',
        headingAr: '١. ظاهرة رنين مستقبلات الضغط بتردد 0.1 هرتز',
        bodyEn:
          'When breathing slows to approximately 6 breaths per minute (0.1 Hz), respiratory sinus arrhythmia (RSA) achieves perfect phase alignment with blood pressure waves (Mayer waves). This resonance mechanically stimulates vagal baroreceptors, triggering profound acetylcholine release and immediate reductions in cortisol.',
        bodyAr:
          'عندما يتباطأ معدل التنفس إلى حوالي 6 أنفاس في الدقيقة (0.1 هرتز)، يتطابق تباين النبض التنفسي تماماً مع موجات ضغط الدم الشرياني. هذا الرنين يحفز مستقبلات الضغط في العصب المبهم، مما يفرز الناقل العصبي الأسيتيل كولين ويخفض هرمون الكورتيزول فوراً.',
      },
      {
        headingEn: '2. Clinical Application: The 4-6 Breathing Pattern',
        headingAr: '٢. التطبيق العملي: نمط التنفس 4 شهيق - 6 زفير',
        bodyEn:
          'Prolonging exhalation relative to inhalation (e.g., 4 seconds in through the nose, 6 seconds slow exhalation) activates pulmonary stretch receptors that signal the medulla oblongata to slow the heart rate and lower acute physiological stress scores.',
        bodyAr:
          'إطالة فترة الزفير مقارنة بالشهيق (مثل 4 ثوانٍ شهيق هادئ من الأنف يليها 6 ثوانٍ زفير ممتد) يحفز مستقبلات التمدد الرئوية التي ترسل إشارات فورية لمركز التحكم في الدماغ لتهدئة النبض وخفض مقياس التوتر الفسيولوجي.',
      },
    ],
    takeawayEn:
      'Try It Now: Perform 3 minutes of 0.1Hz resonant breathing before bed or following intense strain to fast-track physiological recovery.',
    takeawayAr:
      'جربها الآن: مارس 3 دقائق من التنفس بتردد الرنين قبل النوم أو بعد التمرين الشاق لتسريع استشفائك ورفع جاهزية الغد.',
  },
};

interface ArticleModalProps {
  articleId: string | null;
  onClose: () => void;
  onOpenBreathePacer?: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  articleId,
  onClose,
  onOpenBreathePacer,
}) => {
  const { isRtl } = useLanguage();
  if (!articleId) return null;

  const article = SCIENCE_ARTICLES[articleId];
  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] bg-[#0E1116] border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#0093E9] uppercase font-bold">
              {isRtl ? article.categoryAr : article.categoryEn}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {isRtl ? article.readTimeAr : article.readTimeEn}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar flex-1">
          {/* Tag & Title */}
          <div className="space-y-2">
            <div className="inline-block bg-[#0093E9]/15 text-[#0093E9] border border-[#0093E9]/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
              #{article.tag}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-sans leading-tight">
              {isRtl ? article.titleAr : article.titleEn}
            </h1>
          </div>

          {/* Abstract / Summary */}
          <div className="p-4 rounded-2xl bg-[#141820] border-l-4 border-l-[#0093E9] border border-white/5 text-sm text-zinc-300 leading-relaxed font-sans">
            {isRtl ? article.summaryAr : article.summaryEn}
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {article.sections.map((sec, idx) => (
              <div key={idx} className="space-y-1.5">
                <h2 className="text-sm font-bold text-white font-sans">
                  {isRtl ? sec.headingAr : sec.headingEn}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {isRtl ? sec.bodyAr : sec.bodyEn}
                </p>
              </div>
            ))}
          </div>

          {/* Key Protocol / Takeaway Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121820] to-[#161D28] border border-[#00F0FF]/20 space-y-1">
            <div className="text-[11px] font-black uppercase text-[#00F0FF] font-condensed tracking-wider">
              {isRtl ? 'الخلاصة والتطبيق العملي' : 'KEY PROTOCOL & TAKEAWAY'}
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans font-medium">
              {isRtl ? article.takeawayAr : article.takeawayEn}
            </p>
          </div>

          {/* Special Action if Vagus Article */}
          {article.id === 'vagus' && onOpenBreathePacer && (
            <button
              onClick={() => {
                onClose();
                onOpenBreathePacer();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0093E9] to-[#00F0FF] hover:opacity-90 text-black font-black uppercase tracking-wider font-condensed text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0093E9]/30 transition-all active:scale-98"
            >
              <Activity className="w-4 h-4" />
              <span>{isRtl ? 'بدء جلسة تنفس الرنين الآن (0.1 هرتز)' : 'START RESONANCE BREATHING SESSION'}</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#12151B] border-t border-white/5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
          >
            {isRtl ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
