import { expect, type Page, test } from "@playwright/test";
import { YGOProYrp } from "ygopro-yrp-encode";

import { replayFixture } from "../helpers/codecFixtures";
import {
  finishedReplayFixture,
  localReplayResources,
} from "../helpers/localReplayResources";
import { pauseReplay, writeReplayFixture } from "./helpers/replay";

let resources: Awaited<ReturnType<typeof localReplayResources>>;
let completed: Promise<ArrayBuffer> | undefined;

const completedReplay = () => (completed ??= finishedReplayFixture(resources));

async function openLocalReplay(page: Page, file: string) {
  await page.goto("/match");
  await page.getByText("录像回放", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
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
}

test.beforeAll(async () => {
  resources = await localReplayResources();
});

async function mockResources(page: Page) {
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({
      body: Buffer.from(
        resources.databases[
          route.request().url().includes("test-release")
            ? "preRelease"
            : "release"
        ],
      ),
    }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({
      body: "!Current\n89631139 0\n46986414 1\n!TCG Current\n89631139 1\n!Historical\n89631139 2\n46986414 0\n!TCG Historical\n89631139 0\n",
    }),
  );
  await page.route("**/env408-zh-CN/**/lflist.conf", (route) =>
    route.fulfill({ body: "!408 A\n89631139 1\n!408 B\n89631139 0\n" }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
  await page.addInitScript(() =>
    localStorage.setItem(
      "__neo_setting_config__",
      JSON.stringify({ animation: { enabled: false, speed: 0.7 } }),
    ),
  );
}

for (const yrp2 of [false, true]) {
  test(`uploads and plays ${
    yrp2 ? "YRP2" : "YRP1"
  } in a Worker, then reuses cached scripts`, async ({ page }, info) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await mockResources(page);
    let downloads = 0;
    await page.route("**/script-zip/script.zip", (route) => {
      downloads++;
      return route.fulfill({ body: Buffer.from(resources.scripts[0]) });
    });
    const parsed = new YGOProYrp().fromYrp(
      new Uint8Array(await completedReplay()),
    );
    const data = replayFixture({
      yrp2,
      compressed: true,
      responses: parsed.responses,
    });
    const file = await writeReplayFixture(
      info,
      `local.${yrp2 ? "yrp2" : "yrp"}`,
      new Uint8Array(data),
    );
    await openLocalReplay(page, file);
    await pauseReplay(page);
    const end = await page.evaluate(async () => {
      const { replayStore } = await import("/src/stores/index.ts");
      await replayStore.seek(replayStore.total - 1);
      return {
        total: replayStore.total,
        decks: replayStore.decks.map((deck) => deck.player),
      };
    });
    expect(end.total).toBeGreaterThan(50);
    expect(end.total).toBeLessThan(200);
    expect(end.decks).toEqual(["Alice", "Bob"]);
    await expect(
      page.locator('[data-testid="duel-card"][data-card-zone="DECK"]'),
    ).toHaveCount(0);
    await page.getByTestId("duel-leave").click();
    await expect(page).toHaveURL(/\/match/);
    await page.route("**/script-zip/script.zip", (route) => route.abort());
    await openLocalReplay(page, file);
    await expect(page.getByTestId("replay-toggle")).toBeVisible();
    expect(downloads).toBe(1);
    expect(errors).toEqual([]);
  });
}

test("plays a TAG replay through partner swaps and retains all four decks", async ({
  page,
}, info) => {
  await mockResources(page);
  await page.route("**/script-zip/script.zip", (route) =>
    route.fulfill({ body: Buffer.from(resources.scripts[0]) }),
  );
  const data = await finishedReplayFixture(resources, {
    tag: true,
    yrp2: true,
  });
  const file = await writeReplayFixture(info, "tag.yrp2", new Uint8Array(data));
  await openLocalReplay(page, file);
  await pauseReplay(page);
  const state = await page.evaluate(async () => {
    const { replayStore, roomStore } = await import("/src/stores/index.ts");
    await replayStore.seek(replayStore.total - 1);
    return {
      activePlayers: [
        roomStore.getMePlayer()?.name,
        roomStore.getOpPlayer()?.name,
      ],
      players: replayStore.decks.map((deck) => deck.player),
      ended: replayStore.ended,
    };
  });
  expect(state.activePlayers).toEqual(["Alice tag", "Bob"]);
  expect(state.players).toEqual(["Alice", "Alice tag", "Bob tag", "Bob"]);
  expect(state.ended).toBe(true);
});

test("cancels a script download, then opens a different replay without late navigation", async ({
  page,
}, info) => {
  await mockResources(page);
  let started = false;
  await page.route("**/script-zip/script.zip", async (route) => {
    started = true;
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route
      .fulfill({ body: Buffer.from(resources.scripts[0]) })
      .catch(() => {});
  });
  const file = await writeReplayFixture(
    info,
    "cancel.yrp",
    new Uint8Array(await completedReplay()),
  );
  await page.goto("/match");
  await page.getByText("录像回放", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "开始回放", exact: true }).click();
  await expect.poll(() => started).toBe(true);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page).toHaveURL(/\/match/);
  await page.unroute("**/script-zip/script.zip");
  await page.route("**/script-zip/script.zip", (route) =>
    route.fulfill({ body: Buffer.from(resources.scripts[0]) }),
  );
  await openLocalReplay(page, file);
  await expect(page.getByTestId("replay-toggle")).toBeVisible();
});

test("banlist selection updates editor and search badges and remembers each environment", async ({
  page,
}) => {
  await mockResources(page);
  await page.goto("/match");
  await page.evaluate(async () => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
    const { deckStore } = await import("/src/stores/index.ts");
    await deckStore.add({
      deckName: "Banlist test",
      main: [89631139],
      extra: [],
      side: [],
    });
    history.pushState({}, "", "/build");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByText("Banlist test", { exact: true }).click();
  const card = page.locator(
    '[data-testid="deck-card"][data-card-code="89631139"][data-card-source="main"]',
  );
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit00/,
  );
  await page.getByPlaceholder("关键词(空格分隔)").fill("青眼白龙");
  await page.getByPlaceholder("关键词(空格分隔)").press("Enter");
  const searchCard = page
    .locator(
      '[data-testid="deck-card"][data-card-code="89631139"][data-card-source="search"]',
    )
    .first();
  await expect(searchCard.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit00/,
  );
  const select = page.getByTestId("banlist-select");
  const environment = page.getByTestId("deck-environment-select");
  const visibleOptions = page.locator(
    ".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content",
  );
  await select.click();
  await expect(visibleOptions).toHaveText(["Current", "Historical"]);
  await page.getByTitle("Historical", { exact: true }).click();
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit02/,
  );
  await expect(searchCard.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit02/,
  );
  await environment.click();
  await page.getByTitle("TCG", { exact: true }).click();
  await expect(select).toContainText("TCG Current");
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit01/,
  );
  await expect(searchCard.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit01/,
  );
  await select.click();
  await expect(visibleOptions).toHaveText(["TCG Current", "TCG Historical"]);
  await page.getByTitle("TCG Historical", { exact: true }).click();
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit00/,
  );
  await expect(searchCard.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit00/,
  );
  await environment.click();
  await page.getByTitle("408", { exact: true }).click();
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit01/,
  );
  await expect(searchCard.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit01/,
  );
  await select.click();
  await expect(visibleOptions).toHaveText(["408 A", "408 B"]);
  await page.getByTitle("408 B", { exact: true }).click();
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit00/,
  );
  await page.reload();
  await expect(environment).toContainText("408");
  await expect(select).toContainText("408 B");
  await environment.click();
  await page.getByTitle("TCG", { exact: true }).click();
  await expect(select).toContainText("TCG Historical");
  await environment.click();
  await page.getByTitle("OCG", { exact: true }).click();
  await expect(select).toContainText("Historical");
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit02/,
  );
  await expect(searchCard.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit02/,
  );
  // 模拟升级前在 OCG 下选择 TCG 表，刷新后迁移到 TCG 并保留所选表。
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("neos-banlist-selection")!);
    localStorage.setItem(
      "neos-banlist-selection",
      JSON.stringify({
        environment: "ocg",
        selected: { ocg: saved.selected.tcg, "408": saved.selected["408"] },
      }),
    );
  });
  await page.reload();
  await expect(environment).toContainText("TCG");
  await expect(select).toContainText("TCG Historical");
  await expect(card.locator('img[src*="Limit"]')).toHaveAttribute(
    "src",
    /Limit00/,
  );
  await environment.click();
  await page.getByTitle("OCG", { exact: true }).click();
  await expect(select).toContainText("Current");
});

test("replacing the selected file during playback preparation only publishes the new file's decks", async ({
  page,
}, info) => {
  await mockResources(page);
  let started = false;
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/script-zip/script.zip", async (route) => {
    started = true;
    await held;
    await route
      .fulfill({ body: Buffer.from(resources.scripts[0]) })
      .catch(() => {});
  });
  const first = await writeReplayFixture(
    info,
    "first.yrp",
    new Uint8Array(await completedReplay()),
  );
  const second = await writeReplayFixture(
    info,
    "second.yrp",
    new Uint8Array(replayFixture({ host: [46986414] })),
  );
  await page.goto("/match");
  await page.getByText("录像回放", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(first);
  await page.getByRole("button", { name: "开始回放", exact: true }).click();
  await expect.poll(() => started).toBe(true);
  await page.locator('input[type="file"]').setInputFiles(second);
  await page.getByRole("button", { name: "提取卡组", exact: true }).click();
  await expect(page.getByTestId("replay-extracted-deck").first()).toContainText(
    "Alice",
  );
  release();
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { replayStore } = await import("/src/stores/index.ts");
        return replayStore.decks[0]?.main;
      }),
    )
    .toEqual([46986414]);
  await expect(page).toHaveURL(/\/match/);
});
