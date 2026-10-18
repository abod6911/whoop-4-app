export type Language = 'en' | 'ar';

export interface Translations {
  // Common Actions & Buttons
  save: string;
  cancel: string;
  close: string;
  done: string;
  reconnect: string;
  disconnect: string;
  exportData: string;
  importData: string;
  edit: string;
  fillOut: string;
  start: string;
  end: string;
  active: string;
  back: string;
  share: string;
  customize: string;
  addActivity: string;
  viewAll: string;
  clear: string;
  clearAll: string;
  confirm: string;
  retry: string;

  // Top Bar & Navigation
  today: string;
  yesterday: string;
  daysAgo: string;
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

  // Bluetooth & Hardware Status
  connected: string;
  disconnected: string;
  connecting: string;
  calibrating: string;
  onWrist: string;
  offWrist: string;
  battery: string;
  sensor: string;
  strapTitle: string;
  status: string;
  wristPlacement: string;
  firmware: string;
  serialNumber: string;
  hardwareVersion: string;
  pairFiltered: string;
  showAllDevices: string;
  oneClickReconnect: string;
  disconnectStrap: string;
  connectionGuide: string;
  guidePhoneApp: string;
  guidePairingMode: string;
  guideBluetoothOn: string;
  signalStrength: string;
  charging: string;
  discharging: string;
  hardwareDiagnostics: string;
  skinContact: string;
  skinContactLocked: string;
  skinContactLost: string;
  packetsPerMin: string;
  packetRate: string;
  bandOffWristAlert: string;
  paused: string;

  // Core Biometrics & Health Metrics
  recoveryScore: string;
  dayStrain: string;
  activityStrain: string;
  heartRate: string;
  rhr: string;
  restingHeartRate: string;
  hrv: string;
  hrvFull: string;
  bpm: string;
  rpm: string;
  calories: string;
  activeCalories: string;
  bmr: string;
  totalCalories: string;
  steps: string;
  cadence: string;
  spm: string;
  stepSource: string;
  imuHardware: string;
  activityInference: string;
  skinTemp: string;
  skinTempDelta: string;
  bloodOxygen: string;
  spO2: string;
  respiratoryRate: string;
  vo2Max: string;
  leanBodyMass: string;
  targetStrain: string;
  optimalTarget: string;
  target: string;
  baseline: string;
  typicalRange: string;
  withinRange: string;
  outOfRange: string;

  // Stress & Autonomic Tone
  stressMonitor: string;
  stressScore: string;
  liveStressLevel: string;
  low: string;
  medium: string;
  high: string;
  restingStress: string;
  highStressAlert: string;
  breathePacer: string;
  inhale: string;
  hold: string;
  exhale: string;

  // Sleep Architecture & Sleep Coach
  sleepPerformance: string;
  sleepNeed: string;
  actualSleep: string;
  hoursVsNeed: string;
  timeInBed: string;
  sleepDebt: string;
  sleepDebtHoursLabel: string;
  sleepEfficiency: string;
  restorativeSleep: string;
  sleepConsistency: string;
  sleepStages: string;
  awake: string;
  lightSleep: string;
  deepSleep: string;
  remSleep: string;
  disturbances: string;
  sleepNeedBreakdown: string;
  baselineSleepNeed: string;
  recentSleepDebt: string;
  strainSleepDemand: string;
  hypnogramTitle: string;
  circadianAlignment: string;
  bedtime: string;
  wakeTime: string;
  recommendedBedtime: string;
  alarmOn: string;
  sleepCoachAdvice: string;
  launchOledNightLock: string;

  // Recovery Engine & Factors
  recoveryFactors: string;
  recoveryGreenMsg: string;
  recoveryYellowMsg: string;
  recoveryRedMsg: string;
  recoveryCalibratingMsg: string;
  vitalSigns: string;
  readinessOptimal: string;
  readinessModerate: string;
  readinessRest: string;
  measureMorningRecovery: string;
  recoveryAssessment: string;

  // Home Screen & Sections
  myDay: string;
  myDashboard: string;
  dailyOutlook: string;
  todaysActivities: string;
  noActivitiesToday: string;
  startActivity: string;
  whoopCoach: string;
  askCoach: string;
  allMetricsNormal: string;
  metricsOutOfRange: string;
  getDailyOutlook: string;
  outlookSubtitle: string;
  tonightsSleep: string;
  myJournal: string;
  journalSubtitle: string;

  // Heart Rate Zones & Workouts
  hrZones: string;
  zone0: string;
  zone1: string;
  zone2: string;
  zone3: string;
  zone4: string;
  zone5: string;
  avgHr: string;
  maxHr: string;
  minHr: string;
  duration: string;
  startWorkout: string;
  endWorkout: string;
  workoutSession: string;
  liveStrainCoach: string;
  running: string;
  weightlifting: string;
  cycling: string;
  functionalFitness: string;
  hiit: string;
  walking: string;
  swimming: string;
  rowing: string;
  yoga: string;

  // Modals & Tools
  dailyJournal: string;
  logBehaviors: string;
  recoveryImpact: string;
  habitImpact: string;
  autonomicCorrelationModel: string;
  behaviorsTrackedToday: string;
  behaviorsLogDesc: string;
  correlationModelDesc: string;
  sleepPlanner: string;
  sleepPlannerDesc: string;
  strengthTrainer: string;
  strengthTrainerDesc: string;
  muscularLoad: string;
  healthMonitor: string;
  healthMonitorDesc: string;
  shareDoctorsReport: string;
  generatingReport: string;
  reportDownloaded: string;
  nightLock: string;
  notificationCenter: string;
  testChimesHaptics: string;
  quickAction: string;

  // Habits (Standard WHOOP 10)
  habitAlcohol: string;
  habitCaffeineLate: string;
  habitLateMeal: string;
  habitHydration: string;
  habitMagnesium: string;
  habitScreenInBed: string;
  habitBreathwork: string;
  habitColdExposure: string;
  habitSunlight: string;
  habitSleepMask: string;

  // More & App Settings
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
  biometricProfileDesc: string;
  athleteName: string;
  ageYears: string;
  genderLabel: string;
  male: string;
  female: string;
  weightKg: string;
  heightCm: string;
  restingHrBaseline: string;
  hrvBaseline: string;
  maxHrBpm: string;
  tanakaFormula: string;
  foxFormula: string;
  saveBiometrics: string;
  savedSuccessfully: string;
  dataVault: string;
  dataVaultDesc: string;
  exportCsv: string;
  backupJson: string;
  importWhoop: string;
  importPrompt: string;
  resetTodayStrain: string;
  resetStrainDesc: string;
  reset: string;
  privacyTitle: string;
  privacySubtitle: string;
  tutorialsTitle: string;
  aboutTitle: string;
  aboutDesc: string;

  // Chart Labels & Time Periods
  sevenDays: string;
  thirtyDays: string;
  average: string;
  strain7Days: string;
  recovery7Days: string;
  sleep7Days: string;
  hrv7Days: string;
  calories7Days: string;
  strainAndRecovery7Days: string;
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common Actions & Buttons
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    done: 'Done',
    reconnect: 'Reconnect',
    disconnect: 'Disconnect',
    exportData: 'Export Data',
    importData: 'Import Data',
    edit: 'Edit',
    fillOut: 'Fill Out',
    start: 'Start',
    end: 'End',
    active: 'Active',
    back: 'Back',
    share: 'SHARE',
    customize: 'CUSTOMIZE',
    addActivity: 'ADD ACTIVITY',
    viewAll: 'View All',
    clear: 'Clear',
    clearAll: 'Clear All',
    confirm: 'Confirm',
    retry: 'Retry',

    // Top Bar & Navigation
    today: 'TODAY',
    yesterday: 'YESTERDAY',
    daysAgo: 'd ago',
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

    // Bluetooth & Hardware Status
    connected: 'CONNECTED',
    disconnected: 'DISCONNECTED',
    connecting: 'CONNECTING...',
    calibrating: 'Calibrating',
    onWrist: 'ON WRIST',
    offWrist: 'OFF WRIST',
    battery: 'BATTERY',
    sensor: 'SENSOR',
    strapTitle: 'WHOOP 4.0 HARDWARE',
    status: 'STATUS',
    wristPlacement: 'WRIST PLACEMENT',
    firmware: 'FIRMWARE',
    serialNumber: 'SERIAL NUMBER',
    hardwareVersion: 'HARDWARE VERSION',
    pairFiltered: 'Pair WHOOP 4.0 (Filtered Search)',
    showAllDevices: 'Show All Devices (Fallback Search)',
    oneClickReconnect: '1-Click Reconnect to',
    disconnectStrap: 'Disconnect Strap',
    connectionGuide: 'WHOOP 4.0 Connection Guide',
    guidePhoneApp: 'Disconnect phone app: Close official WHOOP app on your phone (single connection limit).',
    guidePairingMode: 'Enable Pairing Mode: Firmly double-tap the top of the sensor until LEDs pulse.',
    guideBluetoothOn: 'Bluetooth ON: Verify Bluetooth is active in your system settings.',
    signalStrength: 'Signal Strength',
    charging: 'Charging',
    discharging: 'Discharging',
    hardwareDiagnostics: 'Hardware Diagnostics',
    skinContact: 'Skin Contact',
    skinContactLocked: 'Locked (On-Wrist)',
    skinContactLost: 'Lost (Off-Wrist)',
    packetsPerMin: 'pkts/min',
    packetRate: 'Packet Ingestion Rate',
    bandOffWristAlert: 'Band Off-Wrist / No Skin Contact',
    paused: 'PAUSED',

    // Core Biometrics & Health Metrics
    recoveryScore: 'RECOVERY',
    dayStrain: 'STRAIN',
    activityStrain: 'ACTIVITY STRAIN',
    heartRate: 'HEART RATE',
    rhr: 'RHR',
    restingHeartRate: 'RESTING HEART RATE',
    hrv: 'HRV',
    hrvFull: 'HEART RATE VARIABILITY',
    bpm: 'BPM',
    rpm: 'rpm',
    calories: 'CALORIES',
    activeCalories: 'ACTIVE CALORIES',
    bmr: 'BMR (BASAL)',
    totalCalories: 'TOTAL CALORIES',
    steps: 'STEPS',
    cadence: 'CADENCE',
    spm: 'spm',
    stepSource: 'STEP SOURCE',
    imuHardware: 'IMU SENSOR',
    activityInference: 'ESTIMATED',
    skinTemp: 'SKIN TEMP',
    skinTempDelta: 'TEMP DEVIATION',
    bloodOxygen: 'BLOOD OXYGEN',
    spO2: 'SpO2',
    respiratoryRate: 'RESPIRATORY RATE',
    vo2Max: 'VO2 MAX',
    leanBodyMass: 'LEAN BODY MASS',
    targetStrain: 'TARGET STRAIN',
    optimalTarget: 'OPTIMAL STRAIN',
    target: 'Target',
    baseline: 'Baseline',
    typicalRange: 'Typical Range',
    withinRange: 'ALL WITHIN RANGE',
    outOfRange: 'OUT OF RANGE',

    // Stress & Autonomic Tone
    stressMonitor: 'STRESS MONITOR',
    stressScore: 'Stress Score',
    liveStressLevel: 'Real-time physiological stress',
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    restingStress: 'Resting Stress',
    highStressAlert: 'High Resting Stress Detected',
    breathePacer: 'HRV Breathe Pacer',
    inhale: 'Inhale',
    hold: 'Hold',
    exhale: 'Exhale',

    // Sleep Architecture & Sleep Coach
    sleepPerformance: 'SLEEP PERFORMANCE',
    sleepNeed: 'SLEEP NEED',
    actualSleep: 'ACTUAL SLEEP',
    hoursVsNeed: 'HOURS VS. NEED',
    timeInBed: 'TIME IN BED',
    sleepDebt: 'SLEEP DEBT',
    sleepDebtHoursLabel: 'SLEEP DEBT',
    sleepEfficiency: 'SLEEP EFFICIENCY',
    restorativeSleep: 'RESTORATIVE SLEEP',
    sleepConsistency: 'SLEEP CONSISTENCY',
    sleepStages: 'SLEEP STAGES',
    awake: 'Awake',
    lightSleep: 'Light',
    deepSleep: 'Deep (SWS)',
    remSleep: 'REM',
    disturbances: 'DISTURBANCES',
    sleepNeedBreakdown: 'Sleep Need Breakdown',
    baselineSleepNeed: 'Baseline Sleep Need',
    recentSleepDebt: 'Recent Sleep Debt',
    strainSleepDemand: 'Strain Sleep Demand',
    hypnogramTitle: 'SLEEP ARCHITECTURE & HYPNOGRAM',
    circadianAlignment: 'CIRCADIAN ALIGNMENT',
    bedtime: 'Bedtime',
    wakeTime: 'Wake',
    recommendedBedtime: 'RECOMMENDED BEDTIME',
    alarmOn: 'ALARM ON (EXACT)',
    sleepCoachAdvice: 'Aim for consistent wake times to optimize REM cycles.',
    launchOledNightLock: 'Launch OLED Sleep Lock (Keep BLE Connected)',

    // Recovery Engine & Factors
    recoveryFactors: 'RECOVERY FACTORS',
    recoveryGreenMsg: 'Your body is primed for high physical and cognitive strain.',
    recoveryYellowMsg: 'Your body is maintaining baseline. Moderate training suggested.',
    recoveryRedMsg: 'Your body is under elevated strain or sleep deprivation. Prioritize rest.',
    recoveryCalibratingMsg: 'Wear your strap during sleep to calibrate your personalized recovery baseline.',
    vitalSigns: 'VITAL SIGNS & METRICS',
    readinessOptimal: 'High Autonomic Readiness',
    readinessModerate: 'Moderate Balance',
    readinessRest: 'Rest Required',
    measureMorningRecovery: 'Measure Morning Recovery (3-Min HRV Test)',
    recoveryAssessment: '3-Min Recovery Check',

    // Home Screen & Sections
    myDay: 'MY DAY',
    myDashboard: 'My Dashboard',
    dailyOutlook: 'DAILY OUTLOOK',
    todaysActivities: "TODAY'S ACTIVITIES",
    noActivitiesToday: 'No activities logged today',
    startActivity: 'Start Live Workout',
    whoopCoach: 'WHOOP COACH',
    askCoach: 'Ask WHOOP Coach anything about your recovery...',
    allMetricsNormal: 'All 5 metrics in typical range',
    metricsOutOfRange: 'Metrics require attention',
    getDailyOutlook: 'GET MY OUTLOOK',
    outlookSubtitle: "Discover today's personalized insights and recommendations from WHOOP Coach to optimize your daily routine.",
    tonightsSleep: "TONIGHT'S SLEEP",
    myJournal: 'MY JOURNAL',
    journalSubtitle: 'Track daily athletic and recovery habits',

    // Heart Rate Zones & Workouts
    hrZones: 'HEART RATE ZONES',
    zone0: 'Zone 0: Rest (<50%)',
    zone1: 'Zone 1: Very Light (50-60%)',
    zone2: 'Zone 2: Light (60-70%)',
    zone3: 'Zone 3: Moderate (70-80%)',
    zone4: 'Zone 4: Hard (80-90%)',
    zone5: 'Zone 5: All Out (90-100%)',
    avgHr: 'AVG HEART RATE',
    maxHr: 'MAX HEART RATE',
    minHr: 'MIN HEART RATE',
    duration: 'Duration',
    startWorkout: 'Start Workout',
    endWorkout: 'End & Save Workout',
    workoutSession: 'Workout Session',
    liveStrainCoach: 'Live Strain Coach',
    running: 'Running',
    weightlifting: 'Weightlifting',
    cycling: 'Cycling',
    functionalFitness: 'Functional Fitness',
    hiit: 'HIIT',
    walking: 'Walking',
    swimming: 'Swimming',
    rowing: 'Rowing',
    yoga: 'Yoga',

    // Modals & Tools
    dailyJournal: 'WHOOP Daily Journal',
    logBehaviors: 'Log Behaviors',
    recoveryImpact: 'Recovery Impact',
    habitImpact: 'HABIT IMPACT ON RECOVERY',
    autonomicCorrelationModel: 'Autonomic Correlation Model',
    behaviorsTrackedToday: 'Behaviors Tracked Today',
    behaviorsLogDesc: 'Track your daily behaviors to calibrate your personalized autonomic recovery impact model.',
    correlationModelDesc: 'Derived from your longitudinal WHOOP recovery records, here is how each logged habit shifts your next-morning recovery score:',
    sleepPlanner: 'Sleep Planner & Alarm',
    sleepPlannerDesc: 'Optimize your bedtime based on your strain demand and target recovery goal.',
    strengthTrainer: 'Strength Trainer',
    strengthTrainerDesc: 'Track weights, reps, and sets to calculate muscular strain alongside cardiovascular strain.',
    muscularLoad: 'Muscular Load',
    healthMonitor: 'HEALTH MONITOR',
    healthMonitorDesc: 'Continuous surveillance of your 5 vital signs compared to your calibrated 30-day baseline.',
    shareDoctorsReport: "Share Doctor's Clinical Report",
    generatingReport: 'Generating clinical report...',
    reportDownloaded: 'Report generated successfully!',
    nightLock: 'OLED Night Lock',
    notificationCenter: 'Notification Center',
    testChimesHaptics: 'Test chimes, haptics and push alerts',
    quickAction: 'Quick Action',

    // Habits (Standard WHOOP 10)
    habitAlcohol: 'Alcohol Consumed',
    habitCaffeineLate: 'Caffeine after 2 PM',
    habitLateMeal: 'Meal < 2 Hours Before Bed',
    habitHydration: 'Hydration Goal Met (3L+)',
    habitMagnesium: 'Magnesium / Sleep Supplement',
    habitScreenInBed: 'Screen Device in Bed',
    habitBreathwork: 'Breathwork or Meditation',
    habitColdExposure: 'Cold Shower / Ice Plunge',
    habitSunlight: 'Morning Sunlight (15+ min)',
    habitSleepMask: 'Pitch-Black Room / Eye Mask',

    // More & App Settings
    deviceSettings: 'DEVICE SETTINGS',
    myAccount: 'MY ACCOUNT',
    appSettings: 'APP SETTINGS',
    privacy: 'PRIVACY & DATA SECURITY',
    tutorials: 'TUTORIALS & GUIDES',
    about: 'ABOUT',
    language: 'LANGUAGE',
    languageName: 'English',
    switchLanguage: 'Language / اللغة',
    english: 'English (US)',
    arabic: 'العربية (Arabic)',
    biometricProfile: 'Biometric Profile & Physiology',
    biometricProfileDesc: 'These baselines calibrate your daily Strain brackets and normal CDF Recovery.',
    athleteName: 'Athlete Name',
    ageYears: 'Age (Years)',
    genderLabel: 'Gender (BMR Formula)',
    male: 'Male',
    female: 'Female',
    weightKg: 'Weight (kg)',
    heightCm: 'Height (cm)',
    restingHrBaseline: 'Resting HR Baseline (BPM)',
    hrvBaseline: 'HRV Baseline (ms)',
    maxHrBpm: 'Max HR (BPM)',
    tanakaFormula: 'Tanaka (208 - 0.7*Age)',
    foxFormula: 'Fox (220 - Age)',
    saveBiometrics: 'Save Biometrics',
    savedSuccessfully: 'Settings saved successfully!',
    dataVault: 'Data Vault & Storage',
    dataVaultDesc: 'Export complete IndexedDB Dexie vault, download official WHOOP CSVs, or restore backups.',
    exportCsv: 'Export CSV',
    backupJson: 'Backup JSON',
    importWhoop: 'Import WHOOP (.CSV or .JSON)',
    importPrompt: 'Click or drag official export file',
    resetTodayStrain: "Reset Today's Strain",
    resetStrainDesc: 'Clear daily TRIMP accumulator',
    reset: 'Reset',
    privacyTitle: '100% Offline Local BLE Storage',
    privacySubtitle: 'Your biometric data is processed entirely in your browser using Dexie IndexedDB. Zero cloud telemetry.',
    tutorialsTitle: 'Sensor Placement & Best Practices',
    aboutTitle: 'WHOOP 4.0 Local Web Bluetooth App',
    aboutDesc: 'Production-grade, subscription-free client communicating directly with WHOOP 4.0 BLE hardware.',

    // Chart Labels & Time Periods
    sevenDays: '7 Days',
    thirtyDays: '30 Days',
    average: 'AVG',
    strain7Days: 'STRAIN (7 DAYS)',
    recovery7Days: 'RECOVERY (7 DAYS)',
    sleep7Days: 'SLEEP PERFORMANCE (7 DAYS)',
    hrv7Days: 'HEART RATE VARIABILITY (7 DAYS)',
    calories7Days: 'CALORIES (7 DAYS)',
    strainAndRecovery7Days: 'STRAIN & RECOVERY (7 DAYS)',
    sun: 'Sun',
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
  },

  ar: {
    // Common Actions & Buttons
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    done: 'تم',
    reconnect: 'إعادة الاتصال',
    disconnect: 'فصل الاتصال',
    exportData: 'تصدير البيانات',
    importData: 'استيراد البيانات',
    edit: 'تعديل',
    fillOut: 'تعبئة',
    start: 'بدء',
    end: 'إنهاء',
    active: 'نشط',
    back: 'رجوع',
    share: 'مشاركة',
    customize: 'تخصيص',
    addActivity: 'إضافة نشاط',
    viewAll: 'عرض الكل',
    clear: 'مسح',
    clearAll: 'مسح الكل',
    confirm: 'تأكيد',
    retry: 'إعادة المحاولة',

    // Top Bar & Navigation
    today: 'اليوم',
    yesterday: 'الأمس',
    daysAgo: 'أيام مضت',
    home: 'الرئيسية',
    plan: 'الخطة',
    community: 'المجتمع',
    more: 'المزيد',
    overview: 'نظرة عامة',
    sleep: 'النوم',
    recovery: 'التعافي',
    strain: 'الجهد اليومي',
    weeklyPlan: 'الخطة الأسبوعية والبروتوكولات',
    communityLeaderboards: 'المجتمع ولوحة الصدارة',
    settingsHardware: 'الإعدادات وجهاز السوار',

    // Bluetooth & Hardware Status
    connected: 'متصل',
    disconnected: 'غير متصل',
    connecting: 'جاري الاتصال...',
    calibrating: 'جاري المعايرة',
    onWrist: 'على المعصم',
    offWrist: 'مفصول عن المعصم',
    battery: 'البطارية',
    sensor: 'الحساس',
    strapTitle: 'سوار WHOOP 4.0',
    status: 'حالة الاتصال',
    wristPlacement: 'وضع المعصم',
    firmware: 'البرنامج الثابت',
    serialNumber: 'الرقم التسلسلي',
    hardwareVersion: 'إصدار الجهاز',
    pairFiltered: 'إقران WHOOP 4.0 (بحث مخصص)',
    showAllDevices: 'إظهار جميع الأجهزة (بحث احتياطي)',
    oneClickReconnect: 'إعادة اتصال سريعة بـ',
    disconnectStrap: 'فصل السوار',
    connectionGuide: 'دليل ربط سوار WHOOP 4.0',
    guidePhoneApp: 'فصل تطبيق الهاتف: أغلق تطبيق WHOOP على هاتفك (السوار يقبل اتصالاً واحداً فقط).',
    guidePairingMode: 'تفعيل وضع الإقران: انقر مرتين بقوة على أعلى السوار حتى تومض لمبات LED.',
    guideBluetoothOn: 'تشغيل البلوتوث: تأكد من تفعيل البلوتوث في نظام تشغيل جهازك.',
    signalStrength: 'قوة الإشارة',
    charging: 'جاري الشحن',
    discharging: 'تفريغ البطارية',
    hardwareDiagnostics: 'تشخيص العتاد والحساسات',
    skinContact: 'ملامسة الجلد',
    skinContactLocked: 'مُحكم (على المعصم)',
    skinContactLost: 'مفصول (غير ملامس)',
    packetsPerMin: 'حزمة/دقيقة',
    packetRate: 'معدل استلام الحزم',
    bandOffWristAlert: 'السوار غير ملامس للجلد / مفصول عن المعصم',
    paused: 'متوقف مؤقتاً',

    // Core Biometrics & Health Metrics
    recoveryScore: 'نسبة الاستشفاء',
    dayStrain: 'الجهد اليومي',
    activityStrain: 'إجهاد النشاط',
    heartRate: 'نبضات القلب',
    rhr: 'نبض الراحة',
    restingHeartRate: 'نبض الراحة (RHR)',
    hrv: 'تباين النبض',
    hrvFull: 'تباين معدل ضربات القلب (HRV)',
    bpm: 'ن/د',
    rpm: 'د/د',
    calories: 'السعرات الحرارية',
    activeCalories: 'السعرات النشطة',
    bmr: 'الأيض الأساسي (BMR)',
    totalCalories: 'إجمالي السعرات',
    steps: 'الخطوات ومعدل الخطو',
    cadence: 'معدل الخطو',
    spm: 'خ/د',
    stepSource: 'مصدر الخطوات',
    imuHardware: 'حساس IMU',
    activityInference: 'تقدير النشاط',
    skinTemp: 'حرارة الجلد',
    skinTempDelta: 'انحراف الحرارة',
    bloodOxygen: 'تشبع الأكسجين (SpO2)',
    spO2: 'تشبع الأكسجين (SpO2)',
    respiratoryRate: 'معدل التنفس',
    vo2Max: 'الحد الأقصى للأكسجين VO2 Max',
    leanBodyMass: 'كتلة الجسم الخالية من الدهون',
    targetStrain: 'الجهد المستهدف',
    optimalTarget: 'الجهد المثالي',
    target: 'المستهدف',
    baseline: 'خط الأساس',
    typicalRange: 'النطاق المعتاد',
    withinRange: 'ضمن النطاق الطبيعي',
    outOfRange: 'خارج النطاق المعتاد',

    // Stress & Autonomic Tone
    stressMonitor: 'مراقب التوتر',
    stressScore: 'مؤشر التوتر',
    liveStressLevel: 'مستوى التوتر الفسيولوجي المباشر',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    restingStress: 'توتر وقت الراحة',
    highStressAlert: 'رصد ارتفاع التوتر أثناء الراحة',
    breathePacer: 'مرشد التنفس لتهدئة النبض',
    inhale: 'شهيق',
    hold: 'حبس النفس',
    exhale: 'زفير',

    // Sleep Architecture & Sleep Coach
    sleepPerformance: 'أداء النوم',
    sleepNeed: 'الاحتياج الفعلي للنوم',
    actualSleep: 'النوم المحقق',
    hoursVsNeed: 'الاحتياج الفعلي للنوم مقابل النوم المحقق',
    timeInBed: 'الوقت في الفراش',
    sleepDebt: 'عجز النوم',
    sleepDebtHoursLabel: 'عجز النوم',
    sleepEfficiency: 'كفاءة النوم',
    restorativeSleep: 'النوم التعويضي المجدد',
    sleepConsistency: 'اتساق مواعيد النوم',
    sleepStages: 'مراحل النوم',
    awake: 'مستيقظ',
    lightSleep: 'نوم خفيف',
    deepSleep: 'نوم عميق (SWS)',
    remSleep: 'نوم حركة العين السريعة (REM)',
    disturbances: 'مرات الاستيقاظ والاضطراب',
    sleepNeedBreakdown: 'تفصيل الاحتياج الفعلي للنوم',
    baselineSleepNeed: 'الاحتياج الأساسي للنوم',
    recentSleepDebt: 'عجز النوم المتراكم',
    strainSleepDemand: 'طلب النوم الإضافي من الجهد',
    hypnogramTitle: 'مخطط بنية ومراحل النوم (Hypnogram)',
    circadianAlignment: 'التوافق البيولوجي اليومي',
    bedtime: 'وقت النوم',
    wakeTime: 'الاستيقاظ',
    recommendedBedtime: 'موعد النوم الموصى به',
    alarmOn: 'المنبه الذكي مفعل',
    sleepCoachAdvice: 'احرص على ثبات وقت الاستيقاظ لزيادة جودة مراحل نوم حركة العين السريعة.',
    launchOledNightLock: 'تفعيل قفل الشاشة الليلي OLED (إبقاء البلوتوث متصلاً)',

    // Recovery Engine & Factors
    recoveryFactors: 'عوامل الاستشفاء الفسيولوجي',
    recoveryGreenMsg: 'جسمك في أفضل حالات الجاهزية لتحمل أعلى مستويات الجهد البدني والذهني.',
    recoveryYellowMsg: 'جسمك يحافظ على توازنه الفسيولوجي المعتاد. يوصى بتدريب معتدل.',
    recoveryRedMsg: 'جسمك تحت إجهاد مرتفع أو يعاني من عجز نوم. الأولوية اليوم للراحة والاستشفاء.',
    recoveryCalibratingMsg: 'ارتدِ السوار أثناء النوم لمعايرة خط الأساس الشخصي لنسبة استشفائك.',
    vitalSigns: 'العلامات الحيوية والمؤشرات',
    readinessOptimal: 'استشفاء ممتاز وجاهزية عالية',
    readinessModerate: 'استشفاء معتدل متوازن',
    readinessRest: 'يتطلب راحة واستشفاء',
    measureMorningRecovery: 'قياس الاستشفاء الصباحي (اختبار HRV لمدة 3 دقائق)',
    recoveryAssessment: 'فحص الاستشفاء (3 دقائق)',

    // Home Screen & Sections
    myDay: 'يومي',
    myDashboard: 'لوحة مؤشراتي',
    dailyOutlook: 'التقرير اليومي',
    todaysActivities: 'أنشطة اليوم',
    noActivitiesToday: 'لا توجد أنشطة مسجلة اليوم',
    startActivity: 'بدء تمرين مباشر',
    whoopCoach: 'مدرب WHOOP الذكي',
    askCoach: 'اسأل مدرب WHOOP عن استشفائك أو خطة تدريبك...',
    allMetricsNormal: 'جميع المؤشرات الخمسة ضمن النطاق الطبيعي',
    metricsOutOfRange: 'مؤشرات تتطلب انتباهك',
    getDailyOutlook: 'عرض التقرير اليومي',
    outlookSubtitle: 'اكتشف اليوم توصيات مدرب WHOOP المخصصة لتحسين روتينك اليومي وأدائك البدني.',
    tonightsSleep: 'نوم الليلة',
    myJournal: 'سجل العادات اليومية',
    journalSubtitle: 'تتبع العادات الرياضية والصحية وأثرها على الاستشفاء',

    // Heart Rate Zones & Workouts
    hrZones: 'نطاقات نبضات القلب',
    zone0: 'النطاق 0: راحة (<50%)',
    zone1: 'النطاق 1: خفيف جداً (50-60%)',
    zone2: 'النطاق 2: خفيف (60-70%)',
    zone3: 'النطاق 3: معتدل (70-80%)',
    zone4: 'النطاق 4: شاق (80-90%)',
    zone5: 'النطاق 5: أقصى طاقة (90-100%)',
    avgHr: 'متوسط نبض القلب',
    maxHr: 'أقصى نبض للقلب',
    minHr: 'أدنى نبض للقلب',
    duration: 'المدة',
    startWorkout: 'بدء التمرين',
    endWorkout: 'إنهاء التمرين وحفظه',
    workoutSession: 'جلسة تدريب',
    liveStrainCoach: 'مدرب الجهد المباشر',
    running: 'الجري',
    weightlifting: 'رفع الأثقال',
    cycling: 'الدراجة',
    functionalFitness: 'اللياقة الوظيفية',
    hiit: 'تمارين HIIT',
    walking: 'المشي',
    swimming: 'السباحة',
    rowing: 'التجديف',
    yoga: 'اليوغا',

    // Modals & Tools
    dailyJournal: 'سجل العادات اليومية',
    logBehaviors: 'تسجيل العادات',
    recoveryImpact: 'تحليل أثر الاستشفاء',
    habitImpact: 'أثر العادات على الاستشفاء',
    autonomicCorrelationModel: 'نموذج الارتباط الذاتي المتقدم',
    behaviorsTrackedToday: 'عادات مسجلة اليوم',
    behaviorsLogDesc: 'سجّل عاداتك اليومية لمعايرة نموذج الارتباط الذاتي بين سلوكياتك ونسبة استشفائك صباح الغد.',
    correlationModelDesc: 'بناءً على سجلاتك الفسيولوجية، يوضح هذا الجدول متوسط الزيادة أو النقصان في نسبة الاستشفاء عند ممارسة كل عادة:',
    sleepPlanner: 'مخطط النوم والمنبه الذكي',
    sleepPlannerDesc: 'حدد موعد نومك المثالي بناءً على احتياجك الفعلي للنوم والهدف المستهدف للاستشفاء.',
    strengthTrainer: 'مدرب القوة والمقاومة',
    strengthTrainerDesc: 'تتبع الأوزان والتكرارات والمجموعات لحساب الجهد العضلي بجانب الجهد القلبي الوعائي.',
    muscularLoad: 'الحمل العضلي',
    healthMonitor: 'مراقب الصحة والعلامات الحيوية',
    healthMonitorDesc: 'مراقبة مستمرة لمؤشراتك الحيوية الخمسة ومقارنتها بخط الأساس المعاير لـ 30 يوماً.',
    shareDoctorsReport: 'مشاركة التقرير السريري مع الطبيب',
    generatingReport: 'جاري إنشاء التقرير السريري...',
    reportDownloaded: 'تم إنشاء التقرير بنجاح!',
    nightLock: 'قفل شاشة النوم OLED',
    notificationCenter: 'مركز الإشعارات الذكي',
    testChimesHaptics: 'اختبار الأصوات والاهتزازات والتنبيهات المباشرة',
    quickAction: 'الإجراءات السريعة',

    // Habits (Standard WHOOP 10)
    habitAlcohol: 'تناول الكحول',
    habitCaffeineLate: 'كافيين بعد الظهر',
    habitLateMeal: 'وجبة متأخرة قبل النوم',
    habitHydration: 'تحقيق هدف شرب الماء (3 لتر+)',
    habitMagnesium: 'مكمل المغنيسيوم / النوم',
    habitScreenInBed: 'استخدام الهاتف في السرير',
    habitBreathwork: 'تمارين التنفس أو التأمل',
    habitColdExposure: 'دش بارد / حمام جليدي',
    habitSunlight: 'التعرض لضوء الشمس الصباحي',
    habitSleepMask: 'غرفة مظلمة تماماً / قناع عين',

    // More & App Settings
    deviceSettings: 'إعدادات السوار',
    myAccount: 'الملف الشخصي والحساب',
    appSettings: 'إعدادات التطبيق',
    privacy: 'الخصوصية وأمان البيانات',
    tutorials: 'الإرشادات ودليل الاستخدام',
    about: 'حول التطبيق',
    language: 'اللغة',
    languageName: 'العربية',
    switchLanguage: 'اللغة / Language',
    english: 'English (الإنجليزية)',
    arabic: 'العربية (Arabic)',
    biometricProfile: 'الملف الشخصي والقياسات الفسيولوجية',
    biometricProfileDesc: 'هذه القياسات تعاير نطاقات الجهد اليومي وحساب نسبة الاستشفاء الطبيعية CDF.',
    athleteName: 'اسم الرياضي',
    ageYears: 'العمر (بالسنوات)',
    genderLabel: 'الجنس (حساب BMR)',
    male: 'ذكر',
    female: 'أنثى',
    weightKg: 'الوزن (كغ)',
    heightCm: 'الطول (سم)',
    restingHrBaseline: 'خط أساس نبض الراحة (ن/د)',
    hrvBaseline: 'خط أساس تباين النبض (ms)',
    maxHrBpm: 'أقصى نبض للقلب (ن/د)',
    tanakaFormula: 'معادلة تاناكا (208 - 0.7*العمر)',
    foxFormula: 'معادلة فوكس (220 - العمر)',
    saveBiometrics: 'حفظ القياسات الفسيولوجية',
    savedSuccessfully: 'تم حفظ الإعدادات بنجاح!',
    dataVault: 'مستودع البيانات والتخزين',
    dataVaultDesc: 'تصدير قاعدة بيانات Dexie IndexedDB بالكامل، أو تنزيل ملفات CSV، أو استيراد النسخ الاحتياطية.',
    exportCsv: 'تصدير ملف CSV',
    backupJson: 'نسخة احتياطية JSON',
    importWhoop: 'استيراد بيانات WHOOP (.CSV أو .JSON)',
    importPrompt: 'انقر أو اسحب ملف التصدير الرسمي',
    resetTodayStrain: 'تصفير عداد الجهد اليومي',
    resetStrainDesc: 'مسح تراكم TRIMP للإجهاد اليومي',
    reset: 'تصفير',
    privacyTitle: 'تخزين محلي 100% عبر الويب بلوتوث',
    privacySubtitle: 'تتم معالجة كافة بياناتك الحيوية محلياً في متصفحك عبر قاعدة بيانات Dexie IndexedDB دون أي اتصال بسيرفر خارجي.',
    tutorialsTitle: 'ارتداء الحساس وأفضل الممارسات',
    aboutTitle: 'تطبيق WHOOP 4.0 عبر الويب بلوتوث',
    aboutDesc: 'تطبيق ويب متكامل يحاكي منظومة WHOOP الرسمية بالكامل دون اشتراك، متصل مباشرة بسوار WHOOP 4.0.',

    // Chart Labels & Time Periods
    sevenDays: '7 أيام',
    thirtyDays: '30 يوماً',
    average: 'المتوسط',
    strain7Days: 'الجهد اليومي (7 أيام)',
    recovery7Days: 'نسبة الاستشفاء (7 أيام)',
    sleep7Days: 'كفاءة النوم (7 أيام)',
    hrv7Days: 'تباين معدل ضربات القلب (7 أيام)',
    calories7Days: 'السعرات الحرارية (7 أيام)',
    strainAndRecovery7Days: 'الجهد والاستشفاء (7 أيام)',
    sun: 'الأحد',
    mon: 'الإثنين',
    tue: 'الثلاثاء',
    wed: 'الأربعاء',
    thu: 'الخميس',
    fri: 'الجمعة',
    sat: 'السبت',
  },
};

export type TranslationKey = keyof Translations;
