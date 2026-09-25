import React, { useState, useEffect, useRef } from 'react';
import { Play, Check, Lock, ChevronRight, Sparkles, X, Shield, Zap, Gauge, Compass } from 'lucide-react';
import { VehicleConfig, VehicleId } from '../game/types';
import { VEHICLE_LIST, isVehicleUnlocked } from '../game/vehicles';
import { renderVehiclePreview } from '../game/renderer';
import { sound } from '../game/audio';

interface GarageModalProps {
  unlockedLevels: number[];
  totalCoins: number;
  unlockedVehicles: VehicleId[];
  selectedVehicleId: VehicleId;
  onSelectVehicle: (vehicleId: VehicleId) => void;
  onPlay?: () => void;
  onStartDrive?: () => void;
  onLevelSelect?: () => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  unlockedLevels,
  totalCoins,
  unlockedVehicles,
  selectedVehicleId,
  onSelectVehicle,
  onPlay,
  onStartDrive,
  onLevelSelect,
  onClose,
}) => {
  const [activePreviewId, setActivePreviewId] = useState<VehicleId>(selectedVehicleId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeVehicle = VEHICLE_LIST.find((v) => v.id === activePreviewId) || VEHICLE_LIST[0];
  const isUnlocked = isVehicleUnlocked(activeVehicle, unlockedLevels, totalCoins, unlockedVehicles);
  const isSelected = activeVehicle.id === selectedVehicleId;
  const handleDrive = onStartDrive || onPlay || onClose;

  // Animated vehicle preview loop in canvas
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = now - startTime;
      renderVehiclePreview(ctx, canvas.width, canvas.height, activeVehicle, elapsed);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeVehicle]);

  const handleSelect = (vehicle: VehicleConfig) => {
    sound.playCoinSound();
    onSelectVehicle(vehicle.id);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-white my-auto">
        
        {/* TOP BAR */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-md">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide flex items-center gap-2">
                <span>VEHICLE GARAGE</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {VEHICLE_LIST.filter((v) => isVehicleUnlocked(v, unlockedLevels, totalCoins, unlockedVehicles)).length} / {VEHICLE_LIST.length} UNLOCKED
                </span>
              </h2>
              <p className="text-xs text-slate-400">Choose your ride with custom physics, speed, & driver</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Total Coins Balance */}
            <div className="bg-slate-950 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 shadow-inner">
              <span className="text-sm">🪙</span>
              <span>{totalCoins} COINS</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Close Garage"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MAIN BODY: VEHICLE CARDS (LEFT/TOP) & SHOWCASE (RIGHT/BOTTOM) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          
          {/* VEHICLE SELECT CAROUSEL / LIST (5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-2 max-h-[50vh] md:max-h-[60vh] overflow-y-auto pr-1">
            {VEHICLE_LIST.map((veh) => {
              const unlocked = isVehicleUnlocked(veh, unlockedLevels, totalCoins, unlockedVehicles);
              const isCurrentSelected = veh.id === selectedVehicleId;
              const isViewing = veh.id === activePreviewId;

              return (
                <div
                  key={veh.id}
                  onClick={() => {
                    setActivePreviewId(veh.id);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                    isViewing
                      ? 'bg-sky-950/50 border-sky-500 ring-2 ring-sky-500/50 shadow-lg'
                      : unlocked
                      ? 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center text-2xl shadow-inner">
                      {veh.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{veh.name}</h4>
                        {isCurrentSelected && (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{veh.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unlocked ? (
                      <span className="text-xs text-sky-400 font-bold">
                        {isViewing ? <ChevronRight className="w-4 h-4" /> : null}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTIVE VEHICLE SHOWCASE & STATS (7 cols) */}
          <div className="md:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
            
            {/* Live Canvas Preview */}
            <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={460}
                height={200}
                className="w-full h-full object-contain"
              />

              {/* Status Badge */}
              <div className="absolute top-2.5 right-2.5">
                {isSelected ? (
                  <span className="bg-emerald-500/90 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow flex items-center gap-1 uppercase tracking-wider">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Active Ride
                  </span>
                ) : isUnlocked ? (
                  <span className="bg-sky-500/90 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow uppercase tracking-wider">
                    Unlocked
                  </span>
                ) : (
                  <span className="bg-slate-800/90 border border-slate-600 text-slate-300 font-bold text-xs px-2.5 py-1 rounded-full shadow flex items-center gap-1 uppercase tracking-wider">
                    <Lock className="w-3 h-3 text-red-400" /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeVehicle.icon}</span>
                <h3 className="text-lg font-black text-white">{activeVehicle.name}</h3>
                <span className="text-xs text-slate-400 font-medium">• {activeVehicle.tagline}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {activeVehicle.description}
              </p>
            </div>

            {/* Visual Stat Bars */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800/80">
              
              {/* SPEED */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    <span>SPEED</span>
                  </span>
                  <span className="font-mono text-sky-400">{activeVehicle.stats.speed}/10</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeVehicle.stats.speed * 10}%` }}
                  />
                </div>
              </div>

              {/* POWER / TORQUE */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>POWER</span>
                  </span>
                  <span className="font-mono text-amber-400">{activeVehicle.stats.power}/10</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeVehicle.stats.power * 10}%` }}
                  />
                </div>
              </div>

              {/* STABILITY */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>STABILITY</span>
                  </span>
                  <span className="font-mono text-emerald-400">{activeVehicle.stats.stability}/10</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeVehicle.stats.stability * 10}%` }}
                  />
                </div>
              </div>

              {/* AIR CONTROL */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-purple-400" />
                    <span>CONTROL</span>
                  </span>
                  <span className="font-mono text-purple-400">{activeVehicle.stats.control}/10</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeVehicle.stats.control * 10}%` }}
                  />
                </div>
              </div>

            </div>

            {/* UNLOCK REQUIREMENT NOTICE (If locked) */}
            {!isUnlocked && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-300">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <div className="font-bold">🔒 LOCKED VEHICLE</div>
                  <div className="text-[11px] text-amber-200/80">
                    {activeVehicle.unlockRequirement.description}
                    {activeVehicle.unlockRequirement.type === 'coins' && (
                      <span className="ml-1 font-mono font-bold">({totalCoins}/{activeVehicle.unlockRequirement.value} Coins)</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 pt-2">
              {isUnlocked ? (
                isSelected ? (
                  <button
                    onClick={handleDrive}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Drive Now</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelect(activeVehicle)}
                    className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Select Vehicle</span>
                  </button>
                )
              ) : (
                <button
                  disabled
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked</span>
                </button>
              )}

              {onLevelSelect && (
                <button
                  onClick={onLevelSelect}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs border border-slate-700 transition"
                >
                  Tracks
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
