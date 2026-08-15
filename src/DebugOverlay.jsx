import React, { useState, useEffect, useRef } from 'react';
import { Activity, Gauge, Navigation, Shield, Radio, Terminal, Cpu, Users } from 'lucide-react';
import { useAudio } from './AudioEngine.jsx';
import { useNetwork } from './NetworkEngine.jsx';

const ALL_STATES = [
  'IDLE',
  'RUNNING',
  'SPRINTING',
  'WALL_RUN_L',
  'WALL_RUN_R',
  'GRAPPLING',
  'SWINGING',
  'DIVING',
  'GLIDING',
  'MANTLING'
];

export function DebugOverlay({
  telemetry,
  isDrivingMode,
  isOpen = true,
  onToggle
}) {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const { bassLevel, midLevel, trebleLevel, activeTrack } = useAudio();
  const { roomCode, remotePeer, pingMs, playerIndex } = useNetwork();

  useEffect(() => {
    let animId;
    const calculateFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsUpdateRef.current >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
        setFps(currentFps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }
      animId = requestAnimationFrame(calculateFps);
    };
    animId = requestAnimationFrame(calculateFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-24 right-6 z-40 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-cyan-400 backdrop-blur-md hover:border-cyan-500/50 transition-all flex items-center gap-1.5 shadow-lg"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>HUD // TELEMETRY</span>
      </button>
    );
  }

  const speedKmh = telemetry?.speedKmh || 0;
  const speedVal = telemetry?.speed || 0;
  const speedMs = speedVal.toFixed(1);
  const currentState = telemetry?.state || (isDrivingMode ? 'CRUISING' : 'IDLE');
  const altitude = telemetry?.altitude !== undefined ? telemetry.altitude.toFixed(1) : '0.0';
  const grounded = telemetry?.grounded ?? true;
  const wallLeft = telemetry?.wallHitLeft ?? false;
  const wallRight = telemetry?.wallHitRight ?? false;
  const grappleDist = telemetry?.grappleDist ? telemetry.grappleDist.toFixed(1) : '0.0';

  // Kinematics percentage (normalized to 30 m/s max)
  const speedPct = Math.min(100, Math.round((speedVal / 30) * 100));
  const momentumG = (0.2 + (speedVal / 25) * 0.85).toFixed(2);

  return (
    <div className="fixed top-24 right-6 z-40 w-72 flex flex-col gap-3 font-mono text-xs text-zinc-300 pointer-events-auto select-none">
      {/* Top Header Row / Close Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Kinetic HUD</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-mono">
            FPS <span className={fps >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{fps}.0</span>
          </span>
          <button
            onClick={onToggle}
            className="text-zinc-500 hover:text-white text-xs px-1 hover:bg-white/10 rounded transition-colors"
            title="Minimize HUD"
          >
            ✕
          </button>
        </div>
      </div>

      {/* State Machine Card */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3.5 rounded-xl shadow-xl space-y-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider border-b border-white/5 pb-1 flex justify-between items-center">
          <span>State Machine</span>
          <span className="text-[9px] text-cyan-400/80">{isDrivingMode ? 'DRIVE_PHYSICS' : 'KINETIC_CORE'}</span>
        </div>

        {!isDrivingMode ? (
          <div className="space-y-1.5 pt-0.5">
            {['IDLE', 'RUNNING', 'WALL_RUN_L', 'WALL_RUN_R', 'GRAPPLING', 'DIVING', 'GLIDING'].map((st) => {
              const isActive =
                currentState === st ||
                (st === 'WALL_RUN_L' && currentState === 'WALL_RUNNING_LEFT') ||
                (st === 'WALL_RUN_R' && currentState === 'WALL_RUNNING_RIGHT') ||
                (st === 'RUNNING' && (currentState === 'RUNNING' || currentState === 'SPRINTING'));

              return (
                <div
                  key={st}
                  className={`flex justify-between items-center transition-all ${
                    isActive ? 'text-cyan-400 font-bold' : 'opacity-35 text-zinc-400'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider">{st}</span>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-white" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5 pt-0.5">
            {['CRUISING', 'ACCELERATING', 'DRIFTING', 'BRAKING', 'REVERSING'].map((st) => {
              const isActive =
                currentState === st ||
                (st === 'CRUISING' && currentState === 'IDLE') ||
                (st === 'ACCELERATING' && speedVal > 1);

              return (
                <div
                  key={st}
                  className={`flex justify-between items-center transition-all ${
                    isActive ? 'text-amber-400 font-bold' : 'opacity-35 text-zinc-400'
                  }`}
                >
                  <span className="text-[11px] uppercase tracking-wider">{st}</span>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse" />
                  ) : (
                    <div className="w-1 h-1 rounded-full bg-white" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kinematics Card */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3.5 rounded-xl shadow-xl">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Kinematics</div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-light tabular-nums text-white">
            {speedMs} <span className="text-[10px] text-zinc-500 ml-0.5">m/s</span>
          </div>
          <div className="text-xs text-zinc-400 tabular-nums">
            {speedKmh} <span className="text-[9px] text-zinc-500">km/h</span>
          </div>
        </div>

        {/* Speed Bar */}
        <div className="w-full bg-white/5 h-1 mt-2.5 rounded-full overflow-hidden">
          <div
            className="bg-cyan-500 h-full transition-all duration-75 shadow-[0_0_8px_#06b6d4]"
            style={{ width: `${Math.max(5, speedPct)}%` }}
          />
        </div>

        <div className="flex justify-between mt-2 text-[9px] uppercase text-zinc-500 tracking-tighter">
          <span>Momentum</span>
          <span className="text-cyan-400 font-bold">{momentumG} G</span>
        </div>
      </div>

      {/* Probes & Environment Probes Card */}
      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl text-[9px] space-y-1.5">
        <div className="text-zinc-500 uppercase border-b border-white/5 pb-1 flex justify-between">
          <span>Raycast Probes</span>
          <span className="text-zinc-600">Y: {altitude}m</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">LEFT_LAT:</span>
          <span className={wallLeft ? 'text-cyan-400 font-bold' : 'text-zinc-600'}>
            {wallLeft ? 'HIT [0.4m]' : 'MISS'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">RIGHT_LAT:</span>
          <span className={wallRight ? 'text-cyan-400 font-bold' : 'text-zinc-600'}>
            {wallRight ? 'HIT [0.4m]' : 'MISS'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">DOWN_RAY:</span>
          <span className={grounded ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
            {grounded ? 'GROUND_LOCK' : 'AIR'}
          </span>
        </div>
        {!isDrivingMode && grappleDist > 0 && (
          <div className="flex justify-between">
            <span className="text-zinc-500">TETHER:</span>
            <span className="text-cyan-300 font-bold">{grappleDist}m LOCKED</span>
          </div>
        )}
      </div>

      {/* Multiplayer Net Diagnostic Card (When connected) */}
      {roomCode && (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-3 rounded-xl shadow-xl text-[9px] space-y-1.5 font-mono">
          <div className="text-cyan-400 uppercase border-b border-cyan-500/20 pb-1 flex justify-between items-center font-bold">
            <span className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-cyan-400" />
              NET SESSION [{roomCode}]
            </span>
            <span className="text-emerald-400">{pingMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">ROLE:</span>
            <span className="text-white font-bold">PLAYER {playerIndex} (LOCAL)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">PEER STATUS:</span>
            <span className={remotePeer ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
              {remotePeer ? `CONNECTED [${remotePeer.state?.state || 'IDLE'}]` : 'WAITING FOR P2...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
