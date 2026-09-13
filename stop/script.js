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

function isInkPixel(data, index) {
  return data[index + 3] > 20 && (data[index] < 240 || data[index + 1] < 240 || data[index + 2] < 240);
}

function faceRows(image) {
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, probe.width, probe.height).data;
  const rows = [];
  for (let y = 0; y < probe.height; y += 1) {
    let left = -1;
    let right = -1;
    let count = 0;
    for (let x = 0; x < probe.width; x += 1) {
      if (!isInkPixel(pixels, (y * probe.width + x) * 4)) {
        continue;
      }
      if (left < 0) {
        left = x;
      }
      right = x;
      count += 1;
    }
    if (count) {
      rows.push({ y, left, right, count, w: right - left + 1 });
    }
  }
  return rows;
}

function percentile(values, p) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[index];
}

function pickHeadRows(rows) {
  if (!rows.length) {
    return rows;
  }

  const yMin = rows[0].y;
  const yMax = rows[rows.length - 1].y;
  const span = Math.max(1, yMax - yMin);
  const band = rows.filter((row) => {
    const t = (row.y - yMin) / span;
    return t >= 0.16 && t <= 0.84;
  });
  const peak = (band.length ? band : rows).reduce((best, row) => (row.w > best.w ? row : best), rows[0]);
  let top = rows.indexOf(peak);
  while (top > 0) {
    const prev = rows[top - 1];
    const cur = rows[top];
    if (cur.y - prev.y > 8) {
      break;
    }
    if (prev.w < peak.w * 0.28) {
      break;
    }
    if (prev.count <= 8 && cur.count >= 14 && peak.y - prev.y > peak.w * 0.1) {
      break;
    }
    top -= 1;
  }

  let bottom = rows.indexOf(peak);
  let slim = peak.w;
  while (bottom < rows.length - 1) {
    const next = rows[bottom + 1];
    const cur = rows[bottom];
    if (next.y - cur.y > 8) {
      break;
    }
    if (next.y - peak.y > peak.w * 0.1 && next.w > slim * 1.15 && next.count < cur.count * 0.65) {
      break;
    }
    if (next.w < peak.w * 0.16 && next.count < 10) {
      break;
    }
    slim = Math.min(slim, next.w);
    bottom += 1;
  }

  return rows.slice(top, bottom + 1);
}

function faceMap(image, size) {
  const rows = pickHeadRows(faceRows(image));
  const scale = Math.min(size / image.width, size / image.height);
  const ox = (size - image.width * scale) / 2;
  const oy = (size - image.height * scale) / 2;
  const mapped = rows.map((row) => ({
    y: oy + row.y * scale,
    left: ox + row.left * scale,
    right: ox + row.right * scale,
    w: row.w * scale,
    count: row.count,
  }));
  const mid = mapped.slice(
    Math.floor(mapped.length * 0.22),
    Math.max(Math.floor(mapped.length * 0.22) + 1, Math.ceil(mapped.length * 0.78)),
  );
  const coreW = percentile((mid.length ? mid : mapped).map((row) => row.w), 0.45);
  const cx =
    mapped.reduce((sum, row) => sum + (row.left + row.right) / 2, 0) / Math.max(mapped.length, 1);
  return {
    ox,
    oy,
    scale,
    rows: mapped,
    top: mapped[0]?.y ?? size * 0.2,
    bottom: mapped[mapped.length - 1]?.y ?? size * 0.7,
    coreW: Math.max(48, coreW),
    cx,
  };
}

function nearestRow(profile, y) {
  return profile.rows.reduce((best, row) => (Math.abs(row.y - y) < Math.abs(best.y - y) ? row : best), profile.rows[0]);
}

function cavityAt(profile, y) {
  if (!profile.rows.length) {
    return { left: profile.cx - profile.coreW / 2, right: profile.cx + profile.coreW / 2 };
  }

  const row = nearestRow(profile, y);
  const pad = Math.max(7, Math.min(row.w * 0.08, 18));
  let left = row.left + pad;
  let right = row.right - pad;
  if (row.w > profile.coreW * 1.1) {
    left = Math.max(left, profile.cx - profile.coreW / 2 + pad);
    right = Math.min(right, profile.cx + profile.coreW / 2 - pad);
  }
  if (right - left < 18) {
    return { left: profile.cx - 9, right: profile.cx + 9 };
  }
  return { left, right };
}

function placeFeature(profile, cx, cy, maxW, maxH) {
  const headTop = profile.top + (profile.bottom - profile.top) * 0.1;
  const headBottom = profile.bottom - (profile.bottom - profile.top) * 0.08;
  const y = Math.min(Math.max(cy, headTop + maxH * 0.4), headBottom - maxH * 0.35);
  const top = cavityAt(profile, y - maxH * 0.28);
  const mid = cavityAt(profile, y);
  const low = cavityAt(profile, y + maxH * 0.28);
  const left = Math.max(top.left, mid.left, low.left);
  const right = Math.min(top.right, mid.right, low.right);
  const width = Math.min(maxW, Math.max(12, right - left) * 0.92);
  const height = Math.min(maxH, (profile.bottom - profile.top) * 0.26);
  const x = Math.min(Math.max(cx, left + width / 2), right - width / 2);
  return { cx: x, cy: y, w: width, h: height };
}

function clipHead(ctx, profile) {
  if (!profile.rows.length) {
    return;
  }

  ctx.beginPath();
  profile.rows.forEach((row, index) => {
    const hole = cavityAt(profile, row.y);
    if (index === 0) {
      ctx.moveTo(hole.left, row.y);
    } else {
      ctx.lineTo(hole.left, row.y);
    }
  });
  for (let index = profile.rows.length - 1; index >= 0; index -= 1) {
    const row = profile.rows[index];
    ctx.lineTo(cavityAt(profile, row.y).right, row.y);
  }
  ctx.closePath();
  ctx.clip();
}

function densestUpperY(image) {
  const box = inkBounds(image);
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(box.x, box.y, box.w, box.h).data;
  const limit = Math.max(1, Math.floor(box.h * 0.62));
  let bestY = box.y + Math.floor(box.h * 0.18);
  let best = 0;
  for (let y = 0; y < limit; y += 1) {
    let count = 0;
    for (let x = 0; x < box.w; x += 1) {
      if (isInkPixel(pixels, (y * box.w + x) * 4)) {
        count += 1;
      }
    }
    if (count > best) {
      best = count;
      bestY = box.y + y;
    }
  }
  return { box, anchorY: bestY };
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

async function fillResultCanvas(canvas) {
  const size = 720;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, size, size);

  const faceImage = slot.picks.F ? await loadImage(slot.picks.F).catch(() => null) : null;
  const bodyBox = faceImage ? inkBounds(faceImage) : null;
  const scale = faceImage ? Math.min(size / faceImage.width, size / faceImage.height) : 1;
  if (faceImage) {
    ctx.drawImage(
      faceImage,
      (size - faceImage.width * scale) / 2,
      (size - faceImage.height * scale) / 2,
      faceImage.width * scale,
      faceImage.height * scale,
    );
  }

  const profile = faceImage
    ? faceMap(faceImage, size)
    : { rows: [], top: size * 0.22, bottom: size * 0.62, coreW: size * 0.42, cx: size / 2 };
  const headH = Math.max(48, profile.bottom - profile.top);
  const headW = Math.max(48, profile.coreW);
  const cx = profile.cx;
  const eyeY = profile.top + headH * 0.38;
  const eyeBand = cavityAt(profile, eyeY);
  const eyeSpan = Math.max(24, eyeBand.right - eyeBand.left);
  const eyeW = Math.min(headW * 0.22, eyeSpan * 0.28, headH * 0.2);
  const eyeH = Math.min(headH * 0.16, eyeW * 0.95);
  const eyeGap = Math.min(eyeW * 0.55, eyeSpan * 0.12);
  const leftEye = placeFeature(profile, cx - eyeW / 2 - eyeGap / 2, eyeY, eyeW, eyeH);
  const rightEye = placeFeature(profile, cx + eyeW / 2 + eyeGap / 2, eyeY, eyeW, eyeH);
  const nose = placeFeature(profile, cx, profile.top + headH * 0.55, headW * 0.16, headH * 0.14);
  const mouth = placeFeature(profile, cx, profile.top + headH * 0.73, headW * 0.3, headH * 0.13);

  const clothCx = bodyBox
    ? (size - faceImage.width * scale) / 2 + (bodyBox.x + bodyBox.w / 2) * scale
    : cx;
  if (slot.picks.cloth) {
    try {
      const clothImage = await loadImage(slot.picks.cloth);
      const clothBox = inkBounds(clothImage);
      const clothW = headW * 0.8;
      const clothHFit = Math.min(clothBox.h * (clothW / Math.max(clothBox.w, 1)), headH * 0.85);
      drawPart(ctx, clothImage, clothCx, profile.bottom + clothHFit * 0.22, clothW, clothHFit, false);
    } catch {
      // skip a missing cloth
    }
  }

  if (slot.picks.hair) {
    try {
      const hairImage = await loadImage(slot.picks.hair);
      const { box: hairBox, anchorY } = densestUpperY(hairImage);
      const hairW = headW * 1.04;
      const hairHFit = Math.min(hairBox.h * (hairW / Math.max(hairBox.w, 1)), headH * 1.05);
      const crownY = profile.top + Math.min(14, headH * 0.06);
      const local = (anchorY - hairBox.y) / Math.max(hairBox.h, 1);
      const hairCy = crownY + hairHFit / 2 - local * hairHFit;
      drawPart(ctx, hairImage, cx, hairCy, hairW, hairHFit, false);
    } catch {
      // skip a missing hair
    }
  }

  ctx.save();
  clipHead(ctx, profile);
  const faceParts = [
    ["E", leftEye.cx, leftEye.cy, leftEye.w, leftEye.h, false],
    ["E", rightEye.cx, rightEye.cy, rightEye.w, rightEye.h, true],
    ["N", nose.cx, nose.cy, nose.w, nose.h, false],
    ["M", mouth.cx, mouth.cy, mouth.w, mouth.h, false],
  ];
  for (const [id, x, y, maxW, maxH, flip] of faceParts) {
    if (!slot.picks[id]) {
      continue;
    }

    try {
      drawPart(ctx, await loadImage(slot.picks[id]), x, y, maxW, maxH, flip);
    } catch {
      // skip a missing layer
    }
  }
  ctx.restore();
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

async function renderPreview() {
  const splash = document.getElementById("stopSplash");
  if (splash) {
    splash.hidden = true;
  }
  document.querySelector(".stop-app")?.classList.add("is-ready");
  whoLabel.textContent = "미리보기";
  const faces = SLOT_SETS.find((set) => set.id === "F")?.files || [];
  const sample = Object.fromEntries(
    SLOT_SETS.filter((set) => set.id !== "F").map((set) => [set.id, set.files[0]]),
  );
  stage.innerHTML = `
    <div class="preview-grid">
      ${faces.map((_, index) => `<canvas class="result-canvas" id="preview${index}" width="720" height="720"></canvas>`).join("")}
    </div>
  `;
  for (let index = 0; index < faces.length; index += 1) {
    slot.picks = { ...sample, F: faces[index] };
    await fillResultCanvas(document.getElementById(`preview${index}`));
  }
}

document.body.classList.toggle("is-embedded", embedded);
if (params.get("preview") === "1") {
  renderPreview();
} else {
  renderStop();
  showIntroLogo();
  requestHost();
  startMqtt();
}
