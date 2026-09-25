import { CarPhysicsState, InputControls, Particle, VehicleConfig } from './types';
import { VEHICLES } from './vehicles';
import { sound } from './audio';

export const defaultCarState: CarPhysicsState = {
  x: 120,
  y: 335,
  vx: 0,
  vy: 0,
  angle: 0,
  angularVelocity: 0,
  wheelAngle: 0,
  isGrounded: true,
  airTime: 0,
  crashed: false,
  crashTimer: 0,
  maxDistanceReached: 120,

  vehicleId: 'car',
  driverLean: 0,
  driverBounce: 0,

  chassisWidth: 76,
  chassisHeight: 22,
  cabinWidth: 44,
  cabinHeight: 18,
  wheelRadius: 12,
  wheelOffset: 24,
  suspensionRest: 14,

  bodyColor: '#e63946',
  cabinColor: '#1d3557',
  wheelColor: '#1e293b',
  windowOpenProgress: 0,
};

export function createCarStateForVehicle(
  vehicle: VehicleConfig,
  startX: number,
  startY: number
): CarPhysicsState {
  const rearWheel = vehicle.wheels[0] || { offsetX: -24, offsetY: 6, radius: 12 };
  const frontWheel = vehicle.wheels[1] || { offsetX: 24, offsetY: 6, radius: 12 };
  const avgRadius = (rearWheel.radius + frontWheel.radius) / 2;
  const avgOffset = (Math.abs(rearWheel.offsetX) + Math.abs(frontWheel.offsetX)) / 2;

  return {
    ...defaultCarState,
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    wheelAngle: 0,
    isGrounded: true,
    airTime: 0,
    crashed: false,
    crashTimer: 0,
    maxDistanceReached: startX,

    vehicleId: vehicle.id,
    driverLean: 0,
    driverBounce: 0,

    chassisWidth: vehicle.visual.chassisWidth,
    chassisHeight: vehicle.visual.chassisHeight,
    cabinWidth: vehicle.visual.chassisWidth * 0.58,
    cabinHeight: vehicle.visual.chassisHeight * 0.75,
    wheelRadius: avgRadius,
    wheelOffset: avgOffset,
    suspensionRest: avgRadius + 2,

    bodyColor: vehicle.visual.bodyColor,
    cabinColor: vehicle.visual.cabinColor || vehicle.visual.secondaryColor,
    wheelColor: vehicle.visual.wheelColor,
    windowOpenProgress: 0,
  };
}

export function normalizeAngle(rad: number): number {
  while (rad > Math.PI) rad -= Math.PI * 2;
  while (rad < -Math.PI) rad += Math.PI * 2;
  return rad;
}

export function updatePhysics(
  car: CarPhysicsState,
  arg2: VehicleConfig | InputControls,
  arg3: InputControls | ((x: number) => number),
  arg4?: ((x: number) => number) | number,
  arg5?: number | Particle[],
  arg6?: Particle[]
): { airPointsAwarded: number } {
  // Support both 5-param signature (legacy) and 6-param signature (with vehicle)
  let vehicle: VehicleConfig;
  let input: InputControls;
  let getTerrainHeight: (x: number) => number;
  let trackLength: number;
  let particles: Particle[];

  if ('id' in arg2 && 'enginePower' in arg2) {
    vehicle = arg2 as VehicleConfig;
    input = arg3 as InputControls;
    getTerrainHeight = arg4 as (x: number) => number;
    trackLength = (arg5 as number) || 5000;
    particles = (arg6 as Particle[]) || [];
  } else {
    vehicle = VEHICLES[car.vehicleId] || VEHICLES.car;
    input = arg2 as InputControls;
    getTerrainHeight = arg3 as (x: number) => number;
    trackLength = (arg4 as number) || 5000;
    particles = (arg5 as Particle[]) || [];
  }

  let airPointsAwarded = 0;

  if (car.crashed) {
    // Car is wrecked, minimal residual movement
    car.vx *= 0.92;
    car.vy += 0.3;
    car.x += car.vx;
    car.y += car.vy;
    car.driverLean += (0.4 - car.driverLean) * 0.1;
    return { airPointsAwarded: 0 };
  }

  // 1. Wheel positions in world space relative to vehicle center and angle
  const cosA = Math.cos(car.angle);
  const sinA = Math.sin(car.angle);

  const rearWheel = vehicle.wheels[0] || { offsetX: -24, offsetY: 6, radius: 12 };
  const frontWheel = vehicle.wheels[1] || { offsetX: 24, offsetY: 6, radius: 12 };

  // Rear Wheel in world coordinates
  const rwRelX = cosA * rearWheel.offsetX - sinA * rearWheel.offsetY;
  const rwRelY = sinA * rearWheel.offsetX + cosA * rearWheel.offsetY;
  const rwX = car.x + rwRelX;
  const rwY = car.y + rwRelY + rearWheel.radius;

  // Front Wheel in world coordinates
  const fwRelX = cosA * frontWheel.offsetX - sinA * frontWheel.offsetY;
  const fwRelY = sinA * frontWheel.offsetX + cosA * frontWheel.offsetY;
  const fwX = car.x + fwRelX;
  const fwY = car.y + fwRelY + frontWheel.radius;

  // Terrain height under both wheels
  const groundRW = getTerrainHeight(rwX);
  const groundFW = getTerrainHeight(fwX);

  const rearTouching = rwY >= groundRW - 2;
  const frontTouching = fwY >= groundFW - 2;
  const wasGrounded = car.isGrounded;
  const isNowGrounded = rearTouching || frontTouching;

  car.isGrounded = isNowGrounded;

  // 2. GROUND DRIVING OR AIRBORNE DYNAMICS
  if (isNowGrounded) {
    // Just landed?
    if (!wasGrounded && car.airTime > 0.35) {
      sound.playLandSound();
      car.driverBounce = Math.min(5, 1.5 + car.airTime * 3);

      // Emit dirt puffs on landing proportional to mass
      const puffCount = Math.round(5 * vehicle.mass);
      for (let i = 0; i < puffCount; i++) {
        particles.push({
          id: Math.random(),
          x: car.x + (Math.random() * 40 - 20),
          y: car.y + 12,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 2.5 - 0.5,
          life: 1,
          maxLife: 18 + Math.random() * 10,
          size: 3 + Math.random() * 3,
          color: '#854d0e',
          type: 'dirt',
        });
      }
    }

    // Award bonus points for long air time on clean landing
    if (!wasGrounded && car.airTime > 0.8) {
      airPointsAwarded = Math.round(car.airTime * 120);
    }
    car.airTime = 0;

    // Ground slope angle between rear and front wheel contact points
    const slopeAngle = Math.atan2(groundFW - groundRW, fwX - rwX);

    // Gravity slope pull (forces vehicle down hills, counterbalanced by vehicle hillClimb trait)
    const slopeDownhillPull = (Math.sin(slopeAngle) * 0.16 * vehicle.mass) / Math.max(0.6, vehicle.hillClimb);
    car.vx -= slopeDownhillPull;

    // Driving input
    const maxForward = vehicle.maxSpeed;
    const maxReverse = vehicle.maxReverse;

    if (input.gas) {
      // Throttle acceleration scaled by vehicle engine power & mass
      const accelFactor = (vehicle.enginePower / vehicle.mass) * (rearTouching ? 1.0 : 0.6);
      car.vx += Math.cos(slopeAngle) * accelFactor;
      car.vy += Math.sin(slopeAngle) * accelFactor;

      // Dynamic Driver Lean: Leaning back under acceleration
      const targetLean = -0.16 * (vehicle.enginePower / 0.20);
      car.driverLean += (targetLean - car.driverLean) * 0.14;

      // Exhaust smoke particles
      const smokeChance = vehicle.id === 'tractor' ? 0.7 : 0.4;
      if (Math.random() < smokeChance) {
        particles.push({
          id: Math.random(),
          x: car.x - cosA * (car.chassisWidth / 2 + 4),
          y: car.y - sinA * (car.chassisWidth / 2) + 4,
          vx: -car.vx * 0.3 - Math.random() * 1.5,
          vy: -Math.random() * 1.2 - 0.4,
          life: 1,
          maxLife: 22,
          size: (vehicle.id === 'tractor' ? 4.5 : 3.5) + Math.random() * 3,
          color: vehicle.id === 'tractor' ? 'rgba(71, 85, 105, 0.75)' : 'rgba(148, 163, 184, 0.6)',
          type: 'smoke',
        });
      }

      // Tire dirt kickup when accelerating hard
      if (Math.abs(car.vx) > 1.2 && Math.random() < 0.35) {
        particles.push({
          id: Math.random(),
          x: rwX,
          y: groundRW,
          vx: -car.vx * 0.5 + (Math.random() - 0.5),
          vy: -Math.random() * 2 - 1,
          life: 1,
          maxLife: 16,
          size: 2.5 + Math.random() * 2,
          color: '#713f12',
          type: 'dirt',
        });
      }
    } else if (input.brake) {
      // Reverse or Brake
      const brakeFactor = vehicle.brakePower;
      car.vx -= Math.cos(slopeAngle) * brakeFactor;
      car.vy -= Math.sin(slopeAngle) * brakeFactor;

      // Dynamic Driver Lean: Leaning forward under braking
      const targetLean = 0.22;
      car.driverLean += (targetLean - car.driverLean) * 0.16;
    } else {
      // Natural ground rolling resistance tuned per vehicle
      car.vx *= vehicle.rollingResistance;
      if (Math.abs(car.vx) < 0.01) car.vx = 0;

      // Driver returns to neutral posture with slight road vibration
      const roadVibe = Math.sin(performance.now() * 0.01) * 0.02 * Math.min(1, Math.abs(car.vx));
      car.driverLean += (roadVibe - car.driverLean) * 0.1;
    }

    // Clamp speed
    car.vx = Math.max(-maxReverse, Math.min(maxForward, car.vx));

    // Suspension correction: lift vehicle so wheels rest smoothly on terrain
    const avgWheelR = (rearWheel.radius + frontWheel.radius) / 2;
    const avgWheelOffsetY = (rearWheel.offsetY + frontWheel.offsetY) / 2;
    const idealY = (groundRW + groundFW) / 2 - avgWheelR - avgWheelOffsetY;
    
    if (car.y > idealY) {
      car.y += (idealY - car.y) * vehicle.suspensionStiffness;
      car.vy = Math.min(0, car.vy * 0.2);
    } else {
      car.vy += 0.2 * vehicle.mass; // Keep wheels pressed to ground
    }

    // Blend car tilt to match slope
    const angleDiff = normalizeAngle(slopeAngle - car.angle);
    car.angle += angleDiff * vehicle.stability;
    car.angularVelocity *= 0.5;

    // Slight balance assist when on ground
    if (input.tiltLeft) car.angularVelocity -= 0.003;
    if (input.tiltRight) car.angularVelocity += 0.003;

  } else {
    // 3. AIRBORNE FLIGHT PHYSICS
    car.airTime += 1 / 60;
    const gravity = 0.30 * Math.max(0.7, Math.min(1.3, vehicle.mass));
    car.vy += gravity;

    // Air drag
    car.vx *= 0.995;

    // Air balance / stunts (A/D or Left/Right arrows or virtual steer)
    const airTorque = vehicle.airControl;
    if (input.tiltLeft || input.brake) {
      car.angularVelocity -= airTorque;
      car.driverLean += (-0.25 - car.driverLean) * 0.12;
    }
    if (input.tiltRight || input.gas) {
      car.angularVelocity += airTorque;
      car.driverLean += (0.22 - car.driverLean) * 0.12;
    }

    // Damping on air spin
    car.angularVelocity *= 0.95;
    car.angle += car.angularVelocity;
  }

  // Settle driver bounce spring back to zero
  car.driverBounce *= 0.84;

  // 4. UPDATE POSITION
  car.x += car.vx;
  car.y += car.vy;

  // Track max forward distance
  if (car.x > car.maxDistanceReached) {
    car.maxDistanceReached = car.x;
  }

  // Track boundary clamps
  if (car.x < 30) {
    car.x = 30;
    car.vx = 0;
  }

  // 5. ANIMATED WHEEL ROTATION
  const avgWheelRadius = (rearWheel.radius + frontWheel.radius) / 2;
  car.wheelAngle += car.vx / avgWheelRadius;

  // 6. ROLLING WINDOW ANIMATION
  const isStoppedAndUpright = Math.abs(car.vx) < 0.15 && Math.abs(normalizeAngle(car.angle)) < 0.3;
  const targetWindow = isStoppedAndUpright ? 0.9 : 0.0;
  car.windowOpenProgress += (targetWindow - car.windowOpenProgress) * 0.08;

  // 7. OVERTURN & CRASH DETECTION
  // Check if driver head / car roof hits terrain
  const headX = car.x - sinA * (car.chassisHeight + 12);
  const headY = car.y - cosA * (car.chassisHeight + 12);
  const groundAtHead = getTerrainHeight(headX);

  const normA = Math.abs(normalizeAngle(car.angle));
  const isUpsideDown = normA > Math.PI * 0.55;

  if (isUpsideDown && (headY >= groundAtHead - 4 || isNowGrounded)) {
    car.crashTimer += 1 / 60;
    if (car.crashTimer > 1.2) {
      car.crashed = true;
      sound.playCrashSound();
    }
  } else {
    car.crashTimer = Math.max(0, car.crashTimer - 2 / 60);
  }

  // Fall off cliff / void check
  const terrainAtCar = getTerrainHeight(car.x);
  if (car.y > terrainAtCar + 210) {
    car.crashed = true;
    sound.playCrashSound();
  }

  // Update engine sound frequency
  sound.updateEnginePitch(car.vx, input.gas);

  return { airPointsAwarded };
}
