import { preview } from "vite";
import { chromium } from "playwright";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const server = await preview({
  root: resolve(import.meta.dirname, ".."),
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
});
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BGH_BROWSER_EXECUTABLE
    ? {
        executablePath: process.env.BGH_BROWSER_EXECUTABLE,
        args: [
          "--no-sandbox",
          "--no-zygote",
          "--single-process",
          "--disable-dev-shm-usage",
          "--use-gl=angle",
          "--use-angle=swiftshader",
          "--enable-unsafe-swiftshader",
        ],
      }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  locale: "fr-CA",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const url = "http://127.0.0.1:4174";
const nav = async (name) =>
  page.locator(".bottomNav").getByRole("button", { name, exact: true }).click();
const open = async (name) => {
  await nav("Jeux");
  if (!(await page.locator(".catalogTile").count())) await nav("Jeux");
  await page
    .getByRole("button", { name: new RegExp(name) })
    .filter({ has: page.locator("strong") })
    .first()
    .click();
};
try {
  await page.goto(url);
  await page.getByRole("button", { name: "Réglages", exact: true }).waitFor();
  assert.ok((await page.locator("body").innerText()).length > 100);
  assert.equal(await page.locator("vite-error-overlay").count(), 0);

  console.log("PASS home, navigation and initial render");
  await nav("Jeux");
  assert.equal(await page.locator(".catalogTile").count(), 25);
  await page
    .getByRole("button", { name: "Favori: Sudoku", exact: true })
    .click();
  await page.getByRole("button", { name: "Favoris", exact: true }).click();
  assert.equal(await page.locator(".catalogTile").count(), 1);
  await page.getByRole("button", { name: "Tous", exact: true }).click();
  console.log("PASS favorites and filters");
  for (const name of [
    "Cribbage",
    "Farkle",
    "Dominos",
    "Dames",
    "Huit américain",
    "Sudoku",
    "Charades et mime",
    "Bataille navale",
    "Autres livres-jeux",
  ]) {
    await open(name);
    assert.ok(await page.locator(".newGame").count());
    await page
      .locator(".newGameHeader")
      .first()
      .getByRole("button", { name: "Règles", exact: true })
      .click();
    assert.ok(
      (await page.locator(".rulesPanel").first().innerText()).length > 40,
    );
    console.log("PASS render " + name);
  }
  await open("Sudoku");
  const index = await page
    .locator(".sudokuBoard button")
    .evaluateAll((es) => es.findIndex((e) => !e.classList.contains("given")));
  await page.locator(".sudokuBoard button").nth(index).click();
  await page.locator(".numberPad button").nth(0).click();
  await nav("Accueil");
  await page.reload();
  await open("Sudoku");
  assert.equal(
    await page.locator(".sudokuBoard button").nth(index).innerText(),
    "1",
  );
  console.log("PASS sudoku persistence across reload");
  await open("Cribbage");
  await page.locator(".cardHand button").nth(0).click();
  await page.locator(".cardHand button").nth(1).click();
  await page.getByRole("button", { name: "Mettre au crib" }).click();
  await page.waitForTimeout(900);
  assert.ok((await page.locator("body").innerText()).includes("/31"));
  await nav("Accueil");
  await open("Cribbage");
  assert.ok((await page.locator("body").innerText()).includes("/31"));
  console.log("PASS cribbage discard, computer turn and resume");
  await open("Farkle");
  await page.getByRole("button", { name: /Lancer/ }).click();
  await page.waitForTimeout(100);
  console.log("PASS Farkle roll");
  await open("Dames");
  await page.locator(".checkerBoard button").nth(40).click();
  await page.locator(".checkerBoard .target").first().click();
  await page.waitForTimeout(800);
  assert.ok(
    (await page.evaluate(() => localStorage.getItem("bgh2_checkers"))).includes(
      "board",
    ),
  );
  console.log("PASS checkers move and computer response");
  await open("Bataille navale");
  await page.locator(".navalBoard").first().getByRole("button").nth(0).click();
  await page.waitForTimeout(900);
  assert.equal(
    await page
      .locator(".navalBoard")
      .first()
      .getByRole("button")
      .nth(0)
      .isDisabled(),
    true,
  );
  console.log("PASS naval shot and computer response");
  await open("Autres livres-jeux");
  await page.getByRole("button", { name: /Le phare oublié/ }).click();
  await page.getByRole("button", { name: "Entrer dans le tunnel" }).click();
  await page.getByRole("button", { name: "Suivre la flèche" }).click();
  await page.getByRole("button", { name: "Monter l’escalier" }).click();
  await page.getByRole("button", { name: "Utiliser la clé" }).click();
  await page.getByRole("button", { name: "Monter lentement" }).click();
  await page
    .getByRole("button", { name: "Préparer le brûleur et l’allumer" })
    .click();
  assert.ok(
    (await page.locator("body").innerText()).includes("Mission accomplie"),
  );
  console.log("PASS full gamebook route");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  for (const name of [
    "Grand texte et grandes cartes",
    "Contraste élevé",
    "Réduire les animations",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  assert.equal(
    await page.locator(".app.largeText.highContrast.reducedMotion").count(),
    1,
  );
  await nav("Accueil");
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  console.log("PASS large text, contrast, motion and no horizontal overflow");
  await open("Yam");
  await page.getByRole("button", { name: "Commencer", exact: true }).click();
  await page
    .locator(".yamsBar")
    .getByRole("button", { name: "Lancer", exact: true })
    .click();
  await page.locator(".simpleDice .diceButtons button").first().click();
  const diceBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bgh2_yams_values")),
  );
  await page.reload();
  await open("Yam");
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("bgh2_yams_values")),
    ),
    diceBefore,
  );
  assert.equal(
    await page
      .locator(".simpleDice .diceButtons button")
      .first()
      .getAttribute("aria-pressed"),
    "true",
  );
  console.log("PASS static Yam’s dice, holds and reload");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .locator(".bottomNav")
    .getByRole("button", { name: "Games", exact: true })
    .click();
  if (!(await page.locator(".catalogTile").count()))
    await page
      .locator(".bottomNav")
      .getByRole("button", { name: "Games", exact: true })
      .click();
  assert.ok((await page.locator("body").innerText()).includes("Crazy Eights"));
  console.log("PASS English language");
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  console.log("PASS tablet layout");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  assert.ok(
    (await page.locator("body").innerText()).includes("Board Game Helper"),
  );
  await page
    .locator(".bottomNav")
    .getByRole("button", { name: "Games", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Sudoku/ })
    .filter({ has: page.locator("strong") })
    .click();
  assert.equal(await page.locator(".sudokuBoard button").count(), 81);
  console.log("PASS offline reload and game access");
  assert.deepEqual(errors, []);
  console.log("PASS no JavaScript errors");
} finally {
  await browser.close();
  server.httpServer.close();
}
