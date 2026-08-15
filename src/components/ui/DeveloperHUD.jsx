import React, { useState, useEffect, useRef } from 'react';
import { player } from '../../playerState.js';

export function DeveloperHUD({ isVisible = false, onClose }) {
  const [fps, setFps] = useState(60);
  const [telemetry, setTelemetry] = useState({
    state: 'IDLE',
    speed: 0,
    speedKmh: 0,
    pos: [0, 0, 0],
    vel: [0, 0, 0],
    phase: 'GROUND',
    grounded: true,
    wallSide: 0,
    wallTimer: 0,
    anchor: null
  });

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());

  useEffect(() => {
    let animId;
    const updateLoop = () => {
      frameCountRef.current++;
      const now = performance.now();

      // Update FPS calculation every 500ms
      if (now - lastFpsUpdateRef.current >= 500) {
        const deltaSec = (now - lastFpsUpdateRef.current) / 1000;
        setFps(Math.round(frameCountRef.current / deltaSec));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;

        setTelemetry({
          state: player.state || 'IDLE',
          speed: (player.speed || 0).toFixed(2),
          speedKmh: Math.round((player.speed || 0) * 3.6),
          pos: [
            player.position[0].toFixed(1),
            player.position[1].toFixed(1),
            player.position[2].toFixed(1)
          ],
          vel: [
            player.velocity[0].toFixed(1),
            player.velocity[1].toFixed(1),
            player.velocity[2].toFixed(1)
          ],
          phase: player.phase || 'GROUND',
          grounded: !!player.grounded,
          wallSide: player.wallSide || 0,
          wallTimer: (player.wallTimer || 0).toFixed(2),
          anchor: player.anchor ? `[${player.anchor[0].toFixed(0)}, ${player.anchor[1].toFixed(0)}, ${player.anchor[2].toFixed(0)}]` : 'NONE'
        });
      }

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-6 z-50 pointer-events-auto select-none">
      <div className="w-80 bg-zinc-950/90 backdrop-blur-xl border border-zinc-700/60 rounded-xl p-4 shadow-2xl font-mono text-xs text-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-zinc-100 uppercase tracking-wider text-[11px]">
              ENGINE DIAGNOSTICS [F3]
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400">{fps} FPS</span>
        </div>

        {/* Diagnostic Key-Values */}
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">STATE MACHINE:</span>
            <span className="font-bold text-cyan-400">{telemetry.state}</span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">PHASE / GROUND:</span>
            <span className="font-bold text-amber-300">
              {telemetry.phase} · {telemetry.grounded ? 'GROUNDED' : 'AIR'}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">SPEED (M/S | KMH):</span>
            <span className="font-bold text-emerald-300">
              {telemetry.speed} m/s ({telemetry.speedKmh} km/h)
            </span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">POSITION (X,Y,Z):</span>
            <span className="text-zinc-200">
              {telemetry.pos[0]}, {telemetry.pos[1]}, {telemetry.pos[2]}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">VELOCITY VEC:</span>
            <span className="text-zinc-200">
              [{telemetry.vel[0]}, {telemetry.vel[1]}, {telemetry.vel[2]}]
            </span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">WALL PROBE CONTACT:</span>
            <span className="font-bold text-indigo-400">
              {telemetry.wallSide === -1 ? 'LEFT WALL' : telemetry.wallSide === 1 ? 'RIGHT WALL' : 'NONE'} ({telemetry.wallTimer}s)
            </span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">GRAPPLE TETHER:</span>
            <span className="text-pink-400">{telemetry.anchor}</span>
          </div>

          <div className="flex justify-between items-center py-1 px-2 rounded bg-zinc-900/70 border border-zinc-800/50">
            <span className="text-zinc-400">DRAW CALLS ESTIMATE:</span>
            <span className="text-zinc-300 font-bold">&lt; 35 Calls (Instanced)</span>
          </div>
        </div>

        {/* Close Button / Toggle Note */}
        <div className="mt-3.5 pt-2 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500">
          <span>Press F3 to toggle view</span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 hover:underline cursor-pointer"
            >
              Hide Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperHUD;
