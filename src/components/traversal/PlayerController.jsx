import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player, STATES, PHASE } from '../../playerState.js';
import { 
  groundHeightAt, 
  solidAt, 
  findAnchorLook, 
  ledgeTopAt, 
  findZipPointTarget, 
  checkVaultObstacle 
} from '../../world.js';
import { useNetwork } from '../../NetworkEngine.jsx';

// Kinematic Physics Constants
const GRAVITY = -32;
const RUN_ACCEL = 65;
const MAX_RUN = 12;
const MAX_SPRINT = 22;
const FRICTION = 9.5;
const AIR_ACCEL = 18;
const JUMP_IMPULSE = 14.0;
const COYOTE = 0.12; // 120ms
const JUMP_BUFFER = 0.15; // 150ms
const WALL_RUN_TIME = 2.5;
const WALL_RAY = 1.35;
const DIVE_GRAVITY_SCALE = 2.5;
const GLIDE_TERMINAL = -2.0;
const MANTLE_TIME = 0.25;
const VAULT_TIME = 0.22;
const ZIP_SPEED = 46.0;

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function PlayerController({ input, onTelemetryUpdate }) {
  const meshGroupRef = useRef(null);
  const characterRootRef = useRef(null);
  const leftArmRef = useRef(null);
  const rightArmRef = useRef(null);
  const leftLegRef = useRef(null);
  const rightLegRef = useRef(null);
  const torsoRef = useRef(null);
  const hoodieRef = useRef(null);

  const grappleCooldown = useRef(0);
  const webZipCooldown = useRef(0);
  const zipPointCooldown = useRef(0);
  const swingTimer = useRef(0);
  const mantle = useRef(null);
  const vault = useRef(null);
  const lastBroadcastRef = useRef(0);

  // Trick state timers & rotation accumulators
  const trickTimerRef = useRef(0);
  const trickRotAccumRef = useRef({ x: 0, y: 0, z: 0 });

  // "On-Twos" Animation Stepper (12 FPS animation pose sampling)
  const lastAnimTickRef = useRef(-1);
  const steppedPoseRef = useRef({
    torsoRotX: 0,
    torsoRotY: 0,
    torsoRotZ: 0,
    leftArmRotX: 0,
    rightArmRotX: 0,
    leftLegRotX: 0,
    rightLegRotX: 0,
    hoodieRotX: 0
  });

  const { broadcastLocalState } = useNetwork();

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.04);
    const i = input ? input.current : {
      forward: 0,
      strafe: 0,
      jump: false,
      sprint: false,
      ctrl: false,
      down: false,
      yawDelta: 0,
      pitchDelta: 0,
      jumpPressed: false,
      jumpReleased: false,
      grapplePressed: false,
      swing: false,
      swingPressed: false,
      zipPoint: false,
      zipPointPressed: false,
      webZip: false,
      webZipPressed: false,
      trick: false
    };
    const p = player;

    // 1. Orientation & Mouse Look
    p.rotation += i.yawDelta || 0;
    p.pitch = clamp(p.pitch + (i.pitchDelta || 0), -0.95, 0.75);
    if (i.yawDelta) i.yawDelta = 0;
    if (i.pitchDelta) i.pitchDelta = 0;

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
    const zipPointPressed = i.zipPointPressed;
    const webZipPressed = i.webZipPressed;

    i.jumpPressed = false;
    i.jumpReleased = false;
    i.grapplePressed = false;
    i.zipPointPressed = false;
    i.webZipPressed = false;

    if (jumpPressed) p.jumpBuffer = JUMP_BUFFER;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);

    grappleCooldown.current = Math.max(0, grappleCooldown.current - dt);
    webZipCooldown.current = Math.max(0, webZipCooldown.current - dt);
    zipPointCooldown.current = Math.max(0, zipPointCooldown.current - dt);
    p.landTimer = Math.max(0, p.landTimer - dt);
    p.zipLaunchWindow = Math.max(0, p.zipLaunchWindow - dt);

    const wishX = fx * (i.forward || 0) + rx * (i.strafe || 0);
    const wishZ = fz * (i.forward || 0) + rz * (i.strafe || 0);
    const wishLen = Math.hypot(wishX, wishZ) || 1;
    const wx = wishX / wishLen;
    const wz = wishZ / wishLen;
    const hasWish = Math.abs(i.forward || 0) + Math.abs(i.strafe || 0) > 0;

    // 2. Aim Cone-Casts for Swing Anchors and Zip-to-Point Targets
    if (p.phase !== PHASE.SWING && p.phase !== PHASE.ZIP_POINT) {
      p.anchorCandidate = findAnchorLook(x, y + 1.4, z, fx * lookScale, lookY, fz * lookScale, 50);
      p.zipCandidate = findZipPointTarget(x, y + 1.4, z, fx * lookScale, lookY, fz * lookScale, 75);
    } else {
      p.anchorCandidate = null;
      p.zipCandidate = null;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. ZIP TO POINT (LEDGE TARGET: F / Middle Mouse)
    // ─────────────────────────────────────────────────────────────
    if (zipPointPressed && zipPointCooldown.current <= 0 && p.phase !== PHASE.ZIP_POINT) {
      const zipTarget = p.zipCandidate || findZipPointTarget(x, y + 1.4, z, fx * lookScale, lookY, fz * lookScale, 75);
      if (zipTarget) {
        p.zipTarget = zipTarget;
        p.phase = PHASE.ZIP_POINT;
        p.state = STATES.ZIP_TO_POINT;
        p.anchor = null;
        zipPointCooldown.current = 0.4;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. WEB ZIP (AIR LINE-BOOST: C / Quick Right Click in Open Air)
    // ─────────────────────────────────────────────────────────────
    if (webZipPressed && webZipCooldown.current <= 0 && (p.phase === PHASE.AIR || p.phase === PHASE.SWING)) {
      p.phase = PHASE.AIR;
      p.anchor = null;
      p.state = STATES.WEB_ZIP;
      p.webZipActive = true;
      p.webZipTimer = 0.26;
      webZipCooldown.current = 0.65;

      // Apply linear forward impulse along camera look vector
      const boostSpeed = 22.0;
      vx = fx * lookScale * boostSpeed;
      vz = fz * lookScale * boostSpeed;
      vy = Math.max(vy * 0.4, 0) + Math.max(3.0, lookY * 12.0);

      // Web zip visual line origin and target
      p.webZipOrigin = [x, y + 1.2, z];
      p.webZipTarget = [x + fx * lookScale * 18, y + 1.2 + lookY * 18, z + fz * lookScale * 18];
    }

    if (p.webZipActive) {
      p.webZipTimer -= dt;
      if (p.webZipTimer <= 0) {
        p.webZipActive = false;
        p.webZipOrigin = null;
        p.webZipTarget = null;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. WEB SWING TRIGGER (Shift / Right Click hold while airborne)
    // ─────────────────────────────────────────────────────────────
    const isSwingInput = (i.grapple || i.swing || grapplePressed) && !p.grounded;
    if (p.phase !== PHASE.SWING && p.phase !== PHASE.ZIP_POINT && isSwingInput && grappleCooldown.current <= 0) {
      const anchor = p.anchorCandidate || findAnchorLook(x, y + 1.4, z, fx * lookScale, lookY, fz * lookScale, 50);
      if (anchor) {
        p.anchor = anchor;
        p.ropeLength = Math.hypot(anchor[0] - x, anchor[1] - (y + 1.2), anchor[2] - z);
        p.phase = PHASE.SWING;
        p.state = STATES.SWINGING;
        swingTimer.current = 0;

        // Transfer dive kinetic energy into massive forward swing angular momentum
        if (p.diveKineticEnergy > 0) {
          const diveBoost = Math.min(p.diveKineticEnergy * 1.8, 16);
          vx += fx * diveBoost;
          vz += fz * diveBoost;
          p.diveKineticEnergy = 0;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. STATE MACHINE BRANCHING & PHYSICS
    // ─────────────────────────────────────────────────────────────

    // ---- A. ZIP TO POINT EXECUTION ----
    if (p.phase === PHASE.ZIP_POINT) {
      const zt = p.zipTarget;
      if (!zt) {
        p.phase = PHASE.AIR;
      } else {
        const toX = zt[0] - x;
        const toY = zt[1] - y;
        const toZ = zt[2] - z;
        const dist = Math.hypot(toX, toY, toZ);

        p.state = STATES.ZIP_TO_POINT;

        // Arrival or Point Launch Window
        if (dist < 2.8 || jumpPressed) {
          p.zipLaunchWindow = 0.35;

          // POINT LAUNCH: Tap Space to launch with explosive kinetic vector
          if (jumpPressed || (i.jump && dist < 3.2)) {
            p.phase = PHASE.AIR;
            p.state = STATES.POINT_LAUNCH;
            p.zipTarget = null;
            p.zipLaunchWindow = 0;

            const launchSpeed = 30.0;
            vx = fx * launchSpeed;
            vz = fz * launchSpeed;
            vy = 14.0; // High vertical launch
            p.diveKineticEnergy = 0;
          } else if (dist < 1.2) {
            // Normal arrival at ledge
            x = zt[0];
            y = zt[1];
            z = zt[2];
            vx = fx * 8;
            vz = fz * 8;
            vy = 0;
            p.phase = PHASE.GROUND;
            p.grounded = true;
            p.zipTarget = null;
          }
        } else {
          // Pull player at high velocity along line of sight
          const dirX = toX / dist;
          const dirY = toY / dist;
          const dirZ = toZ / dist;

          vx = dirX * ZIP_SPEED;
          vy = dirY * ZIP_SPEED;
          vz = dirZ * ZIP_SPEED;

          x += vx * dt;
          y += vy * dt;
          z += vz * dt;
        }
      }
    }
    // ---- B. VAULTING OVER OBSTACLES ----
    else if (p.phase === PHASE.VAULT) {
      const v = vault.current;
      if (!v) {
        p.phase = PHASE.GROUND;
      } else {
        v.t += dt / VAULT_TIME;
        const u = clamp(v.t, 0, 1);
        const eased = easeInOutCubic(u);
        x = THREE.MathUtils.lerp(v.from[0], v.to[0], eased);
        z = THREE.MathUtils.lerp(v.from[2], v.to[2], eased);
        // Parabolic arc up and over
        const arcY = Math.sin(u * Math.PI) * 0.45;
        y = THREE.MathUtils.lerp(v.from[1], v.to[1], eased) + arcY;
        p.state = STATES.VAULTING;

        if (u >= 1) {
          p.phase = PHASE.GROUND;
          p.grounded = true;
          // Preserve full sprint horizontal speed
          vx = fx * MAX_SPRINT;
          vz = fz * MAX_SPRINT;
          vault.current = null;
        }
      }
    }
    // ---- C. MANTLING ----
    else if (p.phase === PHASE.MANTLE) {
      const m = mantle.current;
      if (!m) {
        p.phase = PHASE.AIR;
      } else {
        m.t += dt / MANTLE_TIME;
        const u = clamp(m.t, 0, 1);
        const eased = easeInOutCubic(u);
        x = THREE.MathUtils.lerp(m.from[0], m.to[0], eased);
        y = THREE.MathUtils.lerp(m.from[1], m.to[1], eased);
        z = THREE.MathUtils.lerp(m.from[2], m.to[2], eased);
        vx = 0;
        vy = 0;
        vz = 0;
        p.state = STATES.MANTLING;
        if (u >= 1) {
          p.phase = PHASE.GROUND;
          p.grounded = true;
          mantle.current = null;
        }
      }
    }
    // ---- D. PENDULUM WEB SWINGING ----
    else if (p.phase === PHASE.SWING) {
      swingTimer.current += dt;
      const a = p.anchor;

      // Detach constraint on Jump / Space -> Momentum Launch
      if (!a || (jumpPressed && swingTimer.current > 0.06)) {
        p.phase = PHASE.AIR;
        p.state = STATES.JUMPING;
        p.anchor = null;
        grappleCooldown.current = 0.35;

        // Tangential velocity launch + forward boost force
        vy = Math.max(vy, 2.0) + 9.5;
        const forwardPush = 1.38;
        vx *= forwardPush;
        vz *= forwardPush;
      } else {
        p.state = STATES.SWINGING;
        const ax = a[0];
        const ay = a[1];
        const az = a[2];

        // Pendulum vector from anchor to player
        let toX = x - ax;
        let toY = y - ay;
        let toZ = z - az;
        let dist = Math.hypot(toX, toY, toZ) || 0.001;

        // Pendulum gravity acceleration: a = g * sin(theta)
        vy += GRAVITY * dt;

        // Add swing pumping along camera heading
        if (hasWish) {
          vx += wx * AIR_ACCEL * 1.8 * dt;
          vz += wz * AIR_ACCEL * 1.8 * dt;
        }

        // Integrate velocity
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        toX = x - ax;
        toY = y - ay;
        toZ = z - az;
        dist = Math.hypot(toX, toY, toZ) || 0.001;

        // Distance constraint: R = ||P_player - P_anchor||
        const targetLen = p.ropeLength;
        if (dist > targetLen) {
          const nx = toX / dist;
          const ny = toY / dist;
          const nz = toZ / dist;

          x = ax + nx * targetLen;
          y = ay + ny * targetLen;
          z = az + nz * targetLen;

          // Project velocity onto sphere tangent: v_tangential
          const vDotN = vx * nx + vy * ny + vz * nz;
          vx -= vDotN * nx;
          vy -= vDotN * ny;
          vz -= vDotN * nz;

          // Cable tension preservation
          vx *= 1.003;
          vz *= 1.003;
        }

        // Auto release if above anchor or stalling
        if (y > ay + 1.2 || (dist < 3.5 && swingTimer.current > 0.7)) {
          p.phase = PHASE.AIR;
          p.anchor = null;
          grappleCooldown.current = 0.35;
          vy += 7.0;
        }
      }
    }
    // ---- E. GROUND / AIR / WALL TRAVERSAL ----
    else {
      // Wall detection raycasts: Left, Right, and Front
      const rayL_x = -rx;
      const rayL_z = -rz;
      const rayR_x = rx;
      const rayR_z = rz;
      const rayF_x = fx;
      const rayF_z = fz;

      const hitL = solidAt(x + rayL_x * WALL_RAY, y + 1.2, z + rayL_z * WALL_RAY, 0.2);
      const hitR = solidAt(x + rayR_x * WALL_RAY, y + 1.2, z + rayR_z * WALL_RAY, 0.2);
      const hitF = solidAt(x + rayF_x * WALL_RAY, y + 1.2, z + rayF_z * WALL_RAY, 0.2);

      const isWallRunningInput = i.sprint || i.forward > 0;
      const canWallRun = !p.grounded && (hitL || hitR || hitF) && isWallRunningInput && p.wallTimer < WALL_RUN_TIME;

      if (canWallRun && (p.phase === PHASE.AIR || p.phase === PHASE.WALL)) {
        // ---- WALL RUN (HORIZONTAL & VERTICAL) ----
        p.phase = PHASE.WALL;
        p.wallTimer += dt;

        let wallB = hitF || hitL || hitR;
        let isLeft = !hitF && !!hitL;
        let isRight = !hitF && !!hitR;
        let isFront = !!hitF;

        p.wallSide = isFront ? 0 : isLeft ? -1 : 1;

        // Determine wall normal
        let nx = 0, nz = 0;
        const dx = x - wallB.x;
        const dz = z - wallB.z;
        if (Math.abs(dx) / wallB.w > Math.abs(dz) / wallB.d) {
          nx = dx > 0 ? 1 : -1;
        } else {
          nz = dz > 0 ? 1 : -1;
        }
        p.wallNormal = [nx, 0, nz];

        // 1. Vertical Wall Run (Running straight up a building facade)
        if (isFront || (lookY > 0.3 && i.forward > 0)) {
          p.state = STATES.WALL_RUNNING_UP;
          // Soft upward momentum with gravity decay
          const upwardSpeed = Math.max(14.0 * (1 - p.wallTimer / WALL_RUN_TIME), 2.0);
          vy = upwardSpeed;
          // Clamp distance from surface
          vx = -nx * 0.5;
          vz = -nz * 0.5;
        } else {
          // 2. Horizontal Wall Run (Tangent Lock along wall plane)
          p.state = isLeft ? STATES.WALL_RUNNING_LEFT : STATES.WALL_RUNNING_RIGHT;

          // Reduced gravity scalar (0.1g)
          const gravityDecay = THREE.MathUtils.lerp(0.10, 0.85, p.wallTimer / WALL_RUN_TIME);
          vy += GRAVITY * gravityDecay * dt;

          const wallTangentX = -nz;
          const wallTangentZ = nx;
          const forwardDot = fx * wallTangentX + fz * wallTangentZ;
          const wallDirX = wallTangentX * (forwardDot >= 0 ? 1 : -1);
          const wallDirZ = wallTangentZ * (forwardDot >= 0 ? 1 : -1);

          const wallSpeed = Math.max(MAX_RUN, Math.hypot(vx, vz));
          vx = wallDirX * wallSpeed;
          vz = wallDirZ * wallSpeed;
        }

        // Wall Jump / Exit vector
        if (p.jumpBuffer > 0 || jumpPressed) {
          p.jumpBuffer = 0;
          p.phase = PHASE.AIR;
          p.state = STATES.WALL_JUMPING;
          p.wallTimer = 0;
          // v_exit = (N_wall * k1) + (v_wall * k2) + (U_up * k3)
          vx = nx * 8.5 + fx * 8.0;
          vz = nz * 8.5 + fz * 8.0;
          vy = 11.5;
        }
      } else {
        // ---- GROUND / AIR TRAVERSAL ----
        p.wallTimer = 0;
        p.wallSide = 0;

        const groundY = groundHeightAt(x, z, y + 0.35);
        const onGround = y <= groundY + 0.08 && vy <= 0.1;

        if (onGround) {
          // ─────────────────────────────────────────────────────────
          // GROUND LOCOMOTION
          // ─────────────────────────────────────────────────────────
          p.grounded = true;
          p.coyote = COYOTE;
          y = groundY;
          vy = 0;
          p.phase = PHASE.GROUND;

          // Clear dive kinetic energy or convert upon landing
          if (p.diveKineticEnergy > 0) {
            vx += fx * p.diveKineticEnergy * 0.8;
            vz += fz * p.diveKineticEnergy * 0.8;
            p.diveKineticEnergy = 0;
          }

          // CHARGED JUMP CHARGING ACCUMULATOR (Hold Shift+Ctrl or Ctrl/Shift+Space)
          const isChargeHolding = (i.ctrl || i.sprint) && i.jump;
          if (isChargeHolding) {
            p.jumpCharging = true;
            p.jumpChargeTime = Math.min(1.2, p.jumpChargeTime + dt);
            p.jumpChargeRatio = clamp(p.jumpChargeTime / 1.0, 0, 1);
            p.state = STATES.CHARGING_JUMP;
            // Apply high ground friction while crouch charging
            vx *= 0.85;
            vz *= 0.85;
          } else if (p.jumpCharging && (jumpReleased || !i.jump)) {
            // CHARGED JUMP RELEASE
            if (p.jumpChargeTime > 0.2) {
              const chargeImpulse = JUMP_IMPULSE + p.jumpChargeRatio * 18.0; // Up to 32m/s
              vy = chargeImpulse;
              vx *= 1.35;
              vz *= 1.35;
              p.grounded = false;
              p.phase = PHASE.AIR;
              p.state = STATES.CHARGED_JUMP;
              p.jumpChargeTime = 0;
              p.jumpChargeRatio = 0;
              p.jumpCharging = false;
            } else {
              p.jumpCharging = false;
              p.jumpChargeTime = 0;
              p.jumpChargeRatio = 0;
            }
          } else {
            p.jumpCharging = false;
            p.jumpChargeTime = 0;
            p.jumpChargeRatio = 0;

            // PARKOUR VAULTING CHECK (Sprint + W toward waist-high obstacle)
            if (i.sprint && i.forward > 0) {
              const vaultObstacle = checkVaultObstacle(x, y, z, fx, fz);
              if (vaultObstacle) {
                p.phase = PHASE.VAULT;
                p.state = STATES.VAULTING;
                vault.current = {
                  from: [x, y, z],
                  to: vaultObstacle.targetPos,
                  height: vaultObstacle.vaultHeight,
                  t: 0
                };
              }
            }

            // STANDARD RUN / SPRINT
            const targetMax = i.sprint ? MAX_SPRINT : MAX_RUN;
            if (hasWish && p.phase !== PHASE.VAULT) {
              vx += wx * RUN_ACCEL * dt;
              vz += wz * RUN_ACCEL * dt;
              const hSpeed = Math.hypot(vx, vz);
              if (hSpeed > targetMax) {
                vx = (vx / hSpeed) * targetMax;
                vz = (vz / hSpeed) * targetMax;
              }
              p.state = i.sprint ? STATES.SPRINTING : STATES.RUNNING;
            } else if (p.phase !== PHASE.VAULT) {
              // Ground friction
              const hSpeed = Math.hypot(vx, vz);
              const drop = FRICTION * dt * hSpeed;
              const newSpeed = Math.max(0, hSpeed - drop);
              if (hSpeed > 0.001) {
                vx = (vx / hSpeed) * newSpeed;
                vz = (vz / hSpeed) * newSpeed;
              }
              p.state = p.landTimer > 0 ? STATES.LANDING : STATES.IDLE;
            }

            // STANDARD JUMP
            if (p.jumpBuffer > 0 || (jumpPressed && p.coyote > 0)) {
              p.jumpBuffer = 0;
              p.coyote = 0;
              vy = JUMP_IMPULSE;
              p.grounded = false;
              p.phase = PHASE.AIR;
              p.state = STATES.JUMPING;
            }
          }
        } else {
          // ─────────────────────────────────────────────────────────
          // AIR LOCOMOTION, DIVE, GLIDE, TRICKS & AIR STEERING
          // ─────────────────────────────────────────────────────────
          p.grounded = false;
          p.phase = PHASE.AIR;
          p.coyote = Math.max(0, p.coyote - dt);

          const isDiving = (i.ctrl || i.down) && vy < -1.5;
          const isGliding = i.jump && vy < 0 && !isDiving;
          const isTricking = i.trick && Math.abs(vy) > 2.0;

          // AIR STEERING: Directional aerodynamic steering forces (A / D)
          if (i.strafe !== 0) {
            const sideSteerForce = 16.0;
            vx += rx * i.strafe * sideSteerForce * dt;
            vz += rz * i.strafe * sideSteerForce * dt;
          }

          // 1. AIRBORNE DIVE (g_dive = 2.5g)
          if (isDiving) {
            p.state = STATES.DIVING;
            vy += GRAVITY * DIVE_GRAVITY_SCALE * dt;
            // Accumulate kinetic energy
            p.diveKineticEnergy += Math.abs(vy) * dt * 0.35;
            // Forward aerodynamic drive
            vx += fx * 18 * dt;
            vz += fz * 18 * dt;
          }
          // 2. AIR TRICKS (Acrobatics)
          else if (isTricking) {
            p.state = STATES.AIR_TRICK;
            p.trickActive = true;
            trickTimerRef.current += dt;
            vy += GRAVITY * dt;

            // Maintain parabolic trajectory, apply angular momentum
            const trickSpeed = 12.0;
            if (i.forward !== 0) trickRotAccumRef.current.x += dt * trickSpeed * i.forward;
            if (i.strafe !== 0) trickRotAccumRef.current.z += dt * trickSpeed * i.strafe;
            trickRotAccumRef.current.y += dt * 6.0;

            p.trickRotX = trickRotAccumRef.current.x;
            p.trickRotY = trickRotAccumRef.current.y;
            p.trickRotZ = trickRotAccumRef.current.z;

            // Accumulate trick points
            p.trickScore += Math.round(dt * 250);
            p.trickName = i.forward > 0 ? 'FRONT FLIP 360' : i.strafe !== 0 ? 'CORKSCREW' : 'SPIDER SPIN';
          }
          // 3. GLIDING
          else if (isGliding) {
            p.state = STATES.GLIDING;
            vy = Math.max(GLIDE_TERMINAL, vy + GRAVITY * 0.25 * dt);
            if (hasWish) {
              vx += wx * AIR_ACCEL * dt;
              vz += wz * AIR_ACCEL * dt;
            }
          }
          // 4. STANDARD FALLING / JUMPING
          else {
            p.trickActive = false;
            p.state = vy > 0.5 ? STATES.JUMPING : STATES.FALLING;
            vy += GRAVITY * dt;
            if (hasWish) {
              vx += wx * AIR_ACCEL * dt;
              vz += wz * AIR_ACCEL * dt;
            }
          }

          // Pulling out of dive: convert vertical energy into forward speed
          if (!isDiving && p.diveKineticEnergy > 0) {
            const pulloutBoost = Math.min(p.diveKineticEnergy * 1.5, 14);
            vx += fx * pulloutBoost;
            vz += fz * pulloutBoost;
            p.diveKineticEnergy = 0;
          }

          // LEDGE MANTLE DETECTION
          const ledgeY = ledgeTopAt(x + fx * 0.9, y + 1.2, z + fz * 0.9, 0.4);
          if (ledgeY !== null && ledgeY > y && ledgeY - y < 2.4 && vy > -8) {
            p.phase = PHASE.MANTLE;
            p.state = STATES.MANTLING;
            mantle.current = {
              from: [x, y, z],
              to: [x + fx * 1.4, ledgeY + 0.05, z + fz * 1.4],
              t: 0
            };
          }
        }
      }

      // Physics Integration
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
    }

    // Write back to player global state
    p.position[0] = x;
    p.position[1] = y;
    p.position[2] = z;
    p.velocity[0] = vx;
    p.velocity[1] = vy;
    p.velocity[2] = vz;
    p.speed = Math.hypot(vx, vz);

    // Smooth camera roll / lean in turns and wall runs (12° body lean)
    let targetLean = 0;
    if (p.state === STATES.WALL_RUNNING_LEFT) targetLean = 0.21;
    if (p.state === STATES.WALL_RUNNING_RIGHT) targetLean = -0.21;
    p.lean = THREE.MathUtils.lerp(p.lean, targetLean, dt * 8);

    // Update Mesh Group Transform
    if (meshGroupRef.current) {
      meshGroupRef.current.position.set(x, y, z);
      meshGroupRef.current.rotation.y = p.rotation;
      if (p.state === STATES.AIR_TRICK) {
        meshGroupRef.current.rotation.x = p.trickRotX;
        meshGroupRef.current.rotation.z = p.trickRotZ;
      } else {
        meshGroupRef.current.rotation.x = 0;
        meshGroupRef.current.rotation.z = 0;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 7. "ON-TWOS" ANIMATION MODIFIER (12 FPS Stepped Keyframing)
    // ─────────────────────────────────────────────────────────────
    const animTick = Math.floor(state.clock.elapsedTime * 12);
    if (animTick !== lastAnimTickRef.current) {
      lastAnimTickRef.current = animTick;
      const animTime = state.clock.elapsedTime;
      const hSpeed = p.speed;

      let tRotX = 0, tRotY = 0, tRotZ = 0;
      let laRotX = 0, raRotX = 0;
      let llRotX = 0, rlRotX = 0;
      let hRotX = 0;

      switch (p.state) {
        case STATES.SPRINTING:
        case STATES.RUNNING: {
          const runFreq = hSpeed > 15 ? 16 : 11;
          const armSwing = Math.sin(animTime * runFreq) * 0.9;
          const legSwing = Math.sin(animTime * runFreq) * 1.1;
          laRotX = armSwing;
          raRotX = -armSwing;
          llRotX = -legSwing;
          rlRotX = legSwing;
          tRotX = 0.32; // forward pitch lean
          hRotX = -0.2;
          break;
        }
        case STATES.CHARGING_JUMP: {
          tRotX = 0.75; // Low crouch
          laRotX = 0.6;
          raRotX = 0.6;
          llRotX = 1.1;
          rlRotX = 1.1;
          break;
        }
        case STATES.CHARGED_JUMP:
        case STATES.POINT_LAUNCH: {
          tRotX = 0.15;
          laRotX = 2.8; // Arms swept back
          raRotX = 2.8;
          llRotX = -0.4;
          rlRotX = -0.4;
          break;
        }
        case STATES.VAULTING: {
          tRotX = 0.55;
          laRotX = 1.6; // One hand down
          raRotX = -0.4;
          llRotX = 0.9;
          rlRotX = 0.9;
          break;
        }
        case STATES.ZIP_TO_POINT:
        case STATES.WEB_ZIP: {
          tRotX = 0.45;
          laRotX = 2.7; // Dual web shooters pointed forward
          raRotX = 2.7;
          llRotX = -0.3;
          rlRotX = -0.3;
          break;
        }
        case STATES.DIVING: {
          tRotX = 1.35; // head-first dive
          laRotX = 2.4;
          raRotX = 2.4;
          llRotX = -0.5;
          rlRotX = -0.5;
          hRotX = 0.4;
          break;
        }
        case STATES.GLIDING: {
          tRotX = 0.6;
          laRotX = 1.57; // T-pose wing span
          raRotX = 1.57;
          llRotX = -0.2;
          rlRotX = -0.2;
          break;
        }
        case STATES.SWINGING:
        case STATES.GRAPPLING: {
          tRotX = -0.25;
          laRotX = 2.7; // reaching for line
          raRotX = 0.3;
          llRotX = 0.6;
          rlRotX = -0.4;
          break;
        }
        case STATES.WALL_RUNNING_UP: {
          tRotX = 0.55;
          const climbFreq = 14;
          laRotX = Math.sin(animTime * climbFreq) * 1.2;
          raRotX = -Math.sin(animTime * climbFreq) * 1.2;
          llRotX = -Math.sin(animTime * climbFreq) * 1.2;
          rlRotX = Math.sin(animTime * climbFreq) * 1.2;
          break;
        }
        case STATES.WALL_RUNNING_LEFT: {
          tRotZ = -0.3;
          laRotX = 1.2;
          raRotX = -0.8;
          llRotX = 0.8;
          rlRotX = -0.8;
          break;
        }
        case STATES.WALL_RUNNING_RIGHT: {
          tRotZ = 0.3;
          laRotX = -0.8;
          raRotX = 1.2;
          llRotX = -0.8;
          rlRotX = 0.8;
          break;
        }
        case STATES.JUMPING: {
          tRotX = 0.15;
          laRotX = 2.2;
          raRotX = 1.8;
          llRotX = 0.4;
          rlRotX = 0.2;
          break;
        }
        case STATES.FALLING: {
          tRotX = 0.2;
          laRotX = 1.6;
          raRotX = 1.6;
          llRotX = -0.3;
          rlRotX = 0.3;
          break;
        }
        default: {
          // IDLE breathing
          tRotX = Math.sin(animTime * 2.5) * 0.03;
          laRotX = 0.1;
          raRotX = 0.1;
          llRotX = 0;
          rlRotX = 0;
          break;
        }
      }

      steppedPoseRef.current = {
        torsoRotX: tRotX,
        torsoRotY: tRotY,
        torsoRotZ: tRotZ,
        leftArmRotX: laRotX,
        rightArmRotX: raRotX,
        leftLegRotX: llRotX,
        rightLegRotX: rlRotX,
        hoodieRotX: hRotX
      };
    }

    // Apply stepped pose to character bones
    const pose = steppedPoseRef.current;
    if (torsoRef.current) {
      torsoRef.current.rotation.set(pose.torsoRotX, pose.torsoRotY, pose.torsoRotZ);
    }
    if (leftArmRef.current) leftArmRef.current.rotation.x = pose.leftArmRotX;
    if (rightArmRef.current) rightArmRef.current.rotation.x = pose.rightArmRotX;
    if (leftLegRef.current) leftLegRef.current.rotation.x = pose.leftLegRotX;
    if (rightLegRef.current) rightLegRef.current.rotation.x = pose.rightLegRotX;
    if (hoodieRef.current) hoodieRef.current.rotation.x = pose.hoodieRotX;

    // Telemetry and Multiplayer Broadcasting
    if (onTelemetryUpdate) {
      onTelemetryUpdate({
        state: p.state,
        speed: p.speed,
        speedKmh: Math.round(p.speed * 3.6),
        position: new THREE.Vector3(x, y, z),
        yaw: p.rotation,
        velocity: new THREE.Vector3(vx, vy, vz),
        grounded: p.grounded,
        trickScore: p.trickScore,
        trickName: p.trickName,
        jumpChargeRatio: p.jumpChargeRatio
      });
    }

    const now = performance.now();
    if (broadcastLocalState && now - lastBroadcastRef.current > 45) {
      lastBroadcastRef.current = now;
      broadcastLocalState({
        mode: 'traversal',
        position: [x, y, z],
        rotation: [0, p.rotation, 0],
        velocity: [vx, vy, vz],
        state: p.state,
        speed: p.speed
      });
    }
  });

  return (
    <group ref={meshGroupRef}>
      {/* Hand-Drawn Spider-Verse Character Mesh */}
      <group ref={characterRootRef} position={[0, 0.75, 0]}>
        {/* Torso & Red/Black Suit + Hoodie */}
        <group ref={torsoRef}>
          {/* Main Suit Torso */}
          <mesh castShadow position={[0, 0.35, 0]}>
            <boxGeometry args={[0.56, 0.66, 0.36]} />
            <meshStandardMaterial color="#0b0f19" roughness={0.5} />
          </mesh>

          {/* Spider Chest Emblem (Front) */}
          <mesh position={[0, 0.42, 0.19]}>
            <boxGeometry args={[0.26, 0.26, 0.02]} />
            <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
          </mesh>

          {/* Spider Emblem (Back) */}
          <mesh position={[0, 0.42, -0.22]}>
            <boxGeometry args={[0.26, 0.26, 0.02]} />
            <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
          </mesh>

          {/* Stylized Crimson Red Hoodie Jacket */}
          <mesh ref={hoodieRef} position={[0, 0.38, -0.04]}>
            <boxGeometry args={[0.64, 0.70, 0.44]} />
            <meshStandardMaterial color="#dc2626" roughness={0.6} />
          </mesh>

          {/* White Hoodie Drawstrings */}
          <mesh position={[-0.08, 0.28, 0.22]}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.08, 0.28, 0.22]}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Head & Mask */}
          <mesh position={[0, 0.86, 0]} castShadow>
            <sphereGeometry args={[0.23, 14, 14]} />
            <meshStandardMaterial color="#09090b" roughness={0.4} />
          </mesh>
          {/* Iconic White Mask Lenses with Cyber Cyan Rim */}
          <mesh position={[-0.08, 0.87, 0.19]} rotation={[0.1, -0.15, -0.15]}>
            <boxGeometry args={[0.13, 0.09, 0.04]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.08, 0.87, 0.19]} rotation={[0.1, 0.15, 0.15]}>
            <boxGeometry args={[0.13, 0.09, 0.04]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {/* Arms & Web-Shooter Gauntlets */}
          <group ref={leftArmRef} position={[-0.40, 0.55, 0]}>
            <mesh position={[0, -0.28, 0]}>
              <boxGeometry args={[0.16, 0.55, 0.16]} />
              <meshStandardMaterial color="#0b0f19" roughness={0.6} />
            </mesh>
            {/* Glowing Web Shooter */}
            <mesh position={[0, -0.46, 0.06]}>
              <boxGeometry args={[0.19, 0.15, 0.09]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} />
            </mesh>
          </group>

          <group ref={rightArmRef} position={[0.40, 0.55, 0]}>
            <mesh position={[0, -0.28, 0]}>
              <boxGeometry args={[0.16, 0.55, 0.16]} />
              <meshStandardMaterial color="#0b0f19" roughness={0.6} />
            </mesh>
            {/* Glowing Web Shooter */}
            <mesh position={[0, -0.46, 0.06]}>
              <boxGeometry args={[0.19, 0.15, 0.09]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} />
            </mesh>
          </group>
        </group>

        {/* Legs & High-Top Sneakers */}
        <group ref={leftLegRef} position={[-0.16, 0, 0]}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.18, 0.65, 0.18]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Red Chicago Sneaker Upper */}
          <mesh position={[0, -0.68, 0.06]}>
            <boxGeometry args={[0.2, 0.14, 0.32]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
          {/* White Sneaker Sole */}
          <mesh position={[0, -0.76, 0.06]}>
            <boxGeometry args={[0.22, 0.05, 0.34]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[0.16, 0, 0]}>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.18, 0.65, 0.18]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Red Chicago Sneaker Upper */}
          <mesh position={[0, -0.68, 0.06]}>
            <boxGeometry args={[0.2, 0.14, 0.32]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
          {/* White Sneaker Sole */}
          <mesh position={[0, -0.76, 0.06]}>
            <boxGeometry args={[0.22, 0.05, 0.34]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default PlayerController;
