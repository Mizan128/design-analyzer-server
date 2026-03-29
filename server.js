import express from "express";

const app = express();

app.use(express.json());

// ✅ SIMPLE CORS FIX (NO LIB ISSUE)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// TEST
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ANALYZE API
app.post("/analyze", (req, res) => {
  res.json({
    success: true,
    colors: ["#ffffff", "#000000"],
    fonts: ["Roboto"],
    images: 10,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
