import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack,
  Layers, Sun, Moon, Sunset, CloudSun, Sparkles, Users, Radio,
  RotateCw, Sliders
} from 'lucide-react';
import { useAudio } from '../../AudioEngine.jsx';
import { useNetwork } from '../../NetworkEngine.jsx';
import DeveloperHUD from './DeveloperHUD.jsx';
import { LyricHUD } from '../../LyricHUD.jsx';
import { RoomModal } from '../../RoomModal.jsx';
import TraversalControlsHUD from './TraversalControlsHUD.jsx';
import { 
  timeOfDayState, 
  TIME_PRESETS, 
  setTargetTimeOfDay, 
  toggleTimeAutoCycle, 
  toggleDayNightMode,
  computeAtmosphere 
} from '../../timeOfDayState.js';

export function UIOverlayManager({
  devMode = false,
  onToggleDevMode,
  isDrivingMode = false,
  onToggleDrivingMode
}) {
  const {
    activeTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo
  } = useAudio();

  const { isConnected, connectedPeers, setIsRoomModalOpen, isRoomModalOpen } = useNetwork();

  const [showLyrics, setShowLyrics] = useState(false);
  const [timeString, setTimeString] = useState('12:30 PM');
  const [showTimeOfDayPanel, setShowTimeOfDayPanel] = useState(false);
  const [timeT, setTimeT] = useState(timeOfDayState.currentT);
  const [isAutoCycle, setIsAutoCycle] = useState(timeOfDayState.autoCycle);
  const [activePreset, setActivePreset] = useState(timeOfDayState.preset);

  // Sync continuous time-of-day UI slider & badges
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeT(timeOfDayState.currentT);
      setIsAutoCycle(timeOfDayState.autoCycle);
      setActivePreset(timeOfDayState.preset);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Format real-world / atmospheric time
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formatted = `${hours % 12 || 12}:${mins} ${ampm}`;
      setTimeString(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const atmo = computeAtmosphere(timeT);
  const isDay = atmo.isDayMode;

  const getPhaseIcon = (size = 16) => {
    if (timeT < 0.15) return <Sun size={size} className="text-amber-300" />;
    if (timeT < 0.38) return <Sunset size={size} className="text-orange-400" />;
    if (timeT < 0.65) return <CloudSun size={size} className="text-rose-400" />;
    if (timeT < 0.88) return <Moon size={size} className="text-cyan-400" />;
    return <Sparkles size={size} className="text-indigo-300" />;
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP STATUS BAR (Glassmorphic Bar)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between pointer-events-auto relative">
        {/* Top-Left: Minimal Wordmark */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-zinc-950/75 backdrop-blur-xl px-4 py-2 rounded-full border border-zinc-800/80 shadow-lg">
            <span className="font-extrabold text-lg tracking-widest text-zinc-100 font-display">
              MILES<span className="text-red-500">.</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 font-mono tracking-wider">
              {isDay ? 'DAYLIGHT' : 'NIGHT'}
            </span>
          </div>

          {/* Dev Mode Badge Indicator */}
          <button
            onClick={onToggleDevMode}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border ${
              devMode 
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Press F3 to toggle diagnostics"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${devMode ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            <span>DEV [F3]</span>
          </button>
        </div>

        {/* Top-Center: Atmospheric Location & Clock */}
        <div className="hidden md:flex items-center space-x-2 bg-zinc-950/75 backdrop-blur-xl px-4 py-2 rounded-full border border-zinc-800/80 text-xs font-mono text-zinc-300 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${isDay ? 'bg-amber-400' : 'bg-cyan-400'} animate-pulse`} />
          <span className="font-semibold text-zinc-100 tracking-wider">
            SECTOR 7 // {atmo.phaseName}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">{timeString}</span>
        </div>

        {/* Top-Right: [ Quick Day/Night ] [ Time-of-Day Slider ] [ 👤 2 ] [ ⋯ ] Session & Mode Controls */}
        <div className="flex items-center space-x-2">
          {/* Quick Day / Night Toggle Button */}
          <button
            onClick={() => {
              toggleDayNightMode();
            }}
            className={`h-10 px-3.5 rounded-full backdrop-blur-xl border flex items-center space-x-2 transition-all shadow-lg cursor-pointer ${
              isDay
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
            }`}
            title={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
          >
            {isDay ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-400" />}
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              {isDay ? 'DAY' : 'NIGHT'}
            </span>
          </button>

          {/* Time-of-Day Transition Trigger Button */}
          <button
            onClick={() => setShowTimeOfDayPanel(prev => !prev)}
            className={`h-10 px-3.5 rounded-full bg-zinc-950/80 backdrop-blur-xl border flex items-center space-x-2 transition-all shadow-lg cursor-pointer ${
              showTimeOfDayPanel 
                ? 'border-cyan-500/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]' 
                : 'border-zinc-800/80 text-zinc-300 hover:text-zinc-100 hover:border-zinc-700'
            }`}
            title="Time-of-Day Presets & Continuous Lighting Scrub"
          >
            {getPhaseIcon(15)}
            <span className="text-xs font-mono font-medium hidden sm:inline">
              {atmo.phaseName}
            </span>
            {isAutoCycle && (
              <RotateCw size={12} className="animate-spin text-cyan-400" />
            )}
          </button>

          {/* Multiplayer Co-Op Session [ 👤 2 ] */}
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="h-10 px-3.5 rounded-full bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 flex items-center space-x-2 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors shadow-lg cursor-pointer"
            title="Co-Op Session"
          >
            <Users size={16} className={isConnected ? 'text-emerald-400' : 'text-zinc-400'} />
            <span className="text-xs font-mono font-medium">
              {connectedPeers?.length ? `${connectedPeers.length + 1}` : '1'}
            </span>
          </button>

          {/* Drive / Traversal Mode Switcher [ ⋯ ] */}
          <button
            onClick={onToggleDrivingMode}
            className="h-10 px-3.5 rounded-full bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 flex items-center space-x-2 text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition-colors shadow-lg cursor-pointer"
            title={isDrivingMode ? 'Switch to Kinetic Traversal Mode' : 'Switch to Cockpit Drive Mode'}
          >
            <Radio size={16} className={isDrivingMode ? 'text-red-400' : 'text-cyan-400'} />
            <span className="text-xs font-mono uppercase tracking-wider">
              {isDrivingMode ? 'DRIVE' : 'TRAVERSAL'}
            </span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TIME-OF-DAY STATE MANAGER POPOVER PANEL
        ───────────────────────────────────────────────────────────── */}
        {showTimeOfDayPanel && (
          <div className="absolute right-0 top-14 w-84 bg-zinc-950/92 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-4 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div className="flex items-center space-x-2">
                <Sliders size={14} className="text-cyan-400" />
                <span className="text-xs font-bold tracking-wider text-zinc-200 uppercase font-mono">
                  Atmosphere & Sun
                </span>
              </div>
              <button
                onClick={() => {
                  const running = toggleTimeAutoCycle();
                  setIsAutoCycle(running);
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all border ${
                  isAutoCycle
                    ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title="Automatically advance atmosphere over time"
              >
                <RotateCw size={11} className={isAutoCycle ? 'animate-spin' : ''} />
                <span>Auto-Cycle</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2 my-3">
              {Object.values(TIME_PRESETS).map((p) => {
                const isActive = Math.abs(timeT - p.value) < 0.13;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setTargetTimeOfDay(p.value, p.id);
                      setActivePreset(p.id);
                    }}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-zinc-800/90 border-cyan-500/70 text-zinc-100 shadow-md ring-1 ring-cyan-500/40'
                        : 'bg-zinc-900/50 border-zinc-800/70 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        {p.id === 'DAY' && <Sun size={12} className="text-amber-400" />}
                        {p.id === 'DUSK' && <Sunset size={12} className="text-orange-400" />}
                        {p.id === 'TWILIGHT' && <CloudSun size={12} className="text-rose-400" />}
                        {p.id === 'NIGHT' && <Moon size={12} className="text-cyan-400" />}
                        {p.id === 'DEEP_NIGHT' && <Sparkles size={12} className="text-indigo-400" />}
                        <span className="text-xs font-bold font-mono uppercase tracking-wide">
                          {p.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {Math.round(p.value * 100)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 leading-tight">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Continuous Lerp Scrubber */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span className="flex items-center space-x-1">
                  <Sun size={12} className="text-amber-400" />
                  <span>Day (0%)</span>
                </span>
                <span className="text-cyan-300 font-bold">
                  {Math.round(timeT * 100)}%
                </span>
                <span className="flex items-center space-x-1">
                  <span>Deep Night</span>
                  <Sparkles size={12} className="text-indigo-300" />
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={timeT}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setTargetTimeOfDay(val);
                  setTimeT(val);
                }}
                className="w-full h-2 bg-gradient-to-r from-sky-400 via-amber-500 via-purple-600 to-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Live Lighting Telemetry Metrics */}
            <div className="mt-3 pt-2.5 border-t border-zinc-900 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400">
              <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                <span className="text-zinc-500 block">Sunlight Intensity:</span>
                <span className="text-amber-300 font-bold">
                  {atmo.dirLightIntensity.toFixed(1)}x Lux
                </span>
              </div>
              <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                <span className="text-zinc-500 block">Atmosphere Mode:</span>
                <span className="text-cyan-300 font-bold">
                  {atmo.isDayMode ? 'Day Architecture' : 'Night Neon Grid'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SYNCHRONIZED LYRICS FLOATING HUD
      ───────────────────────────────────────────────────────────── */}
      {showLyrics && (
        <div className="w-full flex justify-center mb-4 pointer-events-none">
          <LyricHUD isDrivingMode={isDrivingMode} />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. BOTTOM-CENTER: COLLAPSED GLASS MUSIC PLAYER (25% WIDTH)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full flex justify-center pointer-events-auto">
        <div className="w-full max-w-sm sm:w-80 md:w-96 bg-zinc-950/85 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-3.5 shadow-2xl transition-all duration-200 hover:border-zinc-700">
          <div className="flex items-center justify-between space-x-3">
            {/* Track Info */}
            <div className="flex items-center space-x-3 overflow-hidden min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-tr from-red-500/20 to-cyan-500/20 ${isPlaying ? 'animate-pulse' : ''}`} />
                <span className="text-base">🎵</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-zinc-100 truncate">
                  {activeTrack?.title || 'Midnight Marine Drive'}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  {activeTrack?.artist || 'MILES Sonic Collective'}
                </div>
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <button
                onClick={prevTrack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack size={15} />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <button
                onClick={nextTrack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                title="Next Track"
              >
                <SkipForward size={15} />
              </button>
              <button
                onClick={() => setShowLyrics(!showLyrics)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  showLyrics ? 'text-cyan-400 bg-cyan-950/50' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Toggle Synchronized Lyrics HUD"
              >
                <Layers size={15} />
              </button>
            </div>
          </div>

          {/* Mini Interactive Scrubber */}
          <div className="mt-2.5 flex items-center space-x-2">
            <span className="text-[10px] font-mono text-zinc-500 w-7 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="relative flex-1 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seekTo(ratio * (duration || 180));
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-red-400 transition-all rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-500 w-7">
              {formatTime(duration || 180)}
            </span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. SPIDER-VERSE CONTROLS CHEATSHEET & LIVE TRICK/ENERGY HUD
      ───────────────────────────────────────────────────────────── */}
      <TraversalControlsHUD isDrivingMode={isDrivingMode} />

      {/* ─────────────────────────────────────────────────────────────
          5. DEVELOPER MODE HUD (F3)
      ───────────────────────────────────────────────────────────── */}
      <DeveloperHUD isVisible={devMode} onClose={onToggleDevMode} />

      {/* ─────────────────────────────────────────────────────────────
          6. MULTIPLAYER CO-OP SESSION MODAL
      ───────────────────────────────────────────────────────────── */}
      {isRoomModalOpen && <RoomModal />}
    </div>
  );
}

export default UIOverlayManager;
