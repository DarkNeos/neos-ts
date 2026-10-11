import { expect, test } from "@playwright/test";

for (const path of ["/duel", "/waitroom", "/side"]) {
  test(`opening ${path} without a session returns home`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByText("Unexpected Application Error!")).toHaveCount(
      0,
    );
  });
}

test("a route module error returns home", async ({ page }) => {
  await page.route("**/src/ui/Duel/Main.tsx", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'throw new Error("Test route failure");',
    }),
  );
  await page.goto("/duel");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("navigation")).toBeVisible();
});

test("a home page error offers a manual retry without a redirect loop", async ({
  page,
}) => {
  let homeLoads = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest()) homeLoads += 1;
  });
  await page.route("**/src/ui/Start/index.tsx", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: 'throw new Error("Test home failure");',
    }),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("请重新加载页面后再试。");
  await expect(page.getByRole("link", { name: "重新加载" })).toHaveAttribute(
    "href",
    "/",
  );
  await page.waitForTimeout(1000);
  expect(homeLoads).toBe(1);
});
