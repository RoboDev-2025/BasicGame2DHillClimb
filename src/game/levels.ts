import { LevelConfig, Coin, LevelTheme } from './types';

// Helper to generate coins along a terrain function
function generateCoins(
  getTerrainY: (x: number) => number,
  startX: number,
  endX: number,
  step: number,
  extraJumpCoins: Array<{ x: number; heightAbove: number }> = []
): Coin[] {
  const coins: Coin[] = [];
  let id = 1;

  for (let x = startX; x <= endX; x += step) {
    coins.push({
      id: id++,
      x,
      yOffset: 34, // 34px above the road
      collected: false,
      value: 100,
    });
  }

  // Coins placed high in the air at jump crests
  for (const extra of extraJumpCoins) {
    coins.push({
      id: id++,
      x: extra.x,
      yOffset: extra.heightAbove,
      collected: false,
      value: 150,
    });
  }

  return coins;
}

// -------------------------------------------------------------
// LEVEL 1: Countryside Cruise (Easy)
// -------------------------------------------------------------
const themeLevel1: LevelTheme = {
  skyGradient: ['#38bdf8', '#bae6fd', '#fef08a'],
  grassColor: '#22c55e',
  dirtColors: ['#16a34a', '#854d0e', '#542d05'],
  strokeColor: '#15803d',
  mountainColor: 'rgba(34, 197, 94, 0.25)',
  name: 'Lush Countryside',
};

const getTerrainL1 = (x: number): number => {
  const base = 350;
  if (x < 150) return base; // Flat start
  const t = x - 150;
  // Gentle rolling hills
  const hill1 = Math.sin(t * 0.005) * 35;
  const hill2 = Math.cos(t * 0.012) * 12;
  return base + hill1 + hill2;
};

// -------------------------------------------------------------
// LEVEL 2: Rolling Foothills (Beginner+)
// -------------------------------------------------------------
const themeLevel2: LevelTheme = {
  skyGradient: ['#60a5fa', '#fed7aa', '#fef9c3'],
  grassColor: '#84cc16',
  dirtColors: ['#65a30d', '#a16207', '#543105'],
  strokeColor: '#4d7c0f',
  mountainColor: 'rgba(132, 204, 22, 0.22)',
  name: 'Golden Foothills',
};

const getTerrainL2 = (x: number): number => {
  const base = 350;
  if (x < 150) return base;
  const t = x - 150;
  // Noticeable slopes & small launching crests
  const macro = Math.sin(t * 0.004) * 55;
  const ramp = Math.sin(t * 0.009) * 25;
  const bumps = Math.cos(t * 0.02) * 8;
  return base + macro + ramp + bumps;
};

// -------------------------------------------------------------
// LEVEL 3: Pine Ridge Slopes (Medium)
// -------------------------------------------------------------
const themeLevel3: LevelTheme = {
  skyGradient: ['#0284c7', '#7dd3fc', '#cbd5e1'],
  grassColor: '#10b981',
  dirtColors: ['#059669', '#334155', '#1e293b'],
  strokeColor: '#047857',
  mountainColor: 'rgba(16, 185, 129, 0.2)',
  name: 'Pine Ridge',
};

const getTerrainL3 = (x: number): number => {
  const base = 360;
  if (x < 150) return base;
  const t = x - 150;
  // Steeper climbs, undulating terrain, uneven dips
  const hill = Math.sin(t * 0.0035) * 75;
  const crest = Math.sin(t * 0.008) * 35;
  const ripples = Math.cos(t * 0.018) * 14;
  return base + hill + crest + ripples;
};

// -------------------------------------------------------------
// LEVEL 4: Red Canyon Jumps (Hard)
// -------------------------------------------------------------
const themeLevel4: LevelTheme = {
  skyGradient: ['#f97316', '#fb923c', '#fed7aa'],
  grassColor: '#ea580c',
  dirtColors: ['#c2410c', '#7c2d12', '#431407'],
  strokeColor: '#9a3412',
  mountainColor: 'rgba(234, 88, 12, 0.22)',
  name: 'Red Rock Canyon',
};

const getTerrainL4 = (x: number): number => {
  const base = 360;
  if (x < 150) return base;
  const t = x - 150;
  // Large ramps and sudden drop offs (jumps)
  const mountain = Math.sin(t * 0.003) * 95;
  const jumpRamp = Math.sin(t * 0.007) * 45;
  const canyonDip = Math.cos(t * 0.014) * 20;
  return base + mountain + jumpRamp + canyonDip;
};

// -------------------------------------------------------------
// LEVEL 5: Highland Peaks (Very Hard)
// -------------------------------------------------------------
const themeLevel5: LevelTheme = {
  skyGradient: ['#6366f1', '#a5b4fc', '#e0e7ff'],
  grassColor: '#38bdf8',
  dirtColors: ['#0284c7', '#334155', '#0f172a'],
  strokeColor: '#0369a1',
  mountainColor: 'rgba(99, 102, 241, 0.25)',
  name: 'Alpine Highlands',
};

const getTerrainL5 = (x: number): number => {
  const base = 370;
  if (x < 150) return base;
  const t = x - 150;
  // Rollercoaster elevation with very steep ascents
  const peak = Math.sin(t * 0.0028) * 115;
  const cliff = Math.cos(t * 0.006) * 55;
  const mogul = Math.sin(t * 0.016) * 18;
  return base + peak + cliff + mogul;
};

// -------------------------------------------------------------
// LEVEL 6: Volcano Badlands (Extreme)
// -------------------------------------------------------------
const themeLevel6: LevelTheme = {
  skyGradient: ['#991b1b', '#ea580c', '#fbbf24'],
  grassColor: '#dc2626',
  dirtColors: ['#991b1b', '#450a0a', '#1c1917'],
  strokeColor: '#7f1d1d',
  mountainColor: 'rgba(220, 38, 38, 0.25)',
  name: 'Volcano Badlands',
};

const getTerrainL6 = (x: number): number => {
  const base = 370;
  if (x < 150) return base;
  const t = x - 150;
  // Rugged crater jumps, massive elevation changes
  const megaHills = Math.sin(t * 0.0025) * 130;
  const crater = Math.cos(t * 0.0055) * 65;
  const steepDrop = Math.sin(t * 0.012) * 35;
  const rockySurface = Math.sin(t * 0.024) * 10;
  return base + megaHills + crater + steepDrop + rockySurface;
};

// Master Level List
export const STATIC_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Countryside Cruise',
    subtitle: 'Level 1 – Easy',
    difficulty: 'Easy',
    length: 2400,
    finishX: 2200,
    theme: themeLevel1,
    getTerrainHeight: getTerrainL1,
    coins: generateCoins(getTerrainL1, 260, 2100, 110, [
      { x: 580, heightAbove: 70 },
      { x: 1150, heightAbove: 75 },
      { x: 1720, heightAbove: 70 },
    ]),
    description: 'Gentle green hills to master basic acceleration and braking.',
  },
  {
    id: 2,
    name: 'Rolling Foothills',
    subtitle: 'Level 2 – Beginner+',
    difficulty: 'Beginner+',
    length: 3000,
    finishX: 2800,
    theme: themeLevel2,
    getTerrainHeight: getTerrainL2,
    coins: generateCoins(getTerrainL2, 280, 2700, 120, [
      { x: 680, heightAbove: 85 },
      { x: 1420, heightAbove: 90 },
      { x: 2180, heightAbove: 85 },
    ]),
    description: 'Moderate slopes and small crests to catch your first air-time jumps.',
  },
  {
    id: 3,
    name: 'Pine Ridge Slopes',
    subtitle: 'Level 3 – Medium',
    difficulty: 'Medium',
    length: 3600,
    finishX: 3400,
    theme: themeLevel3,
    getTerrainHeight: getTerrainL3,
    coins: generateCoins(getTerrainL3, 280, 3300, 125, [
      { x: 800, heightAbove: 95 },
      { x: 1650, heightAbove: 100 },
      { x: 2550, heightAbove: 95 },
    ]),
    description: 'Steeper ascents requiring momentum and throttle balance.',
  },
  {
    id: 4,
    name: 'Red Canyon Jumps',
    subtitle: 'Level 4 – Hard',
    difficulty: 'Hard',
    length: 4200,
    finishX: 4000,
    theme: themeLevel4,
    getTerrainHeight: getTerrainL4,
    coins: generateCoins(getTerrainL4, 300, 3900, 130, [
      { x: 920, heightAbove: 110 },
      { x: 1880, heightAbove: 115 },
      { x: 2950, heightAbove: 120 },
      { x: 3600, heightAbove: 105 },
    ]),
    description: 'Large canyon ramps and wide air jumps. Balance your car in flight!',
  },
  {
    id: 5,
    name: 'Highland Peaks',
    subtitle: 'Level 5 – Very Hard',
    difficulty: 'Very Hard',
    length: 4800,
    finishX: 4600,
    theme: themeLevel5,
    getTerrainHeight: getTerrainL5,
    coins: generateCoins(getTerrainL5, 300, 4500, 135, [
      { x: 1050, heightAbove: 125 },
      { x: 2150, heightAbove: 130 },
      { x: 3300, heightAbove: 130 },
      { x: 4100, heightAbove: 120 },
    ]),
    description: 'Rollercoaster alpine summits. Watch out for steep backwards rollbacks!',
  },
  {
    id: 6,
    name: 'Volcano Badlands',
    subtitle: 'Level 6 – Extreme',
    difficulty: 'Extreme',
    length: 5400,
    finishX: 5200,
    theme: themeLevel6,
    getTerrainHeight: getTerrainL6,
    coins: generateCoins(getTerrainL6, 300, 5100, 140, [
      { x: 1150, heightAbove: 135 },
      { x: 2350, heightAbove: 140 },
      { x: 3550, heightAbove: 145 },
      { x: 4650, heightAbove: 135 },
    ]),
    description: 'The ultimate test of precision driving across deep volcanic craters and jagged peaks.',
  },
];
