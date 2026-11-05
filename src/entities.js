import { TILE, VIEW_W, getTile, moveBody, setTile, solidAt } from "./world.js?v=7";

const SPEED = { walker: 0.58, crawler: 0.34 };

function makeCoin(tx, ty) {
  return {
    type: "coin",
    x: tx * TILE + 2,
    y: ty * TILE + 2,
    w: 12,
    h: 12,
  };
}

const ENEMY_SIZE = 20;

function makeEnemy(tx, ty, kind) {
  const foot = (ty + 1) * TILE;
  const crawler = kind === "crawler";
  return {
    type: "enemy",
    kind: crawler ? "crawler" : "walker",
    x: tx * TILE + TILE / 2 - ENEMY_SIZE / 2,
    y: foot - ENEMY_SIZE,
    w: ENEMY_SIZE,
    h: ENEMY_SIZE,
    vx: crawler ? -SPEED.crawler : -SPEED.walker,
    vy: 0,
    face: null,
    dead: false,
    deadTimer: 0,
    onGround: false,
    awake: false,
  };
}

export function parseLevel(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const tiles = rows.map((row) => row.split(""));
  const entities = [];
  let start = { x: TILE * 2, y: TILE * 10 };
  const flagCols = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = tiles[y][x];
      if (ch === "S") {
        start = { x: x * TILE + 2, y: y * TILE };
        tiles[y][x] = ".";
      } else if (ch === "C") {
        entities.push(makeCoin(x, y));
        tiles[y][x] = ".";
      } else if (ch === "G") {
        entities.push(makeEnemy(x, y, "walker"));
        tiles[y][x] = ".";
      } else if (ch === "K") {
        entities.push(makeEnemy(x, y, "crawler"));
        tiles[y][x] = ".";
      } else if (ch === "F") {
        const span = flagCols.get(x) || { top: y, bottom: y };
        span.top = Math.min(span.top, y);
        span.bottom = Math.max(span.bottom, y);
        flagCols.set(x, span);
      }
    }
  }

  for (const [x, span] of flagCols) {
    entities.push({
      type: "flag",
      x: x * TILE + 4,
      y: span.top * TILE,
      w: 8,
      h: (span.bottom - span.top + 1) * TILE,
    });
  }

  return {
    world: { tiles, width, height, bumps: [] },
    start,
    entities,
  };
}

export function assignEnemyFaces(entities, roster) {
  const enemies = entities
    .filter((entity) => entity.type === "enemy")
    .sort((a, b) => a.x - b.x || a.y - b.y);
  if (!enemies.length || !roster.length) return;
  if (roster.length < 2) {
    for (const enemy of enemies) enemy.face = roster[0].id;
    return;
  }
  let index = 0;
  let previous = null;
  for (const enemy of enemies) {
    if (roster[index].id === previous) index = (index + 1) % roster.length;
    enemy.face = roster[index].id;
    previous = enemy.face;
    index = (index + 1) % roster.length;
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function spawnPop(entities, x, y, text) {
  entities.push({
    type: "pop",
    x,
    y,
    vy: -0.55,
    life: 36,
    text,
    w: 0,
    h: 0,
  });
}

export function spawnCabbage(entities, x, y) {
  entities.push({
    type: "cabbage",
    x,
    y,
    w: 12,
    h: 12,
    vx: 0.45,
    vy: -3.2,
    onGround: false,
  });
}

function separateEnemies(entities) {
  const enemies = entities.filter((entity) => entity.type === "enemy" && entity.awake && !entity.dead);
  for (let i = 0; i < enemies.length; i++) {
    for (let j = i + 1; j < enemies.length; j++) {
      const a = enemies[i];
      const b = enemies[j];
      if (!overlaps(a, b)) continue;
      const aSpeed = Math.abs(a.vx) || SPEED[a.kind];
      const bSpeed = Math.abs(b.vx) || SPEED[b.kind];
      const overlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      if (a.x + a.w / 2 <= b.x + b.w / 2) {
        a.x -= overlap / 2;
        b.x += overlap / 2;
        a.vx = -aSpeed;
        b.vx = bSpeed;
      } else {
        a.x += overlap / 2;
        b.x -= overlap / 2;
        a.vx = aSpeed;
        b.vx = -bSpeed;
      }
    }
  }
}

export function updateEntities(entities, world, camera, options = {}) {
  const popsOnly = options.popsOnly === true;
  const viewLeft = camera ? camera.x - 8 : -Infinity;
  const viewRight = camera ? camera.x + VIEW_W + 32 : Infinity;

  for (const entity of entities) {
    if (entity.type === "pop") {
      entity.y += entity.vy;
      entity.life -= 1;
      continue;
    }
    if (popsOnly) continue;
    if (entity.type === "cabbage") {
      const dir = Math.sign(entity.vx) || 1;
      const speed = Math.abs(entity.vx) || 0.45;
      entity.vy = Math.min(entity.vy + 0.28, 5);
      moveBody(world, entity, entity.vx, entity.vy);
      if (entity.hitWall) entity.vx = -dir * speed;
      else if (entity.onGround) entity.vx = dir * speed;
      if (entity.y > world.height * TILE + 48) entity.remove = true;
      continue;
    }
    if (entity.type !== "enemy") continue;
    if (!entity.awake) {
      if (entity.x + entity.w > viewLeft && entity.x < viewRight) entity.awake = true;
      else continue;
    }
    if (entity.dead) {
      entity.deadTimer -= 1;
      continue;
    }

    let dir = Math.sign(entity.vx) || -1;
    const speed = Math.abs(entity.vx) || SPEED[entity.kind];
    const frontX = dir > 0 ? entity.x + entity.w + 1 : entity.x - 1;
    const wall =
      solidAt(world, frontX, entity.y + 4) ||
      solidAt(world, frontX, entity.y + entity.h * 0.5) ||
      solidAt(world, frontX, entity.y + entity.h - 4);
    const ledge = entity.onGround && !solidAt(world, frontX, entity.y + entity.h + 2);
    if (wall || ledge) {
      dir = -dir;
      entity.vx = dir * speed;
    }

    entity.vy = Math.min(entity.vy + 0.35, 6);
    moveBody(world, entity, entity.vx, entity.vy);
    if (entity.hitWall) entity.vx = -dir * speed;
    if (entity.y > world.height * TILE + 48) entity.remove = true;
  }
  if (!popsOnly) separateEnemies(entities);
  return entities;
}

export function interact(player, entities, world) {
  const events = {
    coins: 0,
    stomps: 0,
    cabbages: 0,
    sprouts: [],
    bumped: false,
    hurt: false,
    flag: false,
    pops: [],
  };

  const bumpedTiles = new Set();
  const awardCeiling = () => {
    if (!player.hitCeiling || !player.ceilingTiles) return;
    const center = player.x + player.w / 2;
    let best = null;
    let bestDist = Infinity;
    for (const tile of player.ceilingTiles) {
      const key = `${tile.tx},${tile.ty}`;
      if (bumpedTiles.has(key)) continue;
      const ch = getTile(world, tile.tx, tile.ty);
      if (ch !== "?" && ch !== "B") continue;
      const mid = (tile.left + tile.right) / 2;
      const dist = Math.abs(mid - center);
      if (!best || dist < bestDist) {
        best = { tile, ch, key };
        bestDist = dist;
      }
    }
    if (!best) return;
    bumpedTiles.add(best.key);
    world.bumps.push({ tx: best.tile.tx, ty: best.tile.ty, life: 10 });
    events.bumped = true;
    setTile(world, best.tile.tx, best.tile.ty, "b");
    if (best.ch === "?") {
      events.coins += 1;
      events.pops.push({ x: best.tile.tx * TILE + 2, y: best.tile.ty * TILE - 2, text: "200" });
    } else {
      events.sprouts.push({ x: best.tile.tx * TILE + 2, y: best.tile.ty * TILE - 14 });
    }
  };

  awardCeiling();

  for (const entity of entities) {
    if (entity.type === "cabbage" && overlaps(player, entity)) {
      entity.remove = true;
      events.cabbages += 1;
      events.pops.push({ x: entity.x, y: entity.y - 6, text: "1000" });
      continue;
    }
    if (entity.type === "coin" && overlaps(player, entity)) {
      entity.remove = true;
      events.coins += 1;
      events.pops.push({ x: entity.x, y: entity.y, text: "200" });
      continue;
    }
    if (entity.type === "flag" && overlaps(player, entity)) {
      events.flag = true;
      continue;
    }
    if (entity.type !== "enemy" || entity.dead || !overlaps(player, entity)) continue;

    const prevFeet = player.prevY + player.h;
    const stomping = player.prevVy > 0 && prevFeet <= entity.y + 0.5;
    if (stomping) {
      const foot = entity.y + entity.h;
      const targetY = entity.y - player.h;
      moveBody(world, player, 0, targetY - player.y);
      if (!player.hitCeiling) player.vy = -4.7;
      player.onGround = false;
      awardCeiling();
      entity.dead = true;
      entity.deadTimer = 16;
      entity.vx = 0;
      entity.vy = 0;
      entity.h = 8;
      entity.y = foot - 8;
      events.stomps += 1;
      events.pops.push({ x: entity.x, y: entity.y - 10, text: "100" });
    } else {
      events.hurt = true;
    }
  }

  if (events.stomps > 0) events.hurt = false;
  return events;
}

export function prune(entities) {
  return entities.filter((entity) => {
    if (entity.remove) return false;
    if (entity.type === "pop" && entity.life <= 0) return false;
    if (entity.type === "enemy" && entity.dead && entity.deadTimer <= 0) return false;
    return true;
  });
}
