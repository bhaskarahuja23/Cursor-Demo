import { faceImage } from "./faces.js?v=5";
import { TILE, VIEW_H, VIEW_W, bumpOffset, isSolid } from "./world.js?v=5";

const FONT = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "110", "100", "110", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "101", "101", "101"],
  N: ["110", "101", "101", "101", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "111", "011"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "011"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "101", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  0: ["111", "101", "101", "101", "111"],
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
  5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"],
  7: ["111", "001", "010", "010", "010"],
  8: ["111", "101", "111", "101", "111"],
  9: ["111", "101", "111", "001", "111"],
  "-": ["000", "000", "111", "000", "000"],
  x: ["000", "101", "010", "101", "000"],
  " ": ["000", "000", "000", "000", "000"],
};

export function textWidth(text, scale = 2) {
  return text.length * 4 * scale;
}

export function drawText(ctx, text, x, y, color, scale = 2) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text) {
    const glyph = FONT[ch] || FONT[" "];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        if (glyph[row][col] === "1") {
          ctx.fillRect(cx + col * scale, y + row * scale, scale, scale);
        }
      }
    }
    cx += 4 * scale;
  }
}

export function drawTextShadow(ctx, text, x, y, color, scale = 2) {
  drawText(ctx, text, x + scale, y + scale, "#000000", scale);
  drawText(ctx, text, x, y, color, scale);
}

function centerText(ctx, text, y, color, scale = 2) {
  const x = Math.round((VIEW_W - textWidth(text, scale)) / 2);
  drawTextShadow(ctx, text, x, y, color, scale);
}

function drawClouds(ctx, camX) {
  const span = 300;
  const parallax = camX * 0.2;
  const start = Math.floor(parallax / span) - 1;
  ctx.fillStyle = "#ffffff";
  for (let i = start; i < start + 5; i++) {
    const x = Math.round(i * span - parallax + 40);
    const y = 42 + ((i % 3 + 3) % 3) * 12;
    ctx.fillRect(x, y + 6, 32, 8);
    ctx.fillRect(x + 6, y, 18, 8);
    ctx.fillRect(x + 16, y + 4, 14, 8);
  }
}

function drawHills(ctx, camX) {
  const span = 220;
  const parallax = camX * 0.45;
  const start = Math.floor(parallax / span) - 1;
  for (let i = start; i < start + 6; i++) {
    const x = Math.round(i * span - parallax);
    ctx.fillStyle = "#1ea038";
    ctx.fillRect(x + 10, 182, 90, 16);
    ctx.fillRect(x + 26, 174, 58, 12);
    ctx.fillRect(x + 40, 168, 30, 8);
    ctx.fillStyle = "#9aec78";
    ctx.fillRect(x + 40, 168, 30, 3);
  }
}

function drawGround(ctx, world, tx, ty, x, y) {
  const above = ty > 0 ? world.tiles[ty - 1][tx] : ".";
  const topped = above === "." || above === "C" || above === "S";
  ctx.fillStyle = "#c65a18";
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = "#9a3c10";
  ctx.fillRect(x + 3, y + 7, 4, 3);
  ctx.fillRect(x + 10, y + 11, 3, 3);
  if (topped) {
    ctx.fillStyle = "#3cba45";
    ctx.fillRect(x, y, 16, 4);
    ctx.fillStyle = "#d8f090";
    ctx.fillRect(x, y, 16, 2);
  } else if (!isSolid(above) && above !== "F") {
    ctx.fillStyle = "#3cba45";
    ctx.fillRect(x, y, 16, 3);
  }
}

function drawBrick(ctx, x, y) {
  ctx.fillStyle = "#e07028";
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = "#7a3010";
  ctx.fillRect(x, y, 16, 1);
  ctx.fillRect(x, y + 8, 16, 1);
  ctx.fillRect(x, y, 1, 8);
  ctx.fillRect(x + 8, y, 1, 8);
  ctx.fillRect(x, y + 8, 1, 8);
  ctx.fillRect(x + 8, y + 8, 1, 8);
  ctx.fillStyle = "#ffb060";
  ctx.fillRect(x + 2, y + 2, 4, 2);
}

function drawQuestion(ctx, x, y, time) {
  const blink = Math.floor(time / 18) % 2 === 0;
  ctx.fillStyle = blink ? "#f8d020" : "#e0b010";
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = "#c08010";
  ctx.fillRect(x, y, 16, 2);
  ctx.fillRect(x, y + 14, 16, 2);
  ctx.fillRect(x, y, 2, 16);
  ctx.fillRect(x + 14, y, 2, 16);
  ctx.fillStyle = "#6b3808";
  ctx.fillRect(x + 5, y + 3, 6, 2);
  ctx.fillRect(x + 9, y + 5, 2, 2);
  ctx.fillRect(x + 7, y + 7, 2, 2);
  ctx.fillRect(x + 7, y + 11, 2, 2);
}

function drawUsed(ctx, x, y) {
  ctx.fillStyle = "#b06830";
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = "#7a4020";
  ctx.fillRect(x, y, 16, 2);
  ctx.fillRect(x, y + 14, 16, 2);
  ctx.fillRect(x, y, 2, 16);
  ctx.fillRect(x + 14, y, 2, 16);
  ctx.fillStyle = "#8a4c28";
  ctx.fillRect(x + 5, y + 5, 6, 6);
}

function drawPipeTile(ctx, world, tx, ty, x, y, ch) {
  const left = tx > 0 ? world.tiles[ty][tx - 1] : ".";
  const right = tx + 1 < world.width ? world.tiles[ty][tx + 1] : ".";
  const pipeL = left === "P" || left === "=";
  const pipeR = right === "P" || right === "=";
  ctx.fillStyle = "#14a024";
  ctx.fillRect(x, y, 16, 16);
  if (!pipeL) {
    ctx.fillStyle = "#c8ffc0";
    ctx.fillRect(x + 2, y, 3, 16);
  }
  if (!pipeR) {
    ctx.fillStyle = "#066814";
    ctx.fillRect(x + 12, y, 4, 16);
  }
  if (ch === "P") {
    ctx.fillStyle = "#20c030";
    ctx.fillRect(x, y, 16, 6);
    if (!pipeL) ctx.fillRect(x - 2, y, 2, 6);
    if (!pipeR) ctx.fillRect(x + 16, y, 2, 6);
    ctx.fillStyle = "#066814";
    ctx.fillRect(x, y + 6, 16, 1);
    if (!pipeL) {
      ctx.fillStyle = "#e8ffe4";
      ctx.fillRect(x, y, 3, 5);
    }
  }
}

function drawFlagTile(ctx, world, tx, ty, x, y, time) {
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(x + 7, y, 2, TILE);
  const above = ty > 0 && world.tiles[ty - 1][tx] === "F";
  if (above) return;
  ctx.fillStyle = "#f8d020";
  ctx.fillRect(x + 5, y, 6, 4);
  const flutter = Math.round(Math.sin(time / 7) * 1);
  ctx.fillStyle = "#2ee05a";
  ctx.fillRect(x + 9, y + 4, 8 + flutter, 7);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 11, y + 6, 2, 2);
}

function drawTile(ctx, world, tx, ty, ch, x, y, time) {
  if (ch === "#") drawGround(ctx, world, tx, ty, x, y);
  else if (ch === "B") drawBrick(ctx, x, y);
  else if (ch === "?") drawQuestion(ctx, x, y, time);
  else if (ch === "b") drawUsed(ctx, x, y);
  else if (ch === "P" || ch === "=") drawPipeTile(ctx, world, tx, ty, x, y, ch);
  else if (ch === "F") drawFlagTile(ctx, world, tx, ty, x, y, time);
}

function drawPortrait(ctx, image, x, y, size, squash = 1) {
  if (!image) return false;
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = Math.max(0, (image.naturalHeight - side) * 0.08);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + (size * squash) / 2, size / 2, (size * squash) / 2, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, sx, sy, side, Math.min(side, image.naturalHeight - sy), x, y, size, size * squash);
  ctx.restore();
  ctx.imageSmoothingEnabled = false;
  ctx.beginPath();
  ctx.ellipse(x + size / 2, y + (size * squash) / 2, size / 2, (size * squash) / 2, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#1a120c";
  ctx.lineWidth = 1;
  ctx.stroke();
  return true;
}

export function drawRunner(ctx, x, y, facing, frame) {
  const dx = Math.round(x);
  const dy = Math.round(y);
  ctx.save();
  ctx.translate(dx + 8, dy);
  ctx.scale(facing < 0 ? -1 : 1, 1);
  ctx.translate(-8, 0);
  ctx.fillStyle = "#e02323";
  ctx.fillRect(4, 0, 8, 3);
  ctx.fillRect(3, 2, 10, 2);
  ctx.fillStyle = "#e02323";
  ctx.fillRect(4, 9, 8, 2);
  ctx.fillStyle = "#2450d8";
  ctx.fillRect(3, 11, 10, 3);
  ctx.fillStyle = "#f0c020";
  ctx.fillRect(5, 11, 1, 2);
  ctx.fillRect(10, 11, 1, 2);
  ctx.fillStyle = "#2450d8";
  if (frame === 0) {
    ctx.fillRect(4, 14, 3, 1);
    ctx.fillRect(9, 14, 3, 1);
  } else {
    ctx.fillRect(3, 14, 3, 1);
    ctx.fillRect(10, 14, 3, 1);
  }
  ctx.fillStyle = "#6a3a16";
  if (frame === 0) {
    ctx.fillRect(3, 15, 4, 1);
    ctx.fillRect(9, 15, 4, 1);
  } else {
    ctx.fillRect(2, 15, 4, 1);
    ctx.fillRect(10, 15, 4, 1);
  }
  if (!faceImage("bhaskar")) {
    ctx.fillStyle = "#f6c8a4";
    ctx.fillRect(5, 5, 7, 4);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(9, 6, 2, 2);
  }
  ctx.restore();
}

function drawWalker(ctx, x, y, frame, dead) {
  x = Math.round(x);
  y = Math.round(y);
  if (faceImage("giulio")) {
    if (!dead) {
      ctx.fillStyle = "#6a3810";
      ctx.fillRect(x + 1, y + 14, 5, frame ? 3 : 2);
      ctx.fillRect(x + 8, y + 14, 5, frame ? 2 : 3);
    }
    return;
  }
  if (dead) {
    ctx.fillStyle = "#e09030";
    ctx.fillRect(x, y, 14, 6);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(x + 3, y + 2, 2, 2);
    ctx.fillRect(x + 9, y + 2, 2, 2);
    return;
  }
  ctx.fillStyle = "#6a3810";
  ctx.fillRect(x + 1, y + 12, 5, frame ? 4 : 3);
  ctx.fillRect(x + 8, y + 12, 5, frame ? 3 : 4);
  ctx.fillStyle = "#e89838";
  ctx.fillRect(x + 1, y + 3, 12, 10);
  ctx.fillStyle = "#f8d8a8";
  ctx.fillRect(x + 3, y + 8, 8, 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + 3, y + 5, 3, 3);
  ctx.fillRect(x + 8, y + 5, 3, 3);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 4, y + 6, 2, 2);
  ctx.fillRect(x + 9, y + 6, 2, 2);
  ctx.fillRect(x + 3, y + 4, 3, 1);
  ctx.fillRect(x + 8, y + 4, 3, 1);
}

function drawCrawler(ctx, x, y, facing, frame, dead) {
  x = Math.round(x);
  y = Math.round(y);
  if (faceImage("francesco")) return;
  if (dead) {
    ctx.fillStyle = "#1c9a34";
    ctx.fillRect(x, y, 16, 6);
    ctx.fillStyle = "#b8ff90";
    ctx.fillRect(x + 4, y + 1, 3, 2);
    return;
  }
  const headX = facing < 0 ? x : x + 8;
  ctx.fillStyle = "#f0d060";
  ctx.fillRect(headX, y + 3, 8, 6);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(headX + (facing < 0 ? 1 : 5), y + 5, 2, 2);
  ctx.fillStyle = "#18a030";
  ctx.fillRect(x + 1, y, 14, 9);
  ctx.fillStyle = "#b8ff90";
  ctx.fillRect(x + 4, y + 2, 4, 3);
  ctx.fillStyle = "#086818";
  ctx.fillRect(x + 3, y + 6, 10, 2);
  ctx.fillStyle = "#f0d060";
  ctx.fillRect(x + 2, y + 8, 4, 3 + (frame ? 0 : 1));
  ctx.fillRect(x + 10, y + 8, 4, 3 + (frame ? 1 : 0));
}

function drawCabbage(ctx, x, y) {
  x = Math.round(x);
  y = Math.round(y);
  ctx.fillStyle = "#1f8a32";
  ctx.fillRect(x + 2, y + 3, 8, 8);
  ctx.fillRect(x, y + 5, 12, 5);
  ctx.fillStyle = "#7dce45";
  ctx.fillRect(x + 4, y + 1, 4, 4);
  ctx.fillRect(x + 3, y + 5, 3, 3);
  ctx.fillStyle = "#f4f0c8";
  ctx.fillRect(x + 5, y + 6, 3, 3);
  ctx.fillStyle = "#d8c44a";
  ctx.fillRect(x + 5, y, 2, 2);
}

function drawCoin() {}

function drawEntities(ctx, entities, camera, time) {
  const cam = Math.round(camera.x);
  for (const entity of entities) {
    if (entity.type === "coin") {
      drawCoin(ctx, { x: entity.x - cam, y: entity.y, phase: entity.x * 0.05 }, time);
    } else if (entity.type === "cabbage") {
      drawCabbage(ctx, entity.x - cam, entity.y);
    } else if (entity.type === "enemy" && entity.kind === "walker") {
      const step = Math.floor(time / 8) % 2;
      drawWalker(ctx, entity.x - cam, entity.y, step, entity.dead);
    } else if (entity.type === "enemy") {
      const step = Math.floor(time / 8) % 2;
      const facing = entity.vx < 0 ? -1 : 1;
      drawCrawler(ctx, entity.x - cam, entity.y, facing, step, entity.dead);
    } else if (entity.type === "pop") {
      drawTextShadow(ctx, entity.text, Math.round(entity.x - cam), Math.round(entity.y), "#f8e060", 1);
    }
  }
}

export function drawScene(ctx, game) {
  const { world, camera, player, entities } = game;
  const cam = Math.round(camera.x);
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawClouds(ctx, cam);
  drawHills(ctx, cam);

  const x0 = Math.max(0, Math.floor(cam / TILE) - 1);
  const x1 = Math.min(world.width - 1, Math.floor((cam + VIEW_W) / TILE) + 1);
  for (let ty = 0; ty < world.height; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = world.tiles[ty][tx];
      if (ch === ".") continue;
      const bounce = bumpOffset(world, tx, ty);
      drawTile(ctx, world, tx, ty, ch, tx * TILE - cam, ty * TILE + bounce, game.time);
    }
  }

  drawEntities(ctx, entities, camera, game.time);
  const blink = game.state === "hurt" && Math.floor(game.timer / 4) % 2 === 0;
  if (!blink) {
    drawRunner(ctx, player.x - cam - 2, player.y, player.facing, player.onGround ? player.frame : 1);
  }
}

export function drawHud(ctx, game) {
  const level = game.levelIndex + 1;
  drawTextShadow(ctx, "SCORE", 8, 6, "#ffffff");
  drawTextShadow(ctx, String(game.score).padStart(6, "0"), 8, 18, "#ffffff");
  drawTextShadow(ctx, "COINS", 96, 6, "#f8d020");
  drawTextShadow(ctx, `x${String(game.coins).padStart(2, "0")}`, 104, 18, "#f8d020");
  drawTextShadow(ctx, "WORLD", 188, 6, "#ffffff");
  drawTextShadow(ctx, `1-${level}`, 200, 18, "#ffffff");
  drawRunner(ctx, 8, 200, 1, 0);
  drawTextShadow(ctx, `x${game.lives}`, 28, 206, "#ffffff");

  if (game.state === "playing" && game.banner > 30) {
    centerText(ctx, `WORLD 1-${level}`, 96, "#ffffff");
  }
}

function dim(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawTitle(ctx, time) {
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawClouds(ctx, 0);
  drawHills(ctx, 20);
  for (let x = 0; x < VIEW_W; x += 16) {
    ctx.fillStyle = "#c65a18";
    ctx.fillRect(x, 192, 16, 32);
    ctx.fillStyle = "#3cba45";
    ctx.fillRect(x, 192, 16, 4);
    ctx.fillStyle = "#d8f090";
    ctx.fillRect(x, 192, 16, 2);
  }
  const step = Math.floor(time / 8) % 2;
  drawRunner(ctx, 116, 176, 1, step);
  drawCoin(ctx, { x: 96, y: 168, phase: 0 }, time);
  drawCoin(ctx, { x: 148, y: 164, phase: 1.4 }, time);
  centerText(ctx, "PIPE RUN", 40, "#ffffff");
  const blink = Math.floor(time / 24) % 2 === 0;
  centerText(ctx, "PRESS ENTER", 68, blink ? "#f8d020" : "#ffffff");
  centerText(ctx, "ARROWS OR AD MOVE", 112, "#ffffff", 1);
  centerText(ctx, "SHIFT OR J RUNS", 126, "#ffffff", 1);
  centerText(ctx, "SPACE OR K JUMPS", 140, "#ffffff", 1);
  centerText(ctx, "BRICKS HIDE CABBAGE", 154, "#9aec78", 1);
  drawCabbage(ctx, 78, 172);
}

export function drawOverlay(ctx, game) {
  if (game.state === "levelClear") {
    dim(ctx);
    centerText(ctx, "COURSE CLEAR", 96, "#f8d020");
  } else if (game.state === "gameOver") {
    dim(ctx);
    centerText(ctx, "GAME OVER", 84, "#ffffff");
    const blink = Math.floor(game.time / 24) % 2 === 0;
    centerText(ctx, "PRESS ENTER", 112, blink ? "#f8d020" : "#ffffff");
  } else if (game.state === "worldClear") {
    dim(ctx);
    centerText(ctx, "WORLD CLEAR", 64, "#f8d020");
    centerText(ctx, `SCORE ${String(game.score).padStart(6, "0")}`, 92, "#ffffff");
    const blink = Math.floor(game.time / 24) % 2 === 0;
    centerText(ctx, "PRESS ENTER", 120, blink ? "#f8d020" : "#ffffff");
  } else if (game.state === "hurt") {
    ctx.fillStyle = "rgba(180, 16, 16, 0.22)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function stampFace(ctx, name, x, y, size, scale, squash = 1) {
  const image = faceImage(name);
  if (!image) return;
  drawPortrait(ctx, image, Math.round(x) * scale, Math.round(y) * scale, size * scale, squash);
}

function coinBob(time, phase) {
  return Math.round(Math.sin(time / 8 + phase) * 2);
}

function paintCoin(ctx, x, y, scale) {
  const radius = 8 * scale;
  const cx = (Math.round(x) + 5) * scale;
  const cy = (Math.round(y) + 6) * scale;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#f6c410";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx - radius * 0.28, cy - radius * 0.32, radius * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7b8";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(2, scale * 1.4);
  ctx.strokeStyle = "#a56d08";
  ctx.stroke();
}

export function drawFaces(ctx, game, scale) {
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  if (game.state === "title") {
    stampFace(ctx, "giulio", 16, 158, 34, scale);
    stampFace(ctx, "francesco", 206, 160, 32, scale);
    stampFace(ctx, "bhaskar", 116, 174, 18, scale);
    paintCoin(ctx, 70, 96 + coinBob(game.time, 0), scale);
    paintCoin(ctx, 168, 96 + coinBob(game.time, 1.4), scale);
    ctx.restore();
    return;
  }

  const cam = Math.round(game.camera.x);
  const shake = game.state === "hurt" && game.timer % 4 < 2 ? 2 : 0;
  ctx.translate(shake * scale, 0);
  const blink = game.state === "hurt" && Math.floor(game.timer / 4) % 2 === 0;
  if (!blink && game.player) {
    stampFace(ctx, "bhaskar", game.player.x - cam - 4, game.player.y - 2, 20, scale);
  }
  for (const entity of game.entities) {
    const screenX = entity.x - cam;
    if (screenX < -48 || screenX > VIEW_W + 48) continue;
    if (entity.type === "coin") {
      paintCoin(ctx, screenX, entity.y + coinBob(game.time, entity.x * 0.05), scale);
      continue;
    }
    if (entity.type !== "enemy") continue;
    if (entity.kind === "walker") {
      stampFace(ctx, "giulio", screenX - 8, entity.dead ? entity.y + 4 : entity.y - 14, 32, scale, entity.dead ? 0.45 : 1);
    } else {
      stampFace(ctx, "francesco", screenX - 8, entity.dead ? entity.y + 2 : entity.y - 16, 32, scale, entity.dead ? 0.45 : 1);
    }
  }
  ctx.restore();
  stampFace(ctx, "bhaskar", 6, 198, 18, scale);
}

export function fitCanvas(canvas) {
  const scale = Math.max(
    1,
    Math.floor(Math.min((window.innerWidth - 24) / VIEW_W, (window.innerHeight - 24) / VIEW_H)),
  );
  const w = VIEW_W * scale;
  const h = VIEW_H * scale;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return scale;
}
