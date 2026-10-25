import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  Key,
  Check,
  Zap,
} from 'lucide-react';
import type { LiveMetrics, UserSettings, SleepMetrics } from '../types/whoop';
import { WhoopEmblemIcon } from './WhoopLogo';
import { useLanguage } from '../i18n/LanguageContext';
import { SheetBackdrop, SheetPanel } from './motion/Sheet';
import {
  askWhoopCoach,
  generateWelcomeMessage,
  type WhoopCoachContext,
} from '../services/whoopCoachEngine';
import { motion, AnimatePresence } from 'framer-motion';

export interface WhoopCoachChatSheetProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: LiveMetrics;
  sleepData?: SleepMetrics | null;
  isStrapConnected?: boolean;
  settings: UserSettings;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  source?: 'cloud_gemini' | 'offline_engine';
}

export const WhoopCoachChatSheet: React.FC<WhoopCoachChatSheetProps> = ({
  isOpen,
  onClose,
  metrics,
  sleepData,
  isStrapConnected = false,
  settings,
}) => {
  const { t, isRtl } = useLanguage();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('whoop_gemini_api_key') || '' : '';
  });
  const [keySavedFeedback, setKeySavedFeedback] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Assemble comprehensive real-time physiological context
  const coachContext: WhoopCoachContext = useMemo(() => {
    return {
      recoveryScore: metrics.recoveryScore,
      recoveryCategory: metrics.recoveryCategory,
      hrv: metrics.lockedHrv ?? metrics.currentHrv,
      rhr: metrics.restingHr,
      respiratoryRate: metrics.lockedRespiratoryRate ?? metrics.respiratoryRate,
      skinTempCelsius: metrics.skinTempCelsius,
      skinTempDelta: metrics.skinTempDelta,
      spO2: metrics.spO2,
      sleepPerformance: sleepData?.sleepPerformance ?? metrics.sleepPerformance,
      hoursAsleep: sleepData?.hoursAsleep ?? metrics.hoursAsleep,
      hoursInBed: sleepData?.hoursInBed ?? metrics.hoursInBed,
      sleepNeed: sleepData?.sleepNeedHours ?? settings.sleepNeedHours ?? 8.0,
      sleepEfficiency: sleepData?.efficiencyPercent ?? null,
      sleepStages: sleepData?.stages ?? null,
      bedtime: sleepData?.bedtime ?? null,
      wakeTime: sleepData?.wakeTime ?? null,
      dayStrain: metrics.dailyStrain || 0,
      targetStrainMin: metrics.optimalStrainTarget?.min,
      targetStrainMax: metrics.optimalStrainTarget?.max,
      steps: metrics.steps || 0,
      calories: metrics.totalCalories || 0,
      activeCalories: metrics.activeCalories || 0,
      liveHeartRate: metrics.currentHr,
      isStrapConnected: isStrapConnected,
      language: isRtl ? 'ar' : 'en',
    };
  }, [metrics, sleepData, isStrapConnected, settings, isRtl]);

  // Initial welcome greeting with real physiological numbers
  const initialWelcome = useMemo(() => {
    return generateWelcomeMessage(coachContext, isRtl);
  }, [coachContext, isRtl]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-init',
      sender: 'coach',
      text: generateWelcomeMessage(coachContext, isRtl),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'offline_engine',
    },
  ]);

  // Update initial welcome message if metrics arrive after mount and user hasn't sent messages yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome-init') {
        return [
          {
            id: 'welcome-init',
            sender: 'coach',
            text: initialWelcome,
            timestamp: prev[0].timestamp,
            source: 'offline_engine',
          },
        ];
      }
      return prev;
    });
  }, [initialWelcome]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Bilingual quick questions
  const quickQuestions = isRtl
    ? [
        'كيف يجب أن أتمرن اليوم بناءً على تعافيي؟',
        'حلل جودة نومي ومراحله الليلة الماضية',
        'ماذا تعني قراءة الـ HRV ونبض الراحة اليوم؟',
        'كم أحتاج من النوم الليلة لسد فجوة الإجهاد؟',
        'ما هو الجهد التراكمي المستهدف لي اليوم؟',
        'نصائح لتسريع الاستشفاء وتخفيف التوتر',
      ]
    : [
        'How should I train today based on my recovery?',
        'Analyze my sleep quality and stages from last night',
        'What do my HRV and RHR readings mean today?',
        'How much sleep do I need tonight to cover my strain?',
        'What is my optimal strain target today?',
        'Tips to accelerate recovery and reduce stress',
      ];

  const handleSend = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Realistic processing window (600-900ms) for clinical computation
    const processingDelay = new Promise((resolve) => setTimeout(resolve, 750));

    try {
      const [coachResult] = await Promise.all([
        askWhoopCoach(trimmed, coachContext),
        processingDelay,
      ]);

      const coachMessage: ChatMessage = {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: coachResult.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: coachResult.source,
      };

      setMessages((prev) => [...prev, coachMessage]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: isRtl
          ? 'عذراً، حدث خطأ أثناء معالجة السؤال. يمكنك المحاولة مجدداً.'
          : 'Sorry, an error occurred while processing your question. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'offline_engine',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'coach',
        text: generateWelcomeMessage(coachContext, isRtl),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'offline_engine',
      },
    ]);
  };

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      const cleanKey = geminiKeyInput.trim();
      if (cleanKey) {
        localStorage.setItem('whoop_gemini_api_key', cleanKey);
      } else {
        localStorage.removeItem('whoop_gemini_api_key');
      }
      setKeySavedFeedback(true);
      setTimeout(() => setKeySavedFeedback(false), 2500);
      setShowKeyConfig(false);
    }
  };

  const hasConfiguredKey = Boolean(geminiKeyInput.trim());

  return (
    <SheetBackdrop isOpen={isOpen} onClose={onClose}>
      <SheetPanel
        onClose={onClose}
        enableDrag={false}
        className="h-[88vh] max-h-[88vh] bg-[#12151A] flex flex-col p-0 overflow-hidden border-t sm:border border-white/10 select-none"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#16191E]">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <WhoopEmblemIcon size={30} />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#16EC06] border-2 border-[#16191E]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black uppercase tracking-wider font-condensed text-white">
                  {t('whoopCoach')}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1 ${
                    hasConfiguredKey
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30'
                      : 'bg-[#16EC06]/15 text-[#16EC06] border border-[#16EC06]/30'
                  }`}
                >
                  {hasConfiguredKey ? (
                    <>
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{isRtl ? 'سحابي (Gemini)' : 'Cloud AI'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-2.5 h-2.5" />
                      <span>{isRtl ? 'ذكاء حيوي (Offline)' : 'Clinical AI'}</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-sans">
                {isRtl ? 'تحليل فسيولوجي وتوجيه تدريبي فوري' : 'Real-time physiological & sports science coaching'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Configure Cloud Key Button */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`p-2 rounded-xl transition-colors ${
                showKeyConfig
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title={isRtl ? 'إعدادات مفتاح Gemini AI' : 'Gemini AI Key Settings'}
            >
              <Key className="w-4 h-4" />
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={handleResetChat}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title={isRtl ? 'محادثة جديدة' : 'New Chat'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title={isRtl ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Gemini API Key Drawer */}
        <AnimatePresence>
          {showKeyConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#0B0D10] border-b border-white/10 p-3.5 space-y-2.5 overflow-hidden text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white font-condensed uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#00F0FF]" />
                  {isRtl ? 'إعداد مفتاح Google Gemini API (اختياري)' : 'Google Gemini API Key (Optional)'}
                </span>
                {keySavedFeedback && (
                  <span className="text-[10px] text-[#16EC06] font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {isRtl ? 'تم الحفظ' : 'Saved'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                {isRtl
                  ? 'إذا تركت الحقل فارغاً، سيعمل المدرب افتراضياً بنسبة 100% دون اتصال عبر محرك الذكاء الفسيولوجي المدمج.'
                  : 'Leave empty to run 100% offline with zero dependencies using the built-in clinical sports science engine.'}
              </p>
              <form onSubmit={handleSaveGeminiKey} className="flex gap-2">
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-[#00F0FF]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-[#00F0FF] text-black font-condensed font-bold uppercase hover:bg-cyan-300 transition-colors"
                >
                  {isRtl ? 'حفظ' : 'Save'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 border-b border-white/5 bg-[#0F1216] overflow-x-auto flex gap-2 no-scrollbar">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isTyping}
              className="text-[11px] whitespace-nowrap bg-[#16191E] border border-white/10 hover:border-[#00F0FF]/40 hover:bg-[#1A1F26] px-3 py-1.5 rounded-full text-zinc-300 hover:text-white font-sans active:scale-95 transition-all text-start disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user'
                  ? isRtl
                    ? 'items-start'
                    : 'items-end'
                  : isRtl
                  ? 'items-end'
                  : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] p-3.5 sm:p-4 rounded-2xl text-xs leading-relaxed text-start shadow-md ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-[#0093E9] to-[#00B4D8] text-white font-medium rounded-br-sm'
                    : 'bg-[#181C22] border border-white/10 text-zinc-200 rounded-bl-sm space-y-1.5'
                }`}
              >
                {/* Message Body with Markdown Line Breaks */}
                <div className="whitespace-pre-line font-sans">{m.text}</div>

                {/* Source attribution for coach response */}
                {m.sender === 'coach' && (
                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      {m.source === 'cloud_gemini' ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-[#00F0FF]" />
                          <span className="text-[#00F0FF]">Gemini 2.5 Flash</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-2.5 h-2.5 text-[#16EC06]" />
                          <span className="text-[#16EC06]">WHOOP Clinical Engine</span>
                        </>
                      )}
                    </span>
                    <span dir="ltr">{m.timestamp}</span>
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <span className="text-[9px] text-zinc-500 font-mono mt-1 px-1" dir="ltr">
                  {m.timestamp}
                </span>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className={`flex flex-col ${isRtl ? 'items-end' : 'items-start'}`}>
              <div className="p-3.5 rounded-2xl bg-[#181C22] border border-white/10 text-zinc-300 rounded-bl-sm flex items-center gap-2.5">
                <div className="flex gap-1">
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"
                  />
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#16EC06]"
                  />
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut', delay: 0.4 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#FFDE00]"
                  />
                </div>
                <span className="text-[11px] font-sans text-zinc-400">
                  {isRtl ? 'WHOOP Coach يحلل بياناتك الحيوية...' : 'WHOOP Coach is analyzing your biometrics...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/5 bg-[#14171D]">
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                disabled={isTyping}
                placeholder={isRtl ? 'اسأل مدرب WHOOP عن أي شيء...' : 'Ask WHOOP anything...'}
                className="w-full px-4 py-2.5 rounded-full bg-[#0B0D10] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:border-[#00F0FF] text-start disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                input.trim() && !isTyping
                  ? 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-md shadow-white/10 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Send className={`w-4 h-4 stroke-[2.2] ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </form>
        </div>
      </SheetPanel>
    </SheetBackdrop>
  );
};
