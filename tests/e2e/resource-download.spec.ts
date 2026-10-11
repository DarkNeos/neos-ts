import { createHash } from "node:crypto";

import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

const resourceUrl = "/download-test.bin";

async function download(page: Page, chunkSize = 4) {
  return page.evaluate(
    async ({ resourceUrl, chunkSize }) => {
      const modulePath = "/src/infra/pfetch.ts";
      const { pfetch } = await import(modulePath);
      const progress: number[] = [];
      try {
        const response = await pfetch(resourceUrl, {
          chunkSize,
          progressCallback: (value: number) => progress.push(value),
        });
        const bytes = await response.arrayBuffer();
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        return {
          status: response.status,
          length: bytes.byteLength,
          contentLength: response.headers.get("content-length"),
          contentRange: response.headers.get("content-range"),
          hash: Array.from(new Uint8Array(digest), (value) =>
            value.toString(16).padStart(2, "0"),
          ).join(""),
          progress,
          error: "",
        };
      } catch (error) {
        return { error: (error as Error).message, progress };
      }
    },
    { resourceUrl, chunkSize },
  );
}

test.beforeEach(async ({ page }) => {
  await page.route("**/download-test-page", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("/download-test-page");
});

test("downloads 5 MB ranges and assembles the exact file", async ({ page }) => {
  const body = Buffer.alloc(12_300_001);
  for (let index = 0; index < body.length; index++) body[index] = index % 251;
  const requests: string[] = [];
  await page.route(`**${resourceUrl}`, async (route) => {
    const range = route.request().headers().range;
    requests.push(range);
    const [, startText, endText] = range.match(/^bytes=(\d+)-(\d+)$/)!;
    const start = Number(startText);
    const end = Math.min(Number(endText), body.length - 1);
    await route.fulfill({
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${body.length}`,
        ETag: '"test-version"',
      },
      body: body.subarray(start, end + 1),
    });
  });

  const result = await download(page, 5_000_000);
  expect(result.error).toBe("");
  expect(result.status).toBe(200);
  expect(result.length).toBe(body.length);
  expect(result.contentLength).toBe(String(body.length));
  expect(result.contentRange).toBeNull();
  expect(result.hash).toBe(createHash("sha256").update(body).digest("hex"));
  expect(requests).toEqual([
    "bytes=0-4999999",
    "bytes=5000000-9999999",
    "bytes=10000000-12300000",
  ]);
  expect(result.progress.at(-1)).toBe(1);
  expect(result.progress.slice(0, -1).every((value) => value < 1)).toBe(true);
  expect(result.progress).toEqual([...result.progress].sort((a, b) => a - b));
});

test("uses the full response when the server ignores Range", async ({
  page,
}) => {
  let requests = 0;
  await page.route(`**${resourceUrl}`, (route) => {
    requests++;
    return route.fulfill({ body: "complete resource" });
  });
  const result = await download(page);
  expect(result.error).toBe("");
  expect(result.length).toBe(17);
  expect(requests).toBe(1);
});

test("falls back to a full GET when Content-Range is unavailable", async ({
  page,
}) => {
  const requests: (string | undefined)[] = [];
  await page.route(`**${resourceUrl}`, (route) => {
    const range = route.request().headers().range;
    requests.push(range);
    return route.fulfill({
      status: range ? 206 : 200,
      body: range ? "abcd" : "abcdefgh",
    });
  });
  const result = await download(page);
  expect(result.error).toBe("");
  expect(result.length).toBe(8);
  expect(requests).toEqual(["bytes=0-3", undefined]);
});

test("retries only the failed range", async ({ page }) => {
  const requests: string[] = [];
  await page.route(`**${resourceUrl}`, (route) => {
    const range = route.request().headers().range;
    requests.push(range);
    if (requests.length === 2) return route.fulfill({ status: 503 });
    const start = range === "bytes=0-3" ? 0 : 4;
    return route.fulfill({
      status: 206,
      headers: { "Content-Range": `bytes ${start}-${start + 3}/8` },
      body: start === 0 ? "abcd" : "efgh",
    });
  });
  const result = await download(page);
  expect(result.error).toBe("");
  expect(result.length).toBe(8);
  expect(requests).toEqual(["bytes=0-3", "bytes=4-7", "bytes=4-7"]);
});

for (const fault of ["offset", "truncated", "version"] as const) {
  test(`rejects a ${fault} error instead of assembling corrupt data`, async ({
    page,
  }) => {
    await page.route(`**${resourceUrl}`, (route) => {
      const second = route.request().headers().range === "bytes=4-7";
      const start = second ? (fault === "offset" ? 0 : 4) : 0;
      return route.fulfill({
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${start + 3}/8`,
          ETag: fault === "version" && second ? '"v2"' : '"v1"',
        },
        body: fault === "truncated" && second ? "ef" : "abcd",
      });
    });
    const result = await download(page);
    expect(result.error).toContain(
      fault === "version" ? "资源已更新" : "分段内容不完整",
    );
    expect(result.progress).not.toContain(1);
  });
}

test("times out reading a range body and stops retrying after cancellation", async ({
  page,
}) => {
  const result = await page.evaluate(async () => {
    const modulePath = "/src/infra/pfetch.ts";
    const { pfetch } = await import(modulePath);
    const fetchOriginal = window.fetch;
    const requests: string[] = [];
    const controller = new AbortController();
    window.fetch = async (_input, init) => {
      requests.push(new Headers(init?.headers).get("range")!);
      return new Response(
        new ReadableStream({
          start(stream) {
            stream.enqueue(new Uint8Array([1]));
            init?.signal?.addEventListener("abort", () => {
              stream.error(new DOMException("Aborted", "AbortError"));
            });
          },
        }),
        { status: 206, headers: { "Content-Range": "bytes 0-3/8" } },
      );
    };
    let timeoutError = "";
    let cancelError = "";
    try {
      try {
        await pfetch("/test", { chunkSize: 4, timeoutMs: 30 });
      } catch (error) {
        timeoutError = (error as Error).message;
      }
      setTimeout(() => controller.abort(), 10);
      try {
        await pfetch("/test", {
          chunkSize: 4,
          init: { signal: controller.signal },
        });
      } catch (error) {
        cancelError = (error as Error).message;
      }
    } finally {
      window.fetch = fetchOriginal;
    }
    return { requests, timeoutError, cancelError };
  });
  expect(result.timeoutError).toContain("超时或已取消");
  expect(result.cancelError).toContain("超时或已取消");
  expect(result.requests).toEqual(Array(4).fill("bytes=0-3"));
});

test("initializes the app from card databases downloaded in 5 MB ranges", async ({
  page,
}) => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT); INSERT INTO datas VALUES (123, 1); INSERT INTO texts VALUES (123, '分段下载测试', '卡库初始化成功');",
  );
  const preRelease = Buffer.from(db.export());
  db.run(
    "CREATE TABLE padding (data BLOB); INSERT INTO padding VALUES (zeroblob(5100000));",
  );
  const release = Buffer.from(db.export());
  db.close();
  const requests: { file: string; range: string }[] = [];
  await page.route("**/*.cdb", (route) => {
    const file = new URL(route.request().url()).pathname.split("/").pop()!;
    const body = file === "cards.cdb" ? release : preRelease;
    const range = route.request().headers().range;
    requests.push({ file, range });
    const [, startText, endText] = range.match(/^bytes=(\d+)-(\d+)$/)!;
    const start = Number(startText);
    const end = Math.min(Number(endText), body.length - 1);
    return route.fulfill({
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${body.length}`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Content-Range",
      },
      body: body.subarray(start, end + 1),
    });
  });
  await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
  await page.goto("/");
  await expect(page.locator('img[src$="/neos-main.webp"]')).toBeVisible();
  expect(
    requests
      .filter(({ file }) => file === "cards.cdb")
      .map(({ range }) => range),
  ).toEqual(["bytes=0-4999999", `bytes=5000000-${release.length - 1}`]);
  expect(
    requests
      .filter(({ file }) => file === "test-release.cdb")
      .map(({ range }) => range),
  ).toEqual(["bytes=0-4999999"]);
  const name = await page.evaluate(async () => {
    const modulePath = "/src/api/cards.ts";
    const { fetchCard } = await import(modulePath);
    return fetchCard(123).text.name;
  });
  expect(name).toBe("分段下载测试");
});
