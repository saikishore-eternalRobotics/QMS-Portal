
const zohoUser = JSON.parse(localStorage.getItem("zohoUser"));
document.getElementById("userName").textContent = zohoUser?.Display_Name || "Guest";


const ctx1 = document.getElementById('chart1').getContext('2d');
console.log(ctx1)



const ctx2 = document.getElementById('chart2').getContext('2d');


new Chart(ctx1, {
  type: "bar",
  data: {
    labels: ["BRS", "User Stories", "Process Map", "Test Cases"],
    datasets: [
      { label: "Required", data: [10, 8, 12, 6], backgroundColor: "#4e73df" },
      { label: "Actual", data: [8, 7, 10, 4], backgroundColor: "#a6c8ff" },
    ]
  },
  options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});

new Chart(ctx2, {
  type: "bar",
  data: {
    labels: ["Initiating", "Planning", "Implementation", "Controlling", "Closing"],
    datasets: [
      { label: "Guidelines Count", data: [10, 35, 40, 25, 15], backgroundColor: "#1cc88a" },
      { label: "Policies Count", data: [8, 20, 30, 18, 9], backgroundColor: "#36b9cc" }
    ]
  },
  options: { responsive: true, plugins: { legend: { position: "bottom" } } }
});



async function fetchSheetTable() {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1Iow5Pr1JTt95VohpXQfHof7QPLMe1cbB/export?format=csv&gid=513518262';
  
  // Use CORS proxy for browser
  const url = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(sheetUrl);

  try {
    const response = await fetch(url);
    const csvText = await response.text();

    // Split CSV into rows
    const rows = csvText
      .trim()
      .split('\n')
      .map(row => row.split(',').map(cell => cell.trim()));

    if (rows.length === 0) {
      console.log('No data found in the sheet');
      return;
    }

    // const headers = rows[0];       // First row is headers
    const dataRows = rows.slice(1); // Remaining rows

    // console.log('Headers:', headers);
    console.log('Rows:', dataRows);

  } catch (error) {
    console.error('Error fetching sheet:', error);
  }
}

fetchSheetTable();



async function getTasksByRole(role) {
  const data = await fetchSheetTable();

  // Filter rows where Accountability matches entered role
  const filtered = data.filter(row => row["Accountability"]?.toLowerCase() === role.toLowerCase());

  console.log("Filtered Tasks:", filtered);

  // Example: display only "Detailed Activity Task"
  const taskNames = filtered.map(row => row["Detailed Activity Task"]);
  console.log("Tasks:", taskNames);
  
  return taskNames;
}

// Example use:
getTasksByRole("BA");





document.getElementById("signOutBtn").addEventListener("click", async () => {
  // 1️⃣ Clear your app’s local data
  const token = localStorage.getItem("zohoToken");
  localStorage.removeItem("zohoToken");
  localStorage.removeItem("zohoUser");
  localStorage.removeItem("department");

  // 2️⃣ Revoke Zoho token on backend
  if (token) {
    await fetch(`http://localhost:4000/zoho-logout?access_token=${token}`);
  }

  // 3️⃣ Redirect to Zoho logout, and then back to your app’s login page
  const redirectAfterLogout = encodeURIComponent("http://localhost:5500/html/index.html");
  window.location.href = `https://accounts.zoho.in/logout?serviceurl=${redirectAfterLogout}`;
});



document.addEventListener("DOMContentLoaded", () => {

    // Add Template
    const addButtons = document.querySelectorAll(".btn-add");
    addButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".template-card");
            const input = card.querySelector(".new-template-input");
            const ul = card.querySelector("ul");
            const value = input.value.trim();
            if (value !== "") {
                const li = document.createElement("li");
                li.textContent = value;
                ul.appendChild(li);
                input.value = ""; // clear input
            }
        });
    });

    // Delete Template (last item)
    const deleteButtons = document.querySelectorAll(".btn-delete");
    deleteButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const card = e.target.closest(".template-card");
            const ul = card.querySelector("ul");
            const items = ul.querySelectorAll("li");
            if (items.length === 0) return;
            const lastItem = items[items.length - 1];
            ul.removeChild(lastItem);
        });
    });

});
