export const TILE = 16;
export const VIEW_W = 256;
export const VIEW_H = 224;

const SOLID = new Set(["#", "B", "?", "b", "P", "="]);

export function isSolid(ch) {
  return SOLID.has(ch);
}

export function getTile(world, tx, ty) {
  if (tx < 0 || tx >= world.width) return "#";
  if (ty < 0 || ty >= world.height) return ".";
  return world.tiles[ty][tx];
}

export function setTile(world, tx, ty, ch) {
  if (ty < 0 || ty >= world.height || tx < 0 || tx >= world.width) return;
  world.tiles[ty][tx] = ch;
}

export function solidAt(world, px, py) {
  return isSolid(getTile(world, Math.floor(px / TILE), Math.floor(py / TILE)));
}

function overlappingSolids(world, x, y, w, h) {
  const x0 = Math.floor(x / TILE);
  const y0 = Math.floor(y / TILE);
  const x1 = Math.floor((x + w - 0.001) / TILE);
  const y1 = Math.floor((y + h - 0.001) / TILE);
  const hits = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolid(getTile(world, tx, ty))) continue;
      hits.push({
        tx,
        ty,
        left: tx * TILE,
        right: tx * TILE + TILE,
        top: ty * TILE,
        bottom: ty * TILE + TILE,
      });
    }
  }
  return hits;
}

function overlapX(body, tile) {
  return Math.min(body.x + body.w, tile.right) - Math.max(body.x, tile.left);
}

function overlapY(body, tile) {
  return Math.min(body.y + body.h, tile.bottom) - Math.max(body.y, tile.top);
}

function feetOnGround(world, body) {
  const y = body.y + body.h + 0.05;
  return solidAt(world, body.x + 0.5, y) || solidAt(world, body.x + body.w - 0.5, y);
}

export function moveBody(world, body, dx, dy) {
  body.hitWall = false;
  body.onGround = false;
  body.hitCeiling = false;
  body.ceilingTiles = [];

  if (dx !== 0) {
    body.x += dx;
    const hits = overlappingSolids(world, body.x, body.y, body.w, body.h).filter((tile) => {
      const px = overlapX(body, tile);
      const py = overlapY(body, tile);
      return px > 0 && px <= py;
    });
    if (hits.length) {
      if (dx > 0) {
        let edge = Infinity;
        for (const tile of hits) edge = Math.min(edge, tile.left);
        body.x = edge - body.w;
      } else {
        let edge = -Infinity;
        for (const tile of hits) edge = Math.max(edge, tile.right);
        body.x = edge;
      }
      body.hitWall = true;
    }
  }

  if (dy !== 0) {
    body.y += dy;
    const hits = overlappingSolids(world, body.x, body.y, body.w, body.h);
    if (hits.length) {
      if (dy > 0) {
        let edge = Infinity;
        for (const tile of hits) edge = Math.min(edge, tile.top);
        body.y = edge - body.h;
        body.onGround = true;
        body.vy = 0;
      } else {
        let edge = -Infinity;
        for (const tile of hits) edge = Math.max(edge, tile.bottom);
        body.y = edge;
        body.hitCeiling = true;
        body.vy = 0;
        body.ceilingTiles = hits;
      }
    }
  }

  if (!body.onGround && feetOnGround(world, body)) body.onGround = true;
}

function cameraFocus(player, world) {
  const max = Math.max(0, world.width * TILE - VIEW_W);
  const target = player.x + player.w / 2 - VIEW_W / 2 + player.facing * 28;
  return Math.max(0, Math.min(max, target));
}

export function updateBumps(world) {
  for (const bump of world.bumps) bump.life -= 1;
  world.bumps = world.bumps.filter((bump) => bump.life > 0);
}

export function bumpOffset(world, tx, ty) {
  const bump = world.bumps.find((item) => item.tx === tx && item.ty === ty);
  if (!bump) return 0;
  return -Math.sin((bump.life / 10) * Math.PI) * 5;
}

export function updateCamera(camera, player, world) {
  const clamped = cameraFocus(player, world);
  camera.x += (clamped - camera.x) * 0.14;
  if (Math.abs(camera.x - clamped) < 0.35) camera.x = clamped;
  const max = Math.max(0, world.width * TILE - VIEW_W);
  camera.x = Math.max(0, Math.min(max, camera.x));
}

export function snapCamera(camera, player, world) {
  camera.x = cameraFocus(player, world);
}
