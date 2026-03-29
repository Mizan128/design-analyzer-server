// layoutDetector.js — Layout এবং Spacing সমস্যা detect করে

async function detectLayout(page) {
  const problems = [];

  const layoutData = await page.evaluate(() => {
    // Images without alt text
    const images = document.querySelectorAll("img");
    let imagesWithoutAlt = 0;
    images.forEach((img) => {
      if (!img.getAttribute("alt") || img.getAttribute("alt").trim() === "") {
        imagesWithoutAlt++;
      }
    });

    // Overlapping elements check
    const elements = Array.from(
      document.querySelectorAll("div, section, article, p, h1, h2, h3"),
    );
    const overlappingPairs = [];

    for (let i = 0; i < Math.min(elements.length, 50); i++) {
      const rect1 = elements[i].getBoundingClientRect();
      if (rect1.width === 0 || rect1.height === 0) continue;

      for (let j = i + 1; j < Math.min(elements.length, 50); j++) {
        const rect2 = elements[j].getBoundingClientRect();
        if (rect2.width === 0 || rect2.height === 0) continue;

        // Check if one contains the other (skip parent-child)
        if (
          elements[i].contains(elements[j]) ||
          elements[j].contains(elements[i])
        )
          continue;

        // Check actual overlap
        const overlap =
          rect1.left < rect2.right &&
          rect1.right > rect2.left &&
          rect1.top < rect2.bottom &&
          rect1.bottom > rect2.top;

        if (overlap) {
          overlappingPairs.push({
            el1:
              elements[i].tagName +
              (elements[i].id ? "#" + elements[i].id : ""),
            el2:
              elements[j].tagName +
              (elements[j].id ? "#" + elements[j].id : ""),
          });
          if (overlappingPairs.length >= 3) break;
        }
      }
      if (overlappingPairs.length >= 3) break;
    }

    // Very tight padding check
    let tightPaddingCount = 0;
    const buttons = document.querySelectorAll("button, .btn, [role='button']");
    buttons.forEach((btn) => {
      const style = window.getComputedStyle(btn);
      const paddingTop = parseFloat(style.paddingTop);
      const paddingLeft = parseFloat(style.paddingLeft);
      if (paddingTop < 8 || paddingLeft < 12) {
        tightPaddingCount++;
      }
    });

    // Content too wide check
    const mainContent = document.querySelector(
      "main, article, .content, #content",
    );
    let contentTooWide = false;
    if (mainContent) {
      const width = mainContent.getBoundingClientRect().width;
      if (width > 900) {
        contentTooWide = true;
      }
    }

    return {
      imagesWithoutAlt,
      overlappingPairs,
      tightPaddingCount,
      contentTooWide,
      totalImages: images.length,
    };
  });

  // ✅ Problems
  if (layoutData.imagesWithoutAlt > 0) {
    problems.push({
      issue: `${layoutData.imagesWithoutAlt}টি image এ alt text নেই — accessibility এবং SEO এর জন্য সমস্যা।`,
      fix: 'প্রতিটি <img> tag এ alt="" attribute যোগ করুন। Descriptive text লিখুন, যেমন alt="Company logo"।',
      severity: "medium",
    });
  }

  if (layoutData.overlappingPairs.length > 0) {
    const pairs = layoutData.overlappingPairs
      .map((p) => `${p.el1} ও ${p.el2}`)
      .join(", ");
    problems.push({
      issue: `কিছু element overlap হচ্ছে: ${pairs}`,
      fix: "Position: absolute বা z-index সঠিকভাবে ব্যবহার করুন। Flexbox বা Grid দিয়ে layout ঠিক করুন।",
      severity: "high",
    });
  }

  if (layoutData.tightPaddingCount > 2) {
    problems.push({
      issue: `${layoutData.tightPaddingCount}টি button এ padding খুব কম — ক্লিক করা কঠিন এবং design খারাপ দেখায়।`,
      fix: "Button এ কমপক্ষে padding: 10px 20px রাখুন। এতে design সুন্দর এবং ক্লিকযোগ্য হবে।",
      severity: "low",
    });
  }

  if (layoutData.contentTooWide) {
    problems.push({
      issue: "Main content area অনেক চওড়া — লম্বা line length পড়তে কষ্ট হয়।",
      fix: "Content area এর max-width: 800px বা 900px রাখুন এবং margin: 0 auto দিয়ে center করুন।",
      severity: "low",
    });
  }

  return { problems };
}

module.exports = detectLayout;
