export interface LevelTheme {
  skyGradient: [string, string, string];
  grassColor: string;
  dirtColors: [string, string, string];
  strokeColor: string;
  mountainColor: string;
  name: string;
}

export interface Coin {
  id: number;
  x: number;
  yOffset: number; // Offset above the terrain height at x
  collected: boolean;
  value: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  difficulty: 'Easy' | 'Beginner+' | 'Medium' | 'Hard' | 'Very Hard' | 'Extreme';
  length: number; // Total track length in pixels (e.g. 2400 to 5500)
  finishX: number;
  theme: LevelTheme;
  coins: Coin[];
  // Mathematical terrain generator for deterministic static road
  getTerrainHeight: (x: number) => number;
  description: string;
}

export type VehicleId = 'car' | 'scooter' | 'tractor' | 'jeep' | 'van' | 'bike';

export interface WheelConfig {
  offsetX: number;
  offsetY: number;
  radius: number;
  isDrive?: boolean;
}

export interface DriverConfig {
  seatX: number;
  seatY: number;
  steeringX: number;
  steeringY: number;
  posture: 'car' | 'tractor' | 'jeep' | 'van' | 'bike' | 'scooter';
  headgear: 'cap' | 'straw_hat' | 'helmet_biker' | 'helmet_retro' | 'bandana' | 'beanie';
  suitColor: string;
  helmetColor: string;
  skinTone?: string;
}

export interface VehicleVisualConfig {
  chassisWidth: number;
  chassisHeight: number;
  bodyColor: string;
  secondaryColor: string;
  accentColor: string;
  cabinColor?: string;
  wheelColor: string;
  wheelRimColor: string;
  hasRollCage?: boolean;
  windowOpenProgress?: number;
}

export interface VehicleUnlockRequirement {
  type: 'free' | 'level' | 'coins';
  value: number;
  description: string;
}

export interface VehicleConfig {
  id: VehicleId;
  name: string;
  tagline: string;
  icon: string;
  description: string;
  mass: number;
  enginePower: number;
  maxSpeed: number;
  maxReverse: number;
  brakePower: number;
  airControl: number;
  stability: number;
  hillClimb: number;
  suspensionStiffness: number;
  rollingResistance: number;
  wheels: WheelConfig[];
  driver: DriverConfig;
  visual: VehicleVisualConfig;
  stats: {
    speed: number;
    power: number;
    stability: number;
    control: number;
  };
  unlockRequirement: VehicleUnlockRequirement;
}

export interface CarPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;           // Rotation angle in radians
  angularVelocity: number; // Rotation speed
  wheelAngle: number;      // Wheel rolling animation angle
  isGrounded: boolean;     // Whether wheels touch the terrain
  airTime: number;         // Continuous seconds in air
  crashed: boolean;        // Overturned or fallen
  crashTimer: number;      // Time spent overturned
  maxDistanceReached: number;
  
  // Active Vehicle & Dynamic Driver Animation States
  vehicleId: VehicleId;
  driverLean: number;      // Dynamic backward/forward body lean radians
  driverBounce: number;    // Vertical bounce on suspension landings
  
  // Tuning parameters
  chassisWidth: number;
  chassisHeight: number;
  cabinWidth: number;
  cabinHeight: number;
  wheelRadius: number;
  wheelOffset: number;     // Distance from center to front/rear wheel
  suspensionRest: number;  // Rest height above wheel ground contact
  
  // Visuals
  bodyColor: string;
  cabinColor: string;
  wheelColor: string;
  windowOpenProgress: number;
}

export interface InputControls {
  gas: boolean;       // Accelerate forward (W / Up / Mobile Accel)
  brake: boolean;     // Brake / reverse (S / Down / Mobile Brake)
  tiltLeft: boolean;  // Rotate nose up / counter-clockwise (A / Left / Virtual Steer Left)
  tiltRight: boolean; // Rotate nose down / clockwise (D / Right / Virtual Steer Right)
  handbrake: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'smoke' | 'dirt' | 'sparkle' | 'confetti';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export type GameScreen = 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'LEVEL_SELECT' | 'GARAGE' | 'VEHICLE_UNLOCKED';

export interface LevelProgress {
  unlockedLevels: number[]; // e.g. [1, 2, 3]
  highScores: Record<number, number>;
  bestTimes: Record<number, number>;
  totalCoins: number;
  unlockedVehicles: VehicleId[];
  selectedVehicleId: VehicleId;
  justUnlockedVehicleId?: VehicleId | null;
}
