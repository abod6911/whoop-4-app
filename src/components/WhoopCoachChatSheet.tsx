import React, { useState } from 'react';
import { X, Send, Sparkles, ChevronRight } from 'lucide-react';
import type { LiveMetrics, UserSettings } from '../types/whoop';
import { WhoopEmblemIcon } from './WhoopLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';

interface WhoopCoachChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  settings: UserSettings;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export const WhoopCoachChatSheet: React.FC<WhoopCoachChatSheetProps> = ({
  isOpen,
  onClose,
  metrics,
  settings,
}) => {
  const { t, isRtl } = useLanguage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'm-1',
      sender: 'coach',
      text: isRtl
        ? `مرحباً بك! أنا مدرب WHOOP الذكي. متصل مباشرة بحساسات سوارك WHOOP 4.0. اسألني عن مستوى استشفائك اليوم (${metrics.recoveryScore ?? '--'}%)، أو جهدك الحالي (${metrics.dailyStrain > 0 ? metrics.dailyStrain.toFixed(1) : '0.0'})، أو نصائح النوم المناسبة الليلة.`
        : `Hello! I'm WHOOP Coach. I'm connected directly to your WHOOP 4.0 strap telemetry. Ask me anything about your current recovery (${metrics.recoveryScore ?? '--'}%), today's strain (${metrics.dailyStrain > 0 ? metrics.dailyStrain.toFixed(1) : '0.0'}), or recommendations for tonight's sleep.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickQuestions = isRtl
    ? [
        'كيف أتدرب اليوم بناءً على نسبة الاستشفاء؟',
        'اشرح لي معدل تقلب ضربات القلب (HRV) والجاهزية العصبية.',
        'كم ساعة نوم أحتاج الليلة؟',
        'ما هو الجهد المستهدف المثالي لي اليوم؟',
      ]
    : [
        'How should I train today based on my recovery?',
        'Explain my current HRV and autonomic readiness.',
        'How much sleep do I need tonight?',
        'What is my optimal strain target today?',
      ];

  const generateCoachResponse = (query: string): string => {
    const q = query.toLowerCase();
    const recovery = metrics.recoveryScore;
    const strain = metrics.dailyStrain;
    const hrv = metrics.currentHrv;
    const rhr = metrics.restingHr;
    const calibratingMsg = isRtl
      ? 'نسبة الاستشفاء قيد المعايرة. تُحسب من HRV ونبض الراحة بعد جمع بيانات كافية من السوار، لذلك لا أستطيع إعطاء توصية تدريب دقيقة الآن.'
      : 'Recovery is still calibrating. It needs enough HRV and resting-HR data from the strap, so I can\'t give a reliable training recommendation yet.';

    if (q.includes('train') || q.includes('workout') || q.includes('exercise') || q.includes('تدرب') || q.includes('تمرين')) {
      if (recovery === null) return calibratingMsg;
      if (recovery >= 67) {
        return isRtl
          ? `نسبة استشفائك في المنطقة الخضراء (${recovery}%). جهازك العصبي اللاودي في أعلى جاهزية مع HRV عند ${hrv ?? '--'} مللي ثانية. جسمك مهيأ لتحمل أعلى مستويات الإجهاد البدني والقلبي. استهدف جهداً يومياً بين ${metrics.optimalStrainTarget.min.toFixed(1)} و ${metrics.optimalStrainTarget.max.toFixed(1)}.`
          : `Your Recovery is in the GREEN (${recovery}%). Your parasympathetic nervous system is well-calibrated with an HRV of ${hrv ?? '--'} ms. Your body is primed to take on high cardiac and muscular strain today. Aim for a Day Strain target between ${metrics.optimalStrainTarget.min.toFixed(1)} and ${metrics.optimalStrainTarget.max.toFixed(1)}.`;
      } else if (recovery !== null && recovery >= 34) {
        return isRtl
          ? `نسبة استشفائك في المنطقة الصفراء (${recovery}%). لديك سعة بدنية معتدلة اليوم. حافظ على نشاطك في النطاق المستهدف (${metrics.optimalStrainTarget.min.toFixed(1)} - ${metrics.optimalStrainTarget.max.toFixed(1)}). ركز على الجودة وتجنب استنزاف طاقتك.`
          : `Your Recovery is in the YELLOW (${recovery}%). You have moderate physiological capacity today. Maintain moderate activity (target strain: ${metrics.optimalStrainTarget.min.toFixed(1)} - ${metrics.optimalStrainTarget.max.toFixed(1)}). Focus on quality movement and avoid excessive anaerobic fatigue.`;
      } else {
        return isRtl
          ? `نسبة استشفائك في المنطقة الحمراء (${recovery ?? '--'}%). سعتك القلبية الوعائية منخفضة اليوم (نبض الراحة ${rhr} ن/د). امنح الأولوية للاستشفاء الفعال، شرب السوائل، والتمارين الخفيفة لإعادة التوازن لجسمك.`
          : `Your Recovery is in the RED (${recovery ?? '--'}%). Your cardiovascular capacity is reduced today (RHR is ${rhr ?? '--'} bpm). Focus on active recovery, hydration, gentle mobility or stretching, and keep your exertion low to allow systemic restoration.`;
      }
    }

    if (q.includes('hrv') || q.includes('readiness') || q.includes('autonomic') || q.includes('تقلب') || q.includes('جاهزية')) {
      return isRtl
        ? `معدل تقلب نبضات قلبك الحالي (HRV) هو ${hrv !== null ? `${hrv} مللي ثانية` : 'قيد المعايرة'}. ارتفاع HRV يعكس نشاط العصب المبهم ومرونة القلب في التكيف مع الضغوط.`
        : `Your current HRV is ${hrv !== null ? `${hrv} ms` : 'calibrating'}. Higher HRV reflects higher vagal nerve tone and cardiovascular adaptability. When your HRV exceeds your baseline, your body is resilient to stress; when depressed, it indicates fatigue, dehydration, or immune challenge.`;
    }

    if (q.includes('sleep') || q.includes('bed') || q.includes('night') || q.includes('نوم') || q.includes('ساعات')) {
      const base = settings.sleepNeedHours;
      const strainDebt = Math.round((strain / 21.0) * 1.4 * 10) / 10;
      const totalNeed = (base + strainDebt).toFixed(1);
      return isRtl
        ? `بناءً على الجهد التراكمي اليوم (${strain.toFixed(1)})، تم تعديل احتياج نومك الأساسي (${base}س) بإضافة دين إجهاد +${strainDebt}س، ليصبح إجمالي احتياجك للنوم الليلة حوالي ${totalNeed} ساعة للوصول إلى استشفاء 100%.`
        : `Based on today's accumulated Day Strain (${strain.toFixed(1)}), your baseline sleep need of ${base}h is adjusted by +${strainDebt}h strain debt, totaling approximately ${totalNeed} hours of sleep needed tonight to reach 100% recovery.`;
    }

    if (q.includes('strain') || q.includes('target') || q.includes('جهد') || q.includes('مستهدف')) {
      return isRtl
        ? `جهدك اليومي الحالي هو ${strain.toFixed(1)} / 21.0. نظراً لنسبة استشفاء اليوم (${recovery !== null ? `${recovery}%` : 'قيد المعايرة'})، ${metrics.optimalStrainTarget.max > 0 ? `فإن نطاق الإجهاد الأمثل لك هو ${metrics.optimalStrainTarget.min.toFixed(1)} - ${metrics.optimalStrainTarget.max.toFixed(1)}.` : 'ولم يُحسب نطاق مستهدف بعد.'}`
        : `Your Day Strain is currently ${strain.toFixed(1)} / 21.0. Given today's ${recovery !== null ? `${recovery}% Recovery` : 'calibration state'}, ${metrics.optimalStrainTarget.max > 0 ? `your optimal stimulus target is ${metrics.optimalStrainTarget.min.toFixed(1)} - ${metrics.optimalStrainTarget.max.toFixed(1)}.` : 'no target range has been computed yet.'}`;
    }

    return isRtl
      ? `تحليل القياسات الحيوية المباشرة: النبض ${metrics.currentHr ?? '--'} ن/د، HRV هو ${hrv ?? '--'} مللي ثانية، وجهد اليوم ${strain.toFixed(1)}. تأكد من ثبات السوار على معصمك لضمان تدفق البيانات. أخبرني إذا أردت مشورة تدريبية أو تحليلاً للنوم!`
      : `Analyzing your live biometrics: Current HR is ${metrics.currentHr ?? '--'} BPM, HRV is ${hrv ?? '--'} ms, and today's Day Strain is ${strain.toFixed(1)}. Keep your strap snug on the wrist to ensure continuous beat-to-beat PPG telemetry. Let me know if you want training advice or a sleep breakdown!`;
  };

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: now,
    };

    const coachReplyText = generateCoachResponse(userText);
    const coachMsg: ChatMessage = {
      id: `c-${Date.now() + 1}`,
      sender: 'coach',
      text: coachReplyText,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg, coachMsg]);
    setInput('');
  };

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel onClose={onClose} className="h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <WhoopEmblemIcon size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black uppercase tracking-wider font-condensed text-white">
                  {t('whoopCoach')}
                </span>
                <span className="text-[10px] bg-[#0093E9]/20 text-[#0093E9] px-1.5 py-0.2 rounded font-mono font-bold">
                  {isRtl ? 'ذكاء اصطناعي حيوي' : 'AI BIOMETRICS'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans">
                {isRtl ? 'رؤى وتوجيهات صحية وتدريبية مباشرة' : 'Real-Time Health & Training Insights'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#16191E] text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 border-b border-white/5 overflow-x-auto flex gap-2 no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] whitespace-nowrap bg-[#16191E] border border-white/5 hover:border-zinc-700 px-3 py-1.5 rounded-full text-zinc-300 font-sans active:scale-95 transition-all text-start"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'user' ? (isRtl ? 'items-start' : 'items-end') : (isRtl ? 'items-end' : 'items-start')}`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed text-start ${
                  m.sender === 'user'
                    ? 'bg-[#0093E9] text-white rounded-br-sm'
                    : 'bg-[#16191E] border border-white/5 text-zinc-200 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-zinc-500 font-mono mt-1 px-1" dir="ltr">
                {m.timestamp}
              </span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/5 bg-[#12151A]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRtl ? 'اسأل مدرب WHOOP عن أي شيء...' : 'Ask WHOOP anything...'}
                className="w-full px-4 py-2.5 rounded-full bg-[#0B0D10] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#0093E9] text-start"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40 hover:bg-zinc-200 transition-colors"
            >
              <Send className={`w-4 h-4 stroke-[2.2] ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </form>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
