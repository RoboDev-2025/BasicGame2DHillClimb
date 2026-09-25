import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { InputControls } from '../game/types';

interface MobileControlsProps {
  inputControls: React.MutableRefObject<InputControls>;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ inputControls }) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [steeringX, setSteeringX] = useState<number>(0); // -1 (full left) to +1 (full right)
  const isDraggingSteering = useRef<boolean>(false);
  const steeringTrackRef = useRef<HTMLDivElement>(null);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      // If height > width and small viewport, considered portrait
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 800);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Update steering from touch/pointer position
  const handleSteeringPointer = (clientX: number) => {
    if (!steeringTrackRef.current) return;
    const rect = steeringTrackRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxRadius = rect.width / 2;
    const deltaX = clientX - centerX;
    const clamped = Math.max(-1, Math.min(1, deltaX / maxRadius));

    setSteeringX(clamped);

    // Apply to input controls
    const deadzone = 0.22;
    if (clamped < -deadzone) {
      inputControls.current.tiltLeft = true;
      inputControls.current.tiltRight = false;
    } else if (clamped > deadzone) {
      inputControls.current.tiltRight = true;
      inputControls.current.tiltLeft = false;
    } else {
      inputControls.current.tiltLeft = false;
      inputControls.current.tiltRight = false;
    }
  };

  const handleSteeringDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingSteering.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handleSteeringPointer(e.clientX);
  };

  const handleSteeringMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSteering.current) return;
    e.preventDefault();
    handleSteeringPointer(e.clientX);
  };

  const handleSteeringUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingSteering.current = false;
    setSteeringX(0);
    inputControls.current.tiltLeft = false;
    inputControls.current.tiltRight = false;
  };

  return (
    <>
      {/* 1. PORTRAIT WARNING OVERLAY */}
      {isPortrait && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white select-none">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center mb-4 text-sky-400 animate-spin">
            <RotateCw className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black mb-2 tracking-wide">PLEASE ROTATE DEVICE</h2>
          <p className="text-sm text-slate-300 max-w-xs leading-relaxed mb-6">
            For the optimal 2D Hill Climb Racing experience, rotate your phone or tablet to{' '}
            <strong className="text-sky-400">Landscape Mode</strong>.
          </p>
          <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            Tip: Turn on Auto-Rotate in device settings
          </div>
        </div>
      )}

      {/* 2. IN-GAME TOUCH CONTROLS (Only visible on touch devices or smaller screens) */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 p-3 sm:p-5 select-none flex items-end justify-between">
        
        {/* LEFT SIDE: VIRTUAL STEERING & BALANCE CONTROL */}
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <ArrowLeft className="w-3 h-3 text-sky-400" />
            <span>STEERING / TILT</span>
            <ArrowRight className="w-3 h-3 text-sky-400" />
          </div>

          <div
            ref={steeringTrackRef}
            onPointerDown={handleSteeringDown}
            onPointerMove={handleSteeringMove}
            onPointerUp={handleSteeringUp}
            onPointerCancel={handleSteeringUp}
            className="w-36 sm:w-44 h-14 bg-slate-950/80 backdrop-blur-md border-2 border-slate-700/80 rounded-2xl shadow-2xl relative flex items-center justify-center cursor-pointer touch-none active:border-sky-500/80"
          >
            {/* Center tick indicator */}
            <div className="absolute inset-y-2 w-0.5 bg-slate-600 rounded-full" />
            
            {/* Guide tracks */}
            <div className="absolute inset-x-4 h-1.5 bg-slate-800 rounded-full" />

            {/* Draggable Steering Knob */}
            <div
              className={`w-12 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-lg transition-transform duration-75 select-none ${
                isDraggingSteering.current
                  ? 'bg-sky-500 text-slate-950 scale-105 shadow-sky-500/40'
                  : 'bg-slate-800 text-slate-200 border border-slate-600'
              }`}
              style={{
                transform: `translateX(${steeringX * 42}px)`,
              }}
            >
              {steeringX < -0.2 ? '◀' : steeringX > 0.2 ? '▶' : '●'}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: LARGE ACCEL & BRAKE PEDALS */}
        <div className="pointer-events-auto flex items-center gap-3 sm:gap-4 pb-1">
          
          {/* BRAKE / REVERSE BUTTON */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputControls.current.brake = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              inputControls.current.brake = false;
            }}
            onPointerLeave={() => {
              inputControls.current.brake = false;
            }}
            onPointerCancel={() => {
              inputControls.current.brake = false;
            }}
            className="w-20 h-16 sm:w-24 sm:h-20 bg-gradient-to-b from-red-600 to-red-800 active:from-red-700 active:to-red-950 text-white rounded-2xl font-black text-xs sm:text-sm tracking-wider shadow-xl border-2 border-red-400/60 active:scale-95 transition-transform flex flex-col items-center justify-center gap-0.5 select-none touch-none"
          >
            <span>BRAKE</span>
            <span className="text-[10px] text-red-200 font-normal">REVERSE</span>
          </button>

          {/* ACCEL / GAS BUTTON */}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputControls.current.gas = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              inputControls.current.gas = false;
            }}
            onPointerLeave={() => {
              inputControls.current.gas = false;
            }}
            onPointerCancel={() => {
              inputControls.current.gas = false;
            }}
            className="w-24 h-18 sm:w-28 sm:h-22 bg-gradient-to-b from-emerald-500 to-emerald-700 active:from-emerald-600 active:to-emerald-900 text-white rounded-2xl font-black text-sm sm:text-base tracking-wider shadow-2xl border-2 border-emerald-300/70 active:scale-95 transition-transform flex flex-col items-center justify-center gap-0.5 select-none touch-none"
          >
            <span>ACCEL</span>
            <span className="text-[10px] text-emerald-100 font-normal">GAS PEDAL</span>
          </button>

        </div>

      </div>
    </>
  );
};
