import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { player, STATES, PHASE } from "./playerState";
import { groundHeightAt, solidAt, findAnchorLook, ledgeTopAt } from "./world";
import { useNetwork } from "./NetworkEngine";

const GRAVITY = -32;
const RUN_ACCEL = 60;
const MAX_RUN = 11;
const MAX_SPRINT = 19;
const FRICTION = 9;
const AIR_ACCEL = 16;
const JUMP_IMPULSE = 12.5;
const COYOTE = 0.12; // 120ms
const JUMP_BUFFER = 0.15; // 150ms
const WALL_RUN_TIME = 2.5;
const WALL_RAY = 1.2;
const DIVE_GRAVITY_SCALE = 2.5;
const GLIDE_TERMINAL = -2;
const MANTLE_TIME = 0.25;

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function PlayerController({ input, onTelemetryUpdate }) {
  const bodyRef = useRef(null);
  const grappleCooldown = useRef(0);
  const swingTimer = useRef(0);
  const mantle = useRef(null);
  const jumpHeld = useRef(false);
  const lastBroadcastRef = useRef(0);

  const { broadcastLocalState, isHost } = useNetwork();

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const i = input ? input.current : { forward: 0, strafe: 0, jump: false, sprint: false, down: false, yawDelta: 0, pitchDelta: 0 };
    const p = player;

    // ---- orientation ----
    p.rotation += i.yawDelta;
    p.pitch = clamp(p.pitch + i.pitchDelta, -0.95, 0.7);
    i.yawDelta = 0;
    i.pitchDelta = 0;

    const fx = -Math.sin(p.rotation);
    const fz = -Math.cos(p.rotation);
    const rx = -fz;
    const rz = fx;
    const lookY = Math.sin(p.pitch);
    const lookScale = Math.cos(p.pitch);

    let [x, y, z] = p.position;
    let [vx, vy, vz] = p.velocity;

    const jumpPressed = i.jumpPressed;
    const jumpReleased = i.jumpReleased;
    const grapplePressed = i.grapplePressed;
    i.jumpPressed = false;
    i.jumpReleased = false;
    i.grapplePressed = false;
    if (jumpPressed) p.jumpBuffer = JUMP_BUFFER;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    grappleCooldown.current = Math.max(0, grappleCooldown.current - dt);
    p.landTimer = Math.max(0, p.landTimer - dt);

    const wishX = fx * i.forward + rx * i.strafe;
    const wishZ = fz * i.forward + rz * i.strafe;
    const wishLen = Math.hypot(wishX, wishZ) || 1;
    const wx = wishX / wishLen;
    const wz = wishZ / wishLen;
    const hasWish = Math.abs(i.forward) + Math.abs(i.strafe) > 0;

    // ---- grapple target preview (reticle cone-cast) ----
    p.anchorCandidate =
      p.phase === PHASE.SWING
        ? null
        : findAnchorLook(x, y + 1.4, z, fx * lookScale, lookY, fz * lookScale, 45);

    // ---- grapple acquire / release ----
    if (p.phase !== PHASE.SWING && grapplePressed && grappleCooldown.current <= 0) {
      const anchor = p.anchorCandidate;
      if (anchor) {
        p.anchor = anchor;
        p.ropeLength = Math.hypot(anchor[0] - x, anchor[1] - (y + 1.2), anchor[2] - z);
        p.phase = PHASE.SWING;
        p.wallTimer = 0;
        swingTimer.current = 0;
        mantle.current = null;
      }
    }
    if (p.phase === PHASE.SWING && !i.grapple) {
      // Release: tangential velocity becomes linear launch velocity + upward kick
      p.anchor = null;
      grappleCooldown.current = 0.12;
      vy += 3.0;
      vx *= 1.14;
      vz *= 1.14;
      p.phase = PHASE.AIR;
    }

    // ---- ledge / mantle detection ----
    const tryMantle = () => {
      if (mantle.current) return false;
      const wx1 = x + fx * 0.85;
      const wz1 = z + fz * 0.85;
      const waist = solidAt(wx1, y + 1.0, wz1, 0.1);
      if (!waist) return false;
      const eye = solidAt(wx1, y + 1.95, wz1, 0.1);
      if (eye) return false;
      const top = ledgeTopAt(wx1, y, wz1, 0.1);
      if (top === null || top - y > 2.2 || top - y < 0.4) return false;
      mantle.current = {
        t: 0,
        from: [x, y, z],
        to: [x + fx * 1.35, top + 0.02, z + fz * 1.35],
        carry: Math.hypot(vx, vz),
      };
      p.phase = PHASE.MANTLE;
      p.anchor = null;
      return true;
    };

    // ================= PER-PHASE SIMULATION =================
    if (p.phase === PHASE.MANTLE && mantle.current) {
      const m = mantle.current;
      m.t += dt;
      const k = easeInOutCubic(clamp(m.t / MANTLE_TIME, 0, 1));
      x = m.from[0] + (m.to[0] - m.from[0]) * k;
      y = m.from[1] + (m.to[1] - m.from[1]) * k;
      z = m.from[2] + (m.to[2] - m.from[2]) * k;
      vx = vy = vz = 0;
      p.lean += (0 - p.lean) * Math.min(1, 8 * dt);
      if (m.t >= MANTLE_TIME) {
        const carry = Math.max(4, m.carry * 0.7);
        vx = fx * carry;
        vz = fz * carry;
        mantle.current = null;
        p.phase = PHASE.GROUND;
      }
    } else if (p.phase === PHASE.SWING && p.anchor) {
      swingTimer.current += dt;
      const [ax, ay, az] = p.anchor;
      vy += GRAVITY * dt; // a = g, constrained below -> a_t = g*sin(theta)
      if (hasWish) {
        vx += wx * 20 * dt;
        vz += wz * 20 * dt;
      }
      p.ropeLength = Math.max(9, p.ropeLength - 9 * dt);
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;

      const dx = x - ax;
      const dy = y + 1.2 - ay;
      const dz = z - az;
      const dist = Math.hypot(dx, dy, dz) || 1;
      if (dist > p.ropeLength) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        const speedBefore = Math.hypot(vx, vy, vz);
        x = ax + nx * p.ropeLength;
        y = ay + ny * p.ropeLength - 1.2;
        z = az + nz * p.ropeLength;
        const radial = vx * nx + vy * ny + vz * nz;
        vx -= radial * nx;
        vy -= radial * ny;
        vz -= radial * nz;
        const speedAfter = Math.hypot(vx, vy, vz) || 1;
        const keep = Math.min(speedBefore, speedAfter + Math.abs(radial) * 0.85);
        const k = keep / speedAfter;
        vx *= k;
        vy *= k;
        vz *= k;
      }
      p.lean = clamp(-(vx * rx + vz * rz) * 0.02, -0.35, 0.35);
    } else if (p.phase === PHASE.WALL) {
      const [nx, , nz] = p.wallNormal;
      p.wallTimer += dt;
      const g = GRAVITY * clamp(p.wallTimer / WALL_RUN_TIME, 0, 1) * 0.85;
      vy += g * dt;
      if (vy > 0) vy *= 0.9;
      // align velocity along the wall tangent
      const into = vx * nx + vz * nz;
      if (into < 0) {
        vx -= into * nx;
        vz -= into * nz;
      }
      vx += fx * 30 * dt;
      vz += fz * 30 * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      p.lean = -p.wallSide * 0.21; // ~12 deg away from the wall
      p.wallContact = true;

      const stillWall = solidAt(x - nx * WALL_RAY, y + 1.0, z - nz * WALL_RAY, 0.1);
      if (p.jumpBuffer > 0) {
        // (Wall_Normal * 8) + (Up * 7) + (Forward_Velocity * 0.6)
        p.jumpBuffer = 0;
        vx = nx * 8 + vx * 0.6;
        vz = nz * 8 + vz * 0.6;
        vy = 7 + Math.max(0, vy) * 0.6;
        p.wallContact = false;
        p.phase = PHASE.AIR;
        p.state = STATES.WALL_JUMPING;
        p.landTimer = 0.18;
      } else if (!stillWall || p.wallTimer > WALL_RUN_TIME || Math.hypot(vx, vz) < 2) {
        p.wallContact = false;
        p.phase = PHASE.AIR;
        if (!stillWall) tryMantle();
      }
    } else if (p.phase === PHASE.GROUND) {
      const maxSpeed = i.sprint ? MAX_SPRINT : MAX_RUN;
      if (hasWish) {
        vx += wx * RUN_ACCEL * dt;
        vz += wz * RUN_ACCEL * dt;
      }
      const hs = Math.hypot(vx, vz);
      if (hs > maxSpeed) {
        // lerp back toward the cap instead of snapping (preserves landing boosts)
        const k = Math.max(maxSpeed / hs, 1 - 2.2 * dt);
        vx *= k;
        vz *= k;
      }
      if (!hasWish) {
        const f = Math.max(0, 1 - FRICTION * dt);
        vx *= f;
        vz *= f;
      }
      vy += GRAVITY * dt;
      if (p.jumpBuffer > 0 || (jumpPressed && p.coyote > 0)) {
        p.jumpBuffer = 0;
        p.coyote = 0;
        vy = JUMP_IMPULSE;
        jumpHeld.current = true;
        p.phase = PHASE.AIR;
      }
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      p.lean += (0 - p.lean) * Math.min(1, 10 * dt);
      p.diving = false;
    } else {
      // ---------------- AIR ----------------
      const gliding = i.jump && !jumpHeld.current && vy < 1.5 && y > 3 && !i.down;
      const diving = i.down && !gliding;
      p.diving = diving;

      // coyote-time jump right after walking off a ledge
      if (p.coyote > 0 && p.jumpBuffer > 0) {
        p.coyote = 0;
        p.jumpBuffer = 0;
        vy = JUMP_IMPULSE;
        jumpHeld.current = true;
      }

      if (diving) {
        vy += GRAVITY * DIVE_GRAVITY_SCALE * dt;
        // convert fall speed into forward momentum
        const conv = Math.min(-vy, 40) * 0.55 * dt;
        vx += fx * conv;
        vz += fz * conv;
      } else if (gliding) {
        vy += GRAVITY * 0.16 * dt;
        if (vy < GLIDE_TERMINAL) vy = GLIDE_TERMINAL;
        const hs = Math.hypot(vx, vz);
        if (hs > 0.5) {
          const blend = 1 - Math.pow(0.2, dt);
          vx += (fx * hs - vx) * blend;
          vz += (fz * hs - vz) * blend;
        }
        const decay = Math.max(0, 1 - 0.45 * dt);
        vx *= decay;
        vz *= decay;
        if (hasWish) {
          vx += wx * 9 * dt;
          vz += wz * 9 * dt;
        }
      } else {
        vy += GRAVITY * dt;
        if (hasWish) {
          vx += wx * AIR_ACCEL * dt;
          vz += wz * AIR_ACCEL * dt;
        }
      }

      // variable jump height
      if (jumpReleased && vy > 0) vy *= 0.45;
      if (!i.jump) jumpHeld.current = false;

      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      p.lean += ((gliding ? clamp(i.strafe * -0.2, -0.2, 0.2) : 0) - p.lean) * Math.min(1, 8 * dt);

      // AIR -> WALL RUN (side raycasts, 1.2m, forward speed > 4 m/s)
      p.wallContact = false;
      if (!gliding && Math.hypot(vx, vz) > 4 && vy < 5) {
        for (const s of [1, -1]) {
          const sx = x + rx * s * WALL_RAY;
          const sz = z + rz * s * WALL_RAY;
          if (solidAt(sx, y + 1.0, sz, 0)) {
            p.wallNormal = [-rx * s, 0, -rz * s];
            p.wallSide = s;
            p.wallTimer = 0;
            p.wallContact = true;
            p.phase = PHASE.WALL;
            break;
          }
        }
      }
      if (p.phase === PHASE.AIR) tryMantle();
    }

    // ---- horizontal collision resolve (skip while wall running / mantling) ----
    if (p.phase !== PHASE.WALL && p.phase !== PHASE.MANTLE) {
      const hit = solidAt(x, y + 0.9, z, 0.45);
      if (hit) {
        const dxl = x - (hit.x - hit.w / 2 - 0.45);
        const dxr = hit.x + hit.w / 2 + 0.45 - x;
        const dzl = z - (hit.z - hit.d / 2 - 0.45);
        const dzr = hit.z + hit.d / 2 + 0.45 - z;
        const m = Math.min(dxl, dxr, dzl, dzr);
        if (m === dxl) {
          x -= dxl;
          vx = Math.min(vx, 0);
        } else if (m === dxr) {
          x += dxr;
          vx = Math.max(vx, 0);
        } else if (m === dzl) {
          z -= dzl;
          vz = Math.min(vz, 0);
        } else {
          z += dzr;
          vz = Math.max(vz, 0);
        }
      }
    }

    // ---- ground contact ----
    const gh = groundHeightAt(x, z, y);
    if (p.phase !== PHASE.MANTLE && y <= gh + 0.02 && vy <= 0) {
      const impact = -vy;
      y = gh;
      vy = 0;
      p.grounded = true;
      p.coyote = COYOTE;
      if (p.phase !== PHASE.GROUND) {
        p.phase = PHASE.GROUND;
        p.wallTimer = 0;
        p.anchor = null;
        p.wallContact = false;
        // momentum landing: downward energy rolls into forward sprint
        if (impact > 8) {
          const hs = Math.hypot(vx, vz);
          if (i.forward > 0) {
            const boost = Math.min(impact * 0.55, 10);
            const dirx = hs > 0.5 ? vx / hs : fx;
            const dirz = hs > 0.5 ? vz / hs : fz;
            vx = dirx * (hs + boost);
            vz = dirz * (hs + boost);
          } else {
            vx *= 0.72;
            vz *= 0.72;
          }
          p.landTimer = 0.22;
        }
      }
    } else if (p.phase !== PHASE.MANTLE) {
      p.grounded = false;
      if (p.phase === PHASE.GROUND) {
        p.phase = PHASE.AIR;
        p.coyote = COYOTE;
      }
      p.coyote = Math.max(0, p.coyote - dt);
    }

    // Out of bounds safety teleport
    if (y < -60) {
      x = 0;
      y = 40;
      z = 0;
      vx = vy = vz = 0;
      p.phase = PHASE.AIR;
      p.anchor = null;
      mantle.current = null;
    }

    // ---- commit ----
    p.position[0] = x;
    p.position[1] = y;
    p.position[2] = z;
    p.velocity[0] = vx;
    p.velocity[1] = vy;
    p.velocity[2] = vz;
    p.speed = Math.hypot(vx, vy, vz);
    p.tick++;

    // ---- readable state label ----
    const hspeed = Math.hypot(vx, vz);
    if (p.phase === PHASE.MANTLE) p.state = STATES.MANTLING;
    else if (p.phase === PHASE.SWING)
      p.state = swingTimer.current < 0.25 ? STATES.GRAPPLING : STATES.SWINGING;
    else if (p.phase === PHASE.WALL)
      p.state = p.wallSide > 0 ? STATES.WALL_RUNNING_RIGHT : STATES.WALL_RUNNING_LEFT;
    else if (p.phase === PHASE.GROUND) {
      if (p.landTimer > 0) p.state = STATES.LANDING;
      else if (hspeed < 0.6) p.state = STATES.IDLE;
      else if (i.sprint && hspeed > MAX_RUN * 0.85) p.state = STATES.SPRINTING;
      else p.state = STATES.RUNNING;
    } else if (p.state === STATES.WALL_JUMPING && p.landTimer > 0) {
      p.state = STATES.WALL_JUMPING;
    } else if (p.diving) p.state = STATES.DIVING;
    else if (i.jump && vy > GLIDE_TERMINAL - 0.01 && vy < 1.5 && !p.grounded && y > 3)
      p.state = STATES.GLIDING;
    else p.state = vy > 0 ? STATES.JUMPING : STATES.FALLING;

    if (bodyRef.current) {
      bodyRef.current.position.set(x, y + 0.9, z);
      bodyRef.current.rotation.y = p.rotation;
      bodyRef.current.rotation.z = p.lean * 0.5;
      bodyRef.current.rotation.x = p.diving ? 0.5 : 0;
    }

    // Telemetry & Network sync
    if (onTelemetryUpdate) {
      onTelemetryUpdate({
        speed: p.speed,
        hspeed: Math.hypot(vx, vz),
        verticalSpeed: vy,
        altitude: y,
        state: p.state,
        phase: p.phase,
        isGrounded: p.grounded,
        isWallRunning: p.phase === PHASE.WALL,
        wallSide: p.wallSide,
        isGliding: p.state === STATES.GLIDING,
        isDiving: p.diving,
        isGrappling: p.phase === PHASE.SWING,
        grappleAnchor: p.anchor,
        anchorCandidate: p.anchorCandidate,
        lean: p.lean
      });
    }

    // 20Hz Network Broadcast
    const now = performance.now();
    if (broadcastLocalState && now - lastBroadcastRef.current > 50) {
      lastBroadcastRef.current = now;
      broadcastLocalState({
        position: [x, y, z],
        velocity: [vx, vy, vz],
        rotation: p.rotation,
        pitch: p.pitch,
        traversalState: p.state,
        traversalPhase: p.phase,
        grapplePoint: p.anchor,
        isDriving: false,
        gear: 0,
        speedKmh: Math.round(p.speed * 3.6)
      });
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Sleek Traversal Runner Avatar with Emissive Visor & Glider Wings */}
      <mesh castShadow>
        <capsuleGeometry args={[0.32, 1.0, 4, 10]} />
        <meshStandardMaterial color="#2b3448" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Emissive Kinetic Visor */}
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial
          color="#7fd8ff"
          emissive="#3aa6d8"
          emissiveIntensity={1.2}
          roughness={0.3}
        />
      </mesh>
      {/* Glider Wing Ribs (Visible when gliding) */}
      {player.state === STATES.GLIDING && (
        <group position={[0, 0.4, -0.2]}>
          <mesh rotation={[0, 0, Math.PI / 12]}>
            <boxGeometry args={[2.2, 0.04, 0.8]} />
            <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export { STATES as TRAVERSAL_STATES, PlayerController };

