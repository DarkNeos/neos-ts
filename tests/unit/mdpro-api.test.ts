import assert from "node:assert/strict";
import Module from "node:module";
import path from "node:path";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const root = fileURLToPath(new URL("../../", import.meta.url));
const { outputFiles } = await build({
  entryPoints: [path.join(root, "src/api/mdproDeck/index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
  plugins: [
    {
      name: "isolated-mdpro-api",
      setup(builder) {
        builder.onResolve({ filter: /^@\/config$/ }, () => ({
          path: "config",
          namespace: "test",
        }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents:
            'export const useConfig = () => ({ mdproServer: "https://mdpro.test" });',
        }));
      },
    },
  ],
});
const filename = path.join(root, ".mdpro-api-unit.cjs");
const module = new Module(filename);
module.filename = filename;
module.paths = Module._nodeModulePaths(root);
module._compile(outputFiles![0].text, filename);
const api = module.exports;

const upload = {
  userId: 12345,
  token: "isolated-test-token",
  deckContributor: "tester",
  deck: {
    deckName: "测试卡组",
    deckCase: 0,
    deckYdk: "#main\n1\n#extra\n!side",
  },
};
const sync = { ...upload, deck: { ...upload.deck, deckId: "test-deck" } };
const generated = { code: 0, message: "", data: "test-deck" };
const saved = { code: 0, message: "", data: "true" };

function mockReplies(t: TestContext, replies: Response[]) {
  const calls: { path: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(new URL(url).hostname, "mdpro.test");
    calls.push({ path: new URL(url).pathname, init });
    const reply = replies.shift();
    assert.ok(reply, "出现了预期之外的请求");
    return reply;
  });
  return calls;
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

for (const scenario of [
  { name: "missing deck ID", replies: [{ code: 0, message: "" }] },
  { name: "empty deck ID", replies: [{ ...generated, data: "" }] },
  {
    name: "unconfirmed sync",
    replies: [generated, { ...saved, data: "false" }],
  },
  {
    name: "missing sync result",
    replies: [generated, { code: 0, message: "" }],
  },
  {
    name: "failed publication",
    replies: [generated, saved, { code: 0, message: "false" }],
  },
]) {
  test(`upload reports ${scenario.name} as a failure`, async (t) => {
    const calls = mockReplies(
      t,
      scenario.replies.map((body) => json(body)),
    );
    const result = await api.uploadDeck(upload);
    assert.notEqual(result.code, 0);
    assert.ok(result.message.trim());
    assert.equal(calls.length, scenario.replies.length);
    if (scenario.name === "failed publication")
      assert.match(result.message, /已保存到云端/);
  });
}

test("upload succeeds only after generating an ID, saving and confirming publication", async (t) => {
  const calls = mockReplies(t, [
    json(generated),
    json(saved),
    json({ code: 0, message: "true" }),
  ]);
  assert.equal((await api.uploadDeck(upload)).code, 0);
  assert.deepEqual(
    calls.map((call) => call.path),
    [
      "/api/mdpro3/deck/deckId",
      "/api/mdpro3/sync/single",
      "/api/mdpro3/deck/public",
    ],
  );
  assert.equal(
    JSON.parse(calls[1].init.body as string).deck.deckId,
    "test-deck",
  );
  assert.deepEqual(JSON.parse(calls[2].init.body as string), {
    userId: upload.userId,
    deckId: "test-deck",
    isPublic: true,
  });
  for (const call of calls) {
    const headers = new Headers(call.init.headers);
    assert.equal(headers.get("ReqSource"), "MDPro3");
    assert.equal(headers.get("ClientSource"), "Web");
    if (call.init.method === "POST") {
      assert.equal(headers.get("token"), upload.token);
      assert.equal(headers.get("Content-Type"), "application/json");
    }
  }
});

const endpoints = [
  () => api.generateDeck(),
  () => api.pullDecks(),
  () => api.mgetDeck("test-deck", upload.token),
  () => api.getPersonalList({ userID: upload.userId, token: upload.token }),
  () => api.syncDeck(sync, upload.token),
  () =>
    api.deleteDeck(
      upload.userId,
      upload.token,
      "test-deck",
      upload.deckContributor,
    ),
  () =>
    api.updatePublic(
      { userId: upload.userId, deckId: "test-deck", isPublic: true },
      upload.token,
    ),
];

test("all MDPro endpoints preserve HTTP error messages and use the same fallback", async (t) => {
  for (const response of [
    {
      make: () => json({ code: 0, message: "登录已过期，请重新登录" }, 401),
      code: 401,
      message: "登录已过期，请重新登录",
    },
    {
      make: () => new Response("Service unavailable", { status: 503 }),
      code: 503,
      message: "云卡组请求失败（HTTP 503）",
    },
  ]) {
    const calls = mockReplies(
      t,
      endpoints.map(() => response.make()),
    );
    for (const run of endpoints)
      assert.deepEqual(await run(), {
        code: response.code,
        message: response.message,
      });
    assert.equal(calls.length, endpoints.length);
    t.mock.restoreAll();
  }
});

test("invalid JSON and network failures are reported consistently by every endpoint", async (t) => {
  mockReplies(
    t,
    endpoints.map(() => new Response("invalid JSON")),
  );
  for (const run of endpoints) {
    const result = await run();
    assert.notEqual(result.code, 0);
    assert.match(result.message, /无效数据/);
  }
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Failed to fetch");
  });
  for (const run of endpoints) {
    const result = await run();
    assert.notEqual(result.code, 0);
    assert.match(result.message, /检查网络/);
  }
});
