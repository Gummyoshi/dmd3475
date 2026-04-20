const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Put your Clash token here for quick testing,
// or better: use an environment variable.
const COC_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImU1MzY2ZDhjLWJiNjYtNGNiOS05MzM2LWYzZGZjMzQ5YzRjMCIsImlhdCI6MTc3NjY0ODIyMywic3ViIjoiZGV2ZWxvcGVyLzY2MTY4MTFiLWM1ODItMjZlZS1kYzYyLTczNjgyMjNkZjkxZCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjEzNy45OS4xNDMuMzkiXSwidHlwZSI6ImNsaWVudCJ9XX0.Ewbs5X6mu-PYxVBN8Zm8gTrW_Xv0ULPpGOmCM9bS6O6H6LP0fHaMSmOKKWwC3VFs-9aR9eaZgBEoG4UNHTbsAg";

if (COC_API_TOKEN) {
  console.warn("WARNING: No valid COC API token found yet.");
}

app.use(cors());
app.use(express.json());

// Optional: serve your frontend too if you want everything in one place
app.use(express.static(path.join(__dirname, "public")));

function normalizeTag(tag = "") {
  return tag.trim().toUpperCase();
}

function encodeClanTag(tag = "") {
  // Clash tags start with #, which must become %23 in the URL path
  return encodeURIComponent(normalizeTag(tag));
}

async function fetchClash(endpoint) {
  const response = await fetch(`https://api.clashofclans.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${COC_API_TOKEN}`,
      Accept: "application/json"
    }
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(`Clash API error: ${response.status}`);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

// Clan info
app.get("/api/clan", async (req, res) => {
  try {
    const tag = req.query.tag || "#2QVRV2VR";
    const encodedTag = encodeClanTag(tag);
    const data = await fetchClash(`/v1/clans/${encodedTag}`);
    res.json(data);
  } catch (error) {
    console.error("/api/clan error:", error.payload || error.message);
    res.status(error.status || 500).json({
      error: true,
      message: error.message || "Failed to fetch clan data",
      details: error.payload || null
    });
  }
});

// Current war
app.get("/api/currentwar", async (req, res) => {
  try {
    const tag = req.query.tag || "#2QVRV2VR";
    const encodedTag = encodeClanTag(tag);
    const data = await fetchClash(`/v1/clans/${encodedTag}/currentwar`);
    res.json(data);
  } catch (error) {
    console.error("/api/currentwar error:", error.payload || error.message);
    res.status(error.status || 500).json({
      error: true,
      message: error.message || "Failed to fetch current war data",
      details: error.payload || null
    });
  }
});

// Latest raid weekend
app.get("/api/capitalraid", async (req, res) => {
  try {
    const tag = req.query.tag || "#2QVRV2VR";
    const encodedTag = encodeClanTag(tag);
    const data = await fetchClash(`/v1/clans/${encodedTag}/capitalraidseasons?limit=1`);
    res.json(data);
  } catch (error) {
    console.error("/api/capitalraid error:", error.payload || error.message);
    res.status(error.status || 500).json({
      error: true,
      message: error.message || "Failed to fetch capital raid data",
      details: error.payload || null
    });
  }
});

// Optional: player route if you want member deep dives later
app.get("/api/player", async (req, res) => {
  try {
    const tag = req.query.tag;
    if (!tag) {
      return res.status(400).json({ error: true, message: "Missing player tag" });
    }

    const encodedTag = encodeClanTag(tag);
    const data = await fetchClash(`/v1/players/${encodedTag}`);
    res.json(data);
  } catch (error) {
    console.error("/api/player error:", error.payload || error.message);
    res.status(error.status || 500).json({
      error: true,
      message: error.message || "Failed to fetch player data",
      details: error.payload || null
    });
  }
});

// Fallback if serving frontend from /public
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});