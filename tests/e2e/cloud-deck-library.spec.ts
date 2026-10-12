import { expect, type Page, test } from "@playwright/test";
import initSqlJs from "sql.js";

const user = {
  id: 12345,
  token: "cloud-library-test-token",
  username: "cloud-library-user",
  name: "测试用户",
  email: "test@example.test",
  external_id: 12345,
  avatar_url: "",
};
const ydk = "#main\n1000001\n1000002\n#extra\n1000003\n!side\n1000002\n";
const cloud = (id: string, name: string) => ({
  deckId: id,
  deckName: name,
  deckType: "",
  deckContributor: user.username,
  userId: user.id,
  deckCase: 1082012,
  deckProtector: 0,
  deckYdk: ydk,
  isPublic: false,
  deckUpdateDate: 100,
});
const entry = (page: Page, id: string) =>
  page.locator(`[data-entry-id="${id}"]`);
const nameInput = (page: Page) => page.getByPlaceholder("请输入卡组名字");
let database: Buffer;

test.beforeAll(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER, type INTEGER, alias INTEGER DEFAULT 0); CREATE TABLE texts (id INTEGER, name TEXT, desc TEXT);",
  );
  for (const [id, type] of [
    [1000001, 1],
    [1000002, 1],
    [1000003, 0x41],
  ]) {
    db.run("INSERT INTO datas (id, type) VALUES (?, ?)", [id, type]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [id, `测试卡 ${id}`]);
  }
  database = Buffer.from(db.export());
  db.close();
});

async function setup(page: Page) {
  const state = {
    decks: [cloud("alpha", "同名卡组"), cloud("beta", "云端备用卡组")],
    offline: false,
    saveFails: false,
    saveData: "true",
    writes: [] as { path: string; body: any }[],
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route("**/*.cdb", (route) => route.fulfill({ body: database }));
  await page.route("**/*.conf", (route) => route.fulfill({ body: "" }));
  await page.route("**/test-release-v2.json", (route) =>
    route.fulfill({ json: [] }),
  );
  // 个人数据与所有写请求均使用隔离的模拟接口，不修改真实账号。
  await page.route("**/api/mdpro3/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "POST") {
      state.writes.push({ path, body: request.postDataJSON() });
      if (path.endsWith("/sync/single")) {
        if (state.saveFails)
          return route.fulfill({ json: { code: 1, message: "模拟保存失败" } });
        const update = request.postDataJSON().deck;
        if (state.saveData === "true")
          state.decks = state.decks.map((deck) =>
            deck.deckId === update.deckId ? { ...deck, ...update } : deck,
          );
        return route.fulfill({
          json: { code: 0, message: "", data: state.saveData },
        });
      }
      return route.fulfill({
        status: 400,
        json: { code: 1, message: "未授权的测试写请求" },
      });
    }
    if (path.endsWith(`/sync/${user.id}/nodel`)) {
      if (state.offline) return route.abort("failed");
      return route.fulfill({ json: { code: 0, data: state.decks } });
    }
    if (path.endsWith("/sync/54321/nodel"))
      return route.fulfill({
        json: {
          code: 0,
          data: [{ ...cloud("other", "另一账号卡组"), userId: 54321 }],
        },
      });
    if (path.endsWith("/deck/list"))
      return route.fulfill({
        json: { code: 0, data: { records: [], total: 0 } },
      });
    const found = state.decks.find((deck) =>
      path.endsWith(`/deck/${deck.deckId}`),
    );
    return route.fulfill({
      json: { code: 0, data: found },
    });
  });
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (user) => {
    const { initializeApp } = await import("/src/ui/Layout/utils.ts");
    await initializeApp();
    const { accountStore, deckStore } = await import("/src/stores/index.ts");
    const { setCookie, CookieKeys } = await import("/src/api/index.ts");
    await deckStore.reset();
    await deckStore.add({
      deckName: "同名卡组",
      main: [1000002],
      extra: [],
      side: [],
    });
    setCookie(CookieKeys.USER, JSON.stringify(user));
    accountStore.login(user);
    history.pushState({}, "", "/build");
    dispatchEvent(new PopStateEvent("popstate"));
  }, user);
  await expect(entry(page, "cloud:12345:alpha")).toBeVisible();
  await expect(nameInput(page)).toBeVisible();
  return state;
}

for (const id of ["local:同名卡组", "cloud:12345:alpha"]) {
  test(`Chinese IME can rename a deck without interrupting composition (${id})`, async ({
    page,
  }) => {
    await setup(page);
    await entry(page, id)
      .getByRole("button", { name: "同名卡组", exact: true })
      .click();
    const input = nameInput(page);
    await input.fill("");
    const session = await page.context().newCDPSession(page);
    // 使用浏览器原生组合输入，直接 fill 中文无法复现候选词被重置的问题。
    for (const text of ["huo", "huoshan", "火山"]) {
      await session.send("Input.imeSetComposition", {
        text,
        selectionStart: text.length,
        selectionEnd: text.length,
      });
      await expect(input).toHaveValue(text, { timeout: 1_000 });
      await expect(input).toBeFocused();
    }
    await session.send("Input.insertText", { text: "火山" });
    await session.detach();
    await expect(input).toHaveValue("火山");
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const { editDeckStore } = await import("/src/ui/BuildDeck/store.ts");
          return { name: editDeckStore.deckName, edited: editDeckStore.edited };
        }),
      )
      .toEqual({ name: "火山", edited: true });
    await page.getByTestId("deck-save").click();
    await expect(page.getByTestId("deck-save-status")).toHaveText(
      id.startsWith("cloud:") ? "云端卡组 · 已保存" : "本地卡组",
    );
    await page.reload();
    await expect(nameInput(page)).toHaveValue("火山");
  });
}

test("personal decks appear automatically, preserve identity and restore selection, pins and groups offline", async ({
  page,
}) => {
  const state = await setup(page);
  await entry(page, "cloud:12345:beta")
    .getByRole("button", { name: "云端备用卡组", exact: true })
    .click();
  await expect(nameInput(page)).toHaveValue("云端备用卡组");
  await entry(page, "cloud:12345:beta")
    .getByRole("button", { name: "置顶卡组", exact: true })
    .click();
  await expect(
    page
      .getByTestId("deck-library-cloud")
      .getByTestId("deck-library-entry")
      .first(),
  ).toHaveAttribute("data-entry-id", "cloud:12345:beta");
  await page
    .getByTestId("deck-library-local")
    .getByRole("button", { name: /本地卡组/ })
    .click();
  await page.getByRole("textbox", { name: "搜索我的卡组" }).fill("备用");
  state.offline = true;
  await page.reload();
  await expect(nameInput(page)).toHaveValue("云端备用卡组");
  await expect(page.getByRole("textbox", { name: "搜索我的卡组" })).toHaveValue(
    "备用",
  );
  await expect(entry(page, "cloud:12345:beta")).toHaveAttribute(
    "data-selected",
    "true",
  );
  await expect(
    entry(page, "cloud:12345:beta").getByRole("button", {
      name: "取消置顶",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "搜索我的卡组" }).fill("");
  await expect(
    page
      .getByTestId("deck-library-local")
      .getByRole("button", { name: /本地卡组/ }),
  ).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByTestId("deck-library-cloud")).toContainText(
    "当前显示缓存",
  );
  expect(
    await page.evaluate(async () =>
      (await import("/src/stores/index.ts")).deckStore.decks.map(
        (deck) => deck.deckName,
      ),
    ),
  ).toEqual(["同名卡组"]);
});

test("a cloud deck is directly selectable in match and room and sends its exact cards without importing a copy", async ({
  page,
}) => {
  const state = await setup(page);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await expect(entry(page, "cloud:12345:alpha")).toHaveAttribute(
    "data-selected",
    "true",
  );
  await page.goto("/match");
  await expect(page.getByTestId("match-deck-select")).toContainText("同名卡组");
  await page.getByTestId("match-deck-select").click();
  await expect(
    page.getByTestId("match-deck-select").getByRole("combobox"),
  ).toHaveJSProperty("readOnly", true);
  await page.getByTitle("云端备用卡组", { exact: true }).click();
  await expect(page.getByTestId("match-deck-select")).toContainText(
    "云端备用卡组",
  );
  await page.evaluate(async () => {
    const { initUIContainer } = await import("/src/container/compat.ts");
    const { roomStore, ygopro } = {
      ...(await import("/src/stores/index.ts")),
      ...(await import("/src/api/index.ts")),
    };
    window.__cloudDeckPackets = [];
    initUIContainer({
      isClosed: () => false,
      close: () => {},
      ws: {
        readyState: WebSocket.OPEN,
        send: (data: Uint8Array) => window.__cloudDeckPackets.push([...data]),
      },
    });
    roomStore.selfType = ygopro.StocTypeChange.SelfType.PLAYER1;
    roomStore.players = [
      {
        name: "测试用户",
        isMe: true,
        state: ygopro.StocHsPlayerChange.State.NO_READY,
      },
    ];
    history.pushState({}, "", "/waitroom");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("waitroom-deck-select")).toContainText(
    "云端备用卡组",
  );
  await expect
    .poll(() => page.evaluate(() => window.__cloudDeckPackets.length))
    .toBeGreaterThan(0);
  const bytes = await page.evaluate(() =>
    window.__cloudDeckPackets.find((packet: number[]) => packet[2] === 2),
  );
  const data = Buffer.from(bytes);
  expect(
    Array.from({ length: (data.length - 3) / 4 }, (_, i) =>
      data.readUInt32LE(3 + i * 4),
    ),
  ).toEqual([3, 1, 1000001, 1000002, 1000003, 1000002]);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem("side_deck")!)),
  ).toMatchObject({
    deckName: "云端备用卡组",
    main: [1000001, 1000002],
    extra: [1000003],
    side: [1000002],
  });
  expect(
    await page.evaluate(
      async () => (await import("/src/stores/index.ts")).deckStore.decks.length,
    ),
  ).toBe(1);
  // 已准备时刷新只更新卡组库，不改动已提交的对战卡组或换副缓存。
  await page.evaluate(async () => {
    const { roomStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    roomStore.getMePlayer().state = ygopro.StocHsPlayerChange.State.READY;
    window.__cloudDeckPackets = [];
  });
  state.decks[1].deckYdk = "#main\n1000002\n1000002\n1000001\n#extra\n!side\n";
  await page.getByTestId("waitroom-deck-select").click();
  await expect(
    page.getByTestId("waitroom-deck-select").getByRole("combobox"),
  ).toHaveJSProperty("readOnly", true);
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          (await import("/src/stores/deckLibraryStore.ts")).deckLibraryStore
            .selectedDeck.main.length,
      ),
    )
    .toBe(3);
  expect(await page.evaluate(() => window.__cloudDeckPackets)).toEqual([]);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("side_deck")!).main,
    ),
  ).toEqual([1000001, 1000002]);
  await page.evaluate(async () => {
    const { roomStore } = await import("/src/stores/index.ts");
    const { ygopro } = await import("/src/api/index.ts");
    roomStore.getMePlayer().state = ygopro.StocHsPlayerChange.State.NO_READY;
  });
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("side_deck")!).main),
    )
    .toEqual([1000002, 1000002, 1000001]);
});

test("background refresh and failed cloud saves preserve edits, retry updates the same private deck", async ({
  page,
}) => {
  const state = await setup(page);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await nameInput(page).fill("云端修改稿");
  state.decks[0].deckName = "其他设备的名称";
  state.decks[0].deckUpdateDate = 200;
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect(entry(page, "cloud:12345:alpha")).toContainText(
    "其他设备的名称",
  );
  await expect(nameInput(page)).toHaveValue("云端修改稿");
  state.saveFails = true;
  await page.getByTestId("deck-save").click();
  await expect(page.getByTestId("deck-save-status")).toContainText(
    "修改已保留",
  );
  await expect(nameInput(page)).toHaveValue("云端修改稿");
  state.saveFails = false;
  await page.getByTestId("deck-save").click();
  await expect(page.getByTestId("deck-save-status")).toContainText("已保存");
  await expect(entry(page, "cloud:12345:alpha")).toContainText("云端修改稿");
  expect(state.writes).toHaveLength(2);
  expect(
    state.writes.every(
      (write) =>
        write.path.endsWith("/sync/single") &&
        write.body.deck.deckId === "alpha",
    ),
  ).toBe(true);
  expect(state.decks[0].isPublic).toBe(false);
  await page.reload();
  await expect(nameInput(page)).toHaveValue("云端修改稿");
});

test("cloud saves accept string true and preserve drafts for string false or unknown results", async ({
  page,
}) => {
  const state = await setup(page);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await nameInput(page).fill("云端修改稿");
  for (const data of ["false", "unexpected"]) {
    state.saveData = data;
    await page.getByTestId("deck-save").click();
    await expect(page.getByTestId("deck-save-status")).toContainText(
      "修改已保留",
    );
    await expect(nameInput(page)).toHaveValue("云端修改稿");
    await expect(entry(page, "cloud:12345:alpha")).toContainText("同名卡组");
  }
  // 复现线上响应 { code: 0, message: "", data: "true" }。
  state.saveData = "true";
  await page.getByTestId("deck-save").click();
  await expect(page.getByTestId("deck-save-status")).toContainText("已保存");
  await expect(entry(page, "cloud:12345:alpha")).toContainText("云端修改稿");
  expect(state.writes).toHaveLength(3);
  await page.reload();
  await expect(nameInput(page)).toHaveValue("云端修改稿");
});

for (const stage of ["id", "save", "public"] as const) {
  test(`publishing a local deck reports a failure at the ${stage} step`, async ({
    page,
  }) => {
    await setup(page);
    let saves = 0;
    let publications = 0;
    await page.route("**/deck/deckId", (route) =>
      route.fulfill({
        json: {
          code: 0,
          message: "",
          data: stage === "id" ? undefined : "new-deck",
        },
      }),
    );
    await page.route("**/sync/single", (route) => {
      saves++;
      return route.fulfill({
        json: {
          code: 0,
          message: "",
          data: stage === "save" ? "false" : "true",
        },
      });
    });
    await page.route("**/deck/public", (route) => {
      publications++;
      return route.fulfill({ json: { code: 0, message: "false" } });
    });
    await entry(page, "local:同名卡组")
      .getByRole("button", { name: "卡组操作", exact: true })
      .click();
    await page.getByRole("menuitem", { name: /发布为公开云卡组$/ }).click();
    const message =
      stage === "id"
        ? "云端未返回卡组 ID，请重试"
        : stage === "save"
        ? "云端未确认上传，请重试"
        : "卡组已保存到云端，但公开状态未更新，请稍后重试";
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByText(/上传在线卡组.*成功/)).toHaveCount(0);
    expect(saves).toBe(stage === "id" ? 0 : 1);
    expect(publications).toBe(stage === "public" ? 1 : 0);
  });
}

for (const summaryOnly of [false, true]) {
  test(`cloud saves preserve group and YDK metadata from ${
    summaryOnly ? "details" : "the personal list"
  }`, async ({ page }) => {
    const state = await setup(page);
    const metadata =
      "#pickup\n#1000001\n#0\n#0\n#case\n#1082012\n#protector\n#1070008\n#field\n#1090009\n#grave\n#1100009\n#stand\n#1110001\n#mate\n#1000007\n##alpha\n###12345";
    state.decks[0] = {
      ...state.decks[0],
      deckType: "测试分组",
      deckProtector: 1070008,
      deckYdk: `${ydk}${metadata}`,
    };
    if (summaryOnly)
      await page.route("**/sync/12345/nodel", (route) =>
        route.fulfill({
          json: {
            code: 0,
            data: state.decks.map(
              ({ deckYdk: _ydk, deckType: _type, ...deck }) => deck,
            ),
          },
        }),
      );
    await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
    await entry(page, "cloud:12345:alpha")
      .getByRole("button", { name: "同名卡组", exact: true })
      .click();
    for (const name of ["元信息保留一", "元信息保留二"]) {
      await nameInput(page).fill(name);
      await page.getByTestId("deck-save").click();
      await expect(page.getByTestId("deck-save-status")).toContainText(
        "已保存",
      );
      const saved = state.writes.at(-1)!.body.deck;
      expect(saved).toMatchObject({
        deckType: "测试分组",
        deckProtector: 1070008,
      });
      expect(saved.deckYdk).toContain(metadata);
      expect(saved.deckYdk.match(/#field/g)).toHaveLength(1);
      await page.reload();
      await expect(nameInput(page)).toHaveValue(name);
    }
  });
}

test("cloud saves and refreshes show the server's HTTP error while preserving the draft", async ({
  page,
}) => {
  await setup(page);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await nameInput(page).fill("待保存草稿");
  const failure = {
    status: 401,
    json: { code: 401, message: "登录已过期，请重新登录" },
  };
  await page.route("**/sync/single", (route) => route.fulfill(failure));
  await page.getByTestId("deck-save").click();
  await expect(page.getByTestId("deck-save-status")).toContainText(
    failure.json.message,
  );
  await page.route("**/sync/12345/nodel", (route) => route.fulfill(failure));
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect(page.getByTestId("deck-library-cloud")).toContainText(
    failure.json.message,
  );
  await expect(nameInput(page)).toHaveValue("待保存草稿");
});

test("saving a local copy avoids same-name overwrite and unsaved switches require an explicit choice", async ({
  page,
}) => {
  await setup(page);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await page.getByRole("button", { name: "另存为本地", exact: true }).click();
  await expect(entry(page, "local:同名卡组 (2)")).toHaveAttribute(
    "data-selected",
    "true",
  );
  const decks = await page.evaluate(async () =>
    JSON.parse(
      JSON.stringify((await import("/src/stores/index.ts")).deckStore.decks),
    ),
  );
  expect(decks.find((deck) => deck.deckName === "同名卡组").main).toEqual([
    1000002,
  ]);
  expect(decks.find((deck) => deck.deckName === "同名卡组 (2)").main).toEqual([
    1000001, 1000002,
  ]);
  await nameInput(page).fill("未保存草稿");
  await entry(page, "cloud:12345:beta")
    .getByRole("button", { name: "云端备用卡组", exact: true })
    .click();
  await page.getByRole("button", { name: "继续编辑", exact: true }).click();
  await expect(nameInput(page)).toHaveValue("未保存草稿");
  await entry(page, "cloud:12345:beta")
    .getByRole("button", { name: "云端备用卡组", exact: true })
    .click();
  await page
    .getByRole("button", { name: "放弃修改并切换", exact: true })
    .click();
  await expect(nameInput(page)).toHaveValue("云端备用卡组");
  await nameInput(page).fill("等待重置的草稿名");
  await page
    .getByTestId("deck-editor-header")
    .getByRole("button", { name: "重置", exact: true })
    .click();
  await expect(nameInput(page)).toHaveValue("云端备用卡组");
  await expect(page.getByTestId("deck-save-status")).toHaveText(
    "云端卡组 · 已保存",
  );
});

test("renaming and deleting a dirty local draft update its identity without an extra discard prompt", async ({
  page,
}) => {
  await setup(page);
  await entry(page, "local:同名卡组")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await nameInput(page).fill("本地新名称");
  await page.getByTestId("deck-save").click();
  await expect(entry(page, "local:本地新名称")).toHaveAttribute(
    "data-selected",
    "true",
  );
  await expect(page.getByTestId("deck-save-status")).toHaveText("本地卡组");
  await nameInput(page).fill("删除前未保存修改");
  await entry(page, "local:本地新名称")
    .getByRole("button", { name: "卡组操作", exact: true })
    .click();
  await page.getByRole("menuitem", { name: /删除本地卡组$/ }).click();
  await expect(entry(page, "local:本地新名称")).toHaveCount(0);
  await expect(nameInput(page)).toHaveValue("");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a sidebar deletion also removes the online result and active dirty cloud draft", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/sync/multi", (route) =>
    route.fulfill({ json: { code: 0, message: "", data: 1 } }),
  );
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  await nameInput(page).fill("未保存云端草稿");
  await page.getByRole("button", { name: /MDPro在线卡组/ }).click();
  await page.getByTestId("mdpro-deck-scope").click();
  await page.getByText("只显示我上传的卡组", { exact: true }).click();
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(2);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "卡组操作", exact: true })
    .click();
  await page.getByRole("menuitem", { name: /删除云卡组$/ }).click();
  await page.getByRole("button", { name: "删除云端卡组", exact: true }).click();
  await expect(entry(page, "cloud:12345:alpha")).toHaveCount(0);
  await expect(page.locator('[data-deck-id="alpha"]')).toHaveCount(0);
  await expect(page.getByTestId("mdpro-online-deck")).toHaveCount(1);
  await expect(nameInput(page)).toHaveValue("同名卡组");
});

test("switching accounts isolates cached decks, preferences and in-flight responses", async ({
  page,
}) => {
  await setup(page);
  await entry(page, "cloud:12345:alpha")
    .getByRole("button", { name: "同名卡组", exact: true })
    .click();
  let release!: () => void;
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/sync/12345/nodel", async (route) => {
    await delayed;
    await route.fulfill({
      json: { code: 0, data: [cloud("late", "旧账号迟到的数据")] },
    });
  });
  const requested = page.waitForRequest("**/sync/12345/nodel");
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await requested;
  await nameInput(page).fill("原账号未保存草稿");
  // 离开编辑器后切换账号，再返回也不能恢复原账号的私有草稿。
  await page.evaluate(() => {
    history.pushState({}, "", "/match");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByTestId("match-deck-select")).toBeVisible();
  await page.evaluate(async (user) => {
    (await import("/src/stores/index.ts")).accountStore.login({
      ...user,
      id: 54321,
      token: "second-token",
    });
  }, user);
  await page.evaluate(() => {
    history.pushState({}, "", "/build");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(entry(page, "cloud:54321:other")).toBeVisible();
  await expect(nameInput(page)).toHaveValue("同名卡组");
  release();
  await expect(entry(page, "cloud:12345:alpha")).toHaveCount(0);
  await expect(page.getByTestId("deck-library-cloud")).not.toContainText(
    "旧账号迟到的数据",
  );
  await page.evaluate(async () =>
    (await import("/src/stores/index.ts")).accountStore.logout(),
  );
  await expect(entry(page, "cloud:54321:other")).toHaveCount(0);
  await expect(page.getByTestId("deck-library-cloud")).toContainText(
    "登录萌卡",
  );
});

test("summary-only decks fetch and refresh content, retain it on failure and fall back locally after deletion", async ({
  page,
}) => {
  const state = await setup(page);
  // 个人列表有时只包含摘要，内容在选中时读取。
  const summary = cloud("uncached", "新云卡组");
  delete (summary as Partial<typeof summary>).deckYdk;
  state.decks.push(summary);
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  let details = 0;
  let detailYdk = ydk;
  let detailFails = false;
  await page.route("**/deck/uncached", (route) => {
    details++;
    if (detailFails) return route.abort("failed");
    return route.fulfill({
      json: {
        code: 0,
        data: { ...cloud("uncached", "新云卡组"), deckYdk: detailYdk },
      },
    });
  });
  await entry(page, "cloud:12345:uncached")
    .getByRole("button", { name: "新云卡组", exact: true })
    .click();
  await expect(nameInput(page)).toHaveValue("新云卡组");
  expect(details).toBe(1);
  const mainCards = page
    .locator('[data-deck-zone="main"]')
    .getByTestId("deck-card");
  await expect(mainCards).toHaveCount(2);
  detailYdk = "#main\n1000002\n1000001\n1000002\n#extra\n!side\n";
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect.poll(() => details).toBe(2);
  await expect(mainCards).toHaveCount(3);
  expect(details).toBe(2);
  detailFails = true;
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect(page.getByTestId("deck-library-cloud")).toContainText(
    "更新卡组内容失败",
  );
  await expect(mainCards).toHaveCount(3);
  state.decks = state.decks.filter((deck) => deck.deckId !== "uncached");
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect(nameInput(page)).toHaveValue("同名卡组");
  await expect(entry(page, "cloud:12345:uncached")).toHaveCount(0);
});

async function requestCloudDeletion(page: Page, id: string) {
  await entry(page, id)
    .getByRole("button", { name: "卡组操作", exact: true })
    .click();
  await page.getByRole("menuitem", { name: /删除云卡组$/ }).click();
  return page.getByRole("dialog");
}

test("cloud deletion warns about cloud storage, allows cancellation and removes cached selection only after confirmation", async ({
  page,
}) => {
  const state = await setup(page);
  const deleted = entry(page, "cloud:12345:alpha");
  await deleted.getByRole("button", { name: "同名卡组", exact: true }).click();
  await deleted.getByRole("button", { name: "置顶卡组", exact: true }).click();
  await nameInput(page).fill("未保存的云端修改");
  const requests: unknown[] = [];
  await page.route("**/sync/multi", (route) => {
    requests.push(route.request().postDataJSON());
    // 列表继续返回旧数据，检验服务端缓存不能让已删除卡组重新出现。
    return route.fulfill({ json: { code: 0, data: 1 } });
  });
  const dialog = await requestCloudDeletion(page, "cloud:12345:alpha");
  await expect(dialog).toContainText("云端保存");
  await expect(dialog).toContainText("无法撤销");
  await expect(dialog).toContainText("未保存的修改");
  await dialog.getByRole("button", { name: /取\s*消/ }).click();
  expect(requests).toEqual([]);
  await expect(nameInput(page)).toHaveValue("未保存的云端修改");
  await requestCloudDeletion(page, "cloud:12345:alpha");
  await dialog
    .getByRole("button", { name: "删除云端卡组", exact: true })
    .click();
  await expect(deleted).toHaveCount(0);
  await expect(nameInput(page)).toHaveValue("同名卡组");
  await expect(entry(page, "local:同名卡组")).toHaveAttribute(
    "data-selected",
    "true",
  );
  expect(requests).toEqual([
    {
      userId: user.id,
      deckContributor: user.username,
      decks: [{ deckId: "alpha", isDelete: true }],
    },
  ]);
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect(deleted).toHaveCount(0);
  state.offline = true;
  await page.reload();
  await expect(page.getByTestId("deck-library-cloud")).toContainText(
    "当前显示缓存",
  );
  await expect(deleted).toHaveCount(0);
  const preferences = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("neos.deck-library.12345")!),
  );
  expect(preferences.pinned).not.toContain("cloud:12345:alpha");
  expect(preferences.selectedId).not.toBe("cloud:12345:alpha");
});

test("an unconfirmed cloud deletion keeps the deck and draft and allows retrying from the dialog", async ({
  page,
}) => {
  await setup(page);
  const deleted = entry(page, "cloud:12345:alpha");
  await deleted.getByRole("button", { name: "同名卡组", exact: true }).click();
  await nameInput(page).fill("删除失败时保留草稿");
  let attempts = 0;
  await page.route("**/sync/multi", (route) =>
    route.fulfill({ json: { code: 0, data: ++attempts === 1 ? 0 : 1 } }),
  );
  const dialog = await requestCloudDeletion(page, "cloud:12345:alpha");
  await dialog
    .getByRole("button", { name: "删除云端卡组", exact: true })
    .click();
  await expect(
    page.getByText("删除卡组失败，服务器未确认删除，请稍后重试。", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(deleted).toBeVisible();
  await expect(nameInput(page)).toHaveValue("删除失败时保留草稿");
  await dialog
    .getByRole("button", { name: "删除云端卡组", exact: true })
    .click();
  await expect(deleted).toHaveCount(0);
  await expect(dialog).toHaveCount(0);
  expect(attempts).toBe(2);
});

test("confirming deletion after switching accounts sends no request", async ({
  page,
}) => {
  const state = await setup(page);
  const dialog = await requestCloudDeletion(page, "cloud:12345:alpha");
  await page.evaluate(async (user) => {
    (await import("/src/stores/index.ts")).accountStore.login({
      ...user,
      id: 54321,
      token: "second-token",
    });
  }, user);
  await expect(entry(page, "cloud:54321:other")).toBeVisible();
  await dialog
    .getByRole("button", { name: "删除云端卡组", exact: true })
    .click();
  await expect(
    page.getByText("账号或卡组已变化，请重新打开删除确认", { exact: true }),
  ).toBeVisible();
  expect(state.writes).toEqual([]);
  await dialog.getByRole("button", { name: /取\s*消/ }).click();
  await expect(entry(page, "cloud:54321:other")).toBeVisible();
});

test("an offline reload without cached records preserves the selected cloud deck for retry", async ({
  page,
}) => {
  const state = await setup(page);
  await entry(page, "cloud:12345:beta")
    .getByRole("button", { name: "云端备用卡组", exact: true })
    .click();
  await expect(nameInput(page)).toHaveValue("云端备用卡组");
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("personal-cloud-decks");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("decks", "readwrite");
          transaction.objectStore("decks").clear();
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
  state.offline = true;
  await page.reload();
  await expect(page.getByTestId("deck-library-cloud")).toContainText(
    "云卡组请求未完成",
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("neos.deck-library.12345")!).selectedId,
    ),
  ).toBe("cloud:12345:beta");
  state.offline = false;
  await page.getByRole("button", { name: "刷新云卡组", exact: true }).click();
  await expect(nameInput(page)).toHaveValue("云端备用卡组");
  await expect(entry(page, "cloud:12345:beta")).toHaveAttribute(
    "data-selected",
    "true",
  );
});
