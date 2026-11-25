const SESSION_KEY = "kitegamemode-session";

const loginPage = document.getElementById("loginPage");
const homePage = document.getElementById("homePage");
const loginForm = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const homeLabel = document.getElementById("homeLabel");
const logoutBtn = document.getElementById("logoutBtn");

let currentAccount = null;

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

function enterHome(account) {
  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.id);
  homeLabel.textContent = account.id;
  loginError.hidden = true;
  loginForm.reset();
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

restoreSession();
