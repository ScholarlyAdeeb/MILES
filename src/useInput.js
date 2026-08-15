import { useEffect, useRef } from "react";

// Keyboard + mouse-look input, returned as a stable mutable ref.
// No React state is touched per-frame.
export function useInput(domTarget) {
  const input = useRef({
    forward: 0,
    strafe: 0,
    jump: false,
    jumpPressed: false,
    jumpReleased: false,
    jumpPressTime: -1e9,
    sprint: false,
    down: false, // S / ArrowDown -> dive
    grapple: false,
    grapplePressed: false,
    yawDelta: 0,
    pitchDelta: 0,
    locked: false,
  });

  useEffect(() => {
    const i = input.current;
    const keys = new Set();

    const sync = () => {
      i.forward =
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0);
      i.strafe =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0);
      i.sprint = keys.has("ShiftLeft") || keys.has("ShiftRight");
      i.down = keys.has("KeyS") || keys.has("ArrowDown");
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
      sync();
    };

    const up = (e) => {
      keys.delete(e.code);
      if (e.code === "Space") {
        i.jump = false;
        i.jumpReleased = true;
      }
      sync();
    };

    const blur = () => {
      keys.clear();
      i.jump = false;
      sync();
    };

    const mousedown = (e) => {
      if (e.button === 0) {
        i.grapple = true;
        i.grapplePressed = true;
      }
    };

    const mouseup = (e) => {
      if (e.button === 0) i.grapple = false;
    };

    const mousemove = (e) => {
      if (!i.locked) return;
      i.yawDelta -= e.movementX * 0.0022;
      i.pitchDelta -= e.movementY * 0.0018;
    };

    const lockChange = () => {
      i.locked = !!document.pointerLockElement;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("mousedown", mousedown);
    window.addEventListener("mouseup", mouseup);
    window.addEventListener("mousemove", mousemove);
    document.addEventListener("pointerlockchange", lockChange);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("mousedown", mousedown);
      window.removeEventListener("mouseup", mouseup);
      window.removeEventListener("mousemove", mousemove);
      document.removeEventListener("pointerlockchange", lockChange);
    };
  }, [domTarget]);

  return input;
}

export default useInput;
