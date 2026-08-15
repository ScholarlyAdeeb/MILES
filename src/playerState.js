// Decoupled, netcode-ready player state snapshot.
// Any system (camera, renderer, HUD, net sync) reads this;
// only PlayerController writes it.

export const STATES = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  SPRINTING: "SPRINTING",
  VAULTING: "VAULTING",
  JUMPING: "JUMPING",
  CHARGING_JUMP: "CHARGING_JUMP",
  CHARGED_JUMP: "CHARGED_JUMP",
  FALLING: "FALLING",
  WALL_RUNNING_LEFT: "WALL_RUNNING_LEFT",
  WALL_RUNNING_RIGHT: "WALL_RUNNING_RIGHT",
  WALL_RUNNING_UP: "WALL_RUNNING_UP",
  WALL_JUMPING: "WALL_JUMPING",
  GRAPPLING: "GRAPPLING",
  SWINGING: "SWINGING",
  DIVING: "DIVING",
  GLIDING: "GLIDING",
  MANTLING: "MANTLING",
  ZIP_TO_POINT: "ZIP_TO_POINT",
  POINT_LAUNCH: "POINT_LAUNCH",
  WEB_ZIP: "WEB_ZIP",
  AIR_TRICK: "AIR_TRICK",
  LANDING: "LANDING",
};

export const TRAVERSAL_STATES = STATES;

// Coarse buckets the simulation branches on (state above is the readable label).
export const PHASE = {
  GROUND: "GROUND",
  AIR: "AIR",
  WALL: "WALL",
  SWING: "SWING",
  MANTLE: "MANTLE",
  ZIP_POINT: "ZIP_POINT",
  VAULT: "VAULT"
};

export function createPlayerState() {
  return {
    position: [0, 47.5, 0],
    velocity: [0, 0, 0],
    rotation: 0, // yaw, radians
    pitch: 0,
    lean: 0, // camera roll target
    state: STATES.IDLE,
    phase: PHASE.GROUND,
    grounded: true,
    wallContact: false,
    wallSide: 0, // -1 left, +1 right, 0 up/neutral
    wallNormal: [0, 0, 0],
    wallTimer: 0,
    anchor: null, // [x,y,z]
    anchorCandidate: null, // reticle target preview for swing
    zipTarget: null, // [x,y,z] active zip-to-point target
    zipCandidate: null, // reticle target preview for zip-to-point
    zipLaunchWindow: 0, // arrival launch window timer
    ropeLength: 0,
    speed: 0,
    diving: false,
    diveKineticEnergy: 0, // accumulated kinetic energy from dive
    mantling: false,
    landTimer: 0,
    coyote: 0,
    jumpBuffer: 0,
    // Charged Jump
    jumpChargeTime: 0,
    jumpChargeRatio: 0,
    jumpCharging: false,
    // Web Zip Air Line-Boost
    webZipActive: false,
    webZipTimer: 0,
    webZipOrigin: null,
    webZipTarget: null,
    // Air Acrobatics
    trickActive: false,
    trickName: '',
    trickScore: 0,
    trickCombo: 0,
    trickTimer: 0,
    trickRotX: 0,
    trickRotY: 0,
    trickRotZ: 0,
    trickXpPopup: null,
    tick: 0,
  };
}

export const player = createPlayerState();

export function resetPlayer() {
  const fresh = createPlayerState();
  Object.assign(player, fresh);
}

