import { chromium } from "playwright-core";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const page = await browser.newPage();

  await page.goto("http://127.0.0.1:3000/englishtutor/speaking", {
    waitUntil: "networkidle",
  });
  await page.click('[data-testid="start-speaking"]');
  await page.waitForSelector('[data-testid="speaking-transcript"]');
  await page.fill(
    '[data-testid="speaking-transcript"]',
    "Yesterday I go to the park and I meet my friend.",
  );
  await page.click('[data-testid="submit-speaking"]');
  await page.waitForSelector('[data-testid="speaking-feedback"]', {
    timeout: 15000,
  });
  await page.screenshot({
    path: "/opt/cursor/artifacts/phase7_speaking.png",
    fullPage: true,
  });

  await page.goto("http://127.0.0.1:3000/englishtutor/listening", {
    waitUntil: "networkidle",
  });
  await page.click('[data-testid="start-listening"]');
  await page.waitForSelector('[data-testid="submit-listening"]');
  await page.evaluate(() => {
    const radios = Array.from(
      document.querySelectorAll('input[type="radio"]'),
    );
    radios.forEach((el, i) => {
      if (i % 4 === 0) {
        (el as HTMLInputElement).click();
      }
    });
  });
  await page.click('[data-testid="submit-listening"]');
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: "/opt/cursor/artifacts/phase8_listening.png",
    fullPage: true,
  });

  await page.goto("http://127.0.0.1:3000/englishtutor/progress", {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("text=WEEKLY ENGLISH REPORT");
  await page.screenshot({
    path: "/opt/cursor/artifacts/phase9_progress.png",
    fullPage: true,
  });

  await page.goto("http://127.0.0.1:3000/englishtutor/assessment", {
    waitUntil: "networkidle",
  });
  await page.waitForSelector('[data-testid="submit-assessment"]');
  await page.screenshot({
    path: "/opt/cursor/artifacts/phase10_assessment.png",
    fullPage: true,
  });

  console.log("UI_PHASE7_10_OK");
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
