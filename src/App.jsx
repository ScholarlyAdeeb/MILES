import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { AudioProvider } from './AudioEngine.jsx';
import { NetworkProvider } from './NetworkEngine.jsx';
import { useDrivingControls } from './components/input/useDrivingControls.js';
import { VirtualJoystick } from './components/input/VirtualJoystick.jsx';
import { UIOverlayManager } from './components/ui/UIOverlayManager.jsx';
import { DriveScene } from './DriveScene.jsx';
import { timeOfDayState, computeAtmosphere, toggleDayNightMode } from './timeOfDayState.js';

function ExperienceContent() {
  const [isDrivingMode, setIsDrivingMode] = useState(false); // Default to Traversal Mode
  const [isDayMode, setIsDayMode] = useState(timeOfDayState.isDayMode);
  const [isDevMode, setIsDevMode] = useState(false);
  const [cameraView, setCameraView] = useState('cockpit');
  const [telemetry, setTelemetry] = useState(null);

  const { controls, setControls, inputStateRef } = useDrivingControls();
  const canvasContainerRef = useRef(null);

  // Sync day mode continuously with timeOfDayState
  useEffect(() => {
    const interval = setInterval(() => {
      const atmo = computeAtmosphere(timeOfDayState.currentT);
      if (atmo.isDayMode !== isDayMode) {
        setIsDayMode(atmo.isDayMode);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [isDayMode]);

  // Sync devMode from controls if toggled by F3
  useEffect(() => {
    if (controls.devMode !== isDevMode) {
      setIsDevMode(controls.devMode);
    }
  }, [controls.devMode, isDevMode]);

  // Global Pointer Lock for Mouse Look during Traversal
  const requestPointerLock = () => {
    if (!isDrivingMode && canvasContainerRef.current) {
      canvasContainerRef.current.requestPointerLock?.();
    }
  };

  return (
    <div
      className="relative w-full h-full bg-[#05070c] text-white font-sans overflow-hidden select-none"
      onClick={requestPointerLock}
    >
      {/* 1. Spider-Verse Post-Processing Canvas Quad */}
      <div className="absolute inset-0 z-0" ref={canvasContainerRef}>
        <Canvas
          shadows
          camera={{ position: [0, 5, 8], fov: 60, near: 0.1, far: 350 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
          }}
        >
          <DriveScene
            isDrivingMode={isDrivingMode}
            controls={controls}
            cameraView={cameraView}
            onTelemetryUpdate={setTelemetry}
            isDayMode={isDayMode}
          />
        </Canvas>
      </div>

      {/* 2. Spider-Verse Aim Crosshair (In Traversal Mode) */}
      {!isDrivingMode && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="relative flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
            <div className="absolute w-6 h-6 border border-zinc-400/40 rounded-full" />
          </div>
        </div>
      )}

      {/* 3. Mobile Virtual Joystick & Gesture Surface */}
      <VirtualJoystick
        inputStateRef={inputStateRef}
        onGrappleTrigger={() => {
          if (inputStateRef.current) {
            inputStateRef.current.grapplePressed = true;
          }
        }}
      />

      {/* 4. Minimalist Production Glassmorphic UI & Developer HUD */}
      <UIOverlayManager
        devMode={isDevMode}
        onToggleDevMode={() => setIsDevMode(prev => !prev)}
        isDrivingMode={isDrivingMode}
        onToggleDrivingMode={() => setIsDrivingMode(prev => !prev)}
      />
    </div>
  );
}

export function App() {
  return (
    <NetworkProvider>
      <AudioProvider>
        <ExperienceContent />
      </AudioProvider>
    </NetworkProvider>
  );
}

export default App;
