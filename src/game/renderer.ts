import { CarPhysicsState, Coin, FloatingText, LevelConfig, Particle, VehicleConfig, WheelConfig } from './types';
import { VEHICLES } from './vehicles';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  level: LevelConfig,
  car: CarPhysicsState,
  coins: Coin[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  cameraX: number,
  cameraY: number,
  gameTimeMs: number
): void {
  ctx.save();

  // 1. SKY BACKGROUND (Static to viewport)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, level.theme.skyGradient[0]);
  skyGrad.addColorStop(0.6, level.theme.skyGradient[1]);
  skyGrad.addColorStop(1, level.theme.skyGradient[2]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. PARALLAX DISTANT MOUNTAINS
  ctx.save();
  ctx.fillStyle = level.theme.mountainColor;
  ctx.beginPath();
  ctx.moveTo(0, height);
  const mountainParallax = cameraX * 0.2;
  for (let sx = 0; sx <= width; sx += 40) {
    const wx = sx + mountainParallax;
    const mHeight = Math.sin(wx * 0.002) * 90 + Math.cos(wx * 0.004) * 45;
    ctx.lineTo(sx, height * 0.55 + mHeight);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. PARALLAX CLOUDS
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
  const cloudOffset = (gameTimeMs * 0.015 - cameraX * 0.1) % (width + 300);
  drawCloud(ctx, ((cloudOffset + 100) % (width + 300)) - 100, 60, 42);
  drawCloud(ctx, ((cloudOffset + 420) % (width + 300)) - 100, 95, 34);
  drawCloud(ctx, ((cloudOffset + 780) % (width + 300)) - 100, 50, 48);
  ctx.restore();

  // -------------------------------------------------------------
  // APPLY CAMERA TRANSLATION (World Space)
  // -------------------------------------------------------------
  ctx.save();
  ctx.translate(-cameraX, -cameraY);

  // 4. DRAW CONTINUOUS 2D TERRAIN
  drawTerrainWithCamera(ctx, level, cameraX, cameraY, width, height);

  // 5. DRAW FINISH LINE ARCH & CHECKERED BANNER
  drawFinishLine(ctx, level.finishX, level.getTerrainHeight(level.finishX), gameTimeMs);

  // 6. DRAW COINS
  drawCoins(ctx, coins, level.getTerrainHeight, gameTimeMs);

  // 7. DRAW PARTICLES
  drawParticles(ctx, particles);

  // 8. DRAW ACTIVE VEHICLE & DRIVER
  const vehicle = VEHICLES[car.vehicleId] || VEHICLES.car;
  drawRotatedVehicle(ctx, car, vehicle, gameTimeMs);

  // 9. DRAW FLOATING POPUP TEXTS
  drawFloatingTexts(ctx, floatingTexts);

  // Warning banner if overturned
  if (car.crashTimer > 0.3 && !car.crashed) {
    ctx.save();
    ctx.translate(car.x, car.y - 65);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-55, -16, 110, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ ROLLOVER!', 0, 0);
    ctx.restore();
  }

  ctx.restore(); // Restore camera translation

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.6, cy - radius * 0.2, radius * 0.7, 0, Math.PI * 2);
  ctx.arc(cx + radius * 1.2, cy, radius * 0.8, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.6, cy + radius * 0.2, radius * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawTerrainWithCamera(
  ctx: CanvasRenderingContext2D,
  level: LevelConfig,
  cameraX: number,
  cameraY: number,
  viewWidth: number,
  viewHeight: number
): void {
  const step = 8;
  const startX = Math.max(0, Math.floor((cameraX - 100) / step) * step);
  const endX = Math.min(level.length + 300, Math.ceil((cameraX + viewWidth + 100) / step) * step);
  const bottomY = cameraY + viewHeight + 350;

  // Underground fill
  ctx.beginPath();
  ctx.moveTo(startX, bottomY);
  ctx.lineTo(startX, level.getTerrainHeight(startX));

  for (let x = startX; x <= endX; x += step) {
    ctx.lineTo(x, level.getTerrainHeight(x));
  }

  ctx.lineTo(endX, bottomY);
  ctx.closePath();

  const dirtGrad = ctx.createLinearGradient(0, cameraY + 150, 0, bottomY);
  dirtGrad.addColorStop(0, level.theme.dirtColors[0]);
  dirtGrad.addColorStop(0.35, level.theme.dirtColors[1]);
  dirtGrad.addColorStop(1, level.theme.dirtColors[2]);
  ctx.fillStyle = dirtGrad;
  ctx.fill();

  // Top grass / road surface ribbon
  ctx.beginPath();
  ctx.moveTo(startX, level.getTerrainHeight(startX));
  for (let x = startX; x <= endX; x += step) {
    ctx.lineTo(x, level.getTerrainHeight(x));
  }
  ctx.strokeStyle = level.theme.grassColor;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dark outline directly under grass
  ctx.beginPath();
  ctx.moveTo(startX, level.getTerrainHeight(startX) + 4);
  for (let x = startX; x <= endX; x += step) {
    ctx.lineTo(x, level.getTerrainHeight(x) + 4);
  }
  ctx.strokeStyle = level.theme.strokeColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function drawFinishLine(
  ctx: CanvasRenderingContext2D,
  finishX: number,
  groundY: number,
  gameTimeMs: number
): void {
  const poleHeight = 110;
  const topY = groundY - poleHeight;

  // Left & Right truss poles
  ctx.fillStyle = '#334155';
  ctx.fillRect(finishX - 12, topY, 6, poleHeight);
  ctx.fillRect(finishX + 10, topY, 6, poleHeight);

  // Overhead bridge truss
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(finishX - 16, topY - 14, 36, 14);

  // Checkered banner
  const bannerW = 32;
  const bannerH = 24;
  const bannerX = finishX - 14;
  const bannerY = topY + 4;

  const cols = 8;
  const rows = 3;
  const cellW = bannerW / cols;
  const cellH = bannerH / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isBlack = (r + c) % 2 === 0;
      ctx.fillStyle = isBlack ? '#09090b' : '#f8fafc';
      ctx.fillRect(bannerX + c * cellW, bannerY + r * cellH, cellW, cellH);
    }
  }

  // Waving flags on top of posts
  const wave = Math.sin(gameTimeMs * 0.008) * 4;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(finishX - 6, topY - 14);
  ctx.lineTo(finishX - 22 + wave, topY - 24);
  ctx.lineTo(finishX - 6, topY - 28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.moveTo(finishX + 16, topY - 14);
  ctx.lineTo(finishX + 32 + wave, topY - 24);
  ctx.lineTo(finishX + 16, topY - 28);
  ctx.closePath();
  ctx.fill();

  // "FINISH" text banner
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FINISH', finishX + 2, topY - 4);
}

function drawCoins(
  ctx: CanvasRenderingContext2D,
  coins: Coin[],
  getTerrainHeight: (x: number) => number,
  gameTimeMs: number
): void {
  ctx.save();
  const bob = Math.sin(gameTimeMs * 0.006) * 3;
  const spinPhase = (gameTimeMs * 0.004) % (Math.PI * 2);
  const spinScale = Math.abs(Math.cos(spinPhase));

  coins.forEach((coin) => {
    if (coin.collected) return;
    const baseTerrainY = getTerrainHeight(coin.x);
    const cy = baseTerrainY - coin.yOffset + bob;
    const radius = 10;
    const currentW = Math.max(2, radius * spinScale);

    ctx.save();
    ctx.translate(coin.x, cy);

    // Glowing outer halo
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 1.5);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.4)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer gold coin rim
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(0, 0, currentW, radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright gold face
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, 0, currentW * 0.78, radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star icon inside coin if wide enough
    if (currentW > 5) {
      ctx.fillStyle = '#a16207';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0.5);
    }

    ctx.restore();
  });

  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  ctx.save();
  for (const p of particles) {
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (p.type === 'smoke') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + (p.life / p.maxLife) * 1.2), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'dirt') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'sparkle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]): void {
  ctx.save();
  for (const t of texts) {
    const progress = t.life / t.maxLife;
    const alpha = Math.max(0, 1 - progress);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = t.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';

    const driftY = t.y - progress * 35;
    ctx.strokeText(t.text, t.x, driftY);
    ctx.fillText(t.text, t.x, driftY);
  }
  ctx.restore();
}

// =========================================================================
// VEHICLE & DRIVER RENDERING SYSTEM
// =========================================================================

function drawRotatedVehicle(
  ctx: CanvasRenderingContext2D,
  car: CarPhysicsState,
  vehicle: VehicleConfig,
  gameTimeMs: number
): void {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  // Draw Vehicle Body according to its specific design
  switch (vehicle.id) {
    case 'scooter':
      drawScooterBody(ctx, vehicle, car);
      break;
    case 'tractor':
      drawTractorBody(ctx, vehicle, car, gameTimeMs);
      break;
    case 'jeep':
      drawJeepBody(ctx, vehicle, car);
      break;
    case 'van':
      drawVanBody(ctx, vehicle, car);
      break;
    case 'bike':
      drawBikeBody(ctx, vehicle, car);
      break;
    case 'car':
    default:
      drawCarBody(ctx, vehicle, car);
      break;
  }

  // Draw Seated Animated Driver Character
  drawDriverCharacter(ctx, vehicle, car);

  // Draw Enclosed Cabin Glass Overlay (for Car and Van, after driver)
  if (vehicle.id === 'car') {
    drawCarWindowOverlay(ctx, vehicle, car);
  } else if (vehicle.id === 'van') {
    drawVanWindowOverlay(ctx, vehicle, car);
  }

  // Draw Wheels at their respective offsets and radii
  vehicle.wheels.forEach((w) => {
    drawVehicleWheel(ctx, w, car.wheelAngle, vehicle);
  });

  ctx.restore();
}

// =========================================================================
// DRIVER CHARACTER DRAWING & DYNAMIC ANATOMY
// =========================================================================

function drawDriverCharacter(
  ctx: CanvasRenderingContext2D,
  vehicle: VehicleConfig,
  car: CarPhysicsState
): void {
  const driver = vehicle.driver;
  const lean = car.driverLean || 0;
  const bounceY = car.driverBounce || 0;

  ctx.save();
  // Anchor driver at seat position with suspension bounce
  ctx.translate(driver.seatX, driver.seatY + bounceY);
  // Apply dynamic inertial lean (tilts backward on gas, forward on brake)
  ctx.rotate(lean);

  const skinColor = driver.skinTone || '#fed7aa';
  const suitColor = driver.suitColor;
  const headgearColor = driver.helmetColor;

  // 1. Legs & Feet
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  if (driver.posture === 'bike') {
    // Rider on footpegs leaning forward
    ctx.moveTo(-4, 6);
    ctx.lineTo(2, 10);
    ctx.lineTo(8, 12);
  } else if (driver.posture === 'scooter') {
    // Upright legs on floorboard
    ctx.moveTo(-2, 6);
    ctx.lineTo(8, 7);
    ctx.lineTo(10, 14);
  } else {
    // Seated car/tractor/jeep/van posture
    ctx.moveTo(-3, 6);
    ctx.lineTo(7, 8);
    ctx.lineTo(12, 14);
  }
  ctx.stroke();

  // Shoes
  ctx.fillStyle = '#0f172a';
  const footX = driver.posture === 'bike' ? 8 : driver.posture === 'scooter' ? 10 : 12;
  const footY = driver.posture === 'bike' ? 12 : 14;
  ctx.beginPath();
  ctx.ellipse(footX + 2, footY, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Torso / Jacket
  ctx.fillStyle = suitColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  if (driver.posture === 'bike') {
    // Forward-crouched racer torso
    ctx.moveTo(-6, 5);
    ctx.lineTo(5, 0);
    ctx.lineTo(6, -10);
    ctx.lineTo(-4, -8);
  } else {
    // Upright or casual seated torso
    ctx.moveTo(-6, 6);
    ctx.lineTo(4, 6);
    ctx.lineTo(4, -8);
    ctx.lineTo(-6, -8);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jacket collar / detail
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1, -8);
  ctx.lineTo(-1, 2);
  ctx.stroke();

  // 3. Arms & Hands Reaching Steering / Handlebars
  const steerRelX = driver.steeringX - driver.seatX;
  const steerRelY = driver.steeringY - (driver.seatY + bounceY);

  ctx.strokeStyle = suitColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(1, -5); // shoulder
  // Elbow joint midpoint
  const elbowX = (1 + steerRelX) / 2 + 1;
  const elbowY = (-5 + steerRelY) / 2 + 2;
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(steerRelX, steerRelY);
  ctx.stroke();

  // Hand / Glove
  ctx.fillStyle = driver.headgear === 'helmet_biker' ? '#18181b' : skinColor;
  ctx.beginPath();
  ctx.arc(steerRelX, steerRelY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Head & Face
  const headCenterX = 0;
  const headCenterY = -14;

  ctx.fillStyle = skinColor;
  ctx.beginPath();
  ctx.arc(headCenterX, headCenterY, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye & Eyebrow
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(headCenterX + 2.5, headCenterY - 0.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Smile / Focus
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(headCenterX + 2, headCenterY + 2, 1.8, 0, Math.PI * 0.8);
  ctx.stroke();

  // 5. Headgear / Hat / Helmet
  ctx.fillStyle = headgearColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  switch (driver.headgear) {
    case 'helmet_biker': {
      // Full-face aerodynamic racing helmet with glossy visor
      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY, 6.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Dark tinted visor
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.roundRect(headCenterX + 0.5, headCenterY - 2.5, 6, 4.5, 1.5);
      ctx.fill();

      // Visor reflection shine
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(headCenterX + 2, headCenterY - 1.5);
      ctx.lineTo(headCenterX + 5.5, headCenterY - 1.5);
      ctx.stroke();
      break;
    }

    case 'helmet_retro': {
      // Vintage bubble helmet with goggles
      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY - 1, 6.6, Math.PI * 0.8, Math.PI * 2.2);
      ctx.lineTo(headCenterX - 3, headCenterY + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Goggle strap & lens
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(headCenterX + 3, headCenterY - 0.5, 3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'straw_hat': {
      // Agricultural wide-brim farmer straw hat (Tractor)
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1;

      // Hat crown
      ctx.beginPath();
      ctx.roundRect(headCenterX - 4.5, headCenterY - 9, 9, 6, [3, 3, 0, 0]);
      ctx.fill();
      ctx.stroke();

      // Red band
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(headCenterX - 4.5, headCenterY - 4.5, 9, 1.8);

      // Wide brim
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(headCenterX, headCenterY - 3, 11, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'bandana': {
      // Rugged rolled bandana (Jeep)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(headCenterX - 4.5, headCenterY - 5.5, 9.5, 3.2);

      // Knotted tie hanging behind
      ctx.beginPath();
      ctx.moveTo(headCenterX - 4.5, headCenterY - 4);
      ctx.lineTo(headCenterX - 8, headCenterY - 1);
      ctx.lineTo(headCenterX - 4.5, headCenterY - 2.5);
      ctx.fill();
      break;
    }

    case 'beanie': {
      // Knit winter beanie (Van)
      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY - 2, 6, Math.PI, Math.PI * 2);
      ctx.lineTo(headCenterX + 5, headCenterY - 1);
      ctx.lineTo(headCenterX - 5, headCenterY - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Beanie folded cuff
      ctx.fillStyle = '#9f1239';
      ctx.fillRect(headCenterX - 5.5, headCenterY - 3.5, 11, 2.8);
      break;
    }

    case 'cap':
    default: {
      // Classic racing cap with brim
      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY - 1, 5.8, Math.PI, Math.PI * 2);
      ctx.lineTo(headCenterX + 4.5, headCenterY - 2);
      ctx.lineTo(headCenterX - 4.5, headCenterY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cap visor / brim
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(headCenterX + 1, headCenterY - 4, 7.5, 2.2);
      break;
    }
  }

  ctx.restore();
}

// =========================================================================
// SPECIFIC VEHICLE CHASSIS ARTWORK
// =========================================================================

// 1. CAR (Hill Climber)
function drawCarBody(ctx: CanvasRenderingContext2D, v: VehicleConfig, car: CarPhysicsState): void {
  const cW = v.visual.chassisWidth;
  const cH = v.visual.chassisHeight;
  const leftX = -cW / 2;
  const bottomY = 4;
  const topY = bottomY - cH;

  // Main chassis base
  ctx.fillStyle = v.visual.bodyColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(leftX, topY, cW, cH, [4, 6, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // White racing side stripe
  ctx.fillStyle = v.visual.accentColor;
  ctx.fillRect(leftX + 2, topY + cH * 0.45, cW - 4, 3.5);

  // Cabin roof
  const cabinW = cW * 0.58;
  const cabinH = cH * 0.75;
  const cabinLeftX = -cabinW / 2 - 4;
  const cabinTopY = topY - cabinH;

  ctx.fillStyle = v.visual.cabinColor || '#1d3557';
  ctx.beginPath();
  ctx.moveTo(cabinLeftX, topY);
  ctx.lineTo(cabinLeftX + 8, cabinTopY);
  ctx.lineTo(cabinLeftX + cabinW - 6, cabinTopY);
  ctx.lineTo(cabinLeftX + cabinW + 2, topY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Interior dark cabin cavity
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(cabinLeftX + 9, topY - 2);
  ctx.lineTo(cabinLeftX + 13, cabinTopY + 3);
  ctx.lineTo(cabinLeftX + cabinW - 10, cabinTopY + 3);
  ctx.lineTo(cabinLeftX + cabinW - 4, topY - 2);
  ctx.closePath();
  ctx.fill();

  // Steering wheel
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(v.driver.steeringX, v.driver.steeringY, 4, 0, Math.PI * 2);
  ctx.stroke();

  // Headlight
  ctx.fillStyle = car.vx > 0.5 ? '#facc15' : '#fef08a';
  ctx.fillRect(cW / 2 - 4, topY + 4, 4, 8);
}

function drawCarWindowOverlay(
  ctx: CanvasRenderingContext2D,
  v: VehicleConfig,
  car: CarPhysicsState
): void {
  const cW = v.visual.chassisWidth;
  const cH = v.visual.chassisHeight;
  const topY = 4 - cH;
  const cabinW = cW * 0.58;
  const cabinH = cH * 0.75;
  const cabinLeftX = -cabinW / 2 - 4;
  const cabinTopY = topY - cabinH;

  const windowBottomY = topY - 2;
  const windowTopY = cabinTopY + 3;
  const windowHeight = windowBottomY - windowTopY;
  const openProgress = Math.max(0, Math.min(1, car.windowOpenProgress ?? 0));

  if (openProgress < 0.96) {
    const currentGlassTopY = windowTopY + windowHeight * openProgress;
    const frontRatio = 1 - openProgress;
    const glassTopLeftX = cabinLeftX + 9 + 4 * frontRatio;
    const glassTopRightX = cabinLeftX + cabinW - 4 - 6 * frontRatio;

    ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cabinLeftX + 9, windowBottomY);
    ctx.lineTo(glassTopLeftX, currentGlassTopY);
    ctx.lineTo(glassTopRightX, currentGlassTopY);
    ctx.lineTo(cabinLeftX + cabinW - 4, windowBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Window center pillar
  ctx.strokeStyle = v.visual.cabinColor || '#1d3557';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cabinLeftX + cabinW / 2 - 1, windowBottomY);
  ctx.lineTo(cabinLeftX + cabinW / 2 - 1, windowTopY);
  ctx.stroke();
}

// 2. SCOOTER (City Hopper)
function drawScooterBody(ctx: CanvasRenderingContext2D, v: VehicleConfig, car: CarPhysicsState): void {
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  // Rear engine cowl / fender
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.arc(-16, -1, 14, Math.PI * 0.7, Math.PI * 2.1);
  ctx.lineTo(-4, 4);
  ctx.lineTo(-24, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Seat
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-22, -12, 18, 5, [3, 2, 2, 3]);
  ctx.fill();
  ctx.stroke();

  // Low step-through floorboard
  ctx.fillStyle = '#334155';
  ctx.fillRect(-6, 3, 16, 4);
  ctx.strokeRect(-6, 3, 16, 4);

  // Front slanted apron / leg shield
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.moveTo(8, 5);
  ctx.lineTo(16, -15);
  ctx.lineTo(20, -14);
  ctx.lineTo(15, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Raised handlebars & retro headlamp
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(16, -15);
  ctx.lineTo(13, -19);
  ctx.stroke();

  // Handlebar grips
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(10, -21, 6, 3);

  // Round chrome headlight
  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(17, -17, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// 3. TRACTOR (Iron Plough)
function drawTractorBody(
  ctx: CanvasRenderingContext2D,
  v: VehicleConfig,
  car: CarPhysicsState,
  gameTimeMs: number
): void {
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  // Heavy engine hood (front section)
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.roundRect(-2, -16, 36, 18, [4, 6, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Yellow grille slats on front
  ctx.fillStyle = v.visual.secondaryColor;
  ctx.fillRect(28, -14, 5, 14);

  // Rear high arched mudguard
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.arc(-22, 2, 22, Math.PI * 0.9, Math.PI * 2.1);
  ctx.lineTo(-6, 2);
  ctx.lineTo(-38, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // High metal sprung tractor seat
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-16, -16, 11, 4, [2, 2, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Seat support bracket
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-11, -12);
  ctx.lineTo(-11, -3);
  ctx.stroke();

  // Steering column and large wheel
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(v.driver.steeringX, v.driver.steeringY);
  ctx.stroke();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(v.driver.steeringX, v.driver.steeringY, 5, 2.5, -0.3, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical exhaust stack pipe with animated smoke flapper
  ctx.fillStyle = '#334155';
  ctx.fillRect(16, -30, 3.5, 15);
  // Cap / flapper
  const flapAngle = car.vx > 0.5 ? -0.4 : -0.1;
  ctx.save();
  ctx.translate(19.5, -30);
  ctx.rotate(flapAngle);
  ctx.fillRect(0, -1.5, 5, 2);
  ctx.restore();

  ctx.restore();
}

// 4. JEEP (Dune Raider 4x4)
function drawJeepBody(ctx: CanvasRenderingContext2D, v: VehicleConfig, car: CarPhysicsState): void {
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  // Heavy rugged lower chassis
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.roundRect(-36, -14, 72, 16, [3, 5, 2, 2]);
  ctx.fill();
  ctx.stroke();

  // Off-road rock sliders / side trim
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-32, 2, 64, 4);

  // Vertical front grille
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, -12, 5, 11);
  ctx.fillStyle = '#e2e8f0';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(31, -11 + i * 4, 3, 2);
  }

  // Big round rally headlights
  ctx.fillStyle = car.vx > 0.5 ? '#facc15' : '#fef08a';
  ctx.beginPath();
  ctx.arc(33, -7, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tubular steel roll cage
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Windshield frame & A-pillar
  ctx.beginPath();
  ctx.moveTo(12, -14);
  ctx.lineTo(4, -28);
  ctx.lineTo(-24, -28); // roof bar
  ctx.lineTo(-28, -14); // B-pillar
  ctx.stroke();

  // Rear diagonal cage brace
  ctx.beginPath();
  ctx.moveTo(-24, -28);
  ctx.lineTo(-34, -14);
  ctx.stroke();

  // Steering wheel
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(v.driver.steeringX, v.driver.steeringY, 4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 5. VAN (Ridge Van)
function drawVanBody(ctx: CanvasRenderingContext2D, v: VehicleConfig, car: CarPhysicsState): void {
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  // Boxy aerodynamic main van body
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.roundRect(-40, -26, 80, 28, [8, 12, 3, 3]);
  ctx.fill();
  ctx.stroke();

  // Stylized contrast bottom rocker panel
  ctx.fillStyle = '#312e81';
  ctx.fillRect(-38, -2, 76, 4);

  // Driver cabin window opening
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(8, -23, 26, 12, [2, 4, 2, 2]);
  ctx.fill();

  // Rear passenger window cutout
  ctx.beginPath();
  ctx.roundRect(-24, -23, 26, 12, [2, 2, 2, 2]);
  ctx.fill();

  // Front bumper & headlight
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(36, -6, 6, 8);
  ctx.fillStyle = car.vx > 0.5 ? '#facc15' : '#fef08a';
  ctx.fillRect(37, -14, 4, 6);

  ctx.restore();
}

function drawVanWindowOverlay(
  ctx: CanvasRenderingContext2D,
  v: VehicleConfig,
  car: CarPhysicsState
): void {
  // Translucent window tint
  ctx.fillStyle = 'rgba(199, 210, 254, 0.45)';
  ctx.fillRect(8, -23, 26, 12);
  ctx.fillRect(-24, -23, 26, 12);

  ctx.strokeStyle = '#e0e7ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, -23, 26, 12);
  ctx.strokeRect(-24, -23, 26, 12);
}

// 6. BIKE (Nitro Bike)
function drawBikeBody(ctx: CanvasRenderingContext2D, v: VehicleConfig, car: CarPhysicsState): void {
  ctx.save();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;

  // Tubular motocross frame
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-24, 6); // rear axle
  ctx.lineTo(-8, -4);  // swingarm pivot
  ctx.lineTo(14, -8);  // headtube
  ctx.lineTo(24, 6);   // front axle
  ctx.stroke();

  // Engine block
  ctx.fillStyle = '#334155';
  ctx.fillRect(-4, -4, 12, 9);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-4, -4, 12, 9);

  // Chrome exhaust pipe
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.lineTo(-12, 3);
  ctx.lineTo(-24, -2);
  ctx.stroke();

  // Aerodynamic fuel tank & rear tail cowl
  ctx.fillStyle = v.visual.bodyColor;
  ctx.beginPath();
  ctx.moveTo(-18, -9);
  ctx.lineTo(12, -9);
  ctx.lineTo(14, -14);
  ctx.lineTo(-4, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Racer seat
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-14, -11, 10, 3.5);

  // Front suspension fork
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(12, -14);
  ctx.lineTo(24, 6);
  ctx.stroke();

  // Handlebars
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(10, -17, 6, 3);

  // Headlamp
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(15, -14, 3, 5);

  ctx.restore();
}

// =========================================================================
// CUSTOM WHEEL RENDERING WITH VEHICLE SPECIFICS
// =========================================================================

function drawVehicleWheel(
  ctx: CanvasRenderingContext2D,
  wheel: WheelConfig,
  wheelAngle: number,
  vehicle: VehicleConfig
): void {
  ctx.save();
  ctx.translate(wheel.offsetX, wheel.offsetY);

  const r = wheel.radius;

  // Outer rubber tire
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = vehicle.visual.wheelColor || '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tread details based on vehicle type
  if (vehicle.id === 'tractor' && r > 14) {
    // Heavy agricultural chevron treads on big rear tractor wheel!
    ctx.save();
    ctx.rotate(wheelAngle);
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    const teeth = 10;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const x1 = Math.cos(a) * (r - 4);
      const y1 = Math.sin(a) * (r - 4);
      const x2 = Math.cos(a + 0.15) * r;
      const y2 = Math.sin(a + 0.15) * r;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Inner metal rim
  const rimRadius = r * 0.62;
  ctx.beginPath();
  ctx.arc(0, 0, rimRadius, 0, Math.PI * 2);
  ctx.fillStyle = vehicle.visual.wheelRimColor || '#cbd5e1';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Rotating inner spokes
  ctx.save();
  ctx.rotate(wheelAngle);

  if (vehicle.id === 'bike') {
    // Fine wire spokes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * rimRadius * 0.95, Math.sin(a) * rimRadius * 0.95);
      ctx.stroke();
    }
  } else {
    // 4 or 5 alloy star spokes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-rimRadius * 0.85, 0);
    ctx.lineTo(rimRadius * 0.85, 0);
    ctx.moveTo(0, -rimRadius * 0.85);
    ctx.lineTo(0, rimRadius * 0.85);
    ctx.stroke();
  }
  ctx.restore();

  // Center axle hub
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  ctx.restore();
}

// =========================================================================
// STANDALONE VEHICLE PREVIEW FOR GARAGE SCREEN
// =========================================================================

export function renderVehiclePreview(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  vehicle: VehicleConfig,
  animTimeMs: number
): void {
  ctx.clearRect(0, 0, width, height);

  // Subtle clean showcase backdrop
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width * 0.7);
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Ground platform line
  const groundY = height * 0.72;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, groundY);
  ctx.lineTo(width - 20, groundY);
  ctx.stroke();

  // Soft vehicle shadow on platform
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(width / 2, groundY + 2, 65, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mock car state for animated preview
  const previewCar: CarPhysicsState = {
    x: width / 2,
    y: groundY - 20,
    vx: 1.5,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    wheelAngle: animTimeMs * 0.005,
    isGrounded: true,
    airTime: 0,
    crashed: false,
    crashTimer: 0,
    maxDistanceReached: 0,
    vehicleId: vehicle.id,
    driverLean: Math.sin(animTimeMs * 0.003) * 0.06,
    driverBounce: Math.sin(animTimeMs * 0.006) * 1.2,
    chassisWidth: vehicle.visual.chassisWidth,
    chassisHeight: vehicle.visual.chassisHeight,
    cabinWidth: vehicle.visual.chassisWidth * 0.58,
    cabinHeight: vehicle.visual.chassisHeight * 0.75,
    wheelRadius: 12,
    wheelOffset: 24,
    suspensionRest: 14,
    bodyColor: vehicle.visual.bodyColor,
    cabinColor: vehicle.visual.cabinColor || vehicle.visual.secondaryColor,
    wheelColor: vehicle.visual.wheelColor,
    windowOpenProgress: 0,
  };

  ctx.save();
  // Scale preview nicely if needed
  ctx.translate(width / 2, groundY - 24);
  const scale = 1.35;
  ctx.scale(scale, scale);

  // Temporarily zero x,y so it renders centered at transform
  previewCar.x = 0;
  previewCar.y = 0;
  drawRotatedVehicle(ctx, previewCar, vehicle, animTimeMs);

  ctx.restore();
}

export const drawVehiclePreview = renderVehiclePreview;

