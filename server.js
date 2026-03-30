const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const detectFonts = require("./analyzer/fontDetector");
const detectColors = require("./analyzer/colorDetector");
const detectResponsive = require("./analyzer/responsiveDetector");
const detectLayout = require("./analyzer/layoutDetector");
const detectHierarchy = require("./analyzer/hierarchyDetector");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json());

// Jobs store করার জন্য (memory তে)
const jobs = {};

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Design Analyzer Server চলছে ✅" });
});

// ✅ Step 1 — Analysis শুরু করো, job ID দাও
app.post("/analyze", (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({
      success: false,
      error: "সঠিক URL দিন",
    });
  }

  // Unique job ID তৈরি করো
  const jobId = Date.now().toString();
  jobs[jobId] = { status: "running", results: null, error: null };

  // Background এ analysis চালাও
  runAnalysis(jobId, url);

  // সাথে সাথে job ID দিয়ে দাও
  res.json({ success: true, jobId, status: "running" });
});

// ✅ Step 2 — Result check করার endpoint
app.get("/result/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];

  if (!job) {
    return res.status(404).json({ success: false, error: "Job পাওয়া যায়নি" });
  }

  if (job.status === "running") {
    return res.json({ success: true, status: "running" });
  }

  if (job.status === "error") {
    return res.json({ success: false, error: job.error });
  }

  if (job.status === "done") {
    const results = job.results;
    delete jobs[jobId]; // Memory free করো
    return res.json({ success: true, status: "done", results });
  }
});

// Background analysis function
async function runAnalysis(jobId, url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const [fonts, colors, responsive, layout, hierarchy] = await Promise.all([
      detectFonts(page),
      detectColors(page),
      detectResponsive(page, browser),
      detectLayout(page),
      detectHierarchy(page),
    ]);

    const results = buildResults({
      fonts,
      colors,
      responsive,
      layout,
      hierarchy,
    });

    jobs[jobId] = { status: "done", results };
  } catch (error) {
    jobs[jobId] = { status: "error", error: error.message };
  } finally {
    if (browser) await browser.close();
  }
}

function buildResults({ fonts, colors, responsive, layout, hierarchy }) {
  const results = [];

  [fonts, colors, responsive, layout, hierarchy].forEach((detector) => {
    if (detector.problems) {
      detector.problems.forEach((p) => {
        results.push({
          category: p.category || "সমস্যা",
          problem: p.issue,
          solution: p.fix,
          severity: p.severity || "medium",
        });
      });
    }
  });

  if (results.length === 0) {
    results.push({
      category: "✅ সব ঠিক আছে",
      problem: "কোনো বড় সমস্যা পাওয়া যায়নি।",
      solution: "আপনার design ভালো আছে!",
      severity: "none",
    });
  }

  return results;
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Design Analyzer Server চলছে: http://localhost:${PORT}`);
});
