const SESSION_KEY = "gift-draw-session";
const SESSION_RESET_KEY = "gift-draw-session-reset";
const PROFILE_KEY = "gift-draw-profiles";
const PROFILE_RESET_KEY = "gift-draw-profile-reset";
const GAME_KEY = "gift-draw-game";
const GAME_UPDATED_KEY = "gift-draw-game-updated";
const GAME_RESET_KEY = "gift-draw-game-reset";
const RESET_CHANNEL = "gift-draw-reset-channel";

function playAccounts() {
  return ACCOUNTS.filter((account) => account.role !== "joke");
}

function participantIds() {
  return playAccounts().map((account) => account.id);
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
  return Object.fromEntries(participantIds().map((id) => [id, emptyDrink()]));
}

function isEmptyDrink(drink) {
  const item = { ...emptyDrink(), ...drink };
  return !item.submitted && !item.name && !item.price;
}

function drinkIsStale(drink, resetAt = currentGameResetAt()) {
  const item = { ...emptyDrink(), ...drink };
  if (isEmptyDrink(item)) {
    return true;
  }

  return (item.updatedAt || 0) <= resetAt;
}

function pickRicherDrink(first, second) {
  const resetAt = currentGameResetAt();
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
  const resetAt = currentGameResetAt();
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

function sanitizeDrinks(drinks, resetAt = currentGameResetAt()) {
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
const MENU_FLAGS = {
  한: "🇰🇷",
  중: "🇨🇳",
  일: "🇯🇵",
  양: "🇺🇸",
  동: "🇹🇭",
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
  next.turns = Math.min(20, Math.max(8, Number(next.turns) || 14));
  next.duration = Math.min(12000, Math.max(4000, Number(next.duration) || 5200));
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
  return sliceBag(left) === sliceBag(right);
}

function circularDist(index, other, size) {
  const gap = Math.abs(index - other);
  return Math.min(gap, size - gap);
}

function adjacentPairCount(slices) {
  const size = slices.length;
  if (size < 2) {
    return 0;
  }

  return slices.reduce((count, item, index) => count + (item === slices[(index + 1) % size] ? 1 : 0), 0);
}

function sliceBag(slices) {
  return [...sanitizeRoulette(slices)].sort().join("\0");
}

function arrangeMenuSlices(picks) {
  const items = sanitizeRoulette(picks);
  const size = items.length;
  if (size <= 1) {
    return items.slice();
  }

  const remaining = new Map();
  items.forEach((item) => {
    remaining.set(item, (remaining.get(item) || 0) + 1);
  });
  const types = [...remaining.entries()].sort((left, right) => {
    if (right[1] !== left[1]) {
      return right[1] - left[1];
    }
    return MENU_OPTIONS.indexOf(left[0]) - MENU_OPTIONS.indexOf(right[0]);
  });

  const result = new Array(size).fill(null);

  function slotScore(index, type) {
    const left = result[(index - 1 + size) % size];
    const right = result[(index + 1) % size];
    let score = 0;
    if (left === type) {
      score -= 80;
    }
    if (right === type) {
      score -= 80;
    }
    if (left && left !== type) {
      score += 3;
    }
    if (right && right !== type) {
      score += 3;
    }

    let minSame = size;
    for (let other = 0; other < size; other += 1) {
      if (result[other] === type) {
        minSame = Math.min(minSame, circularDist(index, other, size));
      }
    }
    return score + minSame;
  }

  function nextSlot(type) {
    let best = -1;
    let bestScore = -Infinity;
    for (let index = 0; index < size; index += 1) {
      if (result[index] !== null) {
        continue;
      }
      const score = slotScore(index, type);
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    }
    return best;
  }

  types.forEach(([type, count], typeIndex) => {
    if (typeIndex === 0) {
      for (let placed = 0; placed < count; placed += 1) {
        const target = Math.round((placed * size) / count) % size;
        const slot = result[target] === null ? target : nextSlot(type);
        if (slot >= 0) {
          result[slot] = type;
        }
      }
      return;
    }

    for (let placed = 0; placed < count; placed += 1) {
      const slot = nextSlot(type);
      if (slot >= 0) {
        result[slot] = type;
      }
    }
  });

  const leftover = [];
  types.forEach(([type, count]) => {
    const used = result.filter((item) => item === type).length;
    for (let extra = 0; extra < count - used; extra += 1) {
      leftover.push(type);
    }
  });
  result.forEach((item, index) => {
    if (!item && leftover.length) {
      result[index] = leftover.shift();
    }
  });

  let arranged = result.map((item, index) => item || items[index]);
  let improved = true;
  let guard = 0;
  while (improved && guard < size * size) {
    improved = false;
    guard += 1;
    const currentPairs = adjacentPairCount(arranged);
    if (!currentPairs) {
      break;
    }

    for (let index = 0; index < size && !improved; index += 1) {
      const next = (index + 1) % size;
      if (arranged[index] !== arranged[next]) {
        continue;
      }

      for (let swap = 0; swap < size; swap += 1) {
        if (arranged[swap] === arranged[index]) {
          continue;
        }

        const trial = arranged.slice();
        [trial[next], trial[swap]] = [trial[swap], trial[next]];
        if (adjacentPairCount(trial) < currentPairs) {
          arranged = trial;
          improved = true;
          break;
        }
      }
    }
  }

  return sliceBag(arranged) === sliceBag(items) ? arranged : items.slice();
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
  return Object.fromEntries(participantIds().map((id) => [id, emptyMenu()]));
}

function normalizeMenuPicks(picks) {
  const allowed = new Set(MENU_OPTIONS);
  return [...new Set((Array.isArray(picks) ? picks : []).filter((item) => allowed.has(item)))];
}

function isEmptyMenu(menu) {
  const item = { ...emptyMenu(), ...menu, picks: normalizeMenuPicks(menu?.picks) };
  return !item.submitted && !item.picks.length;
}

function menuIsStale(menu, resetAt = currentGameResetAt()) {
  const item = { ...emptyMenu(), ...menu, picks: normalizeMenuPicks(menu?.picks) };
  if (isEmptyMenu(item)) {
    return true;
  }

  return (item.updatedAt || 0) <= resetAt;
}

function pickRicherMenu(first, second) {
  const resetAt = currentGameResetAt();
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
  const resetAt = currentGameResetAt();
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

function sanitizeMenus(menus, resetAt = currentGameResetAt()) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const menu = menus?.[id];
      return [id, menuIsStale(menu, resetAt) ? emptyMenu() : { ...emptyMenu(), ...menu, picks: normalizeMenuPicks(menu?.picks) }];
    }),
  );
}

function sanitizeGameState(game, resetAt = currentGameResetAt()) {
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
    next.appeals = emptyAppeals();
    next.roulette = [];
    next.spin = emptySpin();
    next.boardReady = false;
    if (isLateGamePhase(next.phase)) {
      next.phase = next.game === "drink" || next.game === "game2" ? "entry" : next.game ? "play" : "idle";
    }
  } else {
    next.roulette = sanitizeRoulette(next.roulette);
    next.spin = sanitizeSpin(next.spin, next.roulette);
  }

  next.boardReady = Boolean(next.boardReady);
  next.miniMenu = next.miniMenu === "winner" ? "winner" : "";
  next.winnerMode = next.winnerMode === "immediate" || next.winnerMode === "after" ? next.winnerMode : "";
  next.winnerPlayers = Array.isArray(next.winnerPlayers)
    ? next.winnerPlayers.filter((id) => participantIds().includes(id))
    : [];
  next.winnerBoxes = sanitizeWinnerBoxes(next.winnerBoxes);
  next.winnerPicks = sanitizeWinnerPicks(next.winnerPicks, next.winnerBoxes);
  next.winnerId = next.winnerPlayers.includes(next.winnerId) ? next.winnerId : "";
  next.winnerBoard = sanitizeWinnerBoard(next.winnerBoard);
  next.winnerRound = Math.max(0, Number(next.winnerRound || 0));
  next.appeals = sanitizeAppeals(next.appeals);
  next.appealClosed = Boolean(next.appealClosed);
  next.revoteKind = next.revoteKind === "drink" || next.revoteKind === "price" || next.revoteKind === "full" ? next.revoteKind : "";
  if (next.phase === "drink-board" && !next.boardReady) {
    next.phase = "drink-reveal";
  }

  return next;
}

const PHASE_RANK = {
  idle: 0,
  pick: 1,
  entry: 2,
  play: 2,
  "winner-mode": 3,
  "winner-pick": 3,
  "winner-run": 4,
  "winner-table": 5,
  review: 3,
  choose: 4,
  "menu-reveal": 5,
  "menu-spin": 6,
  "menu-payout": 7,
  "drink-reveal": 5,
  "drink-board": 6,
  "price-reveal": 7,
  "price-result": 8,
};

function pickGamePhase(local, remote, primary) {
  const leftRound = Math.max(0, Number(local.winnerRound || 0));
  const rightRound = Math.max(0, Number(remote.winnerRound || 0));
  if (leftRound !== rightRound) {
    return (leftRound > rightRound ? local.phase : remote.phase) || "idle";
  }

  const left = PHASE_RANK[local.phase] || 0;
  const right = PHASE_RANK[remote.phase] || 0;
  if (right > left) {
    return remote.phase || "idle";
  }
  if (left > right) {
    return local.phase || "idle";
  }
  return primary.phase || "idle";
}

function isWinnerFlowPhase(phase) {
  return (
    phase === "winner-mode" ||
    phase === "winner-pick" ||
    phase === "winner-run" ||
    phase === "winner-table"
  );
}

function isStartGamePhase(phase) {
  return phase === "idle" || phase === "pick" || phase === "entry" || phase === "play";
}

function isMiniMenuPhase(phase) {
  return (
    phase === "play" ||
    phase === "winner-mode" ||
    phase === "winner-pick" ||
    phase === "winner-run" ||
    phase === "winner-table"
  );
}

function isLateGamePhase(phase) {
  return (
    phase === "review" ||
    phase === "choose" ||
    phase === "drink-reveal" ||
    phase === "drink-board" ||
    phase === "price-reveal" ||
    phase === "price-result" ||
    phase === "menu-reveal" ||
    phase === "menu-spin" ||
    phase === "menu-payout"
  );
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
  const phase = pickGamePhase(local, remote, primary);
  const restarting = isStartGamePhase(phase);
  const keepWinner = isWinnerFlowPhase(phase);
  return sanitizeGameState(
    {
      ...emptyGame(),
      ...secondary,
      ...primary,
      game: primary.game || "",
      pendingGame: primary.pendingGame || "",
      players: Array.isArray(primary.players) ? primary.players : [],
      phase,
      boardReady: restarting ? false : Boolean(primary.boardReady),
      drinks,
      menus,
      opened: restarting ? emptyOpened() : mergeOpenedMaps(local.opened, remote.opened),
      assignment: restarting ? {} : Object.keys(primary.assignment || {}).length ? primary.assignment : secondary.assignment || {},
      priceShares: restarting ? {} : Object.keys(primary.priceShares || {}).length ? primary.priceShares : secondary.priceShares || {},
      resultPicked: restarting
        ? { drink: false, price: false }
        : {
            drink: Boolean(primary.resultPicked?.drink),
            price: Boolean(primary.resultPicked?.price),
          },
      personalSteps: restarting ? emptyPersonalSteps() : mergePersonalSteps(local.personalSteps, remote.personalSteps),
      appeals: restarting
        ? emptyAppeals()
        : primary.appealClosed && !participantIds().some((id) => primary.appeals?.[id]?.submitted)
          ? sanitizeAppeals(primary.appeals)
          : mergeAppealMaps(local.appeals, remote.appeals),
      appealClosed: Boolean(primary.appealClosed || secondary.appealClosed),
      revoteKind: primary.revoteKind || secondary.revoteKind || "",
      roulette: restarting ? [] : pickRoulette(primary.roulette, secondary.roulette),
      spin: restarting ? emptySpin() : pickSpin(primary.spin, secondary.spin),
      miniMenu: keepWinner ? "winner" : phase === "play" ? primary.miniMenu || "" : "",
      ...(keepWinner
        ? pickWinnerSlice(local, remote)
        : {
            winnerRound: Math.max(Number(local.winnerRound || 0), Number(remote.winnerRound || 0)),
            winnerMode: "",
            winnerPlayers: [],
            winnerBoxes: [],
            winnerPicks: {},
            winnerId: "",
            winnerBoard: [],
          }),
    },
    currentGameResetAt(),
  );
}

function emptyOpened() {
  return Object.fromEntries(
    participantIds().map((id) => [id, { drink: false, price: false }]),
  );
}

function emptyAppeals() {
  return Object.fromEntries(
    participantIds().map((id) => [id, { drink: false, price: false, submitted: false }]),
  );
}

function sanitizeAppeals(appeals) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const item = appeals?.[id] || {};
      return [
        id,
        {
          drink: Boolean(item.drink),
          price: Boolean(item.price),
          submitted: Boolean(item.submitted),
        },
      ];
    }),
  );
}

function mergeAppealMaps(first, second) {
  return Object.fromEntries(
    participantIds().map((id) => {
      const left = { drink: false, price: false, submitted: false, ...first?.[id] };
      const right = { drink: false, price: false, submitted: false, ...second?.[id] };
      return [
        id,
        {
          drink: Boolean(left.drink || right.drink),
          price: Boolean(left.price || right.price),
          submitted: Boolean(left.submitted || right.submitted),
        },
      ];
    }),
  );
}

function emptyPersonalSteps() {
  return Object.fromEntries(participantIds().map((id) => [id, "talk"]));
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
    appeals: emptyAppeals(),
    appealClosed: false,
    revoteKind: "",
    roulette: [],
    spin: emptySpin(),
    boardReady: false,
    miniMenu: "",
    winnerMode: "",
    winnerPlayers: [],
    winnerBoxes: [],
    winnerPicks: {},
    winnerId: "",
    winnerBoard: [],
    winnerRound: 0,
  };
}

function gamePlayers() {
  const selected = Array.isArray(gameState.players) ? gameState.players : [];
  const allowed = new Set(participantIds());
  return selected.filter((id) => allowed.has(id));
}

function winnerPlayers() {
  const selected = Array.isArray(gameState.winnerPlayers) ? gameState.winnerPlayers : [];
  const allowed = new Set(participantIds());
  return selected.filter((id) => allowed.has(id));
}

function isWinnerPlayer(id = currentAccount?.id) {
  return Boolean(id) && winnerPlayers().includes(id);
}

function sanitizeWinnerBoxes(boxes) {
  if (!Array.isArray(boxes)) {
    return [];
  }

  return boxes.map((box, index) => ({
    id: String(box?.id ?? index),
    color: WINNER_BOX_COLORS.includes(box?.color) ? box.color : WINNER_BOX_COLORS[index % WINNER_BOX_COLORS.length],
  }));
}

function sanitizeWinnerPicks(picks, boxes = gameState?.winnerBoxes) {
  const allowedPlayers = new Set(participantIds());
  const allowedBoxes = new Set(sanitizeWinnerBoxes(boxes).map((box) => box.id));
  const next = {};
  Object.entries(picks || {}).forEach(([boxId, playerId]) => {
    if (allowedBoxes.size && !allowedBoxes.has(String(boxId))) {
      return;
    }
    if (allowedPlayers.has(playerId)) {
      next[String(boxId)] = playerId;
    }
  });
  return next;
}

function mergeWinnerPicks(first, second) {
  return { ...(first || {}), ...(second || {}) };
}

function isWinnerResetPhase(phase) {
  return phase === "play" || phase === "winner-mode" || phase === "winner-pick";
}

function sanitizeWinnerBoard(board) {
  if (!Array.isArray(board)) {
    return [];
  }

  return board
    .map((row) => ({
      id: String(row?.id || ""),
      name: String(row?.name || ""),
      win: Boolean(row?.win),
    }))
    .filter((row) => row.id && participantIds().includes(row.id));
}

function buildWinnerBoard(state) {
  const board = sanitizeWinnerBoard(state?.winnerBoard);
  if (board.length) {
    return board;
  }

  const players = Array.isArray(state?.winnerPlayers)
    ? state.winnerPlayers.filter((id) => participantIds().includes(id))
    : [];
  const winnerId = players.includes(state?.winnerId) ? state.winnerId : "";
  return players.map((id) => ({
    id,
    name: winnerPersonName(id),
    win: id === winnerId,
  }));
}

function snapshotWinnerBoard() {
  const winnerId = ensureWinnerId();
  return winnerPlayers().map((id) => ({
    id,
    name: winnerPersonName(id),
    win: id === winnerId,
  }));
}

function pickWinnerSlice(local, remote) {
  const leftRound = Math.max(0, Number(local.winnerRound || 0));
  const rightRound = Math.max(0, Number(remote.winnerRound || 0));
  let source = leftRound >= rightRound ? local : remote;
  let other = source === local ? remote : local;
  const sourceRound = Math.max(0, Number(source.winnerRound || 0));
  const otherRound = Math.max(0, Number(other.winnerRound || 0));
  if (isWinnerResetPhase(source.phase) && sourceRound > otherRound) {
    return {
      winnerRound: sourceRound,
      winnerMode: source.winnerMode || "",
      winnerPlayers: [],
      winnerBoxes: [],
      winnerPicks: {},
      winnerId: "",
      winnerBoard: [],
    };
  }

  const sourcePlayers = Array.isArray(source.winnerPlayers) ? source.winnerPlayers : [];
  const otherPlayers = Array.isArray(other.winnerPlayers) ? other.winnerPlayers : [];
  const sourceBoard = sanitizeWinnerBoard(source.winnerBoard);
  const otherBoard = sanitizeWinnerBoard(other.winnerBoard);
  if (
    (!sourcePlayers.length && otherPlayers.length) ||
    (!sourceBoard.length && otherBoard.length)
  ) {
    const previous = source;
    source = other;
    other = previous;
  }

  const pickedRound = Math.max(0, Number(source.winnerRound || 0));
  const otherRoundNow = Math.max(0, Number(other.winnerRound || 0));
  const board = buildWinnerBoard(source).length ? buildWinnerBoard(source) : buildWinnerBoard(other);
  const players = Array.isArray(source.winnerPlayers) && source.winnerPlayers.length
    ? source.winnerPlayers
    : Array.isArray(other.winnerPlayers)
      ? other.winnerPlayers
      : [];
  const boxes = Array.isArray(source.winnerBoxes) && source.winnerBoxes.length
    ? source.winnerBoxes
    : Array.isArray(other.winnerBoxes)
      ? other.winnerBoxes
      : [];
  return {
    winnerRound: Math.max(pickedRound, otherRoundNow),
    winnerMode: source.winnerMode || other.winnerMode || "",
    winnerPlayers: players,
    winnerBoxes: boxes,
    winnerPicks:
      pickedRound === otherRoundNow
        ? mergeWinnerPicks(local.winnerPicks, remote.winnerPicks)
        : source.winnerPicks || other.winnerPicks || {},
    winnerId: source.winnerId || other.winnerId || "",
    winnerBoard: board,
  };
}

function allWinnerBoxesTaken() {
  const boxes = sanitizeWinnerBoxes(gameState.winnerBoxes);
  if (!boxes.length) {
    return false;
  }

  return boxes.every((box) => gameState.winnerPicks?.[box.id]);
}

function hasAnyWinnerPick() {
  return Object.values(gameState.winnerPicks || {}).some(Boolean);
}

function currentWinnerPick() {
  if (!currentAccount) {
    return "";
  }

  return Object.entries(gameState.winnerPicks || {}).find(([, playerId]) => playerId === currentAccount.id)?.[0] || "";
}

function winnerPersonName(id) {
  return (profiles[id]?.name || "").trim() || id || "";
}

function hashWinnerKey(key) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rollWinnerId() {
  const players = winnerPlayers();
  if (!players.length) {
    return "";
  }

  const key = [
    ...players.slice().sort(),
    ...Object.entries(gameState.winnerPicks || {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([boxId, playerId]) => `${boxId}:${playerId}`),
  ].join("|");
  return players[hashWinnerKey(key) % players.length];
}

function ensureWinnerId() {
  const next = winnerPlayers().includes(gameState.winnerId) ? gameState.winnerId : rollWinnerId();
  if (!next) {
    return "";
  }

  gameState.winnerId = next;
  return next;
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
      appeals: sanitizeAppeals(parsed.appeals),
      appealClosed: Boolean(parsed.appealClosed),
      revoteKind: parsed.revoteKind || "",
      roulette: sanitizeRoulette(parsed.roulette),
      spin: parsed.spin,
      boardReady: Boolean(parsed.boardReady),
      miniMenu: parsed.miniMenu || "",
      winnerMode: parsed.winnerMode || "",
      winnerPlayers: Array.isArray(parsed.winnerPlayers) ? parsed.winnerPlayers : [],
      winnerBoxes: parsed.winnerBoxes,
      winnerPicks: parsed.winnerPicks,
      winnerId: parsed.winnerId || "",
      winnerBoard: parsed.winnerBoard || [],
      winnerRound: Number(parsed.winnerRound || 0),
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
const jokePage = document.getElementById("jokePage");
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
let drinkDraftTimer = 0;
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
let drinkTalkToken = 0;
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
  resetPlayUi();
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
    appeals: state.appeals,
    appealClosed: Boolean(state.appealClosed),
    revoteKind: state.revoteKind || "",
    roulette: state.roulette,
    spin: state.spin,
    boardReady: Boolean(state.boardReady),
    miniMenu: state.miniMenu || "",
    winnerMode: state.winnerMode || "",
    winnerPlayers: state.winnerPlayers || [],
    winnerBoxes: state.winnerBoxes || [],
    winnerPicks: state.winnerPicks || {},
    winnerId: state.winnerId || "",
    winnerBoard: state.winnerBoard || [],
    winnerRound: Number(state.winnerRound || 0),
  });
}

function findAccount(id, password) {
  return ACCOUNTS.find(
    (account) =>
      account.id.toUpperCase() === id.trim().toUpperCase() &&
      account.password === password,
  );
}

const GIFT_LAYER_COUNT = 4;
const JOKE_PUNCHLINE = "이민호 바보";
const JOKE_NUDGE_LINES = [
  "한번만 하면 정없으니까~",
  "아 진짜 마지막^^",
  "진짜 찐막",
];
let jokeNudgeShown = 0;
const JOKE_GIFT_FRAMES = [4, 3, 2, 1];
const JOKE_SUSPENSE = {
  1: "과연?!?",
  2: "두구두구",
  3: "ㄷㄱㄷㄱ",
};

let jokeReadyTimer = 0;
const jokeActionTimers = [];
let giftUnwrapBusy = false;
let jokeAudioCtx = null;
let jokeApplause = null;
let jokeDrumroll = null;
let jokeTada = null;

function afterJoke(ms, fn) {
  const id = window.setTimeout(() => {
    const index = jokeActionTimers.indexOf(id);
    if (index !== -1) {
      jokeActionTimers.splice(index, 1);
    }

    fn();
  }, ms);

  jokeActionTimers.push(id);
  return id;
}

function clearJokeTimers() {
  window.clearTimeout(jokeReadyTimer);
  jokeReadyTimer = 0;
  jokeActionTimers.splice(0).forEach((id) => window.clearTimeout(id));
}

function resetGiftBox(gift, layer = 0) {
  gift.dataset.step = "0";
  gift.dataset.layer = String(layer);
  gift.classList.remove("is-untying", "is-nesting", "is-shaking", "is-fading", "is-hidden");
}

function resumeJokeAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!jokeAudioCtx) {
    jokeAudioCtx = new AudioContextClass();
  }

  if (jokeAudioCtx.state === "suspended") {
    jokeAudioCtx.resume();
  }

  return jokeAudioCtx;
}

function stopJokeTada() {
  if (!jokeTada) {
    return;
  }

  jokeTada.pause();
  jokeTada.removeAttribute("src");
  jokeTada.load();
  jokeTada = null;
}

function playJokeTada() {
  stopJokeTada();
  resumeJokeAudio();

  const audio = new Audio("assets/fanfare.mp3");
  audio.volume = 0.74;
  jokeTada = audio;
  audio.play().catch(() => {});
}

function stopJokeDrumroll() {
  if (!jokeDrumroll) {
    return;
  }

  jokeDrumroll.pause();
  jokeDrumroll.removeAttribute("src");
  jokeDrumroll.load();
  jokeDrumroll = null;
}

function stopJokeApplause() {
  if (!jokeApplause) {
    return;
  }

  jokeApplause.pause();
  jokeApplause.removeAttribute("src");
  jokeApplause.load();
  jokeApplause = null;
}

function preloadJokeApplause() {
  const audio = new Audio("assets/applause.mp3");
  audio.preload = "auto";
}

function rebuildGiftBox(layer = 0) {
  const old = document.getElementById("jokeGift");
  if (!old) {
    return null;
  }

  const next = old.cloneNode(true);
  resetGiftBox(next, layer);
  old.replaceWith(next);
  return next;
}

function setJokePunchline() {
  const line = document.querySelector(".joke-line");
  if (line) {
    line.textContent = JOKE_PUNCHLINE;
  }
}

function setJokeGiftFrame(frame) {
  const fly = document.getElementById("jokeGiftFly");
  const photo = document.getElementById("jokeGiftPhoto");
  if (!fly || !photo) {
    return;
  }

  const src = `assets/gift-${frame}.png?v=155`;
  if (photo.getAttribute("src") !== src) {
    photo.src = src;
  }

  photo.hidden = false;
  fly.classList.add("has-photo");
}

function setJokeNudgeLine(line) {
  const nudge = document.getElementById("jokeNudge");
  if (nudge) {
    nudge.textContent = line;
  }
}

function showNextJokeNudge() {
  const line = JOKE_NUDGE_LINES[Math.min(jokeNudgeShown, JOKE_NUDGE_LINES.length - 1)];
  jokeNudgeShown += 1;
  setJokeNudgeLine(line);
  jokePage.classList.add("is-nudge");
}

function resetJokeScene() {
  const fly = document.getElementById("jokeGiftFly");
  const gift = document.getElementById("jokeGift");
  const party = document.getElementById("jokeParty");
  const drum = document.getElementById("jokeDrum");
  setJokePunchline();

  clearJokeTimers();
  giftUnwrapBusy = false;
  jokeNudgeShown = 0;
  setJokeNudgeLine(JOKE_NUDGE_LINES[0]);
  jokePage.classList.remove("is-intro", "is-opening", "is-opened", "is-gift-ready", "is-unwrapped", "is-punchline", "is-suspense", "is-nudge");

  if (fly) {
    fly.getAnimations().forEach((animation) => animation.cancel());
    fly.removeAttribute("style");
    fly.hidden = true;
    fly.classList.remove("is-unwrapping", "is-shaking", "is-leaving");
    setJokeGiftFrame(4);
  }

  if (gift) {
    resetGiftBox(gift);
  }

  if (party) {
    party.innerHTML = "";
    party.hidden = true;
    jokePage.appendChild(party);
  }

  if (drum) {
    drum.classList.remove("is-playing", "is-suspense", "is-marquee", "is-fall", "is-fading");
    drum.hidden = true;
    jokePage.appendChild(drum);
  }

  const suspense = document.getElementById("jokeSuspense");
  if (suspense) {
    suspense.textContent = "";
  }

  stopJokeDrumroll();
  stopJokeTada();
  stopJokeApplause();
}

function showJokeIntro() {
  resetJokeScene();
  jokePage.classList.add("is-intro");
  preloadJokeApplause();
}

function startJokeChallenge() {
  resetJokeScene();
  dropGiftFromTop();
}

function giftFlyPose(x, y, rotate = 0, scale = 1.28, squash = 1) {
  return `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rotate}deg) scale(${scale}, ${scale * squash})`;
}

function dropGiftFromTop() {
  const fly = document.getElementById("jokeGiftFly");
  if (!fly || jokePage.classList.contains("is-opening")) {
    return;
  }

  preloadJokeApplause();
  jokePage.classList.add("is-opening");
  fly.classList.remove("is-shaking");

  const x = window.innerWidth / 2;
  const floor = window.innerHeight * 0.7;

  fly.hidden = false;
  setJokeGiftFrame(2);
  afterJoke(380, () => setJokeGiftFrame(3));
  afterJoke(520, () => setJokeGiftFrame(4));
  const drop = fly.animate(
    [
      { transform: giftFlyPose(x, -220, -12, 0.58), opacity: 1, easing: "cubic-bezier(0.7, 0, 1, 0.18)" },
      { transform: giftFlyPose(x, floor, 4, 1.38, 0.72), offset: 0.3, easing: "cubic-bezier(0.18, 0.86, 0.28, 1)" },
      { transform: giftFlyPose(x, floor - 92, -9, 1.22), offset: 0.42, easing: "cubic-bezier(0.55, 0, 1, 0.28)" },
      { transform: giftFlyPose(x, floor, 5, 1.34, 0.78), offset: 0.54, easing: "cubic-bezier(0.18, 0.86, 0.28, 1)" },
      { transform: giftFlyPose(x, floor - 48, -5, 1.24), offset: 0.64, easing: "cubic-bezier(0.55, 0, 1, 0.28)" },
      { transform: giftFlyPose(x, floor, 3, 1.3, 0.86), offset: 0.74, easing: "cubic-bezier(0.18, 0.86, 0.28, 1)" },
      { transform: giftFlyPose(x, floor - 16, -2, 1.26), offset: 0.82, easing: "cubic-bezier(0.55, 0, 1, 0.28)" },
      { transform: giftFlyPose(x, floor, 0, 1.28), offset: 0.9 },
      { transform: giftFlyPose(x, floor, 0, 1.28), opacity: 1 },
    ],
    {
      duration: 1680,
      fill: "forwards",
    },
  );

  drop.addEventListener("finish", () => {
    const vanish = fly.animate(
      [
        { transform: giftFlyPose(x, floor, 0, 1.28), opacity: 1 },
        { transform: giftFlyPose(x, floor, 0, 0.35), opacity: 0 },
      ],
      {
        duration: 280,
        easing: "ease-in",
        fill: "forwards",
      },
    );

    vanish.addEventListener("finish", () => {
      fly.getAnimations().forEach((animation) => animation.cancel());
      fly.removeAttribute("style");
      fly.hidden = true;
      afterJoke(1500, revealCenterGift);
    });
  });
}

function revealCenterGift() {
  const fly = document.getElementById("jokeGiftFly");
  if (!fly) {
    return;
  }

  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;

  fly.hidden = false;
  fly.classList.remove("is-shaking");
  setJokeGiftFrame(4);
  jokePage.classList.add("is-opened", "is-gift-ready");

  const pop = fly.animate(
    [
      { transform: giftFlyPose(x, y, 0, 0.2), opacity: 0 },
      { transform: giftFlyPose(x, y, 0, 3.08), opacity: 1, offset: 0.7 },
      { transform: giftFlyPose(x, y, 0, 2.85), opacity: 1 },
    ],
    {
      duration: 420,
      easing: "cubic-bezier(0.22, 0.86, 0.2, 1)",
      fill: "forwards",
    },
  );

  pop.addEventListener("finish", () => {
    pop.commitStyles();
    pop.cancel();
    fly.classList.add("is-shaking");
  });
}

function popNestedGift(layer) {
  const fly = document.getElementById("jokeGiftFly");
  const gift = rebuildGiftBox(layer);
  if (!gift) {
    giftUnwrapBusy = false;
    return;
  }

  if (fly) {
    fly.hidden = false;
    fly.style.visibility = "";
    fly.style.opacity = "1";
    fly.classList.remove("is-unwrapping", "is-leaving");
    setJokeGiftFrame(4);
  }

  playJokeTada();
  showNextJokeNudge();
  fly?.classList.remove("is-shaking");
  afterJoke(3000, () => {
    jokePage.classList.remove("is-nudge");
    fly?.classList.add("is-shaking");
  });

  void gift.offsetWidth;
  gift.classList.add("is-nesting");
  afterJoke(1100, () => {
    gift.classList.remove("is-nesting");
    giftUnwrapBusy = false;
  });
}

function finishGiftLayer() {
  const fly = document.getElementById("jokeGiftFly");
  const gift = document.getElementById("jokeGift");
  const layer = Number(gift?.dataset.layer || 0);

  fly?.classList.remove("is-shaking");
  fly?.classList.add("is-leaving");
  jokePage.classList.remove("is-nudge");
  gift?.classList.add("is-fading");

  afterJoke(520, () => {
    if (fly) {
      fly.hidden = true;
    }

    if (layer + 1 < GIFT_LAYER_COUNT) {
      playGiftSuspense(layer + 1);
      return;
    }

    jokePage.classList.add("is-unwrapped");
    playGiftSuspense(GIFT_LAYER_COUNT);
  });
}

function unwrapSantaGift() {
  const fly = document.getElementById("jokeGiftFly");
  const gift = document.getElementById("jokeGift");
  const step = Number(gift?.dataset.step || 0);

  if (
    !gift ||
    giftUnwrapBusy ||
    !jokePage.classList.contains("is-gift-ready") ||
    step >= 4
  ) {
    return;
  }

  giftUnwrapBusy = true;
  fly?.classList.remove("is-shaking");

  if (fly?.classList.contains("has-photo")) {
    const next = step + 1;
    gift.dataset.step = String(next);
    setJokeGiftFrame(JOKE_GIFT_FRAMES[next]);
    if (next < 3) {
      afterJoke(280, () => {
        giftUnwrapBusy = false;
      });
      return;
    }

    afterJoke(420, finishGiftLayer);
    return;
  }

  fly?.classList.add("is-unwrapping");
  gift.classList.remove("is-untying");
  void gift.offsetWidth;
  gift.classList.add("is-untying");
  gift.dataset.step = String(step + 1);

  afterJoke(720, () => {
    gift.classList.remove("is-untying");

    if (Number(gift.dataset.step) < 4) {
      giftUnwrapBusy = false;
      return;
    }

    finishGiftLayer();
  });
}

function playDrumroll() {
  stopJokeDrumroll();
  resumeJokeAudio();

  const audio = new Audio("assets/drumroll.mp3");
  audio.volume = 0.78;
  jokeDrumroll = audio;

  return new Promise((resolve) => {
    const finish = () => {
      resolve(jokeDrumroll === audio);
    };

    audio.addEventListener("ended", finish, { once: true });
    audio.addEventListener("error", finish, { once: true });
    audio.play().catch(finish);
  });
}

function hideJokeDrum() {
  const drum = document.getElementById("jokeDrum");
  if (!drum) {
    return;
  }

  drum.classList.remove("is-playing", "is-suspense", "is-marquee", "is-fall", "is-fading");
  drum.hidden = true;
  stopJokeDrumroll();
}

function showJokeDrum() {
  const drum = document.getElementById("jokeDrum");
  const fly = document.getElementById("jokeGiftFly");

  if (fly) {
    fly.style.visibility = "hidden";
  }

  if (!drum) {
    return;
  }

  document.body.appendChild(drum);
  drum.hidden = false;
  drum.classList.remove("is-playing", "is-suspense", "is-marquee", "is-fall", "is-fading");
  void drum.offsetWidth;
  drum.classList.add("is-playing");
}

function parkJokeDrum() {
  const drum = document.getElementById("jokeDrum");
  if (drum) {
    jokePage.appendChild(drum);
  }
}

function playGiftSuspense(nextLayer) {
  const drum = document.getElementById("jokeDrum");
  const line = JOKE_SUSPENSE[nextLayer] || "";
  const suspense = document.getElementById("jokeSuspense");
  if (suspense) {
    if (line.startsWith("과연")) {
      const unit = "과연?!?";
      const strip = Array.from({ length: 8 }, () => unit).join("　　");
      suspense.innerHTML = `<span class="joke-suspense__track">${strip}　　${strip}</span>`;
    } else if (line === "두구두구" || line === "ㄷㄱㄷㄱ") {
      const col = Array.from({ length: 10 }, () => `<i>${line}</i>`).join("");
      suspense.innerHTML = `<span class="joke-suspense__fall">${col}${col}</span>`;
    } else {
      suspense.textContent = line;
    }
  }

  showJokeDrum();
  if (line) {
    drum?.classList.add("is-suspense");
    drum?.classList.toggle("is-marquee", line.startsWith("과연"));
    drum?.classList.toggle("is-fall", line === "두구두구" || line === "ㄷㄱㄷㄱ");
  }

  playDrumroll().then((finished) => {
    if (!finished) {
      return;
    }

    hideJokeDrum();
    parkJokeDrum();
    afterJoke(1000, () => {
      if (nextLayer < GIFT_LAYER_COUNT) {
        popNestedGift(nextLayer);
      } else {
        startPunchline();
      }
    });
  });
}

function startPunchline() {
  const fly = document.getElementById("jokeGiftFly");
  if (fly) {
    fly.hidden = true;
  }

  jokePage.classList.add("is-punchline");
  playJokeFanfare();
  afterJoke(650, () => {
    playJokeParty();
    playApplause();
    giftUnwrapBusy = false;
  });
}

function playJokeFanfare() {
  const context = resumeJokeAudio();
  if (!context) {
    return;
  }

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

function playNextGiftWait(layer) {
  playGiftSuspense(layer);
}

function jokePartyMarkup() {
  const colors = ["#e11d48", "#f59e0b", "#2563eb", "#22c55e", "#ec4899", "#facc15", "#38bdf8", "#ffffff"];
  const confetti = Array.from({ length: 90 }, (_, index) => {
    const left = (index * 11) % 100;
    const delay = (index % 14) * 0.07;
    const duration = 2.4 + (index % 6) * 0.22;
    const width = 10 + (index % 8);
    const height = 14 + (index % 9);
    const drift = (index % 2 === 0 ? -1 : 1) * (24 + (index % 8) * 12);
    return `<span class="joke-confetti__bit" style="left:${left}%;width:${width}px;height:${height}px;background:${colors[index % colors.length]};animation-delay:${delay}s;animation-duration:${duration}s;--drift:${drift}px"></span>`;
  }).join("");

  const bursts = [
    [22, 28],
    [78, 26],
    [30, 68],
    [72, 70],
    [50, 42],
  ]
    .map(([x, y], burst) => {
      const bits = Array.from({ length: 22 }, (_, index) => {
        const angle = (index / 22) * 360;
        const dist = 90 + (burst % 3) * 28 + (index % 5) * 10;
        return `<i class="joke-burst__bit" style="--angle:${angle}deg;--dist:${dist}px;--color:${colors[(index + burst) % colors.length]};animation-delay:${burst * 0.16}s"></i>`;
      }).join("");
      return `<div class="joke-burst" style="left:${x}%;top:${y}%">${bits}</div>`;
    })
    .join("");

  return `<div class="joke-confetti">${confetti}</div><div class="joke-bursts">${bursts}</div>`;
}

function playApplause() {
  stopJokeApplause();
  resumeJokeAudio();

  const audio = new Audio("assets/applause.mp3");
  audio.volume = 0.72;
  jokeApplause = audio;
  audio.play().catch(() => {});

  afterJoke(5600, () => {
    if (jokeApplause !== audio) {
      return;
    }

    const fadeStart = performance.now();
    const from = audio.volume;
    const fade = () => {
      if (jokeApplause !== audio) {
        return;
      }

      const t = Math.min(1, (performance.now() - fadeStart) / 900);
      audio.volume = from * (1 - t);
      if (t < 1) {
        window.requestAnimationFrame(fade);
        return;
      }

      stopJokeApplause();
    };

    fade();
  });
}

function playJokeParty() {
  const party = document.getElementById("jokeParty");
  if (!party) {
    return;
  }

  document.body.appendChild(party);
  party.hidden = false;
  party.innerHTML = jokePartyMarkup();
}

function playLastGiftWait() {
  playGiftSuspense(GIFT_LAYER_COUNT);
}

function showPage(page) {
  loginPage.hidden = page !== "login";
  userPage.hidden = page !== "user";
  adminPage.hidden = page !== "admin";
  jokePage.hidden = page !== "joke";
  document.body.classList.toggle("is-admin", page === "admin");
}

function currentResetAt() {
  return Number(localStorage.getItem(PROFILE_RESET_KEY) || 0);
}

function currentGameResetAt() {
  return Math.max(
    Number(localStorage.getItem(PROFILE_RESET_KEY) || 0),
    Number(localStorage.getItem(GAME_RESET_KEY) || 0),
  );
}

function setGameResetAt(resetAt) {
  const next = Math.max(Number(localStorage.getItem(GAME_RESET_KEY) || 0), Number(resetAt) || 0);
  localStorage.setItem(GAME_RESET_KEY, String(next));
  return next;
}

function bumpGameRound() {
  return setGameResetAt(Date.now());
}

function resetPlayUi() {
  stopPriceTalk();
  stopDrinkTalk();
  stopMenuReveal();
  cancelMenuSpin();
  stopWinnerTalk();
  if (userPlay) {
    userPlay.dataset.fanfare = "";
    userPlay.dataset.priceTalk = "";
    userPlay.dataset.drinkTalk = "";
    delete userPlay.dataset.menuReveal;
    delete userPlay.dataset.menuSpin;
    delete userPlay.dataset.winnerRun;
    delete userPlay.dataset.winnerReveal;
  }
  if (adminPlay) {
    adminPlay.dataset.fanfare = "";
    adminPlay.dataset.priceTalk = "";
    adminPlay.dataset.drinkTalk = "";
    delete adminPlay.dataset.menuReveal;
    delete adminPlay.dataset.menuSpin;
    delete adminPlay.dataset.winnerRun;
    delete adminPlay.dataset.winnerReveal;
  }
}

function applyIncomingGameReset(incoming) {
  const previous = Number(localStorage.getItem(GAME_RESET_KEY) || 0);
  const incomingReset = Math.max(
    Number(incoming?.gameResetAt || 0),
    Number(incoming?.game?.gameResetAt || 0),
  );
  if (incomingReset > previous) {
    setGameResetAt(incomingReset);
    gameState.drinks = emptyDrinks();
    gameState.menus = emptyMenus();
    gameState.personalSteps = emptyPersonalSteps();
    gameState.opened = emptyOpened();
    gameState.assignment = {};
    gameState.priceShares = {};
    gameState.resultPicked = { drink: false, price: false };
    gameState.boardReady = false;
    gameState.appeals = emptyAppeals();
    gameState.roulette = [];
    gameState.spin = emptySpin();
    resetPlayUi();
    if (isLateGamePhase(gameState.phase)) {
      gameState.game = gameState.pendingGame || "";
      gameState.phase = gameState.pendingGame ? "pick" : "idle";
    }
  } else if (incomingReset) {
    setGameResetAt(incomingReset);
  }
  return incomingReset;
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
  if (account.role !== "joke") {
    publishMqttOwn();
  }
  loginError.hidden = true;
  userLabel.textContent = account.id;
  refreshVisible();
}

function logout() {
  resetJokeScene();
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

  if (
    isGameActive() &&
    gameState.game === "game3" &&
    (gameState.phase === "winner-run" || gameState.phase === "winner-table") &&
    isWinnerPlayer()
  ) {
    userMain.hidden = true;
    userPlay.hidden = false;
    renderUserPlay();
    return;
  }

  if (
    isGameActive() &&
    isInCurrentGame() &&
    gameState.game !== "game3" &&
    (gameState.game !== "drink" || personalStep() !== "done")
  ) {
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

  if (currentAccount.role === "joke") {
    const firstOpen = jokePage.hidden;
    showPage("joke");
    if (firstOpen) {
      showJokeIntro();
    }
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
  const users = playAccounts();
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
        kind === "drink" && !gameState.resultPicked.price && currentAccount?.role === "admin"
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
  const flagSize = items.length <= 4 ? 34 : items.length <= 8 ? 26 : 20;
  const flagRadius = items.length <= 4 ? 78 : items.length <= 8 ? 72 : 64;
  const flagOf = (key) => MENU_FLAGS[key] || "";

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
        return `
          <path d="M ${center} ${center} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${MENU_COLORS[key]}" stroke="#fff7e6" stroke-width="2"></path>
        `;
      })
      .join("");
  }

  const flagsMarkup = items
    .map((key, index) => {
      const angle = items.length === 1 ? 0 : (index + 0.5) * (360 / items.length);
      const lift = items.length === 1 ? 52 : flagRadius;
      return `<span class="menu-roulette__flag" style="font-size:${flagSize}px;transform:translate(-50%,-50%) rotate(${angle}deg) translateY(-${lift}px) rotate(${-angle}deg)">${flagOf(key)}</span>`;
    })
    .join("");

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
      ${flagsMarkup}
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

function menuWinMarkup(winner, forAdmin = false) {
  const label = MENU_LABELS[winner] || winner;
  return `
    <div class="menu-win">
      ${menuConfettiMarkup()}
      <div class="menu-win__card">
        <p class="menu-win__title">축하합니다!</p>
        <p class="menu-win__prize">${escapeHtml(label)}당첨!</p>
        ${forAdmin ? `<button class="btn-primary next-btn" type="button" data-action="go-menu-meal">넘어가기</button>` : ""}
      </div>
    </div>
  `;
}

function winningMealLabel() {
  const spin = currentSpin();
  const winner = spin.winner || currentRoulette()[spin.targetIndex] || "";
  return MENU_LABELS[winner] || winner || "아직 없음";
}

function menuMealMarkup(forAdmin = false) {
  return `
    <div class="payout-screen">
      <p class="payout-label">식사</p>
      <p class="payout-value">${escapeHtml(winningMealLabel())}</p>
      ${forAdmin ? `<button class="btn-primary next-btn" type="button" data-action="go-main">넘어가기</button>` : ""}
    </div>
  `;
}

function menuRevealFinalMarkup(forAdmin = false) {
  return `
    <div class="menu-reveal">
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
    clearTimeout(menuSpinFrame);
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

  container.insertAdjacentHTML("beforeend", menuWinMarkup(winner, container === adminPlay));
  playFanfare();
}

function startMenuSpinAnimation(container) {
  const spin = currentSpin();
  const slices = currentRoulette();
  const wheel = container.querySelector(".menu-roulette__spin");
  if (!spin.startedAt || !wheel) {
    return;
  }

  const items = slices.length ? slices : sanitizeRoulette([spin.winner]);
  if (!items.length) {
    showMenuWin(container, spin.winner);
    return;
  }

  const total = spinRotation(
    {
      ...spin,
      targetIndex: items[spin.targetIndex] ? spin.targetIndex : Math.max(0, items.indexOf(spin.winner)),
    },
    items,
  );
  const key = spinKey(spin);
  if (container.dataset.menuSpin === key && wheel.dataset.spinning === "1") {
    return;
  }

  cancelMenuSpin();
  container.dataset.menuSpin = key;
  wheel.dataset.spinning = "1";

  const finish = () => {
    if (container.dataset.menuSpin !== key) {
      return;
    }

    wheel.style.transition = "none";
    wheel.style.transform = `rotate(${total}deg)`;
    showMenuWin(container, spin.winner || items[spin.targetIndex]);
  };

  const elapsed = Math.max(0, Date.now() - spin.startedAt);
  if (elapsed >= spin.duration) {
    finish();
    return;
  }

  const progress = elapsed / spin.duration;
  const startRot = total * easeOutQuint(progress);
  const remaining = spin.duration - elapsed;
  wheel.style.transition = "none";
  wheel.style.transform = `rotate(${startRot}deg)`;
  void wheel.offsetWidth;
  wheel.style.transition = `transform ${remaining}ms cubic-bezier(0.05, 0.78, 0.02, 1)`;
  wheel.style.transform = `rotate(${total}deg)`;
  wheel.addEventListener(
    "transitionend",
    (event) => {
      if (event.propertyName && event.propertyName !== "transform") {
        return;
      }
      finish();
    },
    { once: true },
  );
  menuSpinFrame = window.setTimeout(finish, remaining + 120);
}

function prepareMenuSpinStage(container) {
  if (!container.querySelector(".menu-roulette__spin")) {
    container.innerHTML = menuSpinStageMarkup();
    return;
  }

  container.querySelector(".menu-tally")?.remove();
  container.querySelector(".menu-reveal__intro")?.remove();
  container.querySelector("[data-action='spin-menu-result']")?.remove();
  container.querySelector(".menu-reveal")?.classList.add("menu-reveal--spin");
}

function renderMenuSpin(container) {
  const spin = currentSpin();
  const key = spinKey(spin);
  const wheel = container.querySelector(".menu-roulette__spin");
  if (container.dataset.menuSpin === key && wheel?.dataset.spinning === "1") {
    return;
  }

  prepareMenuSpinStage(container);
  startMenuSpinAnimation(container);
}

function beginMenuSpin() {
  const slices = ensureRoulette();
  if (!slices.length) {
    return;
  }

  const targetIndex = Math.floor(Math.random() * slices.length);
  const winner = slices[targetIndex];
  if (!MENU_OPTIONS.includes(winner)) {
    return;
  }

  gameState.spin = {
    targetIndex,
    winner,
    turns: 14 + Math.floor(Math.random() * 4),
    duration: 5200,
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
  const stage = container.querySelector(".menu-reveal");
  if (!stage) {
    return;
  }

  const list = document.createElement("div");
  list.className = "menu-tally";
  stage.append(list);

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

  await delay(900);
  if (token !== menuTalkToken) {
    return;
  }

  list.classList.add("is-out");
  await delay(420);
  if (token !== menuTalkToken) {
    return;
  }

  list.remove();
  stage.insertAdjacentHTML("beforeend", menuRouletteMarkup(currentRoulette()));
  const wheel = stage.querySelector(".menu-roulette");
  if (wheel) {
    void wheel.offsetWidth;
    wheel.classList.add("is-in");
  }

  if (container === adminPlay && !stage.querySelector("[data-action='spin-menu-result']")) {
    stage.insertAdjacentHTML("beforeend", menuSpinButtonMarkup());
  }

  if (token === menuTalkToken) {
    container.dataset.menuReveal = "done";
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
  ensureRoulette();
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

function priceRankFor(id) {
  const mine = Number(gameState.priceShares[id] || 0);
  return gamePlayers().filter((other) => Number(gameState.priceShares[other] || 0) > mine).length + 1;
}

function currentPriceRank() {
  return currentAccount ? priceRankFor(currentAccount.id) : 1;
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

function assignedGiverNickname() {
  const giverId = currentAccount ? gameState.assignment[currentAccount.id] : "";
  const profile = giverId ? profiles[giverId] : null;
  return profile?.nickname || profile?.name || giverId || "누군가";
}

function drinkTalkNextMarkup(forAdmin, action = "go-price") {
  if (!forAdmin) {
    return "";
  }

  return `<button class="btn-primary next-btn" type="button" data-action="${escapeAttr(action)}">넘어가기</button>`;
}

function drinkTalkFinishedMarkup(forAdmin) {
  const nick = assignedGiverNickname();
  const drinkName = assignedDrinkName();
  return `
    <div class="ai-talk ai-talk--drink">
      ${menuConfettiMarkup()}
      <p class="ai-talk__line">당신이 마실 음료명을 알려드리겠습니다.</p>
      <p class="ai-talk__line">당신이 마실 음료는,</p>
      <p class="ai-talk__line"><span class="drink-accent">${escapeHtml(nick)}</span>님이 작성해주신</p>
      <p class="ai-talk__line"><span class="drink-accent">${escapeHtml(drinkName)}</span> 입니다.</p>
      <p class="celebrate-title drink-celebrate">축하합니다!</p>
      ${drinkTalkNextMarkup(forAdmin, "go-drink-board")}
    </div>
  `;
}

function drinkAssignmentTableMarkup(forAdmin) {
  const rows = playerAccounts()
    .map((account) => {
      const profile = profiles[account.id] || emptyUserProfile();
      const giverId = gameState.assignment[account.id];
      const drinkName = giverId ? gameState.drinks[giverId]?.name || "" : "";
      const giver = giverId ? profiles[giverId] || emptyUserProfile() : emptyUserProfile();
      const giverNick = giver.nickname || giver.name || giverId || "-";

      return `
        <tr>
          <td>${escapeHtml(profile.name || account.id)}</td>
          <td>${escapeHtml(drinkName || "-")}</td>
          <td>${escapeHtml(giverNick)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="result-screen">
      <div class="result-table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>음료</th>
              <th>음료를 지정해준 사용자</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${drinkTalkNextMarkup(forAdmin)}
    </div>
  `;
}

function stopDrinkTalk() {
  drinkTalkToken += 1;
}

function clearDrinkTalk(container) {
  if (!container?.dataset.drinkTalk) {
    return;
  }

  stopDrinkTalk();
  delete container.dataset.drinkTalk;
}

function isDrinkTalkBusy() {
  return userPlay?.dataset.drinkTalk === "running" || adminPlay?.dataset.drinkTalk === "running";
}

function isAdminDrinkBoard(container) {
  return container === adminPlay && currentAccount?.role === "admin";
}

function showDrinkBoard(container) {
  container.innerHTML = drinkAssignmentTableMarkup(isAdminDrinkBoard(container));
}

async function runDrinkTalk(container, token) {
  const intro = container.querySelector("[data-drink-intro]");
  const lead = container.querySelector("[data-drink-lead]");
  const giver = container.querySelector("[data-drink-giver]");
  const drinkLine = container.querySelector("[data-drink-name]");
  if (!intro || !lead || !giver || !drinkLine) {
    return;
  }

  const introDone = await typeChunks(
    intro,
    [{ text: "당신이 마실 음료명을 알려드리겠습니다.", cls: "" }],
    token,
    () => drinkTalkToken,
  );
  if (!introDone) {
    return;
  }

  await delay(3000);
  if (token !== drinkTalkToken) {
    return;
  }

  const leadDone = await typeChunks(
    lead,
    [{ text: "당신이 마실 음료는,", cls: "" }],
    token,
    () => drinkTalkToken,
  );
  if (!leadDone) {
    return;
  }

  await delay(1500);
  if (token !== drinkTalkToken) {
    return;
  }

  const nickDone = await typeChunks(
    giver,
    [
      { text: assignedGiverNickname(), cls: "drink-accent" },
      { text: "님이 작성해주신", cls: "" },
    ],
    token,
    () => drinkTalkToken,
  );
  if (!nickDone) {
    return;
  }

  await delay(1500);
  if (token !== drinkTalkToken) {
    return;
  }

  const nameDone = await typeChunks(
    drinkLine,
    [
      { text: assignedDrinkName(), cls: "drink-accent" },
      { text: " 입니다.", cls: "" },
    ],
    token,
    () => drinkTalkToken,
  );
  if (!nameDone) {
    return;
  }

  await delay(400);
  if (token !== drinkTalkToken) {
    return;
  }

  const talk = container.querySelector(".ai-talk--drink");
  if (talk && !talk.querySelector(".menu-confetti")) {
    talk.insertAdjacentHTML("afterbegin", menuConfettiMarkup());
  }

  if (talk && !talk.querySelector(".drink-celebrate")) {
    talk.insertAdjacentHTML("beforeend", `<p class="celebrate-title drink-celebrate">축하합니다!</p>`);
  }

  if (isAdminDrinkBoard(container) && talk && !talk.querySelector("[data-action='go-drink-board']")) {
    talk.insertAdjacentHTML("beforeend", drinkTalkNextMarkup(true, "go-drink-board"));
  }

  container.dataset.drinkTalk = "done";
}

function renderDrinkTalk(container) {
  if (gameState.phase === "drink-board" && gameState.boardReady) {
    showDrinkBoard(container);
    return;
  }

  if (container.dataset.drinkTalk === "running") {
    return;
  }

  if (container.dataset.drinkTalk === "done") {
    if (!container.querySelector(".drink-celebrate")) {
      container.innerHTML = drinkTalkFinishedMarkup(isAdminDrinkBoard(container));
    }
    return;
  }

  container.dataset.drinkTalk = "running";
  container.innerHTML = `
    <div class="ai-talk ai-talk--drink">
      <p class="ai-talk__line" data-drink-intro></p>
      <p class="ai-talk__line" data-drink-lead></p>
      <p class="ai-talk__line" data-drink-giver></p>
      <p class="ai-talk__line" data-drink-name></p>
    </div>
  `;

  runDrinkTalk(container, ++drinkTalkToken);
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
  const next =
    currentAccount?.role === "admin"
      ? `<button class="btn-primary next-btn" type="button" data-action="go-payout">넘어가기</button>`
      : "";
  return `
    <div class="celebrate-screen">
      <p class="celebrate-title">축하합니다!</p>
      <p class="celebrate-lead">당신은 <span class="drink-accent">${escapeHtml(String(currentPriceRank()))}위</span> 입니다.</p>
      <p class="celebrate-lead"><span class="price-accent">${escapeHtml(amount)}</span>이 당첨되셨습니다.</p>
      ${next}
    </div>
  `;
}

function currentAppeal() {
  if (!currentAccount) {
    return { drink: false, price: false, submitted: false };
  }

  if (!gameState.appeals) {
    gameState.appeals = emptyAppeals();
  }

  if (!gameState.appeals[currentAccount.id]) {
    gameState.appeals[currentAccount.id] = { drink: false, price: false, submitted: false };
  }

  return gameState.appeals[currentAccount.id];
}

function submitAppeal() {
  const appeal = currentAppeal();
  if (!appeal || appeal.submitted) {
    return;
  }

  const form = document.querySelector("form[data-form='appeal']");
  const drink = Boolean(form?.querySelector('input[name="appealDrink"]')?.checked);
  const price = Boolean(form?.querySelector('input[name="appealPrice"]')?.checked);
  if (!drink && !price) {
    return;
  }

  appeal.drink = drink;
  appeal.price = price;
  appeal.submitted = true;
  saveGame({ immediate: true });
  publishMqttAppeal(currentAccount.id);
  form?.querySelector(".appeal-box__submit")?.remove();
  updateAppealTallyView();
}

function appealVoteCount(kind) {
  return gamePlayers().filter((id) => gameState.appeals?.[id]?.submitted && gameState.appeals[id][kind]).length;
}

function appealMajorityNeed() {
  return Math.floor(gamePlayers().length / 2) + 1;
}

function appealTallyMarkup() {
  const need = appealMajorityNeed();
  const drinkVotes = appealVoteCount("drink");
  const priceVotes = appealVoteCount("price");
  const drinkRedo = drinkVotes >= need && need > 0;
  const priceRedo = priceVotes >= need && need > 0;
  const rows = [
    { label: "음료", votes: drinkVotes, redo: drinkRedo },
    { label: "금액", votes: priceVotes, redo: priceRedo },
  ]
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          <td>${escapeHtml(`${row.votes}표`)}</td>
          <td>${row.redo ? "재투표" : "유지"}</td>
        </tr>
      `,
    )
    .join("");

  const adminRedo = currentAccount?.role !== "admin" || (!drinkRedo && !priceRedo)
    ? ""
    : drinkRedo && priceRedo
      ? `
        <div class="appeal-redo">
          <button class="btn-primary" type="button" data-action="redo-all">전체 재투표</button>
        </div>
      `
      : `
        <div class="appeal-redo">
          ${drinkRedo ? `<button class="btn-primary" type="button" data-action="redo-drink">음료 재투표</button>` : ""}
          ${priceRedo ? `<button class="btn-primary" type="button" data-action="redo-price">금액 재투표</button>` : ""}
        </div>
      `;

  return `
    <div class="appeal-tally">
      <button class="btn-text refresh-btn" type="button" data-action="refresh-appeals">새로고침</button>
      <div class="result-table-wrap">
        <table class="result-table appeal-tally__table">
          <thead>
            <tr>
              <th>음료/금액</th>
              <th>몇 표</th>
              <th>재투표/유지</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${adminRedo}
    </div>
  `;
}

function updateAppealTallyView() {
  const current = document.querySelector(".appeal-tally");
  if (!current) {
    return;
  }

  const next = document.createElement("div");
  next.innerHTML = appealTallyMarkup();
  const replacement = next.querySelector(".appeal-tally");
  if (replacement) {
    current.replaceWith(replacement);
  }
}

function refreshAppeals() {
  gameState = mergeGameState(gameState, loadGame());
  persistGameLocal();
  publishMqttHello();
  publishMqttKnownAppeals();
  publishMqttGame();
  refreshVisible();
}

function appealMarkup() {
  const appeal = currentAppeal();
  const submit = appeal.submitted
    ? ""
    : `<button class="btn-primary appeal-box__submit" type="button" data-action="submit-appeal">이의신청하기</button>`;

  return `
    <form class="appeal-box" data-form="appeal">
      <div class="appeal-box__row">
        <label class="appeal-box__check">
          <input type="checkbox" name="appealDrink"${appeal.drink ? " checked" : ""}>
          <span>음료</span>
        </label>
        <label class="appeal-box__check">
          <input type="checkbox" name="appealPrice"${appeal.price ? " checked" : ""}>
          <span>금액</span>
        </label>
        ${submit}
      </div>
      <p class="appeal-box__hint">과반수 이상일 경우, 다시 돌립니다!</p>
    </form>
  `;
}

function resultTableMarkup() {
  const rows = [...playerAccounts()]
    .sort((left, right) => {
      const payGap = Number(gameState.priceShares[right.id] || 0) - Number(gameState.priceShares[left.id] || 0);
      if (payGap) {
        return payGap;
      }
      return priceRankFor(left.id) - priceRankFor(right.id);
    })
    .map((account) => {
      const profile = profiles[account.id] || { name: "" };
      const giverId = gameState.assignment[account.id];
      const drinkName = giverId ? gameState.drinks[giverId]?.name || "" : "";
      const pay = Number(gameState.priceShares[account.id] || 0);

      return `
        <tr>
          <td>${escapeHtml(String(priceRankFor(account.id)))}</td>
          <td>${escapeHtml(profile.name || account.id)}</td>
          <td>${escapeHtml(drinkName || "-")}</td>
          <td>${escapeHtml(`${pay.toLocaleString("ko-KR")}원`)}</td>
        </tr>
      `;
    })
    .join("");

  const next =
    currentAccount?.role === "admin"
      ? `<button class="btn-primary" type="button" data-action="go-main">메인으로</button>`
      : "";

  return `
    <div class="result-screen">
      <div class="result-table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>이름</th>
              <th>음료명</th>
              <th>지불금액</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${next}
      ${gameState.appealClosed ? "" : `${appealMarkup()}${appealTallyMarkup()}`}
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
    const slot = slots[index];
    slot.classList.add("is-spinning");

    for (let tick = 0; tick < 8; tick += 1) {
      if (token !== priceTalkToken) {
        return;
      }

      slot.textContent = String(Math.floor(Math.random() * 10));
      slot.classList.add("is-pop");
      await delay(160 + tick * 30);
      if (token !== priceTalkToken) {
        return;
      }

      slot.classList.remove("is-pop");
    }

    if (token !== priceTalkToken) {
      return;
    }

    slot.textContent = digits[index];
    slot.classList.add("is-pop");
    await delay(900);
    if (token !== priceTalkToken) {
      return;
    }

    slot.classList.remove("is-pop", "is-spinning");
    slot.classList.add("is-filled");
    await delay(450);
  }
}

async function runPriceTalk(container, token) {
  const lead = container.querySelector("[data-price-lead]");
  const total = container.querySelector("[data-price-total]");
  if (!lead || !total) {
    return;
  }

  const leadDone = await typeChunks(
    lead,
    [{ text: "우리가 고른 메뉴들의 총 금액은", cls: "" }],
    token,
  );
  if (!leadDone) {
    return;
  }

  await delay(2000);
  if (token !== priceTalkToken) {
    return;
  }

  const priceText = `${totalDrinkPrice().toLocaleString("ko-KR")}원`;
  const totalDone = await typeChunks(
    total,
    [
      { text: priceText, cls: "drink-accent price-total-accent" },
      { text: " 입니다.", cls: "" },
    ],
    token,
  );
  if (!totalDone) {
    return;
  }

  const accent = total.querySelector(".price-total-accent");
  if (accent) {
    accent.classList.add("is-pop");
  }

  await delay(3000);
  if (token !== priceTalkToken) {
    return;
  }

  const talk = container.querySelector(".ai-talk");
  if (!talk) {
    return;
  }

  lead.replaceChildren();
  total.replaceChildren();
  lead.removeAttribute("data-price-lead");
  total.remove();

  const nextLine = lead;
  nextLine.setAttribute("data-price-next", "");
  const nextDone = await typeChunks(
    nextLine,
    [{ text: "당신이 지불할 금액을 알려드리겠습니다.", cls: "" }],
    token,
  );
  if (!nextDone) {
    return;
  }

  await delay(800);
  if (token !== priceTalkToken) {
    return;
  }

  await revealPriceDigits(talk, token);
  if (token !== priceTalkToken) {
    return;
  }

  await delay(800);
  if (token !== priceTalkToken) {
    return;
  }

  const rankLead = document.createElement("p");
  rankLead.className = "ai-talk__line";
  const rankLine = document.createElement("p");
  rankLine.className = "ai-talk__line";
  talk.append(rankLead, rankLine);

  const rankLeadDone = await typeChunks(
    rankLead,
    [{ text: "당신의 금액 기여도는", cls: "" }],
    token,
  );
  if (!rankLeadDone) {
    return;
  }

  await delay(2000);
  if (token !== priceTalkToken) {
    return;
  }

  const rankDone = await typeChunks(
    rankLine,
    [
      { text: `${currentPriceRank()}위`, cls: "drink-accent price-total-accent" },
      { text: " 입니다.", cls: "" },
    ],
    token,
  );
  if (!rankDone) {
    return;
  }

  const rankAccent = rankLine.querySelector(".price-total-accent");
  if (rankAccent) {
    rankAccent.classList.add("is-pop");
  }

  await delay(6000);
  if (token !== priceTalkToken) {
    return;
  }

  container.dataset.priceTalk = "done";
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

  if (container.dataset.priceTalk === "done") {
    return;
  }

  container.dataset.priceTalk = "running";
  container.innerHTML = `
    <div class="ai-talk ai-talk--drink">
      <p class="ai-talk__line" data-price-lead></p>
      <p class="ai-talk__line" data-price-total></p>
    </div>
  `;

  runPriceTalk(container, ++priceTalkToken);
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

  if (gameState.game === "game3") {
    if (currentAccount?.role !== "admin") {
      return waitMarkup("관리자의 선택을 기다리는중..");
    }

    if (gameState.miniMenu === "winner" || gameState.phase === "winner-mode") {
      return `
        <div class="game-choices">
          ${WINNER_MODE_CHOICES.map(
            (mode) => `
              <button class="btn-primary" type="button" data-winner-mode="${escapeAttr(mode.id)}">
                ${escapeHtml(mode.label)}
              </button>
            `,
          ).join("")}
        </div>
      `;
    }

    return `
      <div class="game-choices">
        ${MINI_GAME_CHOICES.map(
          (game) => `
            <button class="btn-primary" type="button" data-mini="${escapeAttr(game.id)}">
              ${escapeHtml(game.label)}
            </button>
          `,
        ).join("")}
        <button class="btn-primary" type="button" data-action="go-main">메인으로</button>
      </div>
    `;
  }

  return `<div class="wait-screen"><p>게임 진행</p></div>`;
}

let winnerTalkToken = 0;

function stopWinnerTalk() {
  winnerTalkToken += 1;
}

function winnerBoxEmoji(color) {
  return WINNER_BOX_EMOJI[color] || "🎁";
}

function winnerBoxesMarkup() {
  const boxes = sanitizeWinnerBoxes(gameState.winnerBoxes);
  return boxes
    .map(
      (box) => `
        <button class="winner-box winner-box--${escapeAttr(box.color)}" type="button" data-winner-box="${escapeAttr(box.id)}" ${gameState.winnerPicks?.[box.id] ? "hidden" : ""}>
          <span class="winner-box__emoji" aria-hidden="true">${winnerBoxEmoji(box.color)}</span>
        </button>
      `,
    )
    .join("");
}

function winnerStageMarkup() {
  return `
    <div class="winner-stage">
      <p class="winner-line" data-winner-talk></p>
      <div class="winner-prompt" data-winner-prompt hidden>
        <p class="winner-line" data-winner-prompt-1></p>
        <p class="winner-line" data-winner-prompt-2></p>
      </div>
      <p class="winner-count" data-winner-count hidden></p>
      <p class="winner-line" data-winner-reveal hidden></p>
      <div class="winner-result" data-winner-result hidden>
        <p class="winner-line" data-winner-lead></p>
        <p class="winner-line" data-winner-congrats></p>
        <p class="winner-line" data-winner-person></p>
        <p class="winner-line" data-winner-win></p>
      </div>
      <div class="winner-boxes" data-winner-boxes hidden>${winnerBoxesMarkup()}</div>
      <button class="btn-primary next-btn" type="button" data-action="go-winner-table" hidden>넘어가기</button>
    </div>
  `;
}

function syncWinnerBoxes(container) {
  const wrap = container.querySelector("[data-winner-boxes]");
  if (!wrap) {
    return;
  }

  wrap.querySelectorAll("[data-winner-box]").forEach((button) => {
    button.hidden = Boolean(gameState.winnerPicks?.[button.dataset.winnerBox]);
  });
}

function showWinnerReveal(container) {
  runWinnerReveal(container);
}

async function runWinnerReveal(container) {
  if (container.dataset.winnerReveal === "running" || container.dataset.winnerReveal === "done") {
    return;
  }

  const talk = container.querySelector("[data-winner-talk]");
  const prompt = container.querySelector("[data-winner-prompt]");
  const count = container.querySelector("[data-winner-count]");
  const boxes = container.querySelector("[data-winner-boxes]");
  const reveal = container.querySelector("[data-winner-reveal]");
  const result = container.querySelector("[data-winner-result]");
  const lead = container.querySelector("[data-winner-lead]");
  const congrats = container.querySelector("[data-winner-congrats]");
  const person = container.querySelector("[data-winner-person]");
  const win = container.querySelector("[data-winner-win]");
  if (!reveal || !result || !lead || !congrats || !person || !win) {
    return;
  }

  container.dataset.winnerReveal = "running";
  const token = ++winnerTalkToken;
  const winnerId = ensureWinnerId();
  const winnerName = winnerPersonName(winnerId);

  if (talk) {
    talk.hidden = true;
    talk.textContent = "";
  }
  if (prompt) {
    prompt.hidden = true;
  }
  if (count) {
    count.hidden = true;
    count.textContent = "";
  }
  if (boxes) {
    boxes.hidden = true;
  }

  reveal.hidden = false;
  reveal.textContent = "";
  const openDone = await typeChunks(
    reveal,
    [{ text: "자. 이제 공개하겠습니다.", cls: "" }],
    token,
    () => winnerTalkToken,
  );
  if (!openDone) {
    return;
  }

  await delay(1500);
  if (token !== winnerTalkToken) {
    return;
  }

  reveal.hidden = true;
  reveal.textContent = "";
  result.hidden = false;

  const leadDone = await typeChunks(lead, [{ text: "결과는?", cls: "" }], token, () => winnerTalkToken);
  if (!leadDone) {
    return;
  }

  await delay(1500);
  if (token !== winnerTalkToken) {
    return;
  }

  const congratsDone = await typeChunks(congrats, [{ text: "축하합니다.", cls: "" }], token, () => winnerTalkToken);
  if (!congratsDone) {
    return;
  }
  const personDone = await typeChunks(
    person,
    [{ text: `${winnerName}님,`, cls: "drink-accent" }],
    token,
    () => winnerTalkToken,
  );
  if (!personDone) {
    return;
  }
  const winDone = await typeChunks(win, [{ text: "당첨입니다!", cls: "" }], token, () => winnerTalkToken);
  if (!winDone) {
    return;
  }

  if (currentAccount?.id === winnerId && !container.querySelector(".menu-confetti")) {
    container.insertAdjacentHTML("afterbegin", menuConfettiMarkup());
  }

  showWinnerNextButton(container);
  container.dataset.winnerReveal = "done";
}

function showWinnerNextButton(container) {
  const next = container.querySelector("[data-action='go-winner-table']");
  if (!next || currentAccount?.role !== "admin") {
    return;
  }

  next.hidden = false;
}

async function popWinnerCount(line, text, token) {
  line.hidden = false;
  line.textContent = text;
  line.classList.remove("is-pop");
  void line.offsetWidth;
  line.classList.add("is-pop");
  await delay(900);
  return token === winnerTalkToken;
}

async function runWinnerSequence(container) {
  const token = ++winnerTalkToken;
  const talk = container.querySelector("[data-winner-talk]");
  const prompt = container.querySelector("[data-winner-prompt]");
  const prompt1 = container.querySelector("[data-winner-prompt-1]");
  const prompt2 = container.querySelector("[data-winner-prompt-2]");
  const count = container.querySelector("[data-winner-count]");
  const boxes = container.querySelector("[data-winner-boxes]");
  if (!talk || !prompt || !prompt1 || !prompt2 || !count || !boxes) {
    return;
  }

  syncWinnerBoxes(container);

  if (allWinnerBoxesTaken()) {
    showWinnerReveal(container);
    return;
  }

  if (hasAnyWinnerPick()) {
    talk.hidden = true;
    prompt.hidden = true;
    count.hidden = true;
    boxes.hidden = false;
    boxes.classList.add("is-live");
    return;
  }

  talk.hidden = false;
  const introDone = await typeChunks(talk, [{ text: "당첨자를 뽑아보겠습니다.", cls: "" }], token, () => winnerTalkToken);
  if (!introDone) {
    return;
  }

  await delay(1500);
  if (token !== winnerTalkToken) {
    return;
  }

  talk.textContent = "";
  talk.hidden = true;
  boxes.hidden = false;
  syncWinnerBoxes(container);

  prompt.hidden = false;
  const line1Done = await typeChunks(prompt1, [{ text: "마음에 드는 상자를", cls: "" }], token, () => winnerTalkToken);
  if (!line1Done) {
    return;
  }
  const line2Done = await typeChunks(prompt2, [{ text: "클릭해주세요.", cls: "" }], token, () => winnerTalkToken);
  if (!line2Done) {
    return;
  }

  await delay(1200);
  if (token !== winnerTalkToken) {
    return;
  }

  prompt.hidden = true;
  prompt1.textContent = "";
  prompt2.textContent = "";

  for (const word of ["3", "2", "1", "start"]) {
    if (!(await popWinnerCount(count, word, token))) {
      return;
    }
  }

  count.hidden = true;
  count.textContent = "";
  boxes.classList.add("is-live");
  if (allWinnerBoxesTaken()) {
    showWinnerReveal(container);
  }
}

function renderWinnerRun(container) {
  if (container.dataset.winnerRun === "1") {
    syncWinnerBoxes(container);
    if (allWinnerBoxesTaken()) {
      showWinnerReveal(container);
      if (container.dataset.winnerReveal === "done") {
        showWinnerNextButton(container);
      }
    }
    return;
  }

  container.dataset.winnerRun = "1";
  container.innerHTML = winnerStageMarkup();
  runWinnerSequence(container);
}

function winnerTableMarkup() {
  const people = buildWinnerBoard(gameState);
  const rows = people
    .map((row) => {
      const result = row.win ? "당첨" : "꽝";
      return `
        <div class="winner-board__row">
          <span class="winner-board__name">${escapeHtml(row.name || winnerPersonName(row.id))}</span>
          <span class="winner-board__mark${row.win ? " is-win" : ""}">${escapeHtml(result)}</span>
        </div>
      `;
    })
    .join("");
  const next =
    currentAccount?.role === "admin"
      ? `<button class="btn-primary next-btn" type="button" data-action="go-winner-table-next">넘어가기</button>`
      : "";

  return `
    <div class="winner-board">
      <div class="winner-board__row winner-board__row--head">
        <span>이름</span>
        <span>당첨</span>
      </div>
      ${rows}
      ${next}
    </div>
  `;
}

function renderWinnerTable(container) {
  const key = JSON.stringify({
    board: buildWinnerBoard(gameState),
    admin: currentAccount?.role === "admin",
  });
  if (container.dataset.winnerTable === key) {
    return;
  }

  container.dataset.winnerTable = key;
  container.innerHTML = winnerTableMarkup();
}

function goToWinnerTable() {
  if (currentAccount?.role !== "admin" || gameState.game !== "game3") {
    return;
  }

  ensureWinnerId();
  gameState.winnerBoard = snapshotWinnerBoard();
  gameState.phase = "winner-table";
  gameState.winnerRound = Date.now();
  saveGame({ immediate: true });
  refreshVisible();
}

function goToMiniGameMain() {
  if (currentAccount?.role !== "admin" || gameState.game !== "game3") {
    return;
  }

  gameState.phase = "play";
  gameState.miniMenu = "";
  gameState.winnerMode = "";
  gameState.winnerPlayers = [];
  gameState.winnerBoxes = [];
  gameState.winnerPicks = {};
  gameState.winnerId = "";
  gameState.winnerBoard = [];
  gameState.winnerRound = Date.now();
  resetPlayUi();
  saveGame({ immediate: true });
  refreshVisible();
}

function clearWinnerRun(container) {
  if (!container?.dataset.winnerRun && !container?.dataset.winnerTable) {
    return;
  }

  stopWinnerTalk();
  delete container.dataset.winnerRun;
  delete container.dataset.winnerReveal;
  delete container.dataset.winnerTable;
}

function renderMiniGame(container) {
  if (gameState.phase !== "winner-run" && container?.dataset.winnerRun) {
    stopWinnerTalk();
    delete container.dataset.winnerRun;
    delete container.dataset.winnerReveal;
  }

  if (gameState.phase !== "winner-table") {
    delete container.dataset.winnerTable;
  }

  if (gameState.phase === "winner-pick") {
    if (currentAccount?.role === "admin") {
      container.innerHTML = playerPickMarkup();
      return;
    }

    container.innerHTML = waitMarkup("관리자의 선택을 기다리는중..");
    return;
  }

  if (gameState.phase === "winner-run") {
    renderWinnerRun(container);
    return;
  }

  if (gameState.phase === "winner-table") {
    renderWinnerTable(container);
    return;
  }

  container.innerHTML = otherGamePlayMarkup();
}

function beginImmediateWinner() {
  if (currentAccount?.role !== "admin" || gameState.game !== "game3") {
    return;
  }

  gameState.miniMenu = "winner";
  gameState.winnerMode = "immediate";
  gameState.phase = "winner-pick";
  gameState.winnerRound = Date.now();
  gameState.winnerPlayers = [];
  gameState.winnerBoxes = [];
  gameState.winnerPicks = {};
  gameState.winnerId = "";
  gameState.winnerBoard = [];
  saveGame({ immediate: true });
  refreshVisible();
}

function confirmWinnerPlayerPick() {
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

  gameState.winnerPlayers = players;
  gameState.winnerRound = Date.now();
  gameState.winnerBoxes = players.map((_, index) => ({
    id: String(index),
    color: WINNER_BOX_COLORS[index % WINNER_BOX_COLORS.length],
  }));
  gameState.winnerPicks = {};
  gameState.winnerId = "";
  gameState.phase = "winner-run";
  saveGame({ immediate: true });
  refreshVisible();
}

function pickWinnerBox(boxId) {
  const live = document.querySelector(".winner-boxes.is-live");
  if (!live || gameState.phase !== "winner-run" || !isWinnerPlayer()) {
    return;
  }

  if (currentWinnerPick() || gameState.winnerPicks?.[boxId]) {
    return;
  }

  gameState.winnerPicks = { ...gameState.winnerPicks, [boxId]: currentAccount.id };
  saveGame({ immediate: true });
  publishMqttWinnerPick(boxId);
  syncWinnerBoxes(live.closest(".winner-stage")?.parentElement || live.parentElement);
  if (userPlay) {
    syncWinnerBoxes(userPlay);
    if (allWinnerBoxesTaken()) {
      showWinnerReveal(userPlay);
    }
  }
  if (adminPlay) {
    syncWinnerBoxes(adminPlay);
    if (allWinnerBoxesTaken()) {
      showWinnerReveal(adminPlay);
    }
  }
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
    if (gameState.phase !== "menu-reveal" && gameState.phase !== "choose") {
      clearMenuReveal(userPlay);
    }

    if (gameState.phase !== "menu-spin") {
      clearMenuSpin(userPlay);
    }

    if (gameState.phase === "menu-reveal" || gameState.phase === "choose") {
      renderMenuReveal(userPlay);
      return;
    }

    if (gameState.phase === "menu-spin") {
      renderMenuSpin(userPlay);
      return;
    }

    if (gameState.phase === "menu-payout") {
      userPlay.innerHTML = menuMealMarkup();
      return;
    }

    renderMenuPlay(userPlay);
    return;
  }

  if (gameState.game === "game3") {
    renderMiniGame(userPlay);
    return;
  }

  if (gameState.game !== "drink") {
    userPlay.innerHTML = otherGamePlayMarkup();
    return;
  }

  if (gameState.phase !== "price-reveal" && gameState.phase !== "price-result") {
    clearPriceTalk(userPlay);
  }

  if (gameState.phase !== "choose" && gameState.phase !== "drink-reveal") {
    clearDrinkTalk(userPlay);
  }

  const drink = currentDrink();

  if (gameState.phase === "entry" || gameState.phase === "review") {
    userPlay.innerHTML = drink.submitted
      ? waitMarkup("잠시만 기다려주세요.")
      : drinkFormMarkup(drink);
    return;
  }

  if (gameState.phase === "choose" || gameState.phase === "drink-reveal" || gameState.phase === "drink-board") {
    renderDrinkTalk(userPlay);
    return;
  }

  if (gameState.phase === "price-result") {
    userPlay.innerHTML = resultTableMarkup();
    return;
  }

  if (gameState.phase === "price-reveal") {
    if (personalStep() === "celebrate") {
      renderCelebrate(userPlay);
      return;
    }

    renderPriceTalk(userPlay);
    return;
  }

  userPlay.innerHTML = waitMarkup("잠시만 기다려주세요.");
}

function playerPickMarkup() {
  const selected = new Set(gameState.phase === "winner-pick" ? winnerPlayers() : gamePlayers());
  const cards = playAccounts().map((account) => {
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
  if (gameState.phase !== "price-reveal" && gameState.phase !== "price-result") {
    clearPriceTalk(adminPlay);
  }

  if (gameState.phase !== "choose" && gameState.phase !== "drink-reveal") {
    clearDrinkTalk(adminPlay);
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
    if (gameState.phase !== "menu-reveal" && gameState.phase !== "choose") {
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

    if (gameState.phase === "choose" || gameState.phase === "menu-reveal") {
      renderMenuReveal(adminPlay);
      return;
    }

    if (gameState.phase === "menu-spin") {
      renderMenuSpin(adminPlay);
      return;
    }

    if (gameState.phase === "menu-payout") {
      adminPlay.innerHTML = menuMealMarkup(true);
      return;
    }

    adminPlay.innerHTML = waitMarkup("잠시만 기다려주세요.");
    return;
  }

  if (gameState.game === "game3") {
    renderMiniGame(adminPlay);
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

  if (gameState.phase === "choose" || gameState.phase === "drink-reveal" || gameState.phase === "drink-board") {
    renderDrinkTalk(adminPlay);
    return;
  }

  if (gameState.phase === "price-result") {
    adminPlay.innerHTML = resultTableMarkup();
    return;
  }

  if (gameState.phase === "price-reveal") {
    if (personalStep() === "celebrate") {
      renderCelebrate(adminPlay);
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

  const resetAt = bumpGameRound();
  gameState = emptyGame();
  gameState.pendingGame = pending;
  gameState.phase = "pick";
  gameState.players = participantIds().filter((id) => profiles[id]?.submitted);
  resetPlayUi();
  saveGame({ immediate: true });
  publishMqttGameRound(resetAt);
  refreshVisible();
}

function goToMainMenu() {
  const resetAt = bumpGameRound();
  gameState = emptyGame();
  resetPlayUi();
  adminView = "main";
  saveGame({ immediate: true });
  publishMqttGameRound(resetAt);
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
  const resetAt = bumpGameRound();
  gameState = emptyGame();
  gameState.game = gameId;
  gameState.pendingGame = "";
  gameState.players = players;
  gameState.phase = gameId === "drink" || gameId === "game2" ? "entry" : "play";
  if (gameId === "stop") {
    stopSession = Date.now();
  }
  resetPlayUi();
  saveGame({ immediate: true });
  publishMqttGameRound(resetAt);
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

function assignDrinks(force = false) {
  if (!force && Object.keys(gameState.assignment).length) {
    return;
  }

  const ids = gamePlayers().filter((id) => gameState.drinks[id]?.submitted);
  const givers = [...ids];
  for (let i = givers.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [givers[i], givers[j]] = [givers[j], givers[i]];
  }

  gameState.assignment = Object.fromEntries(ids.map((id, index) => [id, givers[index]]));
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

function assignPriceShares(force = false) {
  if (!force && Object.keys(gameState.priceShares).length) {
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

function resetAppealsForRevote() {
  gameState.appeals = emptyAppeals();
  gameState.appealClosed = true;
  participantIds().forEach((id) => publishMqttAppeal(id));
}

function redoDrinkRound() {
  if (currentAccount?.role !== "admin") {
    return;
  }

  resetPlayUi();
  resetAppealsForRevote();
  gameState.revoteKind = "drink";
  gameState.assignment = {};
  gameState.opened = emptyOpened();
  gameState.boardReady = false;
  gameState.resultPicked.drink = true;
  gameState.personalSteps = emptyPersonalSteps();
  assignDrinks(true);
  gameState.phase = "drink-reveal";
  saveGame({ immediate: true });
  refreshVisible();
}

function redoPriceRound() {
  if (currentAccount?.role !== "admin") {
    return;
  }

  resetPlayUi();
  resetAppealsForRevote();
  gameState.revoteKind = "price";
  gameState.priceShares = {};
  gameState.personalSteps = emptyPersonalSteps();
  gameState.resultPicked.price = true;
  assignPriceShares(true);
  gameState.phase = "price-reveal";
  saveGame({ immediate: true });
  refreshVisible();
}

function redoFullRound() {
  if (currentAccount?.role !== "admin") {
    return;
  }

  resetPlayUi();
  resetAppealsForRevote();
  gameState.revoteKind = "full";
  gameState.assignment = {};
  gameState.opened = emptyOpened();
  gameState.boardReady = false;
  gameState.resultPicked = { drink: true, price: false };
  gameState.priceShares = {};
  gameState.personalSteps = emptyPersonalSteps();
  assignDrinks(true);
  gameState.phase = "drink-reveal";
  saveGame({ immediate: true });
  refreshVisible();
}

function pickResult(kind) {
  assignDrinks();
  if (kind === "drink") {
    gameState.resultPicked.drink = true;
    gameState.boardReady = false;
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
document.getElementById("jokeLogout").addEventListener("click", logout);
document.getElementById("jokeChallenge").addEventListener("click", (event) => {
  event.stopPropagation();
  resumeJokeAudio();
  startJokeChallenge();
});

(function setupJokeGiftPhoto() {
  const fly = document.getElementById("jokeGiftFly");
  const photo = document.getElementById("jokeGiftPhoto");
  if (!fly || !photo) {
    return;
  }

  photo.addEventListener("load", () => {
    if (photo.naturalWidth) {
      fly.classList.add("has-photo");
      photo.hidden = false;
    }
  });

  photo.addEventListener("error", () => {
    fly.classList.remove("has-photo");
    photo.hidden = true;
  });

  if (photo.complete && photo.naturalWidth) {
    fly.classList.add("has-photo");
  }
})();
jokePage.addEventListener("click", (event) => {
  if (event.target.closest("#jokeLogout") || jokePage.classList.contains("is-intro")) {
    return;
  }

  resumeJokeAudio();

  if (jokePage.classList.contains("is-unwrapped") || jokePage.classList.contains("is-punchline")) {
    return;
  }

  if (jokePage.classList.contains("is-gift-ready") && event.target.closest("#jokeGiftFly")) {
    unwrapSantaGift();
  }
});
document.getElementById("adminLogout").addEventListener("click", logout);
adminToSettings.addEventListener("click", () => showAdminView("settings"));
adminToMain.addEventListener("click", () => showAdminView("main"));
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

  if (button.dataset.mini === "winner") {
    if (currentAccount?.role !== "admin" || gameState.game !== "game3") {
      return;
    }

    gameState.miniMenu = "winner";
    gameState.phase = "winner-mode";
    gameState.winnerMode = "";
    gameState.winnerPlayers = [];
    gameState.winnerBoxes = [];
    gameState.winnerPicks = {};
    gameState.winnerId = "";
    gameState.winnerBoard = [];
    gameState.winnerRound = Date.now();
    saveGame({ immediate: true });
    refreshVisible();
    return;
  }

  if (button.dataset.winnerMode === "immediate") {
    beginImmediateWinner();
    return;
  }

  if (button.dataset.winnerBox) {
    pickWinnerBox(button.dataset.winnerBox);
    return;
  }

  if (button.dataset.action === "confirm-players") {
    if (gameState.game === "game3" && gameState.phase === "winner-pick") {
      confirmWinnerPlayerPick();
      return;
    }

    confirmPlayerPick();
    return;
  }

  if (button.dataset.action === "go-result") {
    if (gameState.game === "game2") {
      if (!allMenusSubmitted()) {
        return;
      }

      ensureRoulette();
      gameState.phase = "menu-reveal";
      saveGame({ immediate: true });
      refreshVisible();
      return;
    }

    pickResult("drink");
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

  if (button.dataset.action === "go-drink-board") {
    gameState.boardReady = true;
    gameState.phase = "drink-board";
    saveGame({ immediate: true });
    refreshVisible();
    return;
  }

  if (button.dataset.action === "pick-price" || button.dataset.action === "go-price") {
    if (gameState.revoteKind === "drink") {
      gameState.phase = "price-result";
      saveGame({ immediate: true });
      refreshVisible();
      return;
    }

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

  if (button.dataset.action === "go-menu-meal") {
    gameState.phase = "menu-payout";
    saveGame({ immediate: true });
    refreshVisible();
    return;
  }

  if (button.dataset.action === "go-payout") {
    gameState.phase = "price-result";
    saveGame({ immediate: true });
    refreshVisible();
    return;
  }

  if (button.dataset.action === "redo-drink") {
    redoDrinkRound();
    return;
  }

  if (button.dataset.action === "redo-price") {
    redoPriceRound();
    return;
  }

  if (button.dataset.action === "redo-all") {
    redoFullRound();
    return;
  }

  if (button.dataset.action === "refresh-appeals") {
    refreshAppeals();
    return;
  }

  if (button.dataset.action === "submit-appeal") {
    submitAppeal();
    return;
  }

  if (button.dataset.action === "go-winner-table") {
    goToWinnerTable();
    return;
  }

  if (button.dataset.action === "go-winner-table-next") {
    goToMiniGameMain();
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
  const appealForm = event.target.closest("form[data-form='appeal']");
  if (appealForm) {
    event.preventDefault();
    return;
  }

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
  clearTimeout(drinkDraftTimer);
  drinkDraftTimer = setTimeout(() => {
    if (currentAccount && !currentDrink()?.submitted) {
      publishMqttDrink(currentAccount.id);
    }
  }, 500);
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
    gameResetAt: 0,
  };
}

function normalizeRemoteState(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  const hasGame = parsed.game && typeof parsed.game === "object";
  const game = hasGame ? parsed.game : {};
  return {
    resetAt: Number(parsed.resetAt || 0),
    gameResetAt: Math.max(Number(parsed.gameResetAt || 0), Number(game.gameResetAt || 0)),
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
      appeals: sanitizeAppeals(game.appeals),
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
  const previousGameReset = Number(localStorage.getItem(GAME_RESET_KEY) || 0);
  const incomingRound = applyIncomingGameReset(incoming);
  const roundAdvanced = incomingRound > previousGameReset;

  if (remoteReset > localReset) {
    localStorage.setItem(PROFILE_RESET_KEY, String(remoteReset));
    lastProfileResetAt = remoteReset;
    replaceProfiles(applyResetProfiles(remoteReset, incoming.profiles));
    persistProfilesLocal();
    if (incoming.hasGame && (incoming.gameUpdatedAt || 0) > remoteReset) {
      gameState = sanitizeGameState(incoming.game, currentGameResetAt());
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
    const preferRemote = roundAdvanced || (incoming.gameUpdatedAt || 0) > gameUpdatedAt;
    const next = mergeGameState(gameState, incoming.game, preferRemote);
    if (!roundAdvanced && isFillingDrinkForm() && currentAccount) {
      next.drinks[currentAccount.id] = { ...emptyDrink(), ...gameState.drinks[currentAccount.id] };
      const nameInput = document.getElementById("drinkName");
      const priceInput = document.getElementById("drinkPrice");
      if (nameInput) {
        next.drinks[currentAccount.id].name = nameInput.value;
      }
      if (priceInput) {
        next.drinks[currentAccount.id].price = priceInput.value;
      }
      next.drinks[currentAccount.id].submitted = false;
    }

    if (gameSignature(next) !== lastGameSignature) {
      gameState = sanitizeGameState(next, currentGameResetAt());
      gameUpdatedAt = roundAdvanced
        ? Math.max(incoming.gameUpdatedAt || 0, currentGameResetAt())
        : Math.max(gameUpdatedAt, incoming.gameUpdatedAt || 0);
      persistGameLocal();
      changed = true;
    } else if (roundAdvanced) {
      gameState = sanitizeGameState(next, currentGameResetAt());
      gameUpdatedAt = Math.max(incoming.gameUpdatedAt || 0, currentGameResetAt());
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
    gameResetAt: Math.max(currentGameResetAt(), Number(remote.gameResetAt || 0)),
    profiles: mergeProfileMaps(profiles, remote.profiles),
    game: useLocalGame ? gameState : remote.game,
    gameUpdatedAt: useLocalGame ? gameUpdatedAt : remote.gameUpdatedAt,
  };
}

function packedRemoteState(state, slimPhotos) {
  return {
    resetAt: state.resetAt,
    gameResetAt: Number(state.gameResetAt || 0),
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
    gameResetAt: currentGameResetAt(),
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
    gameResetAt: currentGameResetAt(),
    drink,
  });
}

function publishMqttAppeal(id) {
  const appeal = gameState.appeals?.[id] || { drink: false, price: false, submitted: false };
  publishMqttJson(mqttTopic("appeal", id), {
    resetAt: currentResetAt(),
    gameResetAt: currentGameResetAt(),
    appeal,
  });
}

function publishMqttKnownAppeals() {
  participantIds().forEach((id) => {
    if (gameState.appeals?.[id]?.submitted) {
      publishMqttAppeal(id);
    }
  });
}

function publishMqttWinnerPick(boxId) {
  publishMqttJson(mqttTopic("winner", String(boxId)), {
    gameResetAt: currentGameResetAt(),
    boxId: String(boxId),
    playerId: gameState.winnerPicks?.[boxId] || "",
  });
}

function publishMqttKnownWinnerPicks() {
  sanitizeWinnerBoxes(gameState.winnerBoxes).forEach((box) => {
    if (gameState.winnerPicks?.[box.id]) {
      publishMqttWinnerPick(box.id);
    }
  });
}

function publishMqttGame() {
  const game = JSON.parse(JSON.stringify(gameState));
  game.drinks = filledDrinks(game.drinks);
  publishMqttJson(mqttTopic("game"), {
    game,
    gameUpdatedAt,
    gameResetAt: currentGameResetAt(),
  });
  if (currentAccount) {
    publishMqttDrink(currentAccount.id);
    if (gameState.appeals?.[currentAccount.id]?.submitted) {
      publishMqttAppeal(currentAccount.id);
    }
    publishMqttKnownWinnerPicks();
  }
}

function publishMqttGameRound(resetAt) {
  participantIds().forEach((id) => {
    publishMqttJson(mqttTopic("drink", id), {
      resetAt: currentResetAt(),
      gameResetAt: resetAt,
      drink: emptyDrink(),
    });
    publishMqttJson(mqttTopic("appeal", id), {
      resetAt: currentResetAt(),
      gameResetAt: resetAt,
      appeal: { drink: false, price: false, submitted: false },
    });
  });
  for (let index = 0; index < 12; index += 1) {
    publishMqttJson(mqttTopic("winner", String(index)), {
      gameResetAt: resetAt,
      boxId: String(index),
      playerId: "",
    });
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
    publishMqttJson(mqttTopic("appeal", id), {
      resetAt,
      gameResetAt: resetAt,
      appeal: { drink: false, price: false, submitted: false },
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
    publishMqttKnownAppeals();
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

  if (topic.includes("/appeal/")) {
    const id = topic.slice(topic.lastIndexOf("/") + 1);
    if (!participantIds().includes(id)) {
      return;
    }

    const incomingReset = Number(data.gameResetAt || 0);
    if (incomingReset && incomingReset < currentGameResetAt()) {
      return;
    }

    applyIncomingGameReset({ gameResetAt: incomingReset });
    if (!gameState.appeals) {
      gameState.appeals = emptyAppeals();
    }

    const incoming = {
      drink: false,
      price: false,
      submitted: false,
      ...(data.appeal || data),
    };
    const merged = mergeAppealMaps(gameState.appeals, { [id]: incoming });
    if (!incoming.submitted && gameState.appealClosed) {
      merged[id] = { drink: false, price: false, submitted: false };
    }
    if (JSON.stringify(merged) === JSON.stringify(sanitizeAppeals(gameState.appeals))) {
      return;
    }

    gameState.appeals = merged;
    persistGameLocal();
    if (isFillingAppeal()) {
      updateAppealTallyView();
      return;
    }

    if (shouldRefreshAfterRemote({ changed: true, reset: false })) {
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
    const incomingReset = Number(data.gameResetAt || 0);
    applyIncomingGameReset({ gameResetAt: incomingReset });
    const resetAt = currentGameResetAt();
    if (drinkIsStale(drink, resetAt)) {
      const before = gameSignature(gameState);
      gameState.drinks[id] = emptyDrink();
      gameState.drinks = sanitizeDrinks(gameState.drinks, resetAt);
      if (gameSignature(gameState) !== before) {
        persistGameLocal();
        if (shouldRefreshAfterRemote({ changed: true, reset: false })) {
          refreshVisible();
        }
      }
      return;
    }

    const result = applyRemoteState({
      resetAt: Number(data.resetAt || 0),
      gameResetAt: incomingReset,
      profiles: {},
      game: {
        ...gameState,
        drinks: {
          ...gameState.drinks,
          [id]: drink,
        },
      },
      gameUpdatedAt: Number(drink.updatedAt || 0),
    });
    if (shouldRefreshAfterRemote(result)) {
      refreshVisible();
    }
    return;
  }

  if (topic.includes("/winner/")) {
    const boxId = topic.slice(topic.lastIndexOf("/") + 1);
    const incomingReset = Number(data.gameResetAt || 0);
    if (incomingReset && incomingReset < currentGameResetAt()) {
      return;
    }

    applyIncomingGameReset({ gameResetAt: incomingReset });
    const playerId = data.playerId || "";
    if (!playerId) {
      return;
    }

    if (gameState.winnerPicks?.[boxId]) {
      return;
    }

    gameState.winnerPicks = { ...gameState.winnerPicks, [boxId]: playerId };
    persistGameLocal();
    if (userPlay?.dataset.winnerRun === "1" || adminPlay?.dataset.winnerRun === "1") {
      if (userPlay) {
        syncWinnerBoxes(userPlay);
        if (allWinnerBoxesTaken()) {
          showWinnerReveal(userPlay);
        }
      }
      if (adminPlay) {
        syncWinnerBoxes(adminPlay);
        if (allWinnerBoxesTaken()) {
          showWinnerReveal(adminPlay);
        }
      }
      return;
    }

    if (shouldRefreshAfterRemote({ changed: true, reset: false })) {
      refreshVisible();
    }
    return;
  }

  if (topic.endsWith("/game")) {
    const result = applyRemoteState({
      resetAt: currentResetAt(),
      gameResetAt: Number(data.gameResetAt || data.game?.gameResetAt || 0),
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
      `${root}/+/appeal/+`,
      `${root}/+/winner/+`,
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
        mqttClient.subscribe(`${prefix}/appeal/+`, { qos: 0 });
        mqttClient.subscribe(`${prefix}/winner/+`, { qos: 0 });
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
      publishMqttKnownAppeals();
      publishMqttKnownWinnerPicks();
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

function isFillingDrinkForm() {
  if (gameState.game !== "drink" || currentDrink()?.submitted) {
    return false;
  }

  if (gameState.phase !== "entry" && gameState.phase !== "review") {
    return false;
  }

  return Boolean(document.getElementById("drinkName") || document.getElementById("drinkPrice"));
}

function isEditingRegister() {
  return Boolean(
    document.activeElement &&
      (document.activeElement.id === "nameInput" || document.activeElement.id === "nicknameInput"),
  );
}

function isFillingAppeal() {
  return (
    gameState.phase === "price-result" &&
    !currentAppeal().submitted &&
    Boolean(document.querySelector("form[data-form='appeal']"))
  );
}

function shouldRefreshAfterRemote(result) {
  if (!currentAccount || !result.changed || isEditingRegister()) {
    return false;
  }

  if (isFillingDrinkForm() || isEditingDrink() || isEditingMenu()) {
    return false;
  }

  if (isFillingAppeal()) {
    updateAppealTallyView();
    return false;
  }

  if (isDrinkTalkBusy() && (gameState.phase === "choose" || gameState.phase === "drink-reveal") && !gameState.boardReady) {
    return false;
  }

  if (
    gameState.game === "game2" &&
    (gameState.phase === "menu-reveal" || gameState.phase === "choose") &&
    isMenuRevealBusy()
  ) {
    return false;
  }

  if (gameState.game === "game2" && gameState.phase === "menu-spin") {
    const key = spinKey(currentSpin());
    if (userPlay?.dataset.menuSpin === key || adminPlay?.dataset.menuSpin === key) {
      return false;
    }
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

  const typingDrink = isFillingDrinkForm() || isEditingDrink();
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
