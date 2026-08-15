import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { player } from '../../playerState.js';

// Custom Vertex Shader for Fullscreen Quad
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Spider-Verse Vibrant Comic-Book Shader:
// Combines rich saturated 3D colors + Sobel ink pen outlines + subtle halftone dot shading + speed chromatic aberration
const fragmentShader = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uFov;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uDayMode;
  varying vec2 vUv;

  // Simple pseudo-random hash
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Smooth procedural 2D noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // Linearize depth from buffer
  float readDepth(vec2 coord) {
    float depthZ = texture2D(tDepth, coord).r;
    float viewZ = (uCameraNear * uCameraFar) / ((uCameraFar - uCameraNear) * depthZ - uCameraFar);
    return clamp(-viewZ / (uCameraFar * 0.4), 0.0, 1.0);
  }

  // RGB to Luminance
  float getLuma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  // Adjust Saturation
  vec3 adjustSaturation(vec3 color, float sat) {
    float l = getLuma(color);
    return mix(vec3(l), color, sat);
  }

  void main() {
    vec2 uv = vUv;
    vec2 texel = 1.0 / uResolution;

    // 1. Subtle Paper Boil Micro-Jitter (Stepped at 12 FPS for authentic stop-motion comic feel)
    float jitterFrame = floor(uTime * 12.0);
    float jitterSeed = hash(vec2(jitterFrame, 94.1));
    vec2 jitter = (vec2(hash(vec2(jitterSeed, 1.0)), hash(vec2(jitterSeed, 2.0))) - 0.5) * 0.0008;
    vec2 jitteredUv = uv + jitter;

    // 2. Dynamic Speed Chromatic Aberration (Spider-Verse Comic Print Misalignment)
    float speedRatio = clamp((uSpeed - 12.0) / 25.0, 0.0, 1.0);
    vec2 offset = (uv - 0.5) * (speedRatio * 0.007 + 0.0004);

    vec4 colR = texture2D(tDiffuse, jitteredUv + offset);
    vec4 colG = texture2D(tDiffuse, jitteredUv);
    vec4 colB = texture2D(tDiffuse, jitteredUv - offset);

    vec3 sceneColor = vec3(colR.r, colG.g, colB.b);
    float luma = getLuma(sceneColor);

    // 3. Sobel Edge Detection (Crisp Comic Book Ink Outlines)
    float d00 = readDepth(jitteredUv + vec2(-texel.x, -texel.y));
    float d01 = readDepth(jitteredUv + vec2(0.0, -texel.y));
    float d02 = readDepth(jitteredUv + vec2(texel.x, -texel.y));
    float d10 = readDepth(jitteredUv + vec2(-texel.x, 0.0));
    float d12 = readDepth(jitteredUv + vec2(texel.x, 0.0));
    float d20 = readDepth(jitteredUv + vec2(-texel.x, texel.y));
    float d21 = readDepth(jitteredUv + vec2(0.0, texel.y));
    float d22 = readDepth(jitteredUv + vec2(texel.x, texel.y));

    float gxDepth = (-d00 + d02 - 2.0 * d10 + 2.0 * d12 - d20 + d22);
    float gyDepth = (-d00 - 2.0 * d01 - d02 + d20 + 2.0 * d21 + d22);
    float edgeDepth = sqrt(gxDepth * gxDepth + gyDepth * gyDepth);

    // Color/Luminance Sobel for architectural borders & character outlines
    float c00 = getLuma(texture2D(tDiffuse, jitteredUv + vec2(-texel.x, -texel.y)).rgb);
    float c02 = getLuma(texture2D(tDiffuse, jitteredUv + vec2(texel.x, -texel.y)).rgb);
    float c10 = getLuma(texture2D(tDiffuse, jitteredUv + vec2(-texel.x, 0.0)).rgb);
    float c12 = getLuma(texture2D(tDiffuse, jitteredUv + vec2(texel.x, 0.0)).rgb);
    float c20 = getLuma(texture2D(tDiffuse, jitteredUv + vec2(-texel.x, texel.y)).rgb);
    float c22 = getLuma(texture2D(tDiffuse, jitteredUv + vec2(texel.x, texel.y)).rgb);

    float gxLuma = (-c00 + c02 - 2.0 * c10 + 2.0 * c12 - c20 + c22);
    float gyLuma = (-c00 - 2.0 * getLuma(colG.rgb) - c02 + c20 + 2.0 * getLuma(colG.rgb) + c22);
    float edgeLuma = sqrt(gxLuma * gxLuma + gyLuma * gyLuma);

    // Ink edge with fine line weight
    float edge = clamp((edgeDepth * 22.0 + edgeLuma * 4.5) - 0.15, 0.0, 1.0);

    // 4. Subtle Ben-Day Halftone Dot Screen (Comic Shading for midtones, preserves color)
    vec2 screenCoord = uv * uResolution;
    float dotScale = 0.14;
    vec2 dotUv = screenCoord * dotScale;
    vec2 rotDotUv = vec2(
      dotUv.x * 0.7071 - dotUv.y * 0.7071,
      dotUv.x * 0.7071 + dotUv.y * 0.7071
    );
    vec2 gridPos = fract(rotDotUv) - 0.5;
    float distToDot = length(gridPos);
    
    // Halftone dots only appear gently in shadow/midtone zones
    float dotRadius = clamp((0.45 - luma) * 0.9, 0.0, 0.42);
    float halftoneDot = smoothstep(dotRadius + 0.04, dotRadius - 0.04, distToDot);
    float halftoneTone = mix(1.0, 0.78, halftoneDot * (1.0 - smoothstep(0.4, 0.75, luma)));

    // 5. Comic Contrast & Vibrant Color Grading (Spider-Verse Pop)
    vec3 vibrantColor = adjustSaturation(sceneColor, 1.25);
    // Slight S-curve for punchy comic book black levels & highlights
    vibrantColor = pow(vibrantColor, vec3(0.92));

    // Multiply subtle halftone tone on shadow areas to give comic print texture
    vec3 comicColor = vibrantColor * halftoneTone;

    // 6. Bold Ink Outlines (Rich Charcoal/Black Comic Pen)
    vec3 inkOutlineColor = (uDayMode > 0.5) ? vec3(0.08, 0.06, 0.10) : vec3(0.02, 0.02, 0.05);
    comicColor = mix(comicColor, inkOutlineColor, edge * 0.88);

    // 7. Emissive Glow Protection (Neon lights, character eyes, spider logo, web lines)
    float maxChannel = max(max(sceneColor.r, sceneColor.g), sceneColor.b);
    float isEmissive = step(0.65, maxChannel);
    if (isEmissive > 0.5) {
      // Restore vivid glowing original tone with slight boost
      comicColor = mix(comicColor, sceneColor * 1.3, 0.6);
    }

    // 8. Subtle Comic Paper Grain & Vignette
    float paperGrain = (noise(uv * uResolution * 0.75) - 0.5) * 0.025;
    float vignette = 1.0 - dot(uv - 0.5, uv - 0.5) * 0.45;
    comicColor = (comicColor + paperGrain) * vignette;

    gl_FragColor = vec4(clamp(comicColor, 0.0, 1.0), 1.0);
  }
`;

export function PencilPass({ isDayMode = false }) {
  const { gl, scene, camera, size } = useThree();

  const quadMeshRef = useRef();

  const [renderTarget, postCamera, postScene] = useMemo(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    const target = new THREE.WebGLRenderTarget(
      size.width * dpr,
      size.height * dpr,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: true,
        stencilBuffer: false
      }
    );
    target.depthTexture = new THREE.DepthTexture(
      size.width * dpr,
      size.height * dpr
    );
    target.depthTexture.type = THREE.UnsignedShortType;

    const pCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pScene = new THREE.Scene();

    return [target, pCam, pScene];
  }, [size.width, size.height]);

  const uniforms = useMemo(() => ({
    tDiffuse: { value: null },
    tDepth: { value: null },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uTime: { value: 0 },
    uSpeed: { value: 0 },
    uFov: { value: camera.fov || 60 },
    uCameraNear: { value: camera.near || 0.1 },
    uCameraFar: { value: camera.far || 350 },
    uDayMode: { value: isDayMode ? 1.0 : 0.0 }
  }), [camera.far, camera.fov, camera.near, isDayMode, size.height, size.width]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthTest: false,
      depthWrite: false
    });
  }, [uniforms]);

  useEffect(() => {
    const geom = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geom, material);
    quadMeshRef.current = quad;
    postScene.add(quad);

    return () => {
      postScene.remove(quad);
      geom.dispose();
    };
  }, [material, postScene]);

  // Render loop override: Render main 3D scene into renderTarget, then render shader quad to screen
  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uSpeed.value = player.speed || 0;
    uniforms.uFov.value = camera.fov || 60;
    uniforms.uDayMode.value = isDayMode ? 1.0 : 0.0;
    uniforms.uResolution.value.set(size.width, size.height);

    // Hide quad during 3D pass
    if (quadMeshRef.current) quadMeshRef.current.visible = false;

    // Render 3D scene to offscreen target
    gl.setRenderTarget(renderTarget);
    gl.render(scene, camera);

    // Feed rendered texture to post-processing shader
    uniforms.tDiffuse.value = renderTarget.texture;
    uniforms.tDepth.value = renderTarget.depthTexture;

    // Render fullscreen quad to canvas
    if (quadMeshRef.current) quadMeshRef.current.visible = true;
    gl.setRenderTarget(null);
    gl.render(postScene, postCamera);
  }, 1);

  return null;
}

export default PencilPass;
