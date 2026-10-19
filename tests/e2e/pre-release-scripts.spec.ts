import { expect, type Page, test } from "@playwright/test";

import {
  finishedReplayFixture,
  preReleaseReplayResources,
} from "../helpers/localReplayResources";

const scriptPattern = "**/ygopro-super-pre/data/script/**";
const versionPattern = "**/ygopro-super-pre/data/version.txt";
let fixture: Awaited<ReturnType<typeof preReleaseReplayResources>>;
let replay: ArrayBuffer;

test.beforeAll(async () => {
  fixture = await preReleaseReplayResources();
  replay = await finishedReplayFixture(fixture.reference, {
    host: [100000001, 89631139],
  });
});

async function initialize(page: Page, version = () => "1791556715") {
  const versionChecks: string[] = [];
  await page.route(versionPattern, (route) => {
    versionChecks.push(route.request().url());
    return route.fulfill({ body: `${version()}\n` });
  });
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({
      body: Buffer.from(
        fixture.resources.databases[
          route.request().url().includes("test-release")
            ? "preRelease"
            : "release"
        ],
      ),
    }),
  );
  await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [1, 2, 3, 4].map((id) => ({ id: 100000000 + id })) }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
  await page.route("**/script-zip/script.zip", (route) =>
    route.fulfill({ body: Buffer.from(fixture.resources.scripts[0]) }),
  );
  await page.goto("/match");
  await page.evaluate(async () => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
  });
  return versionChecks;
}

async function render(page: Page, data = replay) {
  return page.evaluate(
    async (bytes) => {
      const { renderLocalReplay } = await import(
        "/src/api/ocgcore/localReplay.ts"
      );
      const { parseYrp3dRecords } = await import("/src/api/ocgcore/replay.ts");
      const controller = new AbortController();
      const abort = () => controller.abort();
      window.addEventListener("cancel-test-replay", abort, { once: true });
      try {
        const result = await renderLocalReplay(new Uint8Array(bytes).buffer, {
          signal: controller.signal,
        });
        const records = parseYrp3dRecords(result.replay!);
        return {
          error: "",
          lpUpdates: records
            .filter((record) => record.func === 94)
            .map(({ data }) => ({
              player: new DataView(data).getUint8(0),
              lp: new DataView(data).getUint32(1, true),
            })),
          count: records.length,
        };
      } catch (error) {
        return { error: (error as Error).message, lpUpdates: [], count: 0 };
      } finally {
        window.removeEventListener("cancel-test-replay", abort);
      }
    },
    [...new Uint8Array(data)],
  );
}

test("browsing, deck extraction and normal replays do not download prerelease Lua", async ({
  page,
}) => {
  const downloads: string[] = [];
  await page.route(scriptPattern, (route) => {
    downloads.push(route.request().url());
    return route.fulfill({ status: 404 });
  });
  const versionChecks = await initialize(page);
  await page.evaluate(
    async (bytes) => {
      const { extractReplayDecks } = await import(
        "/src/api/ocgcore/replayDecks.ts"
      );
      await extractReplayDecks(new Uint8Array(bytes).buffer);
    },
    [...new Uint8Array(replay)],
  );
  const normal = await finishedReplayFixture(fixture.reference);
  expect((await render(page, normal)).error).toBe("");
  // 通常怪兽属于超先行卡库，也不需要请求 Lua。
  const preNormal = await finishedReplayFixture(fixture.reference, {
    host: [100000003, 89631139],
  });
  expect((await render(page, preNormal)).error).toBe("");
  expect(downloads).toEqual([]);
  expect(versionChecks).toHaveLength(1); // 页面初始化检查卡库版本。
});

test("loads an override, a Lua dependency and a generated card on demand, then reuses IndexedDB", async ({
  page,
}) => {
  const downloads: string[] = [];
  await page.route(scriptPattern, (route) => {
    const filename = new URL(route.request().url()).pathname.split("/").pop()!;
    downloads.push(filename);
    const body = fixture.scriptFiles[filename];
    return route.fulfill({ status: body ? 200 : 404, body });
  });
  const versionChecks = await initialize(page);
  expect(downloads).toEqual([]);
  expect(versionChecks).toHaveLength(1);
  const first = await render(page);
  expect(first.error).toBe("");
  expect(versionChecks).toHaveLength(2);
  expect(first.lpUpdates).toContainEqual({ player: 1, lp: 7999 });
  expect(downloads).not.toContain("c100000004.lua");
  for (const filename of [
    "c100000001.lua",
    "pre-release-helper.lua",
    "c100000002.lua",
  ])
    expect(downloads.filter((file) => file === filename)).toHaveLength(1);
  const previous = downloads.slice();
  await page.reload();
  await page.evaluate(async () => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
  });
  await page.route(scriptPattern, (route) => {
    downloads.push("unexpected network request");
    return route.abort();
  });
  expect(await render(page)).toEqual(first);
  expect(downloads).toEqual(previous);
  expect(versionChecks).toHaveLength(4); // 刷新页面和再次演算各检查一次。
});

test("checks once per replay and refreshes only used scripts when the version changes", async ({
  page,
}) => {
  let version = "1791556715";
  let lp = 7999;
  const downloads: URL[] = [];
  await page.route(scriptPattern, (route) => {
    const url = new URL(route.request().url());
    downloads.push(url);
    const filename = url.pathname.split("/").pop()!;
    const body = fixture.scriptFiles[filename]?.replace("7999", String(lp));
    return route.fulfill({ status: body ? 200 : 404, body });
  });
  const versionChecks = await initialize(page, () => version);
  const first = await render(page);
  expect(first.error).toBe("");
  expect(first.lpUpdates).toContainEqual({ player: 1, lp: 7999 });
  expect(versionChecks).toHaveLength(2);
  expect(downloads.every((url) => url.searchParams.get("v") === version)).toBe(
    true,
  );
  const firstCount = downloads.length;
  expect(await render(page)).toEqual(first);
  expect(versionChecks).toHaveLength(3);
  expect(downloads).toHaveLength(firstCount);

  version = "1791556716";
  lp = 7998;
  await page.reload();
  await page.evaluate(async () => {
    await (await import("/src/ui/Layout/utils.ts")).initializeApp();
  });
  const updated = await render(page);
  expect(updated.error).toBe("");
  expect(updated.lpUpdates).toContainEqual({ player: 1, lp: 7998 });
  expect(versionChecks).toHaveLength(5);
  const refreshed = downloads.slice(firstCount);
  expect(refreshed.length).toBeGreaterThan(0);
  expect(refreshed.every((url) => url.searchParams.get("v") === version)).toBe(
    true,
  );
  for (const filename of [
    "c100000001.lua",
    "pre-release-helper.lua",
    "c100000002.lua",
  ])
    expect(
      refreshed.filter((url) => url.pathname.endsWith(`/${filename}`)),
    ).toHaveLength(1);
  expect(
    downloads.some((url) => url.pathname.endsWith("/c100000004.lua")),
  ).toBe(false);
});

test("keeps old scripts after a failed version update and retries the same new version", async ({
  page,
}) => {
  let version = "1791556715";
  let unavailable = false;
  let lp = 7999;
  await page.route(scriptPattern, (route) => {
    if (unavailable) return route.fulfill({ status: 503 });
    const filename = new URL(route.request().url()).pathname.split("/").pop()!;
    const body = fixture.scriptFiles[filename]?.replace("7999", String(lp));
    return route.fulfill({ status: body ? 200 : 404, body });
  });
  await initialize(page, () => version);
  const first = await render(page);
  expect(first.error).toBe("");
  version = "1791556716";
  unavailable = true;
  expect(await render(page)).toEqual(first);
  unavailable = false;
  lp = 7998;
  const updated = await render(page);
  expect(updated.error).toBe("");
  expect(updated.lpUpdates).toContainEqual({ player: 1, lp: 7998 });
});

for (const fault of ["offline", "html"] as const) {
  test(`uses cached scripts when the version check is ${fault}, then checks again`, async ({
    page,
  }) => {
    const downloads: string[] = [];
    await page.route(scriptPattern, (route) => {
      const filename = new URL(route.request().url()).pathname
        .split("/")
        .pop()!;
      downloads.push(filename);
      const body = fixture.scriptFiles[filename];
      return route.fulfill({ status: body ? 200 : 404, body });
    });
    await initialize(page);
    const first = await render(page);
    expect(first.error).toBe("");
    const previous = downloads.slice();
    let checks = 0;
    await page.route(versionPattern, (route) => {
      checks++;
      return fault === "offline"
        ? route.abort()
        : route.fulfill({ body: "<!doctype html><html>CDN error</html>" });
    });
    expect(await render(page)).toEqual(first);
    expect(downloads).toEqual(previous);
    expect(checks).toBe(1);
    expect(await render(page)).toEqual(first);
    expect(checks).toBe(2);
    await page.route(versionPattern, (route) =>
      route.fulfill({ body: "1791556716" }),
    );
    expect((await render(page)).error).toBe("");
    expect(downloads.length).toBeGreaterThan(previous.length);
  });
}

test("refreshes a cached optional 404 when a new resource version is available", async ({
  page,
}) => {
  await page.route("**/cache-test", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("/cache-test");
  const downloads: string[] = [];
  await page.route("**/versioned-cache-script.lua?*", (route) => {
    const version = new URL(route.request().url()).searchParams.get("v")!;
    downloads.push(version);
    return route.fulfill({
      status: version === "1791556715" ? 404 : 200,
      body: "-- newly available dependency",
    });
  });
  const read = (version: string) =>
    page.evaluate(async (version) => {
      const { cachedBinary } = await import("/src/infra/resourceCache.ts");
      const bytes = await cachedBinary("/versioned-cache-script.lua", {
        version,
        allowNotFound: true,
      });
      return bytes === null ? null : new TextDecoder().decode(bytes);
    }, version);
  expect(await read("1791556715")).toBeNull();
  const firstCount = downloads.length;
  expect(await read("1791556715")).toBeNull();
  expect(downloads).toHaveLength(firstCount);
  expect(await read("1791556716")).toBe("-- newly available dependency");
  expect(downloads.slice(firstCount)).toEqual(["1791556716"]);
  expect(await read("1791556716")).toBe("-- newly available dependency");
  expect(downloads).toHaveLength(firstCount + 1);
});

for (const fault of ["missing", "unavailable", "html"] as const) {
  test(`reports a ${fault} prerelease script and permits a fresh retry`, async ({
    page,
  }) => {
    await page.route(scriptPattern, (route) =>
      route.fulfill({
        status: fault === "missing" ? 404 : fault === "unavailable" ? 503 : 200,
        body: fault === "html" ? "<!doctype html><html>CDN error</html>" : "",
      }),
    );
    await initialize(page);
    const failure = await render(page);
    expect(failure.error).toContain("c100000001.lua 加载失败");
    expect(failure.error).toContain(
      fault === "html"
        ? "内容无效"
        : fault === "missing"
        ? "HTTP 404"
        : "HTTP 503",
    );
    expect(failure.count).toBe(0);
    await page.unroute(scriptPattern);
    await page.route(scriptPattern, (route) => {
      const filename = new URL(route.request().url()).pathname
        .split("/")
        .pop()!;
      const body = fixture.scriptFiles[filename];
      return route.fulfill({ status: body ? 200 : 404, body });
    });
    expect((await render(page)).error).toBe("");
  });
}

test("cancels a prerelease download and can replay again", async ({ page }) => {
  let started = false;
  await page.route(scriptPattern, async (route) => {
    started = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route
      .fulfill({ body: fixture.scriptFiles["c100000001.lua"] })
      .catch(() => {});
  });
  await initialize(page);
  const result = render(page);
  await expect.poll(() => started).toBe(true);
  await page.evaluate(() =>
    window.dispatchEvent(new Event("cancel-test-replay")),
  );
  expect((await result).error).toContain("已取消");
  await page.unroute(scriptPattern);
  await page.route(scriptPattern, (route) => {
    const filename = new URL(route.request().url()).pathname.split("/").pop()!;
    const body = fixture.scriptFiles[filename];
    return route.fulfill({ status: body ? 200 : 404, body });
  });
  expect((await render(page)).error).toBe("");
});

test("expires optional 404 caches and never treats a required resource as optional", async ({
  page,
}) => {
  await page.route("**/cache-test", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("/cache-test");
  let requests = 0;
  let available = false;
  await page.route("**/cache-script.lua", (route) => {
    requests++;
    return route.fulfill({
      status: available ? 200 : 404,
      body: "-- available",
    });
  });
  const cached = (optional: boolean, hours = 0) =>
    page.evaluate(
      async ({ optional, hours }) => {
        const { cachedBinary } = await import("/src/infra/resourceCache.ts");
        const now = Date.now;
        Date.now = () => now() + hours * 60 * 60 * 1000;
        try {
          const bytes = await cachedBinary("/cache-script.lua", {
            allowNotFound: optional,
          });
          return {
            text: bytes === null ? null : new TextDecoder().decode(bytes),
            error: "",
          };
        } catch (error) {
          return { text: null, error: (error as Error).message };
        } finally {
          Date.now = now;
        }
      },
      { optional, hours },
    );
  expect(await cached(true)).toEqual({ text: null, error: "" });
  const initialRequests = requests;
  expect(await cached(true)).toEqual({ text: null, error: "" });
  expect(requests).toBe(initialRequests);
  expect((await cached(false)).error).toContain("HTTP 404");
  expect(requests).toBeGreaterThan(initialRequests);
  const requiredRequests = requests;
  available = true;
  expect(await cached(true)).toEqual({ text: null, error: "" });
  expect(requests).toBe(requiredRequests);
  expect(await cached(true, 25)).toEqual({ text: "-- available", error: "" });
  expect(requests).toBe(requiredRequests + 1);
});
