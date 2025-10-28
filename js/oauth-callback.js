const contentDiv = document.getElementById("content");

    // Your user data
    const userData = {
      "CV": [
        "Sripraneeth Salapareddi","Jay Kumar Verma","Balveer Kain","Vasanthkiran Sambara",
        "Adarsh Kumar Singh","Hemanth Kumar Rudrapankthi","Gaurav Kumar","Raushan Kumar Dubey",
        "Kuragayala Kenny Joel","Vikas Sai","Deepak Balasaheb Pawar","Hemant Yadav","Hima Obugari",
        "Harsh Patel","Sneha Bhaskar","Naseem Alassampattil","Ankush Rathour","Sanyam Bhawsar",
        "Rahul Bhardwaj","Ankit Katiyar","Devendhra","Umang","Rushendra","Poddaturi Charan Raj",
        "Omkar","Tabrez","Vamshi","Prashant","Moazzam","Dipansh","Yamini"
      ],
      "Full Stack Developer": ["Supriya","Jitesh","Bharath","Sai Kishore","Lokeshwara"],
      "Data Annotators": ["Spandana Gavu","Suresh Marrapu","Geethika Bellagubba","Ramya Reddy Gajji","Sravanthi","Harika","Srikanth","Harshvardhan","Bhanu","Madhuri"],
      "Business Analysts": ["Ramesh Anand","Charishma","Muazzam","Chadalwada Reshma Chowdary"]
    };

    // Get access token from URL hash
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    console.log("Access Token: ", accessToken);

    if (!accessToken) {
      contentDiv.innerHTML = "<h2>Login failed or cancelled</h2>";
    } else {
      // Store token
      localStorage.setItem("zohoToken", accessToken);

      // Fetch Zoho user info from backend
      fetch(`http://localhost:4000/zoho-user?access_token=${accessToken}`)
        .then(res => res.json())
        .then(user => {
          console.log("Zoho user:", user);

          // Store user info
          localStorage.setItem("zohoUser", JSON.stringify(user));

          // Find category
          const displayName = (user?.Display_Name || "").toLowerCase().trim();

          function findClosestCategory(name) {
            let bestCategory = "Unknown";
            let bestScore = 0;

            for (const [category, names] of Object.entries(userData)) {
              for (const n of names) {
                const candidate = n.toLowerCase().trim();
                const commonWords = candidate.split(" ").filter(w => name.includes(w)).length;
                if (commonWords > bestScore) {
                  bestScore = commonWords;
                  bestCategory = category;
                }
              }
            }
            return bestCategory;
          }

          const category = findClosestCategory(displayName);
          console.log(`${user.Display_Name} belongs to category: ${category}`);
          localStorage.setItem("department", category)

          // Redirect based on category
          switch (category) {
            case "CV":
              window.location.href = "/html/cv-dashboard.html";
              break;
            case "Full Stack Developer":
              window.location.href = "/html/fullstack-dashboard.html";
              break;
            case "Data Annotators":
              window.location.href = "/html/data-annotators-dashboard.html";
              break;
            case "Business Analysts":
              window.location.href = "/html/ba-dashboard.html";
              break;
            case "QA Engineers":
                window.location.href = "/html/qa-dashboard.html";
                break;
            default:
              window.location.href = "/html/dashboard.html";
              break;
          }
        })
        .catch(err => {
          console.error("Error fetching Zoho user info:", err);
          contentDiv.innerHTML = "<h2>Error fetching user info</h2>";
        });
    }