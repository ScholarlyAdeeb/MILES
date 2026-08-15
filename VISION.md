# 🎨 MILES — Project Vision, Architecture & Concept Deck

> **"Put on your favorite track. Jump into a sketchbook city. Drive or swing through the night with a friend."**

---

## Executive Summary

**MILES** is a browser-based, music-first urban traversal and social exploration platform built on **WebGL**, **Three.js**, and **React Three Fiber (R3F)**. 

Combining the atmospheric tranquility of midnight highway drives with the kinetic, high-altitude momentum of superhero traversal, MILES renders an expansive metropolis through a signature **Spider-Verse hand-drawn sketchbook aesthetic**. It requires zero downloads, runs directly on desktop and mobile browsers, and treats the virtual world as an interactive visualizer for music.

---

## 🏛️ The Three Architectural Pillars

```
+-------------------------------------------------------------------------------------------------------+
|                                              MILES                                                    |
+-----------------------------------+-----------------------------------+-------------------------------+
|     1. MUSIC VIDEO AS A WORLD     |     2. SPIDER-VERSE NPR ENGINE    |   3. NATIVE 3D MONETIZATION   |
+-----------------------------------+-----------------------------------+-------------------------------+
| * ROAM & Traversal mode           | * Sobel ink contour detection     | * Zero popups or video ads    |
| * Synchronized floating lyrics    | * Dynamic halftone Ben-Day dots   | * Spatial billboard inventory |
| * DRIVE mode sedan cockpit        | * 12 FPS "On-Twos" stop-motion    |   (`BILLBOARD_001` - `060`)   |
| * Interactive dash infotainment   | * Zero-Poly (<2MB, <40 draw calls)| * Organic urban brand spaces  |
+-----------------------------------+-----------------------------------+-------------------------------+
```

### 1. Music Video as an Interactive World
Music is not passive background audio in MILES—the city itself functions as a live reactive stage.
* **ROAM Mode**: Flow across stylized skyscrapers via swinging, wall-running, mantling, and diving while time-synced LRC lyric tracks project contextually into the 3D space.
* **DRIVE Mode**: Relax inside an aerodynamic luxury sedan cockpit, watching streetlights, neon signs, and light trails stream past while operating the in-dash media console.

### 2. "Spider-Verse" Non-Photorealistic Rendering (NPR) Engine
Instead of demanding gigabytes of PBR textures and heavy compute passes, MILES employs an optimized, stylized NPR pipeline:
* **Graphite & Ink Outlines**: Real-time Sobel edge detection across depth and luminance buffers.
* **Procedural Shading & Ben-Day Halftone**: Procedural cross-hatching and rotated dot grids replace heavy compute shaders.
* **"On-Twos" Step-Frame Motion**: Character skeletal poses step at an authentic 12 FPS over a buttery 60–120 FPS camera and environment render loop.
* **Extreme WebGL Efficiency**: Sub-2MB asset footprint, streaming over 140 skyscrapers in fewer than 40 draw calls via hardware instancing.

### 3. Native & Non-Intrusive In-World Real Estate
* Eliminates intrusive video interruptions and UI banners.
* Employs fixed, spatially tracked billboard placements (`BILLBOARD_001` to `BILLBOARD_060`) embedded directly into highway hoardings and building facades.

---

## 🎮 Gameplay & Traversal Physics Matrix

| Action | Mechanic & Mathematical Physics | Desktop Control | Mobile Gesture |
| :--- | :--- | :--- | :--- |
| **Run & Sprint** | Smooth WASD vector acceleration with high-speed sprint multiplier | `W` `A` `S` `D` + `Shift` | Floating Virtual Joystick |
| **Wall Run** | Dual side-probe raycasts detect vertical facades; forward velocity projects along wall plane with soft gravity decay | Run parallel + `Space` | Swipe toward Wall |
| **Wall Jump** | Impulse vector launch away from wall normal:<br>$$\vec{V}_{\text{out}} = (\vec{N} \cdot 7.5) + (\vec{U} \cdot 6.5) + (\vec{V}_{\text{wall}} \cdot 0.55)$$ | `Space` during Wall Run | Tap Screen |
| **Pendulum Grapple** | Aim-cone raycast selects rooftop edges; redirects gravity into forward tangential momentum:<br>$$\vec{V}_{\text{launch}} = \vec{V}_{\text{tangential}}$$ | Hold `Space` / Right Click | Contextual Reticle Tap |
| **High-Altitude Dive** | Multiplies gravity ($2.5\times$) and converts vertical falling speed into forward drive | `S` (Airborne) | Swipe Down |
| **Glide** | Caps terminal falling speed to $-2\text{ m/s}$ with aerodynamic horizontal air steering | Hold `Space` (Airborne) | Hold Touch Surface |
| **Mantle** | Dual-ray waist & eye probe automatically snaps and interpolates player onto rooftops | Automatic on Ledge | Swipe Up |

---

## 🖥️ UI Architecture & Visual Ratio

```
┌────────────────────────────────────────────────────────────────────────┐
│ MILES.               SECTOR 7 // SKETCH CITY          [ ◉ ] [ 👤 2 ] [ ⋯ ] │
│                                                                        │
│                                                                        │
│                      I WANNA BE YOURS TONIGHT                          │
│                      (Cinematic Floating Lyric)                        │
│                                                                        │
│                                                                        │
│                     ┌───────────────────────────┐                      │
│                     │  [♫ Album] Song Title  ►  │                      │
│                     └───────────────────────────┘                      │
└────────────────────────────────────────────────────────────────────────┘
```

* **90 / 7 / 3 World-First Composition**: 90% Unobstructed 3D Canvas, 7% Social & Audio HUD, 3% Minimal Navigation.
* **Glassmorphism Styling**: Ultra-refined `backdrop-filter: blur(16px)` panels, dark neutral borders, and uncluttered typography.
* **Developer Telemetry (`F3`)**: Complete real-time physics telemetry (state machine, speed, altitude, velocity vectors, raycast probes) cleanly decoupled from production UI.

---

## 🗺️ Engineering & Production Roadmap

```
Phase 1: Core Traversal Engine (COMPLETED)
├── Stabilized Wall-Running, Pendulum Grapple, Diving, Gliding & Mantling
├── Spider-Verse NPR Post-Processing Shader & Speed-Dynamic Camera FOV
└── Instanced Skyscraper Metropolis & Spatial Hashing Pipeline
       │
Phase 2: Real-Time Networking Foundation (ACTIVE)
├── 6-Character Room Codes (CREATE / JOIN)
└── Low-Latency WebSocket Player State & Transform Synchronization
       │
Phase 3: Shared Audio & Synced Lyrics
├── HTML5 Audio Engine & Infotainment Integration
└── Synchronized LRC Lyric Stream across room instances
       │
Phase 4: Co-op Traversal & Native Advertising Platform
├── Duo Time-Trials, Rooftop Checkpoints & Proximity Voice Chat
└── 3D Billboard Inventory Management (`BILLBOARD_001` - `BILLBOARD_060`)
```

---

## 🎯 Target Audience & Core Value Proposition

* **Target Audience**: Music enthusiasts, late-night vibe seekers, casual gamers, and fans of stylized animation seeking high-end interactive aesthetics without 50 GB downloads or native app installations.
* **The Core Experience**: Instant, zero-friction access to a vibrant, living comic-book universe powered entirely by modern web standards.
