import React, { useRef, useEffect } from 'react';
import { Sparkles, Check, Play, Eye } from 'lucide-react';
import { VehicleConfig } from '../game/types';
import { renderVehiclePreview } from '../game/renderer';

interface VehicleUnlockedModalProps {
  vehicle: VehicleConfig;
  onSelectAndPlay: () => void;
  onViewInGarage: () => void;
  onContinue: () => void;
}

export const VehicleUnlockedModal: React.FC<VehicleUnlockedModalProps> = ({
  vehicle,
  onSelectAndPlay,
  onViewInGarage,
  onContinue,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();
    const render = (now: number) => {
      const elapsed = now - startTime;
      renderVehiclePreview(ctx, canvas.width, canvas.height, vehicle, elapsed);
      animId = requestAnimationFrame(render);
    };
    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [vehicle]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center text-white relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
          <Sparkles className="w-9 h-9" />
        </div>

        <div className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">
          🎉 CONGRATULATIONS!
        </div>
        <h2 className="text-2xl font-black tracking-wide text-white mb-1">
          NEW VEHICLE UNLOCKED!
        </h2>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{vehicle.icon}</span>
          <span className="text-lg font-black text-amber-300">{vehicle.name}</span>
        </div>

        {/* Live Canvas Preview of newly unlocked ride */}
        <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner mb-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={400}
            height={160}
            className="w-full h-full object-contain"
          />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-5 px-2">
          {vehicle.description}
        </p>

        {/* Action Buttons: [SELECT & PLAY], [VIEW IN GARAGE], [CONTINUE] */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onSelectAndPlay}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Select & Drive Now</span>
          </button>

          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              onClick={onViewInGarage}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View in Garage</span>
            </button>

            <button
              onClick={onContinue}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Continue</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
