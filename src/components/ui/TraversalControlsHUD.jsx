import React, { useState, useEffect } from 'react';
import { player, STATES } from '../../playerState.js';
import { Zap, Compass, Wind, ShieldAlert, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

export function TraversalControlsHUD({ isDrivingMode = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hudState, setHudState] = useState({
    state: STATES.IDLE,
    speedKmh: 0,
    jumpChargeRatio: 0,
    trickScore: 0,
    trickName: '',
    zipLaunchWindow: 0
  });

  // Track live player state values for HUD rendering
  useEffect(() => {
    const interval = setInterval(() => {
      setHudState({
        state: player.state,
        speedKmh: Math.round(player.speed * 3.6),
        jumpChargeRatio: player.jumpChargeRatio,
        trickScore: player.trickScore,
        trickName: player.trickName,
        zipLaunchWindow: player.zipLaunchWindow
      });
    }, 45);
    return () => clearInterval(interval);
  }, []);

  if (isDrivingMode) return null;

  return (
    <div className="fixed bottom-6 left-6 pointer-events-auto z-20 flex flex-col items-start space-y-2 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. CHARGE JUMP / POINT LAUNCH / TRICK POPUP
      ───────────────────────────────────────────────────────────── */}
      {hudState.jumpChargeRatio > 0.05 && (
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-red-500/80 rounded-2xl p-3 shadow-2xl flex items-center space-x-3 text-zinc-100 animate-in fade-in zoom-in-95">
          <Zap size={18} className="text-red-500 animate-bounce" />
          <div>
            <div className="text-[11px] font-mono font-bold tracking-widest text-red-400 uppercase">
              POTENTIAL ENERGY // CHARGED JUMP
            </div>
            <div className="w-48 h-2 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 transition-all"
                style={{ width: `${Math.round(hudState.jumpChargeRatio * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">
            {Math.round(hudState.jumpChargeRatio * 100)}%
          </span>
        </div>
      )}

      {hudState.zipLaunchWindow > 0 && (
        <div className="bg-amber-950/90 backdrop-blur-xl border border-amber-400 rounded-2xl px-4 py-2 shadow-2xl flex items-center space-x-2 text-amber-300 animate-bounce">
          <Sparkles size={16} />
          <span className="text-xs font-mono font-extrabold tracking-wider">
            TAP [SPACE] // POINT LAUNCH BOOST!
          </span>
        </div>
      )}

      {hudState.trickScore > 0 && (
        <div className="bg-zinc-950/90 backdrop-blur-xl border border-cyan-500/70 rounded-2xl px-4 py-2 shadow-2xl flex items-center space-x-3 text-cyan-300 animate-in fade-in">
          <Wind size={16} className="animate-spin" />
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase">
              {hudState.trickName || 'AIR ACROBATICS'}
            </div>
            <div className="text-sm font-black font-mono tracking-widest text-cyan-200">
              +{hudState.trickScore} XP
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. COMPACT SPIDER-VERSE CONTROLS CHEAT SHEET
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-3.5 shadow-2xl transition-all duration-200 hover:border-zinc-700 w-76">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold font-mono tracking-wider text-zinc-200 uppercase">
              Spider Controls
            </span>
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer transition-colors"
            title={collapsed ? 'Expand Controls' : 'Collapse Controls'}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {!collapsed && (
          <div className="grid grid-cols-1 gap-1.5 pt-2 text-[11px] font-mono text-zinc-300">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Move / Parkour:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-200">
                WASD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Sprint / Vault:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-red-400 font-bold">
                Shift + W
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Jump / Launch:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-200">
                Space
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Charged Jump:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-amber-300">
                Shift+Ctrl+Space
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Dive & Boost:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-cyan-300">
                Ctrl (In Air)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Web Swing:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-cyan-300">
                Shift / RMB (Hold)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Zip to Point:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-amber-300">
                F / Middle Click
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Web Zip Boost:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-cyan-300">
                C / RMB (Tap)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Air Tricks:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-pink-400">
                T + WASD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Wall Run:</span>
              <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-emerald-400">
                Shift + Wall
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TraversalControlsHUD;
