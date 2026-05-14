import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = "http://localhost:3000";
const OUT = "/Users/abyssinia/Documents/companies/VK_Technologies/asmrtts/Agent-Skill-Evo/marketplace/screenshots";

const routes = [
  { path: "/", name: "01-home" },
  { path: "/skills", name: "02-browse-all" },
  { path: "/skills?category=dev-tools", name: "03-browse-devtools" },
  { path: "/skills?q=postgres&sort=installs", name: "04-search-postgres" },
  { path: "/skills/github-pr-reviewer", name: "05-detail" },
  { path: "/publish", name: "06-publish" },
  { path: "/about", name: "07-about" },
];

const themes = [
  { name: "light", scheme: "light" },
  { name: "dark", scheme: "dark" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

const homeChecks = {
  hero: false,
  searchBox: false,
  featuredGrid: false,
  categoryGrid: false,
};

for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme.scheme,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const r of routes) {
    const url = BASE + r.path;
    await page.goto(url, { waitUntil: "networkidle" });
    // Wait for animations to settle
    await page.waitForTimeout(400);

    const file = `${OUT}/${r.name}-${theme.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ ${theme.name}  ${r.path}  →  ${file.split("/").pop()}`);

    // Smoke checks on the home page (only need to confirm once)
    if (r.path === "/" && theme.name === "light") {
      homeChecks.hero =
        (await page.getByText("Skills built by thousands").count()) > 0;
      homeChecks.searchBox =
        (await page
          .getByPlaceholder("Search Skills, MCP servers, prompts...")
          .count()) > 0;
      homeChecks.featuredGrid =
        (await page.getByText("Featured Skills").count()) > 0;
      homeChecks.categoryGrid =
        (await page.getByText("Browse by category").count()) > 0;
    }
  }

  await context.close();
}

await browser.close();

console.log("\nHome page sanity:");
for (const [k, v] of Object.entries(homeChecks)) {
  console.log(`  ${v ? "✓" : "✗"} ${k}`);
}
