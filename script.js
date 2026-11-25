const SESSION_KEY = "kitegamemode-session";

const loginPage = document.getElementById("loginPage");
const homePage = document.getElementById("homePage");
const loginForm = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const homeLabel = document.getElementById("homeLabel");
const logoutBtn = document.getElementById("logoutBtn");
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");

let currentAccount = null;
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

function findAccount(id, password) {
  return ACCOUNTS.find(
    (account) =>
      account.id.toUpperCase() === id.trim().toUpperCase() &&
      account.password === password,
  );
}

function showPage(page) {
  loginPage.hidden = page !== "login";
  homePage.hidden = page !== "home";
}

function sameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function renderCalendar() {
  const today = new Date();
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  calendarTitle.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  calendarGrid.replaceChildren();

  for (let i = 0; i < startWeekday; i += 1) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell is-empty";
    calendarGrid.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(viewYear, viewMonth, day);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    cell.textContent = String(day);
    cell.setAttribute("aria-label", `${viewYear}년 ${viewMonth + 1}월 ${day}일`);

    if (sameDay(date, today)) {
      cell.classList.add("is-today");
    }

    calendarGrid.appendChild(cell);
  }
}

function shiftMonth(delta) {
  const next = new Date(viewYear, viewMonth + delta, 1);
  viewYear = next.getFullYear();
  viewMonth = next.getMonth();
  renderCalendar();
}

function enterHome(account) {
  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.id);
  homeLabel.textContent = account.id;
  loginError.hidden = true;
  loginForm.reset();
  renderCalendar();
  showPage("home");
}

function logout() {
  currentAccount = null;
  sessionStorage.removeItem(SESSION_KEY);
  loginError.hidden = true;
  loginForm.reset();
  showPage("login");
  loginId.focus();
}

function restoreSession() {
  const savedId = sessionStorage.getItem(SESSION_KEY);
  if (!savedId) {
    showPage("login");
    return;
  }

  const account = ACCOUNTS.find(
    (item) => item.id.toUpperCase() === savedId.toUpperCase(),
  );

  if (!account) {
    logout();
    return;
  }

  enterHome(account);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const account = findAccount(loginId.value, loginPassword.value);
  if (!account) {
    loginError.hidden = false;
    return;
  }
  enterHome(account);
});

logoutBtn.addEventListener("click", logout);
calendarPrev.addEventListener("click", () => shiftMonth(-1));
calendarNext.addEventListener("click", () => shiftMonth(1));

restoreSession();
