import { expect, type Page } from "@playwright/test";

/** 对实际 Card 渲染计数，探针只存在于测试返回的模块中。 */
export async function trackCardRenders(page: Page) {
  await page.addInitScript(() => {
    window.__cardRenders = {};
  });
  await page.route(
    /\/src\/ui\/Duel\/PlayMat\/Card\/index\.tsx(?:\?|$)/,
    async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      const anchor = "const snap = useSnapshot(card);";
      expect(body).toContain(anchor);
      await route.fulfill({
        response,
        body: body.replace(
          anchor,
          `${anchor}\nwindow.__cardRenders[card.uuid] = (window.__cardRenders[card.uuid] ?? 0) + 1;`,
        ),
      });
    },
  );
}
