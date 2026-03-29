import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());

// ✅ CORS FIX
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ❌ DO NOT USE app.options("*")

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.post("/analyze", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
