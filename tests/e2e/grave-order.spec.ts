import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

import { expectCardHeight } from "./helpers/card-geometry";

let database: Buffer;
test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (let i = 0; i < 6; i++) {
    db.run("INSERT INTO datas VALUES (?, 1)", [1000001 + i]);
    db.run("INSERT INTO texts VALUES (?, ?, ?)", [
      1000001 + i,
      `墓地卡片 ${i + 1}`,
      "墓地顺序测试。",
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page, zone: "GRAVE" | "REMOVED" = "GRAVE") {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({ body: database }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1004 墓地\n!system 1001 手牌" }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(/\/100000[1-6]\.webp(\?.*)?$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 146"><rect width="100" height="146" fill="#997544"/></svg>',
    }),
  );
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (zone) => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { initUIContainer, getUIContainer } = await import(
      "/src/container/compat.ts"
    );
    const { matStore, cardStore } = await import("/src/stores/index.ts");
    const { settingStore } = await import("/src/stores/settingStore/index.ts");
    settingStore.saveAnimationConfig({ enabled: false });
    const { fetchCard, ygopro } = await import("/src/api/index.ts");
    const { cardZoneToNumber } = await import(
      "/src/api/ocgcore/ocgAdapter/util.ts"
    );
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: { readyState: WebSocket.OPEN, send: () => {} },
    });
    matStore.selfType = ygopro.StocTypeChange.SelfType.PLAYER1;
    // 创建顺序故意不同于墓地序号，双方交错存放。
    cardStore.inner = [0, 2, 1].flatMap((sequence) =>
      [0, 1].map((controller) => {
        const code = 1000001 + controller * 3 + sequence;
        return {
          uuid: `grave-${controller}-${sequence}`,
          code,
          meta: fetchCard(code),
          location: new ygopro.CardLocation({
            controller,
            zone: ygopro.CardZone[zone],
            sequence,
            position: ygopro.CardPosition.FACEUP_ATTACK,
          }),
          counters: {},
          idleInteractivities: [],
          selectInfo: { selectable: false, selected: false },
          status: 0,
          isToken: false,
          targeted: false,
        };
      }),
    );
    window.__graveMove = async (
      uuid: string,
      zone: number,
      sequence: number,
    ) => {
      const card = cardStore.inner.find((c) => c.uuid === uuid)!;
      const from = card.location;
      const payload = new Uint8Array(17);
      payload[0] = 50;
      new DataView(payload.buffer).setUint32(1, card.code, true);
      payload.set(
        [from.controller, cardZoneToNumber(from.zone), from.sequence, 1],
        5,
      );
      payload.set([from.controller, zone, sequence, 1], 9);
      const wire = new Uint8Array(payload.length + 3);
      new DataView(wire.buffer).setUint16(0, payload.length + 1, true);
      wire[2] = 1;
      wire.set(payload, 3);
      const { default: handle } = await import(
        "/src/service/onSocketMessage.ts"
      );
      await handle(
        getUIContainer(),
        new MessageEvent("message", { data: wire.buffer }),
      );
    };
    window.__startOutsideEffect = (uuid: string) => {
      const target = cardStore.inner.find((c) => c.uuid === uuid)!;
      const payload = new Uint8Array(17);
      payload[0] = 70;
      new DataView(payload.buffer).setUint32(1, target.code, true);
      payload.set(
        [
          target.location.controller,
          cardZoneToNumber(target.location.zone),
          target.location.sequence,
          1,
        ],
        5,
      );
      payload.set(
        [
          target.location.controller,
          cardZoneToNumber(target.location.zone),
          target.location.sequence,
        ],
        9,
      );
      payload[16] = matStore.chainCards.length + 1;
      const wire = new Uint8Array(payload.length + 3);
      new DataView(wire.buffer).setUint16(0, payload.length + 1, true);
      wire[2] = 1;
      wire.set(payload, 3);
      window.__focusDone = false;
      window.__focusFrames = [];
      const started = performance.now();
      // 逐帧检查实际可见性和卡图尺寸，避免只设置了 zIndex 却仍被上层卡遮挡。
      const sample = () => {
        const element = document.querySelector(`[data-card-uuid="${uuid}"]`)!;
        const style = getComputedStyle(element);
        const transform = new DOMMatrix(style.transform);
        const rect = element.querySelector("img")!.getBoundingClientRect();
        window.__focusFrames.push({
          elapsed: performance.now() - started,
          height:
            Math.round(
              parseFloat(style.height) *
                Math.hypot(transform.a, transform.b) *
                1000,
            ) / 1000,
          y: transform.f,
          z:
            new DOMMatrix(
              getComputedStyle(
                element.querySelector('[class*="img-wrap"]')!,
              ).transform,
            ).m43 - 0.1,
          width: rect.width,
          renderedHeight: rect.height,
          zIndex: Number(style.zIndex),
          visible:
            document
              .elementFromPoint(
                rect.x + rect.width / 2,
                rect.y + rect.height / 2,
              )
              ?.closest('[data-testid="duel-card"]')
              ?.getAttribute("data-card-uuid") === uuid,
        });
        if (!window.__focusDone) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      void import("/src/service/onSocketMessage.ts")
        .then(({ default: handle }) =>
          handle(
            getUIContainer(),
            new MessageEvent("message", { data: wire.buffer }),
          ),
        )
        .then(() => {
          window.__focusElapsed = performance.now() - started;
          window.__focusDone = true;
        });
    };
    history.pushState({}, "", "/duel");
    dispatchEvent(new PopStateEvent("popstate"));
  }, zone);
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  await expect(page.getByTestId("duel-card")).toHaveCount(6);
}

// 双方墓地与除外区分别验证展示时间、重复发动和中断后的叠放恢复。
for (const zone of ["GRAVE", "REMOVED"] as const) {
  for (const controller of [0, 1]) {
    test(`player ${controller} ${zone} effect lifts a covered card for 550ms and restores the stack on repeat`, async ({
      page,
    }, info) => {
      await setup(page, zone);
      const target = card(page, `grave-${controller}-0`);
      const top = `grave-${controller}-2`;
      await expectTop(page, top);
      const initial = await target.getAttribute("style");
      const initialSize = await target.evaluate((element) => {
        const rect = element.querySelector("img")!.getBoundingClientRect();
        return {
          y: new DOMMatrix(getComputedStyle(element).transform).f,
          width: rect.width,
          height: rect.height,
        };
      });

      // 改变移卡速度不影响发动演出的 100/350/100ms 节奏。
      for (const speed of [0, 1]) {
        await page.evaluate(
          async ({ controller, speed }) => {
            const { settingStore } = await import(
              "/src/stores/settingStore/index.ts"
            );
            settingStore.saveAnimationConfig({ enabled: true, speed });
            window.__startOutsideEffect(`grave-${controller}-0`);
          },
          { controller, speed },
        );
        await expect(target).toHaveAttribute("data-card-focusing", "true");
        await expectCardHeight(target, zone === "GRAVE" ? 100 : 150);
        if (zone === "GRAVE") {
          await expect
            .poll(() =>
              target.evaluate(
                (element, initialY) =>
                  Math.abs(
                    new DOMMatrix(getComputedStyle(element).transform).f -
                      initialY,
                  ),
                initialSize.y,
              ),
            )
            .toBeGreaterThanOrEqual(30);
        }
        await expect(target).toHaveCSS("z-index", "1000");
        await expectTop(page, `grave-${controller}-0`);
        if (speed === 0)
          await page.screenshot({
            path: info.outputPath("outside-effect.png"),
          });
        await expect
          .poll(() => page.evaluate(() => window.__focusDone))
          .toBe(true);
        await expect(target).toHaveAttribute("data-card-focusing", "false");
        await expect(target).toHaveAttribute("style", initial!);
        await expectTop(page, top);
        const { elapsed, frames } = await page.evaluate(() => ({
          elapsed: window.__focusElapsed,
          frames: window.__focusFrames,
        }));
        expect(elapsed).toBeGreaterThanOrEqual(500);
        expect(elapsed).toBeLessThan(1000);
        const displayed = frames.filter((frame) =>
          zone === "GRAVE"
            ? Math.abs(frame.y - initialSize.y) >= 29.99
            : frame.height >= 149.9 && frame.z >= 50,
        );
        if (zone === "GRAVE") {
          for (const frame of frames) {
            expect(frame.height).toBe(100);
            expect(Math.abs(frame.width - initialSize.width)).toBeLessThan(0.1);
            expect(
              Math.abs(frame.renderedHeight - initialSize.height),
            ).toBeLessThan(0.1);
          }
        }
        expect(displayed.length).toBeGreaterThan(5);
        expect(
          displayed.every((frame) => frame.visible && frame.zIndex === 1000),
        ).toBe(true);
        expect(
          displayed.at(-1).elapsed - displayed[0].elapsed,
        ).toBeGreaterThanOrEqual(300);
        await expect(target).toHaveAttribute("data-card-sequence", "0");
        await expect(card(page, top)).toHaveAttribute(
          "data-card-sequence",
          "2",
        );
      }
    });
  }

  test(`${zone} effect skips disabled animations and restores the stack when interrupted`, async ({
    page,
  }) => {
    await setup(page, zone);
    const target = card(page, "grave-0-0");
    await expectTop(page, "grave-0-2");
    const initial = await target.getAttribute("style");
    const initialY = await target.evaluate(
      (element) => new DOMMatrix(getComputedStyle(element).transform).f,
    );
    await page.evaluate(() => window.__startOutsideEffect("grave-0-0"));
    await expect.poll(() => page.evaluate(() => window.__focusDone)).toBe(true);
    expect(await page.evaluate(() => window.__focusElapsed)).toBeLessThan(300);
    await expect(target).toHaveAttribute("style", initial!);

    for (const interruption of ["disable", "background"]) {
      await page.evaluate(async () => {
        const { settingStore } = await import(
          "/src/stores/settingStore/index.ts"
        );
        settingStore.saveAnimationConfig({ enabled: true });
        window.__startOutsideEffect("grave-0-0");
      });
      if (zone === "GRAVE") {
        await expect
          .poll(() =>
            target.evaluate(
              (element, initialY) =>
                Math.abs(
                  new DOMMatrix(getComputedStyle(element).transform).f -
                    initialY,
                ),
              initialY,
            ),
          )
          .toBeGreaterThanOrEqual(30);
      } else {
        await expectCardHeight(target, 150);
      }
      await page.evaluate(async (interruption) => {
        if (interruption === "disable") {
          const { settingStore } = await import(
            "/src/stores/settingStore/index.ts"
          );
          settingStore.saveAnimationConfig({ enabled: false });
        } else {
          Object.defineProperty(document, "hidden", {
            configurable: true,
            get: () => true,
          });
          document.dispatchEvent(new Event("visibilitychange"));
        }
      }, interruption);
      await expect
        .poll(() => page.evaluate(() => window.__focusDone))
        .toBe(true);
      await expect(target).toHaveAttribute("data-card-focusing", "false");
      await expect(target).toHaveAttribute("style", initial!);
      await expectTop(page, "grave-0-2");
      expect(await page.evaluate(() => window.__focusElapsed)).toBeLessThan(
        500,
      );
    }
  });
}

const card = (page: Page, uuid: string) =>
  page.locator(`[data-testid="duel-card"][data-card-uuid="${uuid}"]`);
const drawer = (page: Page) => page.getByTestId("duel-card-list-drawer");

async function expectList(page: Page, codes: number[]) {
  await expect(drawer(page)).toBeVisible();
  await expect
    .poll(() =>
      drawer(page)
        .locator(".ant-space-item img")
        .evaluateAll((images) =>
          images.map((img) =>
            Number((img as HTMLImageElement).src.match(/\/(\d+)\.webp/)?.[1]),
          ),
        ),
    )
    .toEqual(codes);
}

async function expectTop(page: Page, uuid: string) {
  await expect(card(page, uuid)).toBeVisible();
  // 检查真正显示且可点击的顶卡，避免只验证 z-index 数值。
  await expect
    .poll(() =>
      card(page, uuid).evaluate((element) => {
        const rect = element.querySelector("img")!.getBoundingClientRect();
        return document
          .elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
          ?.closest('[data-testid="duel-card"]')
          ?.getAttribute("data-card-uuid");
      }),
    )
    .toBe(uuid);
}

for (const controller of [0, 1]) {
  test(`player ${controller} grave list follows sequence after cards leave and return`, async ({
    page,
  }) => {
    await setup(page);
    await expectTop(page, `grave-${controller}-2`);
    await card(page, `grave-${controller}-2`).click();
    const base = 1000001 + controller * 3;
    await expectList(page, [base + 2, base + 1, base]);
    await page.evaluate((controller) => {
      return window.__graveMove(`grave-${controller}-0`, 2, 0);
    }, controller);
    await expectList(page, [base + 2, base + 1]);
    await page.evaluate((controller) => {
      return window.__graveMove(`grave-${controller}-0`, 16, 2);
    }, controller);
    await expectList(page, [base, base + 2, base + 1]);
    await drawer(page)
      .locator(".ant-space-item img")
      .first()
      .locator("..")
      .click();
    await expect(page.getByTestId("duel-card-detail")).toHaveAttribute(
      "data-card-code",
      String(base),
    );
  });

  test(`player ${controller} visible grave top stays in sync after sequence shifts`, async ({
    page,
  }) => {
    await setup(page);
    await page.evaluate(async () => {
      const { settingStore } = await import(
        "/src/stores/settingStore/index.ts"
      );
      settingStore.saveAnimationConfig({ enabled: true });
    });
    await expectTop(page, `grave-${controller}-2`);
    await page.evaluate((controller) => {
      return window.__graveMove(`grave-${controller}-0`, 2, 0);
    }, controller);
    await expect(card(page, `grave-${controller}-2`)).toHaveAttribute(
      "data-card-sequence",
      "1",
    );
    await expectTop(page, `grave-${controller}-2`);
    // 底部卡重新入墓应成为顶卡，不能被已减小序号的旧顶卡遮住。
    await page.evaluate((controller) => {
      return window.__graveMove(`grave-${controller}-0`, 16, 2);
    }, controller);
    await expectTop(page, `grave-${controller}-0`);
    await card(page, `grave-${controller}-0`).click();
    const base = 1000001 + controller * 3;
    await expectList(page, [base, base + 2, base + 1]);
    await drawer(page).getByRole("button", { name: "Close" }).click();
    await page.evaluate((controller) => {
      return window.__graveMove(`grave-${controller}-0`, 0, 0);
    }, controller);
    await expect(card(page, `grave-${controller}-0`)).toHaveCount(0);
    await expectTop(page, `grave-${controller}-2`);
  });
}
