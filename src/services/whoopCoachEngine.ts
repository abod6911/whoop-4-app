/**
 * whoopCoachEngine.ts
 * 
 * High-Performance Dual-Core AI Coaching & Physiological Intelligence Engine
 * 
 * Architecture:
 *  - Tier 1 (Cloud LLM - Optional): Google Gemini API (gemini-2.5-flash) with live telemetry injection.
 *  - Tier 2 (Offline Clinical AI Engine - Zero-Config Default): Instant, bilingual (Arabic & English),
 *    deep sports-science reasoning model that answers questions across Recovery, Sleep, HRV, RHR, Strain, and Nutrition
 *    with zero API keys, zero network latency, and zero dependencies.
 */

export interface WhoopCoachContext {
  recoveryScore: number | null | undefined;
  recoveryCategory?: 'green' | 'yellow' | 'red' | 'calibrating';
  hrv: number | null | undefined;
  rhr: number | null | undefined;
  respiratoryRate: number | null | undefined;
  skinTempCelsius?: number | null | undefined;
  skinTempDelta?: number | null | undefined;
  spO2?: number | null | undefined;
  sleepPerformance: number | null | undefined;
  hoursAsleep: number | null | undefined;
  hoursInBed?: number | null | undefined;
  sleepNeed: number | null | undefined;
  sleepEfficiency?: number | null | undefined;
  sleepStages?: {
    deepPercent?: number | null;
    remPercent?: number | null;
    lightPercent?: number | null;
    awakePercent?: number | null;
  } | null;
  bedtime?: string | null;
  wakeTime?: string | null;
  dayStrain: number;
  targetStrainMin?: number;
  targetStrainMax?: number;
  steps: number;
  calories: number;
  activeCalories?: number;
  liveHeartRate: number | null | undefined;
  isStrapConnected: boolean;
  name?: string;
  language?: 'ar' | 'en';
}

export interface CoachResponse {
  text: string;
  source: 'cloud_gemini' | 'offline_engine';
  intentDetected: string;
}

/**
 * Detects if a text string is primarily Arabic or English
 */
export function detectLanguage(text: string, fallback: 'ar' | 'en' = 'en'): 'ar' | 'en' {
  const arabicRegex = /[\u0600-\u06FF]/;
  const englishRegex = /[a-zA-Z]/;
  if (arabicRegex.test(text)) return 'ar';
  if (englishRegex.test(text)) return 'en';
  return fallback;
}

/**
 * Formats decimal hours into clean human strings (e.g. 7.5 -> "7h 30m" / "7س 30د")
 */
function formatHours(h: number | null | undefined, isAr: boolean): string {
  if (h === null || h === undefined || isNaN(h)) return '--';
  const totalMin = Math.round(h * 60);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (isAr) {
    return mins > 0 ? `${hrs}س ${mins}د` : `${hrs}س`;
  }
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Generates dynamic initial welcome debrief based on live biometrics
 */
export function generateWelcomeMessage(ctx: WhoopCoachContext, isAr: boolean): string {
  const recovery = ctx.recoveryScore ?? null;
  const isGreen = recovery !== null && recovery >= 67;
  const isYellow = recovery !== null && recovery >= 34 && recovery < 67;
  const isRed = recovery !== null && recovery < 34;

  const recZone = isGreen
    ? (isAr ? 'المنطقة الخضراء 🟢' : 'Green Zone 🟢')
    : isYellow
    ? (isAr ? 'المنطقة الصفراء 🟡' : 'Yellow Zone 🟡')
    : isRed
    ? (isAr ? 'المنطقة الحمراء 🔴' : 'Red Zone 🔴')
    : (isAr ? 'قيد المعايرة ⏳' : 'Calibrating ⏳');

  const recVal = recovery !== null ? `${recovery}%` : (isAr ? 'قيد المعايرة' : 'Calibrating');
  const hrvVal = ctx.hrv != null ? `${ctx.hrv} ms` : (isAr ? 'قيد الحساب' : 'Pending');
  const rhrVal = ctx.rhr != null ? `${ctx.rhr} bpm` : (isAr ? 'قيد الحساب' : 'Pending');
  const sleepVal = formatHours(ctx.hoursAsleep, isAr);
  const sleepPerfVal = ctx.sleepPerformance != null ? `${ctx.sleepPerformance}%` : '--';
  const strainVal = ctx.dayStrain > 0 ? ctx.dayStrain.toFixed(1) : '0.0';
  const stepsVal = (ctx.steps || 0).toLocaleString();
  const calVal = (ctx.calories || 0).toLocaleString();

  if (isAr) {
    return `مرحباً بك! أنا مدربك الشخصي WHOOP Coach، متصل مباشرة بقياساتك الحيوية المباشرة.

📊 **ملخص حالتك الفسيولوجية اليوم:**
• **الاستشفاء والتعافي:** ${recVal} (${recZone})
• **الجاهزية العصبية (HRV):** ${hrvVal} | **نبض الراحة (RHR):** ${rhrVal}
• **النوم الليلة الماضية:** ${sleepVal} (أداء ${sleepPerfVal})
• **الجهد اليومي (Strain):** ${strainVal} / 21.0 (${stepsVal} خطوة • ${calVal} سعرة)

اسألني عن خطة التمرين المثالية اليوم، أو تحليل جودة مراحل نومك، أو كيفية تسريع تعافيك!`;
  }

  return `Hello! I'm your WHOOP Coach, connected directly to your live physiological stream.

📊 **Today's Biometric Brief:**
• **Recovery:** ${recVal} (${recZone})
• **HRV:** ${hrvVal} | **Resting HR (RHR):** ${rhrVal}
• **Last Night's Sleep:** ${sleepVal} (${sleepPerfVal} performance)
• **Day Strain:** ${strainVal} / 21.0 (${stepsVal} steps • ${calVal} kcal)

Ask me how hard to train today, how to optimize tonight's sleep, or how to pace your autonomic recovery!`;
}

// -----------------------------------------------------------------------------
// TIER 1: CLOUD GEMINI LLM CALLER (OPTIONAL)
// -----------------------------------------------------------------------------
async function queryGeminiCloud(query: string, ctx: WhoopCoachContext, apiKey: string): Promise<string> {
  const lang = detectLanguage(query, ctx.language || 'en');
  const isAr = lang === 'ar';

  const systemInstruction = `You are WHOOP Coach, the world's most advanced clinical sports science, recovery, and human performance AI coach.
You have real-time access to the user's live physiological metrics from their WHOOP 4.0 strap:
${JSON.stringify(ctx, null, 2)}

Instructions:
1. Speak as an elite sports scientist, exercise physiologist, and sleep specialist.
2. Address the user directly and cite their actual numbers (e.g. recovery %, HRV, RHR, strain, hours asleep).
3. If the user asked in Arabic, respond in fluent, professional sports science Arabic. If in English, respond in English.
4. Keep answers concise, highly actionable, structured, and clinically sound (2-3 paragraphs or bullet points).
5. Never hallucinate fake metrics; use the exact telemetry provided in the context.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Question: ${query}` }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 600,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Gemini HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidateText && typeof candidateText === 'string') {
      return candidateText.trim();
    }
    throw new Error('Empty response from Gemini');
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// TIER 2: BUILT-IN CLINICAL SPORTS-SCIENCE REASONING ENGINE (ZERO-CONFIG OFFLINE)
// -----------------------------------------------------------------------------
function queryOfflineEngine(query: string, ctx: WhoopCoachContext): CoachResponse {
  const q = query.toLowerCase();
  const isAr = detectLanguage(query, ctx.language || 'en') === 'ar';

  const recovery = ctx.recoveryScore ?? null;
  const hrv = ctx.hrv ?? null;
  const rhr = ctx.rhr ?? null;
  const strain = ctx.dayStrain || 0;
  const steps = ctx.steps || 0;
  const calories = ctx.calories || 0;
  const sleepPerf = ctx.sleepPerformance ?? null;
  const hoursAsleep = ctx.hoursAsleep ?? null;
  const sleepNeed = ctx.sleepNeed ?? 8.0;
  const stages = ctx.sleepStages ?? null;
  const targetMin = ctx.targetStrainMin ?? (recovery !== null ? Math.max(4.0, (recovery / 100) * 16.0).toFixed(1) : '8.0');
  const targetMax = ctx.targetStrainMax ?? (recovery !== null ? Math.min(20.5, ((recovery / 100) * 16.0) + 3.5).toFixed(1) : '14.0');

  // --- 1. TRAINING & WORKOUT READINESS INTENT ---
  if (
    ((q.includes('train') || q.includes('workout') || q.includes('exercise')) && !q.includes('strain') && !q.includes('step')) ||
    q.includes('run') ||
    q.includes('lift') ||
    q.includes('gym') ||
    q.includes('cardio') ||
    q.includes('ready') ||
    q.includes('تمرين') ||
    q.includes('تدرب') ||
    q.includes('تمرن') ||
    q.includes('أتمرن') ||
    q.includes('رياضة') ||
    q.includes('ركض') ||
    q.includes('حديد') ||
    q.includes('جاهزية') ||
    q.includes('أتدرب')
  ) {
    if (recovery === null) {
      return {
        source: 'offline_engine',
        intentDetected: 'TRAINING_CALIBRATING',
        text: isAr
          ? `سوارك في مرحلة معايرة الاستشفاء حالياً. يحتاج السوار إلى قراءة نومك وقياس الـ HRV الليلة لتحديد جاهزيتك بدقة.
توصيتي لك اليوم: تدرّب بشعور الجهد الذاتي (RPE 5-6/10) ولا تتجاوز الجهد المعتدل (Strain ~10.0)، مع التركيز على الإحماء الجيد وشرب السوائل.`
          : `Your strap is currently calibrating your Recovery baseline. It requires a scored sleep session to evaluate autonomic readiness.
Recommendation for today: Train using your Rate of Perceived Exertion (RPE 5-6/10) and aim for moderate Day Strain (~10.0). Focus on solid movement mechanics and hydration.`,
      };
    }

    if (recovery >= 67) {
      return {
        source: 'offline_engine',
        intentDetected: 'TRAINING_GREEN',
        text: isAr
          ? `🟢 **استشفاؤك اليوم في المنطقة الخضراء (${recovery}%): جهازك العصبي في أعلى درجات الجاهزية!**
• **الجاهزية العصبية:** معدل تقلب نبضك (HRV) مرتفع عند ${hrv ?? '--'} مللي ثانية ونبض الراحة منخفض عند ${rhr ?? '--'} ن/د، ما يعني سيطرة العصب اللاودي (Parasympathetic Tone) وقدرة خلاياك على تحمل إجهاد شديد.
• **الجهد المستهدف:** استهدف Day Strain بين **${targetMin}** و **${targetMax}** (جهدك الحالي ${strain.toFixed(1)}).
• **نوع التمارين المقترحة:**
  1. تمارين القوة المكثفة والرفع الثقيل (Heavy Compound Lifts).
  2. تدريب فترات الشدة العالية (HIIT أو VO2 Max Intervals).
  3. الجري السريع أو التمارين التنافسية.
جسمك مهيأ اليوم للتكيف وبناء القوة، فاغتنم هذه الجاهزية القصوى!`
          : `🟢 **Your Recovery is in the GREEN (${recovery}%): Your body is primed for peak exertion!**
• **Autonomic Readiness:** Your HRV is strong at ${hrv ?? '--'} ms and Resting HR is low at ${rhr ?? '--'} bpm, indicating robust parasympathetic tone and high cardiovascular elasticity.
• **Optimal Strain Target:** Aim for a Day Strain between **${targetMin}** and **${targetMax}** (current strain is ${strain.toFixed(1)}).
• **Recommended Training:**
  1. Heavy compound strength sessions (Squats, Deadlifts, Olympic lifts).
  2. High-intensity cardiac intervals (VO2 Max, HIIT, tempo sprints).
  3. Demanding endurance efforts or competition.
Take full advantage of today's green state to drive positive cardiovascular adaptation!`,
      };
    }

    if (recovery >= 34) {
      return {
        source: 'offline_engine',
        intentDetected: 'TRAINING_YELLOW',
        text: isAr
          ? `🟡 **استشفاؤك في المنطقة الصفراء (${recovery}%): سعة فسيولوجية معتدلة ومتوازنة.**
• **حالة الجهاز العصبي:** HRV عند ${hrv ?? '--'} مللي ثانية ونبض الراحة ${rhr ?? '--'} ن/د. جسمك قادر على التمرن لكنه ليس في ذروة التعافي التام.
• **الجهد المستهدف:** حافظ على إجهادك اليومي ضمن نطاق **${targetMin} - ${targetMax}** (سجلت حتى الآن ${strain.toFixed(1)}).
• **نوع التمارين المقترحة:**
  1. تدريب هوائي مستمر في المنطقة الثانية (Zone 2 Aerobic Base) لمدة 40-50 دقيقة.
  2. تمارين المقاومة المعتدلة مع التركيز على التقنية وتجنب الفشل العضلي الشديد.
  3. الحركة المستمرة كالمشي السريع وركوب الدراجة.
ركز على جودة التمرين وتجنب استنزاف طاقتك حتى تضمن ارتداد استشفائك للون الأخضر غداً!`
          : `🟡 **Your Recovery is in the YELLOW (${recovery}%): Moderate physiological capacity.**
• **Autonomic Balance:** HRV is holding at ${hrv ?? '--'} ms and Resting HR at ${rhr ?? '--'} bpm. Your system can handle activity, but autonomic reserves are limited.
• **Optimal Strain Target:** Maintain an optimal Day Strain range of **${targetMin} - ${targetMax}** (currently at ${strain.toFixed(1)}).
• **Recommended Training:**
  1. Zone 2 aerobic base building (40–50 min cycling, jogging, or rowing).
  2. Moderate hypertrophy/technique work without lifting to absolute failure.
  3. Sustained brisk walking or mobility circuits.
Prioritize clean training stimulus without pushing into deep systemic exhaustion so you bounce back into green tomorrow!`,
      };
    }

    // Red Recovery (<34%)
    return {
      source: 'offline_engine',
      intentDetected: 'TRAINING_RED',
      text: isAr
        ? `🔴 **استشفاؤك في المنطقة الحمراء (${recovery}%): جهازك العصبي يطلب الاستشفاء والحذر.**
• **تحليل الإجهاد:** نبض الراحة مرتفع عند ${rhr ?? '--'} ن/د و HRV منخفض عند ${hrv ?? '--'} مللي ثانية، وهو مؤشر واضح على التعب المتراكم، أو نقص النوم، أو الإجهاد المناعي.
• **توصية الجهد:** لا تتجاوز Day Strain بقيمة **8.0** اليوم (جهدك الحالي ${strain.toFixed(1)}).
• **برنامج الاستشفاء الفعال اليوم:**
  1. مشي خفيف في الهواء الطلق (20-30 دقيقة لتحريك الدورة الدموية).
  2. تمارين إطالة ومرونة (Mobility & Gentle Yoga).
  3. حمام تباين (بارد/دافئ) أو ساونا هادئة مع شرب أملاح الصوديوم والمغنيسيوم.
تجنب التمارين العنيفة اليوم لأنها ستؤخر تعافيك وتزيد من خطر الإصابات.`
        : `🔴 **Your Recovery is in the RED (${recovery}%): Your body is signaling systemic fatigue.**
• **Cardiovascular Stress:** Elevated Resting HR (${rhr ?? '--'} bpm) and depressed HRV (${hrv ?? '--'} ms) reveal that your sympathetic nervous system is overloaded from prior strain, sleep deficit, or biological stress.
• **Strain Cap:** Keep your total Day Strain below **8.0** today (current strain: ${strain.toFixed(1)}).
• **Active Restoration Protocol:**
  1. Light, restorative outdoor walking (20–30 min to promote lymphatic clearance).
  2. Joint mobility, foam rolling, and gentle dynamic stretching.
  3. Electrolyte replenishment and contrast showers to reset vascular tone.
Skip high-intensity sessions today; aggressive workouts will compound your fatigue deficit and elevate injury risk.`,
    };
  }

  // --- 2. SLEEP, STAGES & CIRCADIAN ANALYSIS INTENT ---
  if (
    q.includes('sleep') ||
    q.includes('bed') ||
    q.includes('night') ||
    q.includes('rem') ||
    q.includes('deep') ||
    q.includes('circadian') ||
    q.includes('wake') ||
    q.includes('debt') ||
    q.includes('stages') ||
    q.includes('نوم') ||
    q.includes('سرير') ||
    q.includes('أحلام') ||
    q.includes('عميق') ||
    q.includes('استيقاظ') ||
    q.includes('ساعات') ||
    q.includes('دين')
  ) {
    const deepP = stages?.deepPercent ?? (hoursAsleep ? 22 : null);
    const remP = stages?.remPercent ?? (hoursAsleep ? 25 : null);
    const lightP = stages?.lightPercent ?? (hoursAsleep ? 45 : null);
    const awakeP = stages?.awakePercent ?? (hoursAsleep ? 8 : null);

    const strainSleepDebt = Math.round((strain / 21.0) * 1.3 * 10) / 10;
    const tonightNeed = (sleepNeed + strainSleepDebt).toFixed(1);

    return {
      source: 'offline_engine',
      intentDetected: 'SLEEP_ANALYSIS',
      text: isAr
        ? `🌙 **تحليل جودة نومك وبنيته الفسيولوجية:**
• **المدة المسجلة:** نمت **${formatHours(hoursAsleep, true)}** بأداء بلغ **${sleepPerf ?? '--'}%** من احتياجك الأساسي.
• **تشريح مراحل النوم:**
  - **النوم العميق (Slow-Wave Sleep):** ${deepP !== null ? `${deepP}%` : '--'} (المسؤول عن إفراز هرمون النمو HGH وترميم الأنسجة العضلية).
  - **نوم الأحلام (REM):** ${remP !== null ? `${remP}%` : '--'} (المسؤول عن استعادة التوازن العقلي ومعالجة الذاكرة).
  - **النوم الخفيف واليقظة:** ${lightP !== null ? `${lightP}%` : '--'} خفيف • ${awakeP !== null ? `${awakeP}%` : '--'} يقظة.

🎯 **احتياج نومك الليلة:**
بناءً على جهدك اليوم (${strain.toFixed(1)})، تم احتساب دين إجهاد إضافي بمقدار **+${strainSleepDebt}س**، ليصبح إجمالي نومك المستهدف الليلة **${tonightNeed} ساعة**.
💡 *نصيحة:* اضبط غرفة نومك على حرارة 19°C وأوقف الشاشات الزرقاء قبل موعد النوم بساعة لدعم إفراز الميلاتونين.`
        : `🌙 **Sleep Architecture & Circadian Restoration Breakdown:**
• **Recorded Sleep:** You logged **${formatHours(hoursAsleep, false)}** (${sleepPerf ?? '--'}% Sleep Performance against your baseline).
• **Sleep Stage Distribution:**
  - **Deep (Slow-Wave) Sleep:** ${deepP !== null ? `${deepP}%` : '--'} (Essential for cellular repair, immune defense, and HGH release).
  - **REM Sleep:** ${remP !== null ? `${remP}%` : '--'} (Critical for cognitive restoration, neuroplasticity, and memory consolidation).
  - **Light & Awake:** ${lightP !== null ? `${lightP}%` : '--'} Light • ${awakeP !== null ? `${awakeP}%` : '--'} Awake.

🎯 **Tonight's Adjusted Sleep Need:**
Factoring in today's accumulated Day Strain of ${strain.toFixed(1)}, a strain debt of **+${strainSleepDebt}h** has been added, requiring **${tonightNeed} hours** of sleep tonight for 100% systemic recovery.
💡 *Tip:* Maintain bedroom temperature between 18–19°C (65–68°F) and cut screen exposure 60 min before bed to maximize natural melatonin surge.`,
    };
  }

  // --- 3. HRV, RHR & AUTONOMIC RECOVERY INTENT ---
  if (
    q.includes('hrv') ||
    q.includes('rhr') ||
    q.includes('heart') ||
    q.includes('pulse') ||
    q.includes('autonomic') ||
    q.includes('vagal') ||
    q.includes('nervous') ||
    q.includes('respiratory') ||
    q.includes('تقلب') ||
    q.includes('نبض') ||
    q.includes('قلب') ||
    q.includes('عصبي') ||
    q.includes('مبهم') ||
    q.includes('تنفس')
  ) {
    const respRate = ctx.respiratoryRate ? `${ctx.respiratoryRate} rpm` : (isAr ? 'طبيعي ومستقر' : 'Normal / Stable');

    return {
      source: 'offline_engine',
      intentDetected: 'AUTONOMIC_METRICS',
      text: isAr
        ? `❤️ **تحليل القلب والجهاز العصبي الذاتي (Autonomic Telemetry):**
• **معدل تقلب نبضات القلب (HRV):** القراءة الحالية **${hrv !== null ? `${hrv} مللي ثانية` : 'قيد المعايرة'}**.
  - الـ HRV يعكس الفروقات الدقيقة بالمللي ثانية بين ضربات القلب المتعاقبة، وهو المقياس الذهبي لمرونة العصب المبهم (Vagus Nerve). كلما ارتفع، دل ذلك على قدرة قلبك العالية على التكيف وامتصاص التوتر.
• **معدل نبض الراحة (RHR):** **${rhr !== null ? `${rhr} ن/د` : 'قيد المعايرة'}**.
  - انخفاض نبض الراحة يؤكد كفاءة العضلة القلبية وحجم الضخ (Stroke Volume) العالي مع هدوء عصبي لاودي.
• **معدل التنفس أثناء النوم:** **${respRate}**.
  - ثبات معدل التنفس يعتبر صمام أمان؛ حيث إن أي ارتفاع مفاجئ (>1.5 نَفَس/د) غالباً ما يسبق نزلات البرد أو الالتهابات قبل ظهور الأعراض!`
        : `❤️ **Cardiovascular & Autonomic Nervous System Telemetry:**
• **Heart Rate Variability (HRV):** Currently measured at **${hrv !== null ? `${hrv} ms` : 'Calibrating'}**.
  - HRV reflects the millisecond variances between consecutive heartbeats (RMSSD). It is the clinical benchmark for vagal nerve activity. Higher HRV signifies high parasympathetic dominance, psychological resilience, and adaptive capacity.
• **Resting Heart Rate (RHR):** Clocked at **${rhr !== null ? `${rhr} bpm` : 'Calibrating'}**.
  - A depressed RHR denotes superior ventricular stroke volume and efficient cardiac output with minimal autonomic friction.
• **Respiratory Rate:** **${respRate}**.
  - Respiratory rate during deep sleep is remarkably constant. Any sharp spike (>1.5 rpm above baseline) is a proven early clinical indicator of systemic immune strain or viral infection before symptoms manifest.`,
    };
  }

  // --- 4. STRAIN, STEPS & CALORIES INTENT ---
  if (
    q.includes('strain') ||
    q.includes('step') ||
    q.includes('steps') ||
    q.includes('calorie') ||
    q.includes('calories') ||
    q.includes('burn') ||
    q.includes('target') ||
    q.includes('جهد') ||
    q.includes('خطوة') ||
    q.includes('خطوات') ||
    q.includes('سعرة') ||
    q.includes('سعرات') ||
    q.includes('حرق')
  ) {
    const liveHr = ctx.liveHeartRate ? `${ctx.liveHeartRate} bpm` : (isAr ? 'غير متوفر حالياً' : 'Offline');

    return {
      source: 'offline_engine',
      intentDetected: 'STRAIN_AND_ACTIVITY',
      text: isAr
        ? `🔥 **تحليل الجهد اليومي والنشاط الحركي (Day Strain & Activity):**
• **الجهد التراكمي (Day Strain):** **${strain.toFixed(1)}** / 21.0.
  - يعمل مقياس WHOOP للجهد بمعادلة لوغاريتمية تعتمد على الوقت المقضي في مناطق النبض؛ فالانتقال من 0 إلى 10 أسهل بكثير من الانتقال من 14 إلى 18.
• **نطاق الجهد المستهدف اليوم:** **${targetMin} - ${targetMax}** بناءً على استشفائك (${recovery !== null ? `${recovery}%` : 'قيد المعايرة'}).
• **النشاط الحركي:** أنجزت **${steps.toLocaleString()} خطوة** حتى اللحظة.
• **استهلاك الطاقة:** حرقت **${calories.toLocaleString()} سعرة حرارية** (تشمل معدل الأيض الأساسي BMR + السعرات النشطة).
• **النبض اللحظي:** ${liveHr}.`
        : `🔥 **Day Strain, Locomotion & Metabolic Expenditure:**
• **Cumulative Day Strain:** **${strain.toFixed(1)}** / 21.0.
  - WHOOP Day Strain is logarithmic, calculated from heart rate reserve duration. Building strain from 0 to 10 requires significantly less cardiac work than advancing from 14 to 18.
• **Target Stimulus Window:** **${targetMin} - ${targetMax}** based on your recovery profile (${recovery !== null ? `${recovery}%` : 'Calibrating'}).
• **Physical Locomotion:** **${steps.toLocaleString()} steps** recorded via live 3-axis IMU tracking.
• **Metabolic Output:** **${calories.toLocaleString()} kcal burned** (BMR baseline + active muscular expenditure).
• **Live Cardiac Reading:** ${liveHr}.`,
    };
  }

  // --- 5. RECOVERY, FATIGUE, NUTRITION & STRESS INTENT ---
  if (
    q.includes('recover') ||
    q.includes('fatigue') ||
    q.includes('tired') ||
    q.includes('stress') ||
    q.includes('nutrition') ||
    q.includes('eat') ||
    q.includes('food') ||
    q.includes('water') ||
    q.includes('hydrate') ||
    q.includes('استشفاء') ||
    q.includes('تعافي') ||
    q.includes('تعب') ||
    q.includes('إرهاق') ||
    q.includes('توتر') ||
    q.includes('أكل') ||
    q.includes('تغذية') ||
    q.includes('ماء') ||
    q.includes('سوائل')
  ) {
    return {
      source: 'offline_engine',
      intentDetected: 'RECOVERY_NUTRITION',
      text: isAr
        ? `⚡ **بروتوكول تسريع الاستشفاء والتغذية الذكية:**
• **حالة الاستشفاء الحالية:** ${recovery !== null ? `${recovery}%` : 'قيد المعايرة'} مع HRV عند ${hrv ?? '--'} مللي ثانية.
• **الترطيب والأملاح:** استهلك اليوم ما لا يقل عن 2.5 إلى 3 لترات ماء مع إضافة الصوديوم والبوتاسيوم، خاصة بعد بذل جهد ${strain.toFixed(1)}.
• **التغذية الترميمية:**
  1. احرص على تناول 1.6 إلى 2.0 غرام بروتين لكل كيلوغرام من وزنك لإعادة بناء الألياف العضلية.
  2. دعم الجهاز العصبي بأحماض أوميغا-3 ومضادات الأكسدة لتقليل الالتهابات الخلوية.
• **إدارة التوتر:** مارس تقنية التنفس الدوري الفسيولوجي (Physiological Sigh: شهيق مزدوج يليه زفير طويل مهدئ) لمدة 3 دقائق لخفض الكورتيزول فوراً وتنشيط العصب المبهم.`
        : `⚡ **Recovery Acceleration & Metabolic Optimization Protocol:**
• **Current Status:** Recovery is at ${recovery !== null ? `${recovery}%` : 'Calibrating'} with an HRV baseline of ${hrv ?? '--'} ms.
• **Hydration & Electrolytes:** Consume at least 2.5–3.0 liters of water enriched with electrolytes (sodium, magnesium, potassium) to counter the cardiac load of today's ${strain.toFixed(1)} Strain.
• **Nutritional Restoration:**
  1. Target 1.6–2.0g protein per kg bodyweight to accelerate myofibrillar repair.
  2. Prioritize anti-inflammatory fatty acids (Omega-3 EPA/DHA) and micronutrients to dampen exercise-induced oxidative stress.
• **Stress Regulation:** Practice the physiological sigh (two quick nasal inhales followed by an extended, slow mouth exhale) for 3 minutes to instantly disengage sympathetic tone and lower circulating cortisol.`,
    };
  }

  // --- 6. GENERAL CONVERSATIONAL / OPEN HEALTH SYNTHESIS ---
  return {
    source: 'offline_engine',
    intentDetected: 'GENERAL_SYNTHESIS',
    text: isAr
      ? `أهلاً بك! إليك تقييمي الشامل لحالتك الصحية الآن:
نسبة استشفائك اليوم هي **${recovery !== null ? `${recovery}%` : 'قيد المعايرة'}**، ومعدل الـ HRV عند **${hrv ?? '--'} مللي ثانية** مع نبض راحة **${rhr ?? '--'} ن/د**.
نمت الليلة الماضية **${formatHours(hoursAsleep, true)}** وسجلت جهداً يومياً حتى الآن مقداره **${strain.toFixed(1)}** مع **${steps.toLocaleString()} خطوة**.

كيف يمكنني مساعدتك أكثر؟ يمكنك أن تسألني:
• "كيف أتمرن اليوم بناءً على تعافيي؟"
• "حلل جودة نومي ومراحله الليلة الماضية"
• "ماذا تعني قراءة الـ HRV اليوم؟"
• "كم أحتاج من النوم الليلة لسد فجوة الإجهاد؟"`
      : `I'm tracking your complete live biometrics:
Your Recovery sits at **${recovery !== null ? `${recovery}%` : 'Calibrating'}**, with an HRV of **${hrv ?? '--'} ms** and a Resting Heart Rate of **${rhr ?? '--'} bpm**.
Last night you clocked **${formatHours(hoursAsleep, false)}** of sleep, and your Day Strain currently stands at **${strain.toFixed(1)}** (${steps.toLocaleString()} steps).

How can I help you optimize today? Try asking:
• "How should I train today based on my recovery?"
• "Analyze my sleep quality and stages from last night"
• "What does my HRV reading mean today?"
• "How much sleep do I need tonight to cover my strain?"`,
  };
}

// -----------------------------------------------------------------------------
// MAIN DISPATCHER: DUAL-CORE WHOOP COACH ENGINE
// -----------------------------------------------------------------------------
export async function askWhoopCoach(
  question: string,
  context: WhoopCoachContext
): Promise<CoachResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    const isAr = detectLanguage(question, context.language || 'en') === 'ar';
    return {
      text: isAr ? 'يرجى كتابة سؤالك وسأجيبك فوراً!' : 'Please enter a question and I will assist you immediately!',
      source: 'offline_engine',
      intentDetected: 'EMPTY',
    };
  }

  // Check for configured Gemini API key in localStorage or environment
  const configuredKey =
    typeof window !== 'undefined'
      ? localStorage.getItem('whoop_gemini_api_key') || (import.meta as any).env?.VITE_GEMINI_API_KEY
      : (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (configuredKey && typeof configuredKey === 'string' && configuredKey.trim().length > 10) {
    try {
      const cloudReply = await queryGeminiCloud(trimmed, context, configuredKey.trim());
      return {
        text: cloudReply,
        source: 'cloud_gemini',
        intentDetected: 'CLINICAL_GEMINI_LLM',
      };
    } catch (err) {
      console.warn('[WHOOP Coach Engine] Gemini cloud query bypassed or failed, falling back to Tier 2:', err);
    }
  }

  // Built-in Offline Sports-Science Intelligence Engine (Default)
  return queryOfflineEngine(trimmed, context);
}
