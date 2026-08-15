// Decoupled, netcode-ready player state snapshot.
// Any system (camera, renderer, HUD, net sync) reads this;
// only PlayerController writes it.

export const STATES = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  SPRINTING: "SPRINTING",
  JUMPING: "JUMPING",
  FALLING: "FALLING",
  WALL_RUNNING_LEFT: "WALL_RUNNING_LEFT",
  WALL_RUNNING_RIGHT: "WALL_RUNNING_RIGHT",
  WALL_JUMPING: "WALL_JUMPING",
  GRAPPLING: "GRAPPLING",
  SWINGING: "SWINGING",
  DIVING: "DIVING",
  GLIDING: "GLIDING",
  MANTLING: "MANTLING",
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
    wallSide: 0, // -1 left, +1 right
    wallNormal: [0, 0, 0],
    wallTimer: 0,
    anchor: null, // [x,y,z]
    anchorCandidate: null, // reticle target preview
    ropeLength: 0,
    speed: 0,
    diving: false,
    mantling: false,
    landTimer: 0,
    coyote: 0,
    jumpBuffer: 0,
    tick: 0,
  };
}

export const player = createPlayerState();

export function resetPlayer() {
  const fresh = createPlayerState();
  Object.assign(player, fresh);
}
