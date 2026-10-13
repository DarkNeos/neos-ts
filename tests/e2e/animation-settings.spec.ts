import { expect, test } from "@playwright/test";

test("animation checkbox defaults on for old settings, ignores system motion and persists", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    localStorage.setItem("language", "cn");
    if (!localStorage.getItem("__neo_setting_config__")) {
      localStorage.setItem(
        "__neo_setting_config__",
        JSON.stringify({ animation: { speed: 0.42 } }),
      );
    }
  });

  const openAnimations = async () => {
    await page.goto("/");
    await page.locator("nav .ant-dropdown-trigger").hover();
    await page.getByRole("menuitem", { name: /系统设置/ }).click();
    await page.getByRole("tab", { name: /^动画/ }).click();
  };
  const closeSettings = async () => {
    await page.locator(".ant-modal-wrap").click({ position: { x: 5, y: 5 } });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  };
  await openAnimations();
  const checkbox = page.getByRole("checkbox", { name: "启用动画" });
  await expect(checkbox).toBeChecked();
  await expect(page.getByRole("slider")).toHaveAttribute(
    "aria-valuenow",
    "0.42",
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-neos-animation",
    "enabled",
  );
  await page.evaluate(() => {
    const indicator = document.createElement("span");
    indicator.className = "anticon-spin";
    indicator.id = "animation-test-indicator";
    document.body.append(indicator);
  });
  expect(
    await page
      .locator("#animation-test-indicator")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).not.toBe("none");

  await checkbox.uncheck();
  await expect(page.locator("html")).toHaveAttribute(
    "data-neos-animation",
    "disabled",
  );
  await expect(page.locator("#animation-test-indicator")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("__neo_setting_config__")!).animation
            .enabled,
      ),
    )
    .toBe(false);
  await closeSettings();

  await openAnimations();
  await expect(checkbox).not.toBeChecked();
  await expect(page.locator("html")).toHaveAttribute(
    "data-neos-animation",
    "disabled",
  );
  await checkbox.check();
  await expect(page.locator("html")).toHaveAttribute(
    "data-neos-animation",
    "enabled",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("__neo_setting_config__")!).animation
            .enabled,
      ),
    )
    .toBe(true);
  await closeSettings();
});
