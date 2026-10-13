import { expect, test } from "@playwright/test";

import {
  buildReplayRecord,
  pauseReplay,
  uploadReplay,
  writeReplayFixture,
} from "./helpers/replay";

const replay = () => {
  const start = new Uint8Array(17);
  const view = new DataView(start.buffer);
  view.setUint32(1, 8000, true);
  view.setUint32(5, 8000, true);
  view.setUint16(9, 2, true);
  view.setUint16(11, 1, true);
  view.setUint16(13, 2, true);
  view.setUint16(15, 1, true);
  return Uint8Array.from([
    ...buildReplayRecord(4, start),
    ...buildReplayRecord(40, Uint8Array.of(0)),
    ...buildReplayRecord(5, Uint8Array.of(0, 0)),
  ]);
};

test("four sleeve choices persist and apply to the correct player's main and extra decks", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto("/match");
  await page.getByTestId("match-mode-appearance").click();
  await expect(page.getByTestId("sleeve-option")).toHaveCount(270);
  const choices = {
    meMain: "1070001",
    meExtra: "1070002",
    opMain: "1070003",
    opExtra: "1070004",
  };
  for (const [slot, id] of Object.entries(choices)) {
    await page.getByTestId(`sleeve-slot-${slot}`).click();
    await page.locator(`[data-sleeve-id="${id}"]`).click();
    await expect(page.locator(`[data-sleeve-id="${id}"]`)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  await page.reload();
  await page.getByTestId("match-mode-appearance").click();
  for (const [slot, id] of Object.entries(choices)) {
    await expect(
      page.getByTestId(`sleeve-slot-${slot}`).locator("img"),
    ).toHaveAttribute("src", new RegExp(`${id}.webp$`));
  }
  const file = await writeReplayFixture(info, "sleeves.yrp3d", replay());
  await uploadReplay(page, file);
  await pauseReplay(page);
  for (const [slot, id] of Object.entries(choices)) {
    const controller = slot.startsWith("me") ? 0 : 1;
    const zone = slot.endsWith("Extra") ? "EXTRA" : "DECK";
    const card = page
      .locator(
        `[data-testid="duel-card"][data-card-controller="${controller}"][data-card-zone="${zone}"]`,
      )
      .first();
    await expect(card.locator(`img[src$="${id}.webp"]`).first()).toHaveCount(1);
  }
});

test("field artwork follows face-up field spells and the setting applies at duel entry", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.evaluate(async () => {
    const { openSettingPanel } = await import("/src/ui/Setting/index.tsx");
    openSettingPanel({ defaultKey: "duel" });
  });
  await page.getByTestId("initial-chain-setting").click();
  await page.getByText("可用连锁：有可发动效果时询问", { exact: true }).click();
  await page.reload();
  const file = await writeReplayFixture(info, "field.yrp3d", replay());
  await uploadReplay(page, file);
  await pauseReplay(page);
  await expect(page.getByTestId("duel-chain-setting")).toHaveAttribute(
    "data-chain-setting",
    "available",
  );
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro, fetchCard } = await import("/src/api/index.ts");
    for (const player of [0, 1]) {
      const card = cardStore.at(ygopro.CardZone.DECK, player, 0);
      card.code = player === 0 ? 56725612 : 47355498;
      card.meta = fetchCard(card.code);
      card.location.zone = ygopro.CardZone.SZONE;
      card.location.sequence = 5;
      card.location.position = ygopro.CardPosition.FACEUP_ATTACK;
    }
  });
  await expect(page.getByTestId("duel-field-artwork")).toHaveCount(2);
  await expect(
    page.locator(
      '[data-testid="duel-field-artwork"][data-card-code="56725612"]',
    ),
  ).toHaveAttribute("src", /fields\/56725612\.webp$/);
  for (const image of await page.getByTestId("duel-field-artwork").all()) {
    const coverage = await image.evaluate((node) => {
      const art = node.getBoundingClientRect();
      const board = node.parentElement!.getBoundingClientRect();
      return art.left <= board.left && art.right >= board.right;
    });
    expect(coverage).toBe(true);
  }
  for (const player of ["me", "op"]) {
    const img = page.locator(
      `[data-testid="duel-field-artwork"][data-player="${player}"]`,
    );
    await expect
      .poll(() =>
        img.evaluate(
          (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.at(ygopro.CardZone.SZONE, 0, 5).location.position =
      ygopro.CardPosition.FACEDOWN_DEFENSE;
  });
  await expect(page.getByTestId("duel-field-artwork")).toHaveCount(1);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.at(ygopro.CardZone.SZONE, 1, 5).location.zone =
      ygopro.CardZone.GRAVE;
  });
  await expect(page.getByTestId("duel-field-artwork")).toHaveCount(0);
  await page.getByTestId("duel-chain-setting").click();
  await page.getByTestId("duel-chain-setting-ignore").click();
  await page.getByTestId("replay-restart").click();
  await expect(page.getByTestId("duel-chain-setting")).toHaveAttribute(
    "data-chain-setting",
    "available",
  );
});

test("downloads dedicated artwork for newly added fields and leaves missing art blank", async ({
  page,
}, info) => {
  await page.route("**/field/99999999.jpg", (route) =>
    route.fulfill({
      path: "neos-filed/artwork/public/neos-assets/fields/56725612.webp",
      contentType: "image/webp",
    }),
  );
  await page.route("**/field/99999998.jpg", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  const file = await writeReplayFixture(info, "remote-field.yrp3d", replay());
  await uploadReplay(page, file);
  await pauseReplay(page);
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    const card = cardStore.at(ygopro.CardZone.DECK, 0, 0);
    card.code = 99999999;
    card.location.zone = ygopro.CardZone.SZONE;
    card.location.sequence = 5;
    card.location.position = ygopro.CardPosition.FACEUP_ATTACK;
  });
  const artwork = page.getByTestId("duel-field-artwork");
  await expect(artwork).toHaveAttribute("src", /\/field\/99999999\.jpg$/);
  await expect
    .poll(() =>
      artwork.evaluate(
        (node: HTMLImageElement) => node.complete && node.naturalWidth > 0,
      ),
    )
    .toBe(true);
  const missing = page.waitForResponse((response) =>
    response.url().endsWith("/field/99999998.jpg"),
  );
  await page.evaluate(async () => {
    const { cardStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    cardStore.at(ygopro.CardZone.SZONE, 0, 5).code = 99999998;
  });
  await missing;
  await expect(artwork).toHaveCount(0);
});
