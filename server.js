const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 3000; // ← Render এর জন্য এটা খুব জরুরি

app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Design Analyzer Server is running! 🚀",
    status: "ok",
    port: PORT,
  });
});

// Analyze endpoint
app.post("/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL দাও" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process", // Free/Starter plan এ RAM বাঁচায়
      ],
      // executablePath যদি দরকার হয় (Render এ)
      // executablePath: '/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome'
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Fonts
    const fonts = await page.evaluate(() => {
      const fontSet = new Set();
      document.querySelectorAll("*").forEach((el) => {
        const font = getComputedStyle(el).fontFamily;
        if (font) fontSet.add(font);
      });
      return [...fontSet];
    });

    // Colors
    const colors = await page.evaluate(() => {
      const colorSet = new Set();
      document.querySelectorAll("*").forEach((el) => {
        const style = getComputedStyle(el);
        if (style.color) colorSet.add(style.color);
        if (style.backgroundColor) colorSet.add(style.backgroundColor);
      });
      return [...colorSet].filter((c) => c && c !== "rgba(0, 0, 0, 0)");
    });

    // Headings
    const headings = await page.evaluate(() => {
      return ["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => ({
        tag,
        count: document.querySelectorAll(tag).length,
        texts: [...document.querySelectorAll(tag)]
          .map((h) => h.innerText.trim())
          .filter(Boolean),
      }));
    });

    // Responsive Screenshots
    await page.setViewport({ width: 375, height: 812 });
    const mobileShot = await page.screenshot({ encoding: "base64" });

    await page.setViewport({ width: 1440, height: 900 });
    const desktopShot = await page.screenshot({ encoding: "base64" });

    await browser.close();

    res.json({
      success: true,
      data: {
        url,
        fonts: [...new Set(fonts)].slice(0, 20),
        colors: [...new Set(colors)].slice(0, 30),
        headings,
        responsive: { mobileShot, desktopShot },
      },
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// Listen on all interfaces (Render এর জন্য খুব জরুরি)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});
