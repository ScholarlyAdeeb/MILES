import { useEffect, useRef } from "react";

// Keyboard + mouse-look input, returned as a stable mutable ref.
// No React state is touched per-frame for sub-millisecond responsiveness.
export function useInput(domTarget) {
  const input = useRef({
    forward: 0,
    strafe: 0,
    jump: false,
    jumpPressed: false,
    jumpReleased: false,
    jumpPressTime: -1e9,
    sprint: false,
    ctrl: false,
    down: false, // dive or backward
    grapple: false,
    grapplePressed: false,
    swing: false, // Shift or RMB hold
    swingPressed: false,
    zipPoint: false, // F or MMB (Zip to Point)
    zipPointPressed: false,
    webZip: false, // C or RMB tap (Web Zip air boost)
    webZipPressed: false,
    trick: false, // T or Shift+Ctrl (Air Acrobatics)
    yawDelta: 0,
    pitchDelta: 0,
    locked: false,
  });

  useEffect(() => {
    const i = input.current;
    const keys = new Set();
    let rmbDownTime = 0;

    const sync = () => {
      i.forward =
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      i.strafe =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      i.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
      i.ctrl = keys.has("ControlLeft") || keys.has("ControlRight");
      i.down = keys.has("KeyS") || keys.has("ArrowDown") || i.ctrl;
      i.trick = keys.has("KeyT") || (i.sprint && i.ctrl);
      i.swing = i.sprint || keys.has("ShiftLeft") || keys.has("ShiftRight");
    };

    const down = (e) => {
      // Don't capture inputs if user is typing in chat/input
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (
        [
          "Space",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "KeyF",
          "KeyC",
          "KeyT",
          "KeyE",
          "KeyQ",
          "ShiftLeft",
          "ShiftRight",
          "ControlLeft",
          "ControlRight",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      ) {
        // Only prevent default on game keys when not in text fields
        e.preventDefault();
      }

      if (keys.has(e.code)) return;
      keys.add(e.code);

      if (e.code === "Space") {
        i.jump = true;
        i.jumpPressed = true;
        i.jumpPressTime = performance.now();
      }
      if (e.code === "KeyF") {
        i.zipPoint = true;
        i.zipPointPressed = true;
      }
      if (e.code === "KeyC") {
        i.webZip = true;
        i.webZipPressed = true;
      }
      if (e.code === "KeyE" || e.code === "KeyQ") {
        i.grapple = true;
        i.grapplePressed = true;
      }
      sync();
    };

    const up = (e) => {
      keys.delete(e.code);
      if (e.code === "Space") {
        i.jump = false;
        i.jumpReleased = true;
      }
      if (e.code === "KeyF") i.zipPoint = false;
      if (e.code === "KeyC") i.webZip = false;
      if (e.code === "KeyE" || e.code === "KeyQ") i.grapple = false;
      sync();
    };

    const blur = () => {
      keys.clear();
      i.jump = false;
      i.grapple = false;
      i.zipPoint = false;
      i.webZip = false;
      sync();
    };

    const mousedown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.button === 0) {
        // Left Click -> Web Shoot / Grapple
        i.grapple = true;
        i.grapplePressed = true;
      } else if (e.button === 1) {
        // Middle Click -> Zip to Point (Ledge Target)
        e.preventDefault();
        i.zipPoint = true;
        i.zipPointPressed = true;
      } else if (e.button === 2) {
        // Right Click -> Web Swing (Hold) or Web Zip (Tap)
        e.preventDefault();
        rmbDownTime = performance.now();
        i.swing = true;
        i.swingPressed = true;
        i.grapple = true;
        i.grapplePressed = true;
      }
    };

    const mouseup = (e) => {
      if (e.button === 0) {
        i.grapple = false;
      } else if (e.button === 1) {
        i.zipPoint = false;
      } else if (e.button === 2) {
        i.swing = false;
        i.grapple = false;
        const duration = performance.now() - rmbDownTime;
        // If quick tap (< 220ms), trigger Web Zip air boost
        if (duration < 220) {
          i.webZip = true;
          i.webZipPressed = true;
        }
      }
    };

    const contextmenu = (e) => {
      // Prevent standard browser context menu on right-click in game canvas
      e.preventDefault();
    };

    const mousemove = (e) => {
      if (!i.locked) return;
      i.yawDelta -= e.movementX * 0.0022;
      i.pitchDelta -= e.movementY * 0.0018;
    };

    const lockChange = () => {
      i.locked = !!document.pointerLockElement;
    };

    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up, { passive: false });
    window.addEventListener("blur", blur);
    window.addEventListener("mousedown", mousedown);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("contextmenu", contextmenu);
    window.addEventListener("mousemove", mousemove);
    document.addEventListener("pointerlockchange", lockChange);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("mousedown", mousedown);
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("contextmenu", contextmenu);
      window.removeEventListener("mousemove", mousemove);
      document.removeEventListener("pointerlockchange", lockChange);
    };
  }, [domTarget]);

  return input;
}

export default useInput;

