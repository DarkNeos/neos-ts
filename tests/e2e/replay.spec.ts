import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  collectReplayExpected,
  expectReplayExpected,
  expectOrUpdateReplayExpected,
  pauseReplay,
  readReplayExpected,
  uploadReplay,
  writeReplayExpected,
} from "./helpers/replay";

interface ReplayFixtureCase {
  name: string;
  replayPath: string;
  expectedPath: string;
}

const REPLAY_FIXTURE_ROOT = path.resolve("tests/e2e/fixtures/replays");
const REPLAY_FIXTURE_TIMEOUT = Number(
  process.env.REPLAY_FIXTURE_TIMEOUT ?? 300000,
);
const REPLAY_FIXTURE_MAX_STEPS = Number(
  process.env.REPLAY_FIXTURE_MAX_STEPS ?? 20000,
);
const UPDATE_EXPECTED = process.env.UPDATE_EXPECTED === "1";
const replayFixtureCases = listReplayFixtureCases(REPLAY_FIXTURE_ROOT);

// 此套用例比较协议状态；动画节奏由专门的演出测试验证。
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "__neo_setting_config__",
      JSON.stringify({ animation: { enabled: false, speed: 0.7 } }),
    );
  });
});

test.describe("managed replay fixtures", () => {
  for (const replayCase of replayFixtureCases) {
    test(`matches expected DOM snapshots: ${replayCase.name}`, async ({
      page,
    }, testInfo) => {
      testInfo.setTimeout(REPLAY_FIXTURE_TIMEOUT);

      await uploadReplay(page, replayCase.replayPath);
      await pauseReplay(page);
      // 资源加载耗时不固定；从重建后的开局状态开始逐步比较。
      await page.getByTestId("replay-restart").click();
      await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
        "data-replay-seeking",
        "false",
      );
      await expect(page.getByTestId("replay-toggle")).toHaveAttribute(
        "data-replay-index",
        "0",
      );

      await expectOrUpdateReplayExpected(page, replayCase.expectedPath, {
        maxSteps: REPLAY_FIXTURE_MAX_STEPS,
      });

      await expect(page.getByText(/Win|Defeated/)).toBeVisible();
    });
  }
});

test("uploads an external yrp3d replay and collects snapshots", async ({
  page,
}, testInfo) => {
  testInfo.setTimeout(300000);

  const replayPath = process.env.REAL_REPLAY_PATH;
  test.skip(!replayPath, "Set REAL_REPLAY_PATH to verify an external replay.");

  await uploadReplay(page, replayPath);
  await pauseReplay(page);

  const advanceMask = process.env.REAL_REPLAY_ADVANCE_MASK
    ? Number(process.env.REAL_REPLAY_ADVANCE_MASK)
    : undefined;
  const replayOptions = {
    maxSteps: Number(process.env.REAL_REPLAY_MAX_STEPS ?? 20000),
    advanceMask,
  };
  const expectedPath = process.env.REAL_REPLAY_EXPECTED_PATH;
  const actual = expectedPath
    ? await expectReplayExpected(
        page,
        await readReplayExpected(expectedPath),
        replayOptions,
      )
    : await collectReplayExpected(page, replayOptions);
  await writeReplayExpected(testInfo.outputPath("expected.json"), actual);

  expect(actual.checkpoints.length).toBeGreaterThan(0);
  await expect(page.getByText(/Win|Defeated/)).toBeVisible();
});

function listReplayFixtureCases(root: string): ReplayFixtureCase[] {
  if (!existsSync(root)) return [];

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const caseDir = path.join(root, entry.name);

      return {
        name: entry.name,
        replayPath: path.join(caseDir, "replay.yrp3d"),
        expectedPath: path.join(caseDir, "expected.json"),
      };
    })
    .filter(
      (replayCase) =>
        existsSync(replayCase.replayPath) &&
        (UPDATE_EXPECTED || existsSync(replayCase.expectedPath)),
    )
    .sort((left, right) => left.name.localeCompare(right.name));
}
