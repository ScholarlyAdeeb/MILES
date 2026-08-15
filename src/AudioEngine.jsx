import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNetwork } from './NetworkEngine.jsx';

// Preset music tracks with built-in procedural synthesis and synchronized lyrics
export const PRESET_TRACKS = [
  {
    id: 'midnight-mumbai',
    title: 'Midnight Marine Drive',
    artist: 'MILES Sonic Collective',
    genre: 'Synthwave / Night Drive',
    bpm: 110,
    duration: 180,
    lyrics: [
      { time: 0, text: "♩ (Atmospheric synth pads fade in over wet asphalt) ♩" },
      { time: 6, text: "Sodium streetlights bleeding amber in the rain" },
      { time: 12, text: "Twin turbos humming, washing out the pain" },
      { time: 18, text: "Over the Sea Link, skyline in the rear" },
      { time: 24, text: "Electric city whispers what you need to hear" },
      { time: 32, text: "Push the pedal down, watch the tachometer climb" },
      { time: 38, text: "Lost inside the frequency, frozen in time" },
      { time: 46, text: "♩ (Bassline drops - neon reflections shimmer) ♩" },
      { time: 54, text: "Roof to rooftop, cutting through the haze" },
      { time: 60, text: "Chasing distant signals through the urban maze" },
      { time: 68, text: "No red lights tonight, only open road" },
      { time: 76, text: "Let the midnight frequency carry the load" },
      { time: 90, text: "♩ (Arpeggiated synth solo swells across the horizon) ♩" },
      { time: 104, text: "Chai stall silhouettes fading in the mist" },
      { time: 112, text: "Every turn a memory we couldn't resist" },
      { time: 120, text: "Hold the wheel steady, keep the tempo high" },
      { time: 130, text: "Just you and the sound beneath a carbon sky" }
    ]
  },
  {
    id: 'neon-monsoon',
    title: 'Neon Monsoon (Cyber Lofi)',
    artist: 'Aether Drift',
    genre: 'Chillhop / Cyber Beats',
    bpm: 88,
    duration: 160,
    lyrics: [
      { time: 0, text: "♩ (Vinyl crackle & rain falling on windshield) ♩" },
      { time: 8, text: "Rain drops racing on the tinted glass" },
      { time: 16, text: "Another shadow highway letting minutes pass" },
      { time: 24, text: "Low frequency pulse keeping us awake" },
      { time: 32, text: "Every single turn is a choice we make" },
      { time: 42, text: "♩ (Smooth rhodes chords & warm sub bass) ♩" },
      { time: 52, text: "Grappling through the towers, wind against the skin" },
      { time: 60, text: "Where the concrete ends is where the beats begin" },
      { time: 70, text: "Warm chai steam rising through the night" },
      { time: 80, text: "Everything looks golden in the sodium light" },
      { time: 95, text: "♩ (Vocal chop melody & mellow groove) ♩" },
      { time: 110, text: "Gliding through the canyon made of steel and glass" },
      { time: 120, text: "Watching all the neon city phantoms pass" }
    ]
  },
  {
    id: 'cyber-express',
    title: 'Cyberabad Overdrive',
    artist: 'Kinetics & Resonance',
    genre: 'Darksynth / Kinetic',
    bpm: 126,
    duration: 195,
    lyrics: [
      { time: 0, text: "♩ (Aggressive analog sequence boots up) ♩" },
      { time: 5, text: "System online. Inertia dampeners nominal." },
      { time: 10, text: "Zero to eighty in the blink of a street" },
      { time: 16, text: "Feel the asphalt vibration tapping to the beat" },
      { time: 22, text: "Wall run locked on the glass facade" },
      { time: 28, text: "Defying gravity with every single squad" },
      { time: 36, text: "♩ (Distorted 808 drop & rapid hi-hats) ♩" },
      { time: 44, text: "Swing line tension at ninety percent" },
      { time: 50, text: "Every millimeter was an accent meant" },
      { time: 58, text: "Full throttle velocity, breaking through the fog" },
      { time: 66, text: "Rewriting the trajectory in the digital log" },
      { time: 78, text: "♩ (Full kinetic overdrive sequence) ♩" }
    ]
  }
];

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(PRESET_TRACKS[0].duration);
  const [volume, setVolume] = useState(0.85);
  const [customAudioUrl, setCustomAudioUrl] = useState(null);
  const [customTrackInfo, setCustomTrackInfo] = useState(null);
  const [bassLevel, setBassLevel] = useState(0);
  const [midLevel, setMidLevel] = useState(0);
  const [trebleLevel, setTrebleLevel] = useState(0);
  const [currentLyric, setCurrentLyric] = useState('');
  const [nextLyric, setNextLyric] = useState('');
  const [activeLyricIndex, setActiveLyricIndex] = useState(0);
  const [lyricProgress, setLyricProgress] = useState(0);
  const [isNetworkSynced, setIsNetworkSynced] = useState(false);
  const [playlist, setPlaylist] = useState(PRESET_TRACKS);

  const { broadcastAudioSync, onAudioSync, roomCode } = useNetwork();

  const audioRef = useRef(null);
  const webAudioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const synthLoopRef = useRef(null);
  const isSynthPlayingRef = useRef(false);
  const animFrameRef = useRef(null);
  const isApplyingRemoteSyncRef = useRef(false);

  // Initialize Web Audio Context on first interaction
  const initWebAudio = useCallback(() => {
    if (!webAudioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        const gainNode = ctx.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(ctx.destination);
        analyser.connect(gainNode);

        webAudioCtxRef.current = ctx;
        analyserRef.current = analyser;
        gainNodeRef.current = gainNode;
      }
    }
    if (webAudioCtxRef.current && webAudioCtxRef.current.state === 'suspended') {
      webAudioCtxRef.current.resume();
    }
  }, [volume]);

  // Procedural Web Audio Synthesizer for instant zero-dependency high quality music
  const startProceduralSynth = useCallback((trackId, bpm) => {
    initWebAudio();
    const ctx = webAudioCtxRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    // Stop previous loop
    if (synthLoopRef.current) {
      clearInterval(synthLoopRef.current);
      synthLoopRef.current = null;
    }

    isSynthPlayingRef.current = true;

    // Musical scale: D minor / Cyber Pentatonic [D, F, G, A, C]
    const rootFreq = trackId === 'midnight-mumbai' ? 73.42 : trackId === 'neon-monsoon' ? 65.41 : 82.41; // D2, C2, E2
    const scaleMultipliers = [1, 1.2, 1.333, 1.5, 1.777, 2, 2.4, 2.666, 3];
    let step = 0;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th notes

    // Master bus for synth
    const synthBus = ctx.createGain();
    synthBus.gain.value = 0.35;
    synthBus.connect(analyser);

    // Delay & Reverb emulation
    const delay = ctx.createDelay();
    delay.delayTime.value = (60 / bpm) * 0.75;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.35;
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1800;

    delay.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delay);
    delayFilter.connect(synthBus);

    const playKick = (time) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);
      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      osc.connect(gain);
      gain.connect(synthBus);
      osc.start(time);
      osc.stop(time + 0.2);
    };

    const playSnare = (time) => {
      // Noise + tone
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.25, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(synthBus);
      noiseGain.connect(delay);
      whiteNoise.start(time);
      whiteNoise.stop(time + 0.15);
    };

    const playHihat = (time, open = false) => {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 8500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(open ? 0.15 : 0.07, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + (open ? 0.08 : 0.03));
      src.connect(filter);
      filter.connect(g);
      g.connect(synthBus);
      src.start(time);
      src.stop(time + 0.1);
    };

    const playBassNote = (freq, time, len) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = 'sawtooth';
      osc2.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 0.5, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, time);
      filter.frequency.exponentialRampToValueAtTime(160, time + len);

      g.gain.setValueAtTime(0.35, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + len);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(g);
      g.connect(synthBus);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + len);
      osc2.stop(time + len);
    };

    const playArpNote = (freq, time, len) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);

      g.gain.setValueAtTime(0.2, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + len);

      osc.connect(filter);
      filter.connect(g);
      g.connect(synthBus);
      g.connect(delay);

      osc.start(time);
      osc.stop(time + len);
    };

    let timer = setInterval(() => {
      if (!isSynthPlayingRef.current) return;
      const now = ctx.currentTime;
      const beat16 = step % 16;
      const bar = Math.floor(step / 16);

      // Kick drum on 0, 4, 8, 12 (4-on-the-floor) or broken beat
      if (trackId === 'neon-monsoon') {
        if (beat16 === 0 || beat16 === 7 || beat16 === 10) playKick(now);
        if (beat16 === 4 || beat16 === 12) playSnare(now);
      } else {
        if (beat16 === 0 || beat16 === 4 || beat16 === 8 || beat16 === 12) playKick(now);
        if (beat16 === 4 || beat16 === 12) playSnare(now);
      }

      // Hi-hats
      if (beat16 % 2 === 0) playHihat(now, beat16 === 2 || beat16 === 10);

      // Bassline progression (4-bar chords)
      const chordRoots = [1, 1.2, 0.888, 1.333];
      const chordRoot = chordRoots[bar % chordRoots.length] * rootFreq;

      if (beat16 % 4 === 0 || beat16 % 4 === 2) {
        playBassNote(chordRoot, now, 0.22);
      }

      // Arpeggiator line
      const arpPatterns = [0, 2, 4, 7, 5, 3, 2, 1, 0, 4, 7, 9, 7, 4, 2, 1];
      const noteIdx = arpPatterns[beat16];
      const arpFreq = chordRoot * 4 * (scaleMultipliers[noteIdx % scaleMultipliers.length] || 1);
      playArpNote(arpFreq, now, 0.16);

      step++;
    }, stepDurationMs);

    synthLoopRef.current = timer;
  }, [initWebAudio]);

  const stopProceduralSynth = useCallback(() => {
    isSynthPlayingRef.current = false;
    if (synthLoopRef.current) {
      clearInterval(synthLoopRef.current);
      synthLoopRef.current = null;
    }
  }, []);

  // Update real-time audio analysis (FFT spectrum data)
  useEffect(() => {
    let active = true;
    const dataArray = new Uint8Array(64);

    const updateAudioMetrics = () => {
      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate frequency bands
        let bassSum = 0;
        let midSum = 0;
        let trebSum = 0;

        for (let i = 0; i < 6; i++) bassSum += dataArray[i];
        for (let i = 6; i < 20; i++) midSum += dataArray[i];
        for (let i = 20; i < 50; i++) trebSum += dataArray[i];

        setBassLevel(bassSum / (6 * 255));
        setMidLevel(midSum / (14 * 255));
        setTrebleLevel(trebSum / (30 * 255));
      } else {
        setBassLevel(0);
        setMidLevel(0);
        setTrebleLevel(0);
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(updateAudioMetrics);
      }
    };

    updateAudioMetrics();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Sync lyrics based on currentTime with high-resolution index and lookahead
  useEffect(() => {
    const currentTrack = customTrackInfo || playlist[currentTrackIndex];
    if (currentTrack && currentTrack.lyrics && currentTrack.lyrics.length > 0) {
      let matchedIdx = 0;
      for (let i = currentTrack.lyrics.length - 1; i >= 0; i--) {
        if (currentTime >= currentTrack.lyrics[i].time) {
          matchedIdx = i;
          break;
        }
      }

      const activeEntry = currentTrack.lyrics[matchedIdx];
      const nextEntry = currentTrack.lyrics[matchedIdx + 1] || null;

      setActiveLyricIndex(matchedIdx);
      setCurrentLyric(activeEntry?.text || '');
      setNextLyric(nextEntry ? nextEntry.text : '');

      // Calculate progress percentage within the current lyric segment
      if (activeEntry) {
        const nextTime = nextEntry ? nextEntry.time : (activeEntry.time + 8);
        const segmentDuration = Math.max(1, nextTime - activeEntry.time);
        const elapsed = Math.max(0, currentTime - activeEntry.time);
        setLyricProgress(Math.min(1, elapsed / segmentDuration));
      } else {
        setLyricProgress(0);
      }
    } else {
      setActiveLyricIndex(0);
      setCurrentLyric(customTrackInfo ? `♫ Playing: ${customTrackInfo.title}` : '♫ Night Drive Traversal ♫');
      setNextLyric('');
      setLyricProgress(0);
    }
  }, [currentTime, currentTrackIndex, customTrackInfo, playlist]);

  // Timer loop for procedural tracks or audio element updates
  useEffect(() => {
    let timer = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (customAudioUrl && audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          setDuration(audioRef.current.duration || 180);
        } else {
          setCurrentTime(prev => {
            const curTrack = playlist[currentTrackIndex];
            const maxD = curTrack ? curTrack.duration : 180;
            if (prev >= maxD) {
              // Loop track
              return 0;
            }
            return prev + 0.25;
          });
        }
      }, 250);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, customAudioUrl, currentTrackIndex, playlist]);

  // Select Track (with optional network broadcast)
  const selectTrack = useCallback((index, broadcast = true) => {
    initWebAudio();
    stopProceduralSynth();
    if (customAudioUrl && audioRef.current) {
      audioRef.current.pause();
    }
    setCustomAudioUrl(null);
    setCustomTrackInfo(null);
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    const newTrack = playlist[index];
    setDuration(newTrack.duration || 180);
    setIsPlaying(true);
    startProceduralSynth(newTrack.id, newTrack.bpm || 110);

    if (broadcast && broadcastAudioSync) {
      broadcastAudioSync({
        action: 'SELECT_TRACK',
        trackIndex: index,
        isPlaying: true,
        currentTime: 0
      });
    }
  }, [initWebAudio, stopProceduralSynth, customAudioUrl, playlist, startProceduralSynth, broadcastAudioSync]);

  // Play / Pause toggle (with optional network broadcast)
  const togglePlay = useCallback((broadcast = true) => {
    initWebAudio();
    if (isPlaying) {
      if (customAudioUrl && audioRef.current) {
        audioRef.current.pause();
      } else {
        stopProceduralSynth();
      }
      setIsPlaying(false);

      if (broadcast && broadcastAudioSync) {
        broadcastAudioSync({
          action: 'PAUSE',
          trackIndex: currentTrackIndex,
          isPlaying: false,
          currentTime
        });
      }
    } else {
      if (customAudioUrl && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play error:', e));
      } else {
        const curTrack = playlist[currentTrackIndex];
        startProceduralSynth(curTrack.id, curTrack.bpm || 110);
      }
      setIsPlaying(true);

      if (broadcast && broadcastAudioSync) {
        broadcastAudioSync({
          action: 'PLAY',
          trackIndex: currentTrackIndex,
          isPlaying: true,
          currentTime
        });
      }
    }
  }, [initWebAudio, isPlaying, customAudioUrl, playlist, currentTrackIndex, startProceduralSynth, stopProceduralSynth, broadcastAudioSync, currentTime]);

  // Next Track
  const nextTrack = useCallback((broadcast = true) => {
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    selectTrack(nextIdx, broadcast);
  }, [currentTrackIndex, playlist.length, selectTrack]);

  // Prev Track
  const prevTrack = useCallback((broadcast = true) => {
    const prevIdx = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    selectTrack(prevIdx, broadcast);
  }, [currentTrackIndex, playlist.length, selectTrack]);

  // Seek (with optional network broadcast)
  const seekTo = useCallback((timeSec, broadcast = true) => {
    setCurrentTime(timeSec);
    if (customAudioUrl && audioRef.current) {
      audioRef.current.currentTime = timeSec;
    }

    if (broadcast && broadcastAudioSync) {
      broadcastAudioSync({
        action: 'SEEK',
        trackIndex: currentTrackIndex,
        isPlaying,
        currentTime: timeSec
      });
    }
  }, [customAudioUrl, broadcastAudioSync, currentTrackIndex, isPlaying]);

  // Handle incoming network audio sync from co-op peer or room state
  useEffect(() => {
    if (!onAudioSync) return;

    const unsubscribe = onAudioSync((syncPayload) => {
      if (!syncPayload) return;

      isApplyingRemoteSyncRef.current = true;
      setIsNetworkSynced(true);

      const {
        action,
        trackIndex: remoteTrackIndex,
        isPlaying: remoteIsPlaying,
        currentTime: remoteTime,
        timestamp = Date.now()
      } = syncPayload;

      // Compensate for transmission latency
      const networkLatencySec = Math.max(0, (Date.now() - timestamp) / 1000);
      const targetTime = remoteIsPlaying ? Math.max(0, (remoteTime || 0) + networkLatencySec) : (remoteTime || 0);

      // 1. Reconcile Track
      if (typeof remoteTrackIndex === 'number' && remoteTrackIndex !== currentTrackIndex && remoteTrackIndex >= 0 && remoteTrackIndex < playlist.length) {
        initWebAudio();
        stopProceduralSynth();
        if (customAudioUrl && audioRef.current) {
          audioRef.current.pause();
        }
        setCustomAudioUrl(null);
        setCustomTrackInfo(null);
        setCurrentTrackIndex(remoteTrackIndex);
        const newTrack = playlist[remoteTrackIndex];
        setDuration(newTrack.duration || 180);
        setCurrentTime(targetTime);

        if (remoteIsPlaying) {
          setIsPlaying(true);
          startProceduralSynth(newTrack.id, newTrack.bpm || 110);
        } else {
          setIsPlaying(false);
        }
      } else {
        // 2. Reconcile Play/Pause state
        if (typeof remoteIsPlaying === 'boolean' && remoteIsPlaying !== isPlaying) {
          initWebAudio();
          if (remoteIsPlaying) {
            const curTrack = playlist[currentTrackIndex];
            startProceduralSynth(curTrack.id, curTrack.bpm || 110);
            setIsPlaying(true);
          } else {
            stopProceduralSynth();
            setIsPlaying(false);
          }
        }

        // 3. Reconcile Time Drift (±200ms threshold)
        if (typeof remoteTime === 'number') {
          const drift = Math.abs(currentTime - targetTime);
          if (drift > 0.2) { // 200ms tolerance gate
            setCurrentTime(targetTime);
            if (customAudioUrl && audioRef.current) {
              audioRef.current.currentTime = targetTime;
            }
          }
        }
      }

      setTimeout(() => {
        isApplyingRemoteSyncRef.current = false;
      }, 50);
    });

    return unsubscribe;
  }, [
    onAudioSync,
    currentTrackIndex,
    isPlaying,
    currentTime,
    playlist,
    customAudioUrl,
    initWebAudio,
    startProceduralSynth,
    stopProceduralSynth
  ]);

  // Handle local MP3 / WAV file upload
  const loadLocalAudioFile = useCallback((file) => {
    if (!file) return;
    initWebAudio();
    stopProceduralSynth();

    const objectUrl = URL.createObjectURL(file);
    setCustomAudioUrl(objectUrl);

    // Extract title without extension
    const title = file.name.replace(/\.[^/.]+$/, "");
    const customInfo = {
      id: 'custom-' + Date.now(),
      title: title || 'Local Audio Track',
      artist: 'User Upload (Local MP3)',
      genre: 'Custom Audio',
      duration: 180,
      lyrics: [
        { time: 0, text: `♫ Now playing: ${title} ♫` },
        { time: 10, text: "Urban exploration in rhythm with your sound" },
        { time: 25, text: "Night drive reflections bouncing on the hood" },
        { time: 45, text: "Full kinetic freedom through the neon streets" }
      ]
    };
    setCustomTrackInfo(customInfo);
    setCurrentTime(0);

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = objectUrl;
        audioRef.current.load();
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          // Connect audio element to web audio analyser
          if (webAudioCtxRef.current && analyserRef.current && !sourceNodeRef.current) {
            try {
              const src = webAudioCtxRef.current.createMediaElementSource(audioRef.current);
              src.connect(analyserRef.current);
              sourceNodeRef.current = src;
            } catch (e) {
              console.log('MediaElementSource already attached or CORS', e);
            }
          }
        }).catch(err => console.log('Upload playback failed:', err));
      }
    }, 100);
  }, [initWebAudio, stopProceduralSynth]);

  // Adjust volume
  const setMasterVolume = useCallback((val) => {
    setVolume(val);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val;
    }
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  }, []);

  const activeTrack = customTrackInfo || playlist[currentTrackIndex];

  return (
    <AudioContext.Provider
      value={{
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
        activeLyricIndex,
        lyricProgress,
        isNetworkSynced,
        togglePlay,
        selectTrack,
        nextTrack,
        prevTrack,
        seekTo,
        loadLocalAudioFile,
        setMasterVolume
      }}
    >
      {/* Hidden audio element for custom file uploads */}
      <audio
        ref={audioRef}
        onEnded={nextTrack}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
      />
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
