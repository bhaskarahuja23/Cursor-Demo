import { TILE, getTile, moveBody, setTile, solidAt } from "./world.js?v=5";

const SPEED = { walker: 0.58, crawler: 0.34 };

function makeCoin(tx, ty) {
  return {
    type: "coin",
    x: tx * TILE + 3,
    y: ty * TILE + 2,
    w: 10,
    h: 12,
  };
}

function makeEnemy(tx, ty, kind) {
  if (kind === "crawler") {
    return {
      type: "enemy",
      kind,
      x: tx * TILE,
      y: ty * TILE + 4,
      w: 16,
      h: 12,
      vx: -SPEED.crawler,
      vy: 0,
      dead: false,
      deadTimer: 0,
      onGround: false,
    };
  }
  return {
    type: "enemy",
    kind: "walker",
    x: tx * TILE + 1,
    y: ty * TILE,
    w: 14,
    h: 16,
    vx: -SPEED.walker,
    vy: 0,
    dead: false,
    deadTimer: 0,
    onGround: false,
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

export function updateEntities(entities, world) {
  for (const entity of entities) {
    if (entity.type === "pop") {
      entity.y += entity.vy;
      entity.life -= 1;
      continue;
    }
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
    if (entity.dead) {
      entity.deadTimer -= 1;
      continue;
    }

    const dir = Math.sign(entity.vx) || -1;
    const speed = Math.abs(entity.vx) || SPEED[entity.kind];
    const frontX = dir > 0 ? entity.x + entity.w + 1 : entity.x - 1;
    const wall =
      solidAt(world, frontX, entity.y + 2) ||
      solidAt(world, frontX, entity.y + entity.h * 0.5) ||
      solidAt(world, frontX, entity.y + entity.h - 2);
    const ledge = entity.onGround && !solidAt(world, frontX, entity.y + entity.h + 2);
    if (wall || ledge) entity.vx = -dir * speed;

    entity.vy = Math.min(entity.vy + 0.35, 6);
    moveBody(world, entity, entity.vx, entity.vy);
    if (entity.hitWall) entity.vx = -dir * speed;
    if (entity.y > world.height * TILE + 48) entity.remove = true;
  }
  return prune(entities);
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

  if (player.hitCeiling) {
    const seen = new Set();
    for (const tile of player.ceilingTiles) {
      const key = `${tile.tx},${tile.ty}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const ch = getTile(world, tile.tx, tile.ty);
      if (ch !== "?" && ch !== "B") continue;
      world.bumps.push({ tx: tile.tx, ty: tile.ty, life: 10 });
      events.bumped = true;
      if (ch === "?") {
        setTile(world, tile.tx, tile.ty, "b");
        events.coins += 1;
        events.pops.push({ x: tile.tx * TILE + 2, y: tile.ty * TILE - 2, text: "200" });
      } else if (ch === "B") {
        setTile(world, tile.tx, tile.ty, "b");
        events.sprouts.push({ x: tile.tx * TILE + 2, y: tile.ty * TILE - 14 });
      }
    }
  }

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

    const feet = player.y + player.h;
    const onHead = feet <= entity.y + entity.h * 0.72;
    const comingDown = player.prevVy > 0.4;
    const risingOver = player.vy < 0 && player.y < entity.y;
    const stomping = onHead && (comingDown || risingOver);
    if (stomping) {
      const foot = entity.y + entity.h;
      player.y = entity.y - player.h;
      player.vy = -4.7;
      player.onGround = false;
      entity.dead = true;
      entity.deadTimer = 16;
      entity.vx = 0;
      entity.vy = 0;
      entity.h = 6;
      entity.y = foot - 6;
      events.stomps += 1;
      events.pops.push({ x: entity.x, y: entity.y - 8, text: "100" });
    } else {
      events.hurt = true;
    }
  }

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
