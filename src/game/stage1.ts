/**
 * Stage 1: Canvas, Car, and Simple Terrain
 * 
 * This file contains pure, beginner-friendly JavaScript game logic.
 * Every function is separated by single responsibility.
 */

// ==========================================
// 1. GAME STATE & VARIABLES
// ==========================================

export interface CarState {
  x: number;             // Horizontal center position (in pixels from left)
  y: number;             // Vertical ground-contact position (in pixels from top)
  chassisWidth: number;  // Width of main body
  chassisHeight: number; // Height of main body
  cabinWidth: number;    // Width of top roof/cabin
  cabinHeight: number;   // Height of top roof/cabin
  wheelRadius: number;   // Radius of the wheels
  wheelOffset: number;   // Distance of wheels from car center
  bodyColor: string;     // Color of the car chassis
  cabinColor: string;    // Color of the cabin
  wheelColor: string;    // Color of the wheels
}

export interface DebugSettings {
  showGrid: boolean;         // Show pixel coordinates grid
  showCarAnchor: boolean;    // Show (x, y) anchor crosshair
  showTerrainPoints: boolean;// Show mathematical sample points on the hill
}

// Initial car configuration
export const defaultCar: CarState = {
  x: 240,
  y: 310,
  chassisWidth: 76,
  chassisHeight: 22,
  cabinWidth: 44,
  cabinHeight: 18,
  wheelRadius: 11,
  wheelOffset: 24,
  bodyColor: '#e63946',   // Bold racing red
  cabinColor: '#1d3557',  // Deep blue tint cabin
  wheelColor: '#2b2d42',  // Charcoal black wheels
};

// ==========================================
// 2. MATHEMATICAL TERRAIN FUNCTION
// ==========================================

/**
 * Calculates the Y coordinate (height in pixels from top) of the terrain
 * at any given horizontal X position.
 * 
 * Concept: 
 * Y = 0 is the TOP of the screen.
 * Increasing Y moves DOWN.
 * So a lower Y value means a higher peak, and a higher Y value means a deeper valley!
 */
export function getTerrainHeight(x: number): number {
  // Baseline elevation: 330px from top
  const baseLevel = 330;
  
  // Big rolling hills: wavelength is long (0.007), amplitude is 45px
  const mainHill = Math.sin(x * 0.007) * 45;
  
  // Secondary undulation: wavelength is medium (0.015), amplitude is 15px
  const detailHill = Math.cos(x * 0.015) * 15;
  
  return baseLevel + mainHill + detailHill;
}

// ==========================================
// 3. RENDERING FUNCTIONS
// ==========================================

/**
 * Draws the sky and background gradient.
 */
export function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // Linear gradient from top (light sky blue) to horizon (soft warm mist)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#70a1ff');
  skyGradient.addColorStop(0.65, '#e0f2fe');
  skyGradient.addColorStop(1, '#fef08a');
  
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  // Distant subtle clouds (simple aesthetic canvas shapes)
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

/**
 * Draws the countryside terrain by tracing the height function across the canvas width.
 */
export function drawTerrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  showPoints: boolean = false
): void {
  // Step size: calculate a terrain point every 6 pixels for a smooth curve
  const step = 6;

  // 1. Draw the soil/grass filled polygon
  ctx.beginPath();
  // Start at bottom-left corner
  ctx.moveTo(0, height);
  // Line up to the first terrain surface point at x = 0
  ctx.lineTo(0, getTerrainHeight(0));

  // Loop across the screen horizontally from left to right
  for (let x = 0; x <= width; x += step) {
    const y = getTerrainHeight(x);
    ctx.lineTo(x, y);
  }

  // Connect to bottom-right corner and close back to bottom-left
  ctx.lineTo(width, height);
  ctx.closePath();

  // Create an earthy gradient (grass green into rich countryside soil)
  const groundGradient = ctx.createLinearGradient(0, 240, 0, height);
  groundGradient.addColorStop(0, '#4ade80'); // Bright fresh grass green
  groundGradient.addColorStop(0.08, '#22c55e'); // Deep grass green
  groundGradient.addColorStop(0.2, '#78350f'); // Soil brown
  groundGradient.addColorStop(1, '#451a03'); // Dark bedrock brown

  ctx.fillStyle = groundGradient;
  ctx.fill();

  // 2. Draw a crisp green grass outline along the surface
  ctx.beginPath();
  ctx.moveTo(0, getTerrainHeight(0));
  for (let x = 0; x <= width; x += step) {
    ctx.lineTo(x, getTerrainHeight(x));
  }
  ctx.strokeStyle = '#15803d'; // Dark grass stroke
  ctx.lineWidth = 4;
  ctx.stroke();

  // 3. Optional Debug: draw points where the math was calculated
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
 * Draws the simple 2D vehicle.
 * 
 * The car is positioned relative to its anchor point (car.x, car.y):
 * - car.x is the center of the car horizontally.
 * - car.y is the contact point where wheels meet the ground.
 */
export function drawCar(
  ctx: CanvasRenderingContext2D,
  car: CarState,
  debug: DebugSettings
): void {
  ctx.save(); // Save current canvas transform & style state

  const leftWheelX = car.x - car.wheelOffset;
  const rightWheelX = car.x + car.wheelOffset;
  const wheelCenterY = car.y - car.wheelRadius;

  // --- A. DRAW CAR BODY (CHASSIS & CABIN) ---
  
  // 1. Lower Chassis
  // Chassis bottom sits slightly above wheel bottom so chassis doesn't drag
  const chassisBottomY = wheelCenterY - 2;
  const chassisTopY = chassisBottomY - car.chassisHeight;
  const chassisLeftX = car.x - car.chassisWidth / 2;

  // Main chassis rectangle
  ctx.fillStyle = car.bodyColor;
  ctx.fillRect(chassisLeftX, chassisTopY, car.chassisWidth, car.chassisHeight);

  // Chassis border for clean definition
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(chassisLeftX, chassisTopY, car.chassisWidth, car.chassisHeight);

  // 2. Cabin / Roof
  const cabinLeftX = car.x - car.cabinWidth / 2 - 4;
  const cabinTopY = chassisTopY - car.cabinHeight;

  ctx.fillStyle = car.cabinColor;
  ctx.beginPath();
  // Cabin trapezoid shape
  ctx.moveTo(cabinLeftX, chassisTopY);
  ctx.lineTo(cabinLeftX + 8, cabinTopY);
  ctx.lineTo(cabinLeftX + car.cabinWidth - 6, cabinTopY);
  ctx.lineTo(cabinLeftX + car.cabinWidth + 2, chassisTopY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Cabin Windshield / Window
  ctx.fillStyle = '#bae6fd'; // Sky reflection glass
  ctx.beginPath();
  ctx.moveTo(cabinLeftX + 9, chassisTopY - 2);
  ctx.lineTo(cabinLeftX + 13, cabinTopY + 3);
  ctx.lineTo(cabinLeftX + car.cabinWidth - 10, cabinTopY + 3);
  ctx.lineTo(cabinLeftX + car.cabinWidth - 4, chassisTopY - 2);
  ctx.closePath();
  ctx.fill();

  // 4. Headlight on the front (right side)
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(car.x + car.chassisWidth / 2 - 4, chassisTopY + 4, 4, 7);

  // --- B. DRAW WHEELS ---
  // Rear wheel
  drawWheel(ctx, leftWheelX, wheelCenterY, car.wheelRadius, car.wheelColor);
  // Front wheel
  drawWheel(ctx, rightWheelX, wheelCenterY, car.wheelRadius, car.wheelColor);

  // --- C. DEBUG VISUALIZATIONS ---
  if (debug.showCarAnchor) {
    // Draw anchor crosshair at (car.x, car.y)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(car.x - 12, car.y);
    ctx.lineTo(car.x + 12, car.y);
    ctx.moveTo(car.x, car.y - 12);
    ctx.lineTo(car.x, car.y + 12);
    ctx.stroke();

    // Small anchor dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(car.x, car.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Coordinate text tag
    ctx.font = '11px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(`(${Math.round(car.x)}, ${Math.round(car.y)})`, car.x - 28, car.y + 18);
  }

  ctx.restore(); // Restore saved canvas state
}

/**
 * Draws a single wheel with tire, rim, and axle hub.
 */
function drawWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
): void {
  // Outer rubber tire
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner metal rim
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center axle nut
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
}

/**
 * Draws a visual coordinate grid and axes to help beginners understand the canvas coordinate space.
 */
export function drawCoordinateGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();
  const gridSize = 50;

  // Faint grid lines
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

  // Coordinate numbers along the top and left
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';

  for (let x = 50; x < width; x += gridSize) {
    ctx.fillText(`${x}px`, x + 2, 14);
  }

  for (let y = 50; y < height; y += gridSize) {
    ctx.fillText(`${y}px`, 4, y - 2);
  }

  // Origin indicator (0,0) at top-left
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText('Origin (0,0)', 8, 26);

  ctx.restore();
}
