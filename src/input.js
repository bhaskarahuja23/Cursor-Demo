const MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyA: "left",
  KeyD: "right",
  ShiftLeft: "run",
  ShiftRight: "run",
  KeyJ: "run",
  Space: "jump",
  KeyK: "jump",
  Enter: "start",
};

export function createInput(target) {
  const down = new Set();
  const pressed = new Set();

  function nameFor(event) {
    return MAP[event.code] || null;
  }

  function onDown(event) {
    const name = nameFor(event);
    if (!name) return;
    event.preventDefault();
    if (!down.has(name)) pressed.add(name);
    down.add(name);
  }

  function onUp(event) {
    const name = nameFor(event);
    if (!name) return;
    event.preventDefault();
    down.delete(name);
  }

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", () => down.clear());

  if (target) {
    target.addEventListener("pointerdown", () => {
      target.focus();
      pressed.add("start");
    });
  }

  return {
    down,
    pressed,
    get left() {
      return down.has("left");
    },
    get right() {
      return down.has("right");
    },
    get run() {
      return down.has("run");
    },
    get jump() {
      return down.has("jump");
    },
    get jumpPressed() {
      return pressed.has("jump");
    },
    get startPressed() {
      return pressed.has("start");
    },
    endFrame() {
      pressed.clear();
    },
  };
}
