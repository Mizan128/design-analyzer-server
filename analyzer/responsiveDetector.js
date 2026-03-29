// hierarchyDetector.js — Visual Hierarchy সমস্যা detect করে

async function detectHierarchy(page) {
  const problems = [];

  const hierarchyData = await page.evaluate(() => {
    // H1 check — একটি page এ ঠিক একটি H1 থাকা উচিত
    const h1Tags = document.querySelectorAll("h1");
    const h2Tags = document.querySelectorAll("h2");
    const h3Tags = document.querySelectorAll("h3");

    // Heading order check — H1 না থাকলে বা H3 আসার আগে H2 না থাকলে সমস্যা
    let headingSkipped = false;
    let lastHeadingLevel = 0;
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((h) => {
      const level = parseInt(h.tagName[1]);
      if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
        headingSkipped = true;
      }
      lastHeadingLevel = level;
    });

    // Multiple H1 check
    const multipleH1 = h1Tags.length > 1;
    const noH1 = h1Tags.length === 0;

    // Font size hierarchy check — H1 > H2 > H3 > p হওয়া উচিত
    let hierarchyBroken = false;
    if (h1Tags.length > 0 && h2Tags.length > 0) {
      const h1Size = parseFloat(window.getComputedStyle(h1Tags[0]).fontSize);
      const h2Size = parseFloat(window.getComputedStyle(h2Tags[0]).fontSize);
      if (h1Size <= h2Size) {
        hierarchyBroken = true;
      }
    }

    // CTA button check — primary action স্পষ্ট আছে কিনা
    const buttons = document.querySelectorAll("button, a");
    let hasVisibleCTA = false;
    buttons.forEach((btn) => {
      const style = window.getComputedStyle(btn);
      const bg = style.backgroundColor;
      const text = btn.innerText?.trim();
      // Background color আছে এবং text আছে মানে CTA button আছে
      if (bg && bg !== "rgba(0, 0, 0, 0)" && text && text.length > 2) {
        hasVisibleCTA = true;
      }
    });

    return {
      h1Count: h1Tags.length,
      h2Count: h2Tags.length,
      h3Count: h3Tags.length,
      multipleH1,
      noH1,
      headingSkipped,
      hierarchyBroken,
      hasVisibleCTA,
      totalHeadings: headings.length,
    };
  });

  // ✅ Problems
  if (hierarchyData.noH1) {
    problems.push({
      issue:
        "Page এ কোনো H1 heading নেই — SEO এবং accessibility এর জন্য সমস্যা।",
      fix: "Page এর main title কে <h1> tag দিয়ে mark করুন। প্রতি page এ ঠিক একটি H1 থাকা উচিত।",
      severity: "high",
    });
  }

  if (hierarchyData.multipleH1) {
    problems.push({
      issue: `Page এ ${hierarchyData.h1Count}টি H1 tag আছে — একটির বেশি H1 থাকলে SEO দুর্বল হয়।`,
      fix: "শুধুমাত্র একটি H1 রাখুন (মূল page title)। বাকিগুলো H2 বা H3 করুন।",
      severity: "medium",
    });
  }

  if (hierarchyData.headingSkipped) {
    problems.push({
      issue: "Heading order ঠিক নেই — H1 এর পরে সরাসরি H3 বা H4 ব্যবহার হচ্ছে।",
      fix: "Heading গুলো sequential order এ ব্যবহার করুন: H1 → H2 → H3। Level skip করবেন না।",
      severity: "medium",
    });
  }

  if (hierarchyData.hierarchyBroken) {
    problems.push({
      issue:
        "Font size hierarchy ভাঙ্গা — H1 এর font size H2 এর চেয়ে ছোট বা সমান।",
      fix: "H1 সবচেয়ে বড়, তারপর H2, H3 ক্রমশ ছোট হবে। এই visual order বজায় রাখুন।",
      severity: "medium",
    });
  }

  if (!hierarchyData.hasVisibleCTA && hierarchyData.totalHeadings > 0) {
    problems.push({
      issue: "Page এ স্পষ্ট CTA (Call-to-Action) button দেখা যাচ্ছে না।",
      fix: "User কে কোথায় click করতে হবে সেটা স্পষ্ট করুন। একটি eye-catching button যোগ করুন (যেমন: 'Get Started', 'Buy Now')।",
      severity: "low",
    });
  }

  return { problems };
}

module.exports = detectHierarchy;
