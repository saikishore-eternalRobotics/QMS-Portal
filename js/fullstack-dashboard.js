// fullstack-dashboard.js
// Refactored and robust version for dashboard interactivity + charts + sheet fetches

// ---------- Utility: robust CSV parser (handles quoted commas/newlines) ----------
function parseCSV(text) {
  // Return array of rows, each row is array of cell strings
  // This is a simple, practical CSV parser using a state machine (handles quotes)
  const rows = [];
  let cur = [];
  let curCell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          // escaped quote
          curCell += '"';
          i += 2;
          continue;
        } else {
          // closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        curCell += ch;
        i++;
        continue;
      }
    } else {
      // not in quotes
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (ch === ",") {
        cur.push(curCell.trim());
        curCell = "";
        i++;
        continue;
      } else if (ch === "\r") {
        // ignore, handle on \n
        i++;
        continue;
      } else if (ch === "\n") {
        cur.push(curCell.trim());
        rows.push(cur);
        cur = [];
        curCell = "";
        i++;
        continue;
      } else {
        curCell += ch;
        i++;
        continue;
      }
    }
  }

  // flush
  if (curCell !== "" || cur.length > 0) {
    cur.push(curCell.trim());
    rows.push(cur);
  }

  return rows;
}

// ---------- Small helpers ----------
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

function buildProxyUrl(sheetUrl) {
  return CORS_PROXY + encodeURIComponent(sheetUrl);
}

function safeText(node, fallback = "") {
  return node ? node.textContent : fallback;
}

// ---------- Charts ----------
let chart1 = null;
let chart2 = null;

function initStaticChart1() {
  const el = document.getElementById("chart1");
  if (!el) return;
  const ctx = el.getContext("2d");
  if (chart1) chart1.destroy();
  chart1 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["BRS", "User Stories", "Process Map", "Test Cases"],
      datasets: [
        { label: "Required", data: [10, 8, 12, 6], backgroundColor: "#4e73df" },
        { label: "Actual", data: [8, 7, 10, 4], backgroundColor: "#a6c8ff" },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } },
  });
}

function renderPhaseChart(phaseCounts) {
  const el = document.getElementById("chart2");
  if (!el) return;
  const ctx = el.getContext("2d");
  if (chart2) chart2.destroy();

  const phases = Object.keys(phaseCounts);
  const fsData = phases.map((p) => phaseCounts[p].FS || 0);
  const bsData = phases.map((p) => phaseCounts[p].BS || 0);

  chart2 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: phases,
      datasets: [
        { label: "FS", data: fsData, backgroundColor: "green" },
        { label: "BS", data: bsData, backgroundColor: "yellow" },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "FS & BS Counts by Phase" },
      },
      scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
    },
  });
}

// ---------- Fetch and compute phase counts (from sheet CSV) ----------
const DEFAULT_PHASES = [
  "Initiating",
  "Planning",
  "Monitoring & Control",
  "Closing",
  "Change Control",
  "Implementation",
];

async function fetchPhaseDataFromSheet(sheetUrl, mainPhases = DEFAULT_PHASES) {
  try {
    const res = await fetch(buildProxyUrl(sheetUrl));
    const text = await res.text();
    const rows = parseCSV(text);
    // slice rows - try handle headers: find first row that looks like data (non-empty)
    const dataRows = rows.slice(2); // your original used slice(2), keep this behaviour
    const phaseCounts = {};
    mainPhases.forEach((p) => (phaseCounts[p] = { FS: 0, BS: 0 }));

    dataRows.forEach((row) => {
      const phase = (row[0] || "").replace(/["']/g, "").trim();
      // In your earlier code type was at index 2 — but this may differ, so guard
      const type = (row[2] || "").replace(/["']/g, "").trim();
      if (mainPhases.includes(phase)) {
        if (type === "FS") phaseCounts[phase].FS++;
        else if (type === "BS") phaseCounts[phase].BS++;
      }
    });

    return phaseCounts;
  } catch (err) {
    console.error("fetchPhaseDataFromSheet error:", err);
    return {};
  }
}

// ---------- Task management ----------
const tasksState = { agile: [], waterfall: [] };
const TASKS_SOURCES = {
  waterfall: "https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=513518262",
  agile: "https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=1213819790",
};

function updateMethodTabCounts() {
  // find only tabs that have data-method attribute AND are in right-column (.right-column .tabs)
  const container = document.querySelector(".right-column .tabs");
  if (!container) return;
  const methodButtons = Array.from(container.querySelectorAll(".tab[data-method]"));
  methodButtons.forEach((btn) => {
    const m = btn.dataset.method;
    const count = (tasksState[m] || []).length;
    // keep base label (capitalize) + count
    btn.textContent = `${m.charAt(0).toUpperCase() + m.slice(1)} (${count})`;
  });
}

function renderTasksForMethod(method) {
  const taskList = document.querySelector(".right-column .task-list");
  if (!taskList) return;
  taskList.innerHTML = "";

  const methodTasks = tasksState[method] || [];

  updateMethodTabCounts();

  if (methodTasks.length === 0) {
    const p = document.createElement("p");
    p.style.color = "#999";
    p.style.textAlign = "center";
    p.textContent = "No tasks available";
    taskList.appendChild(p);
    return;
  }

  methodTasks.forEach((t) => {
    const el = document.createElement("div");
    const statusClass = t.status ? t.status.toLowerCase().replace(/\s+/g, "-") : "in-progress";
    el.className = `task ${statusClass}`;
    const left = document.createElement("div");
    left.textContent = t.task || t.title || "Untitled task";
    const right = document.createElement("span");
    right.textContent = (t.status || "In Progress").toUpperCase();
    el.appendChild(left);
    el.appendChild(right);
    taskList.appendChild(el);
  });
}

// ---------- Fetch BA tasks (waterfall/agile) ----------
async function fetchWaterfallBATasks() {
  const url = TASKS_SOURCES.waterfall;
  try {
    const res = await fetch(buildProxyUrl(url));
    const text = await res.text();
    const rows = parseCSV(text);
    // using your previous logic: skip 2 header rows
    const dataRows = rows.slice(2);
    // filter column positions based on previous code: r[5] === "BA", task at r[3]
    const baTasks = dataRows
      .filter((r) => (r[5] || "").trim() === "BA")
      .map((r) => ({ task: (r[3] || "").replace(/["']/g, "").trim(), status: "In Progress", accountability: "BA" }))
      .filter((t) => t.task);

    tasksState.waterfall = baTasks;
    // re-render if waterfall tab active, otherwise just update counts
    const activeMethod = document.querySelector(".right-column .tabs .tab.active")?.dataset.method;
    if (activeMethod === "waterfall") renderTasksForMethod("waterfall");
    else updateMethodTabCounts();
  } catch (err) {
    console.error("fetchWaterfallBATasks error:", err);
  }
}

async function fetchAgileBATasks() {
  const url = TASKS_SOURCES.agile;
  try {
    const res = await fetch(buildProxyUrl(url));
    const text = await res.text();
    const rows = parseCSV(text);    
    if (rows.length <= 2) {
      tasksState.agile = [];
      updateMethodTabCounts();
      return;
    }
    const dataRows = rows.slice(2);

    // your earlier logic filtered r[4] === "CV" and used r[3] as task
    const baTasks = dataRows
      .filter((r) => ((r[5] || "").replace(/["']/g, "") === "CV"))
      .map((r) => ({ task: (r[3] || "").replace(/["']/g, "").trim(), status: "In Progress", accountability: "CV" }))
      .filter((t) => t.task);

      console.log("Agile BA Tasks fetched:", baTasks);
    tasksState.agile = baTasks;

    const activeMethod = document.querySelector(".right-column .tabs .tab.active")?.dataset.method;
    if (activeMethod === "agile") renderTasksForMethod("agile");
    else updateMethodTabCounts();
  } catch (err) {
    console.error("fetchAgileBATasks error:", err);
  }
}

// ---------- Initial DOM wiring ----------
function setupMethodologyTabs() {
  const container = document.querySelector(".right-column .tabs");
  if (!container) return;
  const buttons = Array.from(container.querySelectorAll(".tab[data-method]"));
  if (buttons.length === 0) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const method = btn.dataset.method;
      renderTasksForMethod(method);
    });
  });

  // initial: trigger active or first
  const initial = buttons.find((b) => b.classList.contains("active")) || buttons[0];
  initial.classList.add("active");
  renderTasksForMethod(initial.dataset.method);
  updateMethodTabCounts();
}

function setupRaidTabs() {
  // RAID tabs are separate; scope them inside raid-card
  const raidCard = document.querySelector(".raid-card");
  if (!raidCard) return;
  const tabs = Array.from(raidCard.querySelectorAll(".raid-tabs .tab"));
  const forms = raidCard.querySelectorAll(".raid-form, .raid-message-panel"); // future-proof

  tabs.forEach((tab, idx) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      // if you have multiple panels, show/hide here — for now we only have raid-form
      // no-op as we have single raid-form; keep structure for future
    });
  });
  // ensure first active
  if (tabs.length) tabs[0].classList.add("active");
}

function setupTemplateButtons() {
  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".template-card");
      if (!card) return;
      const input = card.querySelector(".new-template-input");
      const ul = card.querySelector("ul");
      const value = input.value.trim();
      if (value) {
        const li = document.createElement("li");
        li.textContent = value;
        ul.appendChild(li);
        input.value = "";
      }
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".template-card");
      if (!card) return;
      const ul = card.querySelector("ul");
      const items = ul.querySelectorAll("li");
      if (items.length === 0) return;
      ul.removeChild(items[items.length - 1]);
    });
  });
}

// ---------- Sign out fix ----------
function setupSignOut() {
  const btn = document.getElementById("signOutBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    // GET token before removing localStorage keys
    const token = localStorage.getItem("zohoToken");
    // remove local storage explicitly
    localStorage.removeItem("zohoToken");
    localStorage.removeItem("zohoUser");
    localStorage.removeItem("department");

    // call backend revoke (best-effort)
    try {
      if (token) {
        await fetch(`http://localhost:4000/zoho-logout?access_token=${encodeURIComponent(token)}`);
      }
    } catch (err) {
      // ignore but log
      console.warn("Error revoking Zoho token:", err);
    }

    // finally redirect to Zoho logout
    window.location.href = "https://accounts.zoho.in/logout";
  });
}

// ---------- Show Zoho user display name safely ----------
function populateZohoUser() {
  try {
    const zohoUser = JSON.parse(localStorage.getItem("zohoUser"));
    const nameNode = document.getElementById("userName");
    if (nameNode) {
      nameNode.textContent = (zohoUser && (zohoUser.Display_Name || zohoUser.display_name || zohoUser.name)) || "Guest";
    }
  } catch (err) {
    console.warn("Zoho user parse error:", err);
    const nameNode = document.getElementById("userName");
    if (nameNode) nameNode.textContent = "Guest";
  }
}

// ---------- Misc: fetch sheet and dump rows to console (debug helper) ----------
async function fetchSheetTableDebug() {
  const sheetUrl = TASKS_SOURCES.waterfall;
  try {
    const res = await fetch(buildProxyUrl(sheetUrl));
    const text = await res.text();
    const rows = parseCSV(text);
    // headers and data rows
    console.log("Sheet rows (debug):", rows.slice(0, 8));
  } catch (err) {
    console.error("fetchSheetTableDebug error:", err);
  }
}

// ---------- Init function ----------
async function initDashboard() {
  populateZohoUser();
  initStaticChart1();

  // phase chart: fetch and draw
  const phaseSheetUrl = TASKS_SOURCES.waterfall; // reusing main sheet for phase counts
  const phaseCounts = await fetchPhaseDataFromSheet(phaseSheetUrl);
  // if empty, fallback to zeroed phases
  const pc = Object.keys(phaseCounts).length ? phaseCounts : DEFAULT_PHASES.reduce((acc, p) => (acc[p] = { FS: 0, BS: 0 }, acc), {});
  renderPhaseChart(pc);

  // Setup UI
  setupMethodologyTabs();
  setupRaidTabs();
  setupTemplateButtons();
  setupSignOut();

  // Fetch tasks (parallel)
  fetchWaterfallBATasks();
  fetchAgileBATasks();

  // debug fetch
  // fetchSheetTableDebug();

  // expose for debug (remove in prod)
  window.__dashboard = {
    tasksState,
    renderTasksForMethod,
    fetchWaterfallBATasks,
    fetchAgileBATasks,
  };
}

// Run on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
