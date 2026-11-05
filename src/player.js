import { moveBody } from "./world.js?v=7";

const GRAVITY = 0.45;
const JUMP = -7.35;
const JUMP_CUT = -2.15;
const MAX_FALL = 8;
const WALK = 1.55;
const RUN = 2.7;
const ACCEL = 0.16;
const AIR_ACCEL = 0.1;
const SKID = 0.3;
const FRICTION = 0.18;

export function createPlayer(x, y) {
  return {
    x,
    y,
    w: 12,
    h: 16,
    vx: 0,
    vy: 0,
    onGround: true,
    facing: 1,
    frame: 0,
    anim: 0,
    prevY: y,
    prevVy: 0,
  };
}

export function updatePlayer(player, input, world) {
  player.prevY = player.y;
  player.prevVy = player.vy;

  const accel = player.onGround ? ACCEL : AIR_ACCEL;

  if (input.left && !input.right) {
    player.facing = -1;
    const rate = player.onGround && player.vx > 0.2 ? SKID : accel;
    player.vx -= rate;
  } else if (input.right && !input.left) {
    player.facing = 1;
    const rate = player.onGround && player.vx < -0.2 ? SKID : accel;
    player.vx += rate;
  } else if (player.onGround) {
    if (Math.abs(player.vx) <= FRICTION) player.vx = 0;
    else player.vx -= Math.sign(player.vx) * FRICTION;
  }

  const max = input.run ? RUN : WALK;
  if (player.onGround) {
    if (player.vx > max) player.vx = max;
    if (player.vx < -max) player.vx = -max;
  } else {
    const cap = Math.max(max, Math.min(RUN, Math.abs(player.vx)));
    if (player.vx > cap) player.vx = cap;
    if (player.vx < -cap) player.vx = -cap;
  }

  player.vy = Math.min(player.vy + GRAVITY, MAX_FALL);
  let jumped = false;
  if (input.jumpPressed && player.onGround) {
    player.vy = JUMP;
    player.onGround = false;
    jumped = true;
  } else if (!input.jump && player.vy < JUMP_CUT) {
    player.vy = JUMP_CUT;
  }

  moveBody(world, player, player.vx, player.vy);

  if (!player.onGround) {
    player.frame = 1;
  } else if (Math.abs(player.vx) > 0.2) {
    player.anim += Math.abs(player.vx);
    player.frame = Math.floor(player.anim / 5) % 2;
  } else {
    player.frame = 0;
    player.anim = 0;
  }

  return jumped;
}
