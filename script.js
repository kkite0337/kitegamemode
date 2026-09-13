const SESSION_KEY = "gift-draw-session";
const SESSION_RESET_KEY = "gift-draw-session-reset";
const PROFILE_KEY = "gift-draw-profiles";
const PROFILE_RESET_KEY = "gift-draw-profile-reset";
const GAME_KEY = "gift-draw-game";
const GAME_UPDATED_KEY = "gift-draw-game-updated";
const RESET_CHANNEL = "gift-draw-reset-channel";

function participantIds() {
  return ACCOUNTS.map((account) => account.id);
}

function userIds() {
  return participantIds();
}

function userProfileKey(id) {
  return `${PROFILE_KEY}:${id}`;
}

function emptyProfiles() {
  return Object.fromEntries(
    participantIds().map((id) => [id, emptyUserProfile()]),
  );
}

function emptyDrink() {
  return { name: "", price: "", submitted: false, updatedAt: 0 };
}

function emptyDrinks() {
  return Object.fromEntries(ACCOUNTS.map((account) => [account.id, emptyDrink()]));
}

function isEmptyDrink(drink) {
  const item = { ...emptyDrink(), ...drink };
  return !item.submitted && !item.name && !item.price;
}

function drinkIsStale(drink, resetAt = currentResetAt()) {
  const item = { ...emptyDrink(), ...drink };
  if (isEmptyDrink(item)) {
    return true;
  }

  return (item.updatedAt || 0) <= resetAt;
}

function pickRicherDrink(first, second) {
  const resetAt = currentResetAt();
  const left = { ...emptyDrink(), ...first };
  const right = { ...emptyDrink(), ...second };
  const leftStale = drinkIsStale(left, resetAt);
  const rightStale = drinkIsStale(right, resetAt);
  if (leftStale !== rightStale) {
    return leftStale ? right : left;
  }

  if (leftStale && rightStale) {
    return emptyDrink();
  }

  if (left.submitted !== right.submitted) {
    return left.submitted ? left : right;
  }

  if ((left.updatedAt || 0) !== (right.updatedAt || 0)) {
    return (left.updatedAt || 0) > (right.updatedAt || 0) ? left : right;
  }

  const score = (item) => Number(Boolean(item.name)) + Number(Boolean(item.price));
  return score(left) >= score(right) ? left : right;
}

function mergeDrinkMaps(first, second) {
  const resetAt = currentResetAt();
  return Object.fromEntries(
    participantIds().map((id) => {
      const local = first?.[id];
      const remote = second?.[id];
      if (!second || !Object.prototype.hasOwnProperty.call(second, id) || drinkIsStale(remote, resetAt)) {
        return [id, drinkIsStale(local, resetAt) ? emptyDrink() : { ...emptyDrink(), ...local }];
      }

      if (drinkIsStale(local, resetAt)) {
        return [id, { ...emptyDrink(), ...remote }];
      }

      return [id, pickRicherDrink(local, remote)];
    }),
  );
}

function sanitizeDrinks(drinks, resetAt = currentResetAt()) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const drink = drinks?.[id];
      return [id, drinkIsStale(drink, resetAt) ? emptyDrink() : { ...emptyDrink(), ...drink }];
    }),
  );
}

const MENU_OPTIONS = ["한", "중", "일", "양", "동"];
const MENU_LABELS = {
  한: "한식",
  중: "중식",
  일: "일식",
  양: "양식",
  동: "동남아식",
};
const MENU_COLORS = {
  한: "#e11d48",
  중: "#f59e0b",
  일: "#ec4899",
  양: "#2563eb",
  동: "#16a34a",
};

function sanitizeRoulette(slices) {
  return (Array.isArray(slices) ? slices : []).filter((item) => MENU_OPTIONS.includes(item));
}

function pickRoulette(first, second) {
  const left = sanitizeRoulette(first);
  const right = sanitizeRoulette(second);
  return left.length ? left : right;
}

function emptySpin() {
  return { targetIndex: -1, winner: "", turns: 0, duration: 0, startedAt: 0 };
}

function sanitizeSpin(spin, slices = []) {
  const next = { ...emptySpin(), ...(spin && typeof spin === "object" ? spin : {}) };
  const items = sanitizeRoulette(slices);
  const index = Number(next.targetIndex);
  if (!Number.isFinite(index) || index < 0 || (items.length && index >= items.length) || !next.startedAt) {
    return emptySpin();
  }

  next.targetIndex = Math.floor(index);
  next.winner = items[next.targetIndex] || (MENU_OPTIONS.includes(next.winner) ? next.winner : "");
  next.turns = Math.min(12, Math.max(5, Number(next.turns) || 7));
  next.duration = Math.min(12000, Math.max(4500, Number(next.duration) || 6800));
  next.startedAt = Number(next.startedAt) || 0;
  return next.startedAt && next.winner ? next : emptySpin();
}

function pickSpin(first, second) {
  const left = first && typeof first === "object" ? first : emptySpin();
  const right = second && typeof second === "object" ? second : emptySpin();
  return (Number(left.startedAt) || 0) >= (Number(right.startedAt) || 0) ? left : right;
}

function tallySliceList() {
  return menuTallies().flatMap((item) => Array.from({ length: item.count }, () => item.key));
}

function sameSliceBag(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return [...left].sort().join("\0") === [...right].sort().join("\0");
}

function circularDist(index, other, size) {
  const gap = Math.abs(index - other);
  return Math.min(gap, size - gap);
}

function arrangeMenuSlices(picks) {
  const items = (Array.isArray(picks) ? picks : []).filter((item) => MENU_OPTIONS.includes(item));
  const size = items.length;
  if (size <= 1) {
    return items.slice();
  }

  const counts = new Map();
  items.forEach((item) => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });
  const types = [...counts.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return MENU_OPTIONS.indexOf(left[0]) - MENU_OPTIONS.indexOf(right[0]);
  });

  const result = new Array(size).fill(null);

  function planPositions(count, start) {
    return Array.from({ length: count }, (_, index) => Math.round(start + (index * size) / count) % size);
  }

  function nearestEmpty(target) {
    let best = -1;
    let bestGap = size + 1;
    for (let index = 0; index < size; index += 1) {
      if (result[index] !== null) {
        continue;
      }
      const gap = circularDist(index, target, size);
      if (gap < bestGap) {
        bestGap = gap;
        best = index;
      }
    }
    return best;
  }

  function scorePlan(positions) {
    const used = new Set();
    let collisions = 0;
    let occupiedHits = 0;
    let minPair = size;
    positions.forEach((position) => {
      if (used.has(position)) {
        collisions += 1;
      }
      used.add(position);
      if (result[position] !== null) {
        occupiedHits += 1;
      }
    });
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        minPair = Math.min(minPair, circularDist(positions[i], positions[j], size));
      }
    }
    return -occupiedHits * 1000 - collisions * 100 + minPair;
  }

  types.forEach(([type, count]) => {
    let bestStart = 0;
    let bestScore = -Infinity;
    for (let start = 0; start < size; start += 1) {
      const score = scorePlan(planPositions(count, start));
      if (score > bestScore) {
        bestScore = score;
        bestStart = start;
      }
    }

    planPositions(count, bestStart).forEach((target) => {
      const slot = result[target] === null ? target : nearestEmpty(target);
      if (slot >= 0) {
        result[slot] = type;
      }
    });
  });

  return result.map((item, index) => item || items[index]);
}

function currentRoulette() {
  const wanted = tallySliceList();
  const stored = sanitizeRoulette(gameState.roulette);
  if (stored.length && sameSliceBag(stored, wanted)) {
    return stored;
  }

  return arrangeMenuSlices(wanted);
}

function ensureRoulette() {
  const wanted = tallySliceList();
  const stored = sanitizeRoulette(gameState.roulette);
  if (stored.length && sameSliceBag(stored, wanted)) {
    gameState.roulette = stored;
    return stored;
  }

  gameState.roulette = arrangeMenuSlices(wanted);
  return gameState.roulette;
}

function emptyMenu() {
  return { picks: [], submitted: false, updatedAt: 0 };
}

function emptyMenus() {
  return Object.fromEntries(ACCOUNTS.map((account) => [account.id, emptyMenu()]));
}

function normalizeMenuPicks(picks) {
  const allowed = new Set(MENU_OPTIONS);
  return [...new Set((Array.isArray(picks) ? picks : []).filter((item) => allowed.has(item)))];
}

function isEmptyMenu(menu) {
  const item = { ...emptyMenu(), ...menu, picks: normalizeMenuPicks(menu?.picks) };
  return !item.submitted && !item.picks.length;
}

function menuIsStale(menu, resetAt = currentResetAt()) {
  const item = { ...emptyMenu(), ...menu, picks: normalizeMenuPicks(menu?.picks) };
  if (isEmptyMenu(item)) {
    return true;
  }

  return (item.updatedAt || 0) <= resetAt;
}

function pickRicherMenu(first, second) {
  const resetAt = currentResetAt();
  const left = { ...emptyMenu(), ...first, picks: normalizeMenuPicks(first?.picks) };
  const right = { ...emptyMenu(), ...second, picks: normalizeMenuPicks(second?.picks) };
  const leftStale = menuIsStale(left, resetAt);
  const rightStale = menuIsStale(right, resetAt);
  if (leftStale !== rightStale) {
    return leftStale ? right : left;
  }

  if (leftStale && rightStale) {
    return emptyMenu();
  }

  if (left.submitted !== right.submitted) {
    return left.submitted ? left : right;
  }

  return (left.updatedAt || 0) >= (right.updatedAt || 0) ? left : right;
}

function mergeMenuMaps(first, second) {
  const resetAt = currentResetAt();
  return Object.fromEntries(
    participantIds().map((id) => {
      const local = first?.[id];
      const remote = second?.[id];
      if (!second || !Object.prototype.hasOwnProperty.call(second, id) || menuIsStale(remote, resetAt)) {
        return [id, menuIsStale(local, resetAt) ? emptyMenu() : { ...emptyMenu(), ...local, picks: normalizeMenuPicks(local?.picks) }];
      }

      if (menuIsStale(local, resetAt)) {
        return [id, { ...emptyMenu(), ...remote, picks: normalizeMenuPicks(remote?.picks) }];
      }

      return [id, pickRicherMenu(local, remote)];
    }),
  );
}

function sanitizeMenus(menus, resetAt = currentResetAt()) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const menu = menus?.[id];
      return [id, menuIsStale(menu, resetAt) ? emptyMenu() : { ...emptyMenu(), ...menu, picks: normalizeMenuPicks(menu?.picks) }];
    }),
  );
}

function sanitizeGameState(game, resetAt = currentResetAt()) {
  const drinks = sanitizeDrinks(game?.drinks, resetAt);
  const menus = sanitizeMenus(game?.menus, resetAt);
  const next = { ...emptyGame(), ...game, drinks, menus };
  const hasFresh =
    participantIds().some((id) => !isEmptyDrink(drinks[id])) ||
    participantIds().some((id) => !isEmptyMenu(menus[id]));
  if (!hasFresh) {
    next.assignment = {};
    next.opened = emptyOpened();
    next.resultPicked = { drink: false, price: false };
    next.priceShares = {};
    next.personalSteps = emptyPersonalSteps();
    next.roulette = [];
    next.spin = emptySpin();
    if (next.phase !== "idle" && next.phase !== "pick" && next.phase !== "entry" && next.phase !== "play") {
      next.game = next.pendingGame || "";
      next.phase = next.pendingGame ? "pick" : "idle";
    }
  } else {
    next.roulette = sanitizeRoulette(next.roulette);
    next.spin = sanitizeSpin(next.spin, next.roulette);
  }
  return next;
}

const PHASE_RANK = {
  idle: 0,
  pick: 1,
  entry: 2,
  play: 2,
  review: 3,
  choose: 4,
  "menu-reveal": 5,
  "menu-spin": 6,
  "drink-reveal": 5,
  "price-reveal": 6,
};

function pickPhase(local, remote) {
  return (PHASE_RANK[remote] || 0) > (PHASE_RANK[local] || 0) ? remote : local;
}

const STEP_RANK = { talk: 0, celebrate: 1, payout: 2, done: 3 };

function mergePersonalSteps(first, second) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const left = first?.[id] || "talk";
      const right = second?.[id] || "talk";
      return [id, (STEP_RANK[right] || 0) > (STEP_RANK[left] || 0) ? right : left];
    }),
  );
}

function mergeOpenedMaps(first, second) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const left = first?.[id] || { drink: false, price: false };
      const right = second?.[id] || { drink: false, price: false };
      return [id, { drink: Boolean(left.drink || right.drink), price: Boolean(left.price || right.price) }];
    }),
  );
}

function filledDrinks(drinks) {
  return Object.fromEntries(
    participantIds()
      .map((id) => [id, drinks?.[id]])
      .filter(([, drink]) => drink && !isEmptyDrink(drink)),
  );
}

function mergeGameState(local, remote, preferRemote = false) {
  const drinks = mergeDrinkMaps(local.drinks, remote.drinks);
  const menus = mergeMenuMaps(local.menus, remote.menus);
  if (currentAccount && drinks[currentAccount.id] && local.drinks?.[currentAccount.id] && !local.drinks[currentAccount.id].submitted) {
    drinks[currentAccount.id] = pickRicherDrink(local.drinks[currentAccount.id], drinks[currentAccount.id]);
  }
  if (currentAccount && menus[currentAccount.id] && local.menus?.[currentAccount.id] && !local.menus[currentAccount.id].submitted) {
    menus[currentAccount.id] = pickRicherMenu(local.menus[currentAccount.id], menus[currentAccount.id]);
  }

  const primary = preferRemote ? remote : local;
  const secondary = preferRemote ? local : remote;
  return sanitizeGameState(
    {
      ...emptyGame(),
      ...secondary,
      ...primary,
      game: primary.game || "",
      pendingGame: primary.pendingGame || "",
      players: Array.isArray(primary.players) ? primary.players : [],
      phase: primary.phase || "idle",
      drinks,
      menus,
      opened: mergeOpenedMaps(local.opened, remote.opened),
      assignment: Object.keys(primary.assignment || {}).length ? primary.assignment : secondary.assignment || {},
      priceShares: Object.keys(primary.priceShares || {}).length ? primary.priceShares : secondary.priceShares || {},
      resultPicked: {
        drink: Boolean(primary.resultPicked?.drink),
        price: Boolean(primary.resultPicked?.price),
      },
      personalSteps: mergePersonalSteps(local.personalSteps, remote.personalSteps),
      roulette: pickRoulette(primary.roulette, secondary.roulette),
      spin: pickSpin(primary.spin, secondary.spin),
    },
    currentResetAt(),
  );
}

function emptyOpened() {
  return Object.fromEntries(
    ACCOUNTS.map((account) => [account.id, { drink: false, price: false }]),
  );
}

function emptyPersonalSteps() {
  return Object.fromEntries(ACCOUNTS.map((account) => [account.id, "talk"]));
}

function emptyGame() {
  return {
    game: "",
    pendingGame: "",
    phase: "idle",
    players: [],
    drinks: emptyDrinks(),
    menus: emptyMenus(),
    assignment: {},
    opened: emptyOpened(),
    resultPicked: { drink: false, price: false },
    priceShares: {},
    personalSteps: emptyPersonalSteps(),
    roulette: [],
    spin: emptySpin(),
  };
}

function gamePlayers() {
  const selected = Array.isArray(gameState.players) ? gameState.players : [];
  const allowed = new Set(participantIds());
  return selected.filter((id) => allowed.has(id));
}

function playerAccounts() {
  return gamePlayers()
    .map((id) => ACCOUNTS.find((account) => account.id === id))
    .filter(Boolean);
}

function isGameActive() {
  return Boolean(gameState.game) && gameState.phase !== "idle" && gameState.phase !== "pick";
}

function isInCurrentGame(id = currentAccount?.id) {
  return Boolean(id) && gamePlayers().includes(id);
}

function emptyUserProfile(resetAt = 0) {
  return { name: "", nickname: "", photo: "", submitted: false, updatedAt: resetAt, resetAt };
}

function readJson(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readStoredProfile(id) {
  const parsed = readJson(userProfileKey(id), null);
  if (!parsed) {
    return emptyUserProfile();
  }

  return { ...emptyUserProfile(), ...parsed };
}

function readLegacyProfiles() {
  const parsed = readJson(PROFILE_KEY, null);
  if (!parsed || typeof parsed !== "object") {
    return {};
  }

  return parsed;
}

function pickRicherProfile(first, second) {
  const left = { ...emptyUserProfile(), ...first };
  const right = { ...emptyUserProfile(), ...second };
  const leftEmpty = isEmptyProfile(left);
  const rightEmpty = isEmptyProfile(right);
  if (leftEmpty !== rightEmpty) {
    const filled = leftEmpty ? right : left;
    const blank = leftEmpty ? left : right;
    if ((filled.updatedAt || 0) > (blank.resetAt || 0) || (filled.resetAt || 0) >= (blank.resetAt || 0)) {
      return filled;
    }
    return blank;
  }

  if ((left.resetAt || 0) !== (right.resetAt || 0)) {
    return (left.resetAt || 0) > (right.resetAt || 0) ? left : right;
  }

  if ((left.updatedAt || 0) !== (right.updatedAt || 0)) {
    return (left.updatedAt || 0) > (right.updatedAt || 0) ? left : right;
  }

  if (left.submitted !== right.submitted) {
    return left.submitted ? left : right;
  }

  const score = (item) => Number(Boolean(item.name)) + Number(Boolean(item.nickname));
  return score(left) >= score(right) ? left : right;
}

function loadProfiles() {
  const resetAt = Number(localStorage.getItem(PROFILE_RESET_KEY) || 0);
  const legacy = readLegacyProfiles();
  return Object.fromEntries(
    userIds().map((id) => {
      const loaded = pickRicherProfile(readStoredProfile(id), legacy[id]);
      if ((loaded.resetAt || 0) < resetAt && (loaded.updatedAt || 0) <= resetAt) {
        return [id, emptyUserProfile(resetAt)];
      }

      return [id, loaded];
    }),
  );
}

function loadGame() {
  const saved = localStorage.getItem(GAME_KEY);
  if (!saved) {
    return emptyGame();
  }

  try {
    const parsed = JSON.parse(saved);
    return sanitizeGameState({
      ...emptyGame(),
      ...parsed,
      pendingGame: parsed.pendingGame || "",
      players: Array.isArray(parsed.players) ? parsed.players : [],
      drinks: { ...emptyDrinks(), ...parsed.drinks },
      menus: { ...emptyMenus(), ...parsed.menus },
      opened: { ...emptyOpened(), ...parsed.opened },
      resultPicked: { drink: false, price: false, ...parsed.resultPicked },
      priceShares: { ...parsed.priceShares },
      personalSteps: { ...emptyPersonalSteps(), ...parsed.personalSteps },
      roulette: sanitizeRoulette(parsed.roulette),
      spin: parsed.spin,
    });
  } catch {
    return emptyGame();
  }
}

const profiles = loadProfiles();
let gameState = loadGame();

const loginPage = document.getElementById("loginPage");
const userPage = document.getElementById("userPage");
const adminPage = document.getElementById("adminPage");
const loginForm = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const userLabel = document.getElementById("userLabel");
const registerForm = document.getElementById("registerForm");
const registerStage = document.getElementById("registerStage");
const userMain = document.getElementById("userMain");
const userPlay = document.getElementById("userPlay");
const adminList = document.getElementById("adminList");
const adminSettings = document.getElementById("adminSettings");
const adminMain = document.getElementById("adminMain");
const adminPlay = document.getElementById("adminPlay");
const adminToSettings = document.getElementById("adminToSettings");
const adminToMain = document.getElementById("adminToMain");
const resetUsers = document.getElementById("resetUsers");
const refreshUsers = document.getElementById("refreshUsers");
const refreshStatus = document.getElementById("refreshStatus");

let currentAccount = null;
let adminView = "settings";
let lastGameSignature = "";
let lastProfileSignature = "";
let lastProfileResetAt = Number(localStorage.getItem(PROFILE_RESET_KEY) || 0);
let gameUpdatedAt = Number(localStorage.getItem(GAME_UPDATED_KEY) || 0);
let stopSession = 0;
let remotePushTimer = 0;
let remotePushing = false;
let remotePushQueued = false;
let syncPeer = null;
let syncHostConn = null;
let syncGuestConns = [];
let syncIsHost = false;
let applyingPeerState = false;
let syncRestartTimer = 0;
let syncWs = null;
let syncWsRestart = 0;
let mqttClient = null;
let priceTalkToken = 0;
let menuTalkToken = 0;
let menuSpinFrame = 0;

function profileSignature(state) {
  return JSON.stringify(state);
}

function replaceProfiles(next) {
  Object.keys(profiles).forEach((id) => {
    delete profiles[id];
  });
  Object.assign(profiles, next);
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function slimProfile(profile) {
  return {
    name: profile.name || "",
    nickname: profile.nickname || "",
    photo: "",
    submitted: Boolean(profile.submitted),
    updatedAt: profile.updatedAt || 0,
    resetAt: profile.resetAt || 0,
  };
}

function isEmptyProfile(profile) {
  const item = { ...emptyUserProfile(), ...profile };
  return !item.submitted && !item.name && !item.nickname;
}

function filledProfiles(state = profiles) {
  return Object.fromEntries(
    userIds()
      .map((id) => [id, state?.[id]])
      .filter(([, profile]) => profile && !isEmptyProfile(profile)),
  );
}

function saveProfile(id) {
  const profile = profiles[id];
  if (!profile) {
    return;
  }

  if (!writeLocal(userProfileKey(id), profile)) {
    writeLocal(userProfileKey(id), slimProfile(profile));
  }
}

function persistProfilesLocal() {
  userIds().forEach(saveProfile);
  if (!writeLocal(PROFILE_KEY, profiles)) {
    writeLocal(PROFILE_KEY, Object.fromEntries(userIds().map((id) => [id, slimProfile(profiles[id])])));
  }

  lastProfileSignature = profileSignature(profiles);
}

function saveProfiles(options = {}) {
  if (currentAccount && profiles[currentAccount.id]) {
    profiles[currentAccount.id].updatedAt = Date.now();
  }

  if (!options.replaceAll) {
    replaceProfiles(mergeProfileMaps(loadProfiles(), profiles));
  }

  persistProfilesLocal();
  scheduleRemotePush(Boolean(options.immediate));
}

function reloadProfilesFromStorage() {
  replaceProfiles(mergeProfileMaps(loadProfiles(), profiles));
  persistProfilesLocal();
  lastProfileSignature = profileSignature(profiles);
}

function resetUserProfiles() {
  if (!window.confirm("사용자 정보를 초기화할까요?")) {
    return;
  }

  const resetAt = Date.now();
  lastProfileResetAt = resetAt;
  localStorage.setItem(PROFILE_RESET_KEY, String(resetAt));
  replaceProfiles(Object.fromEntries(userIds().map((id) => [id, emptyUserProfile(resetAt)])));
  persistProfilesLocal();
  gameState = emptyGame();
  gameUpdatedAt = resetAt;
  persistGameLocal();
  userPlay.dataset.fanfare = "";
  userPlay.dataset.priceTalk = "";
  adminPlay.dataset.fanfare = "";
  adminPlay.dataset.priceTalk = "";
  notifyProfilesReset();
  publishMqttReset(resetAt);
  scheduleRemotePush(true);
  refreshVisible();
}

function saveGame(options = {}) {
  gameUpdatedAt = Date.now();
  localStorage.setItem(GAME_KEY, JSON.stringify(gameState));
  localStorage.setItem(GAME_UPDATED_KEY, String(gameUpdatedAt));
  lastGameSignature = gameSignature(gameState);
  scheduleRemotePush(Boolean(options.immediate));
}

function gameSignature(state) {
  return JSON.stringify({
    game: state.game,
    pendingGame: state.pendingGame,
    phase: state.phase,
    players: state.players,
    drinks: state.drinks,
    menus: state.menus,
    assignment: state.assignment,
    opened: state.opened,
    resultPicked: state.resultPicked,
    priceShares: state.priceShares,
    personalSteps: state.personalSteps,
    roulette: state.roulette,
    spin: state.spin,
  });
}

function findAccount(id, password) {
  return ACCOUNTS.find(
    (account) =>
      account.id.toUpperCase() === id.trim().toUpperCase() &&
      account.password === password,
  );
}

function showPage(page) {
  loginPage.hidden = page !== "login";
  userPage.hidden = page !== "user";
  adminPage.hidden = page !== "admin";
  document.body.classList.toggle("is-admin", page === "admin");
}

function currentResetAt() {
  return Number(localStorage.getItem(PROFILE_RESET_KEY) || 0);
}

function sessionInvalidatedByReset(account) {
  if (!account || account.role !== "user") {
    return false;
  }

  return currentResetAt() > Number(sessionStorage.getItem(SESSION_RESET_KEY) || 0);
}

function logoutUserIfReset() {
  if (!sessionInvalidatedByReset(currentAccount)) {
    return false;
  }

  reloadProfilesFromStorage();
  logout();
  return true;
}

function notifyProfilesReset() {
  try {
    const channel = new BroadcastChannel(RESET_CHANNEL);
    channel.postMessage({ resetAt: currentResetAt() });
    channel.close();
  } catch {
    // BroadcastChannel를 지원하지 않으면 storage 이벤트로 처리합니다.
  }
}

function enterAccount(account) {
  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.id);
  sessionStorage.setItem(SESSION_RESET_KEY, String(currentResetAt()));
  publishMqttOwn();
  loginError.hidden = true;
  userLabel.textContent = account.id;
  refreshVisible();
}

function logout() {
  currentAccount = null;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_RESET_KEY);
  loginForm.reset();
  loginError.hidden = true;
  showPage("login");
  loginId.focus();
}

function restoreSession() {
  const savedId = sessionStorage.getItem(SESSION_KEY);
  const account = ACCOUNTS.find((item) => item.id === savedId);
  if (account && sessionInvalidatedByReset(account)) {
    logout();
    return;
  }

  if (account) {
    enterAccount(account);
    return;
  }

  showPage("login");
}

function escapeAttr(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return escapeAttr(value).replaceAll("'", "&#39;");
}

function currentProfile() {
  if (!currentAccount) {
    return null;
  }

  if (!profiles[currentAccount.id]) {
    profiles[currentAccount.id] = emptyUserProfile();
  }

  return profiles[currentAccount.id];
}

function completeUserSetup() {
  const profile = currentProfile();
  if (!profile) {
    return;
  }

  profile.resetAt = Number(localStorage.getItem(PROFILE_RESET_KEY) || 0);

  const nameInput = document.getElementById("nameInput");
  const nicknameInput = document.getElementById("nicknameInput");
  if (nameInput) {
    profile.name = nameInput.value.trim();
  }
  if (nicknameInput) {
    profile.nickname = nicknameInput.value.trim();
  }

  profile.submitted = true;
  profile.updatedAt = Date.now();
  saveProfiles({ immediate: true });
  publishMqttHello();
  refreshVisible();
}

function currentMenu() {
  if (!currentAccount) {
    return emptyMenu();
  }

  if (!gameState.menus) {
    gameState.menus = emptyMenus();
  }

  if (!gameState.menus[currentAccount.id]) {
    gameState.menus[currentAccount.id] = emptyMenu();
  }

  const menu = gameState.menus[currentAccount.id];
  menu.picks = normalizeMenuPicks(menu.picks);
  return menu;
}

function currentDrink() {
  if (!currentAccount) {
    return emptyDrink();
  }

  if (!gameState.drinks[currentAccount.id]) {
    gameState.drinks[currentAccount.id] = emptyDrink();
  }

  return gameState.drinks[currentAccount.id];
}

function assignedDrink() {
  const giverId = gameState.assignment[currentAccount.id];
  return giverId ? gameState.drinks[giverId] : null;
}

function showUserView() {
  const profile = currentProfile();
  if (!profile?.submitted) {
    registerForm.hidden = false;
    userMain.hidden = true;
    userPlay.hidden = true;
    renderRegister();
    return;
  }

  registerForm.hidden = true;

  if (isGameActive() && isInCurrentGame() && (gameState.game !== "drink" || personalStep() !== "done")) {
    userMain.hidden = true;
    userPlay.hidden = false;
    renderUserPlay();
    return;
  }

  userMain.hidden = false;
  userPlay.hidden = true;
}

function showAdminView(view) {
  adminView = view;
  adminSettings.hidden = view !== "settings";
  adminMain.hidden = view !== "main";
  adminToSettings.classList.toggle("is-active", view === "settings");
  adminToMain.classList.toggle("is-active", view === "main");

  if (view === "settings") {
    reloadProfilesFromStorage();
    renderAdmin();
    return;
  }

  renderAdminPlay();
}

function refreshVisible() {
  if (!currentAccount) {
    return;
  }

  if (!currentProfile()?.submitted) {
    userLabel.textContent = currentAccount.id;
    registerForm.hidden = false;
    userMain.hidden = true;
    userPlay.hidden = true;
    renderRegister();
    showPage("user");
    return;
  }

  if (currentAccount.role === "admin") {
    showAdminView(adminView);
    showPage("admin");
    return;
  }

  showUserView();
  showPage("user");
}

function renderRegister() {
  const profile = currentProfile();
  const locked = Boolean(profile.submitted);

  registerStage.innerHTML = `
    <div class="register-stage">
      <div class="profile-field">
        <label for="nameInput">이름</label>
        <input
          id="nameInput"
          type="text"
          maxlength="12"
          placeholder="이름을 입력하세요"
          value="${escapeAttr(profile.name)}"
          autocomplete="name"
          ${locked ? "readonly" : ""}
        >
      </div>
      <div class="profile-field">
        <label for="nicknameInput">별명</label>
        <input
          id="nicknameInput"
          type="text"
          maxlength="12"
          placeholder="별명을 입력하세요"
          value="${escapeAttr(profile.nickname)}"
          autocomplete="nickname"
          ${locked ? "readonly" : ""}
        >
      </div>
      ${
        locked
          ? `<p class="submit-done">제출 완료</p>`
          : `<button class="btn-primary" type="button" data-action="submit-profile">제출</button>`
      }
    </div>
  `;
}

function displayValue(value) {
  if (value.trim()) {
    return `<p class="admin-card__value">${escapeHtml(value)}</p>`;
  }

  return `<p class="admin-card__value is-empty">아직 없음</p>`;
}

function renderAdmin() {
  const users = ACCOUNTS;
  adminList.style.gridTemplateColumns = `repeat(${users.length}, minmax(0, 1fr))`;

  adminList.innerHTML = users
    .map((account) => {
      const profile = profiles[account.id] || emptyUserProfile();

      return `
        <article class="admin-card">
          <p class="admin-card__id">${escapeHtml(account.id)}</p>
          <div class="admin-card__text">
            <span class="admin-card__label">이름</span>
            ${displayValue(profile.name)}
          </div>
          <div class="admin-card__text">
            <span class="admin-card__label">별명</span>
            ${displayValue(profile.nickname)}
          </div>
        </article>
      `;
    })
    .join("");
}

function menuFormMarkup(menu) {
  const picks = new Set(normalizeMenuPicks(menu.picks));
  const options = MENU_OPTIONS.map(
    (item) => `
      <label class="menu-pick__item">
        <input class="menu-pick__check" type="checkbox" value="${escapeAttr(item)}" ${picks.has(item) ? "checked" : ""}>
        <span>${escapeHtml(item)}</span>
      </label>
    `,
  ).join("");

  return `
    <form class="menu-pick" data-form="menu">
      <div class="menu-pick__list">${options}</div>
      <p class="player-pick__error" id="menuPickError" hidden>하나 이상 선택하세요</p>
      <button class="btn-primary" type="submit">제출</button>
    </form>
  `;
}

function drinkFormMarkup(drink) {
  return `
    <form class="center-form" data-form="drink">
      <div class="profile-field">
        <label for="drinkName">음료명</label>
        <input id="drinkName" type="text" maxlength="20" placeholder="음료명을 입력하세요" value="${escapeAttr(drink.name)}" required>
      </div>
      <div class="profile-field">
        <label for="drinkPrice">가격</label>
        <input id="drinkPrice" type="text" inputmode="decimal" maxlength="20" placeholder="가격을 입력하세요" value="${escapeAttr(drink.price)}" required>
      </div>
      <button class="btn-primary" type="submit">제출</button>
    </form>
  `;
}

function waitMarkup(text) {
  return `<div class="wait-screen"><p>${escapeHtml(text)}</p></div>`;
}

function resultButtonsMarkup() {
  return `
    <div class="game-choices">
      <button class="btn-primary${gameState.resultPicked.drink ? " is-selected" : ""}" type="button" data-action="pick-drink" ${gameState.resultPicked.drink ? "disabled" : ""}>음료확인</button>
      <button class="btn-primary${gameState.resultPicked.price ? " is-selected" : ""}" type="button" data-action="pick-price" ${gameState.resultPicked.price ? "disabled" : ""}>가격확인</button>
    </div>
  `;
}

function giftMarkup(kind) {
  const opened = gameState.opened[currentAccount.id][kind];
  const drink = assignedDrink();
  const title = kind === "drink" ? "음료를 알려드리겠습니다!" : "가격을 알려드리겠습니다!";
  const result = drink
    ? kind === "drink"
      ? drink.name
      : formatPrice(drink.price)
    : "아직 배정되지 않았습니다";

  return `
    <div class="reveal-screen">
      <p class="reveal-title">${title}</p>
      ${
        opened
          ? `<p class="reveal-result">${escapeHtml(result)}</p>`
          : `<button class="gift-button" type="button" data-action="open-gift" data-kind="${kind}" aria-label="선물 열기">🎁</button>`
      }
      <button class="btn-text refresh-btn" type="button" data-action="refresh">새로고침</button>
      ${
        kind === "drink" && !gameState.resultPicked.price
          ? `<button class="btn-primary next-btn" type="button" data-action="go-price">넘어가기</button>`
          : ""
      }
    </div>
  `;
}

function playerStatusListMarkup(isDone) {
  const users = playerAccounts();

  return users
    .map((account) => {
      const profile = profiles[account.id] || emptyUserProfile();
      const name = profile.name || profile.nickname || account.id;
      const done = Boolean(isDone(account.id));
      const status = done ? "완료" : "수정 중";

      return `
        <article class="drink-status">
          <span class="drink-status__name">${escapeHtml(name)}</span>
          <span class="drink-status__sep">&gt;</span>
          <span class="drink-status__state${done ? " is-done" : " is-edit"}">${status}</span>
        </article>
      `;
    })
    .join("");
}

function userDrinksListMarkup() {
  return playerStatusListMarkup((id) => gameState.drinks[id]?.submitted);
}

function userMenusListMarkup() {
  return playerStatusListMarkup((id) => gameState.menus[id]?.submitted);
}

function allMenusSubmitted() {
  return gamePlayers().every((id) => gameState.menus[id]?.submitted);
}

function menuTallies() {
  const counts = Object.fromEntries(MENU_OPTIONS.map((key) => [key, 0]));
  gamePlayers().forEach((id) => {
    normalizeMenuPicks(gameState.menus[id]?.picks).forEach((pick) => {
      counts[pick] += 1;
    });
  });

  return MENU_OPTIONS.map((key) => ({
    key,
    label: MENU_LABELS[key] || key,
    count: counts[key],
  }));
}

function menuTallyLine(item) {
  return `${escapeHtml(item.label)} <span class="menu-tally__count">${item.count}표</span>`;
}

function menuRouletteMarkup(slices, visible = false) {
  const items = sanitizeRoulette(slices);
  if (!items.length) {
    return "";
  }

  const size = 320;
  const center = size / 2;
  const radius = 118;
  const start0 = -Math.PI / 2;
  const sliceAngle = (Math.PI * 2) / items.length;
  const fontSize = items.length <= 4 ? 22 : items.length <= 8 ? 16 : 12;
  const labelOf = (key) => MENU_LABELS[key] || key;

  const pegs = items
    .map((_, index) => {
      const angle = start0 + index * sliceAngle;
      const x = center + 140 * Math.cos(angle);
      const y = center + 140 * Math.sin(angle);
      return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="5" fill="#f8e7b0" stroke="#8a6a22" stroke-width="1.5"></circle>`;
    })
    .join("");

  let slicesMarkup = "";
  if (items.length === 1) {
    const key = items[0];
    slicesMarkup = `
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${MENU_COLORS[key]}"></circle>
      <text x="${center}" y="${center - 40}" fill="#fff" font-size="28" font-weight="800" text-anchor="middle" dominant-baseline="middle">${escapeHtml(labelOf(key))}</text>
    `;
  } else {
    slicesMarkup = items
      .map((key, index) => {
        const from = start0 + index * sliceAngle;
        const to = start0 + (index + 1) * sliceAngle;
        const large = sliceAngle > Math.PI ? 1 : 0;
        const x0 = center + radius * Math.cos(from);
        const y0 = center + radius * Math.sin(from);
        const x1 = center + radius * Math.cos(to);
        const y1 = center + radius * Math.sin(to);
        const mid = (from + to) / 2;
        const lx = center + radius * 0.62 * Math.cos(mid);
        const ly = center + radius * 0.62 * Math.sin(mid);
        return `
          <path d="M ${center} ${center} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${MENU_COLORS[key]}" stroke="#fff7e6" stroke-width="2"></path>
          <text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" fill="#fff" font-size="${fontSize}" font-weight="800" text-anchor="middle" dominant-baseline="middle">${escapeHtml(labelOf(key))}</text>
        `;
      })
      .join("");
  }

  return `
    <div class="menu-roulette${visible ? " is-in" : ""}">
      <div class="menu-roulette__pointer" aria-hidden="true"><span class="menu-roulette__bob"></span></div>
      <div class="menu-roulette__spin">
      <svg class="menu-roulette__wheel" viewBox="0 0 ${size} ${size}" role="img" aria-label="메뉴 돌림판">
        <circle cx="${center}" cy="${center}" r="150" fill="#7c5a1e"></circle>
        <circle cx="${center}" cy="${center}" r="144" fill="#e8c36a"></circle>
        ${slicesMarkup}
        ${pegs}
        <circle cx="${center}" cy="${center}" r="22" fill="#fffdf8" stroke="#c9a227" stroke-width="4"></circle>
      </svg>
      </div>
    </div>
  `;
}

function menuSpinButtonMarkup() {
  return `<button class="btn-primary menu-reveal__spin-btn" type="button" data-action="spin-menu-result">결과 확인</button>`;
}

function menuConfettiMarkup() {
  const colors = ["#e11d48", "#f59e0b", "#ec4899", "#2563eb", "#16a34a", "#f8e7b0", "#d97706", "#fffdf8"];
  const bits = Array.from({ length: 56 }, (_, index) => {
    const left = ((index * 17) % 100) + (index % 7) - 3;
    const delay = (index % 8) * 0.05;
    const duration = 1.7 + (index % 5) * 0.18;
    const drift = (index % 2 === 0 ? -1 : 1) * (18 + (index % 6) * 8);
    const width = 6 + (index % 5);
    const height = 8 + (index % 6);
    return `<span class="menu-confetti__bit" style="left:${left}%;width:${width}px;height:${height}px;background:${colors[index % colors.length]};animation-delay:${delay}s;animation-duration:${duration}s;--drift:${drift}px"></span>`;
  }).join("");

  return `<div class="menu-confetti" aria-hidden="true">${bits}</div>`;
}

function menuWinMarkup(winner) {
  const label = MENU_LABELS[winner] || winner;
  return `
    <div class="menu-win">
      ${menuConfettiMarkup()}
      <div class="menu-win__card">
        <p class="menu-win__title">축하합니다!</p>
        <p class="menu-win__prize">${escapeHtml(label)}당첨!</p>
      </div>
    </div>
  `;
}

function menuRevealFinalMarkup(forAdmin = false) {
  return `
    <div class="menu-reveal">
      <div class="menu-tally">
        ${menuTallies()
          .map((item) => `<p class="menu-tally__item is-in">${menuTallyLine(item)}</p>`)
          .join("")}
      </div>
      ${menuRouletteMarkup(currentRoulette(), true)}
      ${forAdmin ? menuSpinButtonMarkup() : ""}
    </div>
  `;
}

function menuSpinStageMarkup() {
  return `
    <div class="menu-reveal menu-reveal--spin">
      ${menuRouletteMarkup(currentRoulette(), true)}
    </div>
  `;
}

function currentSpin() {
  return sanitizeSpin(gameState.spin, currentRoulette());
}

function spinKey(spin) {
  return `${spin?.startedAt || 0}-${spin?.targetIndex ?? -1}`;
}

function spinRotation(spin, slices) {
  const count = slices.length || 1;
  return spin.turns * 360 - ((spin.targetIndex + 0.5) * 360) / count;
}

function easeOutQuint(value) {
  return 1 - (1 - value) ** 5;
}

function cancelMenuSpin() {
  if (menuSpinFrame) {
    cancelAnimationFrame(menuSpinFrame);
    menuSpinFrame = 0;
  }
}

function clearMenuSpin(container) {
  if (!container?.dataset.menuSpin) {
    return;
  }

  cancelMenuSpin();
  delete container.dataset.menuSpin;
}

function showMenuWin(container, winner) {
  if (container.querySelector(".menu-win")) {
    return;
  }

  container.insertAdjacentHTML("beforeend", menuWinMarkup(winner));
  playFanfare();
}

function startMenuSpinAnimation(container) {
  const spin = currentSpin();
  const slices = currentRoulette();
  const wheel = container.querySelector(".menu-roulette__spin");
  if (!spin.startedAt || !wheel || !slices.length) {
    return;
  }

  const total = spinRotation(spin, slices);
  const key = spinKey(spin);
  container.dataset.menuSpin = key;

  const tick = () => {
    const latest = currentSpin();
    if (spinKey(latest) !== key) {
      return;
    }

    const progress = Math.min(1, (Date.now() - latest.startedAt) / latest.duration);
    wheel.style.transform = `rotate(${total * easeOutQuint(progress)}deg)`;
    if (progress < 1) {
      menuSpinFrame = requestAnimationFrame(tick);
      return;
    }

    showMenuWin(container, latest.winner || slices[latest.targetIndex]);
  };

  cancelMenuSpin();
  tick();
}

function renderMenuSpin(container) {
  const spin = currentSpin();
  const key = spinKey(spin);
  if (container.dataset.menuSpin === key && container.querySelector(".menu-roulette__spin")) {
    return;
  }

  cancelMenuSpin();
  container.innerHTML = menuSpinStageMarkup();
  startMenuSpinAnimation(container);
}

function beginMenuSpin() {
  const slices = ensureRoulette();
  if (!slices.length) {
    return;
  }

  const targetIndex = Math.floor(Math.random() * slices.length);
  gameState.spin = {
    targetIndex,
    winner: slices[targetIndex],
    turns: 6 + Math.floor(Math.random() * 3),
    duration: 6800,
    startedAt: Date.now(),
  };
  gameState.phase = "menu-spin";
  saveGame({ immediate: true });
  refreshVisible();
}

function playThud() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(110, now);
  oscillator.frequency.exponentialRampToValueAtTime(42, now + 0.2);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.32, now + 0.014);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.32);
}

function stopMenuReveal() {
  menuTalkToken += 1;
}

function clearMenuReveal(container) {
  if (!container?.dataset.menuReveal) {
    return;
  }

  stopMenuReveal();
  delete container.dataset.menuReveal;
}

function isMenuRevealBusy() {
  return userPlay?.dataset.menuReveal === "running" || adminPlay?.dataset.menuReveal === "running";
}

async function runMenuReveal(container, token) {
  const intro = container.querySelector(".menu-reveal__intro");
  if (!intro) {
    return;
  }

  const typed = await typeChunks(
    intro,
    [{ text: "우리가 오늘 무엇을 먹을지 골라보겠습니다", cls: "" }],
    token,
    () => menuTalkToken,
  );

  if (!typed) {
    return;
  }

  await delay(1500);
  if (token !== menuTalkToken) {
    return;
  }

  intro.classList.add("is-out");
  await delay(460);
  if (token !== menuTalkToken) {
    return;
  }

  intro.remove();
  const list = document.createElement("div");
  list.className = "menu-tally";
  container.querySelector(".menu-reveal")?.append(list);

  for (const item of menuTallies()) {
    if (token !== menuTalkToken) {
      return;
    }

    const line = document.createElement("p");
    line.className = "menu-tally__item";
    line.innerHTML = menuTallyLine(item);
    list.append(line);
    void line.offsetWidth;
    line.classList.add("is-in");
    playThud();
    await delay(820);
  }

  if (token !== menuTalkToken) {
    return;
  }

  await delay(360);
  if (token !== menuTalkToken) {
    return;
  }

  const stage = container.querySelector(".menu-reveal");
  if (stage) {
    stage.insertAdjacentHTML("beforeend", menuRouletteMarkup(currentRoulette()));
    const wheel = stage.querySelector(".menu-roulette");
    if (wheel) {
      void wheel.offsetWidth;
      wheel.classList.add("is-in");
    }
  }

  if (token === menuTalkToken) {
    container.dataset.menuReveal = "done";
    if (container === adminPlay && stage && !stage.querySelector("[data-action='spin-menu-result']")) {
      stage.insertAdjacentHTML("beforeend", menuSpinButtonMarkup());
    }
  }
}

function renderMenuReveal(container) {
  if (container.dataset.menuReveal === "running") {
    return;
  }

  if (container.dataset.menuReveal === "done") {
    container.innerHTML = menuRevealFinalMarkup(container === adminPlay);
    return;
  }

  container.dataset.menuReveal = "running";
  const token = ++menuTalkToken;
  container.innerHTML = `
    <div class="menu-reveal">
      <p class="menu-reveal__intro"></p>
    </div>
  `;
  runMenuReveal(container, token);
}

function adminReviewMarkup(listMarkup, canGoResult) {
  return `
    <div class="drink-status-list">${listMarkup}</div>
    <button class="btn-primary" type="button" data-action="go-result"${canGoResult ? "" : " disabled"}>결과 보러가기</button>
  `;
}

function stopPriceTalk() {
  priceTalkToken += 1;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function totalDrinkPrice() {
  return gamePlayers().reduce(
    (sum, id) => sum + parsePrice(gameState.drinks[id]?.price),
    0,
  );
}

async function typeChunks(line, chunks, token, getToken = () => priceTalkToken) {
  for (const chunk of chunks) {
    const span = document.createElement("span");
    if (chunk.cls) {
      span.className = chunk.cls;
    }

    line.append(span);

    for (const char of chunk.text) {
      if (token !== getToken()) {
        return false;
      }

      span.textContent += char;
      await delay(70);
    }
  }

  return token === getToken();
}

function currentPriceShare() {
  return Math.min(99999, Number(gameState.priceShares[currentAccount.id] || 0));
}

function personalStep() {
  return gameState.personalSteps[currentAccount.id] || "talk";
}

function setPersonalStep(step) {
  gameState.personalSteps[currentAccount.id] = step;
  saveGame();
}

function accountLabel() {
  return ACCOUNT_NUMBER.trim() || "계좌번호";
}

function assignedDrinkName() {
  return assignedDrink()?.name || "아직 없음";
}

function playFanfare() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const now = context.currentTime;

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, now + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.38);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + index * 0.12 + 0.4);
  });
}

function celebrateMarkup() {
  const amount = `${currentPriceShare().toLocaleString("ko-KR")}원`;
  return `
    <div class="celebrate-screen">
      <p class="celebrate-title">축하합니다!</p>
      <p class="celebrate-lead"><span class="price-accent">${escapeHtml(amount)}</span>이 당첨되셨습니다</p>
      <button class="btn-primary next-btn" type="button" data-action="go-payout">넘어가기</button>
    </div>
  `;
}

function payoutMarkup() {
  return `
    <div class="payout-screen">
      <button class="account-copy" type="button" data-action="copy-account">${escapeHtml(accountLabel())}</button>
      <p class="payout-copy" id="copyNotice" hidden>복사되었습니다</p>
      <p class="payout-label">음료</p>
      <p class="payout-value">${escapeHtml(assignedDrinkName())}</p>
      <p class="payout-label">지불할 가격</p>
      <p class="payout-value price-accent">${escapeHtml(`${currentPriceShare().toLocaleString("ko-KR")}원`)}</p>
      <button class="btn-primary next-btn" type="button" data-action="finish-payout">넘어가기</button>
    </div>
  `;
}

function resultTableMarkup() {
  const rows = playerAccounts().map((account) => {
    const profile = profiles[account.id] || { name: "" };
    const giverId = gameState.assignment[account.id];
    const drinkName = giverId ? gameState.drinks[giverId]?.name || "" : "";
    const pay = Number(gameState.priceShares[account.id] || 0);

    return `
      <tr>
        <td>${escapeHtml(profile.name || account.id)}</td>
        <td>${escapeHtml(drinkName || "-")}</td>
        <td>${escapeHtml(`${pay.toLocaleString("ko-KR")}원`)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="result-screen">
      <div class="result-table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>음료</th>
              <th>지불 금액</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <button class="btn-primary" type="button" data-action="go-main">메인으로</button>
    </div>
  `;
}

async function revealPriceDigits(container, token) {
  const digits = String(currentPriceShare()).padStart(5, "0").split("");
  const board = document.createElement("div");
  board.className = "digit-board";
  board.innerHTML = digits.map(() => `<span class="digit-slot"></span>`).join("");
  container.append(board);

  const slots = [...board.querySelectorAll(".digit-slot")];

  for (let index = slots.length - 1; index >= 0; index -= 1) {
    if (token !== priceTalkToken) {
      return;
    }

    slots[index].textContent = digits[index];
    slots[index].classList.add("is-pop");
    await delay(420);
    if (token !== priceTalkToken) {
      return;
    }

    slots[index].classList.remove("is-pop");
    slots[index].classList.add("is-filled");
    await delay(140);
  }
}

async function runPriceTalk(container, line, token) {
  const priceText = `${totalDrinkPrice().toLocaleString("ko-KR")}원`;
  const firstDone = await typeChunks(
    line,
    [
      { text: "우리가 고른 음료들의 총 가격은 ", cls: "" },
      { text: priceText, cls: "price-accent" },
      { text: "입니다.", cls: "" },
    ],
    token,
  );

  if (!firstDone) {
    return;
  }

  await delay(1400);
  if (token !== priceTalkToken) {
    return;
  }

  line.replaceChildren();

  const secondDone = await typeChunks(
    line,
    [{ text: "이제 비용을 보여드리겠습니다.", cls: "" }],
    token,
  );

  if (!secondDone) {
    return;
  }

  await delay(700);
  if (token !== priceTalkToken) {
    return;
  }

  await revealPriceDigits(container, token);
  if (token !== priceTalkToken) {
    return;
  }

  setPersonalStep("celebrate");
  refreshVisible();
}

function renderCelebrate(container) {
  container.innerHTML = celebrateMarkup();
  if (container.dataset.fanfare === "1") {
    return;
  }

  container.dataset.fanfare = "1";
  playFanfare();
}

function renderPriceTalk(container) {
  if (container.dataset.priceTalk === "running") {
    return;
  }

  container.dataset.priceTalk = "running";
  const token = ++priceTalkToken;
  container.innerHTML = `
    <div class="ai-talk">
      <p class="ai-talk__line"></p>
    </div>
  `;

  runPriceTalk(container, container.querySelector(".ai-talk__line"), token);
}

function clearPriceTalk(container) {
  if (!container.dataset.priceTalk) {
    return;
  }

  stopPriceTalk();
  delete container.dataset.priceTalk;
}

function otherGamePlayMarkup() {
  if (gameState.game === "game2") {
    return `<div class="wait-screen"><p>메뉴고르기</p></div>`;
  }

  return `<div class="wait-screen"><p>게임 진행</p></div>`;
}

function stopGameUrl() {
  const profile = currentProfile() || emptyUserProfile();
  const query = new URLSearchParams({
    embedded: "1",
    role: currentAccount?.role || "user",
    id: currentAccount?.id || "",
    name: profile.name || "",
    nick: profile.nickname || "",
    v: "9",
  });
  if (stopSession) {
    query.set("fresh", String(stopSession));
  }
  return `stop/index.html?${query.toString()}`;
}

function stopHostPayload() {
  return {
    type: "stop-host",
    role: currentAccount?.role || "user",
    id: currentAccount?.id || "",
    name: currentProfile()?.name || "",
    nickname: currentProfile()?.nickname || "",
    players: gamePlayers().map((id) => {
      const profile = profiles[id] || emptyUserProfile();
      return { id, name: profile.name || id, nickname: profile.nickname || "" };
    }),
  };
}

function postStopHost(frame) {
  if (!frame?.contentWindow) {
    return;
  }

  frame.contentWindow.postMessage(stopHostPayload(), "*");
}

function renderNestedStop(container) {
  const src = stopGameUrl();
  const existing = container.querySelector("iframe.nested-game");
  if (existing && existing.dataset.game === "stop" && existing.dataset.session === String(stopSession)) {
    postStopHost(existing);
    return;
  }

  container.innerHTML = `
    <iframe
      class="nested-game"
      data-game="stop"
      data-session="${escapeAttr(String(stopSession))}"
      title="멈춰!"
      src="${escapeAttr(src)}"
    ></iframe>
  `;
  const frame = container.querySelector("iframe.nested-game");
  frame.addEventListener("load", () => {
    postStopHost(frame);
  });
}

function renderMenuPlay(container) {
  const menu = currentMenu();
  if (isInCurrentGame() && !menu.submitted) {
    container.innerHTML = menuFormMarkup(menu);
    return;
  }

  container.innerHTML = waitMarkup("잠시만 기다려주세요.");
}

function renderUserPlay() {
  if (gameState.game === "stop") {
    renderNestedStop(userPlay);
    return;
  }

  if (gameState.game === "game2") {
    if (gameState.phase !== "menu-reveal") {
      clearMenuReveal(userPlay);
    }

    if (gameState.phase !== "menu-spin") {
      clearMenuSpin(userPlay);
    }

    if (gameState.phase === "menu-reveal") {
      renderMenuReveal(userPlay);
      return;
    }

    if (gameState.phase === "menu-spin") {
      renderMenuSpin(userPlay);
      return;
    }

    renderMenuPlay(userPlay);
    return;
  }

  if (gameState.game !== "drink") {
    userPlay.innerHTML = otherGamePlayMarkup();
    return;
  }

  if (gameState.phase !== "price-reveal") {
    clearPriceTalk(userPlay);
  }

  const drink = currentDrink();

  if (gameState.phase === "entry" || gameState.phase === "review" || gameState.phase === "choose") {
    userPlay.innerHTML = drink.submitted
      ? waitMarkup("잠시만 기다려주세요.")
      : drinkFormMarkup(drink);
    return;
  }

  if (gameState.phase === "drink-reveal") {
    userPlay.innerHTML = giftMarkup("drink");
    return;
  }

  if (gameState.phase === "price-reveal") {
    if (personalStep() === "celebrate") {
      renderCelebrate(userPlay);
      return;
    }

    if (personalStep() === "payout") {
      userPlay.innerHTML = payoutMarkup();
      return;
    }

    renderPriceTalk(userPlay);
    return;
  }

  userPlay.innerHTML = waitMarkup("잠시만 기다려주세요.");
}

function playerPickMarkup() {
  const selected = new Set(gamePlayers());
  const cards = ACCOUNTS.map((account) => {
    const profile = profiles[account.id] || emptyUserProfile();
    const checked = selected.has(account.id) ? " checked" : "";
    return `
      <label class="player-pick__item">
        <input class="player-pick__check" type="checkbox" data-player-id="${escapeAttr(account.id)}"${checked}>
        <span class="player-pick__meta">
          <span class="player-pick__name">${escapeHtml(profile.name || "아직 없음")}</span>
          <span class="player-pick__nick">${escapeHtml(profile.nickname || "아직 없음")}</span>
        </span>
      </label>
    `;
  }).join("");

  return `
    <div class="player-pick">
      <p class="player-pick__title">사용자 선택</p>
      <div class="player-pick__list">${cards}</div>
      <p class="player-pick__error" id="playerPickError" hidden>한 명 이상 선택하세요</p>
      <button class="btn-primary" type="button" data-action="confirm-players">완료</button>
    </div>
  `;
}

function renderAdminPlay() {
  if (gameState.phase !== "price-reveal") {
    clearPriceTalk(adminPlay);
  }

  if (gameState.phase === "pick") {
    adminPlay.innerHTML = playerPickMarkup();
    return;
  }

  if (!gameState.game) {
    adminPlay.innerHTML = `
      <div class="game-choices">
        ${GAME_CHOICES.map(
          (game) => `
            <button class="btn-primary" type="button" data-game="${escapeAttr(game.id)}">
              ${escapeHtml(game.label)}
            </button>
          `,
        ).join("")}
      </div>
    `;
    return;
  }

  if (gameState.game === "stop") {
    renderNestedStop(adminPlay);
    return;
  }

  if (gameState.game === "game2") {
    if (gameState.phase !== "menu-reveal") {
      clearMenuReveal(adminPlay);
    }

    if (gameState.phase !== "menu-spin") {
      clearMenuSpin(adminPlay);
    }

    const menu = currentMenu();
    const adminPlaying = isInCurrentGame();

    if (gameState.phase === "entry" && adminPlaying && !menu.submitted) {
      adminPlay.innerHTML = menuFormMarkup(menu);
      return;
    }

    if (gameState.phase === "entry" || gameState.phase === "review") {
      adminPlay.innerHTML = adminReviewMarkup(userMenusListMarkup(), allMenusSubmitted());
      return;
    }

    if (gameState.phase === "choose") {
      adminPlay.innerHTML = `
        <div class="game-choices">
          <button class="btn-primary" type="button" data-action="confirm-menu-result">결과 확인</button>
        </div>
      `;
      return;
    }

    if (gameState.phase === "menu-reveal") {
      renderMenuReveal(adminPlay);
      return;
    }

    if (gameState.phase === "menu-spin") {
      renderMenuSpin(adminPlay);
      return;
    }

    adminPlay.innerHTML = waitMarkup("잠시만 기다려주세요.");
    return;
  }

  if (gameState.game !== "drink") {
    adminPlay.innerHTML = otherGamePlayMarkup();
    return;
  }

  const drink = currentDrink();
  const adminPlaying = isInCurrentGame();

  if (gameState.phase === "entry" && adminPlaying && !drink.submitted) {
    adminPlay.innerHTML = drinkFormMarkup(drink);
    return;
  }

  if (gameState.phase === "entry" || gameState.phase === "review") {
    adminPlay.innerHTML = adminReviewMarkup(userDrinksListMarkup(), true);
    return;
  }

  if (gameState.phase === "choose") {
    adminPlay.innerHTML = resultButtonsMarkup();
    return;
  }

  if (gameState.phase === "drink-reveal") {
    adminPlay.innerHTML = giftMarkup("drink");
    return;
  }

  if (gameState.phase === "price-reveal") {
    if (personalStep() === "done") {
      adminPlay.innerHTML = resultTableMarkup();
      return;
    }

    if (personalStep() === "celebrate") {
      renderCelebrate(adminPlay);
      return;
    }

    if (personalStep() === "payout") {
      adminPlay.innerHTML = payoutMarkup();
      return;
    }

    renderPriceTalk(adminPlay);
    return;
  }

  adminPlay.innerHTML = resultButtonsMarkup();
}

function beginPlayerPick(gameId) {
  const pending = GAME_CHOICES.some((game) => game.id === gameId) ? gameId : "";
  if (!pending) {
    return;
  }

  gameState = emptyGame();
  gameState.pendingGame = pending;
  gameState.phase = "pick";
  gameState.players = participantIds().filter((id) => profiles[id]?.submitted);
  userPlay.dataset.fanfare = "";
  userPlay.dataset.priceTalk = "";
  adminPlay.dataset.fanfare = "";
  adminPlay.dataset.priceTalk = "";
  clearMenuReveal(userPlay);
  clearMenuReveal(adminPlay);
  clearMenuSpin(userPlay);
  clearMenuSpin(adminPlay);
  saveGame();
  refreshVisible();
}

function goToMainMenu() {
  gameState = emptyGame();
  userPlay.dataset.fanfare = "";
  userPlay.dataset.priceTalk = "";
  adminPlay.dataset.fanfare = "";
  adminPlay.dataset.priceTalk = "";
  clearMenuReveal(userPlay);
  clearMenuReveal(adminPlay);
  clearMenuSpin(userPlay);
  clearMenuSpin(adminPlay);
  adminView = "main";
  saveGame({ immediate: true });
  refreshVisible();
}

function confirmPlayerPick() {
  const checked = [...document.querySelectorAll("[data-player-id]:checked")].map((input) => input.dataset.playerId);
  const players = checked.filter((id) => participantIds().includes(id));
  const error = document.getElementById("playerPickError");
  if (!players.length) {
    if (error) {
      error.hidden = false;
    }
    return;
  }

  if (error) {
    error.hidden = true;
  }

  const gameId = gameState.pendingGame;
  gameState = emptyGame();
  gameState.game = gameId;
  gameState.pendingGame = "";
  gameState.players = players;
  gameState.phase = gameId === "drink" || gameId === "game2" ? "entry" : "play";
  if (gameId === "stop") {
    stopSession = Date.now();
  }
  saveGame({ immediate: true });
  refreshVisible();
}

function selectedMenuPicks(form) {
  return [...form.querySelectorAll(".menu-pick__check:checked")].map((input) => input.value);
}

function submitMenu() {
  const menu = currentMenu();
  if (!menu || menu.submitted) {
    return;
  }

  const form = document.querySelector("form[data-form='menu']");
  const picks = selectedMenuPicks(form || document);
  const error = document.getElementById("menuPickError");
  if (!picks.length) {
    if (error) {
      error.hidden = false;
    }
    return;
  }

  if (error) {
    error.hidden = true;
  }

  menu.picks = normalizeMenuPicks(picks);
  menu.submitted = true;
  menu.updatedAt = Date.now();
  if (currentAccount.role === "admin") {
    gameState.phase = "review";
  }
  saveGame({ immediate: true });
  refreshVisible();
}

function submitDrink() {
  const drink = currentDrink();
  if (drink.submitted) {
    return;
  }

  const name = document.getElementById("drinkName")?.value.trim() || "";
  const amount = parsePrice(document.getElementById("drinkPrice")?.value);
  if (!name || !amount) {
    return;
  }

  drink.name = name;
  drink.price = String(amount);
  drink.submitted = true;
  drink.updatedAt = Date.now();
  publishMqttDrink(currentAccount.id);

  if (currentAccount.role === "admin") {
    gameState.phase = "review";
  }

  saveGame({ immediate: true });
  refreshVisible();
}

function assignDrinks() {
  if (Object.keys(gameState.assignment).length) {
    return;
  }

  const ids = gamePlayers().filter((id) => gameState.drinks[id]?.submitted);

  if (ids.length < 2) {
    gameState.assignment = Object.fromEntries(ids.map((id) => [id, id]));
    return;
  }

  const givers = [...ids];
  for (let attempt = 0; attempt < 40; attempt += 1) {
    for (let i = givers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [givers[i], givers[j]] = [givers[j], givers[i]];
    }

    if (givers.every((giver, index) => giver !== ids[index])) {
      gameState.assignment = Object.fromEntries(ids.map((id, index) => [id, givers[index]]));
      return;
    }
  }

  gameState.assignment = Object.fromEntries(
    ids.map((id, index) => [id, ids[(index + 1) % ids.length]]),
  );
}

function parsePrice(value) {
  const digits = String(value ?? "")
    .replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 0xff10))
    .replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatPrice(value) {
  const amount = parsePrice(value);
  return amount ? `${amount.toLocaleString("ko-KR")}원` : "";
}

function randomSplitByTen(total, count) {
  const safeTotal = Math.max(0, Number(total) || 0);
  const units = Math.floor(safeTotal / 10);
  const leftover = safeTotal % 10;
  const parts = Array.from({ length: count }, () => 0);

  if (count < 1) {
    return parts;
  }

  if (units > 0) {
    const weights = Array.from({ length: count }, () => Math.random() + 0.2);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    let used = 0;

    for (let index = 0; index < count - 1; index += 1) {
      parts[index] = Math.floor((units * weights[index]) / weightSum);
      used += parts[index];
    }

    parts[count - 1] = units - used;

    if (parts.every((part) => part === parts[0]) && count > 1 && units >= 2) {
      parts[0] += 1;
      parts[1] -= 1;
    }
  }

  const amounts = parts.map((part) => part * 10);
  if (leftover) {
    amounts[Math.floor(Math.random() * count)] += leftover;
  }

  return amounts;
}

function assignPriceShares() {
  if (Object.keys(gameState.priceShares).length) {
    return;
  }

  const ids = gamePlayers();
  const total = ids.reduce((sum, id) => sum + parsePrice(gameState.drinks[id]?.price), 0);
  const amounts = randomSplitByTen(total, ids.length);

  for (let index = amounts.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [amounts[index], amounts[swap]] = [amounts[swap], amounts[index]];
  }

  gameState.priceShares = Object.fromEntries(ids.map((id, index) => [id, amounts[index]]));
}

function pickResult(kind) {
  assignDrinks();
  if (kind === "drink") {
    gameState.resultPicked.drink = true;
    gameState.phase = "drink-reveal";
  } else {
    assignPriceShares();
    gameState.resultPicked.price = true;
    gameState.phase = "price-reveal";
  }

  saveGame();
  refreshVisible();
}

function goToPriceCheck() {
  assignDrinks();
  assignPriceShares();
  gameState.resultPicked.price = true;
  gameState.phase = "price-reveal";
  saveGame();
  refreshVisible();
}

function openGift(kind) {
  gameState.opened[currentAccount.id][kind] = true;
  saveGame();
  refreshVisible();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const account = findAccount(loginId.value, loginPassword.value);
  if (!account) {
    loginError.hidden = false;
    return;
  }

  enterAccount(account);
});

document.getElementById("userLogout").addEventListener("click", logout);
document.getElementById("adminLogout").addEventListener("click", logout);
adminToSettings.addEventListener("click", () => showAdminView("settings"));
adminToMain.addEventListener("click", () => goToMainMenu());
resetUsers.addEventListener("click", resetUserProfiles);
function showRefreshStatus() {
  if (!refreshStatus) {
    return;
  }

  const submittedCount = userIds().filter((id) => profiles[id]?.submitted).length;
  refreshStatus.hidden = false;
  refreshStatus.textContent = mqttReady()
    ? `불러왔습니다. 제출 완료 ${submittedCount}명 / 전체 ${userIds().length}명`
    : `연결이 불안정합니다. 제출 완료 ${submittedCount}명 / 전체 ${userIds().length}명. 잠시 후 다시 눌러주세요.`;
}

refreshUsers.addEventListener("click", async () => {
  if (refreshStatus) {
    refreshStatus.hidden = false;
    refreshStatus.textContent = mqttReady() ? "불러오는 중..." : "연결 중... 다시 요청합니다.";
  }

  sendWs({ type: "request" });
  if (syncHostConn?.open) {
    sendPeer(syncHostConn, { type: "request" });
  }
  if (syncIsHost) {
    broadcastPeerState();
  }
  publishMqttHello();
  publishMqttOwn();
  try {
    await pullRemoteState({ silent: true });
  } catch {
    // gist가 없어도 MQTT 응답은 기다립니다.
  }
  await new Promise((resolve) => setTimeout(resolve, mqttReady() ? 1600 : 2400));
  publishMqttHello();
  await new Promise((resolve) => setTimeout(resolve, 800));
  reloadProfilesFromStorage();
  gameState = mergeGameState(gameState, loadGame());
  lastGameSignature = gameSignature(gameState);
  lastProfileSignature = profileSignature(profiles);
  persistProfilesLocal();
  persistGameLocal();
  if (adminView === "settings") {
    renderAdmin();
  } else {
    refreshVisible();
  }
  showRefreshStatus();
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  completeUserSetup();
});

registerForm.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const profile = currentProfile();
  if (!profile || profile.submitted) {
    return;
  }

  if (input.id === "nameInput") {
    profile.name = input.value.trimStart();
    saveProfiles();
    return;
  }

  if (input.id === "nicknameInput") {
    profile.nickname = input.value.trimStart();
    saveProfiles();
  }
});

registerForm.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.action === "submit-profile") {
    event.preventDefault();
    completeUserSetup();
  }
});

function handlePlayClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.game) {
    beginPlayerPick(button.dataset.game);
    return;
  }

  if (button.dataset.action === "confirm-players") {
    confirmPlayerPick();
    return;
  }

  if (button.dataset.action === "go-result") {
    if (gameState.game === "game2" && !allMenusSubmitted()) {
      return;
    }

    gameState.phase = "choose";
    saveGame({ immediate: true });
    refreshVisible();
    return;
  }

  if (button.dataset.action === "confirm-menu-result") {
    ensureRoulette();
    gameState.phase = "menu-reveal";
    saveGame({ immediate: true });
    refreshVisible();
    return;
  }

  if (button.dataset.action === "spin-menu-result") {
    beginMenuSpin();
    return;
  }

  if (button.dataset.action === "pick-drink") {
    pickResult("drink");
    return;
  }

  if (button.dataset.action === "pick-price" || button.dataset.action === "go-price") {
    goToPriceCheck();
    return;
  }

  if (button.dataset.action === "open-gift") {
    if (button.classList.contains("is-opening")) {
      return;
    }

    button.classList.add("is-opening");
    button.addEventListener(
      "animationend",
      () => {
        openGift(button.dataset.kind);
      },
      { once: true },
    );
    return;
  }

  if (button.dataset.action === "refresh") {
    reloadProfilesFromStorage();
    gameState = loadGame();
    lastGameSignature = gameSignature(gameState);
    refreshVisible();
    return;
  }

  if (button.dataset.action === "go-payout") {
    setPersonalStep("payout");
    refreshVisible();
    return;
  }

  if (button.dataset.action === "go-main") {
    goToMainMenu();
    return;
  }

  if (button.dataset.action === "finish-payout") {
    setPersonalStep("done");
    if (currentAccount.role === "user") {
      userPlay.dataset.fanfare = "";
      userPlay.dataset.priceTalk = "";
    } else {
      adminPlay.dataset.fanfare = "";
      adminPlay.dataset.priceTalk = "";
    }

    refreshVisible();
    return;
  }

  if (button.dataset.action === "copy-account") {
    const text = ACCOUNT_NUMBER.trim() || accountLabel();
    const notice = document.getElementById("copyNotice");
    const showCopied = () => {
      if (notice) {
        notice.hidden = false;
      }
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(showCopied);
      return;
    }

    showCopied();
  }
}

function handlePlaySubmit(event) {
  const menuForm = event.target.closest("form[data-form='menu']");
  if (menuForm) {
    event.preventDefault();
    submitMenu();
    return;
  }

  const form = event.target.closest("form[data-form='drink']");
  if (!form) {
    return;
  }

  event.preventDefault();
  submitDrink();
}

userPlay.addEventListener("click", handlePlayClick);
adminPlay.addEventListener("click", handlePlayClick);
userPlay.addEventListener("submit", handlePlaySubmit);
adminPlay.addEventListener("submit", handlePlaySubmit);

function saveDrinkDraft(event) {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || (input.id !== "drinkName" && input.id !== "drinkPrice")) {
    return;
  }

  const drink = currentDrink();
  if (!drink || drink.submitted) {
    return;
  }

  if (input.id === "drinkName") {
    drink.name = input.value;
  } else {
    drink.price = input.value;
  }
  drink.updatedAt = Date.now();
  persistGameLocal();
  if (currentAccount) {
    publishMqttDrink(currentAccount.id);
  }
}

function saveMenuDraft(event) {
  const box = event.target.closest(".menu-pick__check");
  if (!(box instanceof HTMLInputElement)) {
    return;
  }

  const menu = currentMenu();
  if (!menu || menu.submitted) {
    return;
  }

  const form = box.closest("form[data-form='menu']");
  menu.picks = normalizeMenuPicks(selectedMenuPicks(form || document));
  menu.updatedAt = Date.now();
  persistGameLocal();
}

function isEditingMenu() {
  return Boolean(document.activeElement?.classList?.contains("menu-pick__check"));
}

userPlay.addEventListener("input", saveDrinkDraft);
adminPlay.addEventListener("input", saveDrinkDraft);
userPlay.addEventListener("change", saveMenuDraft);
adminPlay.addEventListener("change", saveMenuDraft);

function syncEnabled() {
  return Boolean(
    (typeof SYNC_GIST_ID === "string" && SYNC_GIST_ID) ||
      (typeof SYNC_URL === "string" && SYNC_URL),
  );
}

function emptyRemoteState() {
  return {
    resetAt: 0,
    profiles: {},
    gameUpdatedAt: 0,
  };
}

function normalizeRemoteState(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  const hasGame = parsed.game && typeof parsed.game === "object";
  const game = hasGame ? parsed.game : {};
  return {
    resetAt: Number(parsed.resetAt || 0),
    profiles: parsed.profiles && typeof parsed.profiles === "object" ? parsed.profiles : {},
    hasGame,
    game: {
      ...emptyGame(),
      ...game,
      drinks: { ...emptyDrinks(), ...game.drinks },
      menus: { ...emptyMenus(), ...game.menus },
      opened: { ...emptyOpened(), ...game.opened },
      resultPicked: { drink: false, price: false, ...game.resultPicked },
      priceShares: { ...game.priceShares },
      personalSteps: { ...emptyPersonalSteps(), ...game.personalSteps },
    },
    gameUpdatedAt: Number(parsed.gameUpdatedAt || 0),
  };
}

function persistGameLocal() {
  localStorage.setItem(GAME_KEY, JSON.stringify(gameState));
  localStorage.setItem(GAME_UPDATED_KEY, String(gameUpdatedAt));
  lastGameSignature = gameSignature(gameState);
}

function mergeProfileMaps(first, second) {
  return Object.fromEntries(
    userIds().map((id) => {
      const local = first?.[id];
      const remote = second?.[id];
      if (!second || !Object.prototype.hasOwnProperty.call(second, id) || isEmptyProfile(remote)) {
        return [id, { ...emptyUserProfile(), ...local }];
      }

      if (isEmptyProfile(local)) {
        return [id, { ...emptyUserProfile(), ...remote }];
      }

      return [id, pickRicherProfile(local, remote)];
    }),
  );
}

function applyResetProfiles(resetAt, remoteProfiles) {
  return Object.fromEntries(
    userIds().map((id) => {
      const incoming = { ...emptyUserProfile(resetAt), ...(remoteProfiles?.[id] || {}) };
      if ((incoming.resetAt || 0) < resetAt && (incoming.updatedAt || 0) <= resetAt) {
        return [id, emptyUserProfile(resetAt)];
      }

      return [id, incoming];
    }),
  );
}

function applyRemoteState(remote, options = {}) {
  const incoming = normalizeRemoteState(remote);
  const localReset = currentResetAt();
  const remoteReset = incoming.resetAt;

  if (remoteReset > localReset) {
    localStorage.setItem(PROFILE_RESET_KEY, String(remoteReset));
    lastProfileResetAt = remoteReset;
    replaceProfiles(applyResetProfiles(remoteReset, incoming.profiles));
    persistProfilesLocal();
    if (incoming.hasGame && (incoming.gameUpdatedAt || 0) > remoteReset) {
      gameState = sanitizeGameState(incoming.game, remoteReset);
      gameUpdatedAt = incoming.gameUpdatedAt;
    } else {
      gameState = emptyGame();
      gameUpdatedAt = remoteReset;
    }
    persistGameLocal();
    return { changed: true, reset: true };
  }

  const keepDraft =
    !options.replaceCurrent &&
    currentAccount &&
    profiles[currentAccount.id] &&
    !profiles[currentAccount.id].submitted &&
    !incoming.profiles[currentAccount.id]?.submitted;

  const draft = keepDraft ? { ...profiles[currentAccount.id] } : null;
  const merged = mergeProfileMaps(profiles, incoming.profiles);
  if (draft) {
    merged[currentAccount.id] = draft;
  }

  const effectiveReset = Math.max(localReset, remoteReset);
  userIds().forEach((id) => {
    const item = merged[id];
    if (!item) {
      return;
    }
    if ((item.updatedAt || 0) > effectiveReset && (item.submitted || item.name || item.nickname)) {
      item.resetAt = Math.max(item.resetAt || 0, effectiveReset);
      return;
    }
    if ((item.resetAt || 0) < effectiveReset && (item.updatedAt || 0) <= effectiveReset) {
      merged[id] = emptyUserProfile(effectiveReset);
    }
  });

  let changed = false;
  const nextProfileSig = profileSignature(merged);
  if (nextProfileSig !== lastProfileSignature) {
    replaceProfiles(merged);
    persistProfilesLocal();
    changed = true;
  }

  if (incoming.hasGame) {
    const preferRemote = (incoming.gameUpdatedAt || 0) > gameUpdatedAt;
    const next = mergeGameState(gameState, incoming.game, preferRemote);
    if (isEditingDrink() && currentAccount) {
      next.drinks[currentAccount.id] = { ...emptyDrink(), ...gameState.drinks[currentAccount.id] };
      const nameInput = document.getElementById("drinkName");
      const priceInput = document.getElementById("drinkPrice");
      if (nameInput) {
        next.drinks[currentAccount.id].name = nameInput.value;
      }
      if (priceInput) {
        next.drinks[currentAccount.id].price = priceInput.value;
      }
    }

    if (gameSignature(next) !== lastGameSignature) {
      gameState = sanitizeGameState(next, effectiveReset);
      gameUpdatedAt = Math.max(gameUpdatedAt, incoming.gameUpdatedAt || 0);
      persistGameLocal();
      changed = true;
    }
  }

  return { changed, reset: false };
}

function buildRemotePayload(base) {
  const remote = normalizeRemoteState(base);
  const useLocalGame = gameUpdatedAt >= remote.gameUpdatedAt;
  return {
    resetAt: Math.max(currentResetAt(), remote.resetAt),
    profiles: mergeProfileMaps(profiles, remote.profiles),
    game: useLocalGame ? gameState : remote.game,
    gameUpdatedAt: useLocalGame ? gameUpdatedAt : remote.gameUpdatedAt,
  };
}

function packedRemoteState(state, slimPhotos) {
  return {
    resetAt: state.resetAt,
    profiles: Object.fromEntries(
      userIds().map((id) => {
        const item = state.profiles[id] || emptyUserProfile(state.resetAt);
        return [id, slimPhotos ? slimProfile(item) : item];
      }),
    ),
    game: state.game,
    gameUpdatedAt: state.gameUpdatedAt,
  };
}

function gistFileContent(data) {
  const files = data?.files && typeof data.files === "object" ? data.files : {};
  const named =
    (typeof SYNC_GIST_FILE === "string" && files[SYNC_GIST_FILE]) || Object.values(files)[0];
  return named?.content || "";
}

async function fetchRemoteState() {
  if (!syncEnabled()) {
    return emptyRemoteState();
  }

  if (typeof SYNC_GIST_ID === "string" && SYNC_GIST_ID) {
    const response = await fetch(`https://api.github.com/gists/${SYNC_GIST_ID}?t=${Date.now()}`, {
      cache: "no-store",
      headers: { Accept: "application/vnd.github+json" },
    });
    if (response.status === 404 || response.status === 204) {
      return emptyRemoteState();
    }
    if (!response.ok) {
      throw new Error("remote-get-failed");
    }

    const text = gistFileContent(await response.json());
    if (!text) {
      return emptyRemoteState();
    }

    return normalizeRemoteState(JSON.parse(text));
  }

  const response = await fetch(SYNC_URL, { cache: "no-store" });
  if (response.status === 404 || response.status === 204) {
    return emptyRemoteState();
  }

  if (!response.ok) {
    throw new Error("remote-get-failed");
  }

  const text = await response.text();
  if (!text) {
    return emptyRemoteState();
  }

  return normalizeRemoteState(JSON.parse(text));
}

async function putRemoteState(state) {
  const attempts = [packedRemoteState(state, true), packedRemoteState(state, false)];
  let lastError = null;

  for (const payload of attempts) {
    const body = JSON.stringify(payload);
    let response;

    if (typeof SYNC_GIST_ID === "string" && SYNC_GIST_ID) {
      response = await fetch(`https://api.github.com/gists/${SYNC_GIST_ID}`, {
        method: "PATCH",
        headers: {
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: {
            [typeof SYNC_GIST_FILE === "string" && SYNC_GIST_FILE ? SYNC_GIST_FILE : "sync-init.json"]: {
              content: body,
            },
          },
        }),
      });
    } else {
      response = await fetch(SYNC_URL, {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body,
      });
    }

    if (response.ok) {
      return;
    }

    lastError = new Error(`remote-put-failed:${response.status}`);
  }

  throw lastError || new Error("remote-put-failed");
}

function packedProfiles(withPhotos) {
  return Object.fromEntries(
    userIds()
      .map((id) => {
        const item = profiles[id] || emptyUserProfile();
        return [id, withPhotos ? { ...item } : slimProfile(item)];
      })
      .filter(([, item]) => !isEmptyProfile(item)),
  );
}

function currentSyncPayload(withPhotos = false) {
  const game = JSON.parse(JSON.stringify(gameState));
  game.drinks = filledDrinks(game.drinks);
  return {
    type: "state",
    resetAt: currentResetAt(),
    profiles: packedProfiles(withPhotos),
    game,
    gameUpdatedAt,
  };
}

function ownProfilePayload() {
  if (!currentAccount || !profiles[currentAccount.id]) {
    return null;
  }

  return {
    type: "state",
    resetAt: currentResetAt(),
    profiles: {
      [currentAccount.id]: { ...profiles[currentAccount.id] },
    },
    gameUpdatedAt,
  };
}

function peerRoomId() {
  return typeof SYNC_ROOM === "string" && SYNC_ROOM ? SYNC_ROOM : "kitegamemodekrv1";
}

function sendPeer(conn, data) {
  if (conn?.open) {
    conn.send(data);
  }
}

function sendWs(data) {
  if (syncWs?.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    syncWs.send(JSON.stringify({ room: peerRoomId(), ...data }));
    return true;
  } catch {
    return false;
  }
}

function broadcastPeerState() {
  if (applyingPeerState) {
    return;
  }

  const payload = currentSyncPayload();
  sendWs(payload);
  if (syncIsHost) {
    syncGuestConns.forEach((conn) => sendPeer(conn, payload));
    return;
  }

  sendPeer(syncHostConn, payload);
}

function handlePeerPayload(data, fromConn) {
  if (data?.type === "request") {
    const reply = currentSyncPayload(false);
    if (typeof fromConn?.send === "function") {
      fromConn.send(reply);
    } else {
      sendPeer(fromConn, reply);
    }
    return;
  }

  if (data?.type !== "state") {
    return;
  }

  applyingPeerState = true;
  let result = { changed: false, reset: false };
  try {
    result = applyRemoteState(data, { replaceCurrent: Number(data.resetAt || 0) > currentResetAt() });
    if (syncIsHost) {
      const merged = currentSyncPayload();
      syncGuestConns.forEach((conn) => sendPeer(conn, merged));
    }
  } finally {
    applyingPeerState = false;
  }

  if (logoutUserIfReset()) {
    return;
  }

  if (shouldRefreshAfterRemote(result)) {
    refreshVisible();
  }
}

function rememberGuest(conn) {
  if (!syncGuestConns.includes(conn)) {
    syncGuestConns.push(conn);
  }
}

function dropGuest(conn) {
  syncGuestConns = syncGuestConns.filter((item) => item !== conn);
}

function attachPeerConnection(conn, asHost) {
  conn.on("open", () => {
    sendPeer(conn, currentSyncPayload());
    if (!asHost) {
      sendPeer(conn, { type: "request" });
    }
  });
  conn.on("data", (data) => handlePeerPayload(data, conn));
  conn.on("close", () => {
    if (asHost) {
      dropGuest(conn);
      return;
    }

    syncHostConn = null;
    schedulePeerRestart();
  });
  conn.on("error", () => {
    if (!asHost) {
      schedulePeerRestart();
    }
  });
}

function peerOptions() {
  return {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:openrelay.metered.ca:80" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turns:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    },
  };
}

function destroySyncPeer() {
  syncGuestConns.splice(0).forEach((conn) => {
    try {
      conn.close();
    } catch {
      // ignore
    }
  });
  syncHostConn = null;
  syncIsHost = false;
  if (syncPeer) {
    try {
      syncPeer.destroy();
    } catch {
      // ignore
    }
    syncPeer = null;
  }
}

function schedulePeerRestart() {
  clearTimeout(syncRestartTimer);
  syncRestartTimer = setTimeout(() => {
    startPeerSync();
  }, 1200);
}

function startPeerSync() {
  if (typeof Peer !== "function") {
    return;
  }

  destroySyncPeer();
  const room = peerRoomId();
  syncPeer = new Peer(room, peerOptions());
  syncPeer.on("open", () => {
    syncIsHost = true;
  });
  syncPeer.on("connection", (conn) => {
    rememberGuest(conn);
    attachPeerConnection(conn, true);
  });
  syncPeer.on("disconnected", () => {
    try {
      syncPeer.reconnect();
    } catch {
      schedulePeerRestart();
    }
  });
  syncPeer.on("error", (error) => {
    if (error?.type === "unavailable-id") {
      joinPeerRoom(room);
      return;
    }

    schedulePeerRestart();
  });
}

function joinPeerRoom(room) {
  destroySyncPeer();
  syncPeer = new Peer(peerOptions());
  syncPeer.on("open", () => {
    syncIsHost = false;
    syncHostConn = syncPeer.connect(room, { reliable: true });
    attachPeerConnection(syncHostConn, false);
  });
  syncPeer.on("error", () => {
    schedulePeerRestart();
  });
}

function handleRelayMessage(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
  }

  if (!data || typeof data !== "object") {
    return;
  }

  if (data.room && data.room !== peerRoomId()) {
    return;
  }

  handlePeerPayload(data, {
    open: true,
    send: (message) => sendWs(message),
  });
}

function scheduleWsRestart() {
  clearTimeout(syncWsRestart);
  syncWsRestart = setTimeout(() => {
    startWsSync();
  }, 1500);
}

function startWsSync() {
  const url = typeof SYNC_WS === "string" ? SYNC_WS : "";
  if (!url) {
    return;
  }

  try {
    if (syncWs) {
      syncWs.onclose = null;
      syncWs.close();
    }
  } catch {
    // ignore
  }

  try {
    syncWs = new WebSocket(url);
  } catch {
    scheduleWsRestart();
    return;
  }

  syncWs.onopen = () => {
    sendWs({ type: "request" });
    sendWs(currentSyncPayload(false));
    const mine = ownProfilePayload();
    if (mine) {
      sendWs(mine);
    }
  };
  syncWs.onmessage = (event) => {
    handleRelayMessage(event.data);
  };
  syncWs.onclose = () => {
    scheduleWsRestart();
  };
  syncWs.onerror = () => {
    // onclose가 재연결합니다.
  };
}

function mqttTopic(kind, id, prefix) {
  const root =
    prefix ||
    (typeof SYNC_MQTT_PREFIX === "string" && SYNC_MQTT_PREFIX ? SYNC_MQTT_PREFIX : "kitegamemode/kr/live");
  return id ? `${root}/${kind}/${id}` : `${root}/${kind}`;
}

function mqttListenRoot() {
  const live = typeof SYNC_MQTT_PREFIX === "string" && SYNC_MQTT_PREFIX ? SYNC_MQTT_PREFIX : "kitegamemode/kr/live";
  const parts = live.split("/");
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : live;
}

function mqttReady() {
  return Boolean(mqttClient?.connected);
}

const mqttOutbox = [];

function flushMqttOutbox() {
  if (!mqttReady()) {
    return;
  }

  while (mqttOutbox.length) {
    const item = mqttOutbox.shift();
    try {
      mqttClient.publish(item.topic, item.body, item.options);
    } catch {
      mqttOutbox.unshift(item);
      return;
    }
  }
}

function publishMqttJson(topic, data, options = {}) {
  const payload = {
    topic,
    body: JSON.stringify(data),
    options: {
      retain: options.retain !== false,
      qos: 0,
    },
  };

  if (!mqttReady()) {
    mqttOutbox.push(payload);
    return;
  }

  try {
    mqttClient.publish(payload.topic, payload.body, payload.options);
  } catch {
    mqttOutbox.push(payload);
  }
}

function publishMqttProfile(id) {
  const profile = profiles[id];
  if (!profile || isEmptyProfile(profile)) {
    return;
  }

  publishMqttJson(mqttTopic("user", id), {
    resetAt: currentResetAt(),
    profile: { ...profile },
  });
}

function publishMqttOwn() {
  if (!currentAccount) {
    return;
  }

  publishMqttProfile(currentAccount.id);
}

function publishMqttRoster() {
  const roster = filledProfiles();
  if (!Object.keys(roster).length) {
    return;
  }

  publishMqttJson(mqttTopic("roster"), {
    resetAt: currentResetAt(),
    profiles: packedProfiles(true),
    gameUpdatedAt,
  });
}

function publishMqttKnownUsers() {
  userIds().forEach((id) => {
    publishMqttProfile(id);
  });
}

function publishMqttHello() {
  publishMqttJson(
    mqttTopic("hello"),
    {
      type: "hello",
      from: currentAccount?.id || "",
      at: Date.now(),
    },
    { retain: false },
  );
}

function publishMqttDrink(id) {
  const drink = gameState.drinks[id];
  if (!drink) {
    return;
  }

  publishMqttJson(mqttTopic("drink", id), {
    resetAt: currentResetAt(),
    drink,
  });
}

function publishMqttGame() {
  const game = JSON.parse(JSON.stringify(gameState));
  game.drinks = filledDrinks(game.drinks);
  publishMqttJson(mqttTopic("game"), {
    game,
    gameUpdatedAt,
  });
  if (currentAccount) {
    publishMqttDrink(currentAccount.id);
  }
}

function publishMqttReset(resetAt) {
  participantIds().forEach((id) => {
    publishMqttJson(mqttTopic("user", id), {
      resetAt,
      profile: emptyUserProfile(resetAt),
    });
    publishMqttJson(mqttTopic("drink", id), {
      resetAt,
      drink: emptyDrink(),
    });
  });
  publishMqttJson(mqttTopic("reset"), { resetAt });
  publishMqttJson(mqttTopic("roster"), {
    resetAt,
    profiles: {},
    gameUpdatedAt: resetAt,
  });
  publishMqttJson(mqttTopic("game"), {
    game: emptyGame(),
    gameUpdatedAt: resetAt,
  });
}

function handleMqttMessage(topic, data) {
  if (!data || typeof data !== "object") {
    return;
  }

  if (topic.endsWith("/hello")) {
    if (data.from && currentAccount && data.from === currentAccount.id) {
      return;
    }

    publishMqttRoster();
    publishMqttKnownUsers();
    publishMqttGame();
    return;
  }

  if (topic.endsWith("/roster")) {
    const result = applyRemoteState({
      resetAt: Number(data.resetAt || 0),
      profiles: data.profiles || {},
    });
    if (logoutUserIfReset()) {
      return;
    }

    if (shouldRefreshAfterRemote(result)) {
      refreshVisible();
    }
    return;
  }

  if (topic.endsWith("/reset")) {
    const resetAt = Number(data.resetAt || 0);
    const result = applyRemoteState(
      {
        resetAt,
        profiles: {},
        game: emptyGame(),
        gameUpdatedAt: resetAt,
      },
      { replaceCurrent: true },
    );
    if (logoutUserIfReset()) {
      return;
    }

    if (shouldRefreshAfterRemote(result) || (result.changed && currentAccount)) {
      refreshVisible();
    }
    return;
  }

  if (topic.includes("/user/")) {
    const id = topic.slice(topic.lastIndexOf("/") + 1);
    if (!participantIds().includes(id)) {
      return;
    }

    const result = applyRemoteState({
      resetAt: Number(data.resetAt || 0),
      profiles: { [id]: data.profile || data },
    });
    if (logoutUserIfReset()) {
      return;
    }

    if (shouldRefreshAfterRemote(result)) {
      refreshVisible();
    }
    return;
  }

  if (topic.includes("/drink/")) {
    const id = topic.slice(topic.lastIndexOf("/") + 1);
    if (!participantIds().includes(id)) {
      return;
    }

    const drink = data.drink || data;
    const resetAt = Math.max(currentResetAt(), Number(data.resetAt || 0));
    if (drinkIsStale(drink, resetAt)) {
      return;
    }

    const result = applyRemoteState({
      resetAt,
      profiles: {},
      game: {
        ...gameState,
        drinks: {
          ...gameState.drinks,
          [id]: drink,
        },
      },
      gameUpdatedAt: Math.max(gameUpdatedAt, Number(drink.updatedAt || 0)),
    });
    if (shouldRefreshAfterRemote(result)) {
      refreshVisible();
    }
    return;
  }

  if (topic.endsWith("/game")) {
    const result = applyRemoteState({
      resetAt: currentResetAt(),
      profiles: {},
      game: data.game || data,
      gameUpdatedAt: Number(data.gameUpdatedAt || 0),
    });
    if (shouldRefreshAfterRemote(result)) {
      refreshVisible();
    }
  }
}

function startMqttSync(url) {
  if (typeof mqtt !== "object" && typeof mqtt !== "function") {
    return;
  }

  const connect = mqtt.connect || mqtt.default?.connect;
  if (typeof connect !== "function") {
    return;
  }

  const broker = url || (typeof SYNC_MQTT === "string" ? SYNC_MQTT : "");
  if (!broker) {
    return;
  }

  try {
    mqttClient?.end?.(true);
  } catch {
    // ignore
  }

  mqttClient = connect(broker, {
    clientId: `kmg${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    reconnectPeriod: 2000,
    connectTimeout: 8000,
  });

  mqttClient.on("connect", () => {
    const root = mqttListenRoot();
    const topics = [
      `${root}/+/user/+`,
      `${root}/+/drink/+`,
      `${root}/+/game`,
      `${root}/+/reset`,
      `${root}/+/roster`,
      `${root}/+/hello`,
    ];
    topics.forEach((topic) => {
      mqttClient.subscribe(topic, { qos: 0 });
    });
    if (Array.isArray(SYNC_MQTT_LEGACY_PREFIXES)) {
      SYNC_MQTT_LEGACY_PREFIXES.forEach((prefix) => {
        mqttClient.subscribe(`${prefix}/user/+`, { qos: 0 });
        mqttClient.subscribe(`${prefix}/drink/+`, { qos: 0 });
        mqttClient.subscribe(`${prefix}/game`, { qos: 0 });
        mqttClient.subscribe(`${prefix}/reset`, { qos: 0 });
      });
    }
    const shareKnown = () => {
      flushMqttOutbox();
      publishMqttHello();
      publishMqttOwn();
      publishMqttRoster();
      publishMqttKnownUsers();
      publishMqttGame();
    };
    shareKnown();
    setTimeout(shareKnown, 400);
  });

  mqttClient.on("message", (topic, payload) => {
    try {
      handleMqttMessage(String(topic), JSON.parse(String(payload)));
    } catch {
      // ignore
    }
  });

  mqttClient.once("error", () => {
    if (broker !== SYNC_MQTT_FALLBACK && typeof SYNC_MQTT_FALLBACK === "string") {
      startMqttSync(SYNC_MQTT_FALLBACK);
    }
  });
}

function scheduleRemotePush(immediate = false) {
  broadcastPeerState();
  publishMqttOwn();
  publishMqttRoster();
  publishMqttKnownUsers();
  publishMqttGame();
  if (!syncEnabled()) {
    return;
  }

  remotePushQueued = true;
  if (!immediate) {
    clearTimeout(remotePushTimer);
    remotePushTimer = setTimeout(() => {
      flushRemotePush();
    }, 350);
    return;
  }

  clearTimeout(remotePushTimer);
  flushRemotePush();
}

async function flushRemotePush() {
  if (!syncEnabled() || remotePushing) {
    return;
  }

  remotePushQueued = false;
  remotePushing = true;
  try {
    let remote = emptyRemoteState();
    try {
      remote = await fetchRemoteState();
    } catch {
      remote = emptyRemoteState();
    }

    if (remote.resetAt > currentResetAt()) {
      const result = applyRemoteState(remote, { replaceCurrent: true });
      if (logoutUserIfReset()) {
        return;
      }

      if (result.changed && currentAccount) {
        refreshVisible();
      }
      return;
    }

    await putRemoteState(buildRemotePayload(remote));
  } catch {
    // HTTP 저장소가 막혀 있어도 방 연결로 동기화합니다.
  } finally {
    remotePushing = false;
    if (remotePushQueued) {
      clearTimeout(remotePushTimer);
      remotePushTimer = setTimeout(() => {
        flushRemotePush();
      }, 800);
    }
  }
}

function isEditingDrink() {
  return Boolean(
    document.activeElement &&
      (document.activeElement.id === "drinkName" || document.activeElement.id === "drinkPrice"),
  );
}

function isEditingRegister() {
  return Boolean(
    document.activeElement &&
      (document.activeElement.id === "nameInput" || document.activeElement.id === "nicknameInput"),
  );
}

function shouldRefreshAfterRemote(result) {
  if (!currentAccount || !result.changed || isEditingRegister()) {
    return false;
  }

  if (userMain && !userMain.hidden && isInCurrentGame()) {
    return true;
  }

  if (isEditingDrink() || isEditingMenu()) {
    return false;
  }

  if (gameState.game === "game2" && gameState.phase === "menu-reveal" && isMenuRevealBusy()) {
    return false;
  }

  if (gameState.game === "game2" && gameState.phase === "menu-spin") {
    const key = spinKey(currentSpin());
    if (userPlay?.dataset.menuSpin === key || adminPlay?.dataset.menuSpin === key) {
      return false;
    }
  }

  if (
    gameState.game === "drink" &&
    currentAccount.role !== "admin" &&
    !currentDrink().submitted &&
    document.getElementById("drinkName") &&
    (gameState.phase === "entry" || gameState.phase === "review" || gameState.phase === "choose")
  ) {
    return false;
  }

  if (gameState.game === "game2" && !currentMenu().submitted && document.querySelector("form[data-form='menu']")) {
    return false;
  }

  if (result.reset || currentAccount.role === "admin" || currentProfile()?.submitted) {
    return true;
  }

  return false;
}

async function pullRemoteState(options = {}) {
  if (!syncEnabled()) {
    return false;
  }

  try {
    const remote = await fetchRemoteState();
    const incoming = normalizeRemoteState(remote);
    const hasProfiles = Boolean(incoming.profiles && Object.keys(incoming.profiles).length);
    if (!hasProfiles && !incoming.hasGame && incoming.resetAt <= currentResetAt()) {
      return false;
    }

    const result = applyRemoteState(remote, options);
    if (logoutUserIfReset()) {
      return true;
    }

    if (shouldRefreshAfterRemote(result)) {
      refreshVisible();
    }

    return result.changed;
  } catch {
    return false;
  }
}

function syncProfilesFromStorage() {
  if (logoutUserIfReset()) {
    return;
  }

  const resetAt = Number(localStorage.getItem(PROFILE_RESET_KEY) || 0);
  const wasSubmitted = Boolean(currentProfile()?.submitted);
  const next = loadProfiles();
  const signature = profileSignature(next);

  if (signature === lastProfileSignature && resetAt === lastProfileResetAt) {
    return;
  }

  if (currentAccount && !wasSubmitted && !next[currentAccount.id]?.submitted) {
    const merged = mergeProfileMaps(next, profiles);
    merged[currentAccount.id] = profiles[currentAccount.id];
    replaceProfiles(merged);
    lastProfileResetAt = resetAt;
    lastProfileSignature = profileSignature(profiles);
    return;
  }

  replaceProfiles(mergeProfileMaps(next, profiles));
  lastProfileResetAt = resetAt;
  lastProfileSignature = signature;

  if (logoutUserIfReset()) {
    return;
  }

  if (currentAccount?.role === "admin" && adminView === "settings" && !adminPage.hidden) {
    renderAdmin();
  }
}

function syncGameFromStorage() {
  const next = loadGame();
  const signature = gameSignature(next);
  if (signature === lastGameSignature) {
    return;
  }

  const typingDrink =
    document.activeElement &&
    (document.activeElement.id === "drinkName" || document.activeElement.id === "drinkPrice");
  if (typingDrink && next.phase === gameState.phase && next.game === gameState.game) {
    return;
  }

  gameState = next;
  lastGameSignature = signature;
  refreshVisible();
}

window.addEventListener("storage", (event) => {
  if (
    event.key === PROFILE_KEY ||
    event.key === PROFILE_RESET_KEY ||
    event.key?.startsWith(`${PROFILE_KEY}:`)
  ) {
    syncProfilesFromStorage();
  }

  if (event.key === GAME_KEY) {
    syncGameFromStorage();
  }
});

try {
  const resetChannel = new BroadcastChannel(RESET_CHANNEL);
  resetChannel.addEventListener("message", () => {
    if (logoutUserIfReset()) {
      return;
    }

    reloadProfilesFromStorage();
    if (currentAccount) {
      refreshVisible();
    }
  });
} catch {
  // ignore
}

setInterval(() => {
  if (logoutUserIfReset()) {
    return;
  }

  syncProfilesFromStorage();
  syncGameFromStorage();
}, 500);
setInterval(() => {
  if (!currentAccount) {
    return;
  }

  sendWs({ type: "request" });
  const mine = ownProfilePayload();
  if (mine) {
    sendWs(mine);
  }
  publishMqttOwn();
  publishMqttRoster();
  publishMqttKnownUsers();
  broadcastPeerState();
}, 1500);
window.addEventListener("message", (event) => {
  if (event.data?.type === "stop-ready") {
    if (typeof event.source?.postMessage === "function") {
      event.source.postMessage(stopHostPayload(), "*");
    }
    return;
  }

  if (event.data?.type === "stop-exit" && currentAccount?.role === "admin") {
    goToMainMenu();
  }
});

lastProfileSignature = profileSignature(profiles);
lastGameSignature = gameSignature(gameState);
restoreSession();
startPeerSync();
startWsSync();
startMqttSync();
pullRemoteState();

window.addEventListener("pageshow", () => {
  reloadProfilesFromStorage();
  if (currentAccount && sessionInvalidatedByReset(currentAccount)) {
    logout();
    return;
  }

  if (currentAccount) {
    refreshVisible();
  }

  pullRemoteState();
});
