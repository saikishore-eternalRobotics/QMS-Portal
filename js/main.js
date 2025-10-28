document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(username === "admin" && password === "1234") {
        alert("Login successful!");
        window.location.href = "html/dashboard.html"; 
    } 
    
    else{

        alert("Invalid credentials");
    }
});


document.getElementById("zohoLogin").addEventListener("click", () => {

    const clientId = "1000.59KVQYN2WDD3M0W3FS329W8DLJPVDI"; 
    const redirectUri = "http://localhost:5500/html/oauth-callback.html"; 
    const scope = "AaaServer.profile.READ"; 
    const responseType = "token"; 

    const authUrl = `https://accounts.zoho.com/oauth/v2/auth?scope=${encodeURIComponent(scope)}&client_id=${clientId}&response_type=${responseType}&access_type=offline&redirect_uri=${encodeURIComponent(redirectUri)}&prompt=login`;

    window.location.href = authUrl;
});
