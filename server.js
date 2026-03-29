// import express from "express";
// import cors from "cors";

// const app = express();

// app.use(express.json());

// // ✅ CORS FIX
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//   }),
// );

// // ❌ DO NOT USE app.options("*")

// app.get("/", (req, res) => {
//   res.send("Server is running 🚀");
// });

// app.post("/analyze", (req, res) => {
//   res.json({ ok: true });
// });

// const PORT = process.env.PORT || 10000;

// app.listen(PORT, () => {
//   console.log("Server running on port", PORT);
// });
const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const detectFonts = require("./analyzer/fontDetector");
const detectColors = require("./analyzer/colorDetector");
const detectResponsive = require("./analyzer/responsiveDetector");
const detectLayout = require("./analyzer/layoutDetector");
const detectHierarchy = require("./analyzer/hierarchyDetector");

const app = express();
const PORT = 3000;

// ✅ CORS allow করা হয়েছে যাতে Wix থেকে request আসতে পারে
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "Design Analyzer Server চলছে ✅" });
});

// ✅ Main Analyze Route — Wix এই endpoint call করবে
app.post("/analyze", async (req, res) => {
  const { url } = req.body;

  // URL validation
  if (!url || !url.startsWith("http")) {
    return res.status(400).json({
      success: false,
      error: "সঠিক URL দিন (http বা https দিয়ে শুরু করুন)",
    });
  }

  let browser;
  try {
    console.log(`🔍 Analyzing: ${url}`);

    // Puppeteer browser চালু করা
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Desktop viewport
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // ✅ সব detector একসাথে চালানো
    const [fonts, colors, responsive, layout, hierarchy] = await Promise.all([
      detectFonts(page),
      detectColors(page),
      detectResponsive(page, browser),
      detectLayout(page),
      detectHierarchy(page),
    ]);

    // Problems এবং Solutions তৈরি করা
    const results = buildProblemsAndSolutions({
      fonts,
      colors,
      responsive,
      layout,
      hierarchy,
    });

    await browser.close();

    console.log(`✅ Analysis complete. Problems found: ${results.length}`);

    res.json({
      success: true,
      url,
      totalProblems: results.length,
      results, // Wix Repeater এই array দিয়ে populate হবে
    });
  } catch (error) {
    if (browser) await browser.close();
    console.error("❌ Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ✅ Problems এবং Solutions format করার function
function buildProblemsAndSolutions({
  fonts,
  colors,
  responsive,
  layout,
  hierarchy,
}) {
  const results = [];

  // --- Font Problems ---
  if (fonts.problems && fonts.problems.length > 0) {
    fonts.problems.forEach((p) => {
      results.push({
        category: "🔤 Font / Typography",
        problem: p.issue,
        solution: p.fix,
        severity: p.severity || "medium",
      });
    });
  }

  // --- Color Problems ---
  if (colors.problems && colors.problems.length > 0) {
    colors.problems.forEach((p) => {
      results.push({
        category: "🎨 Color / Contrast",
        problem: p.issue,
        solution: p.fix,
        severity: p.severity || "medium",
      });
    });
  }

  // --- Responsive Problems ---
  if (responsive.problems && responsive.problems.length > 0) {
    responsive.problems.forEach((p) => {
      results.push({
        category: "📱 Responsive Design",
        problem: p.issue,
        solution: p.fix,
        severity: p.severity || "high",
      });
    });
  }

  // --- Layout Problems ---
  if (layout.problems && layout.problems.length > 0) {
    layout.problems.forEach((p) => {
      results.push({
        category: "📐 Layout / Spacing",
        problem: p.issue,
        solution: p.fix,
        severity: p.severity || "low",
      });
    });
  }

  // --- Hierarchy Problems ---
  if (hierarchy.problems && hierarchy.problems.length > 0) {
    hierarchy.problems.forEach((p) => {
      results.push({
        category: "🏗️ Visual Hierarchy",
        problem: p.issue,
        solution: p.fix,
        severity: p.severity || "medium",
      });
    });
  }

  // কোনো problem না পেলে
  if (results.length === 0) {
    results.push({
      category: "✅ সব ঠিক আছে",
      problem: "কোনো বড় design সমস্যা পাওয়া যায়নি।",
      solution: "আপনার design টি ভালো দেখাচ্ছে! Minor improvements করতে পারেন।",
      severity: "none",
    });
  }

  return results;
}

app.listen(PORT, () => {
  console.log(`🚀 Design Analyzer Server চলছে: http://localhost:${PORT}`);
});