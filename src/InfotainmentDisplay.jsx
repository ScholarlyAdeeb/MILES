import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Upload, Radio, Users, Sparkles } from 'lucide-react';
import { useAudio } from './AudioEngine.jsx';
import { useNetwork } from './NetworkEngine.jsx';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function InfotainmentDisplay({ is3D = true, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const {
    activeTrack,
    playlist,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    bassLevel,
    midLevel,
    trebleLevel,
    currentLyric,
    nextLyric,
    togglePlay,
    selectTrack,
    nextTrack,
    prevTrack,
    seekTo,
    loadLocalAudioFile,
    setMasterVolume
  } = useAudio();

  const { roomCode, remotePeer } = useNetwork();
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      loadLocalAudioFile(file);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const content = (
    <div
      className="w-[440px] h-[190px] bg-[#07090e]/95 border border-white/[0.12] rounded-3xl p-4 shadow-2xl flex flex-col justify-between select-none overflow-hidden font-sans text-white relative backdrop-blur-3xl"
      style={{
        boxShadow: `0 20px 50px rgba(0, 0, 0, 0.95), inset 0 0 25px rgba(138, 43, 226, 0.12)`,
      }}
    >
      {/* Background ambient gradient glow matching music */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 bg-purple-600/15 rounded-full blur-2xl pointer-events-none transition-all duration-300"
        style={{ opacity: 0.3 + (bassLevel || 0) * 0.5 }}
      />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* Main Infotainment Card Row: Album Art + Track Info + Controls */}
      <div className="flex items-center gap-4 relative z-10">
        {/* Album Artwork with vinyl glow */}
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-violet-900/60 via-purple-950/80 to-black border border-white/20 shadow-lg flex items-center justify-center group">
          {activeTrack?.coverUrl ? (
            <img
              src={activeTrack.coverUrl}
              alt="Album Art"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-gradient-to-br from-violet-600/30 to-black">
              <Music className="w-6 h-6 text-purple-300" />
              <span className="text-[8px] font-mono text-purple-200 mt-1 uppercase tracking-tighter">MILES</span>
            </div>
          )}
          {/* Animated vinyl rotation indicator */}
          {isPlaying && (
            <div className="absolute inset-0 border-2 border-purple-400/40 rounded-2xl animate-pulse pointer-events-none" />
          )}
        </div>

        {/* Track Title, Artist, & Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="max-w-[200px]">
              <h2 className="text-sm font-bold text-white tracking-wide truncate">
                {activeTrack?.title || 'Gone Gone Gone'}
              </h2>
              <p className="text-xs text-zinc-400 font-light truncate">
                {activeTrack?.artist || 'MGK'}
              </p>
            </div>

            {/* Infotainment Playback Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevTrack}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
                title="Previous Track"
              >
                <SkipBack className="w-3 h-3" />
              </button>

              <button
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center font-bold shadow-lg transition-all active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-black" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-black translate-x-0.5" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all active:scale-95 border border-white/10"
                title="Next Track"
              >
                <SkipForward className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Time & Audio Waveform / Scrubber */}
          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="w-8 tabular-nums">{formatTime(currentTime)}</span>
            <div
              className="flex-1 h-3 flex items-center justify-center gap-0.5 cursor-pointer relative group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                seekTo(ratio * duration);
              }}
            >
              {/* Dynamic Animated Waveform Bars */}
              {Array.from({ length: 28 }).map((_, i) => {
                const percent = (i / 28) * 100;
                const isPast = percent <= progressPercent;
                // Height based on audio frequencies
                const baseH = Math.sin((i / 28) * Math.PI) * 10 + 3;
                const dynamicH = isPlaying
                  ? baseH + (i % 3 === 0 ? bassLevel * 8 : (i % 2 === 0 ? midLevel * 6 : trebleLevel * 5))
                  : baseH;
                return (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isPast
                        ? 'bg-purple-400 shadow-[0_0_6px_#c084fc]'
                        : 'bg-white/15 group-hover:bg-white/30'
                    }`}
                    style={{ height: `${Math.max(3, Math.min(16, dynamicH))}px` }}
                  />
                );
              })}
            </div>
            <span className="w-8 text-right tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Embedded In-Dashboard Synced Lyrics Banner */}
      <div className="relative z-10 px-3 py-1.5 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-between min-h-[32px] overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Sparkles className="w-3 h-3 text-purple-400 shrink-0 animate-pulse" />
          <p className="text-[11px] font-serif italic text-white/90 truncate tracking-wide">
            "{currentLyric || 'Night city drive frequencies playing...'}"
          </p>
        </div>

        {/* Hidden upload button for custom MP3s */}
        <div className="shrink-0 ml-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/mp3,audio/wav,audio/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[9px] font-mono text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-purple-500/40 transition-colors"
            title="Upload audio file"
          >
            CUSTOM MP3
          </button>
        </div>
      </div>
    </div>
  );

  if (!is3D) {
    return content;
  }

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Html
        transform
        distanceFactor={1.15}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      >
        {content}
      </Html>
    </group>
  );
}

export default InfotainmentDisplay;
