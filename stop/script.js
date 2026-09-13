const STOP_MQTT = "wss://broker.hivemq.com:8884/mqtt";
const STOP_MQTT_FALLBACK = "wss://broker.emqx.io:8084/mqtt";
const STOP_MQTT_PREFIX = "kitegamemode/kr/stop/v1";

const params = new URLSearchParams(location.search);
const embedded = params.get("embedded") === "1";
const stage = document.getElementById("stopStage");
const whoLabel = document.getElementById("stopWho");

const host = {
  role: params.get("role") || "user",
  id: params.get("id") || "",
  name: params.get("name") || "",
  nickname: params.get("nick") || "",
  players: [],
};

let stopState = { phase: "lobby", updatedAt: 0 };
let mqttClient = null;
let slotAnim = 0;

const slot = {
  setIndex: 0,
  picks: {},
  offset: 0,
  speed: 0,
  spinning: false,
  stopping: false,
  itemWidth: 168,
};

function isHost() {
  return host.role === "admin" || params.get("host") === "1";
}

function displayName() {
  return host.nickname || host.name || host.id || (isHost() ? "진행자" : "참가자");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function requestHost() {
  if (!embedded || !window.parent || window.parent === window) {
    return;
  }

  window.parent.postMessage({ type: "stop-ready" }, "*");
}

function applyHost(data) {
  if (!data || typeof data !== "object") {
    return;
  }

  host.role = data.role || host.role;
  host.id = data.id || host.id;
  host.name = data.name || host.name;
  host.nickname = data.nickname || host.nickname;
  host.players = Array.isArray(data.players) ? data.players : host.players;
  renderStop();
  showIntroLogo();
}

function exitToHost() {
  if (embedded && window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "stop-exit" }, "*");
    return;
  }

  resetSlot();
  setPhase("lobby");
  showIntroLogo();
}

function currentSet() {
  return SLOT_SETS[slot.setIndex];
}

function currentFiles() {
  return currentSet()?.files || [];
}

function loopWidth() {
  return Math.max(currentFiles().length, 1) * slot.itemWidth;
}

function wrapOffset(value) {
  const width = loopWidth();
  return ((value % width) + width) % width;
}

function resetSlot() {
  window.cancelAnimationFrame(slotAnim);
  slot.setIndex = 0;
  slot.picks = {};
  slot.offset = 0;
  slot.speed = 0;
  slot.spinning = false;
  slot.stopping = false;
}

function startSpin() {
  slot.spinning = true;
  slot.stopping = false;
  slot.speed = 18 + Math.random() * 6;
  slot.offset = loopWidth() + wrapOffset(slot.offset);
  const halt = document.getElementById("slotHalt");
  if (halt) {
    halt.disabled = false;
  }
  tickSlot();
}

function tickSlot() {
  if (!slot.spinning) {
    return;
  }

  slot.offset += slot.speed;
  const width = loopWidth();
  if (slot.offset > width * 2) {
    slot.offset -= width;
  }

  if (slot.stopping) {
    slot.speed *= 0.965;
    if (slot.speed < 0.35) {
      finishSpin();
      return;
    }
  }

  paintReel();
  slotAnim = window.requestAnimationFrame(tickSlot);
}

function requestHalt() {
  if (!slot.spinning || slot.stopping) {
    return;
  }

  slot.stopping = true;
  const halt = document.getElementById("slotHalt");
  if (halt) {
    halt.disabled = true;
  }
}

function finishSpin() {
  const files = currentFiles();
  const width = loopWidth();
  const nearest = Math.round(slot.offset / slot.itemWidth);
  slot.offset = nearest * slot.itemWidth;
  slot.speed = 0;
  slot.spinning = false;
  slot.stopping = false;
  slot.picks[currentSet().id] = files[((nearest % files.length) + files.length) % files.length];
  if (slot.offset > width * 2) {
    slot.offset -= width;
  }
  paintReel();
  window.setTimeout(() => {
    if (slot.setIndex >= SLOT_SETS.length - 1) {
      renderResult();
      return;
    }

    slot.setIndex += 1;
    renderSlotScreen();
    startSpin();
  }, 450);
}

function paintReel() {
  const reel = document.getElementById("slotReel");
  const windowEl = document.querySelector(".slot-window");
  if (!reel) {
    return;
  }

  const pad = windowEl ? (windowEl.clientWidth - slot.itemWidth) / 2 : 0;
  reel.style.transform = `translateX(${pad - slot.offset}px)`;
}

function reelMarkup() {
  const files = currentFiles();
  const copies = [...files, ...files, ...files];
  return copies
    .map(
      (file) => `
        <div class="slot-item">
          <img src="${escapeAttr(file)}" alt="">
        </div>
      `,
    )
    .join("");
}

function renderSlotScreen() {
  const set = currentSet();
  const canPrev = slot.setIndex > 0 && !slot.spinning;
  const canNext = Boolean(slot.picks[set.id]) && slot.setIndex < SLOT_SETS.length - 1 && !slot.spinning;
  whoLabel.textContent = displayName();
  stage.innerHTML = `
    <div class="slot-screen">
      <div class="slot-pick">
        <button class="slot-arrow" type="button" data-slot="prev" ${canPrev ? "" : "disabled"}>&lt;</button>
        <p class="slot-pick__label">${escapeHtml(set.label)}</p>
        <button class="slot-arrow" type="button" data-slot="next" ${canNext ? "" : "disabled"}>&gt;</button>
      </div>
      <div class="slot-window">
        <div class="slot-reel" id="slotReel">${reelMarkup()}</div>
      </div>
      <button class="stop-btn is-stop" type="button" id="slotHalt" data-slot="halt">멈춰!</button>
    </div>
  `;
  slot.offset = wrapOffset(slot.offset);
  paintReel();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

function inkBounds(image) {
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, probe.width, probe.height).data;
  let left = probe.width;
  let top = probe.height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < probe.height; y += 1) {
    for (let x = 0; x < probe.width; x += 1) {
      const index = (y * probe.width + x) * 4;
      const alpha = pixels[index + 3];
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      if (alpha > 20 && (red < 240 || green < 240 || blue < 240)) {
        if (x < left) {
          left = x;
        }
        if (y < top) {
          top = y;
        }
        if (x > right) {
          right = x;
        }
        if (y > bottom) {
          bottom = y;
        }
      }
    }
  }

  if (right < left) {
    return { x: 0, y: 0, w: image.width, h: image.height };
  }

  return { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
}

function drawPart(ctx, image, cx, cy, maxW, maxH, flip = false) {
  const box = inkBounds(image);
  const scale = Math.min(maxW / box.w, maxH / box.h);
  const width = box.w * scale;
  const height = box.h * scale;
  const x = cx - width / 2;
  const y = cy - height / 2;
  ctx.save();
  if (flip) {
    ctx.translate(cx, cy);
    ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);
  }
  ctx.drawImage(image, box.x, box.y, box.w, box.h, x, y, width, height);
  ctx.restore();
}

function faceLayout(image, size) {
  const box = inkBounds(image);
  const scale = Math.min(size / image.width, size / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const left = (size - drawW) / 2 + box.x * scale;
  const top = (size - drawH) / 2 + box.y * scale;
  const width = box.w * scale;
  const height = box.h * scale;
  const headH = height * 0.56;
  return {
    left,
    top,
    width,
    height,
    headH,
    cx: left + width / 2,
  };
}

async function fillResultCanvas(canvas) {
  const size = 720;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, size, size);

  const faceImage = slot.picks.F ? await loadImage(slot.picks.F).catch(() => null) : null;
  const layout = faceImage ? faceLayout(faceImage, size) : { cx: size / 2, top: size * 0.18, width: size * 0.55, height: size * 0.7, headH: size * 0.38 };
  if (faceImage) {
    const scale = Math.min(size / faceImage.width, size / faceImage.height);
    ctx.drawImage(
      faceImage,
      (size - faceImage.width * scale) / 2,
      (size - faceImage.height * scale) / 2,
      faceImage.width * scale,
      faceImage.height * scale,
    );
  }

  const cx = layout.cx;
  const eyeY = layout.top + layout.headH * 0.4;
  const noseY = layout.top + layout.headH * 0.58;
  const mouthY = layout.top + layout.headH * 0.78;
  const hairY = layout.top + layout.headH * 0.16;
  const clothY = layout.top + layout.height * 0.78;
  const eyeX = layout.width * 0.16;

  const layers = [
    ["cloth", cx, clothY, layout.width * 0.5, layout.height * 0.34, false],
    ["hair", cx, hairY, layout.width * 0.62, layout.headH * 0.5, false],
    ["E", cx - eyeX, eyeY, layout.width * 0.2, layout.headH * 0.24, false],
    ["E", cx + eyeX, eyeY, layout.width * 0.2, layout.headH * 0.24, true],
    ["N", cx, noseY, layout.width * 0.14, layout.headH * 0.18, false],
    ["M", cx, mouthY, layout.width * 0.24, layout.headH * 0.14, false],
  ];

  for (const [id, x, y, maxW, maxH, flip] of layers) {
    if (!slot.picks[id]) {
      continue;
    }

    try {
      drawPart(ctx, await loadImage(slot.picks[id]), x, y, maxW, maxH, flip);
    } catch {
      // skip a missing layer
    }
  }
}

function renderResult() {
  whoLabel.textContent = displayName();
  stage.innerHTML = `
    <div class="result-screen">
      <p class="stop-lead">완성!</p>
      <canvas class="result-canvas" id="resultCanvas" width="720" height="720"></canvas>
      <div class="stop-actions">
        <button class="stop-btn" type="button" data-slot="share">공유</button>
        <button class="stop-btn" type="button" data-slot="save">사진 저장</button>
        <button class="stop-btn is-ghost" type="button" data-slot="retry">다시하기</button>
        ${embedded ? `<button class="stop-btn is-ghost" type="button" data-stop="exit">메인으로</button>` : ""}
      </div>
    </div>
  `;
  fillResultCanvas(document.getElementById("resultCanvas"));
}

function renderStop() {
  whoLabel.textContent = displayName();

  if (stopState.phase === "run") {
    if (stage.querySelector(".slot-screen") || stage.querySelector(".result-screen")) {
      return;
    }

    renderSlotScreen();
    startSpin();
    return;
  }

  resetSlot();
  stage.innerHTML = "";
}

function dismissSplash() {
  const splash = document.getElementById("stopSplash");
  const app = document.querySelector(".stop-app");
  app?.classList.add("is-ready");
  if (!splash || splash.hidden) {
    return;
  }

  splash.classList.add("is-out");
  window.setTimeout(() => {
    splash.hidden = true;
  }, 450);
}

function showIntroLogo() {
  const splash = document.getElementById("stopSplash");
  const startButton = document.getElementById("stopIntroStart");
  if (!splash) {
    document.querySelector(".stop-app")?.classList.add("is-ready");
    return;
  }

  if (stopState.phase === "run") {
    splash.hidden = true;
    document.querySelector(".stop-app")?.classList.add("is-ready");
    return;
  }

  splash.hidden = false;
  splash.classList.remove("is-out");
  if (startButton) {
    startButton.hidden = false;
  }
}

function setPhase(phase) {
  stopState = { phase, updatedAt: Date.now() };
  renderStop();
  publishStop();
}

function publishStop() {
  if (!mqttClient?.connected) {
    return;
  }

  mqttClient.publish(`${STOP_MQTT_PREFIX}/state`, JSON.stringify(stopState), { retain: true, qos: 0 });
}

function startMqtt(url) {
  if (typeof mqtt !== "object" && typeof mqtt !== "function") {
    return;
  }

  const connect = mqtt.connect || mqtt.default?.connect;
  if (typeof connect !== "function") {
    return;
  }

  const broker = url || STOP_MQTT;
  mqttClient = connect(broker, {
    clientId: `stop${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 8000,
  });

  mqttClient.on("connect", () => {
    mqttClient.subscribe(`${STOP_MQTT_PREFIX}/state`, { qos: 0 });
    publishStop();
  });

  mqttClient.on("message", (_topic, payload) => {
    try {
      const incoming = JSON.parse(String(payload));
      if (!incoming || typeof incoming !== "object") {
        return;
      }

      if ((incoming.updatedAt || 0) < stopState.updatedAt) {
        return;
      }

      stopState = {
        phase: incoming.phase === "run" ? "run" : "lobby",
        updatedAt: Number(incoming.updatedAt || 0),
      };
      renderStop();
      if (stopState.phase === "run") {
        dismissSplash();
      }
    } catch {
      // ignore
    }
  });

  mqttClient.once("error", () => {
    if (broker !== STOP_MQTT_FALLBACK) {
      startMqtt(STOP_MQTT_FALLBACK);
    }
  });
}

function moveSet(step) {
  const next = slot.setIndex + step;
  if (next < 0 || next >= SLOT_SETS.length) {
    return;
  }

  if (step > 0 && !slot.picks[currentSet().id]) {
    return;
  }

  slot.setIndex = next;
  renderSlotScreen();
  startSpin();
}

window.addEventListener("message", (event) => {
  if (event.data?.type === "stop-host") {
    applyHost(event.data);
  }
});

document.addEventListener("click", (event) => {
  const slotButton = event.target.closest("[data-slot]");
  if (slotButton) {
    const action = slotButton.dataset.slot;
    if (action === "halt") {
      requestHalt();
      return;
    }

    if (action === "prev") {
      moveSet(-1);
      return;
    }

    if (action === "next") {
      moveSet(1);
      return;
    }

    if (action === "share" || action === "save") {
      return;
    }

    if (action === "retry") {
      resetSlot();
      renderSlotScreen();
      startSpin();
    }
    return;
  }

  const button = event.target.closest("[data-stop]");
  if (!button) {
    return;
  }

  const action = button.dataset.stop;
  if (action === "intro-start") {
    dismissSplash();
    setPhase("run");
    return;
  }

  if (action === "exit") {
    exitToHost();
  }
});

document.body.classList.toggle("is-embedded", embedded);
renderStop();
showIntroLogo();
requestHost();
startMqtt();
