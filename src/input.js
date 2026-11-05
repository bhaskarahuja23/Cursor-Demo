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

export function createInput(target, touchRoot) {
  const keys = new Set();
  const pressed = new Set();

  function nameFor(code) {
    if (code.startsWith("touch:")) return code.slice(6);
    return MAP[code] || null;
  }

  function held(name) {
    for (const code of keys) {
      if (nameFor(code) === name) return true;
    }
    return false;
  }

  function onDown(event) {
    const name = MAP[event.code];
    if (!name) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    if (!keys.has(event.code)) pressed.add(name);
    keys.add(event.code);
  }

  function onUp(event) {
    if (!MAP[event.code]) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    keys.delete(event.code);
  }

  function setTouch(name, down) {
    const code = `touch:${name}`;
    if (down) {
      if (!keys.has(code)) pressed.add(name);
      keys.add(code);
    } else {
      keys.delete(code);
    }
  }

  window.addEventListener("keydown", onDown);
  window.addEventListener("keyup", onUp);
  window.addEventListener("blur", () => {
    keys.clear();
    pressed.clear();
  });

  if (target) {
    target.addEventListener("pointerdown", () => {
      target.focus();
      pressed.add("start");
    });
  }

  if (touchRoot) {
    for (const button of touchRoot.querySelectorAll("[data-action]")) {
      const name = button.dataset.action;
      const release = (event) => {
        if (event.pointerId != null && button.hasPointerCapture?.(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
        setTouch(name, false);
      };
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setTouch(name, true);
      });
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
    }
  }

  return {
    get left() {
      return held("left");
    },
    get right() {
      return held("right");
    },
    get run() {
      return held("run");
    },
    get jump() {
      return held("jump");
    },
    get jumpPressed() {
      return pressed.has("jump");
    },
    get leftPressed() {
      return pressed.has("left");
    },
    get rightPressed() {
      return pressed.has("right");
    },
    get startPressed() {
      return pressed.has("start");
    },
    get pressedAny() {
      return pressed.size > 0;
    },
    endFrame() {
      pressed.clear();
    },
  };
}
