import { expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { build, preview, type PreviewServer } from "vite";

import {
  finishedReplayFixture,
  localReplayResources,
} from "../helpers/localReplayResources";

const previews: PreviewServer[] = [];
let buildDirectory: string | undefined;

async function cdnMatchUrl() {
  buildDirectory = await mkdtemp(path.join(tmpdir(), "neos-replay-cdn-"));
  const cdn = await preview({
    configFile: false,
    base: "/neos/",
    build: { outDir: buildDirectory },
    preview: { host: "127.0.0.1", port: 0, cors: true },
  });
  previews.push(cdn);
  await build({
    base: cdn.resolvedUrls!.local[0],
    build: { outDir: buildDirectory, emptyOutDir: true },
    logLevel: "error",
  });
  const site = await preview({
    configFile: false,
    build: { outDir: buildDirectory },
    preview: { host: "127.0.0.1", port: 0 },
  });
  previews.push(site);
  return new URL("match", site.resolvedUrls!.local[0]).href;
}

test.afterAll(async () => {
  await Promise.all(
    previews.map(
      ({ httpServer }) =>
        new Promise<void>((resolve, reject) => {
          httpServer.close((error) => (error ? reject(error) : resolve()));
          httpServer.closeIdleConnections();
        }),
    ),
  );
  if (buildDirectory)
    await rm(buildDirectory, { recursive: true, force: true });
});

for (const cdn of [false, true]) {
  test(`plays an uploaded YRP2 with ${
    cdn ? "CDN" : "same-origin"
  } resources and returns to the lobby`, async ({ page }) => {
    test.setTimeout(180_000);
    const matchUrl = cdn ? await cdnMatchUrl() : "/match";
    const resources = await localReplayResources();
    const replay = await finishedReplayFixture(resources, { yrp2: true });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*.cdb", (route) =>
      route.fulfill({
        body: Buffer.from(
          route.request().url().includes("test-release")
            ? resources.databases.preRelease
            : resources.databases.release,
        ),
      }),
    );
    await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
    await page.route("**/test-release-v2.json", (route) =>
      route.fulfill({ json: [] }),
    );
    await page.route("**/api/mdpro3/deck/list?*", (route) =>
      route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
    );
    await page.route("**/script-zip/script.zip", (route) =>
      route.fulfill({ body: Buffer.from(resources.scripts[0]) }),
    );
    await page.addInitScript(() =>
      localStorage.setItem(
        "__neo_setting_config__",
        JSON.stringify({ animation: { enabled: false } }),
      ),
    );
    await page.goto(matchUrl);
    await page.getByText("录像回放", { exact: true }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "production-smoke.yrp2",
      mimeType: "application/octet-stream",
      buffer: Buffer.from(replay),
    });
    await page.getByRole("button", { name: "开始回放", exact: true }).click();
    await Promise.race([
      page.waitForURL(/\/duel/, { timeout: 30_000 }),
      page
        .locator(".ant-message-error")
        .waitFor({ state: "visible", timeout: 30_000 })
        .then(async () => {
          throw new Error(await page.locator(".ant-message-error").innerText());
        }),
    ]);
    await expect(page.getByTestId("replay-toggle")).toBeVisible();
    await expect(
      page
        .locator('[data-testid="duel-card"][data-card-details-visible="true"]')
        .first(),
    ).toBeVisible();
    await page.getByTestId("duel-leave").click();
    await expect(page).toHaveURL(/\/match/);
    expect(errors).toEqual([]);
  });
}
