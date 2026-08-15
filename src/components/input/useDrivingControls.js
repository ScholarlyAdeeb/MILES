import { useState, useEffect, useRef } from 'react';

export function useDrivingControls() {
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    grapple: false,
    dive: false,
    handbrake: false,
    devMode: false,
    isMobile: false
  });

  // Reference for low-latency loop consumption without React re-render lags
  const inputStateRef = useRef({
    forward: 0,
    strafe: 0,
    jump: false,
    sprint: false,
    down: false,
    yawDelta: 0,
    pitchDelta: 0,
    jumpPressed: false,
    jumpReleased: false,
    grapplePressed: false
  });

  useEffect(() => {
    const checkMobile = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };

    setControls(prev => ({ ...prev, isMobile: checkMobile() }));

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      // F3 Developer Mode Toggle
      if (code === 'F3' || key === 'f3') {
        e.preventDefault();
        setControls(prev => ({ ...prev, devMode: !prev.devMode }));
        return;
      }

      setControls(prev => {
        let updated = { ...prev };
        if (key === 'w' || code === 'ArrowUp') updated.forward = true;
        if (key === 's' || code === 'ArrowDown') {
          updated.backward = true;
          updated.dive = true;
        }
        if (key === 'a' || code === 'ArrowLeft') updated.left = true;
        if (key === 'd' || code === 'ArrowRight') updated.right = true;
        if (code === 'ShiftLeft' || code === 'ShiftRight') updated.sprint = true;
        if (code === 'Space') {
          updated.jump = true;
          updated.grapple = true;
        }
        if (key === 'e' || key === 'q') updated.grapple = true;
        if (key === 'f') updated.handbrake = true;
        return updated;
      });

      // Update ref state
      if (key === 'w' || code === 'ArrowUp') inputStateRef.current.forward = 1;
      if (key === 's' || code === 'ArrowDown') {
        inputStateRef.current.forward = -1;
        inputStateRef.current.down = true;
      }
      if (key === 'a' || code === 'ArrowLeft') inputStateRef.current.strafe = -1;
      if (key === 'd' || code === 'ArrowRight') inputStateRef.current.strafe = 1;
      if (code === 'ShiftLeft' || code === 'ShiftRight') inputStateRef.current.sprint = true;
      if (code === 'Space') {
        inputStateRef.current.jump = true;
        inputStateRef.current.jumpPressed = true;
        inputStateRef.current.grapplePressed = true;
      }
      if (key === 'e' || key === 'q') {
        inputStateRef.current.grapplePressed = true;
      }
    };

    const handleKeyUp = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const code = e.code;
      const key = e.key.toLowerCase();

      setControls(prev => {
        let updated = { ...prev };
        if (key === 'w' || code === 'ArrowUp') updated.forward = false;
        if (key === 's' || code === 'ArrowDown') {
          updated.backward = false;
          updated.dive = false;
        }
        if (key === 'a' || code === 'ArrowLeft') updated.left = false;
        if (key === 'd' || code === 'ArrowRight') updated.right = false;
        if (code === 'ShiftLeft' || code === 'ShiftRight') updated.sprint = false;
        if (code === 'Space') {
          updated.jump = false;
          updated.grapple = false;
        }
        if (key === 'e' || key === 'q') updated.grapple = false;
        if (key === 'f') updated.handbrake = false;
        return updated;
      });

      if ((key === 'w' || code === 'ArrowUp') && inputStateRef.current.forward > 0) inputStateRef.current.forward = 0;
      if ((key === 's' || code === 'ArrowDown')) {
        if (inputStateRef.current.forward < 0) inputStateRef.current.forward = 0;
        inputStateRef.current.down = false;
      }
      if ((key === 'a' || code === 'ArrowLeft') && inputStateRef.current.strafe < 0) inputStateRef.current.strafe = 0;
      if ((key === 'd' || code === 'ArrowRight') && inputStateRef.current.strafe > 0) inputStateRef.current.strafe = 0;
      if (code === 'ShiftLeft' || code === 'ShiftRight') inputStateRef.current.sprint = false;
      if (code === 'Space') {
        inputStateRef.current.jump = false;
        inputStateRef.current.jumpReleased = true;
      }
    };

    const handleMouseMove = (e) => {
      if (document.pointerLockElement) {
        inputStateRef.current.yawDelta += e.movementX * 0.0022;
        inputStateRef.current.pitchDelta -= e.movementY * 0.0022;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return {
    controls,
    setControls,
    inputStateRef
  };
}

export default useDrivingControls;
