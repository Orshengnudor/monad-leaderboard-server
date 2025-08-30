const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// In-memory leaderboard (resets on redeploy)
let leaderboard = [];

app.use(cors({ origin: "*" })); // Allow all origins for testing
app.use(express.json());

// Save score endpoint
app.post("/api/leaderboard", (req, res) => {
  const { wallet, score, timestamp } = req.body;
  if (!wallet || score == null) return res.status(400).json({ error: "Missing wallet or score" });

  const existingEntryIndex = leaderboard.findIndex(entry => entry.wallet === wallet);

  if (existingEntryIndex !== -1) {
    leaderboard[existingEntryIndex].score = Math.max(leaderboard[existingEntryIndex].score, score);
    leaderboard[existingEntryIndex].timestamp = timestamp || Date.now();
  } else {
    leaderboard.push({ wallet, score, timestamp: timestamp || Date.now() });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  const topData = leaderboard.slice(0, 100);
  res.json({ success: true });
});

// Get leaderboard endpoint
app.get("/api/leaderboard", (req, res) => {
  const topData = leaderboard.slice(0, 100);
  res.json(topData);
});

app.listen(PORT, () => console.log(`Leaderboard server running at port ${PORT}`));