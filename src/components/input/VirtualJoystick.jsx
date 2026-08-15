import React, { useRef, useState, useEffect } from 'react';

export function VirtualJoystick({ inputStateRef, onGrappleTrigger }) {
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [basePos, setBasePos] = useState({ x: 0, y: 0 });

  const joystickTouchIdRef = useRef(null);
  const rightTouchIdRef = useRef(null);
  const lastTouchTimeRef = useRef(0);
  const touchStartPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const isLeftHalf = touch.clientX < window.innerWidth * 0.48;

        if (isLeftHalf && joystickTouchIdRef.current === null) {
          // Left thumbstick anchor
          joystickTouchIdRef.current = touch.identifier;
          setBasePos({ x: touch.clientX, y: touch.clientY });
          setStickPos({ x: 0, y: 0 });
          setJoystickActive(true);
        } else if (!isLeftHalf && rightTouchIdRef.current === null) {
          // Right swipe / drag anchor
          rightTouchIdRef.current = touch.identifier;
          touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

          // Double tap detection for grapple release / shoot
          const now = performance.now();
          if (now - lastTouchTimeRef.current < 280) {
            if (inputStateRef?.current) {
              inputStateRef.current.grapplePressed = true;
            }
            if (onGrappleTrigger) onGrappleTrigger();
          }
          lastTouchTimeRef.current = now;
        }
      }
    };

    const handleTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        // Left Joystick Processing
        if (touch.identifier === joystickTouchIdRef.current) {
          const dx = touch.clientX - basePos.x;
          const dy = touch.clientY - basePos.y;
          const dist = Math.hypot(dx, dy);
          const maxRadius = 45;
          const clampedDist = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);

          const stickX = Math.cos(angle) * clampedDist;
          const stickY = Math.sin(angle) * clampedDist;

          setStickPos({ x: stickX, y: stickY });

          if (inputStateRef?.current) {
            inputStateRef.current.strafe = stickX / maxRadius;
            inputStateRef.current.forward = -stickY / maxRadius;
            inputStateRef.current.sprint = clampedDist > maxRadius * 0.85;
          }
        }

        // Right Swipe & Camera Orbit Processing
        if (touch.identifier === rightTouchIdRef.current) {
          const deltaX = touch.clientX - touchStartPosRef.current.x;
          const deltaY = touch.clientY - touchStartPosRef.current.y;

          if (inputStateRef?.current) {
            inputStateRef.current.yawDelta += deltaX * 0.0035;
            inputStateRef.current.pitchDelta -= deltaY * 0.0035;
          }

          // Gesture: Swipe UP (Jump / Vault)
          if (deltaY < -45 && inputStateRef?.current) {
            inputStateRef.current.jump = true;
            inputStateRef.current.jumpPressed = true;
          }
          // Gesture: Swipe DOWN (Dive / Slide)
          if (deltaY > 45 && inputStateRef?.current) {
            inputStateRef.current.down = true;
          }

          touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (touch.identifier === joystickTouchIdRef.current) {
          joystickTouchIdRef.current = null;
          setJoystickActive(false);
          setStickPos({ x: 0, y: 0 });
          if (inputStateRef?.current) {
            inputStateRef.current.forward = 0;
            inputStateRef.current.strafe = 0;
            inputStateRef.current.sprint = false;
          }
        }

        if (touch.identifier === rightTouchIdRef.current) {
          rightTouchIdRef.current = null;
          if (inputStateRef?.current) {
            inputStateRef.current.jump = false;
            inputStateRef.current.down = false;
            inputStateRef.current.jumpReleased = true;
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [basePos.x, basePos.y, inputStateRef, onGrappleTrigger]);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none">
      {/* Floating Virtual Joystick Visual Ring */}
      {joystickActive && (
        <div
          className="absolute rounded-full pointer-events-none flex items-center justify-center transition-opacity duration-150"
          style={{
            left: `${basePos.x - 50}px`,
            top: `${basePos.y - 50}px`,
            width: '100px',
            height: '100px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '2px solid rgba(255, 255, 255, 0.35)',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)'
          }}
        >
          {/* Thumb Nub */}
          <div
            className="rounded-full shadow-lg"
            style={{
              width: '42px',
              height: '42px',
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
              border: '2px solid #ffffff'
            }}
          />
        </div>
      )}

      {/* Right Screen Gesture Guide Prompt on Mobile */}
      <div className="absolute bottom-6 right-6 hidden md:hidden flex-col items-end text-[11px] text-zinc-400 font-mono space-y-1">
        <div>↑ SWIPE UP : JUMP</div>
        <div>↓ SWIPE DOWN : DIVE</div>
        <div>DOUBLE-TAP : GRAPPLE</div>
      </div>
    </div>
  );
}

export default VirtualJoystick;
