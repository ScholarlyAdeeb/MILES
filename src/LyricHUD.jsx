import React, { useState, useEffect, useRef } from 'react';
import { Music, Radio, Volume2, Users, ChevronUp, ChevronDown, Sparkles, Disc3 } from 'lucide-react';
import { useAudio } from './AudioEngine.jsx';
import { useNetwork } from './NetworkEngine.jsx';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function LyricHUD({ isDrivingMode }) {
  const {
    activeTrack,
    currentLyric,
    nextLyric,
    activeLyricIndex,
    lyricProgress,
    currentTime,
    duration,
    isPlaying,
    isNetworkSynced,
    seekTo,
    bassLevel
  } = useAudio();

  const { roomCode, remotePeer, pingMs } = useNetwork();
  const [isExpanded, setIsExpanded] = useState(false);
  const lyricsListRef = useRef(null);

  // Auto-scroll expanded lyrics list to keep active line centered
  useEffect(() => {
    if (isExpanded && lyricsListRef.current) {
      const activeEl = lyricsListRef.current.querySelector(`[data-lyric-index="${activeLyricIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex, isExpanded]);

  if (!activeTrack) return null;

  return (
    <div
      id="lyric-hud-container"
      className="absolute top-20 left-1/2 -translate-x-1/2 z-20 w-full max-w-xl px-4 pointer-events-auto select-none transition-all duration-300"
    >
      <div
        className={`bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
          isExpanded ? 'p-4' : 'p-3'
        }`}
        style={{
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, ${0.05 + bassLevel * 0.15})`
        }}
      >
        {/* Top Header Pill Row */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/40 shrink-0">
              <Disc3
                className={`w-3.5 h-3.5 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`}
                style={{ animationDuration: '4s' }}
              />
            </div>
            <div className="min-w-0 truncate flex items-center gap-1.5 font-mono text-[11px]">
              <span className="font-bold text-white tracking-wide truncate">
                {activeTrack.title}
              </span>
              <span className="text-zinc-500 font-light hidden sm:inline truncate">
                — {activeTrack.artist}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Shared Audio Session Pill */}
            {roomCode && (
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono tracking-wider ${
                  remotePeer
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                }`}
                title="Shared Audio Clock Synchronized with Co-Op Peer"
              >
                <Users className="w-2.5 h-2.5" />
                <span>{remotePeer ? 'CO-OP SYNC' : 'ROOM AUDIO'}</span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    remotePeer ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                  }`}
                />
              </div>
            )}

            {/* Expand / Collapse Full LRC List */}
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title={isExpanded ? 'Collapse Lyric HUD' : 'Expand Full Synced Lyrics'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Minimal Mode (Active Lyric & Next Preview) */}
        {!isExpanded && (
          <div className="pt-2 space-y-1 text-center">
            {/* Active Lyric Line */}
            <div className="relative py-0.5">
              <p
                className="text-sm sm:text-base font-serif font-medium text-white tracking-wide transition-all duration-200 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                style={{
                  color: isPlaying ? '#ffffff' : '#a1a1aa'
                }}
              >
                "{currentLyric || '♫ Frequencies Streaming ♫'}"
              </p>

              {/* Progress Line Underneath */}
              <div className="w-24 h-0.5 mx-auto mt-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-150 shadow-[0_0_6px_#22d3ee]"
                  style={{ width: `${Math.round(lyricProgress * 100)}%` }}
                />
              </div>
            </div>

            {/* Next Lyric Preview */}
            {nextLyric && (
              <p className="text-[10px] sm:text-[11px] font-mono text-zinc-500 truncate transition-opacity duration-300">
                Next: {nextLyric}
              </p>
            )}
          </div>
        )}

        {/* Expanded Mode (Full LRC Scrollable Lyrics) */}
        {isExpanded && (
          <div className="pt-3 space-y-3">
            <div
              ref={lyricsListRef}
              className="max-h-56 overflow-y-auto space-y-2 pr-1 font-serif text-sm scrollbar-thin scrollbar-thumb-zinc-700"
            >
              {activeTrack.lyrics && activeTrack.lyrics.length > 0 ? (
                activeTrack.lyrics.map((lyr, idx) => {
                  const isActive = idx === activeLyricIndex;
                  const isPast = idx < activeLyricIndex;
                  return (
                    <div
                      key={idx}
                      data-lyric-index={idx}
                      onClick={() => seekTo(lyr.time)}
                      className={`cursor-pointer px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-cyan-500/20 border border-cyan-500/40 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : isPast
                          ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex-1 leading-snug">
                        {lyr.text}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-600 shrink-0">
                        {formatTime(lyr.time)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-zinc-500 py-6 text-xs font-mono">
                  No timestamped LRC lyrics available for this audio file.
                </div>
              )}
            </div>

            {/* Bottom time and scrubber notice */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-white/5 pt-2">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span className="text-cyan-400/80">Click any lyric to seek both players</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
