const SESSION_KEY = "kitegamemode-session";
const DRAFTS_KEY = "kitegamemode-drafts";
const MEMOS_KEY = "kitegamemode-memos";

const CATEGORIES = [
  { id: "finance", label: "금융", color: "#ef4444", soft: "#c47b6f" },
  { id: "invest", label: "투자", color: "#f97316", soft: "#c98a4e" },
  { id: "estate", label: "부동산", color: "#eab308", soft: "#c4ae5a" },
  { id: "industry", label: "산업", color: "#22c55e", soft: "#7a9e72" },
  { id: "global", label: "국제", color: "#3b82f6", soft: "#6f8fb5" },
  { id: "policy", label: "정책", color: "#6366f1", soft: "#7a7eaf" },
  { id: "trend", label: "동향", color: "#a855f7", soft: "#9a78ad" },
];

const loginPage = document.getElementById("loginPage");
const homePage = document.getElementById("homePage");
const loginForm = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const homeLabel = document.getElementById("homeLabel");
const logoutBtn = document.getElementById("logoutBtn");
const addMemoBtn = document.getElementById("addMemoBtn");
const homeHeader = document.getElementById("homeHeader");
const calendarView = document.getElementById("calendarView");
const memoView = document.getElementById("memoView");
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");
const dayDetailHint = document.getElementById("dayDetailHint");
const dayDetailContent = document.getElementById("dayDetailContent");
const dayDetailTitle = document.getElementById("dayDetailTitle");
const dayDetailList = document.getElementById("dayDetailList");
const memoBackBtn = document.getElementById("memoBackBtn");
const draftListBtn = document.getElementById("draftListBtn");
const draftSaveBtn = document.getElementById("draftSaveBtn");
const memoSaveBtn = document.getElementById("memoSaveBtn");
const yearPickerBtn = document.getElementById("yearPickerBtn");
const monthPickerBtn = document.getElementById("monthPickerBtn");
const dayPickerBtn = document.getElementById("dayPickerBtn");
const yearPickerPanel = document.getElementById("yearPickerPanel");
const monthPickerPanel = document.getElementById("monthPickerPanel");
const dayPickerPanel = document.getElementById("dayPickerPanel");
const memoUrl = document.getElementById("memoUrl");
const categoryBtn = document.getElementById("categoryBtn");
const categoryDot = document.getElementById("categoryDot");
const categoryLabel = document.getElementById("categoryLabel");
const categoryPanel = document.getElementById("categoryPanel");
const memoBody = document.getElementById("memoBody");
const draftSheet = document.getElementById("draftSheet");
const draftSheetBackdrop = document.getElementById("draftSheetBackdrop");
const draftSheetClose = document.getElementById("draftSheetClose");
const draftList = document.getElementById("draftList");
const toast = document.getElementById("toast");

let currentAccount = null;
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();
let selectedDateKey = null;
let editingDraftId = null;
let formDate = yesterdayDate();
let selectedCategory = "";
let toastTimer = 0;

function yesterdayDate() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  return date;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function dateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function findAccount(id, password) {
  return ACCOUNTS.find(
    (account) =>
      account.id.toUpperCase() === id.trim().toUpperCase() &&
      account.password === password,
  );
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadDrafts() {
  return readJson(DRAFTS_KEY, []);
}

function saveDrafts(drafts) {
  writeJson(DRAFTS_KEY, drafts);
}

function loadMemos() {
  return readJson(MEMOS_KEY, []);
}

function saveMemos(memos) {
  writeJson(MEMOS_KEY, memos);
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 1600);
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

function memosForDay(year, monthIndex, day) {
  const key = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
  return loadMemos().filter((memo) => memo.date === key);
}

function categoryById(id) {
  return CATEGORIES.find((item) => item.id === id) || null;
}

function primaryMemoCategory(dayMemos) {
  const latest = dayMemos[dayMemos.length - 1];
  return categoryById(latest?.category) || null;
}

function renderDayDetail() {
  if (!selectedDateKey) {
    dayDetailHint.hidden = false;
    dayDetailHint.textContent = "날짜를 선택하면 저장된 내용이 여기에 표시됩니다.";
    dayDetailContent.hidden = true;
    dayDetailList.replaceChildren();
    return;
  }

  const date = parseDateKey(selectedDateKey);
  const dayMemos = loadMemos().filter((memo) => memo.date === selectedDateKey);
  dayDetailTitle.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

  if (!dayMemos.length) {
    dayDetailHint.hidden = false;
    dayDetailHint.textContent = "이 날짜에 저장된 내용이 없습니다.";
    dayDetailContent.hidden = true;
    dayDetailList.replaceChildren();
    return;
  }

  dayDetailHint.hidden = true;
  dayDetailContent.hidden = false;
  dayDetailList.replaceChildren();

  dayMemos
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((memo) => {
      const category = categoryById(memo.category);
      const card = document.createElement("article");
      card.className = "day-memo";

      const head = document.createElement("div");
      head.className = "day-memo__head";

      const badge = document.createElement("span");
      badge.className = "day-memo__badge";
      const dot = document.createElement("span");
      dot.className = "category-dot";
      dot.style.background = category?.color || "#8a8174";
      const label = document.createElement("span");
      label.textContent = category?.label || "미분류";
      badge.append(dot, label);
      head.appendChild(badge);

      if (memo.url) {
        const link = document.createElement("a");
        link.className = "day-memo__url";
        link.href = memo.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = memo.url;
        head.appendChild(link);
      }

      card.appendChild(head);

      if (memo.body) {
        const body = document.createElement("p");
        body.className = "day-memo__body";
        body.textContent = memo.body;
        card.appendChild(body);
      }

      dayDetailList.appendChild(card);
    });
}

function selectDay(year, monthIndex, day) {
  selectedDateKey = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
  renderCalendar();
  renderDayDetail();
}

function renderCalendar() {
  const today = new Date();
  const firstDay = new Date(viewYear, viewMonth, 1);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startWeekday = firstDay.getDay();

  calendarTitle.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  calendarGrid.replaceChildren();

  for (let i = 0; i < startWeekday; i += 1) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell is-empty";
    calendarGrid.appendChild(cell);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(viewYear, viewMonth, day);
    const key = dateKey(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    cell.setAttribute("aria-label", `${viewYear}년 ${viewMonth + 1}월 ${day}일`);

    const number = document.createElement("span");
    number.className = "calendar-day";
    number.textContent = String(day);
    cell.appendChild(number);

    const dayMemos = memosForDay(viewYear, viewMonth, day);
    const category = dayMemos.length ? primaryMemoCategory(dayMemos) : null;

    if (category) {
      cell.classList.add("has-memo");
      cell.style.background = category.soft;
    } else if (sameDay(date, today)) {
      cell.classList.add("is-today");
    }

    if (selectedDateKey === key) {
      cell.classList.add("is-selected");
    }

    cell.addEventListener("click", () => selectDay(viewYear, viewMonth, day));
    calendarGrid.appendChild(cell);
  }

  renderDayDetail();
}

function shiftMonth(delta) {
  const next = new Date(viewYear, viewMonth + delta, 1);
  viewYear = next.getFullYear();
  viewMonth = next.getMonth();
  selectedDateKey = null;
  renderCalendar();
}

function closeAllPickers() {
  yearPickerPanel.hidden = true;
  monthPickerPanel.hidden = true;
  dayPickerPanel.hidden = true;
  categoryPanel.hidden = true;
}

function syncDateButtons() {
  yearPickerBtn.textContent = `${formDate.getFullYear()}년`;
  monthPickerBtn.textContent = `${formDate.getMonth() + 1}월`;
  dayPickerBtn.textContent = `${formDate.getDate()}일`;
}

function clampFormDay() {
  const maxDay = daysInMonth(formDate.getFullYear(), formDate.getMonth());
  if (formDate.getDate() > maxDay) {
    formDate = new Date(formDate.getFullYear(), formDate.getMonth(), maxDay, 12);
  }
}

function renderYearPanel() {
  const currentYear = new Date().getFullYear();
  yearPickerPanel.replaceChildren();
  for (let year = currentYear + 1; year >= currentYear - 10; year -= 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "picker-option";
    option.textContent = `${year}년`;
    if (year === formDate.getFullYear()) {
      option.classList.add("is-selected");
    }
    option.addEventListener("click", () => {
      formDate = new Date(year, formDate.getMonth(), formDate.getDate(), 12);
      clampFormDay();
      syncDateButtons();
      closeAllPickers();
    });
    yearPickerPanel.appendChild(option);
  }
}

function renderMonthPanel() {
  monthPickerPanel.replaceChildren();
  for (let month = 1; month <= 12; month += 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "picker-option";
    option.textContent = `${month}월`;
    if (month === formDate.getMonth() + 1) {
      option.classList.add("is-selected");
    }
    option.addEventListener("click", () => {
      formDate = new Date(formDate.getFullYear(), month - 1, formDate.getDate(), 12);
      clampFormDay();
      syncDateButtons();
      closeAllPickers();
    });
    monthPickerPanel.appendChild(option);
  }
}

function renderDayPanel() {
  const total = daysInMonth(formDate.getFullYear(), formDate.getMonth());
  dayPickerPanel.replaceChildren();
  for (let day = 1; day <= total; day += 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "picker-option";
    option.textContent = `${day}일`;
    if (day === formDate.getDate()) {
      option.classList.add("is-selected");
    }
    option.addEventListener("click", () => {
      formDate = new Date(formDate.getFullYear(), formDate.getMonth(), day, 12);
      syncDateButtons();
      closeAllPickers();
    });
    dayPickerPanel.appendChild(option);
  }
}

function togglePicker(panel, render) {
  const willOpen = panel.hidden;
  closeAllPickers();
  if (!willOpen) {
    return;
  }
  render();
  panel.hidden = false;
}

function renderCategoryPanel() {
  categoryPanel.replaceChildren();
  CATEGORIES.forEach((category) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "category-option";
    if (category.id === selectedCategory) {
      option.classList.add("is-selected");
    }

    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.style.background = category.color;

    const label = document.createElement("span");
    label.textContent = category.label;

    option.append(dot, label);
    option.addEventListener("click", () => {
      selectedCategory = category.id;
      syncCategoryButton();
      closeAllPickers();
    });
    categoryPanel.appendChild(option);
  });
}

function syncCategoryButton() {
  const category = categoryById(selectedCategory);
  if (!category) {
    categoryDot.classList.add("is-empty");
    categoryDot.style.background = "";
    categoryLabel.textContent = "분류 선택";
    return;
  }
  categoryDot.classList.remove("is-empty");
  categoryDot.style.background = category.color;
  categoryLabel.textContent = category.label;
}

function getFormValues() {
  return {
    date: dateKey(formDate),
    url: memoUrl.value.trim(),
    category: selectedCategory,
    body: memoBody.value.trim(),
  };
}

function fillForm(values) {
  formDate = values.date ? parseDateKey(values.date) : yesterdayDate();
  memoUrl.value = values.url || "";
  selectedCategory = values.category || "";
  memoBody.value = values.body || "";
  syncDateButtons();
  syncCategoryButton();
  closeAllPickers();
}

function openMemoForm(values = null, draftId = null) {
  editingDraftId = draftId;
  fillForm(values || { date: dateKey(yesterdayDate()) });
  homeHeader.hidden = true;
  calendarView.hidden = true;
  memoView.hidden = false;
}

function closeMemoForm() {
  editingDraftId = null;
  closeAllPickers();
  memoView.hidden = true;
  homeHeader.hidden = false;
  calendarView.hidden = false;
  renderCalendar();
}

function openDraftSheet() {
  closeAllPickers();
  renderDraftList();
  draftSheet.hidden = false;
}

function closeDraftSheet() {
  draftSheet.hidden = true;
}

function draftPreview(draft) {
  const category = categoryById(draft.category);
  const title = draft.body || draft.url || "(내용 없음)";
  return {
    title: title.length > 40 ? `${title.slice(0, 40)}…` : title,
    meta: `${draft.date}${category ? ` · ${category.label}` : ""}`,
  };
}

function renderDraftList() {
  const drafts = loadDrafts().slice().sort((a, b) => b.updatedAt - a.updatedAt);
  draftList.replaceChildren();

  if (!drafts.length) {
    const empty = document.createElement("p");
    empty.className = "draft-empty";
    empty.textContent = "임시저장된 메모가 없습니다.";
    draftList.appendChild(empty);
    return;
  }

  drafts.forEach((draft) => {
    const row = document.createElement("div");
    row.className = "draft-item";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "draft-item__main";
    const preview = draftPreview(draft);
    loadBtn.innerHTML = `<strong>${preview.title}</strong><span>${preview.meta}</span>`;
    loadBtn.addEventListener("click", () => {
      closeDraftSheet();
      openMemoForm(draft, draft.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "draft-item__delete";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => {
      saveDrafts(loadDrafts().filter((item) => item.id !== draft.id));
      renderDraftList();
      showToast("임시저장을 삭제했습니다");
    });

    row.append(loadBtn, deleteBtn);
    draftList.appendChild(row);
  });
}

function saveDraft() {
  const values = getFormValues();
  if (!values.url && !values.body && !values.category) {
    showToast("저장할 내용을 입력해 주세요");
    return;
  }

  const drafts = loadDrafts();
  const now = Date.now();

  if (editingDraftId) {
    const index = drafts.findIndex((item) => item.id === editingDraftId);
    if (index >= 0) {
      drafts[index] = { ...drafts[index], ...values, updatedAt: now };
      saveDrafts(drafts);
      showToast("임시저장했습니다");
      return;
    }
  }

  const draft = {
    id: `draft-${now}`,
    ...values,
    updatedAt: now,
  };
  drafts.unshift(draft);
  editingDraftId = draft.id;
  saveDrafts(drafts);
  showToast("임시저장했습니다");
}

function saveMemo() {
  const values = getFormValues();
  if (!values.category) {
    showToast("분류를 선택해 주세요");
    return;
  }
  if (!values.body && !values.url) {
    showToast("URL 또는 메모를 입력해 주세요");
    return;
  }

  const memos = loadMemos();
  memos.push({
    id: `memo-${Date.now()}`,
    ...values,
    createdAt: Date.now(),
  });
  saveMemos(memos);

  if (editingDraftId) {
    saveDrafts(loadDrafts().filter((item) => item.id !== editingDraftId));
    editingDraftId = null;
  }

  const savedDate = parseDateKey(values.date);
  viewYear = savedDate.getFullYear();
  viewMonth = savedDate.getMonth();
  selectedDateKey = values.date;
  showToast("캘린더에 저장했습니다");
  closeMemoForm();
}

function enterHome(account) {
  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.id);
  homeLabel.textContent = account.id;
  loginError.hidden = true;
  loginForm.reset();
  closeMemoForm();
  closeDraftSheet();
  renderCalendar();
  showPage("home");
}

function logout() {
  currentAccount = null;
  sessionStorage.removeItem(SESSION_KEY);
  loginError.hidden = true;
  loginForm.reset();
  closeMemoForm();
  closeDraftSheet();
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
addMemoBtn.addEventListener("click", () => openMemoForm());
memoBackBtn.addEventListener("click", closeMemoForm);
draftListBtn.addEventListener("click", openDraftSheet);
draftSaveBtn.addEventListener("click", saveDraft);
memoSaveBtn.addEventListener("click", saveMemo);
draftSheetBackdrop.addEventListener("click", closeDraftSheet);
draftSheetClose.addEventListener("click", closeDraftSheet);

yearPickerBtn.addEventListener("click", () =>
  togglePicker(yearPickerPanel, renderYearPanel),
);
monthPickerBtn.addEventListener("click", () =>
  togglePicker(monthPickerPanel, renderMonthPanel),
);
dayPickerBtn.addEventListener("click", () =>
  togglePicker(dayPickerPanel, renderDayPanel),
);
categoryBtn.addEventListener("click", () =>
  togglePicker(categoryPanel, renderCategoryPanel),
);

calendarPrev.addEventListener("click", () => shiftMonth(-1));
calendarNext.addEventListener("click", () => shiftMonth(1));

restoreSession();
