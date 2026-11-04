// Tile legend: . sky  # ground  B brick  ? coin block  b used block
// P pipe cap  = pipe shaft  C coin  G walker  K crawler  F flag  S start

const ALLOWED = new Set([".", "#", "B", "?", "b", "P", "=", "C", "G", "K", "F", "S"]);

function create(width, paint) {
  const rows = Array.from({ length: 14 }, () => Array(width).fill("."));
  for (let x = 0; x < width; x++) {
    rows[12][x] = "#";
    rows[13][x] = "#";
  }
  paint(rows);
  return rows.map((row) => row.join(""));
}

function put(rows, x, y, ch) {
  if (y < 0 || y >= rows.length || x < 0 || x >= rows[0].length) {
    throw new Error(`tile out of bounds ${x},${y}`);
  }
  rows[y][x] = ch;
}

function gap(rows, x, w) {
  for (let i = 0; i < w; i++) {
    put(rows, x + i, 12, ".");
    put(rows, x + i, 13, ".");
  }
}

function pipe(rows, x, h) {
  for (let i = 0; i < h; i++) {
    const y = 12 - h + i;
    const ch = i === 0 ? "P" : "=";
    put(rows, x, y, ch);
    put(rows, x + 1, y, ch);
  }
}

function stairs(rows, x, steps, dir) {
  for (let i = 0; i < steps; i++) {
    const h = dir > 0 ? i + 1 : steps - i;
    for (let k = 0; k < h; k++) put(rows, x + i, 11 - k, "#");
  }
}

function platform(rows, x, y, w, ch = "#") {
  for (let i = 0; i < w; i++) put(rows, x + i, y, ch);
}

function blocks(rows, x, y, pattern) {
  for (let i = 0; i < pattern.length; i++) put(rows, x + i, y, pattern[i]);
}

function flag(rows, x, top, bottom) {
  for (let y = top; y <= bottom; y++) put(rows, x, y, "F");
}

function coins(rows, x, y, n) {
  for (let i = 0; i < n; i++) put(rows, x + i, y, "C");
}

export const LEVELS = [
  create(96, (rows) => {
    put(rows, 3, 11, "S");
    coins(rows, 9, 9, 3);
    put(rows, 15, 11, "G");
    pipe(rows, 20, 2);
    gap(rows, 26, 2);
    coins(rows, 30, 8, 3);
    blocks(rows, 35, 8, "?B?B");
    put(rows, 42, 11, "G");
    pipe(rows, 50, 2);
    coins(rows, 60, 7, 3);
    gap(rows, 66, 2);
    put(rows, 72, 11, "G");
    blocks(rows, 74, 8, "B?B");
    pipe(rows, 82, 2);
    flag(rows, 90, 4, 11);
  }),
  create(112, (rows) => {
    put(rows, 3, 11, "S");
    coins(rows, 8, 9, 3);
    pipe(rows, 14, 2);
    put(rows, 20, 11, "G");
    blocks(rows, 18, 8, "B?B?B?B");
    pipe(rows, 28, 3);
    put(rows, 26, 8, "C");
    put(rows, 32, 8, "C");
    platform(rows, 38, 9, 6);
    put(rows, 40, 8, "K");
    gap(rows, 50, 3);
    put(rows, 60, 11, "G");
    pipe(rows, 68, 2);
    blocks(rows, 72, 8, "?B?B?");
    put(rows, 78, 11, "K");
    coins(rows, 84, 8, 3);
    pipe(rows, 92, 3);
    flag(rows, 104, 4, 11);
  }),
  create(124, (rows) => {
    put(rows, 2, 11, "S");
    put(rows, 8, 11, "G");
    stairs(rows, 14, 4, 1);
    stairs(rows, 18, 4, -1);
    blocks(rows, 16, 5, "???");
    coins(rows, 24, 9, 2);
    pipe(rows, 32, 2);
    put(rows, 38, 11, "G");
    gap(rows, 48, 6);
    platform(rows, 50, 10, 5);
    coins(rows, 51, 8, 2);
    put(rows, 52, 9, "K");
    put(rows, 62, 11, "G");
    pipe(rows, 70, 2);
    put(rows, 78, 11, "K");
    gap(rows, 86, 3);
    coins(rows, 86, 8, 3);
    blocks(rows, 92, 8, "B?B?B");
    stairs(rows, 102, 2, 1);
    platform(rows, 104, 10, 16);
    platform(rows, 104, 11, 16);
    coins(rows, 108, 8, 2);
    flag(rows, 112, 3, 9);
  }),
];

for (const level of LEVELS) {
  const width = level[0].length;
  if (level.length !== 14) throw new Error("level height must be 14");
  let starts = 0;
  let flags = 0;
  for (const row of level) {
    if (row.length !== width) throw new Error("uneven level row");
    for (const ch of row) {
      if (!ALLOWED.has(ch)) throw new Error(`unknown tile ${ch}`);
      if (ch === "S") starts += 1;
      if (ch === "F") flags += 1;
    }
  }
  if (starts !== 1) throw new Error("level needs one start");
  if (flags < 1) throw new Error("level needs a flag");
}
