# Architecture Documentation: Spider-Verse Traversal & Metropolis Engine

## 1. Executive System Overview

This project is a high-performance **3D web application** built with **React 18**, **Three.js**, and **@react-three/fiber (R3F)**. It provides two seamlessly switchable simulation modes:

1. **Acrobatic Traversal Mode (Default)**: A Spider-Man inspired traversal engine featuring web-swinging with pendulum physics, wall-running, diving, parkour mantling, web-zips, and dynamic third-person camera mechanics.
2. **Cyberpunk Driving Mode**: An arcade vehicular physics simulation with cockpit and chase cameras, dynamic traffic, procedural highway generation, and an interactive dashboard.

The entire visual pipeline is rendered through a **custom Spider-Verse Non-Photorealistic Rendering (NPR) Shader Pass**, combining Sobel ink contours, halftone Ben-Day screening, 12 FPS stop-motion paper micro-jitter, and velocity-coupled chromatic aberration.

---

## 2. System Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    BROWSER CLIENT                                     |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  |                             INPUT & CONTROL LAYER                               |  |
|  |  * PointerLock API (Mouse Look)           * Keyboard / Gamepad (WASD, Space, Shift) |  |
|  |  * Virtual Joystick / Mobile Touch UI     * State Hook (useDrivingControls.js)    |  |
|  +-----------------------------------------+---------------------------------------+  |
|                                            |                                          |
|                                            v                                          |
|  +-----------------------------------------+---------------------------------------+  |
|  |                         MUTABLE CORE STATE (Zero-GC)                            |  |
|  |  * playerState.js (Pos, Vel, Rot, Pitch, State Machine, Grapple Anchors, Lean)   |  |
|  +--------------------+------------------------------------+-----------------------+  |
|                       |                                    |                          |
|                       v                                    v                          |
|  +--------------------+--------------+   +-----------------+-----------------------+  |
|  |     PHYSICS & TRAVERSAL ENGINE    |   |     PROCEDURAL WORLD & STREAMING        |  |
|  |  * PlayerController.jsx (Euler RK4)  |   |  * world.js (Deterministic Chunk Hash)|  |
|  |  * GrappleEngine.jsx (Pendulum Hooke) |   |  * CityManager.jsx (Instanced Skyscrp)|  |
|  |  * TraversalCamera.jsx (Spring-Damp) |   |  * InfiniteRoad.jsx (Highway Stream)  |  |
|  +--------------------+--------------+   +-----------------+-----------------------+  |
|                       |                                    |                          |
|                       +------------------+-----------------+                          |
|                                          |                                            |
|                                          v                                            |
|  +---------------------------------------+-----------------------------------------+  |
|  |                         R3F SCENE GRAPH (DriveScene.jsx)                        |  |
|  |  * 3D Geometry: Skyscrapers, HVACs, Billboards, Helipads, Character Model       |  |
|  |  * Lighting: Dynamic Directional Light, Horizon Neon Points, Day/Night Tint    |  |
|  +---------------------------------------+-----------------------------------------+  |
|                                          |                                            |
|                                          v (Offscreen FBO + Depth Texture)            |
|  +---------------------------------------+-----------------------------------------+  |
|  |                   POST-PROCESSING SHADER PASS (PencilPass.jsx)                  |  |
|  |  * 1. 12 FPS Stop-Motion Paper Boil Jitter                                      |  |
|  |  * 2. Velocity-Driven Chromatic Aberration                                        |  |
|  |  * 3. Sobel Depth & Luminance Ink Outlines                                       |  |
|  |  * 4. Ben-Day Halftone Dot Screen in Shadow Zones                                |  |
|  |  * 5. S-Curve Comic Color Grading & Emissive Light Boost                        |  |
|  +---------------------------------------+-----------------------------------------+  |
|                                          |                                            |
|                                          v (Blit to Canvas Screen)                    |
|  +---------------------------------------+-----------------------------------------+  |
|  |                            UI / HUD OVERLAY LAYER                               |  |
|  |  * UIOverlayManager.jsx (Spider Crosshair, Speedometer, Altitude, Stunt Tracker)|  |
|  |  * DeveloperHUD.jsx (Physics Debug, Chunk Inspector, Wireframe Toggles)         |  |
|  |  * AudioEngine.jsx (Spatial Web-Audio: Wind Whoosh, Web Thwips, Engine RPM)    |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

---

## 3. Directory & File Structure

```
├── ARCHITECTURE.md                  # Complete architectural documentation
├── metadata.json                    # Application metadata & permissions
├── package.json                     # Dependencies & build scripts
├── server.ts                        # Express production server & static asset host
├── src/
│   ├── App.jsx                      # Main React application shell & Canvas mount
│   ├── DriveScene.jsx               # Central 3D scene orchestrator & lighting
│   ├── AudioEngine.jsx              # Web Audio API procedural sound synthesizer
│   ├── NetworkEngine.jsx            # Multi-user session provider (WebRTC/WS)
│   ├── playerState.js               # Zero-allocation mutable player state & enum definitions
│   ├── world.js                     # Procedural chunk hashing, AABBs & raycasting queries
│   ├── components/
│   │   ├── input/
│   │   │   ├── useDrivingControls.js # Keyboard, mouse lock & touch event listeners
│   │   │   └── VirtualJoystick.jsx   # On-screen dual joysticks for mobile devices
│   │   ├── traversal/
│   │   │   ├── PlayerController.jsx  # Hero physics, kinematic state machine, mesh rigs
│   │   │   ├── GrappleEngine.jsx     # Web line renderer & spring physics integration
│   │   │   └── TraversalCamera.jsx   # 3rd-person cinematic spring-damped camera
│   │   ├── world/
│   │   │   ├── CityManager.jsx       # Instanced mesh skyscraper chunk streamer
│   │   │   ├── PencilPass.jsx        # Comic-book NPR post-processing GLSL shader
│   │   │   └── TrafficParticles.jsx  # Ground-level animated vehicular light trails
│   │   └── ui/
│   │       ├── UIOverlayManager.jsx  # HUD, web crosshair, stunt combos, mode toggles
│   │       └── DeveloperHUD.jsx      # Diagnostic telemetry & debug meters
```

---

## 4. Key Subsystems & Technical Details

### 4.1. High-Performance State Management (`playerState.js`)
To sustain 60–120 FPS without React reconciliation overhead or garbage collection pauses, player physics uses a **singleton mutable object (`player`)**:
* **Position & Velocity**: Float vectors `[x, y, z]` updated in-place every frame.
* **State Machine**: 
  - `STATES.IDLE`: Rooftop stance.
  - `STATES.RUNNING`: Ground sprint.
  - `STATES.JUMPING`: Upward ballistic launch.
  - `STATES.FALLING`: Aerial descent with aerodynamic drag.
  - `STATES.SWINGING`: Pendulum rope physics tethered to rooftop anchors.
  - `STATES.WALL_RUNNING`: Gravitational lock against vertical building facades.
  - `STATES.WALL_CLIMBING`: Vertical mantle/ascent.
  - `STATES.DIVING`: Terminal velocity dive with speed streaks and camera tilt.
  - `STATES.ZIP`: High-velocity straight-line pull towards a target anchor.

### 4.2. Procedural Infinite City (`world.js` & `CityManager.jsx`)
* **Deterministic Chunk Generation**: The city is divided into $80\text{m} \times 80\text{m}$ chunks indexed by `(cx, cz)`. Skyscraper heights, widths, and architectural color palettes are generated using deterministic spatial hashing (`hash2(cx, cz)`), ensuring identical skyline persistence across camera frustums.
* **Hardware Instancing (`THREE.InstancedMesh`)**: Over 140 skyscrapers, HVAC units, rooftop antenna masts, and glowing neon roof crowns are rendered using instanced draw calls, drastically reducing CPU draw overhead.
* **Collision Raycasting & Anchor Queries**:
  - `solidAt(x, y, z)`: AABB box overlap check for player collisions.
  - `groundHeightAt(x, z)`: Finds the highest roof or street surface below the player.
  - `findAnchorLook(px, py, pz, dx, dy, dz)`: Cone-casts along camera forward vectors to find rooftop anchor candidates for web swinging and zip-pulls.

### 4.3. Spider-Verse NPR Post-Processing Pipeline (`PencilPass.jsx`)
The rendering pipeline overrides standard linear shading with a custom full-screen shader:
1. **Scene Render to Offscreen FBO**: Captures color and hardware depth buffers.
2. **Paper Micro-Jitter**: A 12 FPS stepped pseudo-random offset ($UV + \Delta UV$) mimicking stop-motion animation.
3. **Chromatic Misalignment**: Simulates offset comic-book printing plates along high-velocity radial vectors.
4. **Sobel Ink Contours**: Computes spatial gradients across the depth and luminance buffers to outline building edges and character silhouettes with dark ink pens.
5. **Ben-Day Halftone Screen**: Rotated procedural dot screen overlaid in shadow midtones while preserving vibrant base colors.
6. **Emissive Protection**: Protects neon crowns, spider emblems, and eye lenses from being darkened by outlines.

### 4.4. Traversal Kinematics & Pendulum Dynamics (`PlayerController.jsx`)
* **Web-Swinging Physics**: When tethered to an anchor point $\vec{A}$:
  $$\vec{r} = \vec{P} - \vec{A}$$
  The component of velocity along the rope vector is eliminated or spring-constrained, while gravity and forward swing impulse apply angular acceleration along the tangent vector $\hat{T} = \frac{\vec{V} \times \vec{r}}{\|\vec{r}\|}$.
* **Wall-Running**: Raycasts to left and right detect skyscraper facades. Gravity is attenuated, velocity is projected onto the wall tangent, and the camera applies a $12^\circ$ roll tilt.
* **Dynamic FOV & Camera Tracking (`TraversalCamera.jsx`)**: 
  - The camera uses a lagged exponential lerp to follow player position without jitter.
  - FOV expands dynamically from $62^\circ$ (idle) to $88^\circ$ (top speed).
  - Obstacle clipping prevention raycasts from player center to desired camera position, sliding the camera forward if a building occludes the view.

### 4.5. Audio Synthesis Engine (`AudioEngine.jsx`)
* Procedural audio synthesized via the **Web Audio API** without external audio files.
* **Wind Noise Generator**: Pink noise filtered through a dynamic Biquad bandpass filter mapped to player speed.
* **Web Thwip & Snap**: High-frequency exponential decay oscillators simulating web line discharge and tension release.
* **Impact & Step Foley**: Short low-pass thump oscillators triggered on ground/wall contact.

---

## 5. Build & Deployment Architecture

* **Development**: Powered by Vite with Hot Module Replacement (`tsx server.ts`).
* **Production Build**: 
  - Frontend bundled into `dist/` via `vite build`.
  - Backend server bundled into self-contained `dist/server.cjs` via `esbuild`.
* **Execution**: Single production entry point via `node dist/server.cjs` listening on container port `3000`.
