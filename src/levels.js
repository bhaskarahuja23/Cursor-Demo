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
  create(136, (rows) => {
    put(rows, 3, 11, "S");
    coins(rows, 8, 9, 3);
    put(rows, 14, 11, "G");
    pipe(rows, 22, 2);
    coins(rows, 27, 8, 3);
    gap(rows, 34, 2);
    put(rows, 40, 11, "K");
    blocks(rows, 46, 8, "?B?B");
    put(rows, 56, 11, "G");
    coins(rows, 62, 9, 3);
    pipe(rows, 70, 2);
    gap(rows, 76, 2);
    put(rows, 82, 11, "K");
    blocks(rows, 88, 8, "B?B");
    coins(rows, 94, 7, 3);
    put(rows, 102, 11, "G");
    pipe(rows, 110, 3);
    put(rows, 116, 8, "C");
    put(rows, 120, 11, "K");
    coins(rows, 126, 9, 2);
    flag(rows, 130, 4, 11);
  }),
  create(158, (rows) => {
    put(rows, 3, 11, "S");
    coins(rows, 8, 9, 3);
    blocks(rows, 14, 8, "B?B?B?B");
    put(rows, 24, 11, "G");
    pipe(rows, 32, 2);
    put(rows, 40, 11, "K");
    gap(rows, 48, 2);
    put(rows, 54, 11, "G");
    platform(rows, 62, 9, 7);
    coins(rows, 62, 8, 3);
    put(rows, 67, 8, "K");
    pipe(rows, 76, 3);
    put(rows, 74, 8, "C");
    put(rows, 80, 8, "C");
    blocks(rows, 86, 8, "?B?B?");
    put(rows, 96, 11, "G");
    gap(rows, 104, 2);
    put(rows, 110, 11, "K");
    coins(rows, 116, 8, 3);
    pipe(rows, 124, 2);
    put(rows, 132, 11, "G");
    blocks(rows, 138, 8, "B?B");
    coins(rows, 142, 9, 3);
    put(rows, 146, 11, "K");
    flag(rows, 152, 4, 11);
  }),
  create(176, (rows) => {
    put(rows, 2, 11, "S");
    coins(rows, 6, 9, 3);
    put(rows, 13, 11, "G");
    stairs(rows, 20, 4, 1);
    stairs(rows, 24, 4, -1);
    blocks(rows, 22, 5, "???");
    coins(rows, 32, 9, 2);
    put(rows, 38, 11, "K");
    pipe(rows, 46, 2);
    put(rows, 54, 11, "G");
    gap(rows, 62, 6);
    platform(rows, 64, 10, 6);
    coins(rows, 64, 9, 2);
    put(rows, 67, 9, "K");
    put(rows, 78, 11, "G");
    pipe(rows, 86, 2);
    blocks(rows, 92, 8, "B?B?B");
    put(rows, 100, 11, "K");
    gap(rows, 108, 2);
    put(rows, 114, 11, "G");
    coins(rows, 120, 8, 3);
    pipe(rows, 128, 3);
    put(rows, 136, 11, "K");
    stairs(rows, 144, 3, 1);
    platform(rows, 146, 9, 12);
    platform(rows, 146, 10, 12);
    platform(rows, 146, 11, 12);
    coins(rows, 148, 8, 3);
    put(rows, 154, 8, "G");
    stairs(rows, 158, 3, -1);
    put(rows, 166, 11, "K");
    flag(rows, 170, 4, 11);
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
