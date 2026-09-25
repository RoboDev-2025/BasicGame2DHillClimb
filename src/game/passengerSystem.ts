/**
 * Passenger & Mission System - Step 1: Passenger Data & State Machine
 * 
 * This module defines the data structures and state models for passengers
 * and missions, designed to cleanly integrate with our 2D physics car game.
 */

// ==========================================
// 1. PASSENGER STATE MACHINE
// ==========================================

/**
 * A Finite State Machine (FSM) defines the exact life-cycle of a passenger.
 * At any single frame, a passenger can only ever be in ONE of these states.
 */
export type PassengerState = 
  | 'WAITING'          // 1. Standing by the roadside, waiting for pickup
  | 'PICKED_UP'        // 2. Pickup triggered, boarding animation/transition
  | 'IN_CAR'           // 3. Riding inside the vehicle with the player
  | 'DROPPED_OFF'      // 4. Exited vehicle at the destination
  | 'MISSION_COMPLETE';// 5. Reward claimed, ready for next mission

// ==========================================
// 2. PASSENGER DATA STRUCTURE
// ==========================================

export interface PassengerReward {
  coins: number; // In-game currency reward
  xp: number;    // Experience points for leveling up
}

export interface Passenger {
  id: string;                // Unique identifier (e.g. 'pass_01')
  name: string;              // Friendly display name (e.g. 'Farmer Joe')
  avatarColor: string;       // Color for passenger clothing/hair
  
  // Spatial Locations
  pickupX: number;           // Horizontal world position where passenger waits (px)
  pickupY: number;           // Ground height calculated from terrain at pickupX (px)
  pickupLocationName: string;// Friendly pickup point name (e.g. 'Meadow Trail')
  
  destinationX: number;      // Target drop-off world position (px)
  destinationY: number;      // Ground height calculated from terrain at destinationX (px)
  destinationName: string;   // Friendly destination name (e.g. 'Windmill Village')
  
  // Mission Progress
  state: PassengerState;     // Current FSM stage
  reward: PassengerReward;   // Reward for successful delivery
  
  // Dialogue & Immersion
  greetingText: string;      // Dialogue when player approaches
  deliveredText: string;     // Dialogue when dropped off safely
}

// ==========================================
// 3. FACTORY FUNCTION: CREATING A PASSENGER
// ==========================================

/**
 * Factory function to instantiate a new passenger with clean, predictable defaults.
 * Uses a height calculation callback so the passenger automatically snaps to the hill!
 */
export function createPassenger(
  id: string,
  name: string,
  pickupX: number,
  destinationX: number,
  destinationName: string,
  reward: PassengerReward,
  getTerrainHeightFn: (x: number) => number,
  options?: Partial<Passenger>
): Passenger {
  return {
    id,
    name,
    avatarColor: options?.avatarColor || '#38bdf8', // Default sky-blue shirt
    pickupX,
    pickupY: getTerrainHeightFn(pickupX),
    pickupLocationName: options?.pickupLocationName || 'Countryside Road',
    destinationX,
    destinationY: getTerrainHeightFn(destinationX),
    destinationName,
    state: 'WAITING',
    reward,
    greetingText: options?.greetingText || `Need a ride to ${destinationName}!`,
    deliveredText: options?.deliveredText || `Thank you! Here is your fare.`,
  };
}

// ==========================================
// 4. ACTIVE MISSION CONTAINER
// ==========================================

export interface MissionSystemState {
  activePassenger: Passenger | null; // The passenger currently active in the game
  playerCoins: number;               // Total coins earned
  playerXP: number;                  // Total XP earned
  completedMissionsCount: number;    // Counter of completed deliveries
}

// Initial mission state for our game
export const initialMissionState: MissionSystemState = {
  activePassenger: null,
  playerCoins: 0,
  playerXP: 0,
  completedMissionsCount: 0,
};

// ==========================================
// 5. HELPER CALCULATIONS (Distance & Direction)
// ==========================================

/**
 * Calculates straight horizontal distance (in pixels) between car and target.
 */
export function calculateDistanceX(carX: number, targetX: number): number {
  return Math.abs(carX - targetX);
}

/**
 * Converts screen pixels to simulated meters for the Mission UI (e.g. 1 pixel = 2 meters).
 */
export function pixelsToMeters(pixels: number): number {
  return Math.round(pixels * 2);
}

/**
 * Determines whether the player needs to travel East (right) or West (left).
 */
export function calculateNavigationDirection(
  carX: number,
  targetX: number
): 'EAST' | 'WEST' | 'ARRIVED' {
  const deltaX = targetX - carX;
  if (Math.abs(deltaX) <= 15) {
    return 'ARRIVED';
  }
  return deltaX > 0 ? 'EAST' : 'WEST';
}

// ==========================================
// 6. STEP 2: PASSENGER RENDERING
// ==========================================

/**
 * Step 2: Passenger Roadside Rendering
 * 
 * Draws the passenger character on the canvas at (pickupX, pickupY) or destination.
 * - Anchored firmly to the terrain slope at the character's feet
 * - Animated waving arm to catch the driver's attention
 * - Floating name badge & status indicator
 * - Soft ground contact shadow and pulsating detection zone
 */
export function drawPassenger(
  ctx: CanvasRenderingContext2D,
  passenger: Passenger,
  currentTimeMs: number,
  options?: { showZoneRadius?: boolean }
): void {
  // If passenger has boarded the vehicle, hide them from the roadside!
  if (passenger.state === 'IN_CAR') {
    return;
  }

  // Determine ground location based on state
  const isAtDestination = passenger.state === 'DROPPED_OFF' || passenger.state === 'MISSION_COMPLETE';
  const posX = isAtDestination ? passenger.destinationX : passenger.pickupX;
  const groundY = isAtDestination ? passenger.destinationY : passenger.pickupY;

  ctx.save();
  ctx.translate(posX, groundY);

  // 1. Detection Zone Ground Ring (pulsates gently)
  if (options?.showZoneRadius ?? true) {
    const pulse = Math.sin(currentTimeMs * 0.005) * 3;
    const ringColor = isAtDestination ? 'rgba(239, 68, 68, 0.20)' : 'rgba(34, 197, 94, 0.20)';
    const strokeColor = isAtDestination ? 'rgba(239, 68, 68, 0.65)' : 'rgba(34, 197, 94, 0.65)';
    
    ctx.beginPath();
    ctx.ellipse(0, 0, 36 + pulse, 9 + pulse * 0.25, 0, 0, Math.PI * 2);
    ctx.fillStyle = ringColor;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Contact Shadow under feet
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();

  // 3. Legs & Shoes
  ctx.fillStyle = '#1e293b'; // Navy pants
  ctx.fillRect(-5, -14, 4, 14); // Left leg
  ctx.fillRect(1, -14, 4, 14);  // Right leg

  ctx.fillStyle = '#0f172a';    // Dark shoes
  ctx.fillRect(-6, -2, 5, 2);
  ctx.fillRect(1, -2, 5, 2);

  // 4. Torso (Shirt matching passenger avatarColor)
  ctx.fillStyle = passenger.avatarColor;
  ctx.beginPath();
  ctx.roundRect(-6, -26, 12, 12, 2);
  ctx.fill();

  // 5. Left Arm (Holding a luggage bag)
  ctx.fillStyle = passenger.avatarColor;
  ctx.fillRect(-8, -25, 3, 9);
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(-8, -16, 3, 3); // Hand
  ctx.fillStyle = '#854d0e';   // Leather briefcase
  ctx.fillRect(-12, -15, 5, 7);

  // 6. Right Arm (Animated Waving to hail the car!)
  const waveAngle = Math.sin(currentTimeMs * 0.007) * 0.45;
  ctx.save();
  ctx.translate(6, -24); // Shoulder joint
  ctx.rotate(-0.8 + waveAngle);
  ctx.fillStyle = passenger.avatarColor;
  ctx.fillRect(0, -2, 9, 3); // Upper arm
  ctx.fillStyle = '#fed7aa'; // Waving hand
  ctx.beginPath();
  ctx.arc(10, -0.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Head
  ctx.beginPath();
  ctx.arc(0, -31, 5.5, 0, Math.PI * 2);
  ctx.fillStyle = '#fed7aa';
  ctx.fill();

  // Straw Hat / Cap
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(-8, -35, 16, 2.5); // Brim
  ctx.beginPath();
  ctx.roundRect(-5, -40, 10, 6, 2); // Crown
  ctx.fill();

  // Eyes & Smile
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-2, -32, 1.5, 1.5);
  ctx.fillRect(2, -32, 1.5, 1.5);

  // 8. Floating Name Badge with subtle bobbing
  const bobbing = Math.sin(currentTimeMs * 0.004) * 3;
  const badgeY = -48 + bobbing;
  const badgeText = isAtDestination ? `✓ ${passenger.name}` : `🚶 ${passenger.name}`;

  ctx.font = 'bold 9px monospace, sans-serif';
  const textWidth = ctx.measureText(badgeText).width;
  const pillW = textWidth + 14;
  const pillH = 14;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = isAtDestination ? '#ef4444' : '#22c55e';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(-pillW / 2, badgeY - pillH / 2, pillW, pillH, 7);
  ctx.fill();
  ctx.stroke();

  // Little downward arrow
  ctx.beginPath();
  ctx.moveTo(-3, badgeY + pillH / 2);
  ctx.lineTo(0, badgeY + pillH / 2 + 3);
  ctx.lineTo(3, badgeY + pillH / 2);
  ctx.fillStyle = isAtDestination ? '#ef4444' : '#22c55e';
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 0, badgeY);

  ctx.restore();
}

/**
 * Draws the passenger looking out the window when riding inside the car.
 */
export function drawPassengerInCar(
  ctx: CanvasRenderingContext2D,
  carX: number,
  carY: number,
  passenger: Passenger
): void {
  if (passenger.state !== 'IN_CAR') return;

  ctx.save();
  // Seated at the passenger window
  const headX = carX + 3;
  const headY = carY - 21;

  // Head
  ctx.beginPath();
  ctx.arc(headX, headY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#fed7aa';
  ctx.fill();

  // Hat
  ctx.fillStyle = '#ca8a04';
  ctx.fillRect(headX - 5, headY - 4, 10, 2);
  ctx.fillRect(headX - 3, headY - 7, 6, 3);

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(headX + 1, headY - 1, 1.2, 1.2);

  // Shirt torso visible through window
  ctx.fillStyle = passenger.avatarColor;
  ctx.fillRect(headX - 4, headY + 4, 8, 4);

  ctx.restore();
}

// ==========================================
// 7. STEP 3: PICKUP DETECTION & STOP CONDITIONS
// ==========================================

export interface PickupDetectionConfig {
  detectionRadius: number;    // Maximum horizontal distance in px to detect (default: 55px)
  stopSpeedThreshold: number; // Velocity threshold in px/frame below which car is "stopped" (default: 0.20 px/f)
}

export const defaultPickupConfig: PickupDetectionConfig = {
  detectionRadius: 55,
  stopSpeedThreshold: 0.20,
};

export interface PickupDetectionResult {
  distanceX: number;           // Absolute distance to passenger
  inDetectionZone: boolean;    // Is car within detectionRadius?
  isStopped: boolean;          // Is car speed <= stopSpeedThreshold?
  canPickup: boolean;          // inDetectionZone && isStopped && state === 'WAITING'
  statusStage: 'FAR' | 'APPROACHING' | 'IN_ZONE_MOVING' | 'READY_TO_PICKUP';
  promptMessage: string | null;// High-level prompt text
}

/**
 * Step 3: Pure Detection Function
 * Calculates proximity and velocity stop conditions every frame.
 */
export function checkPickupDetection(
  carX: number,
  carVx: number,
  passenger: Passenger | null,
  config: PickupDetectionConfig = defaultPickupConfig
): PickupDetectionResult {
  if (!passenger || passenger.state !== 'WAITING') {
    return {
      distanceX: Infinity,
      inDetectionZone: false,
      isStopped: Math.abs(carVx) <= config.stopSpeedThreshold,
      canPickup: false,
      statusStage: 'FAR',
      promptMessage: null,
    };
  }

  const distanceX = Math.abs(carX - passenger.pickupX);
  const isStopped = Math.abs(carVx) <= config.stopSpeedThreshold;
  const inDetectionZone = distanceX <= config.detectionRadius;

  let statusStage: 'FAR' | 'APPROACHING' | 'IN_ZONE_MOVING' | 'READY_TO_PICKUP' = 'FAR';
  let promptMessage: string | null = null;

  if (inDetectionZone) {
    if (isStopped) {
      statusStage = 'READY_TO_PICKUP';
      promptMessage = 'Press [ E ] to Pick Up';
    } else {
      statusStage = 'IN_ZONE_MOVING';
      promptMessage = '⚠️ STOP THE CAR';
    }
  } else if (distanceX <= config.detectionRadius * 2.2) {
    statusStage = 'APPROACHING';
    promptMessage = '🚶 Passenger nearby';
  }

  return {
    distanceX,
    inDetectionZone,
    isStopped,
    canPickup: inDetectionZone && isStopped,
    statusStage,
    promptMessage,
  };
}

/**
 * Step 3: HUD & Canvas Interaction Prompts
 * - Floating speech bubble above passenger
 * - Animated [ E ] Pick Up key prompt badge above the car
 * - Speedometer stop warning when moving too fast
 */
export function drawPickupInteractionHUD(
  ctx: CanvasRenderingContext2D,
  car: { x: number; y: number; vx: number },
  passenger: Passenger,
  detection: PickupDetectionResult,
  currentTimeMs: number
): void {
  if (passenger.state !== 'WAITING') return;

  // 1. Speech Bubble Above Passenger (when car is approaching or in zone)
  if (detection.statusStage !== 'FAR') {
    const bubbleX = passenger.pickupX;
    const bubbleY = passenger.pickupY - 60;
    const greeting = passenger.greetingText;

    ctx.save();
    ctx.font = '500 10px sans-serif';
    const textMetrics = ctx.measureText(greeting);
    const boxW = Math.max(120, textMetrics.width + 16);
    const boxH = 20;

    // Speech bubble background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(bubbleX - boxW / 2, bubbleY - boxH / 2, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    // Bubble pointer down to passenger head
    ctx.beginPath();
    ctx.moveTo(bubbleX - 4, bubbleY + boxH / 2);
    ctx.lineTo(bubbleX, bubbleY + boxH / 2 + 5);
    ctx.lineTo(bubbleX + 4, bubbleY + boxH / 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Bubble text
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(greeting, bubbleX, bubbleY);
    ctx.restore();
  }

  // 2. Interaction Badge Above Car
  if (detection.statusStage === 'READY_TO_PICKUP') {
    // Car is in zone AND stopped: Show pulsating [ E ] Pick Up prompt
    const pulse = Math.sin(currentTimeMs * 0.008) * 2;
    const promptX = car.x;
    const promptY = car.y - 52 + pulse;

    ctx.save();
    // Glowing backing
    ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
    ctx.shadowBlur = 12;

    // Badge container
    const badgeW = 144;
    const badgeH = 24;
    ctx.fillStyle = 'rgba(6, 78, 59, 0.95)'; // Deep emerald
    ctx.strokeStyle = '#34d399'; // Bright mint green
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(promptX - badgeW / 2, promptY - badgeH / 2, badgeW, badgeH, 12);
    ctx.fill();
    ctx.stroke();

    // Key icon pill [ E ]
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(promptX - badgeW / 2 + 6, promptY - 8, 18, 16, 4);
    ctx.fill();

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E', promptX - badgeW / 2 + 15, promptY);

    // Text "Pick Up Passenger"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Pick Up Passenger', promptX - badgeW / 2 + 30, promptY);

    // Pointer down towards open car window
    ctx.beginPath();
    ctx.moveTo(promptX - 5, promptY + badgeH / 2);
    ctx.lineTo(promptX, promptY + badgeH / 2 + 5);
    ctx.lineTo(promptX + 5, promptY + badgeH / 2);
    ctx.fillStyle = '#34d399';
    ctx.fill();

    ctx.restore();
  } else if (detection.statusStage === 'IN_ZONE_MOVING') {
    // In zone but moving too fast: Show warning badge
    const promptX = car.x;
    const promptY = car.y - 50;
    const speed = Math.abs(car.vx).toFixed(1);

    ctx.save();
    const badgeW = 160;
    const badgeH = 22;

    ctx.fillStyle = 'rgba(120, 53, 15, 0.92)'; // Amber brown
    ctx.strokeStyle = '#fbbf24'; // Amber border
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(promptX - badgeW / 2, promptY - badgeH / 2, badgeW, badgeH, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚠️ STOP CAR TO PICK UP (${speed} px/f)`, promptX, promptY);
    ctx.restore();
  }
}
