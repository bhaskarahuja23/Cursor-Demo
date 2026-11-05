const FILES = [
  "bhaskar.jpg",
  "giulio.jpg",
  "francesco.jpg",
  "cantello.jpg",
  "Matteo_Pardi-.jpg",
  "Vincenzo_Violi.jpg",
];

const PREFERRED = {
  bhaskar: "Bhaskar",
  giulio: "Giulio",
  francesco: "Francesco",
};

const LEAD = ["bhaskar", "giulio", "francesco"];

function stemOf(file) {
  return file.replace(/\.(jpe?g|png|webp)$/i, "");
}

export function displayName(file) {
  const stem = stemOf(file);
  const key = stem.toLowerCase();
  if (PREFERRED[key]) return PREFERRED[key];
  const cleaned = stem
    .replace(/[-_ ]+[a-f0-9]{6,}$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(/[A-Za-z0-9]+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function load(file) {
  const image = new Image();
  image.src = new URL(`../assets/${file}`, import.meta.url).href;
  image.addEventListener("error", () => {
    console.warn(`portrait failed to load: ${file}`);
  });
  return image;
}

function buildRoster() {
  const people = FILES.map((file) => {
    const id = stemOf(file).toLowerCase();
    return { id, name: displayName(file), file, image: load(file) };
  });
  people.sort((a, b) => {
    const ai = LEAD.indexOf(a.id);
    const bi = LEAD.indexOf(b.id);
    const ao = ai === -1 ? LEAD.length : ai;
    const bo = bi === -1 ? LEAD.length : bi;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
  return people;
}

const roster = buildRoster();
const byId = new Map(roster.map((person) => [person.id, person]));

export function portraits() {
  return roster;
}

export function enemyRoster(heroId) {
  return roster.filter((person) => person.id !== heroId);
}

export function faceImage(id) {
  const person = byId.get(id);
  const image = person && person.image;
  if (!image || !image.complete || !image.naturalWidth) return null;
  return image;
}

export function facesReady() {
  return roster.every((person) => person.image.complete && person.image.naturalWidth > 0);
}
