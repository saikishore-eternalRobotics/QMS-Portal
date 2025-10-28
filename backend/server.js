import fetch from "node-fetch";
import cors from "cors";
import express from "express";
import nodemailer from "nodemailer"

const app = express();
app.use(cors());
app.use(express.json());


app.get("/zoho-user", async (req, res) => {
  const token = req.query.access_token;
  console.log("Token in backend:", token);
  if (!token) return res.status(400).json({ error: "Missing access token" });

  try {
    const response = await fetch("https://accounts.zoho.in/oauth/user/info", {
      headers: { Authorization: `Zoho-oauthtoken ${token}` }
    });

    console.log("HTTP status:", response.status, response.statusText);

    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error("Zoho API error:", text);
      return res.status(response.status).send(text);
    }

    // Parse JSON only if status OK
    const data = await response.json();
    console.log("Data:", data);
    res.json(data);

  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/zoho-logout", async (req, res) => {
  const token = req.query.access_token;
  if (!token) return res.status(400).json({ error: "Missing access token" });

  try {
    const revokeUrl = "https://accounts.zoho.in/oauth/v2/token/revoke";
    const response = await fetch(`${revokeUrl}?token=${token}`, {
      method: "POST",
    });

    console.log("Logout response:", response.status, response.statusText);
    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).send(text);
    }

    res.json({ success: true, message: "Zoho token revoked successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: err.message });
  }
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",      // ✅ Correct hostname
  port: 465,                   // ✅ SSL port
  secure: true, // true for 465, false for 587
  auth: {
    user: "s.kishore@eternalrobotics.com", // your Zoho mail
    pass: "pxmn cmhi dvlq chfe",     // NOT your Zoho login password — use app password
  },
});

app.post("/send-zoho-email", async (req, res) => {
  const { to, body } = req.body;

  try {
    await transporter.sendMail({
      from: '"BA Dashboard" <s.kishore@eternalrobotics.com>',
      to: to,
      subject: "BA Task",
      text: body, // ✅ just send the text
    });

    console.log(`📧 Email sent to ${to}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.listen(4000, () => console.log("Server running on http://localhost:4000"));
