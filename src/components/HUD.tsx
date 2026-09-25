import React from 'react';
import { Pause, Volume2, VolumeX, Flag, Car } from 'lucide-react';
import { LevelConfig, VehicleConfig } from '../game/types';

interface HUDProps {
  level: LevelConfig;
  score: number;
  coins: number;
  totalCoins?: number;
  activeVehicle?: VehicleConfig;
  timeSeconds: number;
  progressPercent: number;
  isAirborne: boolean;
  airTime: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenGarage: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  score,
  coins,
  totalCoins,
  activeVehicle,
  timeSeconds,
  progressPercent,
  isAirborne,
  airTime,
  isMuted,
  onToggleMute,
  onPause,
  onOpenGarage,
}) => {
  // Format score with leading zeros
  const formattedScore = score.toString().padStart(6, '0');

  // Format time MM:SS
  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="absolute inset-x-0 top-0 pointer-events-none z-20 p-2 sm:p-4 select-none">
      <div className="flex items-start justify-between gap-2 max-w-7xl mx-auto">
        
        {/* TOP LEFT: Level, Score, Coins */}
        <div className="flex flex-col gap-1 sm:gap-1.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="font-black text-xs sm:text-sm text-sky-400 uppercase tracking-wider">
              LEVEL {level.id}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-300 hidden md:inline font-medium">
              • {level.name}
            </span>
            {activeVehicle && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 flex items-center gap-1">
                <span>{activeVehicle.icon}</span>
                <span className="hidden sm:inline">{activeVehicle.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">SCORE:</span>
            <span className="text-sm sm:text-lg font-black text-amber-300 tracking-wider">
              {formattedScore}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold text-yellow-400">
              <span className="text-sm">🪙</span>
              <span>{coins}</span>
            </div>
            {totalCoins !== undefined && (
              <span className="text-[10px] text-slate-400 font-mono">
                (Total: {totalCoins})
              </span>
            )}
          </div>
        </div>

        {/* TOP CENTER: Timer & Stunt Indicator */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-1.5 sm:px-6 sm:py-2 shadow-lg flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
              TIME:
            </span>
            <span className="font-mono text-sm sm:text-xl font-black text-white tracking-widest">
              {formattedTime}
            </span>
          </div>

          {/* Airborne / Stunt indicator */}
          {isAirborne && airTime > 0.4 && (
            <div className="animate-bounce bg-amber-500/90 text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
              <span>🚀 AIR TIME:</span>
              <span>{airTime.toFixed(1)}s</span>
            </div>
          )}
        </div>

        {/* TOP RIGHT: Progress Bar, Garage, Sound Toggle & Pause Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Level Progress */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3 py-2 shadow-lg flex flex-col gap-1 min-w-[100px] sm:min-w-[150px]">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3 text-emerald-400" />
                <span>PROGRESS</span>
              </span>
              <span className="font-mono text-emerald-400">{progressPercent}%</span>
            </div>
            {/* Visual Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all duration-150"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Garage Button */}
          <button
            onClick={onOpenGarage}
            className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/50 text-amber-300 hover:text-amber-200 transition shadow-lg flex items-center gap-1.5"
            title="Vehicle Garage (Select Ride)"
            aria-label="Open Garage"
          >
            <Car className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-xs font-black hidden sm:inline">GARAGE</span>
          </button>

          {/* Sound Mute Button */}
          <button
            onClick={onToggleMute}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 active:scale-95 border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 active:scale-95 border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg flex items-center gap-1"
            title="Pause Game (Esc or P)"
            aria-label="Pause Game"
          >
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </button>
        </div>

      </div>
    </div>
  );
};
