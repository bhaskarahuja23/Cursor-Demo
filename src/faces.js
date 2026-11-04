function load(src) {
  const image = new Image();
  image.src = src;
  return image;
}

const faces = {
  bhaskar: load("assets/bhaskar.jpg"),
  giulio: load("assets/giulio.jpg"),
  francesco: load("assets/francesco.jpg"),
};

export function faceImage(name) {
  const image = faces[name];
  if (!image || !image.complete || !image.naturalWidth) return null;
  return image;
}
