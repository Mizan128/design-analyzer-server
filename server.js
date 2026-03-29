import express from "express";
import cors from "cors";

const app = express();

// ✅ JSON support
app.use(express.json());

// ✅ CORS FIX (IMPORTANT)
app.use(
  cors({
    origin: "*", // development এর জন্য OK
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ✅ extra safety for preflight request
app.options("*", cors());

// ----------------------
// TEST ROUTE
// ----------------------
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ----------------------
// ANALYZE ROUTE
// ----------------------
app.post("/analyze", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL missing" });
    }

    // এখানে তোমার puppeteer / analysis logic থাকবে
    res.json({
      success: true,
      message: "Analysis working",
      url: url,
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error",
      details: error.message,
    });
  }
});

// ----------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
