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
const pdfBtn = document.getElementById("pdfBtn");
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
const achieveMonth = document.getElementById("achieveMonth");
const achievePercent = document.getElementById("achievePercent");
const achieveCount = document.getElementById("achieveCount");
const achieveBarFill = document.getElementById("achieveBarFill");
const chartMonth = document.getElementById("chartMonth");
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
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();
let selectedDateKey = null;
let editingDraftId = null;
let editingMemoId = null;
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

  achieveMonth.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  achievePercent.textContent = String(percent);
  achieveCount.textContent = `${achieved}일 / ${totalDays}일`;
  achieveBarFill.style.width = `${percent}%`;
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
  chartMonth.textContent = `${viewYear}년 ${viewMonth + 1}월`;
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

function buildPdfPieSvg(year, monthIndex) {
  const { counts, total } = categoryCountsInMonth(year, monthIndex);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 160 160");
  svg.setAttribute("class", "pdf-chart-svg");

  if (!total) {
    const emptyCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    emptyCircle.setAttribute("cx", "80");
    emptyCircle.setAttribute("cy", "80");
    emptyCircle.setAttribute("r", "70");
    emptyCircle.setAttribute("fill", "#efe8da");
    svg.appendChild(emptyCircle);
    return { svg, total: 0, slices: [] };
  }

  const slices = CATEGORIES.map((category) => ({
    ...category,
    count: counts[category.id] || 0,
  })).filter((item) => item.count > 0);

  let angle = 0;
  slices.forEach((slice) => {
    const sweep = (slice.count / total) * 360;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", describeSlice(80, 80, 70, angle, angle + sweep));
    path.setAttribute("fill", slice.soft || slice.color);
    svg.appendChild(path);
    angle += sweep;
  });

  const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  hole.setAttribute("cx", "80");
  hole.setAttribute("cy", "80");
  hole.setAttribute("r", "38");
  hole.setAttribute("fill", "#fff");
  svg.appendChild(hole);

  const centerText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerText.setAttribute("x", "80");
  centerText.setAttribute("y", "76");
  centerText.setAttribute("text-anchor", "middle");
  centerText.setAttribute("fill", "#222");
  centerText.setAttribute("font-size", "22");
  centerText.setAttribute("font-weight", "800");
  centerText.textContent = String(total);

  const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  centerLabel.setAttribute("x", "80");
  centerLabel.setAttribute("y", "94");
  centerLabel.setAttribute("text-anchor", "middle");
  centerLabel.setAttribute("fill", "#8a8174");
  centerLabel.setAttribute("font-size", "11");
  centerLabel.setAttribute("font-weight", "700");
  centerLabel.textContent = "건";

  svg.append(centerText, centerLabel);
  return { svg, total, slices };
}

function buildPdfCalendar(year, monthIndex) {
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
    const dayMemos = memosForDay(year, monthIndex, day);
    const category = dayMemos.length ? primaryMemoCategory(dayMemos) : null;
    if (category) {
      cell.classList.add("has-memo");
      cell.style.background = category.soft;
    }
    grid.appendChild(cell);
  }

  wrap.append(weekdays, grid);
  return wrap;
}

function buildPdfSheet(year, monthIndex) {
  const root = document.createElement("div");
  root.className = "pdf-root";
  root.setAttribute("aria-hidden", "true");

  const title = document.createElement("h1");
  title.className = "pdf-title";
  title.textContent = `${year}년 ${monthIndex + 1}월`;
  root.appendChild(title);

  const row = document.createElement("div");
  row.className = "pdf-row";

  const achieveCard = document.createElement("section");
  achieveCard.className = "pdf-card";
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
  chartCard.className = "pdf-card";
  const chartTitle = document.createElement("h2");
  chartTitle.className = "pdf-card__title";
  chartTitle.textContent = "원형 도표";
  const chartWrap = document.createElement("div");
  chartWrap.className = "pdf-chart-wrap";
  const pie = buildPdfPieSvg(year, monthIndex);
  chartWrap.appendChild(pie.svg);
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
  calendarCard.className = "pdf-card";
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
  table.innerHTML =
    "<thead><tr><th>날짜</th><th>분류</th><th>메모 상세</th></tr></thead>";
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
  return root;
}

async function downloadMonthPdf() {
  if (typeof html2pdf === "undefined") {
    showToast("PDF 기능을 불러오지 못했습니다");
    return;
  }

  pdfBtn.disabled = true;
  const sheet = buildPdfSheet(viewYear, viewMonth);
  document.body.appendChild(sheet);
  const filename = `kitegamemode-${viewYear}-${pad2(viewMonth + 1)}.pdf`;

  try {
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      })
      .from(sheet)
      .save();
    showToast("PDF를 저장했습니다");
  } catch (error) {
    showToast("PDF 저장에 실패했습니다");
  } finally {
    sheet.remove();
    pdfBtn.disabled = false;
  }
}

logoutBtn.addEventListener("click", logout);
addMemoBtn.addEventListener("click", () => openMemoForm());
pdfBtn.addEventListener("click", () => {
  downloadMonthPdf();
});
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
