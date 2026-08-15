import { useState, useEffect, useRef, useCallback } from 'react';

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
    headlights: true,
    cameraView: 'cockpit', // 'cockpit', 'chase', 'hood' in Drive mode; 'tps', 'cinematic' in Traversal
    isMobile: false,
  });

  // Jump buffer & key press timestamps for precise timing
  const jumpBufferedUntilRef = useRef(0);
  const touchStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    grapple: false,
    dive: false,
    handbrake: false
  });

  useEffect(() => {
    // Detect mobile device or touch capabilities
    const checkMobile = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };

    setControls(prev => ({ ...prev, isMobile: checkMobile() }));

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      const key = e.key.toLowerCase();
      const code = e.code;

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
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
        if (key === 'shift') updated.sprint = true;
        if (code === 'Space') {
          updated.jump = true;
          jumpBufferedUntilRef.current = Date.now() + 150; // 150ms jump buffer
        }
        if (key === 'e' || key === 'f' || key === 'q') updated.grapple = true;
        if (key === ' ') updated.handbrake = true;
        if (key === 'l' || key === 'h') updated.headlights = !prev.headlights;

        return updated;
      });
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      const code = e.code;

      setControls(prev => {
        let updated = { ...prev };

        if (key === 'w' || code === 'ArrowUp') updated.forward = false;
        if (key === 's' || code === 'ArrowDown') {
          updated.backward = false;
          updated.dive = false;
        }
        if (key === 'a' || code === 'ArrowLeft') updated.left = false;
        if (key === 'd' || code === 'ArrowRight') updated.right = false;
        if (key === 'shift') updated.sprint = false;
        if (code === 'Space') updated.jump = false;
        if (key === 'e' || key === 'f' || key === 'q') updated.grapple = false;
        if (key === ' ') updated.handbrake = false;

        return updated;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set mobile touch action
  const setTouchControl = useCallback((action, value) => {
    touchStateRef.current[action] = value;
    if (action === 'jump' && value) {
      jumpBufferedUntilRef.current = Date.now() + 150;
    }
    setControls(prev => ({
      ...prev,
      [action]: value
    }));
  }, []);

  // Helper to consume jump buffer
  const consumeJumpBuffer = useCallback(() => {
    const isBuffered = Date.now() <= jumpBufferedUntilRef.current;
    if (isBuffered) {
      jumpBufferedUntilRef.current = 0;
      return true;
    }
    return false;
  }, []);

  return {
    controls,
    setTouchControl,
    consumeJumpBuffer,
    jumpBufferedUntilRef
  };
}
