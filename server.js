const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173", // Allow local development
  "https://https://monadashboard.vercel.app/" // Replace with your deployed frontend URL once available
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"], // Allow GET, POST, and OPTIONS for preflight
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const FILE = "leaderboard.json";

// Initialize leaderboard file
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify([]));

// Save score endpoint (update existing score if user exists)
app.post("/api/leaderboard", (req, res) => {
  const { wallet, score, timestamp } = req.body;
  if (!wallet || score == null) return res.status(400).json({ error: "Missing wallet or score" });

  let data = JSON.parse(fs.readFileSync(FILE));
  const existingEntryIndex = data.findIndex(entry => entry.wallet === wallet);

  if (existingEntryIndex !== -1) {
    // Update existing score if the new score is higher or equal
    data[existingEntryIndex].score = Math.max(data[existingEntryIndex].score, score);
    data[existingEntryIndex].timestamp = timestamp || Date.now();
  } else {
    // Add new entry if user doesn’t exist
    data.push({ wallet, score, timestamp: timestamp || Date.now() });
  }

  // Sort by score in descending order and keep top 100
  data.sort((a, b) => b.score - a.score);
  const topData = data.slice(0, 100);

  fs.writeFileSync(FILE, JSON.stringify(topData, null, 2));
  res.json({ success: true });
});

// Get leaderboard endpoint
app.get("/api/leaderboard", (req, res) => {
  const data = JSON.parse(fs.readFileSync(FILE));
  res.json(data);
});

// Handle OPTIONS requests for CORS preflight
app.options("/api/leaderboard", (req, res) => {
  res.set("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Leaderboard server running at port ${PORT}`));