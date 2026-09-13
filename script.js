const SESSION_KEY = "gift-draw-session";
const PROFILE_KEY = "gift-draw-profiles";
const GAME_KEY = "gift-draw-game";

function emptyProfiles() {
  return Object.fromEntries(
    ACCOUNTS.filter((account) => account.role === "user").map((account) => [
      account.id,
      { name: "", nickname: "", photo: "", submitted: false },
    ]),
  );
}

function emptyDrinks() {
  return Object.fromEntries(
    ACCOUNTS.map((account) => [account.id, { name: "", price: "", submitted: false }]),
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
    phase: "idle",
    drinks: emptyDrinks(),
    assignment: {},
    opened: emptyOpened(),
    resultPicked: { drink: false, price: false },
    priceShares: {},
    personalSteps: emptyPersonalSteps(),
  };
}

function loadProfiles() {
  const saved = localStorage.getItem(PROFILE_KEY);
  if (!saved) {
    return emptyProfiles();
  }

  try {
    return { ...emptyProfiles(), ...JSON.parse(saved) };
  } catch {
    return emptyProfiles();
  }
}

function loadGame() {
  const saved = localStorage.getItem(GAME_KEY);
  if (!saved) {
    return emptyGame();
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...emptyGame(),
      ...parsed,
      drinks: { ...emptyDrinks(), ...parsed.drinks },
      opened: { ...emptyOpened(), ...parsed.opened },
      resultPicked: { drink: false, price: false, ...parsed.resultPicked },
      priceShares: { ...parsed.priceShares },
      personalSteps: { ...emptyPersonalSteps(), ...parsed.personalSteps },
    };
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

let currentAccount = null;
let adminView = "settings";
let lastGameSignature = "";
let priceTalkToken = 0;

function saveProfiles() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}

function saveGame() {
  localStorage.setItem(GAME_KEY, JSON.stringify(gameState));
  lastGameSignature = gameSignature(gameState);
}

function gameSignature(state) {
  return JSON.stringify({
    game: state.game,
    phase: state.phase,
    drinks: state.drinks,
    assignment: state.assignment,
    opened: state.opened,
    resultPicked: state.resultPicked,
    priceShares: state.priceShares,
    personalSteps: state.personalSteps,
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
}

function enterAccount(account) {
  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.id);
  loginError.hidden = true;

  if (account.role === "admin") {
    showAdminView(adminView);
    showPage("admin");
    return;
  }

  userLabel.textContent = account.id;
  showUserView();
  showPage("user");
}

function logout() {
  currentAccount = null;
  sessionStorage.removeItem(SESSION_KEY);
  loginForm.reset();
  showPage("login");
  loginId.focus();
}

function restoreSession() {
  const savedId = sessionStorage.getItem(SESSION_KEY);
  const account = ACCOUNTS.find((item) => item.id === savedId);
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
  return profiles[currentAccount.id];
}

function currentDrink() {
  return gameState.drinks[currentAccount.id];
}

function assignedDrink() {
  const giverId = gameState.assignment[currentAccount.id];
  return giverId ? gameState.drinks[giverId] : null;
}

function showUserView() {
  if (!currentProfile().submitted) {
    registerForm.hidden = false;
    userMain.hidden = true;
    userPlay.hidden = true;
    renderRegister();
    return;
  }

  registerForm.hidden = true;

  if (gameState.game !== "drink" || personalStep() === "done") {
    userMain.hidden = false;
    userPlay.hidden = true;
    return;
  }

  userMain.hidden = true;
  userPlay.hidden = false;
  renderUserPlay();
}

function showAdminView(view) {
  adminView = view;
  adminSettings.hidden = view !== "settings";
  adminMain.hidden = view !== "main";
  adminToSettings.classList.toggle("is-active", view === "settings");
  adminToMain.classList.toggle("is-active", view === "main");

  if (view === "settings") {
    renderAdmin();
    return;
  }

  renderAdminPlay();
}

function refreshVisible() {
  if (!currentAccount) {
    return;
  }

  if (currentAccount.role === "admin") {
    showAdminView(adminView);
    return;
  }

  showUserView();
}

function photoMarkup(photo, alt) {
  if (photo) {
    return `<img src="${photo}" alt="${escapeAttr(alt)}">`;
  }

  return `
    <span class="photo-placeholder">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2.1l1-1.5h4.8l1 1.5h2.1A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" stroke-width="1.6"/>
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/>
      </svg>
      사진 등록
    </span>
  `;
}

function renderRegister() {
  const profile = currentProfile();
  const hasPhoto = Boolean(profile.photo);
  const locked = Boolean(profile.submitted);

  registerStage.innerHTML = `
    <div class="register-stage">
      <div class="photo-field">
        <button
          class="photo-button${hasPhoto ? " has-photo" : ""}${locked ? " is-locked" : ""}"
          type="button"
          data-action="pick-photo"
          aria-label="사진 등록"
          ${locked ? "disabled" : ""}
        >
          ${photoMarkup(profile.photo, "등록한 사진")}
        </button>
        <input
          class="visually-hidden"
          id="photoInput"
          type="file"
          accept="image/*"
          ${locked ? "disabled" : ""}
        >
        <button
          class="photo-remove"
          type="button"
          data-action="remove-photo"
          ${hasPhoto && !locked ? "" : "hidden"}
        >
          사진 삭제
        </button>
      </div>
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
          : `<button class="btn-primary" type="submit">제출</button>`
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
  const users = ACCOUNTS.filter((account) => account.role === "user");

  adminList.innerHTML = users
    .map((account) => {
      const profile = profiles[account.id];
      const hasPhoto = Boolean(profile.photo);

      return `
        <article class="admin-card">
          <p class="admin-card__id">${escapeHtml(account.id)}</p>
          <div class="admin-photo${hasPhoto ? " has-photo" : ""}">
            ${photoMarkup(profile.photo, `${account.id} 사진`)}
          </div>
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

function drinkFormMarkup(drink) {
  return `
    <form class="center-form" data-form="drink">
      <div class="profile-field">
        <label for="drinkName">음료명</label>
        <input id="drinkName" type="text" maxlength="20" placeholder="음료명을 입력하세요" value="${escapeAttr(drink.name)}" required>
      </div>
      <div class="profile-field">
        <label for="drinkPrice">가격</label>
        <input id="drinkPrice" type="text" maxlength="12" placeholder="가격을 입력하세요" value="${escapeAttr(drink.price)}" required>
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
      : drink.price
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

function userDrinksListMarkup() {
  const users = ACCOUNTS.filter((account) => account.role === "user");

  return users
    .map((account) => {
      const drink = gameState.drinks[account.id];
      const profile = profiles[account.id];

      return `
        <article class="admin-card">
          <p class="admin-card__id">${escapeHtml(profile.name || account.id)}</p>
          <div class="admin-card__text">
            <span class="admin-card__label">음료명</span>
            ${displayValue(drink.submitted ? drink.name : "")}
          </div>
          <div class="admin-card__text">
            <span class="admin-card__label">가격</span>
            ${displayValue(drink.submitted ? drink.price : "")}
          </div>
        </article>
      `;
    })
    .join("");
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
  return ACCOUNTS.reduce(
    (sum, account) => sum + parsePrice(gameState.drinks[account.id].price),
    0,
  );
}

async function typeChunks(line, chunks, token) {
  for (const chunk of chunks) {
    const span = document.createElement("span");
    if (chunk.cls) {
      span.className = chunk.cls;
    }

    line.append(span);

    for (const char of chunk.text) {
      if (token !== priceTalkToken) {
        return false;
      }

      span.textContent += char;
      await delay(70);
    }
  }

  return token === priceTalkToken;
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
  const rows = ACCOUNTS.map((account) => {
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

function renderUserPlay() {
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

function renderAdminPlay() {
  if (gameState.phase !== "price-reveal") {
    clearPriceTalk(adminPlay);
  }

  if (gameState.game !== "drink") {
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

  const drink = currentDrink();

  if (gameState.phase === "entry" && !drink.submitted) {
    adminPlay.innerHTML = drinkFormMarkup(drink);
    return;
  }

  if (gameState.phase === "entry" || gameState.phase === "review") {
    adminPlay.innerHTML = `
      <div class="admin-list">${userDrinksListMarkup()}</div>
      <button class="btn-primary" type="button" data-action="go-result">결과 보러가기</button>
    `;
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

function startDrinkGame() {
  gameState = emptyGame();
  gameState.game = "drink";
  gameState.phase = "entry";
  userPlay.dataset.fanfare = "";
  userPlay.dataset.priceTalk = "";
  adminPlay.dataset.fanfare = "";
  adminPlay.dataset.priceTalk = "";
  saveGame();
  refreshVisible();
}

function submitDrink() {
  const drink = currentDrink();
  if (drink.submitted) {
    return;
  }

  const name = document.getElementById("drinkName")?.value.trim() || "";
  const price = document.getElementById("drinkPrice")?.value.trim() || "";
  if (!name || !price) {
    return;
  }

  drink.name = name;
  drink.price = price;
  drink.submitted = true;

  if (currentAccount.role === "admin") {
    gameState.phase = "review";
  }

  saveGame();
  refreshVisible();
}

function assignDrinks() {
  if (Object.keys(gameState.assignment).length) {
    return;
  }

  const ids = ACCOUNTS.map((account) => account.id).filter(
    (id) => gameState.drinks[id].submitted,
  );

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
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
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

  const ids = ACCOUNTS.map((account) => account.id);
  const total = ids.reduce((sum, id) => sum + parsePrice(gameState.drinks[id].price), 0);
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
adminToMain.addEventListener("click", () => showAdminView("main"));

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = currentProfile();
  if (profile.submitted) {
    return;
  }

  profile.name = document.getElementById("nameInput").value.trim();
  profile.nickname = document.getElementById("nicknameInput").value.trim();
  profile.submitted = true;
  saveProfiles();
  showUserView();
});

registerForm.addEventListener("input", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const profile = currentProfile();
  if (profile.submitted) {
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
  if (!button || currentProfile().submitted) {
    return;
  }

  if (button.dataset.action === "pick-photo") {
    document.getElementById("photoInput").click();
    return;
  }

  if (button.dataset.action === "remove-photo") {
    currentProfile().photo = "";
    saveProfiles();
    renderRegister();
  }
});

registerForm.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "file") {
    return;
  }

  if (currentProfile().submitted) {
    return;
  }

  const file = input.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (currentProfile().submitted) {
      return;
    }

    currentProfile().photo = String(reader.result);
    saveProfiles();
    renderRegister();
  };
  reader.readAsDataURL(file);
});

function handlePlayClick(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  if (button.dataset.game === "drink") {
    startDrinkGame();
    return;
  }

  if (button.dataset.action === "go-result") {
    gameState.phase = "choose";
    saveGame();
    refreshVisible();
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
    gameState = loadGame();
    refreshVisible();
    return;
  }

  if (button.dataset.action === "go-payout") {
    setPersonalStep("payout");
    refreshVisible();
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
  if (event.key === PROFILE_KEY) {
    Object.assign(profiles, loadProfiles());
    if (currentAccount?.role === "admin" && adminView === "settings") {
      renderAdmin();
    }
  }

  if (event.key === GAME_KEY) {
    syncGameFromStorage();
  }
});

setInterval(syncGameFromStorage, 1000);
lastGameSignature = gameSignature(gameState);
restoreSession();
