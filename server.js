import express from "express";
import cors from "cors";

const app = express();

// ✅ MUST: CORS FIRST
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

// ✅ MUST: handle preflight
app.options("*", cors());

// JSON middleware
app.use(express.json());

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ANALYZE ROUTE
app.post("/analyze", (req, res) => {
  const { url } = req.body;

  res.json({
    success: true,
    url: url,
    colors: ["#ffffff", "#000000"],
    fonts: ["Roboto", "Inter"],
    images: 10,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
