import * as THREE from 'three';

export const TIME_PRESETS = {
  DAY: { 
    id: 'DAY', 
    label: 'Day', 
    value: 0.0, 
    icon: 'Sun', 
    description: 'Bright blue sky, golden daylight sun & crisp urban architecture' 
  },
  DUSK: { 
    id: 'DUSK', 
    label: 'Dusk', 
    value: 0.25, 
    icon: 'Sunset', 
    description: 'Golden hour & crimson violet skyline' 
  },
  TWILIGHT: { 
    id: 'TWILIGHT', 
    label: 'Twilight', 
    value: 0.5, 
    icon: 'CloudSun', 
    description: 'Deep purple & rose afterglow' 
  },
  NIGHT: { 
    id: 'NIGHT', 
    label: 'Night', 
    value: 0.75, 
    icon: 'Moon', 
    description: 'Vibrant neon metropolis' 
  },
  DEEP_NIGHT: { 
    id: 'DEEP_NIGHT', 
    label: 'Deep Night', 
    value: 1.0, 
    icon: 'Sparkles', 
    description: 'Obsidian midnight & high-contrast cyan/yellow glow' 
  }
};

// Singleton mutable time-of-day state for zero-allocation useFrame updates
export const timeOfDayState = {
  currentT: 0.0,         // Default to DAY (0.0) as requested
  targetT: 0.0,          // Target time value to lerp towards
  lerpSpeed: 2.2,        // Speed of smooth transitions (units/sec)
  autoCycle: false,      // Whether time of day smoothly advances automatically
  cycleSpeed: 0.02,      // Speed of auto-cycle progression (~50s full cycle)
  preset: 'DAY'          // Active preset key
};

// Helper color interpolation utilities
function lerpColor(c1Hex, c2Hex, alpha) {
  const c1 = new THREE.Color(c1Hex);
  const c2 = new THREE.Color(c2Hex);
  return c1.lerp(c2, alpha);
}

function multiStopColorLerp(stops, t) {
  // stops: array of { t: number, color: string }
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (clampedT >= s0.t && clampedT <= s1.t) {
      const localAlpha = (clampedT - s0.t) / (s1.t - s0.t);
      return lerpColor(s0.color, s1.color, localAlpha);
    }
  }
  return new THREE.Color(stops[stops.length - 1].color);
}

function multiStopFloatLerp(stops, t) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (clampedT >= s0.t && clampedT <= s1.t) {
      const localAlpha = (clampedT - s0.t) / (s1.t - s0.t);
      return THREE.MathUtils.lerp(s0.val, s1.val, localAlpha);
    }
  }
  return stops[stops.length - 1].val;
}

// Compute all atmospheric parameters based on continuous time t (0.0: Day -> 0.25: Dusk -> 0.5: Twilight -> 0.75: Night -> 1.0: Deep Night)
export function computeAtmosphere(t) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 1);

  // 1. Sky & Background Color
  const skyColor = multiStopColorLerp([
    { t: 0.0, color: '#38bdf8' },  // Day: Crisp vibrant sky blue
    { t: 0.15, color: '#60a5fa' }, // Late Afternoon: Azure blue
    { t: 0.25, color: '#d946ef' }, // Dusk: Warm magenta-sunset
    { t: 0.50, color: '#1e1b4b' }, // Twilight: Deep indigo
    { t: 0.75, color: '#0b1120' }, // Night: Midnight slate-blue
    { t: 1.0, color: '#040711' }   // Deep Night: Obsidian cyan-black
  ], clampedT);

  // 2. Fog Color & Density
  const fogColor = multiStopColorLerp([
    { t: 0.0, color: '#7dd3fc' },  // Day: Soft sky haze
    { t: 0.15, color: '#93c5fd' }, // Late Afternoon haze
    { t: 0.25, color: '#701a75' }, // Sunset violet-rose haze
    { t: 0.50, color: '#2a1740' }, // Twilight purple haze
    { t: 0.75, color: '#0f172a' }, // Night slate fog
    { t: 1.0, color: '#060a14' }   // Deep night dark navy fog
  ], clampedT);

  const fogDensity = multiStopFloatLerp([
    { t: 0.0, val: 0.0018 },       // Clear crisp visibility in day mode
    { t: 0.25, val: 0.0024 },
    { t: 0.50, val: 0.0028 },
    { t: 0.75, val: 0.0032 },
    { t: 1.0, val: 0.0036 }
  ], clampedT);

  // 3. Directional Celestial Light (Sun/Moon)
  const dirLightColor = multiStopColorLerp([
    { t: 0.0, color: '#fffbeb' },  // Day: Bright warm golden sunlight
    { t: 0.15, color: '#fef08a' }, // Late afternoon sun
    { t: 0.25, color: '#fb923c' }, // Golden sunset
    { t: 0.50, color: '#f472b6' }, // Rose lavender afterglow
    { t: 0.75, color: '#818cf8' }, // Cobalt moonlight
    { t: 1.0, color: '#93c5fd' }   // Starlight ice blue
  ], clampedT);

  const dirLightIntensity = multiStopFloatLerp([
    { t: 0.0, val: 3.2 },          // Strong crisp sunlight in Day mode
    { t: 0.15, val: 2.8 },
    { t: 0.25, val: 2.4 },
    { t: 0.50, val: 1.6 },
    { t: 0.75, val: 1.2 },
    { t: 1.0, val: 0.85 }
  ], clampedT);

  // Sun position: High overhead in Day (y=160, z=60), arcs down to sunset horizon at Dusk (y=40), arcs up to Moon (y=130)
  let dirLightPos;
  if (clampedT < 0.25) {
    const localT = clampedT / 0.25;
    dirLightPos = [
      THREE.MathUtils.lerp(70, 95, localT),
      THREE.MathUtils.lerp(160, 45, localT),
      THREE.MathUtils.lerp(60, 75, localT)
    ];
  } else {
    const localT = (clampedT - 0.25) / 0.75;
    dirLightPos = [
      THREE.MathUtils.lerp(95, 45, localT),
      THREE.MathUtils.lerp(45, 125, localT),
      THREE.MathUtils.lerp(75, -45, localT)
    ];
  }

  // 4. Hemisphere Light (Sky vs Ground reflection)
  const hemiSkyColor = multiStopColorLerp([
    { t: 0.0, color: '#ffffff' },  // Day: Pure white sky light
    { t: 0.25, color: '#f43f5e' }, // Warm rose sky
    { t: 0.50, color: '#c084fc' }, // Violet sky
    { t: 0.75, color: '#38bdf8' }, // Cyan night sky
    { t: 1.0, color: '#60a5fa' }   // Deep blue
  ], clampedT);

  const hemiGroundColor = multiStopColorLerp([
    { t: 0.0, color: '#64748b' },  // Day: Slate ground bounce
    { t: 0.25, color: '#3b0764' }, // Deep plum ground
    { t: 0.50, color: '#1e1b4b' }, // Midnight ground
    { t: 0.75, color: '#090d16' }, // Dark asphalt
    { t: 1.0, color: '#020617' }   // Pitch black ground
  ], clampedT);

  const hemiIntensity = multiStopFloatLerp([
    { t: 0.0, val: 1.6 },          // Vibrant sky fill in daytime
    { t: 0.25, val: 1.3 },
    { t: 0.50, val: 1.1 },
    { t: 0.75, val: 0.9 },
    { t: 1.0, val: 0.7 }
  ], clampedT);

  // 5. Ambient Base Lighting
  const ambientIntensity = multiStopFloatLerp([
    { t: 0.0, val: 0.72 },         // Clear ambient visibility during Day
    { t: 0.25, val: 0.54 },
    { t: 0.50, val: 0.42 },
    { t: 0.75, val: 0.32 },
    { t: 1.0, val: 0.20 }
  ], clampedT);

  // 6. Horizon Neon Accent Point Lights (active at dusk/night, subtle in day)
  const horizonLights = [
    {
      pos: [0, 50, -120],
      color: multiStopColorLerp([
        { t: 0.0, color: '#ffffff' },
        { t: 0.25, color: '#f97316' },
        { t: 0.50, color: '#ec4899' },
        { t: 0.75, color: '#38bdf8' },
        { t: 1.0, color: '#06b6d4' }
      ], clampedT),
      intensity: multiStopFloatLerp([
        { t: 0.0, val: 0.0 },       // Off during day
        { t: 0.25, val: 2.2 },
        { t: 0.50, val: 3.5 },
        { t: 0.75, val: 4.8 },
        { t: 1.0, val: 5.8 }
      ], clampedT),
      distance: 220
    },
    {
      pos: [-60, 45, -60],
      color: multiStopColorLerp([
        { t: 0.0, color: '#ffffff' },
        { t: 0.25, color: '#fbbf24' },
        { t: 0.50, color: '#f43f5e' },
        { t: 0.75, color: '#f59e0b' },
        { t: 1.0, color: '#fbbf24' }
      ], clampedT),
      intensity: multiStopFloatLerp([
        { t: 0.0, val: 0.0 },
        { t: 0.25, val: 1.8 },
        { t: 0.50, val: 2.8 },
        { t: 0.75, val: 3.8 },
        { t: 1.0, val: 4.8 }
      ], clampedT),
      distance: 180
    },
    {
      pos: [60, 45, -60],
      color: multiStopColorLerp([
        { t: 0.0, color: '#ffffff' },
        { t: 0.25, color: '#e11d48' },
        { t: 0.50, color: '#a855f7' },
        { t: 0.75, color: '#ec4899' },
        { t: 1.0, color: '#d946ef' }
      ], clampedT),
      intensity: multiStopFloatLerp([
        { t: 0.0, val: 0.0 },
        { t: 0.25, val: 1.8 },
        { t: 0.50, val: 2.8 },
        { t: 0.75, val: 3.8 },
        { t: 1.0, val: 4.8 }
      ], clampedT),
      distance: 180
    },
    {
      pos: [0, 20, 60],
      color: multiStopColorLerp([
        { t: 0.0, color: '#ffffff' },
        { t: 0.25, color: '#c084fc' },
        { t: 0.50, color: '#818cf8' },
        { t: 0.75, color: '#a855f7' },
        { t: 1.0, color: '#6366f1' }
      ], clampedT),
      intensity: multiStopFloatLerp([
        { t: 0.0, val: 0.0 },
        { t: 0.25, val: 1.4 },
        { t: 0.50, val: 2.4 },
        { t: 0.75, val: 3.2 },
        { t: 1.0, val: 4.2 }
      ], clampedT),
      distance: 150
    }
  ];

  // 7. Dynamic Window Lights Multipliers
  // Day mode: windows are reflective and soft (~0.05 intensity)
  // Night: window lights illuminate the street canyon (~1.4x intensity)
  const windowLightIntensityMult = multiStopFloatLerp([
    { t: 0.0, val: 0.04 },
    { t: 0.25, val: 0.45 },
    { t: 0.50, val: 0.75 },
    { t: 0.75, val: 1.10 },
    { t: 1.0, val: 1.45 }
  ], clampedT);

  // Overall label & color theme for UI badges
  let phaseName = 'DAY';
  if (clampedT >= 0.15 && clampedT < 0.38) phaseName = 'DUSK';
  else if (clampedT >= 0.38 && clampedT < 0.65) phaseName = 'TWILIGHT';
  else if (clampedT >= 0.65 && clampedT < 0.88) phaseName = 'NIGHT';
  else if (clampedT >= 0.88) phaseName = 'DEEP NIGHT';

  const isDayMode = clampedT < 0.22;

  return {
    t: clampedT,
    isDayMode,
    phaseName,
    skyColor,
    fogColor,
    fogDensity,
    dirLightColor,
    dirLightIntensity,
    dirLightPos,
    hemiSkyColor,
    hemiGroundColor,
    hemiIntensity,
    ambientIntensity,
    horizonLights,
    windowLightIntensityMult
  };
}

export function setTargetTimeOfDay(val, presetKey = null) {
  timeOfDayState.targetT = THREE.MathUtils.clamp(val, 0, 1);
  if (presetKey) {
    timeOfDayState.preset = presetKey;
  } else {
    // Auto-detect closest preset
    let closestKey = 'DAY';
    let minDiff = 999;
    for (const [k, p] of Object.entries(TIME_PRESETS)) {
      const diff = Math.abs(p.value - val);
      if (diff < minDiff) {
        minDiff = diff;
        closestKey = k;
      }
    }
    timeOfDayState.preset = closestKey;
  }
}

export function toggleTimeAutoCycle() {
  timeOfDayState.autoCycle = !timeOfDayState.autoCycle;
  return timeOfDayState.autoCycle;
}

export function toggleDayNightMode() {
  if (timeOfDayState.targetT < 0.3) {
    // Switch to Night
    setTargetTimeOfDay(0.75, 'NIGHT');
    return false;
  } else {
    // Switch to Day
    setTargetTimeOfDay(0.0, 'DAY');
    return true;
  }
}
