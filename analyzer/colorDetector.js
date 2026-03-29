// colorDetector.js — Color এবং Contrast সমস্যা detect করে

async function detectColors(page) {
  const problems = [];

  const colorData = await page.evaluate(() => {
    // Relative luminance calculate করার function (WCAG formula)
    function getLuminance(r, g, b) {
      const toLinear = (c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }

    // RGB string থেকে values বের করা
    function parseRGB(rgbStr) {
      const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) return null;
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    }

    // Contrast ratio বের করা
    function getContrastRatio(color1, color2) {
      const l1 = getLuminance(color1.r, color1.g, color1.b);
      const l2 = getLuminance(color2.r, color2.g, color2.b);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    const lowContrastElements = [];
    const allColors = new Set();

    const textElements = document.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, a, button, label",
    );

    textElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const color = parseRGB(style.color);
      const bgColor = parseRGB(style.backgroundColor);

      if (color) allColors.add(style.color);

      if (
        (color && bgColor && bgColor.r !== 0) ||
        bgColor?.g !== 0 ||
        bgColor?.b !== 0
      ) {
        try {
          const ratio = getContrastRatio(color, bgColor);
          // WCAG AA standard: 4.5:1 normal text, 3:1 large text
          if (ratio < 4.5) {
            const text = el.innerText?.trim().substring(0, 40);
            if (text) {
              lowContrastElements.push({
                tag: el.tagName,
                ratio: ratio.toFixed(2),
                text,
              });
            }
          }
        } catch (e) {}
      }
    });

    // Too many colors check
    const bgColors = new Set();
    document.querySelectorAll("*").forEach((el) => {
      const bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        bgColors.add(bg);
      }
    });

    return {
      lowContrastCount: lowContrastElements.length,
      lowContrastSamples: lowContrastElements.slice(0, 3),
      uniqueColorCount: bgColors.size,
    };
  });

  // ✅ Problems
  if (colorData.lowContrastCount > 0) {
    const samples = colorData.lowContrastSamples
      .map((s) => `"${s.text}" (ratio: ${s.ratio})`)
      .join(", ");
    problems.push({
      issue: `${colorData.lowContrastCount}টি text element এ color contrast কম — WCAG AA standard মেনে চলছে না। উদাহরণ: ${samples}`,
      fix: "Text এবং Background এর মধ্যে contrast ratio কমপক্ষে 4.5:1 রাখুন। হালকা background এ গাঢ় text ব্যবহার করুন।",
      severity: "high",
    });
  }

  if (colorData.uniqueColorCount > 10) {
    problems.push({
      issue: `পেজে অনেক বেশি আলাদা background color ব্যবহার হচ্ছে (${colorData.uniqueColorCount}টি) — design inconsistent দেখাচ্ছে।`,
      fix: "একটি color palette তৈরি করুন এবং সর্বোচ্চ ৩-৫টি primary color ব্যবহার করুন।",
      severity: "medium",
    });
  }

  return { problems };
}

module.exports = detectColors;
