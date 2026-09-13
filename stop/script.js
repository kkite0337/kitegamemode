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

function drawContained(ctx, image, size) {
  const scale = Math.min(size / image.width, size / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
}

async function fillResultCanvas(canvas) {
  const size = 720;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, size, size);
  for (const id of RESULT_LAYERS) {
    if (!slot.picks[id]) {
      continue;
    }

    try {
      drawContained(ctx, await loadImage(slot.picks[id]), size);
    } catch {
      // skip a missing layer
    }
  }
}

async function resultBlob() {
  const canvas = document.getElementById("resultCanvas");
  if (!canvas) {
    return null;
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function downloadResult() {
  const blob = await resultBlob();
  if (!blob) {
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "멈춰.png";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareResult() {
  const blob = await resultBlob();
  if (!blob) {
    return;
  }

  const file = new File([blob], "멈춰.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "멈춰!", text: "멈춰!" });
      return;
    } catch {
      // fall through to download
    }
  }

  await downloadResult();
}

function renderResult() {
  whoLabel.textContent = displayName();
  stage.innerHTML = `
    <div class="result-screen">
      <p class="stop-lead">완성!</p>
      <canvas class="result-canvas" id="resultCanvas" width="720" height="720"></canvas>
      <div class="stop-actions">
        <button class="stop-btn" type="button" data-slot="download">다운로드</button>
        <button class="stop-btn" type="button" data-slot="share">공유</button>
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

    if (action === "download") {
      downloadResult();
      return;
    }

    if (action === "share") {
      shareResult();
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
