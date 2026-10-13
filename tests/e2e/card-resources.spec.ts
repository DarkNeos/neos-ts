import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

const records = [
  { id: 1000001, name: "训练龙", desc: "原始效果文本", type: 0x21 },
  { id: 1000002, name: "普通骑士", desc: "训练龙的相关效果", type: 0x21 },
  {
    id: 1000003,
    name: "灵摆测试卡",
    desc: "[ Monster Effect ]\n只有怪兽效果。",
    type: 0x1000021,
  },
  { id: 1000004, name: "超先行测试卡", desc: "超先行卡效果", type: 0x21 },
];
let releaseDb: Buffer;
let preReleaseDb: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const make = (preRelease: boolean) => {
    const db = new SQL.Database();
    db.run(
      "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0, atk INTEGER DEFAULT 1800, def INTEGER DEFAULT 1000, level INTEGER DEFAULT 4, race INTEGER DEFAULT 1, attribute INTEGER DEFAULT 1); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
    );
    for (const record of records.filter(
      (card) => (card.id === 1000004) === preRelease,
    )) {
      db.run("INSERT INTO datas (id, type) VALUES (?, ?)", [
        record.id,
        record.type,
      ]);
      db.run("INSERT INTO texts VALUES (?, ?, ?)", [
        record.id,
        record.name,
        record.desc,
      ]);
    }
    const bytes = Buffer.from(db.export());
    db.close();
    return bytes;
  };
  releaseDb = make(false);
  preReleaseDb = make(true);
});

/** 模拟曾经启用扩展的用户，确认旧设置不会重新触发下载或替换原资源。 */
async function setup(page: Page, language = "cn") {
  await page.addInitScript((language) => {
    localStorage.setItem("language", language);
    localStorage.setItem(
      "__neo_setting_config__",
      JSON.stringify({
        audio: { musicVolume: 0.27 },
        animation: { enabled: false, speed: 0.6 },
        extensions: {
          simplifiedChineseText: true,
          simplifiedChineseImages: true,
        },
      }),
    );
  }, language);
  await page.route("**/*.cdb", (route) =>
    route.fulfill({
      body: route.request().url().includes("test-release.cdb")
        ? preReleaseDb
        : releaseDb,
    }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1211 确认" }),
  );
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [{ id: 1000004 }] }),
  );
  const extensionRequests: string[] = [];
  page.on("request", (request) => {
    if (/https:\/\/(ygocdb-ext|cards)\.ihex\.dev\//.test(request.url())) {
      extensionRequests.push(request.url());
    }
  });
  await page.route(/https:\/\/(ygocdb-ext|cards)\.ihex\.dev\//, (route) => {
    return route.abort();
  });
  await page.route(/\/\d+\.(webp|jpg)$/, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="350"><rect width="100%" height="100%" fill="#ac8162"/></svg>',
    }),
  );
  await page.goto("/build");
  await expect(page.locator('[data-card-source="search"]')).toHaveCount(
    records.length,
  );
  return extensionRequests;
}

const result = (page: Page, code: number) =>
  page.locator(`[data-card-source="search"][data-card-code="${code}"]`);

for (const language of ["cn", "en"]) {
  test(`uses original text and ${language} images with prerelease JPG despite saved extension settings`, async ({
    page,
  }) => {
    const requests = await setup(page, language);
    const original = result(page, 1000001).locator("img").first();
    await expect(original).toHaveAttribute(
      "src",
      new RegExp(
        `ygopro-images-${
          language === "en" ? "en-US" : "zh-CN"
        }/1000001\\.webp$`,
      ),
    );
    const prerelease = result(page, 1000004).locator("img").first();
    await expect(prerelease).toHaveAttribute(
      "src",
      /ygopro-super-pre\/data\/pics\/1000004\.jpg$/,
    );
    // 检查浏览器实际解码成功，避免只有地址正确而图片仍然加载失败。
    for (const img of [original, prerelease]) {
      await expect
        .poll(() => img.evaluate((node: HTMLImageElement) => node.naturalWidth))
        .toBe(240);
    }
    await result(page, 1000001).hover();
    await expect(page.getByTestId("deck-card-detail-name")).toHaveText(
      "训练龙",
    );
    await expect(page.getByTestId("deck-card-detail")).toContainText(
      "原始效果文本",
    );
    await page.evaluate(async () => {
      const { openSettingPanel } = await import("/src/ui/Setting/index.tsx");
      openSettingPanel({});
    });
    await expect(page.getByRole("tab")).toHaveCount(3);
    await expect(
      page.getByRole("tab", { name: /扩展|Extensions/ }),
    ).toHaveCount(0);
    const settings = await page.evaluate(async () => {
      const { settingStore } = await import(
        "/src/stores/settingStore/index.ts"
      );
      return {
        volume: settingStore.audio.musicVolume,
        animation: settingStore.animation,
      };
    });
    expect(settings).toMatchObject({
      volume: 0.27,
      animation: { enabled: false, speed: 0.6 },
    });
    expect(requests).toEqual([]);
  });
}

test("keeps original name-only search and labels a lone pendulum monster effect correctly", async ({
  page,
}) => {
  await setup(page);
  await page.getByTestId("deck-search-input").fill("训练龙");
  await page.getByTestId("deck-search-input").press("Enter");
  await expect(page.locator('[data-card-source="search"]')).toHaveCount(2);
  await page.getByTestId("deck-search-name-only").check();
  await expect(page.locator('[data-card-source="search"]')).toHaveCount(1);
  await expect(result(page, 1000001)).toBeVisible();
  await page.getByTestId("deck-search-input").fill("灵摆测试卡");
  await page.getByTestId("deck-search-input").press("Enter");
  await result(page, 1000003).hover();
  const detail = page.getByTestId("deck-card-detail");
  await expect(detail).toContainText("只有怪兽效果。");
  await expect(detail).toContainText("怪兽效果");
  await expect(detail).not.toContainText("灵摆效果");
});
