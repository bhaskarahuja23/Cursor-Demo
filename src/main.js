import { audio } from "./audio.js";
import {
  drawFaces,
  drawHud,
  drawOverlay,
  drawScene,
  drawTitle,
  drawTitleText,
  fitCanvas,
} from "./draw.js";
import { interact, parseLevel, prune, spawnCabbage, spawnPop, updateEntities } from "./entities.js";
import { createInput } from "./input.js";
import { LEVELS } from "./levels.js";
import { createPlayer, updatePlayer } from "./player.js";
import { snapCamera, TILE, updateBumps, updateCamera, VIEW_H, VIEW_W } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const buffer = document.createElement("canvas");
buffer.width = VIEW_W;
buffer.height = VIEW_H;
const bctx = buffer.getContext("2d");
let scale = 1;

const input = createInput(canvas, document.getElementById("touch"));
const game = {
  state: "title",
  levelIndex: 0,
  score: 0,
  coins: 0,
  lives: 3,
  world: null,
  player: null,
  entities: [],
  camera: { x: 0 },
  timer: 0,
  banner: 0,
  time: 0,
};

function loadLevel(index) {
  const parsed = parseLevel(LEVELS[index]);
  game.levelIndex = index;
  game.world = parsed.world;
  game.player = createPlayer(parsed.start.x, parsed.start.y);
  game.entities = parsed.entities;
  game.camera = { x: 0 };
  snapCamera(game.camera, game.player, game.world);
  game.banner = 70;
  game.state = "playing";
}

function resetRun() {
  game.score = 0;
  game.coins = 0;
  game.lives = 3;
  loadLevel(0);
}

function addScore(points) {
  game.score = Math.min(999999, game.score + points);
}

function die() {
  if (game.state !== "playing") return;
  game.lives -= 1;
  game.state = "hurt";
  game.timer = 80;
  audio.hurt();
}

function clearLevel() {
  if (game.state !== "playing") return;
  game.state = "levelClear";
  game.timer = 120;
  addScore(1000);
  spawnPop(game.entities, game.player.x, game.player.y - 12, "1000");
  audio.clear();
}

function update() {
  game.time += 1;

  if (game.state === "title") {
    if (input.pressedAny) {
      audio.start();
      resetRun();
    }
  } else if (game.state === "playing") {
    const jumped = updatePlayer(game.player, input, game.world);
    if (jumped) audio.jump();
    updateBumps(game.world);
    game.entities = updateEntities(game.entities, game.world, game.camera);
    const events = interact(game.player, game.entities, game.world);
    for (const sprout of events.sprouts) spawnCabbage(game.entities, sprout.x, sprout.y);
    if (events.coins) {
      game.coins += events.coins;
      addScore(events.coins * 200);
      audio.coin();
    }
    if (events.sprouts.length || (events.bumped && !events.coins)) audio.bump();
    if (events.cabbages) {
      addScore(events.cabbages * 1000);
      audio.cabbage();
    }
    if (events.stomps) {
      addScore(events.stomps * 100);
      audio.stomp();
    }
    for (const pop of events.pops) spawnPop(game.entities, pop.x, pop.y, pop.text);
    game.entities = prune(game.entities);

    const pit = game.player.y > game.world.height * TILE;
    if (pit || events.hurt) die();
    else if (events.flag) clearLevel();

    updateCamera(game.camera, game.player, game.world);
    if (game.banner > 0) game.banner -= 1;
  } else if (game.state === "hurt") {
    updateBumps(game.world);
    game.timer -= 1;
    if (game.timer <= 0) {
      if (game.lives <= 0) game.state = "gameOver";
      else loadLevel(game.levelIndex);
    }
  } else if (game.state === "levelClear") {
    game.timer -= 1;
    updateBumps(game.world);
    game.entities = updateEntities(game.entities, game.world, game.camera, { popsOnly: true });
    game.entities = prune(game.entities);
    if (game.timer <= 0) {
      if (game.levelIndex >= LEVELS.length - 1) game.state = "worldClear";
      else loadLevel(game.levelIndex + 1);
    }
  } else if ((game.state === "gameOver" || game.state === "worldClear") && input.pressedAny) {
    game.state = "title";
  }

  input.endFrame();
}

function render() {
  const shake = game.state === "hurt" && game.timer % 4 < 2 ? 2 : 0;
  const blink = game.state === "hurt" && Math.floor(game.timer / 4) % 2 === 0;

  bctx.setTransform(1, 0, 0, 1, 0, 0);
  bctx.imageSmoothingEnabled = false;
  bctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.state === "title") {
    drawTitle(bctx, game.time);
  } else {
    bctx.save();
    bctx.translate(shake, 0);
    drawScene(bctx, game, blink);
    bctx.restore();
  }

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  ctx.drawImage(buffer, 0, 0, VIEW_W * scale, VIEW_H * scale);
  drawFaces(ctx, game, scale, { shake, blink });

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  if (game.state === "title") drawTitleText(ctx, game.time);
  else {
    drawHud(ctx, game);
    drawOverlay(ctx, game);
  }
  ctx.restore();
}

let last = 0;
let acc = 0;
const STEP = 1000 / 60;

function frame(now) {
  if (!last) last = now;
  let delta = now - last;
  if (delta < 0) delta = 0;
  if (delta > 100) delta = 100;
  last = now;
  acc += delta;
  let guard = 0;
  while (acc >= STEP && guard < 5) {
    update();
    acc -= STEP;
    guard += 1;
  }
  if (acc > STEP) acc = STEP;
  render();
}

function onRaf(now) {
  requestAnimationFrame(onRaf);
  if (document.hidden) {
    last = 0;
    acc = 0;
    return;
  }
  try {
    frame(now);
  } catch (err) {
    console.error(err);
  }
}

window.addEventListener("keydown", () => audio.unlock());
window.addEventListener("pointerdown", () => audio.unlock());
document.addEventListener("visibilitychange", () => {
  last = 0;
  acc = 0;
});

function resize() {
  scale = fitCanvas(canvas);
  render();
}

function watchDpr() {
  const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  const onChange = () => {
    mq.removeEventListener("change", onChange);
    resize();
    watchDpr();
  };
  mq.addEventListener("change", onChange);
}

window.addEventListener("resize", resize);
resize();
canvas.focus();
watchDpr();

if (new URLSearchParams(location.search).has("debug")) window.pipeRun = game;
requestAnimationFrame(onRaf);
