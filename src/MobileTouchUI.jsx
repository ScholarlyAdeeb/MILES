import React from 'react';
import {
  Car,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
  Flame,
  Anchor,
  Eye,
  SunMedium
} from 'lucide-react';

export function MobileTouchUI({
  isDrivingMode,
  controls,
  setTouchControl,
  onToggleMode,
  onToggleCamera
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 select-none">
      {/* Top Bar Controls */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Mode Switch Toggle Button */}
        <button
          onClick={onToggleMode}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/15 text-cyan-300 backdrop-blur-xl shadow-2xl active:scale-95 transition-all"
        >
          {isDrivingMode ? (
            <>
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold tracking-wider">ROOFTOP TRAVERSAL</span>
            </>
          ) : (
            <>
              <Car className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold tracking-wider">HERO SEDAN DRIVE</span>
            </>
          )}
        </button>

        {/* Camera View Switcher */}
        <button
          onClick={onToggleCamera}
          className="p-2.5 rounded-xl bg-black/60 border border-white/15 text-zinc-300 backdrop-blur-xl active:scale-95 transition-all"
          title="Switch Camera"
        >
          <Eye className="w-4 h-4 text-cyan-400" />
        </button>
      </div>

      {/* Bottom Touch Controls (D-Pad Left, Action Buttons Right) */}
      <div className="flex items-end justify-between w-full pb-2">
        {/* Left: Directional Pad */}
        <div className="relative w-36 h-36 pointer-events-auto flex items-center justify-center">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-black/50 border border-white/10 backdrop-blur-md shadow-2xl" />

          {/* Up / Forward Button */}
          <button
            onTouchStart={() => setTouchControl('forward', true)}
            onTouchEnd={() => setTouchControl('forward', false)}
            onMouseDown={() => setTouchControl('forward', true)}
            onMouseUp={() => setTouchControl('forward', false)}
            className={`absolute top-1 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              controls.forward
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4] scale-95 font-bold'
                : 'bg-white/5 text-zinc-300 border border-white/10 active:bg-cyan-600'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Down / Backward / Dive Button */}
          <button
            onTouchStart={() => {
              setTouchControl('backward', true);
              setTouchControl('dive', true);
            }}
            onTouchEnd={() => {
              setTouchControl('backward', false);
              setTouchControl('dive', false);
            }}
            onMouseDown={() => {
              setTouchControl('backward', true);
              setTouchControl('dive', true);
            }}
            onMouseUp={() => {
              setTouchControl('backward', false);
              setTouchControl('dive', false);
            }}
            className={`absolute bottom-1 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              controls.backward
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4] scale-95 font-bold'
                : 'bg-white/5 text-zinc-300 border border-white/10 active:bg-cyan-600'
            }`}
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          {/* Left Button */}
          <button
            onTouchStart={() => setTouchControl('left', true)}
            onTouchEnd={() => setTouchControl('left', false)}
            onMouseDown={() => setTouchControl('left', true)}
            onMouseUp={() => setTouchControl('left', false)}
            className={`absolute left-1 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              controls.left
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4] scale-95 font-bold'
                : 'bg-white/5 text-zinc-300 border border-white/10 active:bg-cyan-600'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Right Button */}
          <button
            onTouchStart={() => setTouchControl('right', true)}
            onTouchEnd={() => setTouchControl('right', false)}
            onMouseDown={() => setTouchControl('right', true)}
            onMouseUp={() => setTouchControl('right', false)}
            className={`absolute right-1 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              controls.right
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_#06b6d4] scale-95 font-bold'
                : 'bg-white/5 text-zinc-300 border border-white/10 active:bg-cyan-600'
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Action Clusters */}
        <div className="flex flex-col gap-3 items-end pointer-events-auto">
          {/* Upper Cluster (Sprint & Grapple) */}
          <div className="flex items-center gap-2.5">
            {/* Sprint Button */}
            <button
              onTouchStart={() => setTouchControl('sprint', true)}
              onTouchEnd={() => setTouchControl('sprint', false)}
              onMouseDown={() => setTouchControl('sprint', true)}
              onMouseUp={() => setTouchControl('sprint', false)}
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono font-bold backdrop-blur-xl transition-all ${
                controls.sprint
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_#f59e0b] scale-95'
                  : 'bg-black/60 text-amber-400 border border-amber-500/40 active:bg-amber-600'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>BOOST</span>
            </button>

            {/* Grapple / Swing Button (Traversal) */}
            {!isDrivingMode && (
              <button
                onTouchStart={() => setTouchControl('grapple', true)}
                onTouchEnd={() => setTouchControl('grapple', false)}
                onMouseDown={() => setTouchControl('grapple', true)}
                onMouseUp={() => setTouchControl('grapple', false)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono font-bold backdrop-blur-xl transition-all ${
                  controls.grapple
                    ? 'bg-cyan-400 text-black shadow-[0_0_15px_#22d3ee] scale-95'
                    : 'bg-black/60 text-cyan-300 border border-cyan-500/40 active:bg-cyan-600'
                }`}
              >
                <Anchor className="w-4 h-4" />
                <span>SWING</span>
              </button>
            )}

            {/* Headlights toggle (Drive mode) */}
            {isDrivingMode && (
              <button
                onClick={() => setTouchControl('headlights', !controls.headlights)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-mono font-bold backdrop-blur-xl transition-all ${
                  controls.headlights
                    ? 'bg-white/15 text-amber-300 border border-amber-400/50 shadow-[0_0_10px_#f59e0b]'
                    : 'bg-black/60 text-zinc-500 border border-white/10'
                }`}
              >
                <SunMedium className="w-4 h-4" />
                <span>LIGHTS</span>
              </button>
            )}
          </div>

          {/* Lower Primary Button (Jump / Glide in Traversal, Handbrake in Drive) */}
          <div className="flex items-center gap-2">
            {!isDrivingMode ? (
              <button
                onTouchStart={() => setTouchControl('jump', true)}
                onTouchEnd={() => setTouchControl('jump', false)}
                onMouseDown={() => setTouchControl('jump', true)}
                onMouseUp={() => setTouchControl('jump', false)}
                className={`w-22 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xs backdrop-blur-xl shadow-2xl transition-all ${
                  controls.jump
                    ? 'bg-cyan-400 text-black shadow-[0_0_20px_#06b6d4] scale-95'
                    : 'bg-cyan-500/90 text-black border border-cyan-400/50 active:scale-95 shadow-lg'
                }`}
              >
                <Flame className="w-4 h-4 mb-0.5" />
                <span>JUMP / GLIDE</span>
              </button>
            ) : (
              <button
                onTouchStart={() => setTouchControl('handbrake', true)}
                onTouchEnd={() => setTouchControl('handbrake', false)}
                onMouseDown={() => setTouchControl('handbrake', true)}
                onMouseUp={() => setTouchControl('handbrake', false)}
                className={`w-22 h-14 rounded-2xl flex flex-col items-center justify-center font-mono font-bold text-xs backdrop-blur-xl shadow-2xl transition-all ${
                  controls.handbrake
                    ? 'bg-rose-500 text-black shadow-[0_0_20px_#f43f5e] scale-95'
                    : 'bg-black/60 text-rose-400 border border-rose-500/40 active:bg-rose-600'
                }`}
              >
                <span>DRIFT / BRAKE</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
