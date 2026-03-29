// fontDetector.js — Font এবং Typography সমস্যা detect করে

async function detectFonts(page) {
  const problems = [];

  const fontData = await page.evaluate(() => {
    const elements = document.querySelectorAll("*");
    const fontSizes = [];
    const fontFamilies = new Set();
    const smallTextElements = [];

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const fontFamily = style.fontFamily;
      const text = el.innerText?.trim();

      if (text && text.length > 0) {
        fontSizes.push(fontSize);
        fontFamilies.add(fontFamily.split(",")[0].trim());

        // 12px এর নিচে text পেলে সমস্যা
        if (fontSize < 12 && text.length > 0) {
          smallTextElements.push({
            tag: el.tagName,
            size: fontSize,
            text: text.substring(0, 50),
          });
        }
      }
    });

    // Line height check
    const paragraphs = document.querySelectorAll("p, span, div");
    const badLineHeight = [];
    paragraphs.forEach((el) => {
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const fontSize = parseFloat(style.fontSize);
      if (lineHeight < fontSize * 1.2 && el.innerText?.trim().length > 20) {
        badLineHeight.push({ tag: el.tagName, lineHeight, fontSize });
      }
    });

    return {
      fontFamilyCount: fontFamilies.size,
      fontFamilies: Array.from(fontFamilies).slice(0, 10),
      smallTextCount: smallTextElements.length,
      smallTextSamples: smallTextElements.slice(0, 3),
      badLineHeightCount: badLineHeight.length,
    };
  });

  // ✅ Problem চেক করা
  if (fontData.fontFamilyCount > 4) {
    problems.push({
      issue: `অনেক বেশি font family ব্যবহার হচ্ছে (${fontData.fontFamilyCount}টি): ${fontData.fontFamilies.join(", ")}`,
      fix: "সর্বোচ্চ ২-৩টি font family ব্যবহার করুন। Heading এর জন্য একটি, Body text এর জন্য একটি।",
      severity: "medium",
    });
  }

  if (fontData.smallTextCount > 0) {
    problems.push({
      issue: `${fontData.smallTextCount}টি জায়গায় font size ১২px এর নিচে আছে — পড়তে কঠিন হবে।`,
      fix: "Minimum font size 14px রাখুন। Body text এর জন্য 16px recommend করা হয়।",
      severity: "high",
    });
  }

  if (fontData.badLineHeightCount > 5) {
    problems.push({
      issue: `${fontData.badLineHeightCount}টি text element এ line-height কম, text ঘেঁষাঘেঁষি দেখাচ্ছে।`,
      fix: "Line-height কমপক্ষে font-size এর ১.৫ গুণ রাখুন (যেমন: font 16px হলে line-height 24px)।",
      severity: "medium",
    });
  }

  return { problems };
}

module.exports = detectFonts;
