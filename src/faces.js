function load(file) {
  const image = new Image();
  image.src = new URL(`../assets/${file}`, import.meta.url).href;
  image.addEventListener("error", () => {
    console.warn(`portrait failed to load: ${file}`);
  });
  return image;
}

const faces = {
  bhaskar: load("bhaskar.jpg"),
  giulio: load("giulio.jpg"),
  francesco: load("francesco.jpg"),
};

export function faceImage(name) {
  const image = faces[name];
  if (!image || !image.complete || !image.naturalWidth) return null;
  return image;
}
