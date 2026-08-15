import React, { useState } from 'react';
import { useNetwork } from './NetworkEngine.jsx';
import {
  Users,
  Copy,
  Check,
  Radio,
  ArrowRight,
  LogOut,
  Sparkles,
  Wifi,
  ShieldAlert,
  Share2
} from 'lucide-react';

export function RoomModal() {
  const {
    roomCode,
    playerIndex,
    remotePeer,
    pingMs,
    errorMessage,
    isRoomModalOpen,
    setIsRoomModalOpen,
    createRoom,
    joinRoom,
    leaveRoom
  } = useNetwork();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isRoomModalOpen) return null;

  const handleCopyLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (inputCode.trim().length > 0) {
      joinRoom(inputCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none font-sans">
      <div className="w-full max-w-lg bg-[#08080a] border border-white/15 rounded-2xl p-6 shadow-2xl shadow-black space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsRoomModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-lg text-white">
                TWO-PLAYER CO-OP NETWORKING
              </h2>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                PHASE 2
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Zero-latency client physics with 40Hz transform synchronization
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STATE A: CURRENTLY IN AN ACTIVE ROOM */}
        {roomCode ? (
          <div className="space-y-4">
            {/* Room Code Card */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                <span>ACTIVE SESSION CODE</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  ONLINE ({pingMs}ms)
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-black/60 p-3 rounded-xl border border-white/10">
                <div className="font-mono text-2xl font-black tracking-widest text-cyan-400">
                  {roomCode}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-white transition-all active:scale-95"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'COPIED' : 'CODE'}</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold text-xs font-mono transition-all hover:bg-cyan-400 active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    title="Copy Invite URL"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>INVITE LINK</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Players Presence Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Local Player Card */}
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30 space-y-1 font-mono">
                <div className="text-[10px] text-cyan-400 uppercase font-bold flex items-center justify-between">
                  <span>YOU (LOCAL)</span>
                  <span className="text-zinc-500">P{playerIndex}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {playerIndex === 1 ? 'HOST [CYAN RUNNER]' : 'GUEST [CYAN RUNNER]'}
                </div>
                <div className="text-[10px] text-emerald-400">● 60 FPS Physics Active</div>
              </div>

              {/* Remote Peer Card */}
              <div
                className={`p-3 rounded-xl border space-y-1 font-mono transition-all ${
                  remotePeer
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-black/20 border-white/5 opacity-60'
                }`}
              >
                <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center justify-between">
                  <span>REMOTE PEER</span>
                  <span>P{playerIndex === 1 ? 2 : 1}</span>
                </div>
                {remotePeer ? (
                  <>
                    <div className="text-sm font-bold text-amber-300">
                      CONNECTED [RUNNER]
                    </div>
                    <div className="text-[10px] text-amber-400/90 truncate">
                      State: {remotePeer.state?.state || 'IDLE'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-zinc-400 italic">Waiting for Player 2...</div>
                    <div className="text-[10px] text-zinc-500">Share code or link to join</div>
                  </>
                )}
              </div>
            </div>

            {/* Leave Room Button */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={leaveRoom}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-mono text-rose-300 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>DISCONNECT / LEAVE ROOM</span>
              </button>

              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono text-white transition-all font-bold"
              >
                CONTINUE TRAVERSAL
              </button>
            </div>
          </div>
        ) : (
          /* STATE B: LOBBY (CREATE OR JOIN) */
          <div className="space-y-4">
            {/* Create Room Box */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>HOST A NEW SESSION</span>
              </div>
              <p className="text-xs text-zinc-400">
                Generate a unique room code to invite a second runner or driver to traverse the city with you in real time.
              </p>
              <button
                onClick={createRoom}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-98"
              >
                CREATE PRIVATE ROOM
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
              <div className="flex-1 h-px bg-white/10" />
              <span>OR JOIN EXISTING</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Join Room Form */}
            <form onSubmit={handleJoinSubmit} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER 6-DIGIT CODE (E.G. ML-8X9)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 uppercase tracking-wider"
                />
                <button
                  type="submit"
                  disabled={!inputCode.trim()}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-mono font-bold text-white transition-all disabled:opacity-40 flex items-center gap-1.5"
                >
                  <span>JOIN</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
