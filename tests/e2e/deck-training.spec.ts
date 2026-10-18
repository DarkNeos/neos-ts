import { expect, type Page, test, type WebSocketRoute } from "@playwright/test";
import initSqlJs from "sql.js";

import {
  CTOS_HAND_RESULT,
  CTOS_HS_READY,
  CTOS_JOIN_GAME,
  CTOS_SURRENDER,
  CTOS_TP_RESULT,
  CTOS_UPDATE_DECK,
  MSG_SIBYL_NAME,
  MSG_START,
  MSG_WIN,
  STOC_DUEL_END,
  STOC_ERROR_MSG,
  STOC_GAME_MSG,
  STOC_HAND_RESULT,
  STOC_HS_PLAYER_ENTER,
  STOC_JOIN_GAME,
  STOC_REPLAY,
  STOC_SELECT_HAND,
  STOC_SELECT_TP,
  STOC_TYPE_CHANGE,
} from "../../src/api/ocgcore/ocgAdapter/protoDecl";
import { serverReplayPayload } from "./helpers/serverReplay";

// 已保存卡组与编辑内容刻意不同，用于验证训练不会丢失未保存修改。
const savedDeck = {
  deckName: "已保存卡组",
  main: [1000001],
  extra: [],
  side: [],
};
const currentDeck = {
  deckName: "未保存训练卡组",
  main: [
    1000003, 1000001, 1000003, 1000001, 1000003, 1000001, 1000003, 1000001,
    1000003,
  ],
  extra: [1000002],
  side: [1000004],
};
let database: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (const [i, type] of [1, 0x41, 1, 2].entries()) {
    db.run("INSERT INTO datas (id, type) VALUES (?, ?)", [1000001 + i, type]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [
      1000001 + i,
      `训练测试卡 ${i}`,
    ]);
  }
  database = Buffer.from(db.export());
  db.close();
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // 模拟升级前的设置：旧普通服地址不能覆盖当前超先行服，旧数据没有起手数量。
    localStorage.setItem(
      "neos.training.options",
      JSON.stringify({
        server: "koishi.momobako.com:7211",
        first: true,
        noShuffle: true,
      }),
    );
  });
  await page.route("**/ygopro-super-pre/data/version.txt", (route) =>
    route.fulfill({ body: "1792173550" }),
  );
  await page.route(/\.cdb(?:\?.*)?$/, (route) =>
    route.fulfill({ body: database }),
  );
  await page.route("**/*.conf", (route) =>
    route.fulfill({ body: "!system 1211 确认" }),
  );
  await page.route(/\/test-release-v2\.json(?:\?.*)?$/, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/mdpro3/deck/list?*", (route) =>
    route.fulfill({ json: { code: 0, data: { total: 0, records: [] } } }),
  );
});

/** 初始化持久化卡组，再修改编辑器内容，模拟用户尚未点击保存的状态。 */
async function setupEditor(page: Page) {
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (deck) => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { deckStore } = await import("/src/stores/index.ts");
    await deckStore.reset();
    await deckStore.add(deck);
    deckStore.selectedDeckName = deck.deckName;
    const { deckDraftStore } = await import("/src/stores/deckDraftStore.ts");
    await deckDraftStore.open(
      deckStore.get(deck.deckName),
      `local:${deck.deckName}`,
    );
    history.pushState({}, "", "/build");
    dispatchEvent(new PopStateEvent("popstate"));
  }, savedDeck);
  await expect(page.getByTestId("deck-start-training")).toBeEnabled();
  await page.evaluate(async (deck) => {
    const { editDeckStore } = await import("/src/ui/BuildDeck/store.ts");
    const { fetchCard } = await import("/src/api/index.ts");
    editDeckStore.main = deck.main.map(fetchCard);
    editDeckStore.extra = deck.extra.map(fetchCard);
    editDeckStore.side = deck.side.map(fetchCard);
    editDeckStore.edited = true;
  }, currentDeck);
  await page.getByPlaceholder("请输入卡组名字").fill(currentDeck.deckName);
}

/** 组装真实 srvpro2 二进制包头，让训练测试覆盖消息适配和服务层。 */
function packet(proto: number, payload: Buffer | number[] = []) {
  const data = Buffer.from(payload);
  const wire = Buffer.alloc(data.length + 3);
  wire.writeUInt16LE(data.length + 1, 0);
  wire[2] = proto;
  data.copy(wire, 3);
  return wire;
}

/** 可覆盖服务器回报的规则，用于确认客户端拒绝未生效的训练设置。 */
interface ServerRules {
  mode?: number;
  noCheck?: boolean;
  noShuffle?: boolean;
  handSize?: number;
  startPlayer?: number;
  confirmRoom?: boolean;
  opponentHand?: number;
  deckError?: boolean;
}

/** 每次重新连接分别记录消息，验证重开训练不会复用旧连接。 */
interface Session {
  socket: WebSocketRoute;
  packets: Buffer[];
  closed: boolean;
}

/** 根据客户端消息推进入房、准备、猜拳与开局，模拟完整训练握手。 */
async function mockServer(page: Page, rules: ServerRules = {}) {
  const sessions: Session[] = [];
  const address = /^wss:\/\/koishi\.momobako\.com:(?:7211|889)\/$/;
  await page.routeWebSocket(address, (socket) => {
    const session = { socket, packets: [] as Buffer[], closed: false };
    sessions.push(session);
    socket.onClose(() => {
      session.closed = true;
    });
    socket.onMessage((message) => {
      const data = Buffer.from(message);
      session.packets.push(data);
      if (data[2] === CTOS_JOIN_GAME && rules.confirmRoom !== false) {
        const info = Buffer.alloc(20);
        info.writeUInt32LE(0xffffffff, 0);
        info[4] = 5;
        info[5] = rules.mode ?? 0;
        info[6] = 5;
        info[7] = Number(rules.noCheck ?? true);
        info[8] = Number(rules.noShuffle ?? true);
        info.writeUInt32LE(8000, 12);
        const pass = data
          .subarray(11, 51)
          .toString("utf16le")
          .replace(/\0.*$/, "");
        info[16] = rules.handSize ?? Number(pass.match(/,ST(\d+)#/)?.[1] ?? 5);
        info[17] = 1;
        socket.send(
          Buffer.concat([
            packet(STOC_JOIN_GAME, info),
            playerEnter("Test", 0),
            playerEnter("Rainbow", 1),
            packet(STOC_TYPE_CHANGE, [0]),
            packet(STOC_TYPE_CHANGE, [0]),
          ]),
        );
      }
      if (data[2] === CTOS_HS_READY && rules.deckError) {
        const error = Buffer.alloc(8);
        error[0] = 2;
        error.writeUInt32LE(0x40000000 | 1000003, 4);
        socket.send(packet(STOC_ERROR_MSG, error));
      }
      if (data[2] === CTOS_HAND_RESULT)
        socket.send(
          Buffer.concat([
            packet(STOC_HAND_RESULT, [2, rules.opponentHand ?? 1]),
            packet(STOC_SELECT_TP),
          ]),
        );
      if (data[2] === CTOS_TP_RESULT) {
        const start = Buffer.alloc(18);
        start[0] = MSG_START;
        start[1] = rules.startPlayer ?? (data[3] === 1 ? 0 : 1);
        start.writeInt32LE(8000, 2);
        start.writeInt32LE(8000, 6);
        start.writeInt16LE(currentDeck.main.length, 10);
        start.writeInt16LE(1, 12);
        start.writeInt16LE(40, 14);
        socket.send(packet(STOC_GAME_MSG, start));
      }
    });
  });
  return sessions;
}

/** 通过真实入口打开设置，并确认内部服务器和 AI 配置未暴露到表单。 */
async function openTraining(page: Page) {
  await page.getByTestId("deck-start-training").click();
  const settings = page.getByRole("dialog", { name: "训练设置" });
  await expect(settings.getByText("训练对手", { exact: true })).toHaveCount(0);
  await expect(settings.getByText("服务器地址", { exact: true })).toHaveCount(
    0,
  );
  await expect(settings.getByText("Rainbow", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("training-server")).toHaveCount(0);
}

/** 开始训练并等待房间确认，后续断言可检查实际发送的协议消息。 */
async function connectTraining(page: Page) {
  await openTraining(page);
  await page.locator("#training-start").click();
  await expect(page.getByTestId("training-waitroom")).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const { getUIContainer } = await import("/src/container/compat.ts");
      return getUIContainer().conn.ws.url;
    }),
  ).toBe("wss://koishi.momobako.com:889/");
}

async function connectSinglePlayer(page: Page) {
  await page.getByTestId("match-mode-single-player").click();
  await page.getByRole("button", { name: "超先行服", exact: true }).click();
}

/** 按包头的协议号筛选该次会话发送的消息。 */
function sent(session: Session, proto: number) {
  return session.packets.filter((data) => data[2] === proto);
}

/** 解码固定 20 个 UTF-16 字符的房间密码，检查训练参数没有被截断。 */
function password(session: Session) {
  return sent(session, CTOS_JOIN_GAME)[0]
    .subarray(11, 51)
    .toString("utf16le")
    .replace(/\0.*$/, "");
}

/** 保留上传包中的原始卡片顺序，检查拖放后的牌顶与训练起手一致。 */
function submittedDeck(session: Session) {
  const data = sent(session, CTOS_UPDATE_DECK)[0];
  return Array.from({ length: (data.length - 3) / 4 }, (_, i) =>
    data.readUInt32LE(3 + i * 4),
  );
}

/** 生成双方入座消息，供等待房间显示玩家和后续自动准备。 */
function playerEnter(name: string, position: number) {
  const payload = Buffer.alloc(41);
  payload.write(name, 0, "utf16le");
  payload[40] = position;
  return packet(STOC_HS_PLAYER_ENTER, payload);
}

/** 同时核对编辑器、内存卡组和 IndexedDB，确保训练没有隐式保存或覆盖卡组。 */
async function assertEditorPreserved(page: Page) {
  await expect(page.getByTestId("deck-start-training")).toBeEnabled();
  await expect(page.getByPlaceholder("请输入卡组名字")).toHaveValue(
    currentDeck.deckName,
  );
  const state = await page.evaluate(async () => {
    const { deckStore, trainingStore } = await import("/src/stores/index.ts");
    const { editDeckStore } = await import("/src/ui/BuildDeck/store.ts");
    const { editingDeckToIDeck } = await import("/src/ui/BuildDeck/utils.ts");
    const stored = await new Promise((resolve, reject) => {
      const request = indexedDB.open("decks");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const get = db.transaction("decks").objectStore("decks").getAll();
        get.onsuccess = () => {
          db.close();
          resolve(get.result);
        };
        get.onerror = () => {
          db.close();
          reject(get.error);
        };
      };
    });
    return {
      decks: JSON.parse(JSON.stringify(deckStore.decks)),
      selected: deckStore.selectedDeckName,
      stored,
      editing: editingDeckToIDeck(editDeckStore),
      edited: editDeckStore.edited,
      training: !!trainingStore.session,
    };
  });
  expect(state).toEqual({
    decks: [savedDeck],
    selected: savedDeck.deckName,
    stored: [savedDeck],
    editing: currentDeck,
    edited: true,
    training: false,
  });
}

test("submits the current card order after dragging without saving the deck", async ({
  page,
}) => {
  const sessions = await mockServer(page);
  await setupEditor(page);
  const mainCards = page.locator(
    '[data-deck-zone="main"] [data-testid="deck-card"]',
  );
  const target = await mainCards.first().boundingBox();
  await mainCards.nth(1).dragTo(mainCards.first(), {
    targetPosition: { x: 2, y: target!.height / 2 },
  });
  await expect(mainCards.first()).toHaveAttribute("data-card-code", "1000001");
  await connectTraining(page);
  await expect.poll(() => sent(sessions[0], CTOS_HS_READY).length).toBe(1);
  expect(submittedDeck(sessions[0])).toEqual([
    currentDeck.main.length + currentDeck.extra.length,
    currentDeck.side.length,
    1000001,
    1000003,
    ...currentDeck.main.slice(2),
    ...currentDeck.extra,
    ...currentDeck.side,
  ]);
  expect(password(sessions[0])).toBe("AI,SS,NC,NS,ST5#梦前菜菜");
  expect(
    await page.evaluate(async () => {
      const { deckStore } = await import("/src/stores/index.ts");
      return JSON.parse(JSON.stringify(deckStore.decks));
    }),
  ).toEqual([savedDeck]);
});

test("trains with six starting cards, goes first, restarts with the same settings and restores the editor", async ({
  page,
}, info) => {
  const sessions = await mockServer(page);
  await setupEditor(page);
  await page.screenshot({ path: info.outputPath("training-editor.png") });
  await openTraining(page);
  await expect(page.getByTestId("training-hand-size")).toHaveValue("5");
  await page.getByTestId("training-hand-size").fill("6");
  await expect(page.getByRole("dialog", { name: "训练设置" })).toHaveCSS(
    "opacity",
    "1",
  );
  await page.screenshot({
    path: info.outputPath("training-settings.png"),
    animations: "disabled",
  });
  await page.locator("#training-start").click();
  await expect(page.getByTestId("training-waitroom")).toBeVisible();
  await expect(page.getByTestId("training-waitroom")).toContainText(
    "起手 6 张",
  );
  await expect(page.getByTestId("waitroom-ready-toggle")).toHaveCount(0);
  await expect(page.getByTestId("waitroom-deck-select")).toHaveCount(0);
  await expect.poll(() => sent(sessions[0], CTOS_HS_READY).length).toBe(1);
  expect(password(sessions[0])).toBe("AI,SS,NC,NS,ST6#梦前菜菜");
  expect(submittedDeck(sessions[0])).toEqual([
    currentDeck.main.length + currentDeck.extra.length,
    currentDeck.side.length,
    ...currentDeck.main,
    ...currentDeck.extra,
    ...currentDeck.side,
  ]);
  expect(sent(sessions[0], CTOS_UPDATE_DECK)).toHaveLength(1);
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  expect([...sent(sessions[0], CTOS_HAND_RESULT)[0].subarray(3)]).toEqual([2]);
  expect([...sent(sessions[0], CTOS_TP_RESULT)[0].subarray(3)]).toEqual([1]);
  await page.screenshot({ path: info.outputPath("training-duel.png") });
  await page.getByTestId("training-restart").click();
  await expect(page.getByTestId("training-waitroom")).toBeVisible();
  await expect.poll(() => sessions.length).toBe(2);
  await expect.poll(() => sessions[0].closed).toBe(true);
  expect(password(sessions[1])).toBe("AI,SS,NC,NS,ST6#梦前菜菜");
  expect(submittedDeck(sessions[1])).toEqual(submittedDeck(sessions[0]));
  sessions[1].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  await page.getByTestId("training-return-editor").click();
  await page.getByTestId("training-exit-discard").click();
  await assertEditorPreserved(page);
  await expect.poll(() => sessions[1].closed).toBe(true);
  await openTraining(page);
  await expect(page.getByTestId("training-hand-size")).toHaveValue("6");
});

test("training exit can resume or save the server replay before returning to the editor", async ({
  page,
}, info) => {
  const sessions = await mockServer(page);
  await setupEditor(page);
  await connectTraining(page);
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  await page.getByTestId("training-return-editor").click();
  const dialog = page.getByRole("dialog", { name: "退出训练", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "继续训练", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(sessions[0].closed).toBe(false);
  expect(sent(sessions[0], CTOS_SURRENDER)).toHaveLength(0);

  await page.getByTestId("training-return-editor").click();
  const downloadEvent = page.waitForEvent("download");
  const save = page.getByTestId("training-exit-save");
  await save.click();
  await expect.poll(() => sent(sessions[0], CTOS_SURRENDER).length).toBe(1);
  await expect(save).toHaveClass(/loading/);
  // 结束消息先到，完整录像稍后到：必须保持连接和保存弹窗。
  sessions[0].socket.send(
    Buffer.concat([
      packet(STOC_GAME_MSG, [MSG_WIN, 1, 0]),
      packet(STOC_DUEL_END),
    ]),
  );
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const { matStore } = await import("/src/stores/index.ts");
        return matStore.duelEnd;
      }),
    )
    .toBe(true);
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId("duel-end-modal")).not.toBeVisible();
  expect(sessions[0].closed).toBe(false);

  const decks = [
    { name: "Test", main: currentDeck.main, extra: currentDeck.extra },
    { name: "Rainbow", main: Array(40).fill(1000001), extra: [1000002] },
  ];
  sessions[0].socket.send(
    packet(STOC_REPLAY, serverReplayPayload(true, decks)),
  );
  const download = await downloadEvent;
  await download.saveAs(info.outputPath("training.neos.yrp3d"));
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const bytes = [...Buffer.concat(chunks)];
  const saved = await page.evaluate(async (bytes) => {
    const { parseYrp3dRecords } = await import("/src/api/ocgcore/replay.ts");
    const { extractReplayDecks } = await import(
      "/src/api/ocgcore/replayDecks.ts"
    );
    const data = Uint8Array.from(bytes).buffer;
    return {
      records: parseYrp3dRecords(data).map((record) => record.func),
      decks: await extractReplayDecks(data),
    };
  }, bytes);
  expect(saved.records).toEqual([MSG_START, MSG_SIBYL_NAME, MSG_WIN, 231]);
  for (let index = 0; index < 2; index++) {
    expect(saved.decks[index]).toMatchObject({
      complete: true,
      player: decks[index].name,
      main: decks[index].main,
      extra: decks[index].extra,
    });
  }
  await assertEditorPreserved(page);
  await expect.poll(() => sessions[0].closed).toBe(true);
  const again = page.waitForEvent("download");
  await page.getByTestId("save-replay").click();
  expect((await again).suggestedFilename()).toBe(download.suggestedFilename());
});

for (const disconnect of [false, true]) {
  test(`training exit saves the recorded game after ${
    disconnect ? "disconnect" : "server replay timeout"
  }`, async ({ page }) => {
    const sessions = await mockServer(page);
    await setupEditor(page);
    await connectTraining(page);
    sessions[0].socket.send(packet(STOC_SELECT_HAND));
    await expect(page.getByTestId("training-restart")).toBeVisible();
    await page.getByTestId("training-return-editor").click();
    const downloaded = page.waitForEvent("download", { timeout: 15000 });
    await page.getByTestId("training-exit-save").click();
    await expect.poll(() => sent(sessions[0], CTOS_SURRENDER).length).toBe(1);
    if (disconnect) await sessions[0].socket.close();
    const stream = await (await downloaded).createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    expect(bytes[0]).toBe(MSG_START);
    expect(bytes.length).toBeGreaterThan(5);
    await expect(
      page.getByText("服务器尚未提供完整卡组，已保存训练过程录像"),
    ).toBeVisible();
    await assertEditorPreserved(page);
  });
}

test("supports going second and shuffling, and remembers the settings", async ({
  page,
}) => {
  const sessions = await mockServer(page, { noShuffle: false });
  await setupEditor(page);
  await openTraining(page);
  await page.getByTestId("training-second").check();
  await page.getByTestId("training-no-shuffle").uncheck();
  await page.getByTestId("training-hand-size").fill("3");
  await page.locator("#training-start").click();
  await expect(page.getByTestId("training-waitroom")).toBeVisible();
  expect(password(sessions[0])).toBe("AI,SS,NC,ST3#梦前菜菜");
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  expect([...sent(sessions[0], CTOS_TP_RESULT)[0].subarray(3)]).toEqual([0]);
  await page.getByTestId("training-return-editor").click();
  await expect(
    page.getByRole("dialog", { name: "退出训练", exact: true }),
  ).toBeVisible();
  await page.getByTestId("training-exit-discard").click();
  await expect.poll(() => sessions[0].closed).toBe(true);
  await assertEditorPreserved(page);
  await page.getByTestId("deck-start-training").click();
  await expect(page.getByTestId("training-second")).toBeChecked();
  await expect(page.getByTestId("training-no-shuffle")).not.toBeChecked();
  await expect(page.getByTestId("training-hand-size")).toHaveValue("3");
});

for (const handSize of [1, 9]) {
  test(`sends ${handSize} starting cards without truncating the AI name`, async ({
    page,
  }) => {
    const sessions = await mockServer(page);
    await setupEditor(page);
    await openTraining(page);
    await page.getByTestId("training-hand-size").fill(String(handSize));
    await page.locator("#training-start").click();
    await expect(page.getByTestId("training-waitroom")).toContainText(
      `起手 ${handSize} 张`,
    );
    expect(password(sessions[0])).toBe(`AI,SS,NC,NS,ST${handSize}#梦前菜菜`);
    expect(password(sessions[0])).toHaveLength(20);
    await expect.poll(() => sent(sessions[0], CTOS_HS_READY).length).toBe(1);
  });
}

test("rejects an empty hand size and drawing more cards than the main deck", async ({
  page,
}) => {
  const sessions = await mockServer(page);
  await setupEditor(page);
  await openTraining(page);
  await page.getByTestId("training-hand-size").fill("");
  await page.locator("#training-start").click();
  await expect(
    page.getByText("请输入 1–9 的整数", { exact: true }),
  ).toBeVisible();
  expect(sessions).toHaveLength(0);
  await page.evaluate(async () => {
    const { editDeckStore } = await import("/src/ui/BuildDeck/store.ts");
    editDeckStore.main = editDeckStore.main.slice(0, 2);
  });
  await page.getByTestId("training-hand-size").fill("3");
  await page.locator("#training-start").click();
  await expect(
    page.getByText("起手手牌数量不能超过主卡组的卡片数量", { exact: true }),
  ).toBeVisible();
  expect(sessions).toHaveLength(0);
  await expect(page.getByRole("dialog", { name: "训练设置" })).toBeVisible();
});

test("uses five cards for missing or invalid stored hand sizes", async ({
  page,
}) => {
  await setupEditor(page);
  const defaults = await page.evaluate(async () => {
    const { readTrainingOptions } = await import("/src/ui/Training/util.ts");
    const key = "neos.training.options";
    const original = localStorage.getItem(key);
    try {
      return [undefined, null, "6", 0, -1, 10, 4.5].map((handSize) => {
        localStorage.setItem(key, JSON.stringify({ handSize }));
        return readTrainingOptions().handSize;
      });
    } finally {
      if (original === null) localStorage.removeItem(key);
      else localStorage.setItem(key, original);
    }
  });
  expect(defaults).toEqual(Array(7).fill(5));
});

for (const [rules, error] of [
  [{ noShuffle: false }, "没有启用开局不洗牌"],
  [{ noCheck: false }, "没有关闭卡组检查"],
  [{ mode: 1 }, "没有使用单局训练规则"],
  [{ handSize: 4 }, "未采用设置的起手手牌数量"],
] as const) {
  test(`rejects unsupported server rules: ${error}`, async ({ page }) => {
    const sessions = await mockServer(page, rules);
    await setupEditor(page);
    await openTraining(page);
    await page.locator("#training-start").click();
    await expect(page.getByTestId("connection-status")).toContainText(error);
    expect(sent(sessions[0], CTOS_HS_READY)).toHaveLength(0);
    expect(sent(sessions[0], CTOS_UPDATE_DECK)).toHaveLength(0);
    await page
      .getByTestId("connection-status")
      .getByRole("button", { name: "返回编辑器" })
      .click();
    await assertEditorPreserved(page);
  });
}

test("stops when the server starts with the wrong turn order", async ({
  page,
}) => {
  const sessions = await mockServer(page, { startPlayer: 1 });
  await setupEditor(page);
  await connectTraining(page);
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("connection-status")).toContainText(
    "没有按训练设置选择先后攻",
  );
  await expect.poll(() => sessions[0].closed).toBe(true);
  await expect(page.getByTestId("training-restart")).toHaveCount(0);
  await page
    .getByTestId("connection-status")
    .getByRole("button", { name: "返回编辑器" })
    .click();
  await assertEditorPreserved(page);
});

test("cancels an unconfirmed connection without losing edits or entering the room", async ({
  page,
}) => {
  const sessions = await mockServer(page, { confirmRoom: false });
  await setupEditor(page);
  await openTraining(page);
  await page.locator("#training-start").click();
  await expect(page.getByTestId("connection-status")).toHaveAttribute(
    "data-phase",
    "joining",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /取\s*消/ })
    .click();
  await expect.poll(() => sessions[0].closed).toBe(true);
  await expect(page.getByTestId("connection-status")).toHaveCount(0);
  await expect(page.getByTestId("training-waitroom")).toHaveCount(0);
  await assertEditorPreserved(page);
});

test("returns to the editor after finishing or losing the connection", async ({
  page,
}) => {
  const sessions = await mockServer(page);
  await setupEditor(page);
  await connectTraining(page);
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  sessions[0].socket.send(packet(STOC_GAME_MSG, [MSG_WIN, 0, 0]));
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "不保存", exact: true })
    .click();
  await assertEditorPreserved(page);
  await connectTraining(page);
  sessions[1].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  sessions[1].socket.send(packet(STOC_DUEL_END));
  await assertEditorPreserved(page);
  await connectTraining(page);
  sessions[2].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  await sessions[2].socket.close();
  await expect(page.getByTestId("connection-status")).toHaveAttribute(
    "data-phase",
    "disconnected",
  );
  await page
    .getByTestId("connection-status")
    .getByRole("button", { name: "返回编辑器" })
    .click();
  await assertEditorPreserved(page);
});

test("stops when the server rejects a card instead of waiting indefinitely", async ({
  page,
}) => {
  const sessions = await mockServer(page, { deckError: true });
  await setupEditor(page);
  await openTraining(page);
  await page.locator("#training-start").click();
  await expect(page.getByTestId("connection-status")).toContainText(
    "服务器无法识别此卡",
  );
  await expect.poll(() => sessions[0].closed).toBe(true);
  await page
    .getByTestId("connection-status")
    .getByRole("button", { name: "返回编辑器" })
    .click();
  await assertEditorPreserved(page);
});

test("browser back from training closes the session and preserves the editor", async ({
  page,
}) => {
  const sessions = await mockServer(page);
  await setupEditor(page);
  await connectTraining(page);
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("training-restart")).toBeVisible();
  await page.goBack();
  await assertEditorPreserved(page);
  await expect(page.getByTestId("save-replay")).toBeVisible();
  await expect.poll(() => sessions[0].closed).toBe(true);
});

for (const [server, address] of [
  ["Koishi服 (7210)", "wss://koishi.momobako.com:7211/"],
  ["超先行服", "wss://koishi.momobako.com:889/"],
] as const) {
  test(`single-player mode enters ${server} with one click and keeps manual preparation`, async ({
    page,
  }, info) => {
    const sessions = await mockServer(page);
    await setupEditor(page);
    await page.goto("/match");
    await page.getByTestId("match-mode-single-player").click();
    const dialog = page.getByRole("dialog", { name: "单人模式" });
    const servers = dialog.getByTestId("single-player-server");
    await expect(servers).toHaveCount(2);
    await expect(
      dialog.getByRole("button", { name: "Koishi服 (7210)", exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "超先行服", exact: true }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("combobox", { name: "AI 对手" }),
    ).toBeVisible();
    await expect(dialog.getByTestId("single-player-ai-select")).toContainText(
      "随机 AI",
    );
    await expect(dialog.getByTestId("single-player-deck-preview")).toHaveCount(
      0,
    );
    await expect(dialog.getByRole("button", { name: "开始对战" })).toHaveCount(
      0,
    );
    if (server === "Koishi服 (7210)") {
      await expect(dialog).toHaveCSS("opacity", "1");
      await page.screenshot({
        path: info.outputPath("single-player-servers.png"),
        animations: "disabled",
      });
    }
    expect(sessions).toHaveLength(0);
    await expect(page).toHaveURL(/\/match$/);
    await dialog.getByRole("button", { name: server, exact: true }).click();
    await expect(page).toHaveURL(/\/waitroom$/);
    await expect(dialog).toHaveCount(0);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].socket.url()).toBe(address);
    expect(password(sessions[0])).toBe("AI");
    await expect(page.getByTestId("waitroom-deck-select")).toBeVisible();
    await expect(page.getByTestId("waitroom-ready-toggle")).toBeVisible();
    expect(sent(sessions[0], CTOS_HS_READY)).toHaveLength(0);
    sessions[0].socket.send(packet(STOC_SELECT_HAND));
    await expect(
      page.getByText("请猜拳", { exact: true }).first(),
    ).toBeVisible();
    expect(sent(sessions[0], CTOS_HAND_RESULT)).toHaveLength(0);
    sessions[0].socket.send(packet(STOC_SELECT_TP));
    expect(sent(sessions[0], CTOS_TP_RESULT)).toHaveLength(0);
  });
}

for (const server of ["Koishi服 (7210)", "超先行服"]) {
  test(`single-player AI selection previews the chosen deck and joins ${server}`, async ({
    page,
  }, info) => {
    const sessions = await mockServer(page);
    await page.goto("/match");
    await page.getByTestId("match-mode-single-player").click();
    const dialog = page.getByRole("dialog", { name: "单人模式" });
    const select = dialog.getByRole("combobox", { name: "AI 对手" });
    await select.fill("有栖川蓝子");
    await page
      .getByTitle("有栖川蓝子 · 悠悠王 (MokeyMokeyKing)", { exact: true })
      .click();
    const preview = dialog.getByTestId("single-player-deck-preview");
    await expect(preview).toContainText("悠悠王");
    await expect(
      dialog.getByTestId("single-player-deck-main").locator("img"),
    ).toHaveCount(60);
    await expect(
      dialog.getByTestId("single-player-deck-extra").locator("img"),
    ).toHaveCount(15);
    await expect(preview.locator("img").first()).toHaveAttribute(
      "src",
      /\/59546797\.webp$/,
    );
    expect(sessions).toHaveLength(0);
    if (server === "超先行服") {
      await page.setViewportSize({ width: 390, height: 844 });
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
      await expect(
        dialog.getByRole("button", { name: server, exact: true }),
      ).toBeInViewport();
      await page.screenshot({
        path: info.outputPath("single-player-ai-mobile.png"),
        animations: "disabled",
      });
    }
    await dialog.getByRole("button", { name: server, exact: true }).click();
    await expect(page).toHaveURL(/\/waitroom$/);
    expect(password(sessions[0])).toBe("AI#MokeyMokeyKing");
    expect(sent(sessions[0], CTOS_HS_READY)).toHaveLength(0);
  });
}

test("single-player preview switches decks, clears to random, and preserves long AI identifiers", async ({
  page,
}) => {
  const sessions = await mockServer(page);
  await page.goto("/match");
  await page.getByTestId("match-mode-single-player").click();
  const dialog = page.getByRole("dialog", { name: "单人模式" });
  const select = dialog.getByRole("combobox", { name: "AI 对手" });
  await select.fill("Rainbow");
  await page
    .getByTitle("梦前菜菜 · 通常怪兽 (Rainbow)", { exact: true })
    .click();
  await expect(
    dialog.getByTestId("single-player-deck-preview").locator("img").first(),
  ).toHaveAttribute("src", /\/18108166\.webp$/);
  await select.fill("不存在的 AI");
  await expect(
    page.getByText("没有找到对应的 AI 或卡组", { exact: true }),
  ).toBeVisible();
  await select.fill("随机");
  await page.getByTitle("随机 AI", { exact: true }).click();
  await expect(dialog.getByTestId("single-player-deck-preview")).toHaveCount(0);
  await select.fill("光道影依恐龙");
  await page
    .getByTitle("晴海夏佳 · 光道影依恐龙 (LightswornShaddoldinosour)", {
      exact: true,
    })
    .click();
  await expect(dialog.getByTestId("single-player-deck-preview")).toContainText(
    "光道影依恐龙",
  );
  // 所有目录项都必须能用完整密码指定唯一 AI，避免静默截断后变成随机对手。
  const passwords = await page.evaluate(async () => {
    const { aiBots, getAIPassword } = await import("/src/config/aiBots.ts");
    return aiBots.map((bot) => ({
      deck: bot.deck,
      password: getAIPassword(bot),
    }));
  });
  expect(new Set(passwords.map((entry) => entry.password)).size).toBe(
    passwords.length,
  );
  expect(passwords.every((entry) => entry.password.length <= 19)).toBe(true);
  await dialog
    .getByRole("button", { name: "Koishi服 (7210)", exact: true })
    .click();
  await expect(page).toHaveURL(/\/waitroom$/);
  expect(password(sessions[0])).toBe("AI#晴海夏佳");
});

test("single-player server selection can be cancelled before and during connection", async ({
  page,
}) => {
  const sessions = await mockServer(page, { confirmRoom: false });
  await page.goto("/match");
  await page.getByTestId("match-mode-single-player").click();
  const dialog = page.getByRole("dialog", { name: "单人模式" });
  await dialog.locator(".ant-modal-close").click();
  await expect(dialog).not.toBeVisible();
  expect(sessions).toHaveLength(0);
  await page.getByTestId("match-mode-single-player").click();
  await dialog
    .getByRole("button", { name: "Koishi服 (7210)", exact: true })
    .click();
  await expect.poll(() => sessions.length).toBe(1);
  const servers = dialog.getByTestId("single-player-server");
  await expect(servers.first()).toBeDisabled();
  await expect(servers.last()).toBeDisabled();
  await expect(
    dialog.getByRole("combobox", { name: "AI 对手" }),
  ).toBeDisabled();
  await dialog.locator(".ant-modal-close").click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => sessions[0].closed).toBe(true);
  await expect(page).toHaveURL(/\/match$/);
});

for (const ending of ["duel-end", "server-close", "open-connection"] as const) {
  test(`single-player discard exits without a route loading error after ${ending}`, async ({
    page,
  }) => {
    const failures = new Set<string>();
    page.on("pageerror", (error) => failures.add(error.message));
    page.on("console", (message) => {
      if (message.text().includes("页面加载失败")) failures.add(message.text());
    });
    const sessions = await mockServer(page);
    await setupEditor(page);
    await page.goto("/match");
    await connectSinglePlayer(page);
    await expect(page).toHaveURL(/\/waitroom$/);
    const start = Buffer.alloc(18);
    start[0] = MSG_START;
    start.writeInt32LE(8000, 2);
    start.writeInt32LE(8000, 6);
    start.writeInt16LE(40, 10);
    start.writeInt16LE(40, 14);
    sessions[0].socket.send(packet(STOC_GAME_MSG, start));
    await expect(page.getByTestId("duel-toolbar")).toBeVisible();
    sessions[0].socket.send(
      Buffer.concat([
        packet(STOC_GAME_MSG, [MSG_WIN, 0, 0]),
        ...(ending === "duel-end" ? [packet(STOC_DUEL_END)] : []),
      ]),
    );
    await expect(page.getByTestId("duel-end-modal")).toBeVisible();
    if (ending === "server-close") await sessions[0].socket.close();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "不保存", exact: true })
      .click();
    try {
      await expect(page.getByTestId("match-deck-select")).toBeVisible({
        timeout: 5000,
      });
    } finally {
      expect([...failures]).toEqual([]);
    }
    await expect(
      page.getByRole("heading", { name: "页面加载失败" }),
    ).toHaveCount(0);
    await expect(page.getByTestId("duel-player-life")).toHaveCount(0);
    await expect.poll(() => sessions[0].closed).toBe(true);
    if (ending === "open-connection") {
      await connectSinglePlayer(page);
      await expect(page).toHaveURL(/\/waitroom$/);
      await expect(page.getByTestId("waitroom-ready-toggle")).toBeVisible();
      expect(sessions).toHaveLength(2);
    }
  });
}

test("custom single-game discard exits before a delayed server end notification", async ({
  page,
}) => {
  const sessions = await mockServer(page, { mode: 0 });
  await setupEditor(page);
  await page.goto("/match");
  await page.getByTestId("match-mode-custom-room").click();
  await page.getByTestId("match-modal-server").click();
  await page.getByText("超先行服", { exact: true }).click();
  await page.getByTestId("match-modal-player").fill("Test");
  await page.getByTestId("match-modal-password").fill("NC#exit-test");
  await page.getByTestId("match-modal-join").click();
  await expect(page).toHaveURL(/\/waitroom$/);
  const start = Buffer.alloc(18);
  start[0] = MSG_START;
  start.writeInt32LE(8000, 2);
  start.writeInt32LE(8000, 6);
  start.writeInt16LE(40, 10);
  start.writeInt16LE(40, 14);
  sessions[0].socket.send(packet(STOC_GAME_MSG, start));
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  // 超先行服可能在结果后十余秒才发送结束通知，这期间连接仍然可用。
  sessions[0].socket.send(packet(STOC_GAME_MSG, [MSG_WIN, 0, 0]));
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  expect(sessions[0].closed).toBe(false);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "不保存", exact: true })
    .click();
  await expect(page).toHaveURL(/\/match$/, { timeout: 2000 });
  await expect(page.getByTestId("duel-player-life")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "页面加载失败" })).toHaveCount(
    0,
  );
  await expect.poll(() => sessions[0].closed).toBe(true);
});

test("multiplayer results keep the connection available for the next game", async ({
  page,
}) => {
  const sessions = await mockServer(page, { mode: 1 });
  await setupEditor(page);
  await page.goto("/match");
  await page.evaluate(async () => {
    const { connectSrvpro } = await import("/src/ui/Match/util.ts");
    await connectSrvpro({
      ip: "koishi.momobako.com:889",
      player: "Test",
      passWd: "M",
    });
  });
  await expect(page).toHaveURL(/\/waitroom$/);
  const start = Buffer.alloc(18);
  start[0] = MSG_START;
  start.writeInt32LE(8000, 2);
  start.writeInt32LE(8000, 6);
  start.writeInt16LE(40, 10);
  start.writeInt16LE(40, 14);
  sessions[0].socket.send(packet(STOC_GAME_MSG, start));
  await expect(page.getByTestId("duel-toolbar")).toBeVisible();
  const cardCount = await page.getByTestId("duel-card").count();
  sessions[0].socket.send(packet(STOC_GAME_MSG, [MSG_WIN, 0, 0]));
  await expect(page.getByTestId("duel-end-modal")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "不保存", exact: true })
    .click();
  // 等待下一局或换副卡组时保留结算场地，不能提前显示生命值 -1 的空场。
  await expect(
    page.locator('[data-testid="duel-player-life"][data-player="me"]'),
  ).toHaveAttribute("data-life", "8000");
  // 第二局使用不同的起始生命值，确认已收到新消息，而非停留在上一局画面。
  start.writeInt32LE(6000, 2);
  sessions[0].socket.send(packet(STOC_GAME_MSG, start));
  await expect(
    page.locator('[data-testid="duel-player-life"][data-player="me"]'),
  ).toHaveAttribute("data-life", "6000");
  await expect(page.getByTestId("duel-card")).toHaveCount(cardCount);
  await expect(page).toHaveURL(/\/duel$/);
  expect(sessions[0].closed).toBe(false);
});

test("stops when the server ignores the fixed AI hand instead of repeating tied rounds", async ({
  page,
}) => {
  const sessions = await mockServer(page, { opponentHand: 2 });
  await setupEditor(page);
  await connectTraining(page);
  sessions[0].socket.send(packet(STOC_SELECT_HAND));
  await expect(page.getByTestId("connection-status")).toContainText(
    "没有按训练规则固定猜拳",
  );
  expect(sent(sessions[0], CTOS_TP_RESULT)).toHaveLength(0);
  await expect.poll(() => sessions[0].closed).toBe(true);
  await page
    .getByTestId("connection-status")
    .getByRole("button", { name: "返回编辑器" })
    .click();
  await assertEditorPreserved(page);
});
