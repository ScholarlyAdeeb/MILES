import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { player, STATES, PHASE } from '../../playerState.js';
import { groundHeightAt, solidAt, findAnchorLook, ledgeTopAt } from '../../world.js';
import { useNetwork } from '../../NetworkEngine.jsx';

// Kinematic Physics Constants
const GRAVITY = -32;
const RUN_ACCEL = 60;
const MAX_RUN = 12;
const MAX_SPRINT = 21;
const FRICTION = 9.5;
const AIR_ACCEL = 18;
const JUMP_IMPULSE = 13.5;
const COYOTE = 0.12; // 120ms
const JUMP_BUFFER = 0.15; // 150ms
const WALL_RUN_TIME = 2.2;
const WALL_RAY = 1.35;
const DIVE_GRAVITY_SCALE = 2.5;
const GLIDE_TERMINAL = -2.0;
const MANTLE_TIME = 0.25;

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
  const swingTimer = useRef(0);
  const mantle = useRef(null);
  const lastBroadcastRef = useRef(0);

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
      down: false,
      yawDelta: 0,
      pitchDelta: 0,
      jumpPressed: false,
      jumpReleased: false,
      grapplePressed: false
    };
    const p = player;

    // 1. Orientation & Mouse Look
    p.rotation += i.yawDelta || 0;
    p.pitch = clamp(p.pitch + (i.pitchDelta || 0), -0.95, 0.7);
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
    i.jumpPressed = false;
    i.jumpReleased = false;
    i.grapplePressed = false;

    if (jumpPressed) p.jumpBuffer = JUMP_BUFFER;
    else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);

    grappleCooldown.current = Math.max(0, grappleCooldown.current - dt);
    p.landTimer = Math.max(0, p.landTimer - dt);

    const wishX = fx * (i.forward || 0) + rx * (i.strafe || 0);
    const wishZ = fz * (i.forward || 0) + rz * (i.strafe || 0);
    const wishLen = Math.hypot(wishX, wishZ) || 1;
    const wx = wishX / wishLen;
    const wz = wishZ / wishLen;
    const hasWish = Math.abs(i.forward || 0) + Math.abs(i.strafe || 0) > 0;

    // 2. Grapple Target Reticle Cone-Cast
    p.anchorCandidate = p.phase === PHASE.SWING
      ? null
      : findAnchorLook(x, y + 1.4, z, fx * lookScale, lookY, fz * lookScale, 45);

    // 3. Grapple Shoot / Release
    if (p.phase !== PHASE.SWING && grapplePressed && grappleCooldown.current <= 0) {
      const anchor = p.anchorCandidate;
      if (anchor) {
        p.anchor = anchor;
        p.ropeLength = Math.hypot(anchor[0] - x, anchor[1] - (y + 1.2), anchor[2] - z);
        p.phase = PHASE.SWING;
        p.state = STATES.GRAPPLING;
        swingTimer.current = 0;
      }
    }

    // 4. State Machine Branching
    if (p.phase === PHASE.MANTLE) {
      // ---- MANTLING ----
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
    } else if (p.phase === PHASE.SWING) {
      // ---- PENDULUM GRAPPLE & SWINGING ----
      swingTimer.current += dt;
      const a = p.anchor;
      if (!a || (jumpPressed && swingTimer.current > 0.08)) {
        // Tangential release with dynamic forward launch boost
        p.phase = PHASE.AIR;
        p.state = STATES.JUMPING;
        p.anchor = null;
        grappleCooldown.current = 0.35;
        vy = Math.max(vy, 0) + 8.5;
        const forwardPush = 1.35;
        vx *= forwardPush;
        vz *= forwardPush;
      } else {
        p.state = STATES.SWINGING;
        const ax = a[0];
        const ay = a[1];
        const az = a[2];

        // Pendulum constraint & tension
        let toX = x - ax;
        let toY = y - ay;
        let toZ = z - az;
        let dist = Math.hypot(toX, toY, toZ) || 0.001;

        // Apply gravity
        vy += GRAVITY * dt;

        // Add swing pumping along look direction
        if (hasWish) {
          vx += wx * AIR_ACCEL * 1.5 * dt;
          vz += wz * AIR_ACCEL * 1.5 * dt;
        }

        // Integrate tentative velocity
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;

        toX = x - ax;
        toY = y - ay;
        toZ = z - az;
        dist = Math.hypot(toX, toY, toZ) || 0.001;

        // Constrain to rope sphere radius
        const targetLen = p.ropeLength;
        if (dist > targetLen) {
          const nx = toX / dist;
          const ny = toY / dist;
          const nz = toZ / dist;

          x = ax + nx * targetLen;
          y = ay + ny * targetLen;
          z = az + nz * targetLen;

          // Project velocity onto sphere tangent
          const vDotN = vx * nx + vy * ny + vz * nz;
          vx -= vDotN * nx;
          vy -= vDotN * ny;
          vz -= vDotN * nz;
          // Cable tension preservation boost
          vx *= 1.002;
          vz *= 1.002;
        }

        // Auto release if above anchor or stalling
        if (y > ay + 1 || (dist < 3 && swingTimer.current > 0.6)) {
          p.phase = PHASE.AIR;
          p.anchor = null;
          grappleCooldown.current = 0.4;
          vy += 6.5;
        }
      }
    } else {
      // ---- GROUND / AIR / WALL TRAVERSAL ----

      // Lateral raycasting for walls (-90 deg and +90 deg)
      const rayL_x = -rx;
      const rayL_z = -rz;
      const rayR_x = rx;
      const rayR_z = rz;

      const hitL = solidAt(x + rayL_x * WALL_RAY, y + 1.2, z + rayL_z * WALL_RAY, 0.2);
      const hitR = solidAt(x + rayR_x * WALL_RAY, y + 1.2, z + rayR_z * WALL_RAY, 0.2);

      const canWallRun = !p.grounded && (hitL || hitR) && vy < 8 && Math.hypot(vx, vz) > 4;

      if (canWallRun && (p.phase === PHASE.AIR || p.phase === PHASE.WALL)) {
        // ---- WALL RUNNING (LEFT / RIGHT) ----
        p.phase = PHASE.WALL;
        const isLeft = !!hitL;
        p.wallSide = isLeft ? -1 : 1;
        p.state = isLeft ? STATES.WALL_RUNNING_LEFT : STATES.WALL_RUNNING_RIGHT;
        p.wallTimer = Math.min(WALL_RUN_TIME, p.wallTimer + dt);

        const wallB = isLeft ? hitL : hitR;
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

        // Soft gravity decay over 2.2s
        const gravityDecay = THREE.MathUtils.lerp(0.12, 0.9, p.wallTimer / WALL_RUN_TIME);
        vy += GRAVITY * gravityDecay * dt;

        // Project forward along wall surface
        const wallTangentX = -nz;
        const wallTangentZ = nx;
        const forwardDot = fx * wallTangentX + fz * wallTangentZ;
        const wallDirX = wallTangentX * (forwardDot >= 0 ? 1 : -1);
        const wallDirZ = wallTangentZ * (forwardDot >= 0 ? 1 : -1);

        const wallSpeed = Math.max(MAX_RUN, Math.hypot(vx, vz));
        vx = wallDirX * wallSpeed;
        vz = wallDirZ * wallSpeed;

        // Wall Jump impulse
        if (p.jumpBuffer > 0) {
          p.jumpBuffer = 0;
          p.phase = PHASE.AIR;
          p.state = STATES.WALL_JUMPING;
          p.wallTimer = 0;
          vx = nx * 7.5 + wallDirX * 8.5;
          vz = nz * 7.5 + wallDirZ * 8.5;
          vy = 8.5;
        }
      } else {
        // ---- AIR / GROUND ----
        p.wallTimer = 0;
        p.wallSide = 0;

        const groundY = groundHeightAt(x, z, y + 0.35);
        const onGround = y <= groundY + 0.08 && vy <= 0.1;

        if (onGround) {
          p.grounded = true;
          p.coyote = COYOTE;
          y = groundY;
          vy = 0;

          // Ground Movement & Sprinting
          const targetMax = i.sprint ? MAX_SPRINT : MAX_RUN;
          if (hasWish) {
            vx += wx * RUN_ACCEL * dt;
            vz += wz * RUN_ACCEL * dt;
            const hSpeed = Math.hypot(vx, vz);
            if (hSpeed > targetMax) {
              vx = (vx / hSpeed) * targetMax;
              vz = (vz / hSpeed) * targetMax;
            }
            p.state = i.sprint ? STATES.SPRINTING : STATES.RUNNING;
          } else {
            // Apply ground friction
            const hSpeed = Math.hypot(vx, vz);
            const drop = FRICTION * dt * hSpeed;
            const newSpeed = Math.max(0, hSpeed - drop);
            if (hSpeed > 0.001) {
              vx = (vx / hSpeed) * newSpeed;
              vz = (vz / hSpeed) * newSpeed;
            }
            p.state = p.landTimer > 0 ? STATES.LANDING : STATES.IDLE;
          }

          // Ground Jump
          if (p.jumpBuffer > 0 || (i.jump && p.coyote > 0)) {
            p.jumpBuffer = 0;
            p.coyote = 0;
            vy = JUMP_IMPULSE;
            p.grounded = false;
            p.phase = PHASE.AIR;
            p.state = STATES.JUMPING;
          }
        } else {
          // ---- IN AIR ----
          p.grounded = false;
          p.phase = PHASE.AIR;
          p.coyote = Math.max(0, p.coyote - dt);

          // Dive or Glide Mechanics
          const isDiving = i.down && vy < -2;
          const isGliding = i.jump && vy < 0;

          if (isDiving) {
            p.state = STATES.DIVING;
            vy += GRAVITY * DIVE_GRAVITY_SCALE * dt;
            // Convert downward dive speed into forward aerodynamic drive
            vx += fx * 16 * dt;
            vz += fz * 16 * dt;
          } else if (isGliding) {
            p.state = STATES.GLIDING;
            // Cap falling speed to terminal glide
            vy = Math.max(GLIDE_TERMINAL, vy + GRAVITY * 0.25 * dt);
            if (hasWish) {
              vx += wx * AIR_ACCEL * dt;
              vz += wz * AIR_ACCEL * dt;
            }
          } else {
            p.state = vy > 0.5 ? STATES.JUMPING : STATES.FALLING;
            vy += GRAVITY * dt;
            if (hasWish) {
              vx += wx * AIR_ACCEL * dt;
              vz += wz * AIR_ACCEL * dt;
            }
          }

          // Ledge Mantle Detection (Check when nearing top edge of building)
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

      // Physics Position Integration
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

    // Smooth camera roll / lean in turns and wall runs
    let targetLean = 0;
    if (p.state === STATES.WALL_RUNNING_LEFT) targetLean = 0.21;
    if (p.state === STATES.WALL_RUNNING_RIGHT) targetLean = -0.21;
    p.lean = THREE.MathUtils.lerp(p.lean, targetLean, dt * 8);

    // Update Mesh Group Transform
    if (meshGroupRef.current) {
      meshGroupRef.current.position.set(x, y, z);
      meshGroupRef.current.rotation.y = p.rotation;
    }

    // 5. "ON-TWOS" ANIMATION MODIFIER (12 FPS Stepped Keyframing)
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
        grounded: p.grounded
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
