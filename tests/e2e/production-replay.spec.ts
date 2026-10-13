import { expect, test } from "@playwright/test";

import {
  finishedReplayFixture,
  localReplayResources,
} from "../helpers/localReplayResources";

test("plays an uploaded YRP2 through the bundled Worker and returns to the lobby", async ({
  page,
}) => {
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
  await page.goto("/match");
  await page.getByText("录像回放", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "production-smoke.yrp2",
    mimeType: "application/octet-stream",
    buffer: Buffer.from(replay),
  });
  await page.getByRole("button", { name: "开始回放", exact: true }).click();
  await expect(page).toHaveURL(/\/duel/, { timeout: 30_000 });
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
