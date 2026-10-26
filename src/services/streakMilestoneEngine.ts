/**
 * WHOOP-Tier Progressive Streak Milestone Evolution Engine
 * Deterministic visual tier engine scaling visual intensity, flame physics,
 * particle systems, typography, and card shaders based on streak days.
 */

export interface StreakTierConfig {
  tier: number; // 0 to 10
  minDays: number;
  maxDays: number; // e.g. 9, 19, 29, 39, 49, 59, 69, 79, 89, 99, Infinity
  id: string;
  name: string;
  nameAr: string;
  badgeLabel: string;
  badgeLabelAr: string;
  descriptor: string;
  descriptorAr: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    core: string;
    glowRgba: string;
    glowBorder: string;
    heroCardBorder: string;
    heroCardBgFrom: string;
    heroCardBgVia: string;
    heroCardBgTo: string;
    textGradient: string;
    progressBarGradient: string;
    particlePalette: string[];
    ringColor1: string;
    ringColor2: string;
    ringColor3?: string;
    conicColors?: string;
  };
  canvas: {
    particleCount: number;
    baseSpeed: number;
    turbulence: number;
    sizeMin: number;
    sizeMax: number;
    shockwaveIntervalMs: number; // periodic shockwave ring
    vortexMode: boolean; // circular spiral physics
    nebulaMode: boolean; // aurora nebula clouds + starfield
    supernovaFountain: boolean; // celebratory golden fountain
  };
  flame: {
    ringCount: number; // 1, 2, or 3 gyroscope rings
    ringSpeedSec: number;
    ringDash: string;
    pulseFrequencySec: number;
    showHexGrid: boolean;
    showOrbitalNodes: boolean;
    showLaurelCrest: boolean;
    showConicBorderBeam: boolean;
    showChromaticAberration: boolean;
    flameScale: number;
  };
  holographicCard: boolean;
}

export const STREAK_MILESTONE_TIERS: StreakTierConfig[] = [
  // Tier 0 (0-9 Days) - Ignition Spark
  {
    tier: 0,
    minDays: 0,
    maxDays: 9,
    id: 'tier-0-ignition',
    name: 'Ignition Spark',
    nameAr: 'شرارة الانطلاق',
    badgeLabel: 'TIER 0 • SPARK',
    badgeLabelAr: 'المستوى 0 • شرارة',
    descriptor: 'Warm ember glow & circadian baseline acquisition',
    descriptorAr: 'توهج الجمر الدافئ وتثبيت خط الأساس البيولوجي',
    colors: {
      primary: '#FF6B00',
      secondary: '#FFA800',
      accent: '#FFD166',
      core: '#FFF4D6',
      glowRgba: 'rgba(255, 107, 0, 0.35)',
      glowBorder: 'rgba(255, 107, 0, 0.4)',
      heroCardBorder: 'border-amber-500/25',
      heroCardBgFrom: '#181D26',
      heroCardBgVia: '#12151A',
      heroCardBgTo: '#0A0D11',
      textGradient: 'from-amber-100 via-[#FFA800] to-[#FF6B00]',
      progressBarGradient: 'from-[#FF6B00] to-[#FFA800]',
      particlePalette: ['#FF6B00', '#FFA800', '#FFD166', '#FF8533'],
      ringColor1: 'rgba(255, 107, 0, 0.4)',
      ringColor2: 'rgba(255, 168, 0, 0.25)',
    },
    canvas: {
      particleCount: 10,
      baseSpeed: 0.6,
      turbulence: 1.2,
      sizeMin: 1.5,
      sizeMax: 3.0,
      shockwaveIntervalMs: 0,
      vortexMode: false,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 1,
      ringSpeedSec: 14,
      ringDash: '4 8',
      pulseFrequencySec: 2.2,
      showHexGrid: false,
      showOrbitalNodes: false,
      showLaurelCrest: false,
      showConicBorderBeam: false,
      showChromaticAberration: false,
      flameScale: 0.95,
    },
    holographicCard: false,
  },

  // Tier 1 (10-19 Days) - 10-Day Kinetic Blaze
  {
    tier: 1,
    minDays: 10,
    maxDays: 19,
    id: 'tier-1-kinetic-blaze',
    name: '10-Day Kinetic Blaze',
    nameAr: 'شعلة الحركة 10 أيام',
    badgeLabel: 'TIER 1 • KINETIC BLAZE',
    badgeLabelAr: 'المستوى 1 • شعلة الحركة',
    descriptor: 'Thermal turbulence & kinetic cardiovascular momentum',
    descriptorAr: 'اضطراب حراري متصاعد وزخم قلبي متواصل',
    colors: {
      primary: '#FF3B30',
      secondary: '#FF8800',
      accent: '#FFCC00',
      core: '#FFFBE6',
      glowRgba: 'rgba(255, 59, 48, 0.45)',
      glowBorder: 'rgba(255, 85, 0, 0.55)',
      heroCardBorder: 'border-orange-500/40',
      heroCardBgFrom: '#1F171A',
      heroCardBgVia: '#151318',
      heroCardBgTo: '#0B0D11',
      textGradient: 'from-orange-100 via-[#FF8800] to-[#FF3B30]',
      progressBarGradient: 'from-[#FF3B30] to-[#FF8800]',
      particlePalette: ['#FF3B30', '#FF8800', '#FFAA00', '#FFCC00', '#FF5533'],
      ringColor1: 'rgba(255, 59, 48, 0.6)',
      ringColor2: 'rgba(255, 136, 0, 0.35)',
    },
    canvas: {
      particleCount: 18,
      baseSpeed: 0.9,
      turbulence: 1.8,
      sizeMin: 1.8,
      sizeMax: 3.5,
      shockwaveIntervalMs: 0,
      vortexMode: false,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 1,
      ringSpeedSec: 10,
      ringDash: '6 8',
      pulseFrequencySec: 1.8,
      showHexGrid: false,
      showOrbitalNodes: false,
      showLaurelCrest: false,
      showConicBorderBeam: false,
      showChromaticAberration: false,
      flameScale: 1.0,
    },
    holographicCard: false,
  },

  // Tier 2 (20-29 Days) - 20-Day Solar Surge
  {
    tier: 2,
    minDays: 20,
    maxDays: 29,
    id: 'tier-2-solar-surge',
    name: '20-Day Solar Surge',
    nameAr: 'التدفق الشمسي 20 يوماً',
    badgeLabel: 'TIER 2 • SOLAR SURGE',
    badgeLabelAr: 'المستوى 2 • التدفق الشمسي',
    descriptor: 'Dual telemetry rings & high-velocity solar ember corona',
    descriptorAr: 'حلقتان رقميتان متعاكستان وهالة شمسية فائقة السرعة',
    colors: {
      primary: '#FFD700',
      secondary: '#FF4500',
      accent: '#FFA500',
      core: '#FFFFEE',
      glowRgba: 'rgba(255, 215, 0, 0.45)',
      glowBorder: 'rgba(255, 180, 0, 0.6)',
      heroCardBorder: 'border-amber-400/50',
      heroCardBgFrom: '#221C14',
      heroCardBgVia: '#171513',
      heroCardBgTo: '#0C0E12',
      textGradient: 'from-amber-100 via-[#FFD700] to-[#FF4500]',
      progressBarGradient: 'from-[#FF4500] via-[#FFA500] to-[#FFD700]',
      particlePalette: ['#FFD700', '#FF4500', '#FFA500', '#FFE57F', '#FF8C00'],
      ringColor1: 'rgba(255, 215, 0, 0.75)',
      ringColor2: 'rgba(255, 69, 0, 0.55)',
    },
    canvas: {
      particleCount: 28,
      baseSpeed: 1.25,
      turbulence: 2.2,
      sizeMin: 2.0,
      sizeMax: 4.2,
      shockwaveIntervalMs: 0,
      vortexMode: false,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 2,
      ringSpeedSec: 8,
      ringDash: '5 7',
      pulseFrequencySec: 1.5,
      showHexGrid: false,
      showOrbitalNodes: false,
      showLaurelCrest: false,
      showConicBorderBeam: false,
      showChromaticAberration: false,
      flameScale: 1.05,
    },
    holographicCard: false,
  },

  // Tier 3 (30-39 Days) - 30-Day Plasma Overdrive
  {
    tier: 3,
    minDays: 30,
    maxDays: 39,
    id: 'tier-3-plasma-overdrive',
    name: '30-Day Plasma Overdrive',
    nameAr: 'طاقة البلازما الفائقة 30 يوماً',
    badgeLabel: 'TIER 3 • PLASMA OVERDRIVE',
    badgeLabelAr: 'المستوى 3 • بلازما فائقة',
    descriptor: 'Cyan electric hot core with harmonic shockwave expansion',
    descriptorAr: 'لب كهربائي سماوي نفاث وموجات صدمية متمددة كل 2.5 ثانية',
    colors: {
      primary: '#00F0FF',
      secondary: '#FF5500',
      accent: '#00B4D8',
      core: '#E0FFFF',
      glowRgba: 'rgba(0, 240, 255, 0.45)',
      glowBorder: 'rgba(0, 240, 255, 0.65)',
      heroCardBorder: 'border-cyan-400/50',
      heroCardBgFrom: '#0E222A',
      heroCardBgVia: '#10171D',
      heroCardBgTo: '#090D11',
      textGradient: 'from-cyan-100 via-[#00F0FF] to-[#FF5500]',
      progressBarGradient: 'from-[#00F0FF] via-[#00B4D8] to-[#FF5500]',
      particlePalette: ['#00F0FF', '#00B4D8', '#FF5500', '#FF8800', '#E0FFFF'],
      ringColor1: 'rgba(0, 240, 255, 0.85)',
      ringColor2: 'rgba(255, 85, 0, 0.65)',
    },
    canvas: {
      particleCount: 34,
      baseSpeed: 1.4,
      turbulence: 2.6,
      sizeMin: 2.0,
      sizeMax: 4.5,
      shockwaveIntervalMs: 2500, // periodic shockwaves
      vortexMode: false,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 2,
      ringSpeedSec: 6.5,
      ringDash: '8 6',
      pulseFrequencySec: 1.3,
      showHexGrid: false,
      showOrbitalNodes: false,
      showLaurelCrest: false,
      showConicBorderBeam: false,
      showChromaticAberration: false,
      flameScale: 1.1,
    },
    holographicCard: false,
  },

  // Tier 4 (40-49 Days) - 40-Day Emerald Biometric Fusion
  {
    tier: 4,
    minDays: 40,
    maxDays: 49,
    id: 'tier-4-emerald-fusion',
    name: '40-Day Emerald Biometric Fusion',
    nameAr: 'الاندماج الحيوي الزمردي 40 يوماً',
    badgeLabel: 'TIER 4 • EMERALD FUSION',
    badgeLabelAr: 'المستوى 4 • اندماج زمردي',
    descriptor: 'WHOOP signature neon green & cyber teal telemetry HUD grid',
    descriptorAr: 'أخضر ووب الزمردي الشهير مع شبكة HUD وقنوات بيانات مدارية',
    colors: {
      primary: '#16EC06',
      secondary: '#00F0FF',
      accent: '#00E5FF',
      core: '#EFFFF2',
      glowRgba: 'rgba(22, 236, 6, 0.5)',
      glowBorder: 'rgba(22, 236, 6, 0.65)',
      heroCardBorder: 'border-[#16EC06]/50',
      heroCardBgFrom: '#0D2416',
      heroCardBgVia: '#0E1A16',
      heroCardBgTo: '#080E0C',
      textGradient: 'from-emerald-100 via-[#16EC06] to-[#00F0FF]',
      progressBarGradient: 'from-[#16EC06] via-[#00E5FF] to-[#00F0FF]',
      particlePalette: ['#16EC06', '#00F0FF', '#39FF14', '#00E5FF', '#D4FFD4'],
      ringColor1: 'rgba(22, 236, 6, 0.9)',
      ringColor2: 'rgba(0, 240, 255, 0.7)',
    },
    canvas: {
      particleCount: 38,
      baseSpeed: 1.5,
      turbulence: 2.8,
      sizeMin: 2.2,
      sizeMax: 4.8,
      shockwaveIntervalMs: 2500,
      vortexMode: false,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 2,
      ringSpeedSec: 5.5,
      ringDash: '10 5',
      pulseFrequencySec: 1.2,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: false,
      showConicBorderBeam: false,
      showChromaticAberration: false,
      flameScale: 1.12,
    },
    holographicCard: false,
  },

  // Tier 5 (50-59 Days) - 50-Day Supernova Half-Century
  {
    tier: 5,
    minDays: 50,
    maxDays: 59,
    id: 'tier-5-supernova',
    name: '50-Day Supernova Half-Century',
    nameAr: 'سوبرنوفا نصف القرن 50 يوماً',
    badgeLabel: 'TIER 5 • SUPERNOVA',
    badgeLabelAr: 'المستوى 5 • سوبرنوفا 50',
    descriptor: 'Violet-Magenta hyper flame & spinning laser-etched border beam',
    descriptorAr: 'شعلة بنفسجية وذهبية فائقة مع حافة ليزرية تدور بزاوية 360°',
    colors: {
      primary: '#A855F7',
      secondary: '#FACC15',
      accent: '#EC4899',
      core: '#FAF5FF',
      glowRgba: 'rgba(168, 85, 247, 0.55)',
      glowBorder: 'rgba(168, 85, 247, 0.7)',
      heroCardBorder: 'border-purple-500/50',
      heroCardBgFrom: '#23122E',
      heroCardBgVia: '#171120',
      heroCardBgTo: '#0B0811',
      textGradient: 'from-purple-100 via-[#FACC15] to-[#A855F7]',
      progressBarGradient: 'from-[#A855F7] via-[#EC4899] to-[#FACC15]',
      particlePalette: ['#A855F7', '#FACC15', '#EC4899', '#C084FC', '#FDE047'],
      ringColor1: 'rgba(168, 85, 247, 0.9)',
      ringColor2: 'rgba(250, 204, 21, 0.75)',
      conicColors: '#A855F7, #EC4899, #FACC15, #A855F7',
    },
    canvas: {
      particleCount: 45,
      baseSpeed: 1.6,
      turbulence: 3.2,
      sizeMin: 2.2,
      sizeMax: 5.0,
      shockwaveIntervalMs: 2500,
      vortexMode: false,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 2,
      ringSpeedSec: 4.8,
      ringDash: '12 6',
      pulseFrequencySec: 1.1,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: false,
      showConicBorderBeam: true,
      showChromaticAberration: false,
      flameScale: 1.15,
    },
    holographicCard: false,
  },

  // Tier 6 (60-69 Days) - 60-Day Crimson Titanium Vortex
  {
    tier: 6,
    minDays: 60,
    maxDays: 69,
    id: 'tier-6-titanium-vortex',
    name: '60-Day Crimson Titanium Vortex',
    nameAr: 'دوامة التيتانيوم القرمزية 60 يوماً',
    badgeLabel: 'TIER 6 • TITANIUM VORTEX',
    badgeLabelAr: 'المستوى 6 • دوامة تيتانيوم',
    descriptor: 'Deep Ruby core, triple-ring gyroscope & chromatic pulse digits',
    descriptorAr: 'قلب ياقوتي منصهر وجيروسكوب ثلاثي مع نبض لوني متشتت',
    colors: {
      primary: '#FF1E56',
      secondary: '#00F0FF',
      accent: '#FFFFFF',
      core: '#FFFFFF',
      glowRgba: 'rgba(255, 30, 86, 0.65)',
      glowBorder: 'rgba(255, 30, 86, 0.8)',
      heroCardBorder: 'border-[#FF1E56]/60',
      heroCardBgFrom: '#2C0D17',
      heroCardBgVia: '#1B0E14',
      heroCardBgTo: '#0D080A',
      textGradient: 'from-white via-[#FF1E56] to-[#FF6B8B]',
      progressBarGradient: 'from-[#FF1E56] via-[#FF6B8B] to-[#FFFFFF]',
      particlePalette: ['#FF1E56', '#FFFFFF', '#FF6B8B', '#FF3366', '#00F0FF'],
      ringColor1: 'rgba(255, 30, 86, 0.95)',
      ringColor2: 'rgba(255, 255, 255, 0.85)',
      ringColor3: 'rgba(0, 240, 255, 0.7)',
      conicColors: '#FF1E56, #FFFFFF, #00F0FF, #FF1E56',
    },
    canvas: {
      particleCount: 52,
      baseSpeed: 1.8,
      turbulence: 3.5,
      sizeMin: 2.4,
      sizeMax: 5.5,
      shockwaveIntervalMs: 2200,
      vortexMode: true,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 3,
      ringSpeedSec: 4.0,
      ringDash: '14 5',
      pulseFrequencySec: 0.95,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: false,
      showConicBorderBeam: true,
      showChromaticAberration: true,
      flameScale: 1.18,
    },
    holographicCard: false,
  },

  // Tier 7 (70-79 Days) - 70-Day Supercharged Crimson Core
  {
    tier: 7,
    minDays: 70,
    maxDays: 79,
    id: 'tier-7-crimson-core',
    name: '70-Day Supercharged Crimson Core',
    nameAr: 'الدوامة القرمزية الفائقة 70 يوماً',
    badgeLabel: 'TIER 7 • SUPERCHARGED CORE',
    badgeLabelAr: 'المستوى 7 • قلب ياقوتي فائق',
    descriptor: 'Molten White-Hot vortex core with intensified chromatic energy',
    descriptorAr: 'مركز دوران منصهر فائق السطوع مع طاقة لونية طيفية مضاعفة',
    colors: {
      primary: '#FF1E56',
      secondary: '#FFFFFF',
      accent: '#FF758F',
      core: '#FFFFFF',
      glowRgba: 'rgba(255, 30, 86, 0.75)',
      glowBorder: 'rgba(255, 30, 86, 0.9)',
      heroCardBorder: 'border-[#FF1E56]/70',
      heroCardBgFrom: '#330E1B',
      heroCardBgVia: '#1E1017',
      heroCardBgTo: '#0E080C',
      textGradient: 'from-white via-[#FF758F] to-[#FF1E56]',
      progressBarGradient: 'from-[#FF1E56] via-[#FF758F] to-[#FFFFFF]',
      particlePalette: ['#FF1E56', '#FFFFFF', '#FF85A1', '#FF4D6D', '#FFF0F3'],
      ringColor1: 'rgba(255, 30, 86, 1.0)',
      ringColor2: 'rgba(255, 255, 255, 0.9)',
      ringColor3: 'rgba(255, 117, 143, 0.8)',
      conicColors: '#FF1E56, #FFFFFF, #FF758F, #FF1E56',
    },
    canvas: {
      particleCount: 60,
      baseSpeed: 2.0,
      turbulence: 3.8,
      sizeMin: 2.5,
      sizeMax: 5.8,
      shockwaveIntervalMs: 2000,
      vortexMode: true,
      nebulaMode: false,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 3,
      ringSpeedSec: 3.4,
      ringDash: '16 6',
      pulseFrequencySec: 0.85,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: false,
      showConicBorderBeam: true,
      showChromaticAberration: true,
      flameScale: 1.2,
    },
    holographicCard: false,
  },

  // Tier 8 (80-89 Days) - 80-Day Celestial Quantum Core
  {
    tier: 8,
    minDays: 80,
    maxDays: 89,
    id: 'tier-8-celestial-quantum',
    name: '80-Day Celestial Quantum Core',
    nameAr: 'اللب الكمومي السماوي 80 يوماً',
    badgeLabel: 'TIER 8 • CELESTIAL QUANTUM',
    badgeLabelAr: 'المستوى 8 • لب كمومي سماوي',
    descriptor: 'Iridescent Aurora gradient with starfield & plasma nebula',
    descriptorAr: 'شفق قطبي سماوي متلألئ مع حقل نجوم وسديم بلازما كوني',
    colors: {
      primary: '#00F5D4',
      secondary: '#7B2CBF',
      accent: '#FF007F',
      core: '#FFFFFF',
      glowRgba: 'rgba(0, 245, 212, 0.7)',
      glowBorder: 'rgba(0, 245, 212, 0.85)',
      heroCardBorder: 'border-[#00F5D4]/70',
      heroCardBgFrom: '#0A2528',
      heroCardBgVia: '#1C0F2B',
      heroCardBgTo: '#090812',
      textGradient: 'from-[#00F5D4] via-[#FFFFFF] to-[#FF007F]',
      progressBarGradient: 'from-[#00F5D4] via-[#7B2CBF] to-[#FF007F]',
      particlePalette: ['#00F5D4', '#7B2CBF', '#FF007F', '#FFFFFF', '#9D4EDD'],
      ringColor1: 'rgba(0, 245, 212, 0.95)',
      ringColor2: 'rgba(123, 44, 191, 0.85)',
      ringColor3: 'rgba(255, 0, 127, 0.8)',
      conicColors: '#00F5D4, #7B2CBF, #FF007F, #00F5D4',
    },
    canvas: {
      particleCount: 70,
      baseSpeed: 1.8,
      turbulence: 3.2,
      sizeMin: 2.0,
      sizeMax: 5.5,
      shockwaveIntervalMs: 2000,
      vortexMode: false,
      nebulaMode: true,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 3,
      ringSpeedSec: 3.2,
      ringDash: '14 7',
      pulseFrequencySec: 0.8,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: false,
      showConicBorderBeam: true,
      showChromaticAberration: false,
      flameScale: 1.22,
    },
    holographicCard: true,
  },

  // Tier 9 (90-99 Days) - 90-Day Astral Singularity
  {
    tier: 9,
    minDays: 90,
    maxDays: 99,
    id: 'tier-9-astral-singularity',
    name: '90-Day Astral Singularity',
    nameAr: 'التفرد النجمي الأسمى 90 يوماً',
    badgeLabel: 'TIER 9 • ASTRAL SINGULARITY',
    badgeLabelAr: 'المستوى 9 • تفرد نجمي 90',
    descriptor: 'Deep cosmic plasma nebula and sweeping relativistic lens flares',
    descriptorAr: 'سديم كوني نفاث وعدسات ضوئية سينمائية تجوب بطاقة التميز',
    colors: {
      primary: '#00F5D4',
      secondary: '#FF007F',
      accent: '#FFE57F',
      core: '#FFFFFF',
      glowRgba: 'rgba(255, 0, 127, 0.75)',
      glowBorder: 'rgba(255, 0, 127, 0.9)',
      heroCardBorder: 'border-[#FF007F]/75',
      heroCardBgFrom: '#150A24',
      heroCardBgVia: '#200A1E',
      heroCardBgTo: '#0A0612',
      textGradient: 'from-[#FFE57F] via-[#00F5D4] to-[#FF007F]',
      progressBarGradient: 'from-[#FF007F] via-[#FFE57F] to-[#00F5D4]',
      particlePalette: ['#00F5D4', '#FF007F', '#FFE57F', '#FFFFFF', '#C77DFF'],
      ringColor1: 'rgba(255, 0, 127, 1.0)',
      ringColor2: 'rgba(0, 245, 212, 0.95)',
      ringColor3: 'rgba(255, 229, 127, 0.85)',
      conicColors: '#FF007F, #FFE57F, #00F5D4, #FF007F',
    },
    canvas: {
      particleCount: 80,
      baseSpeed: 2.1,
      turbulence: 3.6,
      sizeMin: 2.2,
      sizeMax: 6.0,
      shockwaveIntervalMs: 1800,
      vortexMode: true,
      nebulaMode: true,
      supernovaFountain: false,
    },
    flame: {
      ringCount: 3,
      ringSpeedSec: 2.8,
      ringDash: '18 6',
      pulseFrequencySec: 0.75,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: false,
      showConicBorderBeam: true,
      showChromaticAberration: true,
      flameScale: 1.25,
    },
    holographicCard: true,
  },

  // Tier 10 (100+ Days) - 100-Day Immortal Centurion Legend
  {
    tier: 10,
    minDays: 100,
    maxDays: Infinity,
    id: 'tier-10-centurion-legend',
    name: '100-Day Immortal Centurion Legend',
    nameAr: 'أسطورة المئوية الخالدة 100+ يوم',
    badgeLabel: 'TIER 10 • IMMORTAL CENTURION',
    badgeLabelAr: 'المستوى 10 • أسطورة سينتوريون 100',
    descriptor: 'Liquid Diamond & Obsidian Gold with Imperial Crest & Supernova Fountain',
    descriptorAr: 'الماس السائل والذهب الثلاثي مع إكليل الغار ونافورة سوبرنوفا احتفالية',
    colors: {
      primary: '#FFE57F',
      secondary: '#00F0FF',
      accent: '#FFFFFF',
      core: '#FFFFFF',
      glowRgba: 'rgba(255, 229, 127, 0.9)',
      glowBorder: 'rgba(255, 229, 127, 1.0)',
      heroCardBorder: 'border-[#FFE57F]',
      heroCardBgFrom: '#241D0D',
      heroCardBgVia: '#171410',
      heroCardBgTo: '#09080A',
      textGradient: 'from-white via-[#FFE57F] to-[#00F0FF]',
      progressBarGradient: 'from-[#FFE57F] via-[#FFFFFF] to-[#00F0FF]',
      particlePalette: ['#FFE57F', '#FFFFFF', '#00F0FF', '#FFD700', '#FFF8E1', '#E0F7FA'],
      ringColor1: 'rgba(255, 229, 127, 1.0)',
      ringColor2: 'rgba(255, 255, 255, 0.95)',
      ringColor3: 'rgba(0, 240, 255, 0.9)',
      conicColors: '#FFE57F, #FFFFFF, #00F0FF, #FFE57F',
    },
    canvas: {
      particleCount: 95,
      baseSpeed: 2.4,
      turbulence: 4.0,
      sizeMin: 2.5,
      sizeMax: 6.5,
      shockwaveIntervalMs: 1500,
      vortexMode: false,
      nebulaMode: true,
      supernovaFountain: true, // celebratory upward parabolic fountain
    },
    flame: {
      ringCount: 3,
      ringSpeedSec: 2.2,
      ringDash: '20 5',
      pulseFrequencySec: 0.65,
      showHexGrid: true,
      showOrbitalNodes: true,
      showLaurelCrest: true, // Golden Imperial Laurel Wreath & Crown
      showConicBorderBeam: true,
      showChromaticAberration: true,
      flameScale: 1.3,
    },
    holographicCard: true,
  },
];

/**
 * Returns the deterministic milestone tier configuration for any given streak days.
 */
export function getStreakMilestoneTier(days: number): StreakTierConfig {
  const safeDays = Math.max(0, Math.floor(days));
  const found = STREAK_MILESTONE_TIERS.find(
    (t) => safeDays >= t.minDays && (t.maxDays === Infinity || safeDays <= t.maxDays)
  );
  return found || STREAK_MILESTONE_TIERS[0];
}

/**
 * Returns progress towards the next 10-day milestone bracket.
 */
export interface TierBracketProgress {
  currentTier: StreakTierConfig;
  nextTier: StreakTierConfig | null;
  bracketMin: number;
  bracketTarget: number;
  progressRatio: number; // 0.0 to 1.0
  daysRemaining: number;
  isMaxTier: boolean;
}

export function getTierBracketProgress(days: number): TierBracketProgress {
  const safeDays = Math.max(0, Math.floor(days));
  const currentTier = getStreakMilestoneTier(safeDays);

  if (currentTier.tier >= 10) {
    return {
      currentTier,
      nextTier: null,
      bracketMin: 100,
      bracketTarget: 100,
      progressRatio: 1.0,
      daysRemaining: 0,
      isMaxTier: true,
    };
  }

  const nextTier = STREAK_MILESTONE_TIERS.find((t) => t.tier === currentTier.tier + 1) || null;
  const bracketMin = currentTier.minDays;
  const bracketTarget = nextTier ? nextTier.minDays : currentTier.maxDays + 1;
  const range = Math.max(1, bracketTarget - bracketMin);
  const offset = Math.max(0, safeDays - bracketMin);
  const progressRatio = Math.min(1.0, Math.max(0.0, offset / range));
  const daysRemaining = Math.max(0, bracketTarget - safeDays);

  return {
    currentTier,
    nextTier,
    bracketMin,
    bracketTarget,
    progressRatio,
    daysRemaining,
    isMaxTier: false,
  };
}

/**
 * Quick preview days for the interactive showcase scrubber
 */
export const PREVIEW_DAYS_LIST = [
  { days: 5, label: '5d', tierNum: 0 },
  { days: 10, label: '10d', tierNum: 1 },
  { days: 20, label: '20d', tierNum: 2 },
  { days: 30, label: '30d', tierNum: 3 },
  { days: 40, label: '40d', tierNum: 4 },
  { days: 50, label: '50d', tierNum: 5 },
  { days: 60, label: '60d', tierNum: 6 },
  { days: 70, label: '70d', tierNum: 7 },
  { days: 80, label: '80d', tierNum: 8 },
  { days: 90, label: '90d', tierNum: 9 },
  { days: 100, label: '100d+', tierNum: 10 },
] as const;
