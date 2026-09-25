import React from 'react';
import {
  Play,
  RotateCcw,
  Menu,
  Trophy,
  Clock,
  Lock,
  Sparkles,
  CheckCircle2,
  Car,
  Award,
} from 'lucide-react';
import { LevelConfig, LevelProgress, VehicleConfig } from '../game/types';

// ==========================================
// 1. LEVEL SELECT MODAL
// ==========================================
interface LevelSelectModalProps {
  levels: LevelConfig[];
  currentLevelId: number;
  progress: LevelProgress;
  onSelectLevel: (levelId: number) => void;
  onOpenGarage?: () => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  currentLevelId,
  progress,
  onSelectLevel,
  onOpenGarage,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl flex flex-col gap-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-wide">SELECT LEVEL</h2>
              <p className="text-xs text-slate-400">Choose an unlocked track to race</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGarage && (
              <button
                onClick={onOpenGarage}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md"
              >
                <Car className="w-3.5 h-3.5" />
                <span>GARAGE</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
            >
              Back to Game
            </button>
          </div>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {levels.map((lvl) => {
            const isUnlocked = progress.unlockedLevels.includes(lvl.id);
            const isSelected = lvl.id === currentLevelId;
            const highScore = progress.highScores[lvl.id] || 0;
            const bestTime = progress.bestTimes[lvl.id];

            return (
              <div
                key={lvl.id}
                onClick={() => {
                  if (isUnlocked) onSelectLevel(lvl.id);
                }}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all select-none ${
                  !isUnlocked
                    ? 'bg-slate-950/50 border-slate-800/80 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/40 cursor-pointer shadow-lg hover:scale-[1.02]'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-500 cursor-pointer hover:scale-[1.02]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-400">
                      LEVEL {lvl.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        lvl.difficulty === 'Easy'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : lvl.difficulty === 'Beginner+'
                          ? 'bg-lime-950/80 text-lime-300 border-lime-700/60'
                          : lvl.difficulty === 'Medium'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                          : lvl.difficulty === 'Hard'
                          ? 'bg-orange-950/80 text-orange-300 border-orange-700/60'
                          : lvl.difficulty === 'Very Hard'
                          ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                          : 'bg-red-950/80 text-red-300 border-red-700/60'
                      }`}
                    >
                      {lvl.difficulty}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white mb-1">{lvl.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mb-2">
                    {lvl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-300">
                  {isUnlocked ? (
                    <>
                      <div>
                        <span className="text-slate-500">BEST: </span>
                        <span className="font-mono font-bold text-amber-400">{highScore}</span>
                      </div>
                      {bestTime ? (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-2.5 h-2.5 text-sky-400" />
                          <span>{bestTime.toFixed(1)}s</span>
                        </div>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <Play className="w-2.5 h-2.5 fill-current" /> PLAY
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-500 w-full justify-center py-0.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="font-medium">Complete Level {lvl.id - 1} to Unlock</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 2. LEVEL COMPLETE MODAL
// ==========================================
interface LevelCompleteModalProps {
  level: LevelConfig;
  score: number;
  coins: number;
  timeSeconds: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onLevelSelect: () => void;
  onOpenGarage: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  score,
  coins,
  timeSeconds,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onLevelSelect,
  onOpenGarage,
}) => {
  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center text-white relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Trophy icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
          <Sparkles className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black tracking-wide text-white mb-0.5">LEVEL COMPLETE!</h2>
        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-5">
          Level {level.id}: {level.name}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">SCORE</span>
            <span className="font-mono text-lg font-black text-amber-300">{score}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">COINS</span>
            <span className="font-mono text-lg font-black text-yellow-400">🪙 {coins}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">TIME</span>
            <span className="font-mono text-lg font-black text-sky-400">{formattedTime}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {hasNextLevel ? (
            <button
              onClick={onNextLevel}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Next Level (Level {level.id + 1})</span>
            </button>
          ) : (
            <div className="py-2 px-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Congratulations! All Levels Mastered!</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              onClick={onReplay}
              className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>

            <button
              onClick={onOpenGarage}
              className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition border border-amber-500/40"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Garage</span>
            </button>

            <button
              onClick={onLevelSelect}
              className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition border border-slate-700"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Levels</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 3. GAME OVER MODAL
// ==========================================
interface GameOverModalProps {
  level: LevelConfig;
  score: number;
  coins: number;
  timeSeconds: number;
  onRetry: () => void;
  onLevelSelect: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  level,
  score,
  coins,
  timeSeconds,
  onRetry,
  onLevelSelect,
  onOpenGarage,
}) => {
  const mins = Math.floor(timeSeconds / 60);
  const secs = Math.floor(timeSeconds % 60);
  const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center text-white relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Skull / Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-500 text-3xl mb-3 shadow-lg">
          💥
        </div>

        <h2 className="text-2xl font-black tracking-wide text-white mb-1">GAME OVER</h2>
        <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-5">
          Vehicle Overturned / Crashed on {level.name}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full mb-5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">SCORE</span>
            <span className="font-mono text-lg font-black text-amber-300">{score}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">COINS</span>
            <span className="font-mono text-lg font-black text-yellow-400">🪙 {coins}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">TIME</span>
            <span className="font-mono text-lg font-black text-sky-400">{formattedTime}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onRetry}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:scale-95 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={onOpenGarage}
              className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-amber-500/40"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Garage</span>
            </button>

            <button
              onClick={onLevelSelect}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Level Select</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 4. PAUSE MODAL
// ==========================================
interface PauseModalProps {
  level: LevelConfig;
  onResume: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  onOpenGarage: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  level,
  onResume,
  onRestart,
  onLevelSelect,
  onOpenGarage,
}) => {
  return (
    <div className="fixed inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center text-white">
        
        <h2 className="text-xl font-black tracking-wide text-white mb-1">GAME PAUSED</h2>
        <p className="text-xs text-sky-400 font-medium mb-5">Level {level.id}: {level.name}</p>

        {/* Quick controls reminder */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 w-full text-left text-xs text-slate-300 space-y-1.5 mb-5">
          <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
            Keyboard Controls
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Accelerate (Gas):</span>
            <span className="font-mono text-emerald-400 font-bold">W / ↑</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Brake / Reverse:</span>
            <span className="font-mono text-red-400 font-bold">S / ↓</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tilt Left / Balance:</span>
            <span className="font-mono text-sky-400 font-bold">A / ←</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tilt Right / Balance:</span>
            <span className="font-mono text-sky-400 font-bold">D / →</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>

          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              onClick={onRestart}
              className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            <button
              onClick={onOpenGarage}
              className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition border border-amber-500/40"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Garage</span>
            </button>

            <button
              onClick={onLevelSelect}
              className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition border border-slate-700"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Levels</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 5. VEHICLE UNLOCKED MODAL
// ==========================================
interface VehicleUnlockedModalProps {
  vehicle: VehicleConfig;
  onSelectAndPlay: () => void;
  onOpenGarage: () => void;
  onContinue: () => void;
}

export const VehicleUnlockedModal: React.FC<VehicleUnlockedModalProps> = ({
  vehicle,
  onSelectAndPlay,
  onOpenGarage,
  onContinue,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center text-white relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow halo */}
        <div className="absolute -top-24 w-64 h-64 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Big Icon */}
        <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-3 shadow-lg">
          {vehicle.icon}
        </div>

        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> NEW VEHICLE UNLOCKED!
        </span>
        <h2 className="text-2xl font-black tracking-wide text-white mb-1">{vehicle.name}</h2>
        <p className="text-xs text-slate-300 font-medium mb-4 max-w-xs">{vehicle.tagline}</p>

        {/* Stats Preview */}
        <div className="grid grid-cols-4 gap-2 w-full bg-slate-950/80 border border-slate-800 p-3 rounded-xl mb-5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">SPEED</span>
            <span className="font-mono text-sm font-black text-sky-400">{vehicle.stats.speed}/10</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">POWER</span>
            <span className="font-mono text-sm font-black text-amber-400">{vehicle.stats.power}/10</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">STABILITY</span>
            <span className="font-mono text-sm font-black text-emerald-400">{vehicle.stats.stability}/10</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">CONTROL</span>
            <span className="font-mono text-sm font-black text-purple-400">{vehicle.stats.control}/10</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={onSelectAndPlay}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>DRIVE {vehicle.name.toUpperCase()} NOW</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              onClick={onOpenGarage}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>View in Garage</span>
            </button>

            <button
              onClick={onContinue}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-400 hover:text-white font-bold text-xs transition border border-slate-700"
            >
              Continue
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==========================================
// 6. DESKTOP CONTROLS GUIDE OVERLAY
// ==========================================
interface ControlsGuideProps {
  onDismiss: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onDismiss }) => {
  return (
    <div className="absolute top-20 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-xl text-white max-w-[240px] text-xs pointer-events-auto hidden md:block select-none animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-2">
        <span className="font-black text-[10px] uppercase tracking-wider text-sky-400">
          CONTROLS GUIDE
        </span>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white text-[10px] font-bold"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1 font-mono text-[11px] mb-2.5">
        <div className="flex justify-between">
          <span className="text-slate-400">Gas:</span>
          <span className="text-emerald-400 font-bold">W or ↑</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Brake/Rev:</span>
          <span className="text-red-400 font-bold">S or ↓</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Tilt Left:</span>
          <span className="text-sky-300 font-bold">A or ←</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Tilt Right:</span>
          <span className="text-sky-300 font-bold">D or →</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Pause:</span>
          <span className="text-amber-300 font-bold">P or Esc</span>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="w-full py-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold text-[10px] transition"
      >
        Dismiss
      </button>
    </div>
  );
};
