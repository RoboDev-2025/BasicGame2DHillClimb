/**
 * Stage 2: Keyboard Movement, Acceleration, Velocity & Friction
 * 
 * In this stage, we bring the car to life with physics-based movement:
 * 1. Keyboard Event Listeners (Input tracking)
 * 2. Acceleration (pressing gas increases velocity)
 * 3. Velocity (speed in a direction that changes position each frame)
 * 4. Friction (drag that smoothly coasts the car to a stop)
 * 5. Wheel Rotation (spokes that spin proportionally to velocity)
 */

// ==========================================
// 1. DATA STRUCTURES & INTERFACES
// ==========================================

export interface CarState {
  // Spatial coordinates
  x: number;             // Horizontal center position (in pixels)
  y: number;             // Vertical ground-contact position (in pixels)
  
  // Movement Physics (Stage 2 additions)
  vx: number;            // Horizontal velocity (pixels per frame)
  acceleration: number;  // How quickly forward speed builds up
  braking: number;       // How quickly reverse/braking builds up
  maxSpeed: number;      // Maximum forward velocity limit
  maxReverseSpeed: number; // Maximum reverse velocity limit
  friction: number;      // Ground drag coefficient (0.97 = 3% speed loss per frame)
  wheelAngle: number;    // Current wheel rotation in radians (for rolling effect)

  // Dimensions & Visuals
  chassisWidth: number;
  chassisHeight: number;
  cabinWidth: number;
  cabinHeight: number;
  wheelRadius: number;
  wheelOffset: number;
  bodyColor: string;
  cabinColor: string;
  wheelColor: string;
  windowOpenProgress?: number; // 0.0 (fully closed) to 1.0 (fully rolled down open)
}

export interface InputState {
  right: boolean; // Accelerate forward (ArrowRight, KeyD)
  left: boolean;  // Brake / Reverse (ArrowLeft, KeyA)
}

export interface DebugSettings {
  showGrid: boolean;
  showCarAnchor: boolean;
  showTerrainPoints: boolean;
  showVelocityVector: boolean; // Draws an arrow showing current velocity direction & magnitude
}

// Initial state for Stage 2
export const defaultCarStage2: CarState = {
  x: 200,
  y: 330,
  vx: 0,
  acceleration: 0.18,
  braking: 0.12,
  maxSpeed: 6.5,
  maxReverseSpeed: 3.0,
  friction: 0.98,
  wheelAngle: 0,
  chassisWidth: 76,
  chassisHeight: 22,
  cabinWidth: 44,
  cabinHeight: 18,
  wheelRadius: 12,
  wheelOffset: 24,
  bodyColor: '#e63946',
  cabinColor: '#1d3557',
  wheelColor: '#2b2d42',
  windowOpenProgress: 0,
};

// ==========================================
// 2. MATHEMATICAL TERRAIN FUNCTION
// ==========================================

export function getTerrainHeight(x: number): number {
  const baseLevel = 330;
  const mainHill = Math.sin(x * 0.007) * 45;
  const detailHill = Math.cos(x * 0.015) * 15;
  return baseLevel + mainHill + detailHill;
}

// ==========================================
// 3. PHYSICS & MOVEMENT UPDATE
// ==========================================

/**
 * Updates the car's speed and position for one frame.
 * 
 * The Core Physics Sequence:
 * 1. Read input -> adjust velocity by acceleration.
 * 2. If no input -> apply friction to smoothly coast down.
 * 3. Clamp velocity within min/max speed limits.
 * 4. Move position: car.x += car.vx.
 * 5. Update ground contact: car.y = getTerrainHeight(car.x).
 * 6. Spin wheels: rotate proportional to distance traveled.
 */
export function updateCarPhysics(
  car: CarState,
  input: InputState,
  boundsWidth: number
): void {
  // 1. APPLY ACCELERATION BASED ON INPUT
  if (input.right) {
    // Gas pedal: push forward
    car.vx += car.acceleration;
  } else if (input.left) {
    // Brake/Reverse pedal: push backward
    car.vx -= car.braking;
  } else {
    // Coasting: ground friction gradually reduces velocity towards 0
    car.vx *= car.friction;

    // Stop microscopic floating-point jitter when almost still
    if (Math.abs(car.vx) < 0.005) {
      car.vx = 0;
    }
  }

  // 2. SPEED LIMITS (CLAMPING)
  if (car.vx > car.maxSpeed) {
    car.vx = car.maxSpeed;
  } else if (car.vx < -car.maxReverseSpeed) {
    car.vx = -car.maxReverseSpeed;
  }

  // 3. UPDATE HORIZONTAL POSITION
  car.x += car.vx;

  // Keep car within the visible screen boundaries for Stage 2
  const minX = car.chassisWidth / 2 + 10;
  const maxX = boundsWidth - car.chassisWidth / 2 - 10;

  if (car.x < minX) {
    car.x = minX;
    car.vx = 0; // Stop on bumper impact
  } else if (car.x > maxX) {
    car.x = maxX;
    car.vx = 0; // Stop on bumper impact
  }

  // 4. ALIGN TO TERRAIN SURFACE (Stage 2 ground alignment)
  car.y = getTerrainHeight(car.x);

  // 5. ROTATE WHEELS BASED ON DISTANCE TRAVELED
  // In physics, distance = arc length = radius * angle
  // Therefore: angle = distance / radius
  car.wheelAngle += car.vx / car.wheelRadius;
}

// ==========================================
// 4. RENDERING FUNCTIONS
// ==========================================

export function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#70a1ff');
  skyGradient.addColorStop(0.65, '#e0f2fe');
  skyGradient.addColorStop(1, '#fef08a');
  
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Distant clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  drawCloud(ctx, 120, 70, 45);
  drawCloud(ctx, 420, 95, 35);
  drawCloud(ctx, 700, 60, 50);
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.6, cy - radius * 0.2, radius * 0.7, 0, Math.PI * 2);
  ctx.arc(cx + radius * 1.2, cy, radius * 0.8, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.6, cy + radius * 0.2, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showPoints: boolean = false
): void {
  const step = 6;

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, getTerrainHeight(0));

  for (let x = 0; x <= width; x += step) {
    ctx.lineTo(x, getTerrainHeight(x));
  }

  ctx.lineTo(width, height);
  ctx.closePath();

  const groundGradient = ctx.createLinearGradient(0, 240, 0, height);
  groundGradient.addColorStop(0, '#4ade80');
  groundGradient.addColorStop(0.08, '#22c55e');
  groundGradient.addColorStop(0.2, '#78350f');
  groundGradient.addColorStop(1, '#451a03');

  ctx.fillStyle = groundGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, getTerrainHeight(0));
  for (let x = 0; x <= width; x += step) {
    ctx.lineTo(x, getTerrainHeight(x));
  }
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 4;
  ctx.stroke();

  if (showPoints) {
    ctx.fillStyle = '#f59e0b';
    for (let x = 0; x <= width; x += step * 4) {
      const y = getTerrainHeight(x);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draws the car and its animated spinning wheels.
 */
export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarState,
  debug: DebugSettings
): void {
  ctx.save();

  const leftWheelX = car.x - car.wheelOffset;
  const rightWheelX = car.x + car.wheelOffset;
  const wheelCenterY = car.y - car.wheelRadius;

  // 1. Lower Chassis
  const chassisBottomY = wheelCenterY - 2;
  const chassisTopY = chassisBottomY - car.chassisHeight;
  const chassisLeftX = car.x - car.chassisWidth / 2;

  ctx.fillStyle = car.bodyColor;
  ctx.fillRect(chassisLeftX, chassisTopY, car.chassisWidth, car.chassisHeight);

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(chassisLeftX, chassisTopY, car.chassisWidth, car.chassisHeight);

  // 2. Cabin Roof
  const cabinLeftX = car.x - car.cabinWidth / 2 - 4;
  const cabinTopY = chassisTopY - car.cabinHeight;

  ctx.fillStyle = car.cabinColor;
  ctx.beginPath();
  ctx.moveTo(cabinLeftX, chassisTopY);
  ctx.lineTo(cabinLeftX + 8, cabinTopY);
  ctx.lineTo(cabinLeftX + car.cabinWidth - 6, cabinTopY);
  ctx.lineTo(cabinLeftX + car.cabinWidth + 2, chassisTopY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Cabin Interior & Animated Rolling Window Glass
  const windowBottomY = chassisTopY - 2;
  const windowTopY = cabinTopY + 3;
  const windowHeight = windowBottomY - windowTopY;
  const openProgress = Math.max(0, Math.min(1, car.windowOpenProgress ?? 0));

  // 3a. Dark interior cavity behind glass
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(cabinLeftX + 9, windowBottomY);
  ctx.lineTo(cabinLeftX + 13, windowTopY);
  ctx.lineTo(cabinLeftX + car.cabinWidth - 10, windowTopY);
  ctx.lineTo(cabinLeftX + car.cabinWidth - 4, windowBottomY);
  ctx.closePath();
  ctx.fill();

  // 3b. Driver silhouette (head & cap visible in driver seat)
  ctx.fillStyle = '#fed7aa'; // Driver head
  ctx.beginPath();
  ctx.arc(cabinLeftX + 18, chassisTopY - 8, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155'; // Driver cap
  ctx.fillRect(cabinLeftX + 14, chassisTopY - 11, 8, 2.5);

  // 3c. Steering wheel rim
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cabinLeftX + 26, chassisTopY - 6, 3, 0, Math.PI * 2);
  ctx.stroke();

  // 3d. Rolling glass (slides down based on openProgress: 0 = closed, 1 = open)
  if (openProgress < 0.96) {
    const currentGlassTopY = windowTopY + windowHeight * openProgress;
    // Slanted pillar ratios
    const frontRatio = 1 - openProgress;
    const glassTopLeftX = (cabinLeftX + 9) + 4 * frontRatio;
    const glassTopRightX = (cabinLeftX + car.cabinWidth - 4) - 6 * frontRatio;

    ctx.fillStyle = 'rgba(186, 230, 253, 0.72)'; // Light sky blue glass
    ctx.beginPath();
    ctx.moveTo(cabinLeftX + 9, windowBottomY);
    ctx.lineTo(glassTopLeftX, currentGlassTopY);
    ctx.lineTo(glassTopRightX, currentGlassTopY);
    ctx.lineTo(cabinLeftX + car.cabinWidth - 4, windowBottomY);
    ctx.closePath();
    ctx.fill();

    // Subtle edge highlight at the top of the glass pane
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassTopLeftX, currentGlassTopY);
    ctx.lineTo(glassTopRightX, currentGlassTopY);
    ctx.stroke();
  }

  // 3e. Center window pillar
  ctx.strokeStyle = car.cabinColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cabinLeftX + car.cabinWidth / 2 - 1, windowBottomY);
  ctx.lineTo(cabinLeftX + car.cabinWidth / 2 - 1, windowTopY);
  ctx.stroke();

  // 4. Headlight (turns bright yellow when moving forward!)
  ctx.fillStyle = car.vx > 0.5 ? '#facc15' : '#fef08a';
  ctx.fillRect(car.x + car.chassisWidth / 2 - 4, chassisTopY + 4, 4, 7);

  // 5. Animated Wheels (drawn with rotation angle)
  drawWheel(ctx, leftWheelX, wheelCenterY, car.wheelRadius, car.wheelColor, car.wheelAngle);
  drawWheel(ctx, rightWheelX, wheelCenterY, car.wheelRadius, car.wheelColor, car.wheelAngle);

  // 6. DEBUG OVERLAYS: Anchor & Velocity Vector Arrow
  if (debug.showCarAnchor) {
    // Crosshair at (car.x, car.y)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(car.x - 10, car.y);
    ctx.lineTo(car.x + 10, car.y);
    ctx.moveTo(car.x, car.y - 10);
    ctx.lineTo(car.x, car.y + 10);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(car.x, car.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (debug.showVelocityVector && Math.abs(car.vx) > 0.05) {
    // Draw velocity vector arrow originating from car center
    const arrowStartX = car.x;
    const arrowStartY = chassisTopY + car.chassisHeight / 2;
    const arrowEndX = arrowStartX + car.vx * 15; // Scaled for visual clarity

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(arrowStartX, arrowStartY);
    ctx.lineTo(arrowEndX, arrowStartY);
    ctx.stroke();

    // Arrowhead
    const dir = car.vx > 0 ? 1 : -1;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowStartY);
    ctx.lineTo(arrowEndX - dir * 6, arrowStartY - 4);
    ctx.lineTo(arrowEndX - dir * 6, arrowStartY + 4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draws a wheel and rotates its spokes according to rotationAngle.
 */
function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  rotationAngle: number
): void {
  ctx.save();
  ctx.translate(x, y); // Move origin to center of wheel

  // Outer tire
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner metal rim
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rotate canvas for internal wheel spokes
  ctx.rotate(rotationAngle);

  // Cross spokes (visible spinning indicator)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  // Spoke 1 (horizontal)
  ctx.moveTo(-radius * 0.55, 0);
  ctx.lineTo(radius * 0.55, 0);
  // Spoke 2 (vertical)
  ctx.moveTo(0, -radius * 0.55);
  ctx.lineTo(0, radius * 0.55);
  ctx.stroke();

  // Center axle nut
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.restore();
}

export function drawCoordinateGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();
  const gridSize = 50;

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';

  for (let x = 50; x < width; x += gridSize) {
    ctx.fillText(`${x}px`, x + 2, 14);
  }

  for (let y = 50; y < height; y += gridSize) {
    ctx.fillText(`${y}px`, 4, y - 2);
  }

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('Origin (0,0)', 8, 26);

  ctx.restore();
}
