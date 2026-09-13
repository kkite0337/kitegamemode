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

  setPhase("lobby");
}

function playerChips() {
  if (!host.players.length) {
    return "";
  }

  return `
    <div class="stop-players">
      ${host.players
        .map((player) => `<span class="stop-chip">${escapeHtml(player.name || player.id || "참가자")}</span>`)
        .join("")}
    </div>
  `;
}

function hostActions() {
  if (!isHost()) {
    return "";
  }

  if (stopState.phase === "run") {
    return `
      <div class="stop-actions">
        <button class="stop-btn is-stop" type="button" data-stop="halt">멈춰!</button>
      </div>
    `;
  }

  if (stopState.phase === "stop") {
    return `
      <div class="stop-actions">
        <button class="stop-btn" type="button" data-stop="run">다시 시작</button>
        <button class="stop-btn is-ghost" type="button" data-stop="lobby">처음으로</button>
        ${embedded ? `<button class="stop-btn is-ghost" type="button" data-stop="exit">메인으로</button>` : ""}
      </div>
    `;
  }

  return `
    <div class="stop-actions">
      <button class="stop-btn" type="button" data-stop="run">시작</button>
      ${embedded ? `<button class="stop-btn is-ghost" type="button" data-stop="exit">메인으로</button>` : ""}
    </div>
  `;
}

function renderStop() {
  whoLabel.textContent = displayName();

  if (stopState.phase === "run") {
    stage.innerHTML = `
      <p class="stop-title is-run">움직이세요</p>
      <p class="stop-lead">진행자가 멈추라고 할 때까지 계속하세요</p>
      ${hostActions()}
    `;
    return;
  }

  if (stopState.phase === "stop") {
    stage.innerHTML = `
      <p class="stop-title is-stop">멈춰!</p>
      <p class="stop-lead">그 자리에서 멈추세요</p>
      ${hostActions()}
    `;
    return;
  }

  stage.innerHTML = `
    <p class="stop-lead">준비되면 시작하세요</p>
    ${playerChips()}
    ${hostActions()}
  `;
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

  if (stopState.phase === "run" || stopState.phase === "stop") {
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
        phase: incoming.phase === "run" || incoming.phase === "stop" ? incoming.phase : "lobby",
        updatedAt: Number(incoming.updatedAt || 0),
      };
      renderStop();
      if (stopState.phase === "run" || stopState.phase === "stop") {
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

window.addEventListener("message", (event) => {
  if (event.data?.type === "stop-host") {
    applyHost(event.data);
  }
});

document.addEventListener("click", (event) => {
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

  if (!isHost()) {
    return;
  }

  if (action === "exit") {
    exitToHost();
    return;
  }

  if (action === "run") {
    dismissSplash();
    setPhase("run");
    return;
  }

  if (action === "halt" || action === "lobby") {
    setPhase(action === "halt" ? "stop" : action);
  }
});

document.body.classList.toggle("is-embedded", embedded);
renderStop();
showIntroLogo();
requestHost();
startMqtt();
