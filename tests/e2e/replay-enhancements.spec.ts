import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";
import { serverReplayPayload } from "./helpers/serverReplay";

import {
  advanceReplayTo,
  buildReplayRecord,
  pauseReplay,
  ReplayAdvanceFlag,
  uploadReplay,
  writeReplayFixture,
  snapshotDuelDom,
} from "./helpers/replay";

const combine = (records: Uint8Array[]) =>
  Uint8Array.from(records.flatMap((record) => [...record]));
const start = () => {
  const data = new Uint8Array(17);
  const view = new DataView(data.buffer);
  view.setInt32(1, 8000, true);
  view.setInt32(5, 8000, true);
  view.setInt16(9, 3, true);
  view.setInt16(11, 1, true);
  view.setInt16(13, 3, true);
  view.setInt16(15, 1, true);
  return buildReplayRecord(4, data);
};
const damage = (value: number) => {
  const data = new Uint8Array(5);
  new DataView(data.buffer).setUint32(1, value, true);
  return buildReplayRecord(91, data);
};
const move = () => {
  const data = new Uint8Array(16);
  const view = new DataView(data.buffer);
  view.setUint32(0, 46986414, true);
  data.set([0, 1, 2, 2, 0, 4, 2, 1], 4);
  return buildReplayRecord(50, data);
};
const sequence = () =>
  combine([
    start(),
    buildReplayRecord(40, Uint8Array.of(0)),
    move(),
    damage(1200),
    buildReplayRecord(40, Uint8Array.of(1)),
    damage(400),
    buildReplayRecord(5, Uint8Array.of(0, 0)),
  ]);

test("rewinds the action currently on screen while its animation is still running", async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "__neo_setting_config__",
      JSON.stringify({ animation: { enabled: true, speed: 0 } }),
    ),
  );
  const file = await writeReplayFixture(
    info,
    "rewind-moving-card.yrp3d",
    sequence(),
  );
  await uploadReplay(page, file);
  await pauseReplay(page);
  await advanceReplayTo(page, ReplayAdvanceFlag.NEW_TURN);
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "1",
  );
  await page.getByTestId("replay-advance").click();
  // 区域已经改变、落场动画尚未结束，此时上一步应回到本回合开始。
  await page.waitForFunction(() => {
    const card = document.querySelector<HTMLElement>(
      '[data-testid="duel-card"][data-card-code="46986414"][data-card-zone="MZONE"]',
    );
    if (!card) return false;
    document
      .querySelector<HTMLButtonElement>('[data-testid="replay-previous"]')!
      .click();
    return true;
  });
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "1",
  );
  await expect(page.getByRole("button", { name: /第 1 回合/ })).toBeVisible();
});

test("restores the rendered board immediately when rewinding or swapping during playback", async ({
  page,
}, info) => {
  const file = await writeReplayFixture(
    info,
    "animated-navigation.yrp3d",
    sequence(),
  );
  await uploadReplay(page, file);
  await pauseReplay(page);
  await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
  const card = page.locator(
    '[data-testid="duel-card"][data-card-code="46986414"]',
  );
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "2",
  );
  await expect(page.getByTestId("replay-advance")).toBeEnabled();
  await expect(card).toHaveCSS("height", "120px");
  const before = await card.evaluate((e) => ({
    transform: e.style.transform,
    height: getComputedStyle(e).height,
  }));
  await advanceReplayTo(page, ReplayAdvanceFlag.UPDATE_HP);
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "3",
  );
  await page.getByTestId("replay-previous").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  expect(
    await card.evaluate((e) => ({
      transform: e.style.transform,
      height: getComputedStyle(e).height,
    })),
  ).toEqual(before);
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "2",
  );

  // 在消息执行和动画尚未结束时切换，仍应停在点击时的进度。
  await page.getByTestId("replay-toggle").click();
  const index = await page.evaluate(() => {
    const toggle = document.querySelector('[data-testid="replay-toggle"]')!;
    const index = toggle.getAttribute("data-replay-index");
    document
      .querySelector<HTMLButtonElement>('[data-testid="replay-swap"]')!
      .click();
    return index;
  });
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    index!,
  );
  expect(
    await card.evaluate((e) => ({
      transform: e.style.transform,
      height: getComputedStyle(e).height,
    })),
  ).toEqual({
    transform: "translate(0px, -130px) rotateX(0deg) rotateZ(180deg) scale(1)",
    height: "120px",
  });
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-paused",
    "true",
  );
});

test("finishes seeking only after the restored board is drawn at a low frame rate", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    window.requestAnimationFrame = (callback) =>
      window.setTimeout(() => callback(performance.now()), 100);
    window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  });
  const file = await writeReplayFixture(
    info,
    "rewind-slow-render.yrp3d",
    sequence(),
  );
  await uploadReplay(page, file);
  await pauseReplay(page);
  await page.getByTestId("replay-restart").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "0",
  );
  await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "2",
  );
  await expect(page.getByTestId("replay-advance")).toBeEnabled();
  const before = await page
    .locator('[data-testid="duel-card"][data-card-code="46986414"]')
    .evaluate((card) => ({
      transform: card.style.transform,
      height: getComputedStyle(card).height,
    }));
  for (let attempt = 0; attempt < 3; attempt++) {
    await advanceReplayTo(page, ReplayAdvanceFlag.UPDATE_HP);
    await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
      "data-replay-index",
      "3",
    );
    await expect(page.getByTestId("replay-advance")).toBeEnabled();
    // 在播放器宣布定位完成的同一时刻检查，不能靠等待样式最终正确掩盖空场面。
    const restored = await page.evaluate(async () => {
      const { replayStore } = await import("/src/stores/index.ts");
      if (!(await replayStore.previous())) throw new Error("录像定位未完成");
      const card = document.querySelector<HTMLElement>(
        '[data-testid="duel-card"][data-card-code="46986414"]',
      );
      return card
        ? {
            transform: card.style.transform,
            height: getComputedStyle(card).height,
          }
        : null;
    });
    expect(restored).toEqual(before);
  }
});

// 覆盖真实消息重建、继续步进、换视角以及 EOF 后回退。
test("rewinds to an identical board and continues after seeking and replay end", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "__neo_setting_config__",
      JSON.stringify({ animation: { enabled: false, speed: 0.7 } }),
    ),
  );
  const file = await writeReplayFixture(info, "rewind.yrp3d", sequence());
  await uploadReplay(page, file);
  await pauseReplay(page);
  await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
  await expect(
    page.locator('[data-testid="duel-card"][data-card-code="46986414"]'),
  ).toHaveCount(1);
  const before = await snapshotDuelDom(page);
  await advanceReplayTo(page, ReplayAdvanceFlag.UPDATE_HP);
  await expect(
    page.locator('[data-testid="duel-player-life"][data-player="me"]'),
  ).toHaveAttribute("data-life", "6800");
  await page.getByTestId("replay-previous").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect.poll(() => snapshotDuelDom(page)).toEqual(before);
  await advanceReplayTo(page, ReplayAdvanceFlag.UPDATE_HP);
  await expect(
    page.locator('[data-testid="duel-player-life"][data-player="me"]'),
  ).toHaveAttribute("data-life", "6800");
  await page.getByTestId("replay-swap").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect(
    page.locator('[data-testid="duel-player-life"][data-player="op"]'),
  ).toHaveAttribute("data-life", "6800");
  await page.getByTestId("replay-next-turn").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "4",
  );
  await page.getByTestId("replay-toggle").click();
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await page.getByRole("button", { name: "继续查看" }).click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-ended",
    "true",
  );
  await page.getByTestId("replay-previous").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "5",
  );
  await page.getByTestId("replay-restart").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "0",
  );
  await expect(page.getByTestId("replay-previous")).toBeDisabled();
  await page.getByTestId("duel-leave").click();
  await expect(page).toHaveURL(/\/match/);
  expect(errors).toEqual([]);
});

function embeddedDecks(compressed: boolean) {
  return buildReplayRecord(231, serverReplayPayload(compressed));
}

for (const compressed of [false, true])
  test(`extracts both embedded decks including duplicates (${
    compressed ? "LZMA" : "raw"
  })`, async ({ page }, info) => {
    await page.goto("/match");
    const data = combine([start(), embeddedDecks(compressed)]);
    const extracted = await page.evaluate(
      async (bytes) => {
        const { extractReplayDecks } = await import(
          "/src/api/ocgcore/replayDecks.ts"
        );
        return extractReplayDecks(Uint8Array.from(bytes).buffer);
      },
      [...data],
    );
    expect(extracted).toHaveLength(2);
    expect(extracted[0]).toMatchObject({
      player: "Alpha",
      complete: true,
      main: [46986414, 46986414, 89631139],
      extra: [23995346],
      side: [],
    });
    expect(extracted[1]).toMatchObject({
      player: "Beta",
      complete: true,
      main: [15025844, 89631139, 15025844],
    });
  });

test("does not infer decks from visible cards and rejects malformed records", async ({
  page,
}) => {
  await page.goto("/match");
  const result = await page.evaluate(
    async (bytes) => {
      const { extractReplayDecks } = await import(
        "/src/api/ocgcore/replayDecks.ts"
      );
      const decks = await extractReplayDecks(Uint8Array.from(bytes).buffer);
      let rejected = false;
      try {
        await extractReplayDecks(
          new Uint8Array([4, 255, 255, 255, 255]).buffer,
        );
      } catch {
        rejected = true;
      }
      return { decks, rejected };
    },
    [...sequence()],
  );
  expect(result.rejected).toBe(true);
  expect(result.decks).toEqual([]);
});

test("keeps the game number when a preceding game has no server deck data", async ({
  page,
}) => {
  await page.goto("/match");
  const result = await page.evaluate(
    async (bytes) => {
      const { extractReplayDecks } = await import(
        "/src/api/ocgcore/replayDecks.ts"
      );
      return extractReplayDecks(Uint8Array.from(bytes).buffer);
    },
    [...combine([sequence(), sequence(), embeddedDecks(true)])],
  );
  expect(result).toHaveLength(2);
  expect(result.every((deck) => deck.game === 2 && deck.complete)).toBe(true);
});

test("parses large server replay packets and rejects incomplete framing", async ({
  page,
}) => {
  await page.goto("/match");
  const result = await page.evaluate(async () => {
    const { YgoProPacket } = await import(
      "/src/api/ocgcore/ocgAdapter/packet.ts"
    );
    const bytes = new Uint8Array(40006);
    new DataView(bytes.buffer).setUint16(0, 40001, true);
    bytes[2] = 23;
    bytes.set([1, 0, 22], 40003);
    let rejected = false;
    try {
      YgoProPacket.deserialize(bytes.slice(0, 30000).buffer);
    } catch {
      rejected = true;
    }
    return {
      sizes: YgoProPacket.deserialize(bytes.buffer).map((p) => [
        p.proto,
        p.exData.length,
      ]),
      rejected,
    };
  });
  expect(result).toEqual({
    sizes: [
      [23, 40000],
      [22, 0],
    ],
    rejected: true,
  });
});

test("exports and saves extracted decks from the replay picker", async ({
  page,
}, info) => {
  const file = await writeReplayFixture(
    info,
    "export.yrp3d",
    combine([start(), embeddedDecks(true)]),
  );
  await page.goto("/match");
  await page.getByText("录像回放", { exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(file);
  await page.getByRole("button", { name: "提取卡组", exact: true }).click();
  const deck = page.getByTestId("replay-extracted-deck").first();
  await expect(deck).toContainText("Alpha");
  await expect(deck).toContainText("主卡组和额外卡组完整");
  const downloaded = page.waitForEvent("download");
  await deck.getByRole("button", { name: "导出 YDK" }).click();
  const download = await downloaded;
  const path = info.outputPath("extracted.ydk");
  await download.saveAs(path);
  const ydk = await readFile(path, "utf8");
  expect(ydk.match(/^46986414$/gm)).toHaveLength(2);
  expect(ydk).toContain("#extra\n23995346");
  for (let index = 0; index < 2; index++) {
    await deck.getByRole("button", { name: "保存到本地卡组" }).click();
    await expect(
      page.getByText(`已保存：录像 1 - Alpha${index ? " (2)" : ""}`, {
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.goto("/build");
  await expect(
    page.getByText("录像 1 - Alpha", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("录像 1 - Alpha (2)", { exact: true }).first(),
  ).toBeVisible();
});

test("can restart during animation and leave during a rebuild", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const file = await writeReplayFixture(info, "interrupt.yrp3d", sequence());
  await uploadReplay(page, file);
  await pauseReplay(page);
  await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "2",
  );
  await advanceReplayTo(page, ReplayAdvanceFlag.UPDATE_HP);
  await expect(page.getByTestId("duel-life-change")).toBeVisible();
  await page.getByTestId("replay-restart").click();
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-seeking",
    "false",
  );
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "0",
  );
  await expect(
    page.locator('[data-testid="duel-player-life"][data-player="me"]'),
  ).toHaveAttribute("data-life", "8000");
  for (let index = 0; index < 3; index++) {
    await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
    await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
      "data-replay-index",
      "2",
    );
    await page.getByTestId("replay-previous").click();
    await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
      "data-replay-index",
      "1",
    );
  }
  await page.evaluate(() => {
    document
      .querySelector<HTMLButtonElement>('[data-testid="replay-restart"]')!
      .click();
    document
      .querySelector<HTMLButtonElement>('[data-testid="duel-leave"]')!
      .click();
  });
  await expect(page).toHaveURL(/\/match/);
  await uploadReplay(page, file);
  await pauseReplay(page);
  await advanceReplayTo(page, ReplayAdvanceFlag.MOVE);
  await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
    "data-replay-index",
    "2",
  );
  expect(errors).toEqual([]);
});
