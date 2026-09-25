import React, { useEffect, useRef, useState, useCallback } from 'react';
import { STATIC_LEVELS } from './game/levels';
import { createCarStateForVehicle, defaultCarState, updatePhysics } from './game/physics';
import { renderGame } from './game/renderer';
import { sound } from './game/audio';
import { VEHICLES, VEHICLE_LIST, isVehicleUnlocked } from './game/vehicles';
import {
  CarPhysicsState,
  Coin,
  FloatingText,
  GameScreen,
  InputControls,
  LevelConfig,
  LevelProgress,
  Particle,
  VehicleConfig,
  VehicleId,
} from './game/types';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import {
  ControlsGuide,
  GameOverModal,
  LevelCompleteModal,
  LevelSelectModal,
  PauseModal,
  VehicleUnlockedModal,
} from './components/Modals';
import { GarageModal } from './components/GarageModal';

const STORAGE_KEY = 'hill_climb_game_progress_v1';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. GAME PROGRESS (LocalStorage persistence & migration)
  const [progress, setProgress] = useState<LevelProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          unlockedLevels: parsed.unlockedLevels && parsed.unlockedLevels.length > 0 ? parsed.unlockedLevels : [1],
          highScores: parsed.highScores || {},
          bestTimes: parsed.bestTimes || {},
          totalCoins: typeof parsed.totalCoins === 'number' ? parsed.totalCoins : 0,
          unlockedVehicles: parsed.unlockedVehicles && parsed.unlockedVehicles.length > 0 ? parsed.unlockedVehicles : ['car'],
          selectedVehicleId: parsed.selectedVehicleId || 'car',
        };
      }
    } catch {
      // Ignore
    }
    return {
      unlockedLevels: [1],
      highScores: {},
      bestTimes: {},
      totalCoins: 0,
      unlockedVehicles: ['car'],
      selectedVehicleId: 'car',
    };
  });

  const progressRef = useRef<LevelProgress>(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const saveProgress = useCallback((newProgress: LevelProgress) => {
    setProgress(newProgress);
    progressRef.current = newProgress;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
    } catch {
      // Ignore
    }
  }, []);

  // 2. ACTIVE GAME STATE
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [screen, setScreen] = useState<GameScreen>('PLAYING');
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAirborne, setIsAirborne] = useState<boolean>(false);
  const [airTime, setAirTime] = useState<number>(0);
  const [showControlsGuide, setShowControlsGuide] = useState<boolean>(true);
  const [unlockedVehiclePopup, setUnlockedVehiclePopup] = useState<VehicleConfig | null>(null);

  // Active level config & Vehicle config
  const activeLevel: LevelConfig =
    STATIC_LEVELS.find((l) => l.id === currentLevelId) || STATIC_LEVELS[0];

  const activeVehicle: VehicleConfig =
    VEHICLES[progress.selectedVehicleId] || VEHICLES.car;

  const activeVehicleRef = useRef<VehicleConfig>(activeVehicle);
  useEffect(() => {
    activeVehicleRef.current = activeVehicle;
  }, [activeVehicle]);

  // 3. MUTABLE PHYSICS & RENDER REFS (High performance 60fps loop)
  const carStateRef = useRef<CarPhysicsState>({
    ...defaultCarState,
    vehicleId: progress.selectedVehicleId,
  });
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const cameraRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastScoreDistanceRef = useRef<number>(120);

  // Input tracking ref
  const inputControlsRef = useRef<InputControls>({
    gas: false,
    brake: false,
    tiltLeft: false,
    tiltRight: false,
    handbrake: false,
  });

  // Track screen state in ref for animation frame
  const screenRef = useRef<GameScreen>(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // Track level in ref for animation frame
  const levelRef = useRef<LevelConfig>(activeLevel);
  useEffect(() => {
    levelRef.current = activeLevel;
  }, [activeLevel]);

  // 4. CHECK VEHICLE UNLOCKS HELPER
  const checkNewVehicleUnlocks = useCallback(
    (currentProg: LevelProgress): VehicleConfig | null => {
      for (const veh of VEHICLE_LIST) {
        if (!currentProg.unlockedVehicles.includes(veh.id)) {
          if (isVehicleUnlocked(veh, currentProg.unlockedLevels, currentProg.totalCoins, currentProg.unlockedVehicles)) {
            return veh;
          }
        }
      }
      return null;
    },
    []
  );

  // 5. LEVEL INITIALIZATION
  const resetLevel = useCallback(
    (levelToLoad: LevelConfig, vehicleToUse: VehicleConfig = activeVehicleRef.current) => {
      const startX = 120;
      const startY = levelToLoad.getTerrainHeight(startX) - 22;

      // Instantiate physics state tailored for this vehicle's dimensions & driver
      carStateRef.current = createCarStateForVehicle(vehicleToUse, startX, startY);

      // Deep clone static coins for this level run
      coinsRef.current = levelToLoad.coins.map((c) => ({ ...c, collected: false }));
      particlesRef.current = [];
      floatingTextsRef.current = [];
      lastScoreDistanceRef.current = startX;

      // Reset Camera centered with good forward lookahead
      cameraRef.current = {
        x: Math.max(0, startX - 250),
        y: Math.max(0, startY - 260),
      };

      // Reset Run Stats
      setScore(0);
      setCoins(0);
      setTimeSeconds(0);
      setProgressPercent(0);
      setIsAirborne(false);
      setAirTime(0);

      // Audio engine restart
      sound.startEngine();
      setScreen('PLAYING');
    },
    []
  );

  // Initialize level on mount or level change
  useEffect(() => {
    resetLevel(activeLevel, activeVehicle);
  }, [currentLevelId, resetLevel]);

  // Handle vehicle switch from garage
  const handleSelectVehicle = (vehicleId: VehicleId) => {
    const updated: LevelProgress = {
      ...progressRef.current,
      selectedVehicleId: vehicleId,
      unlockedVehicles: progressRef.current.unlockedVehicles.includes(vehicleId)
        ? progressRef.current.unlockedVehicles
        : [...progressRef.current.unlockedVehicles, vehicleId],
    };
    saveProgress(updated);

    const veh = VEHICLES[vehicleId] || VEHICLES.car;
    activeVehicleRef.current = veh;
    resetLevel(levelRef.current, veh);
  };

  // 6. GLOBAL KEYBOARD INPUT LISTENERS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        inputControlsRef.current.gas = true;
        sound.startEngine();
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        inputControlsRef.current.brake = true;
        sound.startEngine();
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputControlsRef.current.tiltLeft = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputControlsRef.current.tiltRight = true;
      }

      // Pause toggle (P or Escape)
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (screenRef.current === 'PLAYING') {
          sound.stopEngine();
          setScreen('PAUSED');
        } else if (screenRef.current === 'PAUSED') {
          sound.startEngine();
          setScreen('PLAYING');
        }
      }

      // Quick restart (R)
      if (e.code === 'KeyR' && (screenRef.current === 'PLAYING' || screenRef.current === 'GAME_OVER')) {
        resetLevel(levelRef.current, activeVehicleRef.current);
      }

      // Quick Garage (G)
      if (e.code === 'KeyG' && screenRef.current === 'PLAYING') {
        sound.stopEngine();
        setScreen('GARAGE');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        inputControlsRef.current.gas = false;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        inputControlsRef.current.brake = false;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        inputControlsRef.current.tiltLeft = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        inputControlsRef.current.tiltRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetLevel]);

  // 7. MAIN GAME ANIMATION LOOP (60fps)
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaSec = Math.min(0.1, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const currentLvl = levelRef.current;
      const car = carStateRef.current;
      const curVehicle = activeVehicleRef.current;

      if (canvas && ctx && currentLvl) {
        // Resize canvas to container
        const rect = canvas.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        // ==============================================
        // GAMEPLAY UPDATE (Only when screen is PLAYING)
        // ==============================================
        if (screenRef.current === 'PLAYING') {
          // Increment Level Timer
          setTimeSeconds((t) => t + deltaSec);

          // Update Car & Driver Physics with Vehicle Tuning
          const { airPointsAwarded } = updatePhysics(
            car,
            curVehicle,
            inputControlsRef.current,
            currentLvl.getTerrainHeight,
            currentLvl.length,
            particlesRef.current
          );

          // Air Stunt Bonus
          if (airPointsAwarded > 0) {
            setScore((s) => s + airPointsAwarded);
            floatingTextsRef.current.push({
              id: Math.random(),
              x: car.x,
              y: car.y - 25,
              text: `AIR TIME! +${airPointsAwarded}`,
              color: '#38bdf8',
              life: 0,
              maxLife: 45,
            });
          }

          setIsAirborne(!car.isGrounded);
          setAirTime(car.airTime);

          // Distance Score Progression
          if (car.x > lastScoreDistanceRef.current + 8) {
            const added = Math.floor((car.x - lastScoreDistanceRef.current) / 4);
            setScore((s) => s + added);
            lastScoreDistanceRef.current = car.x;
          }

          // Progress percentage towards finish line
          const finishX = currentLvl.finishX;
          const pct = Math.max(0, Math.min(100, Math.round((car.x / finishX) * 100)));
          setProgressPercent(pct);

          // Coin Collection Collision Check
          coinsRef.current.forEach((coin) => {
            if (coin.collected) return;
            const coinY = currentLvl.getTerrainHeight(coin.x) - coin.yOffset;
            const dist = Math.hypot(car.x - coin.x, car.y - coinY);

            // Car touches coin
            if (dist < 34) {
              coin.collected = true;
              setCoins((c) => c + 1);
              setScore((s) => s + coin.value);
              sound.playCoinSound();

              // Update cumulative total coins
              const newTotal = (progressRef.current.totalCoins || 0) + 1;
              const nextProg: LevelProgress = {
                ...progressRef.current,
                totalCoins: newTotal,
              };

              // Check if collecting this coin unlocked a vehicle (e.g. Tractor!)
              const unlockedVeh = checkNewVehicleUnlocks(nextProg);
              if (unlockedVeh) {
                nextProg.unlockedVehicles = [...nextProg.unlockedVehicles, unlockedVeh.id];
                setUnlockedVehiclePopup(unlockedVeh);
                sound.playWinFanfare();
              }

              saveProgress(nextProg);

              // Sparkle particle burst
              for (let i = 0; i < 7; i++) {
                particlesRef.current.push({
                  id: Math.random(),
                  x: coin.x,
                  y: coinY,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5 - 1.5,
                  life: 0,
                  maxLife: 20 + Math.random() * 10,
                  size: 2.5 + Math.random() * 2.5,
                  color: '#fbbf24',
                  type: 'sparkle',
                });
              }

              // Floating +100 text
              floatingTextsRef.current.push({
                id: Math.random(),
                x: coin.x,
                y: coinY - 10,
                text: `+${coin.value}`,
                color: '#facc15',
                life: 0,
                maxLife: 35,
              });
            }
          });

          // Update Particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
            const p = particlesRef.current[i];
            p.life++;
            p.x += p.vx;
            p.y += p.vy;
            if (p.life >= p.maxLife) {
              particlesRef.current.splice(i, 1);
            }
          }

          // Update Floating Texts
          for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
            const t = floatingTextsRef.current[i];
            t.life++;
            if (t.life >= t.maxLife) {
              floatingTextsRef.current.splice(i, 1);
            }
          }

          // Check Crash / Game Over Condition
          if (car.crashed) {
            sound.stopEngine();
            setScreen('GAME_OVER');
          }

          // Check Level Complete / Finish Line Condition
          if (car.x >= currentLvl.finishX) {
            sound.stopEngine();
            sound.playWinFanfare();

            // Calculate final completion bonus
            const completionBonus = 1000 + Math.max(0, Math.round(600 - timeSeconds * 8));
            const finalScore = score + completionBonus;
            setScore(finalScore);

            // Unlock next level & persist high scores
            const nextLvlId = currentLvl.id + 1;
            const updatedUnlockedLevels = progressRef.current.unlockedLevels.includes(nextLvlId) || nextLvlId > 6
              ? progressRef.current.unlockedLevels
              : [...progressRef.current.unlockedLevels, nextLvlId];

            const currentHigh = progressRef.current.highScores[currentLvl.id] || 0;
            const currentBestTime = progressRef.current.bestTimes[currentLvl.id];

            let updatedProgress: LevelProgress = {
              ...progressRef.current,
              unlockedLevels: updatedUnlockedLevels,
              highScores: {
                ...progressRef.current.highScores,
                [currentLvl.id]: Math.max(currentHigh, finalScore),
              },
              bestTimes: {
                ...progressRef.current.bestTimes,
                [currentLvl.id]: currentBestTime ? Math.min(currentBestTime, timeSeconds) : timeSeconds,
              },
            };

            // Check if completing this level unlocked a vehicle!
            const newUnlockedVeh = checkNewVehicleUnlocks(updatedProgress);
            if (newUnlockedVeh) {
              updatedProgress = {
                ...updatedProgress,
                unlockedVehicles: [...updatedProgress.unlockedVehicles, newUnlockedVeh.id],
              };
              setUnlockedVehiclePopup(newUnlockedVeh);
            }

            saveProgress(updatedProgress);
            setScreen('LEVEL_COMPLETE');
          }
        }

        // ==============================================
        // SMOOTH CAMERA TRACKING WITH LOOKAHEAD
        // ==============================================
        const targetCamX = car.x - canvas.width * 0.28;
        const targetCamY = car.y - canvas.height * 0.62;

        cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
        cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

        // Render Game Frame
        renderGame(
          ctx,
          canvas.width,
          canvas.height,
          currentLvl,
          car,
          coinsRef.current,
          particlesRef.current,
          floatingTextsRef.current,
          cameraRef.current.x,
          cameraRef.current.y,
          now
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      sound.stopEngine();
    };
  }, [checkNewVehicleUnlocks, saveProgress, score, timeSeconds]);

  // Audio Toggle
  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  // Level Selection Action
  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    const selected = STATIC_LEVELS.find((l) => l.id === levelId) || STATIC_LEVELS[0];
    resetLevel(selected, activeVehicleRef.current);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden flex flex-col select-none touch-none">
      
      {/* 1. TOP RESPONSIVE HUD */}
      <HUD
        level={activeLevel}
        score={score}
        coins={coins}
        totalCoins={progress.totalCoins}
        activeVehicle={activeVehicle}
        timeSeconds={timeSeconds}
        progressPercent={progressPercent}
        isAirborne={isAirborne}
        airTime={airTime}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onPause={() => {
          sound.stopEngine();
          setScreen('PAUSED');
        }}
        onOpenGarage={() => {
          sound.stopEngine();
          setScreen('GARAGE');
        }}
      />

      {/* 2. DESKTOP KEYBOARD CONTROLS GUIDE CARD */}
      {showControlsGuide && (
        <ControlsGuide onDismiss={() => setShowControlsGuide(false)} />
      )}

      {/* 3. MAIN GAME CANVAS */}
      <div className="relative flex-1 w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-default"
        />
      </div>

      {/* 4. MOBILE / TABLET TOUCH CONTROLS OVERLAY */}
      <MobileControls inputControls={inputControlsRef} />

      {/* 5. MODALS & MENUS */}
      {screen === 'PAUSED' && (
        <PauseModal
          level={activeLevel}
          onResume={() => {
            sound.startEngine();
            setScreen('PLAYING');
          }}
          onRestart={() => resetLevel(activeLevel, activeVehicleRef.current)}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          onOpenGarage={() => setScreen('GARAGE')}
        />
      )}

      {screen === 'LEVEL_COMPLETE' && (
        <LevelCompleteModal
          level={activeLevel}
          score={score}
          coins={coins}
          timeSeconds={timeSeconds}
          hasNextLevel={activeLevel.id < 6}
          onNextLevel={() => handleSelectLevel(activeLevel.id + 1)}
          onReplay={() => resetLevel(activeLevel, activeVehicleRef.current)}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          onOpenGarage={() => setScreen('GARAGE')}
        />
      )}

      {screen === 'GAME_OVER' && (
        <GameOverModal
          level={activeLevel}
          score={score}
          coins={coins}
          timeSeconds={timeSeconds}
          onRetry={() => resetLevel(activeLevel, activeVehicleRef.current)}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          onOpenGarage={() => setScreen('GARAGE')}
        />
      )}

      {screen === 'LEVEL_SELECT' && (
        <LevelSelectModal
          levels={STATIC_LEVELS}
          currentLevelId={currentLevelId}
          progress={progress}
          onSelectLevel={handleSelectLevel}
          onOpenGarage={() => setScreen('GARAGE')}
          onClose={() => {
            sound.startEngine();
            setScreen('PLAYING');
          }}
        />
      )}

      {screen === 'GARAGE' && (
        <GarageModal
          selectedVehicleId={progress.selectedVehicleId}
          unlockedVehicles={progress.unlockedVehicles}
          unlockedLevels={progress.unlockedLevels}
          totalCoins={progress.totalCoins}
          onSelectVehicle={handleSelectVehicle}
          onStartDrive={() => {
            sound.startEngine();
            setScreen('PLAYING');
          }}
          onClose={() => {
            sound.startEngine();
            setScreen('PLAYING');
          }}
        />
      )}

      {/* 6. CELEBRATORY VEHICLE UNLOCKED POPUP */}
      {unlockedVehiclePopup && (
        <VehicleUnlockedModal
          vehicle={unlockedVehiclePopup}
          onSelectAndPlay={() => {
            handleSelectVehicle(unlockedVehiclePopup.id);
            setUnlockedVehiclePopup(null);
            sound.startEngine();
            setScreen('PLAYING');
          }}
          onOpenGarage={() => {
            setUnlockedVehiclePopup(null);
            setScreen('GARAGE');
          }}
          onContinue={() => {
            setUnlockedVehiclePopup(null);
          }}
        />
      )}
    </div>
  );
}
