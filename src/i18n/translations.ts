export type Language = 'en' | 'ar';

export interface Translations {
  // Top Bar & Tabs
  today: string;
  yesterday: string;
  home: string;
  plan: string;
  community: string;
  more: string;
  overview: string;
  sleep: string;
  recovery: string;
  strain: string;
  weeklyPlan: string;
  communityLeaderboards: string;
  settingsHardware: string;

  // Key Metrics
  dayStrain: string;
  recoveryScore: string;
  sleepPerformance: string;
  hrv: string;
  rhr: string;
  bpm: string;
  calories: string;
  activeCalories: string;
  respiratoryRate: string;
  bloodOxygen: string;
  skinTemp: string;
  targetStrain: string;
  optimalTarget: string;
  steps: string;
  cadence: string;
  bmr: string;
  totalCalories: string;
  habitImpact: string;
  sleepDebtHoursLabel: string;
  hypnogramTitle: string;

  // Status & Connection
  connected: string;
  disconnected: string;
  connecting: string;
  calibrating: string;
  onWrist: string;
  offWrist: string;
  battery: string;
  withinRange: string;
  low: string;
  medium: string;
  high: string;

  // Home Screen Sections
  healthMonitor: string;
  stressMonitor: string;
  myDay: string;
  dailyOutlook: string;
  todaysActivities: string;
  noActivitiesToday: string;
  startActivity: string;
  whoopCoach: string;
  askCoach: string;
  allMetricsNormal: string;
  metricsOutOfRange: string;
  liveStressLevel: string;

  // Sleep Drilldown
  hoursVsNeed: string;
  timeInBed: string;
  actualSleep: string;
  sleepNeed: string;
  sleepDebt: string;
  sleepEfficiency: string;
  restorativeSleep: string;
  sleepStages: string;
  awake: string;
  lightSleep: string;
  remSleep: string;
  deepSleep: string;
  disturbances: string;
  sleepCoachAdvice: string;

  // Recovery Drilldown
  recoveryFactors: string;
  recoveryGreenMsg: string;
  recoveryYellowMsg: string;
  recoveryRedMsg: string;
  recoveryCalibratingMsg: string;
  vitalSigns: string;

  // Strain Drilldown
  hrZones: string;
  zone0: string;
  zone1: string;
  zone2: string;
  zone3: string;
  zone4: string;
  zone5: string;
  avgHr: string;
  maxHr: string;

  // Modals & Tools
  dailyJournal: string;
  sleepPlanner: string;
  strengthTrainer: string;
  recoveryAssessment: string;
  nightLock: string;
  notificationCenter: string;
  startWorkout: string;
  logActivity: string;

  // More & Settings
  deviceSettings: string;
  myAccount: string;
  appSettings: string;
  privacy: string;
  tutorials: string;
  about: string;
  language: string;
  languageName: string;
  switchLanguage: string;
  english: string;
  arabic: string;
  biometricProfile: string;
  athleteName: string;
  ageYears: string;
  restingHrBaseline: string;
  hrvBaseline: string;
  maxHrBpm: string;
  saveBiometrics: string;
  savedSuccessfully: string;
  dataVault: string;
  exportCsv: string;
  backupJson: string;
  importWhoop: string;
  resetTodayStrain: string;
  reset: string;

  // Hardware Sheet
  strapTitle: string;
  status: string;
  wristPlacement: string;
  firmware: string;
  serialNumber: string;
  pairFiltered: string;
  showAllDevices: string;
  oneClickReconnect: string;
  disconnectStrap: string;
  connectionGuide: string;
  guidePhoneApp: string;
  guidePairingMode: string;
  guideBluetoothOn: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Top Bar & Tabs
    today: 'TODAY',
    yesterday: 'YESTERDAY',
    home: 'Home',
    plan: 'Plan',
    community: 'Community',
    more: 'More',
    overview: 'OVERVIEW',
    sleep: 'SLEEP',
    recovery: 'RECOVERY',
    strain: 'STRAIN',
    weeklyPlan: 'WEEKLY PLAN & PROTOCOLS',
    communityLeaderboards: 'COMMUNITY & LEADERBOARDS',
    settingsHardware: 'SETTINGS & HARDWARE',

    // Key Metrics
    dayStrain: 'STRAIN',
    recoveryScore: 'RECOVERY',
    sleepPerformance: 'SLEEP PERFORMANCE',
    hrv: 'HRV',
    rhr: 'RHR',
    bpm: 'BPM',
    calories: 'CALORIES',
    activeCalories: 'ACTIVE CALORIES',
    respiratoryRate: 'RESPIRATORY RATE',
    bloodOxygen: 'BLOOD OXYGEN',
    skinTemp: 'SKIN TEMP',
    targetStrain: 'TARGET STRAIN',
    optimalTarget: 'OPTIMAL STRAIN',
    steps: 'STEPS',
    cadence: 'CADENCE',
    bmr: 'BMR (BASAL)',
    totalCalories: 'TOTAL CALORIES',
    habitImpact: 'HABIT IMPACT ON RECOVERY',
    sleepDebtHoursLabel: 'SLEEP DEBT',
    hypnogramTitle: 'SLEEP ARCHITECTURE & HYPNOGRAM',

    // Status & Connection
    connected: 'CONNECTED',
    disconnected: 'DISCONNECTED',
    connecting: 'CONNECTING...',
    calibrating: 'Calibrating',
    onWrist: 'ON WRIST',
    offWrist: 'OFF WRIST',
    battery: 'BATTERY',
    withinRange: 'ALL WITHIN RANGE',
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',

    // Home Screen Sections
    healthMonitor: 'HEALTH MONITOR',
    stressMonitor: 'STRESS MONITOR',
    myDay: 'MY DAY',
    dailyOutlook: 'DAILY OUTLOOK',
    todaysActivities: "TODAY'S ACTIVITIES",
    noActivitiesToday: 'No activities logged today',
    startActivity: 'Start Live Workout',
    whoopCoach: 'WHOOP COACH',
    askCoach: 'Ask WHOOP Coach anything about your recovery...',
    allMetricsNormal: 'All 5 metrics in typical range',
    metricsOutOfRange: 'Metrics require attention',
    liveStressLevel: 'Real-time physiological stress',

    // Sleep Drilldown
    hoursVsNeed: 'HOURS VS. NEED',
    timeInBed: 'TIME IN BED',
    actualSleep: 'ACTUAL SLEEP',
    sleepNeed: 'SLEEP NEED',
    sleepDebt: 'SLEEP DEBT',
    sleepEfficiency: 'EFFICIENCY',
    restorativeSleep: 'RESTORATIVE SLEEP',
    sleepStages: 'SLEEP STAGES',
    awake: 'Awake',
    lightSleep: 'Light',
    remSleep: 'REM',
    deepSleep: 'Deep',
    disturbances: 'DISTURBANCES',
    sleepCoachAdvice: 'Aim for consistent wake times to optimize REM cycles.',

    // Recovery Drilldown
    recoveryFactors: 'RECOVERY FACTORS',
    recoveryGreenMsg: 'Your body is primed for high physical and cognitive strain.',
    recoveryYellowMsg: 'Your body is maintaining baseline. Moderate training suggested.',
    recoveryRedMsg: 'Your body is under elevated strain or sleep deprivation. Prioritize rest.',
    recoveryCalibratingMsg: 'Wear your strap during sleep to calibrate your personalized recovery baseline.',
    vitalSigns: 'VITAL SIGNS & METRICS',

    // Strain Drilldown
    hrZones: 'HEART RATE ZONES',
    zone0: 'Zone 0: Rest (<50%)',
    zone1: 'Zone 1: Very Light (50-60%)',
    zone2: 'Zone 2: Light (60-70%)',
    zone3: 'Zone 3: Moderate (70-80%)',
    zone4: 'Zone 4: Hard (80-90%)',
    zone5: 'Zone 5: All Out (90-100%)',
    avgHr: 'AVG HEART RATE',
    maxHr: 'MAX HEART RATE',

    // Modals & Tools
    dailyJournal: 'Daily Journal',
    sleepPlanner: 'Sleep Planner & Alarm',
    strengthTrainer: 'Strength Trainer',
    recoveryAssessment: '3-Min Recovery Check',
    nightLock: 'OLED Night Lock',
    notificationCenter: 'Notification Center',
    startWorkout: 'Start Workout',
    logActivity: 'Log Activity',

    // More & Settings
    deviceSettings: 'DEVICE SETTINGS',
    myAccount: 'MY ACCOUNT',
    appSettings: 'APP SETTINGS',
    privacy: 'PRIVACY & DATA SECURITY',
    tutorials: 'TUTORIALS & GUIDES',
    about: 'ABOUT',
    language: 'LANGUAGE',
    languageName: 'English',
    switchLanguage: 'Language / اللغة',
    english: 'English',
    arabic: 'العربية (Arabic)',
    biometricProfile: 'Biometric Profile & Physiology',
    athleteName: 'Athlete Name',
    ageYears: 'Age (Years)',
    restingHrBaseline: 'Resting HR Baseline (BPM)',
    hrvBaseline: 'HRV Baseline (ms)',
    maxHrBpm: 'Max HR (BPM)',
    saveBiometrics: 'Save Biometrics',
    savedSuccessfully: 'Settings saved successfully!',
    dataVault: 'Data Vault & Import / Export',
    exportCsv: 'Export CSV',
    backupJson: 'Backup JSON',
    importWhoop: 'Import WHOOP (.CSV or .JSON)',
    resetTodayStrain: "Reset Today's Strain",
    reset: 'Reset',

    // Hardware Sheet
    strapTitle: 'WHOOP 4.0 HARDWARE',
    status: 'STATUS',
    wristPlacement: 'WRIST PLACEMENT',
    firmware: 'FIRMWARE',
    serialNumber: 'SERIAL NUMBER',
    pairFiltered: 'Pair WHOOP 4.0 (Filtered Search)',
    showAllDevices: 'Show All Devices (Fallback Search)',
    oneClickReconnect: '1-Click Reconnect to',
    disconnectStrap: 'Disconnect Strap',
    connectionGuide: 'WHOOP 4.0 Connection Guide',
    guidePhoneApp: 'Disconnect phone app: Close official WHOOP app on your phone (single connection limit).',
    guidePairingMode: 'Enable Pairing Mode: Firmly double-tap the top of the sensor until LEDs pulse.',
    guideBluetoothOn: 'Bluetooth ON: Verify Bluetooth is active in your system settings.',
  },

  ar: {
    // Top Bar & Tabs
    today: 'اليوم',
    yesterday: 'الأمس',
    home: 'الرئيسية',
    plan: 'الخطة',
    community: 'المجتمع',
    more: 'المزيد',
    overview: 'نظرة عامة',
    sleep: 'النوم',
    recovery: 'التعافي',
    strain: 'الإجهاد',
    weeklyPlan: 'الخطة الأسبوعية والبروتوكولات',
    communityLeaderboards: 'المجتمع ولوحة الصدارة',
    settingsHardware: 'الإعدادات وجهاز السوار',

    // Key Metrics
    dayStrain: 'الإجهاد',
    recoveryScore: 'التعافي',
    sleepPerformance: 'أداء النوم',
    hrv: 'تقلب النبض HRV',
    rhr: 'نبض الراحة RHR',
    bpm: 'ن/د',
    calories: 'السعرات',
    activeCalories: 'السعرات النشطة',
    respiratoryRate: 'معدل التنفس',
    bloodOxygen: 'أكسجين الدم SpO2',
    skinTemp: 'حرارة الجلد',
    targetStrain: 'الإجهاد المستهدف',
    optimalTarget: 'الإجهاد المثالي',
    steps: 'الخطوات',
    cadence: 'الإيقاع',
    bmr: 'الأيض الأساسي BMR',
    totalCalories: 'إجمالي السعرات',
    habitImpact: 'تأثير العادات على التعافي',
    sleepDebtHoursLabel: 'دين النوم المتراكم',
    hypnogramTitle: 'مخطط بنية ومراحل النوم',

    // Status & Connection
    connected: 'متصل بالسوّار',
    disconnected: 'غير متصل',
    connecting: 'جاري الاتصال...',
    calibrating: 'جاري المعايرة',
    onWrist: 'على المعصم (مُحكم)',
    offWrist: 'مفصول عن المعصم',
    battery: 'البطارية',
    withinRange: 'جميع المؤشرات طبيعية',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',

    // Home Screen Sections
    healthMonitor: 'مراقب الصحة',
    stressMonitor: 'مراقب التوتر',
    myDay: 'يومي',
    dailyOutlook: 'التقرير اليومي',
    todaysActivities: 'أنشطة اليوم',
    noActivitiesToday: 'لا توجد أنشطة مسجلة اليوم',
    startActivity: 'بدء تمرين مباشر',
    whoopCoach: 'مدرب WHOOP الذكي',
    askCoach: 'اسأل مدرب WHOOP عن تعافيك أو خطة تدريبك...',
    allMetricsNormal: 'المؤشرات الخمسة ضمن النطاق الطبيعي',
    metricsOutOfRange: 'بعض المؤشرات تتطلب انتباهك',
    liveStressLevel: 'مستوى التوتر الفسيولوجي المباشر',

    // Sleep Drilldown
    hoursVsNeed: 'ساعات النوم مقابل الاحتياج',
    timeInBed: 'الوقت في الفراش',
    actualSleep: 'النوم الفعلي',
    sleepNeed: 'احتياج النوم',
    sleepDebt: 'عجز النوم المتراكم',
    sleepEfficiency: 'كفاءة النوم',
    restorativeSleep: 'النوم المجدد للنشاط',
    sleepStages: 'مراحل النوم',
    awake: 'استيقاظ',
    lightSleep: 'خفيف',
    remSleep: 'حركة العين REM',
    deepSleep: 'عميق',
    disturbances: 'الاستيقاظ والتقلبات',
    sleepCoachAdvice: 'احرص على ثبات موعد الاستيقاظ لتحسين مراحل حركة العين السريعة.',

    // Recovery Drilldown
    recoveryFactors: 'عوامل التعافي الفسيولوجي',
    recoveryGreenMsg: 'جسمك في أفضل حالات الجاهزية لتحمل أعلى مستويات الإجهاد البدني والذهني.',
    recoveryYellowMsg: 'جسمك في المستوى الطبيعي المتوازن. يوصى بتدريب معتدل.',
    recoveryRedMsg: 'جسمك تحت إجهاد مرتفع أو يعاني نقص نوم. الأولوية اليوم للراحة والتعافي.',
    recoveryCalibratingMsg: 'ارتدِ السوار أثناء النوم لمعايرة خط الأساس الشخصي لتعافيك.',
    vitalSigns: 'العلامات الحيوية والمؤشرات',

    // Strain Drilldown
    hrZones: 'نطاقات نبضات القلب',
    zone0: 'النطاق 0: راحة (<50%)',
    zone1: 'النطاق 1: خفيف جداً (50-60%)',
    zone2: 'النطاق 2: خفيف (60-70%)',
    zone3: 'النطاق 3: معتدل (70-80%)',
    zone4: 'النطاق 4: شاق (80-90%)',
    zone5: 'النطاق 5: أقصى طاقة (90-100%)',
    avgHr: 'متوسط نبض القلب',
    maxHr: 'أقصى نبض للقلب',

    // Modals & Tools
    dailyJournal: 'المذكرات اليومية',
    sleepPlanner: 'مخطط النوم والمنبه الذكي',
    strengthTrainer: 'مدرب القوة والمقاومة',
    recoveryAssessment: 'فحص التعافي (3 دقائق)',
    nightLock: 'قفل شاشة النوم OLED',
    notificationCenter: 'مركز الإشعارات',
    startWorkout: 'بدء تمرين',
    logActivity: 'تسجيل نشاط',

    // More & Settings
    deviceSettings: 'إعدادات السوار',
    myAccount: 'حسابي وبياناتي',
    appSettings: 'إعدادات التطبيق',
    privacy: 'الخصوصية وأمان البيانات',
    tutorials: 'الإرشادات ودليل الاستخدام',
    about: 'حول التطبيق',
    language: 'اللغة',
    languageName: 'العربية',
    switchLanguage: 'اللغة / Language',
    english: 'English (الإنجليزية)',
    arabic: 'العربية (Arabic)',
    biometricProfile: 'الملف الفسيولوجي والقياسات الحيوية',
    athleteName: 'اسم الرياضي',
    ageYears: 'العمر (بالسنوات)',
    restingHrBaseline: 'خط أساس نبض الراحة (ن/د)',
    hrvBaseline: 'خط أساس تقلب النبض (ms)',
    maxHrBpm: 'أقصى نبض للقلب (ن/د)',
    saveBiometrics: 'حفظ البيانات الفسيولوجية',
    savedSuccessfully: 'تم حفظ الإعدادات بنجاح!',
    dataVault: 'مستودع البيانات واستيراد / تصدير',
    exportCsv: 'تصدير ملف CSV',
    backupJson: 'نسخة احتياطية JSON',
    importWhoop: 'استيراد بيانات WHOOP (.CSV أو .JSON)',
    resetTodayStrain: 'تصفير عداد إجهاد اليوم',
    reset: 'تصفير',

    // Hardware Sheet
    strapTitle: 'سوار WHOOP 4.0',
    status: 'حالة الاتصال',
    wristPlacement: 'وضع المعصم',
    firmware: 'إصدار البرنامج الثابت',
    serialNumber: 'الرقم التسلسلي',
    pairFiltered: 'إقران WHOOP 4.0 (بحث مخصص)',
    showAllDevices: 'إظهار جميع الأجهزة (بحث احتياطي)',
    oneClickReconnect: 'إعادة اتصال سريعة بـ',
    disconnectStrap: 'فصل السوار',
    connectionGuide: 'دليل ربط سوار WHOOP 4.0',
    guidePhoneApp: 'فصل تطبيق الهاتف: أغلق تطبيق WHOOP على هاتفك (السوار يقبل اتصالاً واحداً فقط).',
    guidePairingMode: 'تفعيل وضع الإقران: انقر مرتين بقوة على أعلى السوار حتى تومض لمبات LED.',
    guideBluetoothOn: 'تشغيل البلوتوث: تأكد من تفعيل البلوتوث في جهازك.',
  },
};

export type TranslationKey = keyof Translations;
