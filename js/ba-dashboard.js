// document.getElementById("uploadBtn").addEventListener("click", async () => {
//   const file = document.getElementById("file").files[0];
//   if (!file) return alert("Please select a file!");

//   // Convert file to base64
//   const base64 = await fileToBase64(file);

//   const payload = {
//     filename: file.name,
//     mimeType: file.type,
//     data: base64.split(",")[1], // remove data URL prefix
//   };

//   try {
//     const res = await fetch("https://script.google.com/macros/s/AKfycbwkPFulgZczmTvlMi2gICKBJqf5T1isBtu95ntwsTmWJKZGb3v0qc7ChMvbPAQCGWg6Sw/exec", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     console.log("Upload response status:", res.status);
//     const text = await res.text();
//     console.log("Response:", text);
//     alert("✅ File uploaded successfully!");
//     document.body.insertAdjacentHTML("beforeend", `<div>${text}</div>`);
//   } catch (err) {
//     console.error("❌ Upload failed:", err);
//     alert("❌ Upload failed!");
//   }
// });

// function fileToBase64(file) {
//   return new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = reject;
//     reader.readAsDataURL(file);
//   });
// }


const zohoUser = JSON.parse(localStorage.getItem("zohoUser"));
document.getElementById("userName").textContent = zohoUser?.Display_Name || "Guest";

// Optional Department
// const categoryUser = JSON.parse(localStorage.getItem("department"));
// document.getElementById("department").textContent = categoryUser || "—";

// -----------------------------
// CHART 1 — Static Comparison
// -----------------------------
const ctx1 = document.getElementById("chart1").getContext("2d");

new Chart(ctx1, {
  type: "bar",
  data: {
    labels: ["BRS", "User Stories", "Process Map", "Test Cases"],
    datasets: [
      { label: "Required", data: [10, 8, 12, 6], backgroundColor: "#4e73df" },
      { label: "Actual", data: [8, 7, 10, 4], backgroundColor: "#a6c8ff" },
    ],
  },
  options: {
    responsive: true,
    plugins: { legend: { position: "bottom" } },
  },
});

// -----------------------------
// CHART 2 — FS vs BS by Phase
// -----------------------------
async function fetchPhaseData() {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=513518262";
  const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(sheetUrl);

  const mainPhases = [
    "Initiating",
    "Planning",
    "Monitoring & Control",
    "Closing",
    "Change Control",
    "Implementation",
  ];

  try {
    const response = await fetch(url);
    const csvText = await response.text();

    const rows = csvText
      .trim()
      .split("\n")
      .map((row) => row.split(",").map((cell) => cell.trim()));

    const dataRows = rows.slice(2);
    const phaseCounts = {};
    mainPhases.forEach((p) => (phaseCounts[p] = { FS: 0, BS: 0 }));

    dataRows.forEach((row) => {
      const phase = row[0]?.replace(/["']/g, "") || "";
      const type = row[2]?.replace(/["']/g, "") || "";
      if (mainPhases.includes(phase)) {
        if (type === "FS") phaseCounts[phase].FS++;
        else if (type === "BS") phaseCounts[phase].BS++;
      }
    });

    return phaseCounts;
  } catch (err) {
    console.error("Error fetching phase data:", err);
    return {};
  }
}

async function renderChart() {
  const phaseCounts = await fetchPhaseData();
  const phases = Object.keys(phaseCounts);
  const fsData = phases.map((p) => phaseCounts[p].FS);
  const bsData = phases.map((p) => phaseCounts[p].BS);

  const ctx2 = document.getElementById("chart2").getContext("2d");

  new Chart(ctx2, {
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
renderChart();

// -----------------------------
// SHEET TABLE FETCH (for Debug)
// -----------------------------
async function fetchSheetTable() {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=513518262";
  const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(sheetUrl);
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const rows = csvText
      .trim()
      .split("\n")
      .map((row) => row.split(",").map((cell) => cell.trim()));
    console.table(rows);
    return rows;
  } catch (error) {
    console.error("Error fetching sheet:", error);
  }
}
fetchSheetTable();



// -----------------------------
// SIGN OUT LOGIC
// -----------------------------
document.getElementById("signOutBtn").addEventListener("click", async () => {
  const token = localStorage.getItem("zohoToken");

  localStorage.removeItem("zohoToken");
  localStorage.removeItem("zohoUser");
  localStorage.removeItem("department");

  if (token) {
    try {
      await fetch(`http://localhost:4000/zoho-logout?access_token=${token}`);
    } catch (err) {
      console.warn("Zoho logout API failed:", err);
    }
  }

  window.location.href = "https://accounts.zoho.in/logout";
  // Or redirect to login page:
  // window.location.href = "/html/login.html";
});

// -----------------------------
// TEMPLATE CARD ADD/DELETE
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".template-card");
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
      const ul = e.target.closest(".template-card").querySelector("ul");
      const lastItem = ul.querySelector("li:last-child");
      if (lastItem) ul.removeChild(lastItem);
    });
  });
});

// -----------------------------
// BA TASKS — AGILE / WATERFALL
// -----------------------------

const tabs = document.querySelectorAll(".tab");
const taskList = document.querySelector(".task-list");

const tasks = { agile: [], waterfall: [] };

function renderTasks(method) {
  taskList.innerHTML = "";
  const methodTasks = tasks[method] || [];

  tabs.forEach((tab) => {
    const m = tab.dataset.method;
    tab.textContent = `${m.charAt(0).toUpperCase() + m.slice(1)} (${tasks[m].length})`;
  });

  if (methodTasks.length === 0) {
    taskList.innerHTML = `<p style="color:#999; text-align:center;">No tasks available</p>`;
    return;
  }

  methodTasks.forEach((t) => {
    const div = document.createElement("div");
    div.className =
      "task " + (t.status ? t.status.toLowerCase().replace(/\s+/g, "-") : "in-progress");
    div.innerHTML = `${t.task} <span>${t.status || "In Progress"}</span>`;
    taskList.appendChild(div);
  });
}

// Waterfall Sheet
async function fetchBATasks() {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=513518262";
  const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(sheetUrl);

  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const rows = csvText
      .trim()
      .split("\n")
      .map((row) => row.split(",").map((cell) => cell.trim()));

    const dataRows = rows.slice(2);
    const baTasks = dataRows
      .filter((r) => r[5] === "BA")
      .map((r) => r[4])
      .filter(Boolean);

    tasks.waterfall = baTasks.map((task) => ({
      task,
      status: "In Progress",
      accountability: "BA",
    }));
    

    renderTasks(document.querySelector(".tab.active").dataset.method);
  } catch (err) {
    console.error("Error fetching Waterfall sheet:", err);
  }
}

// Agile Sheet
async function fetchAgileBATasks() {
  const sheetUrl =
    "https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=1213819790";
  const url = "https://api.allorigins.win/raw?url=" + encodeURIComponent(sheetUrl);

  try {
    const response = await fetch(url);
    const csvText = await response.text();

    const rows = csvText
      .trim()
      .split("\n")
      .map((row) => row.split(",").map((cell) => cell.trim()));

    if (rows.length <= 2) return;

    const dataRows = rows.slice(2);

    // Filter BA tasks from Agile sheet and set status to "In Progress"
    const baTasks = dataRows
      .filter((r) => r[4]?.replace(/["']/g, "") === "BA")
      .map((r) => ({
        task: r[3]?.replace(/["']/g, "") || "",
        status: "In Progress",   // <- force In Progress
        accountability: "BA",
      }))
      .filter((t) => t.task);

    tasks.agile = baTasks;
    // console.log("Agile BA Tasks fetched:", baTasks);

    // Re-render if Agile tab is active
    if (document.querySelector(".tab.active").dataset.method === "agile") {
      renderTasks("agile");
    }

  } catch (err) {
    console.error("Error fetching Agile sheet:", err);
  }
}


tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    renderTasks(tab.dataset.method);
  })
);

fetchBATasks();
fetchAgileBATasks();

console.log("Tasks: ", tasks);

// Your Google Sheet public CSV link
const sheetUrl = 'https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=513518262';
const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(sheetUrl);

const mainPhases = [
  "Initiating",
  "Planning",
  "Monitoring & Control",
  "Closing",
  "Change Control",
  "Implementation",
];

async function analyzePhases() {
  try {
    const res = await fetch(proxyUrl);
    const csvText = await res.text();

    // Parse CSV safely
    const rows = csvText
      .trim()
      .split('\n')
      .map(r => r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim()));

    console.log("✅ Sheet fetched, total rows:", rows.length);

    // Find counts of each phase
    const counts = {};
    mainPhases.forEach(phase => (counts[phase] = 0));

    // Loop through rows, skip header
    rows.slice(1).forEach(row => {
  const firstCol = row[0]; // First column (phase)
//   console.log("Processing row, first column:", firstCol);
  const lastCol = row[row.length - 3]?.trim(); // Last meaningful column (skip if undefined)
//   console.log("Processing row, last column:", lastCol);

  if (
    mainPhases.includes(firstCol) &&                 // valid phase
    lastCol &&                                       // not empty or null
    lastCol != "No Doc required"      // not "No Doc required"
) {
      console.log("yes");
    counts[firstCol]++;
  }
});


    // console.log("📊 Phase Counts:", counts);
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

analyzePhases();

const templates = {
  agile: [
    "Sprint Planning",
    "User Story Refinement",
    "Daily Stand-up",
    "Sprint Review / Demo",
  ],
  waterfall: [
    "Requirements Documentation",
    "Design & Development",
    "Testing & UAT",
    "Deployment",
  ],
};

// Render tasks for each section
function renderTemplates(type) {
  const card = document.querySelector(`.template-card[data-type="${type}"]`);
  const ul = card.querySelector(".task-container");
  ul.innerHTML = "";

  templates[type].forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `
      <span class="task-text">${index + 1}. ${task}</span>
      <div class="task-buttons">
        <button class="btn-send" title="Send task">Send</button>
        <button class="btn-edit" title="Edit task">Edit</button>
        <button class="btn-delete" title="Delete task">Delete</button>
      </div>
    `;

    // ✅ Send email through backend
    li.querySelector(".btn-send").addEventListener("click", async () => {
      const zohoUser = localStorage.getItem("zohoUser");
      const userEmail = zohoUser ? JSON.parse(zohoUser).Email : null;
      console.log(userEmail);
      const token = localStorage.getItem("zohoToken");

      if (!token) {
        alert("Zoho user not logged in. Please sign in first.");
        return;
      }

      try {
        const res = await fetch("http://localhost:4000/send-zoho-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: userEmail, // ✅ send to the Zoho user's Gmail
            body: task,     // ✅ send only task text
          }),
        });

        if (res.ok) {
          alert(`✅ Email sent to ${userEmail}`);
        } else {
          alert("❌ Failed to send email.");
        }
      } catch (err) {
        console.error("Error:", err);
        alert("⚠️ Error sending email. Check console for details.");
      }
    });

    // Edit handler
    li.querySelector(".btn-edit").addEventListener("click", () => {
      const newName = prompt("Edit task name:", task);
      if (newName && newName.trim() !== "") {
        templates[type][index] = newName.trim();
        renderTemplates(type);
      }
    });

    // Delete handler
    li.querySelector(".btn-delete").addEventListener("click", () => {
      if (confirm(`Delete task "${task}"?`)) {
        templates[type].splice(index, 1);
        renderTemplates(type);
      }
    });

    ul.appendChild(li);
  });
}

// Initial render
renderTemplates("agile");
renderTemplates("waterfall");

