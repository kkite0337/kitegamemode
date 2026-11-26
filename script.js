const SESSION_KEY = "kitegamemode-session";
const SECTION_KEY = "kitegamemode-section";
const SHARED_BOARD_KEY = "kitegamemode-shared-board";
const SHARED_PAGE_VIEW_KEY = "kitegamemode-shared-page-view";
const SHARED_ADMIN_ID = "kite";
const SHARED_DEFAULT_TITLE = "제목을 입력하세요";
const SECTIONS = ["routine", "economy", "language"];
const DRAFTS_KEY = "kitegamemode-drafts";
const MEMOS_KEY = "kitegamemode-memos";
const LANGUAGE_ENTRIES_KEY = "kitegamemode-language-entries";
const LANGUAGE_DRAFTS_KEY = "kitegamemode-language-drafts";
const ROUTINE_WEEK_KEY = "kitegamemode-routine-week";
const ROUTINE_DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
const ROUTINE_MATRIX_GROUPS = [
  [
    { id: "morning", label: "오전루틴" },
    { id: "lang-study", label: "외국어공부" },
    { id: "econ-study", label: "경제공부" },
    { id: "podcast", label: "팟캐스트" },
  ],
  [
    { id: "supplements", label: "영양제" },
    { id: "water", label: "물2리터" },
    { id: "no-dessert", label: "디저트X" },
  ],
  [
    { id: "afternoon", label: "오후루틴" },
    { id: "tidy", label: "짐정리" },
    { id: "skincare", label: "피부관리" },
    { id: "night", label: "나이트루틴" },
  ],
];
const CLEANING_ITEMS = [
  { id: "laundry", label: "빨래" },
  { id: "floor", label: "바닥" },
  { id: "bathroom", label: "화장실" },
  { id: "bathroom-extra", label: "화장실" },
  { id: "shoes", label: "신발장" },
  { id: "diffuser", label: "디퓨저" },
  { id: "trash", label: "쓰레기통" },
  { id: "closet", label: "옷장" },
  { id: "bedding", label: "침구•침대" },
  { id: "car", label: "자동차" },
];
const EXERCISE_MATRIX_GROUPS = [
  [{ id: "cardio", label: "유산소" }],
  [
    { id: "stretch", label: "스트레칭" },
    { id: "swelling", label: "붓기" },
  ],
  [
    { id: "upper", label: "상체" },
    { id: "abs", label: "복부" },
    { id: "diet", label: "다이어트" },
  ],
];
const EXERCISE_DONE_MIN = 3;

const LANG_CATEGORIES = [
  { id: "study", label: "학습", color: "#ef4444", soft: "#c47b6f" },
  { id: "review", label: "복습", color: "#22c55e", soft: "#7a9e72" },
  { id: "extra", label: "추가", color: "#3b82f6", soft: "#6f8fb5" },
];

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
const sharedPage = document.getElementById("sharedPage");
const loginForm = document.getElementById("loginForm");
const loginId = document.getElementById("loginId");
const loginPassword = document.getElementById("loginPassword");
const loginError = document.getElementById("loginError");
const homeLabel = document.getElementById("homeLabel");
const logoutBtn = document.getElementById("logoutBtn");
const sharedLabel = document.getElementById("sharedLabel");
const sharedLogoutBtn = document.getElementById("sharedLogoutBtn");
const sharedSyncStatus = document.getElementById("sharedSyncStatus");
const sharedSetupHint = document.getElementById("sharedSetupHint");
const sharedTodoPanels = Array.from(document.querySelectorAll(".shared-todo"));
const sharedTitleText = document.getElementById("sharedTitleText");
const sharedTitleEditBtn = document.getElementById("sharedTitleEditBtn");
const sharedTitleDisplay = document.getElementById("sharedTitleDisplay");
const sharedTitleEditForm = document.getElementById("sharedTitleEditForm");
const sharedTitleInput = document.getElementById("sharedTitleInput");
const sharedTitleCancelBtn = document.getElementById("sharedTitleCancelBtn");
const sharedAddPageBtn = document.getElementById("sharedAddPageBtn");
const sharedPagePrev = document.getElementById("sharedPagePrev");
const sharedPageNext = document.getElementById("sharedPageNext");
const sharedPageIndex = document.getElementById("sharedPageIndex");
const addMemoBtn = document.getElementById("addMemoBtn");
const pdfBtn = document.getElementById("pdfBtn");
const langPdfBtn = document.getElementById("langPdfBtn");
const routinePdfBtn = document.getElementById("routinePdfBtn");
const homeHeader = document.getElementById("homeHeader");
const calendarView = document.getElementById("calendarView");
const memoView = document.getElementById("memoView");
const sectionRoutine = document.getElementById("sectionRoutine");
const sectionEconomy = document.getElementById("sectionEconomy");
const sectionLanguage = document.getElementById("sectionLanguage");
const headerActions = document.getElementById("headerActions");
const economyActions = document.getElementById("economyActions");
const languageActions = document.getElementById("languageActions");
const routineActions = document.getElementById("routineActions");
const routineWeekTitle = document.getElementById("routineWeekTitle");
const routineWeekPrev = document.getElementById("routineWeekPrev");
const routineWeekNext = document.getElementById("routineWeekNext");
const cleaningList = document.getElementById("cleaningList");
const cleaningCount = document.getElementById("cleaningCount");
const exerciseList = document.getElementById("exerciseList");
const routineMatrix = document.getElementById("routineMatrix");
const routineMemoInput = document.getElementById("routineMemoInput");
const routineMemoEditBtn = document.getElementById("routineMemoEditBtn");
const routineMemoSaveBtn = document.getElementById("routineMemoSaveBtn");
const routineSheet = document.getElementById("routineSheet");
const routineSheetBackdrop = document.getElementById("routineSheetBackdrop");
const routineSheetClose = document.getElementById("routineSheetClose");
const routineForm = document.getElementById("routineForm");
const routineTitleInput = document.getElementById("routineTitleInput");
const addLangBtn = document.getElementById("addLangBtn");
const languageView = document.getElementById("languageView");
const langFormView = document.getElementById("langFormView");
const langFormBackBtn = document.getElementById("langFormBackBtn");
const langFormSaveBtn = document.getElementById("langFormSaveBtn");
const langDraftListBtn = document.getElementById("langDraftListBtn");
const langDraftSaveBtn = document.getElementById("langDraftSaveBtn");
const langDraftSheet = document.getElementById("langDraftSheet");
const langDraftSheetBackdrop = document.getElementById("langDraftSheetBackdrop");
const langDraftSheetClose = document.getElementById("langDraftSheetClose");
const langDraftList = document.getElementById("langDraftList");
const langYearPickerBtn = document.getElementById("langYearPickerBtn");
const langMonthPickerBtn = document.getElementById("langMonthPickerBtn");
const langDayPickerBtn = document.getElementById("langDayPickerBtn");
const langYearPickerPanel = document.getElementById("langYearPickerPanel");
const langMonthPickerPanel = document.getElementById("langMonthPickerPanel");
const langDayPickerPanel = document.getElementById("langDayPickerPanel");
const langStartTime = document.getElementById("langStartTime");
const langEndTime = document.getElementById("langEndTime");
const langCategoryBtn = document.getElementById("langCategoryBtn");
const langCategoryDot = document.getElementById("langCategoryDot");
const langCategoryLabel = document.getElementById("langCategoryLabel");
const langCategoryPanel = document.getElementById("langCategoryPanel");
const langBody = document.getElementById("langBody");
const pageTabs = Array.from(document.querySelectorAll(".page-tab"));
const calendarTitle = document.getElementById("calendarTitle");
const calendarGrid = document.getElementById("calendarGrid");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");
const langAchievePercent = document.getElementById("langAchievePercent");
const langAchieveCount = document.getElementById("langAchieveCount");
const langAchieveBarFill = document.getElementById("langAchieveBarFill");
const langStudyTotal = document.getElementById("langStudyTotal");
const langStudyHint = document.getElementById("langStudyHint");
const langCalendarTitle = document.getElementById("langCalendarTitle");
const langCalendarGrid = document.getElementById("langCalendarGrid");
const langCalendarPrev = document.getElementById("langCalendarPrev");
const langCalendarNext = document.getElementById("langCalendarNext");
const langDayDetailHint = document.getElementById("langDayDetailHint");
const langDayDetailContent = document.getElementById("langDayDetailContent");
const langDayDetailTitle = document.getElementById("langDayDetailTitle");
const langDayDetailList = document.getElementById("langDayDetailList");
const dayDetailHint = document.getElementById("dayDetailHint");
const dayDetailContent = document.getElementById("dayDetailContent");
const dayDetailTitle = document.getElementById("dayDetailTitle");
const dayDetailList = document.getElementById("dayDetailList");
const achievePercent = document.getElementById("achievePercent");
const achieveCount = document.getElementById("achieveCount");
const achieveBarFill = document.getElementById("achieveBarFill");
const chartBody = document.getElementById("chartBody");
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
let activeSection = "routine";
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();
let langViewYear = new Date().getFullYear();
let langViewMonth = new Date().getMonth();
let selectedDateKey = null;
let editingDraftId = null;
let editingMemoId = null;
let formDate = yesterdayDate();
let selectedCategory = "";
let langFormDate = new Date();
let selectedLangCategory = "";
let selectedLangDateKey = null;
let editingLangDraftId = null;
let editingLangEntryId = null;
let toastTimer = 0;
let routineWeekTimer = 0;
let routineViewMonday = null;
let routineMemoLoadedWeek = "";
let sharedDbRef = null;
let sharedSyncReady = false;
let sharedBoard = { pages: [] };
let sharedActivePageId = "";
let sharedBoardApplyingRemote = false;
let sharedTitleEditing = false;

function yesterdayDate() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  return date;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function timeToMinutes(value) {
  if (typeof value !== "string" || !value.includes(":")) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatMinutesLabel(totalMinutes) {
  const total = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (hours && minutes) {
    return `${hours}시간 ${minutes}분`;
  }
  if (hours) {
    return `${hours}시간`;
  }
  return `${minutes}분`;
}

function formatStudyDuration(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) {
    return "";
  }
  return formatMinutesLabel(end - start);
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
  sharedPage.hidden = page !== "shared";
}

function isSharedAccount(account) {
  return account?.role === "shared";
}

function sharedMemberIds() {
  return typeof SHARED_MEMBER_IDS !== "undefined" && Array.isArray(SHARED_MEMBER_IDS)
    ? SHARED_MEMBER_IDS.slice()
    : ["kite", "jinee", "heeya"];
}

function emptySharedTodos() {
  return sharedMemberIds().reduce((acc, memberId) => {
    acc[memberId] = [];
    return acc;
  }, {});
}

function isSharedAdmin(account = currentAccount) {
  return (
    account?.role === "shared" &&
    String(account.id || "").toUpperCase() === SHARED_ADMIN_ID.toUpperCase()
  );
}

function canEditSharedMemberTodos(memberId, account = currentAccount) {
  if (!account || account.role !== "shared") {
    return false;
  }
  if (isSharedAdmin(account)) {
    return true;
  }
  return String(account.id || "").toUpperCase() === String(memberId || "").toUpperCase();
}

function createSharedTodoId() {
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createSharedPageId() {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptySharedPage(overrides = {}) {
  return {
    id: overrides.id || createSharedPageId(),
    title: typeof overrides.title === "string" ? overrides.title.trim() : "",
    todos: normalizeSharedTodosMap(overrides.todos),
    createdAt: Number(overrides.createdAt) || Date.now(),
  };
}

function normalizeSharedTodo(raw, fallbackMember) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  if (!text) {
    return null;
  }
  const createdBy =
    typeof raw.createdBy === "string" && raw.createdBy
      ? raw.createdBy
      : fallbackMember;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : createSharedTodoId(),
    text,
    done: Boolean(raw.done),
    createdBy,
    createdAt: Number(raw.createdAt) || Date.now(),
    byAdmin: Boolean(
      raw.byAdmin ||
        (String(createdBy).toUpperCase() === SHARED_ADMIN_ID.toUpperCase() &&
          String(fallbackMember).toUpperCase() !== SHARED_ADMIN_ID.toUpperCase()),
    ),
  };
}

function normalizeSharedTodosMap(rawTodos) {
  const next = emptySharedTodos();
  sharedMemberIds().forEach((memberId) => {
    const source = rawTodos && typeof rawTodos === "object" ? rawTodos[memberId] : null;
    let list = [];
    if (Array.isArray(source)) {
      list = source;
    } else if (source && typeof source === "object") {
      list = Object.values(source);
    }
    next[memberId] = list
      .map((item) => normalizeSharedTodo(item, memberId))
      .filter(Boolean)
      .sort((a, b) => a.createdAt - b.createdAt);
  });
  return next;
}

function normalizeSharedPage(raw) {
  if (!raw || typeof raw !== "object") {
    return createEmptySharedPage();
  }
  return createEmptySharedPage(raw);
}

function normalizeSharedBoard(raw) {
  if (!raw || typeof raw !== "object") {
    return { pages: [createEmptySharedPage()] };
  }

  let pages = [];
  if (Array.isArray(raw.pages)) {
    pages = raw.pages.map((page) => normalizeSharedPage(page));
  } else if (raw.pages && typeof raw.pages === "object") {
    pages = Object.values(raw.pages).map((page) => normalizeSharedPage(page));
  } else if (raw.title != null || raw.todos != null) {
    pages = [
      createEmptySharedPage({
        id: raw.id,
        title: raw.title,
        todos: raw.todos,
        createdAt: raw.createdAt,
      }),
    ];
  }

  pages = pages.filter(Boolean);
  if (!pages.length) {
    pages = [createEmptySharedPage()];
  }
  pages.sort((a, b) => a.createdAt - b.createdAt);
  return { pages };
}

function cloneSharedBoard(board = sharedBoard) {
  return {
    pages: (board.pages || []).map((page) => ({
      id: page.id,
      title: page.title || "",
      createdAt: page.createdAt || Date.now(),
      todos: sharedMemberIds().reduce((acc, memberId) => {
        acc[memberId] = (page.todos?.[memberId] || []).map((item) => ({ ...item }));
        return acc;
      }, {}),
    })),
  };
}

function saveSharedBoardLocal(board = sharedBoard) {
  localStorage.setItem(SHARED_BOARD_KEY, JSON.stringify(cloneSharedBoard(board)));
}

function loadSharedBoardLocal() {
  try {
    const raw = localStorage.getItem(SHARED_BOARD_KEY);
    if (!raw) {
      return { pages: [createEmptySharedPage()] };
    }
    return normalizeSharedBoard(JSON.parse(raw));
  } catch (error) {
    return { pages: [createEmptySharedPage()] };
  }
}

function getSharedPageIndex(pageId = sharedActivePageId) {
  const pages = sharedBoard.pages || [];
  const index = pages.findIndex((page) => page.id === pageId);
  return index >= 0 ? index : 0;
}

function getActiveSharedPage() {
  const pages = sharedBoard.pages || [];
  if (!pages.length) {
    const page = createEmptySharedPage();
    sharedBoard.pages = [page];
    sharedActivePageId = page.id;
    return page;
  }
  let page = pages.find((item) => item.id === sharedActivePageId);
  if (!page) {
    page = pages[0];
    sharedActivePageId = page.id;
  }
  return page;
}

function rememberSharedPageView(pageId) {
  sharedActivePageId = pageId;
  sessionStorage.setItem(SHARED_PAGE_VIEW_KEY, pageId);
}

function ensureSharedActivePage() {
  const saved = sessionStorage.getItem(SHARED_PAGE_VIEW_KEY);
  if (saved && (sharedBoard.pages || []).some((page) => page.id === saved)) {
    sharedActivePageId = saved;
  } else {
    rememberSharedPageView(getActiveSharedPage().id);
  }
}

function highlightSharedSection(activeId) {
  document.querySelectorAll(".shared-section").forEach((section) => {
    section.classList.toggle(
      "is-active",
      section.dataset.member?.toUpperCase() === String(activeId || "").toUpperCase(),
    );
  });
}

function setSharedTitleEditing(editing) {
  sharedTitleEditing = Boolean(editing);
  sharedTitleDisplay.hidden = sharedTitleEditing;
  sharedTitleEditForm.hidden = !sharedTitleEditing;
  if (sharedTitleEditing) {
    sharedTitleInput.value = getActiveSharedPage().title || "";
    sharedTitleInput.focus();
    const length = sharedTitleInput.value.length;
    sharedTitleInput.setSelectionRange(length, length);
  }
}

function renderSharedTitle() {
  const page = getActiveSharedPage();
  const pages = sharedBoard.pages || [];
  const index = getSharedPageIndex(page.id);
  const title = (page.title || "").trim();
  const hasTitle = Boolean(title);

  sharedTitleText.textContent = hasTitle ? title : SHARED_DEFAULT_TITLE;
  sharedTitleText.classList.toggle("is-placeholder", !hasTitle);
  sharedPageIndex.textContent = `${index + 1} / ${pages.length || 1}`;
  sharedTitleEditBtn.hidden = !isSharedAdmin() || sharedTitleEditing;
  sharedAddPageBtn.hidden = !isSharedAdmin();
  sharedPagePrev.disabled = index <= 0;
  sharedPageNext.disabled = index >= pages.length - 1;

  if (!isSharedAdmin()) {
    setSharedTitleEditing(false);
  }
}

function renderSharedTodoPanel(panel) {
  const memberId = panel.dataset.member;
  const listEl = panel.querySelector("[data-todo-list]");
  const countEl = panel.querySelector("[data-todo-count]");
  const formEl = panel.querySelector("[data-todo-form]");
  const page = getActiveSharedPage();
  const items = page.todos?.[memberId] || [];
  const canAdd = canEditSharedMemberTodos(memberId);
  const doneCount = items.filter((item) => item.done).length;

  countEl.textContent = items.length ? `${doneCount}/${items.length}` : "0";
  formEl.hidden = !canAdd;
  listEl.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("li");
    empty.className = "shared-todo__empty";
    empty.textContent = "할 일이 없습니다";
    listEl.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("li");
    row.className = "shared-todo-item";
    if (item.done) {
      row.classList.add("is-done");
    }
    if (item.byAdmin) {
      row.classList.add("is-admin");
    }

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "shared-todo-item__main";
    toggleBtn.dataset.action = "toggle";
    toggleBtn.dataset.member = memberId;
    toggleBtn.dataset.id = item.id;

    const box = document.createElement("span");
    box.className = "shared-todo-item__box";
    box.textContent = "✓";

    const body = document.createElement("span");
    body.className = "shared-todo-item__body";

    const text = document.createElement("p");
    text.className = "shared-todo-item__text";
    text.textContent = item.text;

    body.appendChild(text);
    if (item.byAdmin) {
      const meta = document.createElement("p");
      meta.className = "shared-todo-item__meta";
      meta.textContent = "관리자";
      body.appendChild(meta);
    }

    toggleBtn.append(box, body);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "shared-todo-item__remove";
    removeBtn.dataset.action = "remove";
    removeBtn.dataset.member = memberId;
    removeBtn.dataset.id = item.id;
    removeBtn.setAttribute("aria-label", "삭제");
    removeBtn.textContent = "×";
    removeBtn.hidden = !(canAdd || isSharedAdmin());

    row.append(toggleBtn, removeBtn);
    listEl.appendChild(row);
  });
}

function renderSharedBoard() {
  ensureSharedActivePage();
  highlightSharedSection(currentAccount?.id);
  renderSharedTitle();
  sharedTodoPanels.forEach((panel) => renderSharedTodoPanel(panel));
}

function isFirebaseConfigured() {
  return Boolean(
    typeof FIREBASE_CONFIG !== "undefined" &&
      FIREBASE_CONFIG &&
      FIREBASE_CONFIG.apiKey &&
      FIREBASE_CONFIG.databaseURL &&
      typeof firebase !== "undefined",
  );
}

function updateSharedSyncStatus(mode) {
  if (!sharedSyncStatus) {
    return;
  }
  if (mode === "live") {
    sharedSyncStatus.textContent = "실시간 동기화";
    sharedSyncStatus.className = "shared-sync is-live";
    sharedSetupHint.hidden = true;
    return;
  }
  if (mode === "error") {
    sharedSyncStatus.textContent = "동기화 오류";
    sharedSyncStatus.className = "shared-sync is-error";
    sharedSetupHint.hidden = false;
    return;
  }
  sharedSyncStatus.textContent = "로컬 전용";
  sharedSyncStatus.className = "shared-sync is-local";
  sharedSetupHint.hidden = false;
}

function stopSharedBoardSync() {
  if (sharedDbRef) {
    sharedDbRef.off();
  }
  sharedDbRef = null;
  sharedSyncReady = false;
}

function initSharedDatabase() {
  if (!isFirebaseConfigured()) {
    return false;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    sharedDbRef = firebase.database().ref("kitegamemode/shared/board");
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function applySharedBoardFromRemote(payload) {
  sharedBoardApplyingRemote = true;
  sharedBoard = normalizeSharedBoard(payload);
  saveSharedBoardLocal(sharedBoard);
  ensureSharedActivePage();
  renderSharedBoard();
  sharedBoardApplyingRemote = false;
}

function startSharedBoardSync() {
  stopSharedBoardSync();
  sharedBoard = loadSharedBoardLocal();
  ensureSharedActivePage();
  renderSharedBoard();

  if (!initSharedDatabase()) {
    updateSharedSyncStatus("local");
    return;
  }

  updateSharedSyncStatus("live");
  sharedSyncReady = true;
  sharedDbRef.on(
    "value",
    (snapshot) => {
      const value = snapshot.val();
      if (value == null) {
        pushSharedBoard({ silent: true });
        return;
      }
      applySharedBoardFromRemote(value);
    },
    () => {
      updateSharedSyncStatus("error");
      sharedBoard = loadSharedBoardLocal();
      ensureSharedActivePage();
      renderSharedBoard();
    },
  );
}

function pushSharedBoard({ silent = false } = {}) {
  const payload = {
    ...cloneSharedBoard(sharedBoard),
    updatedBy: currentAccount?.id || "",
    updatedAt: Date.now(),
  };
  saveSharedBoardLocal(sharedBoard);

  if (!sharedDbRef || !sharedSyncReady) {
    if (!silent) {
      showToast("로컬에 저장했습니다");
    }
    return Promise.resolve();
  }

  return sharedDbRef
    .set(payload)
    .then(() => {
      if (!silent) {
        showToast("저장했습니다");
      }
    })
    .catch(() => {
      updateSharedSyncStatus("error");
      if (!silent) {
        showToast("공유 저장에 실패했습니다");
      }
    });
}

function shiftSharedPage(delta) {
  const pages = sharedBoard.pages || [];
  if (pages.length <= 1) {
    return;
  }
  const nextIndex = Math.min(
    pages.length - 1,
    Math.max(0, getSharedPageIndex() + delta),
  );
  rememberSharedPageView(pages[nextIndex].id);
  setSharedTitleEditing(false);
  renderSharedBoard();
}

function addSharedPage() {
  if (!isSharedAdmin()) {
    showToast("관리자만 새 페이지를 만들 수 있습니다");
    return;
  }
  const page = createEmptySharedPage();
  sharedBoard.pages = [...(sharedBoard.pages || []), page];
  rememberSharedPageView(page.id);
  setSharedTitleEditing(false);
  renderSharedBoard();
  pushSharedBoard();
  showToast("새 페이지를 만들었습니다");
}

function saveSharedTitle(nextTitle) {
  if (!isSharedAdmin()) {
    showToast("관리자만 제목을 수정할 수 있습니다");
    return;
  }
  getActiveSharedPage().title = String(nextTitle || "").trim();
  setSharedTitleEditing(false);
  renderSharedBoard();
  pushSharedBoard();
}

function addSharedTodo(memberId, text) {
  if (!canEditSharedMemberTodos(memberId)) {
    showToast("본인 할 일만 추가할 수 있습니다");
    return false;
  }
  const cleaned = String(text || "").trim();
  if (!cleaned) {
    return false;
  }
  const createdBy = currentAccount?.id || memberId;
  const byAdmin =
    isSharedAdmin() &&
    String(memberId).toUpperCase() !== SHARED_ADMIN_ID.toUpperCase();
  const nextItem = {
    id: createSharedTodoId(),
    text: cleaned,
    done: false,
    createdBy,
    createdAt: Date.now(),
    byAdmin,
  };
  const page = getActiveSharedPage();
  page.todos[memberId] = [...(page.todos[memberId] || []), nextItem];
  renderSharedBoard();
  pushSharedBoard({ silent: true });
  return true;
}

function toggleSharedTodo(memberId, todoId) {
  const list = getActiveSharedPage().todos[memberId] || [];
  const target = list.find((item) => item.id === todoId);
  if (!target) {
    return;
  }
  target.done = !target.done;
  renderSharedBoard();
  pushSharedBoard({ silent: true });
}

function removeSharedTodo(memberId, todoId) {
  if (!(canEditSharedMemberTodos(memberId) || isSharedAdmin())) {
    showToast("삭제 권한이 없습니다");
    return;
  }
  const page = getActiveSharedPage();
  page.todos[memberId] = (page.todos[memberId] || []).filter(
    (item) => item.id !== todoId,
  );
  renderSharedBoard();
  pushSharedBoard({ silent: true });
}

function enterShared(account) {
  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.key);
  sharedLabel.textContent = account.id;
  loginError.hidden = true;
  loginForm.reset();
  setSharedTitleEditing(false);
  showPage("shared");
  startSharedBoardSync();
}

function normalizeSection(section) {
  return SECTIONS.includes(section) ? section : "routine";
}

function setActiveSection(section) {
  activeSection = normalizeSection(section);
  sessionStorage.setItem(SECTION_KEY, activeSection);

  sectionRoutine.hidden = activeSection !== "routine";
  sectionEconomy.hidden = activeSection !== "economy";
  sectionLanguage.hidden = activeSection !== "language";
  economyActions.classList.toggle("is-hidden", activeSection !== "economy");
  languageActions.classList.toggle("is-hidden", activeSection !== "language");
  routineActions.classList.toggle("is-hidden", activeSection !== "routine");
  headerActions.classList.toggle(
    "is-empty",
    activeSection !== "economy" &&
      activeSection !== "language" &&
      activeSection !== "routine",
  );

  pageTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.section === activeSection);
  });

  if (activeSection !== "economy" && !memoView.hidden) {
    closeMemoForm();
  }

  if (activeSection !== "language" && langFormView && !langFormView.hidden) {
    closeLangForm();
  }

  if (activeSection !== "routine") {
    closeRoutineSheet();
  }

  if (activeSection === "economy") {
    renderCalendar();
  }

  if (activeSection === "language") {
    renderLanguageCalendar();
  }

  if (activeSection === "routine") {
    ensureRoutineWeek({ notify: true });
    renderRoutineBoard();
  }
}

function todayDate() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

function startOfWeekMonday(date = new Date()) {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  const weekday = monday.getDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  monday.setDate(monday.getDate() + offset);
  return monday;
}

function currentRoutineWeekKey(date = new Date()) {
  return dateKey(startOfWeekMonday(date));
}

function weekDateList(monday) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    day.setHours(12, 0, 0, 0);
    return day;
  });
}

function majorityMonthOfWeek(monday) {
  const counts = new Map();
  weekDateList(monday).forEach((day) => {
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  let bestKey = "";
  let bestCount = -1;
  counts.forEach((count, key) => {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  });

  const [yearText, monthText] = bestKey.split("-");
  return {
    year: Number(yearText),
    monthIndex: Number(monthText),
  };
}

function firstMajorityWeekMonday(year, monthIndex) {
  let monday = startOfWeekMonday(new Date(year, monthIndex, 1));
  const majority = majorityMonthOfWeek(monday);
  if (majority.year !== year || majority.monthIndex !== monthIndex) {
    monday = new Date(monday);
    monday.setDate(monday.getDate() + 7);
  }
  return monday;
}

function weekNumberInMajorityMonth(monday) {
  const { year, monthIndex } = majorityMonthOfWeek(monday);
  const first = firstMajorityWeekMonday(year, monthIndex);
  const diffDays = Math.round((monday - first) / (24 * 60 * 60 * 1000));
  return {
    year,
    monthIndex,
    week: Math.floor(diffDays / 7) + 1,
  };
}

function formatRoutineWeekTitle(monday) {
  const { year, monthIndex, week } = weekNumberInMajorityMonth(monday);
  const shortYear = String(year).slice(-2);
  return `${shortYear}년 ${monthIndex + 1}월 ${week}주차`;
}

function normalizeWeekBucket(bucket) {
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) {
    return { checks: {}, cleaning: {}, exercise: {}, memo: "" };
  }

  if (
    "checks" in bucket ||
    "cleaning" in bucket ||
    "exercise" in bucket ||
    "memo" in bucket
  ) {
    return {
      checks:
        bucket.checks && typeof bucket.checks === "object" && !Array.isArray(bucket.checks)
          ? bucket.checks
          : {},
      cleaning:
        bucket.cleaning &&
        typeof bucket.cleaning === "object" &&
        !Array.isArray(bucket.cleaning)
          ? bucket.cleaning
          : {},
      exercise:
        bucket.exercise &&
        typeof bucket.exercise === "object" &&
        !Array.isArray(bucket.exercise)
          ? bucket.exercise
          : {},
      memo: typeof bucket.memo === "string" ? bucket.memo : "",
    };
  }

  // Older shape stored routine day checks directly on the week object.
  return { checks: bucket, cleaning: {}, exercise: {}, memo: "" };
}

function loadRoutineWeekState() {
  const state = readJson(ROUTINE_WEEK_KEY, null);
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return { activeWeekKey: "", weeks: {} };
  }

  // Migrate previous single-week shape: { weekKey, checks }
  if (state.checks && !state.weeks) {
    const weekKey = typeof state.weekKey === "string" ? state.weekKey : "";
    return {
      activeWeekKey: weekKey,
      weeks: weekKey
        ? {
            [weekKey]: normalizeWeekBucket({
              checks:
                state.checks && typeof state.checks === "object"
                  ? state.checks
                  : {},
            }),
          }
        : {},
    };
  }

  const weeks = {};
  if (state.weeks && typeof state.weeks === "object" && !Array.isArray(state.weeks)) {
    Object.entries(state.weeks).forEach(([weekKey, bucket]) => {
      weeks[weekKey] = normalizeWeekBucket(bucket);
    });
  }

  return {
    activeWeekKey:
      typeof state.activeWeekKey === "string" ? state.activeWeekKey : "",
    weeks,
  };
}

function saveRoutineWeekState(state) {
  writeJson(ROUTINE_WEEK_KEY, state);
}

function ensureRoutineWeek({ notify = false } = {}) {
  const weekKey = currentRoutineWeekKey();
  const state = loadRoutineWeekState();
  if (state.activeWeekKey === weekKey) {
    if (!routineViewMonday) {
      routineViewMonday = startOfWeekMonday();
    }
    return false;
  }

  const weeks = { ...state.weeks };
  if (!weeks[weekKey]) {
    weeks[weekKey] = { checks: {}, cleaning: {}, exercise: {}, memo: "" };
  } else {
    weeks[weekKey] = normalizeWeekBucket(weeks[weekKey]);
  }
  saveRoutineWeekState({ activeWeekKey: weekKey, weeks });
  routineViewMonday = startOfWeekMonday();

  if (notify && activeSection === "routine") {
    showToast("새 주가 시작되어 루틴이 리셋되었습니다");
  }
  return true;
}

function viewedRoutineWeekKey() {
  if (!routineViewMonday) {
    routineViewMonday = startOfWeekMonday();
  }
  return dateKey(routineViewMonday);
}

function weekBucket(weekKey) {
  const state = loadRoutineWeekState();
  return normalizeWeekBucket(state.weeks?.[weekKey]);
}

function isRoutineChecked(itemId, dayKey, weekKey = viewedRoutineWeekKey()) {
  return Boolean(weekBucket(weekKey).checks?.[itemId]?.[dayKey]);
}

function setRoutineChecked(itemId, dayKey, checked) {
  ensureRoutineWeek();
  const weekKey = viewedRoutineWeekKey();
  const state = loadRoutineWeekState();
  const bucket = normalizeWeekBucket(state.weeks[weekKey]);
  const itemChecks = { ...(bucket.checks[itemId] || {}) };
  if (checked) {
    itemChecks[dayKey] = true;
  } else {
    delete itemChecks[dayKey];
  }
  bucket.checks = { ...bucket.checks, [itemId]: itemChecks };
  state.weeks = { ...state.weeks, [weekKey]: bucket };
  saveRoutineWeekState(state);
}

function isCleaningChecked(itemId, weekKey = viewedRoutineWeekKey()) {
  return Boolean(weekBucket(weekKey).cleaning?.[itemId]);
}

function setCleaningChecked(itemId, checked) {
  ensureRoutineWeek();
  const weekKey = viewedRoutineWeekKey();
  const state = loadRoutineWeekState();
  const bucket = normalizeWeekBucket(state.weeks[weekKey]);
  const cleaning = { ...bucket.cleaning };
  if (checked) {
    cleaning[itemId] = true;
  } else {
    delete cleaning[itemId];
  }
  bucket.cleaning = cleaning;
  state.weeks = { ...state.weeks, [weekKey]: bucket };
  saveRoutineWeekState(state);
}

function exerciseDaysFor(itemId, weekKey = viewedRoutineWeekKey()) {
  const days = weekBucket(weekKey).exercise?.[itemId];
  return days && typeof days === "object" && !Array.isArray(days) ? days : {};
}

function isExerciseDayChecked(itemId, dayKey, weekKey = viewedRoutineWeekKey()) {
  return Boolean(exerciseDaysFor(itemId, weekKey)[dayKey]);
}

function exerciseCheckedCount(itemId, weekKey = viewedRoutineWeekKey()) {
  return Object.keys(exerciseDaysFor(itemId, weekKey)).length;
}

function setExerciseDayChecked(itemId, dayKey, checked) {
  ensureRoutineWeek();
  const weekKey = viewedRoutineWeekKey();
  const state = loadRoutineWeekState();
  const bucket = normalizeWeekBucket(state.weeks[weekKey]);
  const itemDays = { ...(bucket.exercise[itemId] || {}) };
  if (checked) {
    itemDays[dayKey] = true;
  } else {
    delete itemDays[dayKey];
  }
  bucket.exercise = { ...bucket.exercise, [itemId]: itemDays };
  state.weeks = { ...state.weeks, [weekKey]: bucket };
  saveRoutineWeekState(state);
}

function shiftRoutineWeek(delta) {
  if (!routineViewMonday) {
    routineViewMonday = startOfWeekMonday();
  }
  const next = new Date(routineViewMonday);
  next.setDate(routineViewMonday.getDate() + delta * 7);
  routineViewMonday = next;
  renderRoutineBoard();
}

function getRoutineMemo(weekKey = viewedRoutineWeekKey()) {
  return weekBucket(weekKey).memo || "";
}

function saveRoutineMemo(text) {
  ensureRoutineWeek();
  const weekKey = viewedRoutineWeekKey();
  const state = loadRoutineWeekState();
  const bucket = normalizeWeekBucket(state.weeks[weekKey]);
  bucket.memo = text;
  state.weeks = { ...state.weeks, [weekKey]: bucket };
  saveRoutineWeekState(state);
}

function renderRoutineMemo() {
  const weekKey = viewedRoutineWeekKey();
  if (routineMemoLoadedWeek === weekKey) {
    return;
  }
  routineMemoInput.value = getRoutineMemo(weekKey);
  routineMemoLoadedWeek = weekKey;
  routineMemoInput.readOnly = false;
}

function closeRoutineSheet() {
  if (!routineSheet) {
    return;
  }
  routineSheet.hidden = true;
}

function renderCleaningList() {
  const weekKey = viewedRoutineWeekKey();
  cleaningList.replaceChildren();
  const doneCount = CLEANING_ITEMS.filter((item) =>
    isCleaningChecked(item.id, weekKey),
  ).length;
  cleaningCount.textContent = `${doneCount}/${CLEANING_ITEMS.length}`;

  CLEANING_ITEMS.forEach((item) => {
    const done = isCleaningChecked(item.id, weekKey);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "clean-item";
    if (done) {
      button.classList.add("is-done");
    }
    button.setAttribute("aria-pressed", done ? "true" : "false");

    const box = document.createElement("span");
    box.className = "clean-item__box";
    box.setAttribute("aria-hidden", "true");
    box.textContent = done ? "✓" : "";

    const label = document.createElement("span");
    label.className = "clean-item__label";
    label.textContent = item.label;

    button.append(box, label);
    button.addEventListener("click", () => {
      setCleaningChecked(item.id, !done);
      renderCleaningList();
    });
    cleaningList.appendChild(button);
  });
}

function renderExerciseList() {
  if (!routineViewMonday) {
    routineViewMonday = startOfWeekMonday();
  }
  const weekKey = viewedRoutineWeekKey();
  const days = weekDateList(routineViewMonday);
  exerciseList.replaceChildren();

  EXERCISE_MATRIX_GROUPS.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      const divider = document.createElement("div");
      divider.className = "exercise-divider";
      divider.setAttribute("aria-hidden", "true");
      exerciseList.appendChild(divider);
    }

    group.forEach((item) => {
      const count = exerciseCheckedCount(item.id, weekKey);
      const done = count >= EXERCISE_DONE_MIN;
      const row = document.createElement("div");
      row.className = "exercise-row";
      if (done) {
        row.classList.add("is-done");
      }

      const label = document.createElement("p");
      label.className = "exercise-row__label";
      label.textContent = item.label;
      row.appendChild(label);

      const dayGroup = document.createElement("div");
      dayGroup.className = "exercise-row__days";

      days.forEach((day, index) => {
        const dayKey = dateKey(day);
        const checked = isExerciseDayChecked(item.id, dayKey, weekKey);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "exercise-check";
        button.textContent = checked ? "✓" : ROUTINE_DAY_LABELS[index];
        button.setAttribute(
          "aria-label",
          `${item.label} ${ROUTINE_DAY_LABELS[index]}`,
        );
        button.setAttribute("aria-pressed", checked ? "true" : "false");
        if (checked) {
          button.classList.add("is-checked");
        }
        button.addEventListener("click", () => {
          setExerciseDayChecked(item.id, dayKey, !checked);
          renderExerciseList();
        });
        dayGroup.appendChild(button);
      });

      row.appendChild(dayGroup);
      exerciseList.appendChild(row);
    });
  });
}

function renderRoutineBoard() {
  ensureRoutineWeek();
  if (!routineViewMonday) {
    routineViewMonday = startOfWeekMonday();
  }

  const monday = routineViewMonday;
  const weekKey = dateKey(monday);
  const days = weekDateList(monday);
  const today = todayDate();

  routineWeekTitle.textContent = formatRoutineWeekTitle(monday);
  renderCleaningList();
  renderExerciseList();
  renderRoutineMemo();
  routineMatrix.replaceChildren();

  const head = document.createElement("div");
  head.className = "routine-matrix__head";
  const headSpacer = document.createElement("span");
  headSpacer.className = "routine-matrix__spacer";
  head.appendChild(headSpacer);
  days.forEach((day, index) => {
    const label = document.createElement("span");
    label.className = "routine-matrix__day";
    if (sameDay(day, today)) {
      label.classList.add("is-today");
    }
    const dateNum = document.createElement("span");
    dateNum.className = "routine-matrix__date";
    dateNum.textContent = String(day.getDate());
    const weekday = document.createElement("span");
    weekday.className = "routine-matrix__weekday";
    weekday.textContent = ROUTINE_DAY_LABELS[index];
    label.append(dateNum, weekday);
    head.appendChild(label);
  });
  routineMatrix.appendChild(head);

  ROUTINE_MATRIX_GROUPS.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      const divider = document.createElement("div");
      divider.className = "routine-matrix__divider";
      divider.setAttribute("aria-hidden", "true");
      routineMatrix.appendChild(divider);
    }

    group.forEach((item) => {
      const row = document.createElement("div");
      row.className = "routine-matrix__row";

      const name = document.createElement("p");
      name.className = "routine-matrix__label";
      name.textContent = item.label;
      row.appendChild(name);

      days.forEach((day) => {
        const dayKey = dateKey(day);
        const checked = isRoutineChecked(item.id, dayKey, weekKey);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "routine-check";
        button.textContent = "✓";
        button.setAttribute(
          "aria-label",
          `${item.label} ${day.getMonth() + 1}/${day.getDate()}`,
        );
        button.setAttribute("aria-pressed", checked ? "true" : "false");
        if (checked) {
          button.classList.add("is-done");
        }
        if (sameDay(day, today)) {
          button.classList.add("is-today");
        }
        button.addEventListener("click", () => {
          setRoutineChecked(item.id, dayKey, !checked);
          renderRoutineBoard();
        });
        row.appendChild(button);
      });

      routineMatrix.appendChild(row);
    });
  });
}

function startRoutineWeekWatcher() {
  window.clearInterval(routineWeekTimer);
  routineWeekTimer = window.setInterval(() => {
    if (ensureRoutineWeek({ notify: true }) && activeSection === "routine") {
      renderRoutineBoard();
    }
  }, 60 * 1000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }
    if (ensureRoutineWeek({ notify: true }) && activeSection === "routine") {
      renderRoutineBoard();
    }
  });
}

function langCategoryById(id) {
  return LANG_CATEGORIES.find((item) => item.id === id) || null;
}

function closeLangPickers() {
  langYearPickerPanel.hidden = true;
  langMonthPickerPanel.hidden = true;
  langDayPickerPanel.hidden = true;
  langCategoryPanel.hidden = true;
}

function syncLangDateButtons() {
  langYearPickerBtn.textContent = `${langFormDate.getFullYear()}년`;
  langMonthPickerBtn.textContent = `${langFormDate.getMonth() + 1}월`;
  langDayPickerBtn.textContent = `${langFormDate.getDate()}일`;
}

function clampLangFormDay() {
  const maxDay = daysInMonth(langFormDate.getFullYear(), langFormDate.getMonth());
  if (langFormDate.getDate() > maxDay) {
    langFormDate = new Date(
      langFormDate.getFullYear(),
      langFormDate.getMonth(),
      maxDay,
      12,
    );
  }
}

function syncLangCategoryButton() {
  const category = langCategoryById(selectedLangCategory);
  if (!category) {
    langCategoryDot.classList.add("is-empty");
    langCategoryDot.style.background = "";
    langCategoryLabel.textContent = "분류 선택";
    return;
  }
  langCategoryDot.classList.remove("is-empty");
  langCategoryDot.style.background = category.color;
  langCategoryLabel.textContent = category.label;
}

function renderLangYearPanel() {
  const currentYear = new Date().getFullYear();
  langYearPickerPanel.replaceChildren();
  for (let year = currentYear + 1; year >= currentYear - 10; year -= 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "picker-option";
    option.textContent = `${year}년`;
    if (year === langFormDate.getFullYear()) {
      option.classList.add("is-selected");
    }
    option.addEventListener("click", () => {
      langFormDate = new Date(year, langFormDate.getMonth(), langFormDate.getDate(), 12);
      clampLangFormDay();
      syncLangDateButtons();
      closeLangPickers();
    });
    langYearPickerPanel.appendChild(option);
  }
}

function renderLangMonthPanel() {
  langMonthPickerPanel.replaceChildren();
  for (let month = 1; month <= 12; month += 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "picker-option";
    option.textContent = `${month}월`;
    if (month === langFormDate.getMonth() + 1) {
      option.classList.add("is-selected");
    }
    option.addEventListener("click", () => {
      langFormDate = new Date(
        langFormDate.getFullYear(),
        month - 1,
        langFormDate.getDate(),
        12,
      );
      clampLangFormDay();
      syncLangDateButtons();
      closeLangPickers();
    });
    langMonthPickerPanel.appendChild(option);
  }
}

function renderLangDayPanel() {
  const total = daysInMonth(langFormDate.getFullYear(), langFormDate.getMonth());
  langDayPickerPanel.replaceChildren();
  for (let day = 1; day <= total; day += 1) {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "picker-option";
    option.textContent = `${day}일`;
    if (day === langFormDate.getDate()) {
      option.classList.add("is-selected");
    }
    option.addEventListener("click", () => {
      langFormDate = new Date(
        langFormDate.getFullYear(),
        langFormDate.getMonth(),
        day,
        12,
      );
      syncLangDateButtons();
      closeLangPickers();
    });
    langDayPickerPanel.appendChild(option);
  }
}

function renderLangCategoryPanel() {
  langCategoryPanel.replaceChildren();
  LANG_CATEGORIES.forEach((category) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "category-option";
    if (category.id === selectedLangCategory) {
      option.classList.add("is-selected");
    }

    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.style.background = category.color;

    const label = document.createElement("span");
    label.textContent = category.label;

    option.append(dot, label);
    option.addEventListener("click", () => {
      selectedLangCategory = category.id;
      syncLangCategoryButton();
      closeLangPickers();
    });
    langCategoryPanel.appendChild(option);
  });
}

function toggleLangPicker(panel, render) {
  const willOpen = panel.hidden;
  closeLangPickers();
  if (!willOpen) {
    return;
  }
  render();
  panel.hidden = false;
}

function fillLangForm(values = null) {
  langFormDate = values?.date ? parseDateKey(values.date) : todayDate();
  selectedLangCategory = values?.category || "";
  langStartTime.value = values?.startTime || "";
  langEndTime.value = values?.endTime || "";
  langBody.value = values?.body || "";
  syncLangDateButtons();
  syncLangCategoryButton();
  closeLangPickers();
}

function resetLangForm() {
  editingLangDraftId = null;
  editingLangEntryId = null;
  fillLangForm(null);
}

function getLangFormValues() {
  return {
    date: dateKey(langFormDate),
    startTime: langStartTime.value,
    endTime: langEndTime.value,
    category: selectedLangCategory,
    body: langBody.value.trim(),
  };
}

function openLangForm(values = null, draftId = null, entryId = null) {
  editingLangDraftId = draftId;
  editingLangEntryId = entryId;
  fillLangForm(values);
  homeHeader.hidden = true;
  languageView.hidden = true;
  langFormView.hidden = false;
}

function closeLangForm() {
  editingLangDraftId = null;
  editingLangEntryId = null;
  closeLangPickers();
  langFormView.hidden = true;
  homeHeader.hidden = false;
  languageView.hidden = false;
  renderLanguageCalendar();
}

function loadLanguageDrafts() {
  const drafts = readJson(LANGUAGE_DRAFTS_KEY, []);
  return Array.isArray(drafts) ? drafts : [];
}

function saveLanguageDrafts(drafts) {
  writeJson(LANGUAGE_DRAFTS_KEY, drafts);
}

function saveLangDraft() {
  const values = getLangFormValues();
  if (!values.startTime && !values.endTime && !values.category && !values.body) {
    showToast("저장할 내용을 입력해 주세요");
    return;
  }

  const drafts = loadLanguageDrafts();
  const now = Date.now();

  if (editingLangDraftId) {
    const index = drafts.findIndex((item) => item.id === editingLangDraftId);
    if (index >= 0) {
      drafts[index] = { ...drafts[index], ...values, updatedAt: now };
      saveLanguageDrafts(drafts);
      showToast("임시저장했습니다");
      return;
    }
  }

  const draft = {
    id: `lang-draft-${now}`,
    ...values,
    updatedAt: now,
  };
  drafts.unshift(draft);
  editingLangDraftId = draft.id;
  saveLanguageDrafts(drafts);
  showToast("임시저장했습니다");
}

function openLangDraftSheet() {
  closeLangPickers();
  renderLangDraftList();
  langDraftSheet.hidden = false;
}

function closeLangDraftSheet() {
  langDraftSheet.hidden = true;
}

function renderLangDraftList() {
  const drafts = loadLanguageDrafts()
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);
  langDraftList.replaceChildren();

  if (!drafts.length) {
    const empty = document.createElement("p");
    empty.className = "draft-empty";
    empty.textContent = "임시저장된 내용이 없습니다.";
    langDraftList.appendChild(empty);
    return;
  }

  drafts.forEach((draft) => {
    const row = document.createElement("div");
    row.className = "draft-item";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "draft-item__main";
    const category = langCategoryById(draft.category);
    const title = draft.body || `${draft.startTime || "--:--"}-${draft.endTime || "--:--"}`;
    const previewTitle = title.length > 40 ? `${title.slice(0, 40)}…` : title;
    const meta = `${draft.date || ""}${category ? ` · ${category.label}` : ""}`;
    loadBtn.innerHTML = `<strong>${previewTitle}</strong><span>${meta}</span>`;
    loadBtn.addEventListener("click", () => {
      closeLangDraftSheet();
      openLangForm(draft, draft.id, null);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "draft-item__delete";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => {
      saveLanguageDrafts(loadLanguageDrafts().filter((item) => item.id !== draft.id));
      renderLangDraftList();
      showToast("임시저장을 삭제했습니다");
    });

    row.append(loadBtn, deleteBtn);
    langDraftList.appendChild(row);
  });
}

function saveLangEntry() {
  if (!selectedLangCategory) {
    showToast("분류를 선택해 주세요");
    return;
  }
  if (!langStartTime.value || !langEndTime.value) {
    showToast("시작·종료 시간을 입력해 주세요");
    return;
  }
  if (langStartTime.value >= langEndTime.value) {
    showToast("종료 시간은 시작 시간 이후여야 합니다");
    return;
  }
  if (!langBody.value.trim()) {
    showToast("메모를 작성해 주세요");
    return;
  }

  const values = getLangFormValues();
  const entries = loadLanguageEntries();
  const now = Date.now();

  if (editingLangEntryId) {
    const index = entries.findIndex((item) => item.id === editingLangEntryId);
    if (index >= 0) {
      entries[index] = {
        ...entries[index],
        ...values,
        updatedAt: now,
      };
      saveLanguageEntries(entries);
      editingLangEntryId = null;
    }
  } else {
    entries.push({
      id: `lang-${now}`,
      ...values,
      createdAt: now,
    });
    saveLanguageEntries(entries);
  }

  if (editingLangDraftId) {
    saveLanguageDrafts(
      loadLanguageDrafts().filter((item) => item.id !== editingLangDraftId),
    );
    editingLangDraftId = null;
  }

  const savedDate = parseDateKey(values.date);
  langViewYear = savedDate.getFullYear();
  langViewMonth = savedDate.getMonth();
  selectedLangDateKey = values.date;
  showToast("저장했습니다");
  closeLangForm();
}

function deleteLangEntry(entryId) {
  if (!window.confirm("이 내용을 삭제할까요?")) {
    return;
  }
  saveLanguageEntries(loadLanguageEntries().filter((item) => item.id !== entryId));
  showToast("삭제했습니다");
  renderLanguageCalendar();
}

function renderLanguageDayDetail() {
  if (!selectedLangDateKey) {
    langDayDetailHint.hidden = false;
    langDayDetailHint.textContent = "날짜를 선택하면 저장된 내용이 여기에 표시됩니다.";
    langDayDetailContent.hidden = true;
    langDayDetailList.replaceChildren();
    return;
  }

  const date = parseDateKey(selectedLangDateKey);
  const dayEntries = loadLanguageEntries()
    .filter((entry) => entry.date === selectedLangDateKey)
    .slice()
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

  langDayDetailTitle.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

  if (!dayEntries.length) {
    langDayDetailHint.hidden = false;
    langDayDetailHint.textContent = "이 날짜에 저장된 내용이 없습니다.";
    langDayDetailContent.hidden = true;
    langDayDetailList.replaceChildren();
    return;
  }

  langDayDetailHint.hidden = true;
  langDayDetailContent.hidden = false;
  langDayDetailList.replaceChildren();

  dayEntries.forEach((entry) => {
    const category = langCategoryById(entry.category);
    const block = document.createElement("div");
    block.className = "day-memo-block";

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

    const time = document.createElement("p");
    time.className = "day-memo__time";
    time.textContent = `${entry.startTime}~${entry.endTime}`;
    head.appendChild(time);

    const durationText = formatStudyDuration(entry.startTime, entry.endTime);
    if (durationText) {
      const duration = document.createElement("p");
      duration.className = "day-memo__duration";
      duration.textContent = durationText;
      head.appendChild(duration);
    }

    card.appendChild(head);

    if (entry.body) {
      const body = document.createElement("p");
      body.className = "day-memo__body";
      body.textContent = entry.body;
      card.appendChild(body);
    }

    const actions = document.createElement("div");
    actions.className = "day-memo__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "day-memo__action";
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", () => {
      openLangForm(entry, null, entry.id);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "day-memo__action is-danger";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => {
      deleteLangEntry(entry.id);
    });

    actions.append(editBtn, deleteBtn);
    block.append(card, actions);
    langDayDetailList.appendChild(block);
  });
}

function selectLangDay(year, monthIndex, day) {
  selectedLangDateKey = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
  renderLanguageCalendar();
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

function monthPrefix(year, monthIndex) {
  return `${year}-${pad2(monthIndex + 1)}-`;
}

function achievedDaysInMonth(year, monthIndex) {
  const prefix = monthPrefix(year, monthIndex);
  const days = new Set(
    loadMemos()
      .filter((memo) => typeof memo.date === "string" && memo.date.startsWith(prefix))
      .map((memo) => memo.date),
  );
  return days.size;
}

function renderAchievePanel() {
  const totalDays = daysInMonth(viewYear, viewMonth);
  const achieved = achievedDaysInMonth(viewYear, viewMonth);
  const percent = totalDays ? Math.round((achieved / totalDays) * 100) : 0;

  achievePercent.textContent = String(percent);
  achieveCount.textContent = `${achieved}일 / ${totalDays}일`;
  achieveBarFill.style.width = `${percent}%`;
}

function loadLanguageEntries() {
  const entries = readJson(LANGUAGE_ENTRIES_KEY, []);
  return Array.isArray(entries) ? entries : [];
}

function saveLanguageEntries(entries) {
  writeJson(LANGUAGE_ENTRIES_KEY, entries);
}

function languageEntriesForDay(year, monthIndex, day) {
  const key = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
  return loadLanguageEntries().filter((entry) => entry.date === key);
}

function languageDaysInMonth(year, monthIndex) {
  const prefix = monthPrefix(year, monthIndex);
  return new Set(
    loadLanguageEntries()
      .filter((entry) => typeof entry.date === "string" && entry.date.startsWith(prefix))
      .map((entry) => entry.date),
  );
}

function primaryLangCategory(dayEntries) {
  const latest = dayEntries[dayEntries.length - 1];
  return langCategoryById(latest?.category) || null;
}

function renderLanguageAchievePanel() {
  const totalDays = daysInMonth(langViewYear, langViewMonth);
  const achieved = languageDaysInMonth(langViewYear, langViewMonth).size;
  const percent = totalDays ? Math.round((achieved / totalDays) * 100) : 0;

  langAchievePercent.textContent = String(percent);
  langAchieveCount.textContent = `${achieved}일 / ${totalDays}일`;
  langAchieveBarFill.style.width = `${percent}%`;
}

function languageMinutesInMonth(year, monthIndex) {
  const prefix = monthPrefix(year, monthIndex);
  return loadLanguageEntries().reduce((sum, entry) => {
    if (typeof entry.date !== "string" || !entry.date.startsWith(prefix)) {
      return sum;
    }
    const start = timeToMinutes(entry.startTime);
    const end = timeToMinutes(entry.endTime);
    if (start === null || end === null || end <= start) {
      return sum;
    }
    return sum + (end - start);
  }, 0);
}

function renderLanguageStudyTimePanel() {
  const totalMinutes = languageMinutesInMonth(langViewYear, langViewMonth);
  langStudyTotal.textContent = formatMinutesLabel(totalMinutes);
  langStudyHint.textContent =
    totalMinutes > 0 ? "이번 달 총 공부시간" : "아직 기록된 공부시간이 없습니다";
}

function renderLanguageCalendar() {
  const today = new Date();
  const firstDay = new Date(langViewYear, langViewMonth, 1);
  const totalDays = daysInMonth(langViewYear, langViewMonth);
  const startWeekday = firstDay.getDay();

  langCalendarTitle.textContent = `${langViewYear}년 ${langViewMonth + 1}월`;
  langCalendarGrid.replaceChildren();

  for (let i = 0; i < startWeekday; i += 1) {
    const cell = document.createElement("div");
    cell.className = "calendar-cell is-empty";
    langCalendarGrid.appendChild(cell);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(langViewYear, langViewMonth, day);
    const key = dateKey(date);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    cell.setAttribute(
      "aria-label",
      `${langViewYear}년 ${langViewMonth + 1}월 ${day}일`,
    );

    const number = document.createElement("span");
    number.className = "calendar-day";
    number.textContent = String(day);
    cell.appendChild(number);

    const dayEntries = languageEntriesForDay(langViewYear, langViewMonth, day);
    const category = dayEntries.length ? primaryLangCategory(dayEntries) : null;

    if (category) {
      cell.classList.add("has-memo");
      cell.style.background = category.soft;
    } else if (sameDay(date, today)) {
      cell.classList.add("is-today");
    }

    if (selectedLangDateKey === key) {
      cell.classList.add("is-selected");
    }

    cell.addEventListener("click", () =>
      selectLangDay(langViewYear, langViewMonth, day),
    );
    langCalendarGrid.appendChild(cell);
  }

  renderLanguageAchievePanel();
  renderLanguageStudyTimePanel();
  renderLanguageDayDetail();
}

function shiftLanguageMonth(delta) {
  const next = new Date(langViewYear, langViewMonth + delta, 1);
  langViewYear = next.getFullYear();
  langViewMonth = next.getMonth();
  selectedLangDateKey = null;
  renderLanguageCalendar();
}

function categoryCountsInMonth(year, monthIndex) {
  const prefix = monthPrefix(year, monthIndex);
  const counts = Object.fromEntries(CATEGORIES.map((item) => [item.id, 0]));
  let total = 0;

  loadMemos().forEach((memo) => {
    if (typeof memo.date !== "string" || !memo.date.startsWith(prefix)) {
      return;
    }
    if (!counts.hasOwnProperty(memo.category)) {
      return;
    }
    counts[memo.category] += 1;
    total += 1;
  });

  return { counts, total };
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describeSlice(cx, cy, radius, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.999) {
    const mid = startAngle + 180;
    const first = describeSlice(cx, cy, radius, startAngle, mid);
    const second = describeSlice(cx, cy, radius, mid, endAngle);
    return `${first} ${second}`;
  }

  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArc,
    0,
    end.x,
    end.y,
    "L",
    cx,
    cy,
    "Z",
  ].join(" ");
}

function renderChartPanel() {
  chartBody.replaceChildren();

  const { counts, total } = categoryCountsInMonth(viewYear, viewMonth);
  const slices = CATEGORIES.map((category) => ({
    ...category,
    count: counts[category.id] || 0,
  })).filter((item) => item.count > 0);

  if (!total) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "이번 달 작성된 메모가 없습니다.";
    chartBody.appendChild(empty);
    return;
  }

  const layout = document.createElement("div");
  layout.className = "chart-layout";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 160 160");
  svg.setAttribute("class", "chart-svg");
  svg.setAttribute("aria-hidden", "true");

  const cx = 80;
  const cy = 80;
  const radius = 70;
  let angle = 0;

  slices.forEach((slice) => {
    const sweep = (slice.count / total) * 360;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeSlice(cx, cy, radius, angle, angle + sweep));
    path.setAttribute("fill", slice.soft || slice.color);
    svg.appendChild(path);
    angle += sweep;
  });

  const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hole.setAttribute("cx", String(cx));
  hole.setAttribute("cy", String(cy));
  hole.setAttribute("r", "38");
  hole.setAttribute("fill", "#fff");
  svg.appendChild(hole);

  const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerText.setAttribute("x", String(cx));
  centerText.setAttribute("y", String(cy - 4));
  centerText.setAttribute("text-anchor", "middle");
  centerText.setAttribute("class", "chart-center-value");
  centerText.textContent = String(total);

  const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerLabel.setAttribute("x", String(cx));
  centerLabel.setAttribute("y", String(cy + 14));
  centerLabel.setAttribute("text-anchor", "middle");
  centerLabel.setAttribute("class", "chart-center-label");
  centerLabel.textContent = "건";

  svg.append(centerText, centerLabel);

  const legend = document.createElement("div");
  legend.className = "chart-legend";

  slices.forEach((slice) => {
    const row = document.createElement("div");
    row.className = "chart-legend__row";

    const left = document.createElement("span");
    left.className = "chart-legend__name";
    const dot = document.createElement("span");
    dot.className = "category-dot";
    dot.style.background = slice.color;
    const name = document.createElement("span");
    name.textContent = slice.label;
    left.append(dot, name);

    const right = document.createElement("span");
    right.className = "chart-legend__value";
    const percent = Math.round((slice.count / total) * 100);
    right.textContent = `${slice.count}건 · ${percent}%`;

    row.append(left, right);
    legend.appendChild(row);
  });

  layout.append(svg, legend);
  chartBody.appendChild(layout);
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
      const block = document.createElement("div");
      block.className = "day-memo-block";

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

      const actions = document.createElement("div");
      actions.className = "day-memo__actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "day-memo__action";
      editBtn.textContent = "수정";
      editBtn.addEventListener("click", () => {
        openMemoForm(memo, null, memo.id);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "day-memo__action is-danger";
      deleteBtn.textContent = "삭제";
      deleteBtn.addEventListener("click", () => {
        deleteMemo(memo.id);
      });

      actions.append(editBtn, deleteBtn);
      block.append(card, actions);
      dayDetailList.appendChild(block);
    });
}

function deleteMemo(memoId) {
  if (!window.confirm("이 메모를 삭제할까요?")) {
    return;
  }

  const next = loadMemos().filter((item) => item.id !== memoId);
  saveMemos(next);
  showToast("삭제했습니다");
  renderCalendar();
  renderDayDetail();
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

  renderAchievePanel();
  renderChartPanel();
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

function openMemoForm(values = null, draftId = null, memoId = null) {
  editingDraftId = draftId;
  editingMemoId = memoId;
  fillForm(values || { date: dateKey(yesterdayDate()) });
  homeHeader.hidden = true;
  calendarView.hidden = true;
  memoView.hidden = false;
}

function closeMemoForm() {
  editingDraftId = null;
  editingMemoId = null;
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
  const now = Date.now();

  if (editingMemoId) {
    const index = memos.findIndex((item) => item.id === editingMemoId);
    if (index >= 0) {
      memos[index] = {
        ...memos[index],
        ...values,
        updatedAt: now,
      };
      saveMemos(memos);
      editingMemoId = null;
      const savedDate = parseDateKey(values.date);
      viewYear = savedDate.getFullYear();
      viewMonth = savedDate.getMonth();
      selectedDateKey = values.date;
      showToast("수정했습니다");
      closeMemoForm();
      return;
    }
  }

  memos.push({
    id: `memo-${now}`,
    ...values,
    createdAt: now,
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

function enterHome(account, { section } = {}) {
  if (isSharedAccount(account)) {
    enterShared(account);
    return;
  }

  currentAccount = account;
  sessionStorage.setItem(SESSION_KEY, account.key);
  homeLabel.textContent = account.id;
  loginError.hidden = true;
  loginForm.reset();
  closeMemoForm();
  closeDraftSheet();
  closeRoutineSheet();
  ensureRoutineWeek();
  const nextSection =
    section || sessionStorage.getItem(SECTION_KEY) || "routine";
  setActiveSection(nextSection);
  showPage("home");
}

function logout() {
  currentAccount = null;
  stopSharedBoardSync();
  setSharedTitleEditing(false);
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SECTION_KEY);
  loginError.hidden = true;
  loginForm.reset();
  closeMemoForm();
  closeDraftSheet();
  showPage("login");
  loginId.focus();
}

function restoreSession() {
  const savedKey = sessionStorage.getItem(SESSION_KEY);
  if (!savedKey) {
    showPage("login");
    return;
  }

  const account =
    ACCOUNTS.find((item) => item.key === savedKey) ||
    ACCOUNTS.find(
      (item) =>
        item.role === "personal" &&
        item.id.toUpperCase() === savedKey.toUpperCase(),
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
  if (isSharedAccount(account)) {
    enterShared(account);
    return;
  }
  enterHome(account, { section: "routine" });
});

function memosInMonth(year, monthIndex) {
  const prefix = monthPrefix(year, monthIndex);
  return loadMemos()
    .filter((memo) => typeof memo.date === "string" && memo.date.startsWith(prefix))
    .slice()
    .sort((a, b) => {
      if (a.date === b.date) {
        return (a.createdAt || 0) - (b.createdAt || 0);
      }
      return a.date.localeCompare(b.date);
    });
}

function buildPdfPieChart(year, monthIndex) {
  const { counts, total } = categoryCountsInMonth(year, monthIndex);
  const slices = CATEGORIES.map((category) => ({
    ...category,
    count: counts[category.id] || 0,
  })).filter((item) => item.count > 0);

  const wrap = document.createElement("div");
  wrap.className = "pdf-pie";

  const canvas = document.createElement("canvas");
  canvas.className = "pdf-chart-canvas";
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");
  const cx = 120;
  const cy = 120;
  const radius = 104;
  const hole = 56;

  if (!total) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#efe8da";
    ctx.fill();
  } else {
    let angle = -Math.PI / 2;
    slices.forEach((slice) => {
      const sweep = (slice.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + sweep);
      ctx.closePath();
      ctx.fillStyle = slice.soft || slice.color;
      ctx.fill();
      angle += sweep;
    });
  }

  ctx.beginPath();
  ctx.arc(cx, cy, hole, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#222222";
  ctx.font = "800 34px Pretendard, Apple SD Gothic Neo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(total), cx, cy - 8);

  ctx.fillStyle = "#8a8174";
  ctx.font = "700 16px Pretendard, Apple SD Gothic Neo, sans-serif";
  ctx.fillText("건", cx, cy + 18);

  wrap.appendChild(canvas);
  return { wrap, total, slices };
}

function buildPdfCalendar(year, monthIndex, kind = "economy") {
  const wrap = document.createElement("div");
  const weekdays = document.createElement("div");
  weekdays.className = "pdf-cal-weekdays";
  ["일", "월", "화", "수", "목", "금", "토"].forEach((label) => {
    const span = document.createElement("span");
    span.textContent = label;
    weekdays.appendChild(span);
  });

  const grid = document.createElement("div");
  grid.className = "pdf-cal-grid";
  const startWeekday = new Date(year, monthIndex, 1).getDay();
  const totalDays = daysInMonth(year, monthIndex);

  for (let i = 0; i < startWeekday; i += 1) {
    const empty = document.createElement("div");
    empty.className = "pdf-cal-cell is-empty";
    grid.appendChild(empty);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const cell = document.createElement("div");
    cell.className = "pdf-cal-cell";
    cell.textContent = String(day);
    const category =
      kind === "language"
        ? (() => {
            const dayEntries = languageEntriesForDay(year, monthIndex, day);
            return dayEntries.length ? primaryLangCategory(dayEntries) : null;
          })()
        : (() => {
            const dayMemos = memosForDay(year, monthIndex, day);
            return dayMemos.length ? primaryMemoCategory(dayMemos) : null;
          })();
    if (category) {
      cell.classList.add("has-memo");
      cell.style.background = category.soft;
    }
    grid.appendChild(cell);
  }

  wrap.append(weekdays, grid);
  return wrap;
}

function languageEntriesInMonth(year, monthIndex) {
  const prefix = monthPrefix(year, monthIndex);
  return loadLanguageEntries()
    .filter((entry) => typeof entry.date === "string" && entry.date.startsWith(prefix))
    .slice()
    .sort((a, b) => {
      if (a.date === b.date) {
        return String(a.startTime || "").localeCompare(String(b.startTime || ""));
      }
      return a.date.localeCompare(b.date);
    });
}

function buildLanguagePdfSheet(year, monthIndex) {
  const host = document.createElement("div");
  host.className = "pdf-host";
  host.setAttribute("aria-hidden", "true");

  const root = document.createElement("div");
  root.className = "pdf-root";

  const title = document.createElement("h1");
  title.className = "pdf-title";
  title.textContent = `${year}년 ${monthIndex + 1}월`;
  root.appendChild(title);

  const row = document.createElement("div");
  row.className = "pdf-row pdf-row--language";

  const achieveCard = document.createElement("section");
  achieveCard.className = "pdf-card pdf-card--achieve";
  const achieveTitle = document.createElement("h2");
  achieveTitle.className = "pdf-card__title";
  achieveTitle.textContent = "달성률";
  const totalDays = daysInMonth(year, monthIndex);
  const achieved = languageDaysInMonth(year, monthIndex).size;
  const percent = totalDays ? Math.round((achieved / totalDays) * 100) : 0;
  const achieveValue = document.createElement("p");
  achieveValue.className = "pdf-achieve-value";
  achieveValue.textContent = `${percent}%`;
  const achieveCountText = document.createElement("p");
  achieveCountText.className = "pdf-achieve-count";
  achieveCountText.textContent = `${achieved}일 / ${totalDays}일`;
  const bar = document.createElement("div");
  bar.className = "pdf-achieve-bar";
  const fill = document.createElement("div");
  fill.className = "pdf-achieve-bar__fill";
  fill.style.width = `${percent}%`;
  bar.appendChild(fill);
  achieveCard.append(achieveTitle, achieveValue, achieveCountText, bar);

  const studyCard = document.createElement("section");
  studyCard.className = "pdf-card pdf-card--study";
  const studyTitle = document.createElement("h2");
  studyTitle.className = "pdf-card__title";
  studyTitle.textContent = "공부시간";
  const studyValue = document.createElement("p");
  studyValue.className = "pdf-achieve-value";
  const totalMinutes = languageMinutesInMonth(year, monthIndex);
  studyValue.textContent = formatMinutesLabel(totalMinutes);
  const studyHint = document.createElement("p");
  studyHint.className = "pdf-achieve-count";
  studyHint.textContent =
    totalMinutes > 0 ? "이번 달 총 공부시간" : "기록된 공부시간 없음";
  studyCard.append(studyTitle, studyValue, studyHint);

  const calendarCard = document.createElement("section");
  calendarCard.className = "pdf-card pdf-card--calendar";
  const calendarTitleEl = document.createElement("h2");
  calendarTitleEl.className = "pdf-card__title";
  calendarTitleEl.textContent = "캘린더";
  calendarCard.append(
    calendarTitleEl,
    buildPdfCalendar(year, monthIndex, "language"),
  );

  row.append(achieveCard, studyCard, calendarCard);
  root.appendChild(row);

  const tableWrap = document.createElement("div");
  tableWrap.className = "pdf-table-wrap";
  const table = document.createElement("table");
  table.className = "pdf-table pdf-table--language";
  const thead = document.createElement("thead");
  thead.innerHTML =
    "<tr><th>날짜</th><th>분류</th><th>시작시간</th><th>끝난시간</th><th>공부시간</th><th>메모 상세</th></tr>";
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const monthEntries = languageEntriesInMonth(year, monthIndex);

  if (!monthEntries.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="6" style="text-align:center;color:#8a8174;font-weight:700;">이번 달 작성된 기록이 없습니다.</td>';
    tbody.appendChild(emptyRow);
  } else {
    monthEntries.forEach((entry) => {
      const category = langCategoryById(entry.category);
      const tr = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = `${Number(entry.date.slice(-2))}일`;

      const catCell = document.createElement("td");
      const cat = document.createElement("span");
      cat.className = "pdf-cat";
      const dot = document.createElement("span");
      dot.className = "category-dot";
      dot.style.background = category?.color || "#8a8174";
      const label = document.createElement("span");
      label.textContent = category?.label || "미분류";
      cat.append(dot, label);
      catCell.appendChild(cat);

      const startCell = document.createElement("td");
      startCell.textContent = entry.startTime || "-";

      const endCell = document.createElement("td");
      endCell.textContent = entry.endTime || "-";

      const durationCell = document.createElement("td");
      durationCell.textContent =
        formatStudyDuration(entry.startTime, entry.endTime) || "-";

      const detailCell = document.createElement("td");
      const detail = document.createElement("div");
      detail.className = "pdf-memo-detail";
      if (entry.body) {
        const body = document.createElement("div");
        body.className = "pdf-memo-body";
        body.textContent = entry.body;
        detail.appendChild(body);
      } else {
        detail.textContent = "-";
      }
      detailCell.appendChild(detail);

      tr.append(dateCell, catCell, startCell, endCell, durationCell, detailCell);
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  root.appendChild(tableWrap);
  host.appendChild(root);
  return { host, root };
}

function buildPdfSheet(year, monthIndex) {
  const host = document.createElement("div");
  host.className = "pdf-host";
  host.setAttribute("aria-hidden", "true");

  const root = document.createElement("div");
  root.className = "pdf-root";

  const title = document.createElement("h1");
  title.className = "pdf-title";
  title.textContent = `${year}년 ${monthIndex + 1}월`;
  root.appendChild(title);

  const row = document.createElement("div");
  row.className = "pdf-row";

  const achieveCard = document.createElement("section");
  achieveCard.className = "pdf-card pdf-card--achieve";
  const achieveTitle = document.createElement("h2");
  achieveTitle.className = "pdf-card__title";
  achieveTitle.textContent = "달성률";
  const totalDays = daysInMonth(year, monthIndex);
  const achieved = achievedDaysInMonth(year, monthIndex);
  const percent = totalDays ? Math.round((achieved / totalDays) * 100) : 0;
  const achieveValue = document.createElement("p");
  achieveValue.className = "pdf-achieve-value";
  achieveValue.textContent = `${percent}%`;
  const achieveCountText = document.createElement("p");
  achieveCountText.className = "pdf-achieve-count";
  achieveCountText.textContent = `${achieved}일 / ${totalDays}일`;
  const bar = document.createElement("div");
  bar.className = "pdf-achieve-bar";
  const fill = document.createElement("div");
  fill.className = "pdf-achieve-bar__fill";
  fill.style.width = `${percent}%`;
  bar.appendChild(fill);
  achieveCard.append(achieveTitle, achieveValue, achieveCountText, bar);

  const chartCard = document.createElement("section");
  chartCard.className = "pdf-card pdf-card--chart";
  const chartTitle = document.createElement("h2");
  chartTitle.className = "pdf-card__title";
  chartTitle.textContent = "통계";
  const chartWrap = document.createElement("div");
  chartWrap.className = "pdf-chart-wrap";
  const pie = buildPdfPieChart(year, monthIndex);
  chartWrap.appendChild(pie.wrap);
  if (!pie.total) {
    const empty = document.createElement("p");
    empty.className = "pdf-empty";
    empty.textContent = "작성된 메모 없음";
    chartWrap.appendChild(empty);
  } else {
    const legend = document.createElement("div");
    legend.className = "pdf-chart-legend";
    pie.slices.forEach((slice) => {
      const legendRow = document.createElement("div");
      legendRow.className = "pdf-chart-legend__row";
      const name = document.createElement("span");
      name.className = "pdf-chart-legend__name";
      const dot = document.createElement("span");
      dot.className = "category-dot";
      dot.style.background = slice.color;
      const label = document.createElement("span");
      label.textContent = slice.label;
      name.append(dot, label);
      const value = document.createElement("span");
      value.textContent = `${Math.round((slice.count / pie.total) * 100)}%`;
      legendRow.append(name, value);
      legend.appendChild(legendRow);
    });
    chartWrap.appendChild(legend);
  }
  chartCard.append(chartTitle, chartWrap);

  const calendarCard = document.createElement("section");
  calendarCard.className = "pdf-card pdf-card--calendar";
  const calendarTitleEl = document.createElement("h2");
  calendarTitleEl.className = "pdf-card__title";
  calendarTitleEl.textContent = "캘린더";
  calendarCard.append(calendarTitleEl, buildPdfCalendar(year, monthIndex));

  row.append(achieveCard, chartCard, calendarCard);
  root.appendChild(row);

  const tableWrap = document.createElement("div");
  tableWrap.className = "pdf-table-wrap";
  const table = document.createElement("table");
  table.className = "pdf-table";
  const colgroup = document.createElement("colgroup");
  ["72px", "96px", "auto"].forEach((width) => {
    const col = document.createElement("col");
    col.style.width = width;
    colgroup.appendChild(col);
  });
  table.appendChild(colgroup);

  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>날짜</th><th>분류</th><th>메모 상세</th></tr>";
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  const monthMemos = memosInMonth(year, monthIndex);

  if (!monthMemos.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML =
      '<td colspan="3" style="text-align:center;color:#8a8174;font-weight:700;">이번 달 작성된 메모가 없습니다.</td>';
    tbody.appendChild(emptyRow);
  } else {
    monthMemos.forEach((memo) => {
      const category = categoryById(memo.category);
      const tr = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = `${Number(memo.date.slice(-2))}일`;

      const catCell = document.createElement("td");
      const cat = document.createElement("span");
      cat.className = "pdf-cat";
      const dot = document.createElement("span");
      dot.className = "category-dot";
      dot.style.background = category?.color || "#8a8174";
      const label = document.createElement("span");
      label.textContent = category?.label || "미분류";
      cat.append(dot, label);
      catCell.appendChild(cat);

      const detailCell = document.createElement("td");
      const detail = document.createElement("div");
      detail.className = "pdf-memo-detail";
      if (memo.url) {
        const url = document.createElement("div");
        url.className = "pdf-memo-url";
        url.textContent = memo.url;
        detail.appendChild(url);
      }
      if (memo.body) {
        const body = document.createElement("div");
        body.className = "pdf-memo-body";
        body.textContent = memo.body;
        detail.appendChild(body);
      }
      if (!memo.url && !memo.body) {
        detail.textContent = "-";
      }
      detailCell.appendChild(detail);

      tr.append(dateCell, catCell, detailCell);
      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  root.appendChild(tableWrap);
  host.appendChild(root);
  return { host, root };
}

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function buildPdfCheckMark(done) {
  const mark = document.createElement("span");
  mark.className = done ? "pdf-check is-done" : "pdf-check";
  mark.textContent = done ? "✓" : "";
  return mark;
}

function buildRoutinePdfSheet(monday) {
  const weekKey = dateKey(monday);
  const days = weekDateList(monday);
  const host = document.createElement("div");
  host.className = "pdf-host";
  host.setAttribute("aria-hidden", "true");

  const root = document.createElement("div");
  root.className = "pdf-root";

  const title = document.createElement("h1");
  title.className = "pdf-title";
  title.textContent = formatRoutineWeekTitle(monday);
  root.appendChild(title);

  const row = document.createElement("div");
  row.className = "pdf-row pdf-row--routine";

  const cleaningCard = document.createElement("section");
  cleaningCard.className = "pdf-card";
  const cleaningTitle = document.createElement("h2");
  cleaningTitle.className = "pdf-card__title";
  const cleaningDone = CLEANING_ITEMS.filter((item) =>
    isCleaningChecked(item.id, weekKey),
  ).length;
  cleaningTitle.textContent = `청소 ${cleaningDone}/${CLEANING_ITEMS.length}`;
  cleaningCard.appendChild(cleaningTitle);

  const cleaningListEl = document.createElement("div");
  cleaningListEl.className = "pdf-clean-list";
  CLEANING_ITEMS.forEach((item) => {
    const done = isCleaningChecked(item.id, weekKey);
    const line = document.createElement("div");
    line.className = done ? "pdf-clean-item is-done" : "pdf-clean-item";
    line.append(buildPdfCheckMark(done));
    const label = document.createElement("span");
    label.textContent = item.label;
    line.appendChild(label);
    cleaningListEl.appendChild(line);
  });
  cleaningCard.appendChild(cleaningListEl);

  const exerciseCard = document.createElement("section");
  exerciseCard.className = "pdf-card";
  const exerciseTitle = document.createElement("h2");
  exerciseTitle.className = "pdf-card__title";
  exerciseTitle.textContent = "운동";
  exerciseCard.appendChild(exerciseTitle);

  const exerciseBody = document.createElement("div");
  exerciseBody.className = "pdf-exercise-list";
  EXERCISE_MATRIX_GROUPS.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      const divider = document.createElement("div");
      divider.className = "pdf-routine-divider";
      exerciseBody.appendChild(divider);
    }
    group.forEach((item) => {
      const count = exerciseCheckedCount(item.id, weekKey);
      const done = count >= EXERCISE_DONE_MIN;
      const line = document.createElement("div");
      line.className = done ? "pdf-exercise-row is-done" : "pdf-exercise-row";
      const label = document.createElement("span");
      label.className = "pdf-exercise-label";
      label.textContent = item.label;
      line.appendChild(label);
      const dayGroup = document.createElement("div");
      dayGroup.className = "pdf-exercise-days";
      days.forEach((day, index) => {
        const dayKey = dateKey(day);
        const checked = isExerciseDayChecked(item.id, dayKey, weekKey);
        const cell = document.createElement("span");
        cell.className = checked ? "pdf-day-check is-done" : "pdf-day-check";
        cell.textContent = checked ? "✓" : ROUTINE_DAY_LABELS[index];
        dayGroup.appendChild(cell);
      });
      line.appendChild(dayGroup);
      exerciseBody.appendChild(line);
    });
  });
  exerciseCard.appendChild(exerciseBody);

  const routineCard = document.createElement("section");
  routineCard.className = "pdf-card";
  const routineTitle = document.createElement("h2");
  routineTitle.className = "pdf-card__title";
  routineTitle.textContent = "루틴";
  routineCard.appendChild(routineTitle);

  const matrix = document.createElement("div");
  matrix.className = "pdf-routine-matrix";
  const head = document.createElement("div");
  head.className = "pdf-routine-matrix__head";
  head.appendChild(document.createElement("span"));
  days.forEach((day, index) => {
    const cell = document.createElement("span");
    cell.className = "pdf-routine-matrix__day";
    const dateNum = document.createElement("span");
    dateNum.textContent = String(day.getDate());
    const weekday = document.createElement("span");
    weekday.textContent = ROUTINE_DAY_LABELS[index];
    cell.append(dateNum, weekday);
    head.appendChild(cell);
  });
  matrix.appendChild(head);

  ROUTINE_MATRIX_GROUPS.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      const divider = document.createElement("div");
      divider.className = "pdf-routine-divider";
      matrix.appendChild(divider);
    }
    group.forEach((item) => {
      const line = document.createElement("div");
      line.className = "pdf-routine-matrix__row";
      const label = document.createElement("span");
      label.className = "pdf-routine-matrix__label";
      label.textContent = item.label;
      line.appendChild(label);
      days.forEach((day) => {
        const dayKey = dateKey(day);
        const checked = isRoutineChecked(item.id, dayKey, weekKey);
        line.appendChild(buildPdfCheckMark(checked));
      });
      matrix.appendChild(line);
    });
  });
  routineCard.appendChild(matrix);

  row.append(cleaningCard, exerciseCard, routineCard);
  root.appendChild(row);
  host.appendChild(root);
  return { host, root };
}

async function downloadRoutineWeekPdf() {
  if (!routineViewMonday) {
    routineViewMonday = startOfWeekMonday();
  }
  const monday = routineViewMonday;
  const { host, root } = buildRoutinePdfSheet(monday);
  document.body.appendChild(host);
  const filename = `kitegamemode-routine-${dateKey(monday)}.pdf`;
  try {
    await savePdfFromRoot(root, filename, routinePdfBtn);
  } finally {
    host.remove();
  }
}

async function savePdfFromRoot(root, filename, button) {
  if (typeof html2pdf === "undefined") {
    showToast("PDF 기능을 불러오지 못했습니다");
    return;
  }

  button.disabled = true;
  try {
    await waitForPaint();
    await html2pdf()
      .set({
        margin: [8, 8, 8, 8],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: root.scrollWidth,
          windowHeight: root.scrollHeight,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all"] },
      })
      .from(root)
      .save();
    showToast("PDF를 저장했습니다");
  } catch (error) {
    showToast("PDF 저장에 실패했습니다");
  } finally {
    button.disabled = false;
  }
}

async function downloadMonthPdf() {
  const { host, root } = buildPdfSheet(viewYear, viewMonth);
  document.body.appendChild(host);
  const filename = `kitegamemode-${viewYear}-${pad2(viewMonth + 1)}.pdf`;
  try {
    await savePdfFromRoot(root, filename, pdfBtn);
  } finally {
    host.remove();
  }
}

async function downloadLanguageMonthPdf() {
  const { host, root } = buildLanguagePdfSheet(langViewYear, langViewMonth);
  document.body.appendChild(host);
  const filename = `kitegamemode-language-${langViewYear}-${pad2(langViewMonth + 1)}.pdf`;
  try {
    await savePdfFromRoot(root, filename, langPdfBtn);
  } finally {
    host.remove();
  }
}

logoutBtn.addEventListener("click", logout);
sharedLogoutBtn.addEventListener("click", logout);
sharedTitleEditBtn.addEventListener("click", () => {
  if (!isSharedAdmin()) {
    return;
  }
  setSharedTitleEditing(true);
  renderSharedTitle();
});
sharedTitleCancelBtn.addEventListener("click", () => {
  setSharedTitleEditing(false);
  renderSharedTitle();
});
sharedTitleEditForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveSharedTitle(sharedTitleInput.value);
});
sharedAddPageBtn.addEventListener("click", () => {
  addSharedPage();
});
sharedPagePrev.addEventListener("click", () => {
  shiftSharedPage(-1);
});
sharedPageNext.addEventListener("click", () => {
  shiftSharedPage(1);
});
sharedTodoPanels.forEach((panel) => {
  const form = panel.querySelector("[data-todo-form]");
  const input = panel.querySelector("[data-todo-input]");
  const list = panel.querySelector("[data-todo-list]");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (addSharedTodo(panel.dataset.member, input.value)) {
      input.value = "";
      input.focus();
    }
  });

  list.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl || !list.contains(actionEl)) {
      return;
    }
    const { action, member, id } = actionEl.dataset;
    if (action === "toggle") {
      toggleSharedTodo(member, id);
      return;
    }
    if (action === "remove") {
      removeSharedTodo(member, id);
    }
  });
});
pageTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveSection(tab.dataset.section);
  });
});
addMemoBtn.addEventListener("click", () => openMemoForm());
addLangBtn.addEventListener("click", () => openLangForm());
routineWeekPrev.addEventListener("click", () => shiftRoutineWeek(-1));
routineWeekNext.addEventListener("click", () => shiftRoutineWeek(1));
routineMemoEditBtn.addEventListener("click", () => {
  routineMemoInput.readOnly = false;
  routineMemoInput.focus();
  const length = routineMemoInput.value.length;
  routineMemoInput.setSelectionRange(length, length);
});
routineMemoSaveBtn.addEventListener("click", () => {
  saveRoutineMemo(routineMemoInput.value);
  routineMemoLoadedWeek = viewedRoutineWeekKey();
  showToast("메모를 저장했습니다");
});
routineMemoInput.addEventListener("focus", () => {
  routineMemoInput.readOnly = false;
});
if (routineSheetBackdrop) {
  routineSheetBackdrop.addEventListener("click", closeRoutineSheet);
}
if (routineSheetClose) {
  routineSheetClose.addEventListener("click", closeRoutineSheet);
}
pdfBtn.addEventListener("click", () => {
  downloadMonthPdf();
});
langPdfBtn.addEventListener("click", () => {
  downloadLanguageMonthPdf();
});
routinePdfBtn.addEventListener("click", () => {
  downloadRoutineWeekPdf();
});
memoBackBtn.addEventListener("click", closeMemoForm);
langFormBackBtn.addEventListener("click", closeLangForm);
langFormSaveBtn.addEventListener("click", saveLangEntry);
langDraftListBtn.addEventListener("click", openLangDraftSheet);
langDraftSaveBtn.addEventListener("click", saveLangDraft);
langDraftSheetBackdrop.addEventListener("click", closeLangDraftSheet);
langDraftSheetClose.addEventListener("click", closeLangDraftSheet);
langYearPickerBtn.addEventListener("click", () =>
  toggleLangPicker(langYearPickerPanel, renderLangYearPanel),
);
langMonthPickerBtn.addEventListener("click", () =>
  toggleLangPicker(langMonthPickerPanel, renderLangMonthPanel),
);
langDayPickerBtn.addEventListener("click", () =>
  toggleLangPicker(langDayPickerPanel, renderLangDayPanel),
);
langCategoryBtn.addEventListener("click", () =>
  toggleLangPicker(langCategoryPanel, renderLangCategoryPanel),
);
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
langCalendarPrev.addEventListener("click", () => shiftLanguageMonth(-1));
langCalendarNext.addEventListener("click", () => shiftLanguageMonth(1));

startRoutineWeekWatcher();
restoreSession();
