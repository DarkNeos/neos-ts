import assert from "node:assert/strict";
import { test } from "node:test";

import type { MdproDeck, MdproResp } from "../../src/api/mdproDeck/schema.ts";
import {
  PersonalCloudDecks,
  type CloudDeckRecord,
  type PersonalCloudDeckDependencies,
} from "../../src/stores/personalCloudDecks.ts";

const account = { id: 1, token: "test-token", username: "tester" };
const ydk = "#custom metadata\n#main\n100\n#extra\n200\n!side\n300\n";
const record = (id = "one", owner = 1): MdproDeck => ({
  deckId: id,
  deckName: id,
  userId: owner,
  deckContributor: "tester",
  deckCase: 3,
  deckProtector: 5,
  deckCoverCard1: 100,
  deckCoverCard2: 200,
  deckCoverCard3: 300,
  deckType: "saved group",
  deckYdk: ydk,
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup() {
  const cache = new Map<number, CloudDeckRecord[]>();
  const dependencies: PersonalCloudDeckDependencies = {
    list: async (owner) => ({
      code: 0,
      message: "",
      data: [record("one", owner.id)],
    }),
    detail: async (_owner, id) => ({ code: 0, message: "", data: record(id) }),
    save: async () => ({ code: 0, message: "", data: "true" }),
    delete: async () => ({ code: 0, message: "", data: 1 }),
    cache: {
      read: async (id) => cache.get(id),
      update: async (id, change) => {
        cache.set(id, change(cache.get(id) ?? []));
      },
    },
  };
  return { cloud: new PersonalCloudDecks(dependencies), dependencies, cache };
}

test("both entrances share the account load and concurrent refresh", async () => {
  const { cloud, dependencies } = setup();
  const response = deferred<MdproResp<MdproDeck[]>>();
  let calls = 0;
  dependencies.list = () => {
    calls++;
    return response.promise;
  };
  const loading = cloud.setAccount(account);
  const secondEntrance = cloud.refresh(account);
  assert.equal(cloud.setAccount(account), loading);
  response.resolve({ code: 0, message: "", data: [record()] });
  await Promise.all([loading, secondEntrance]);
  assert.equal(calls, 1);
  assert.equal(cloud.state.decks.length, 1);
});

test("late account responses cannot replace another account's records", async () => {
  const { cloud, dependencies } = setup();
  const response = deferred<MdproResp<MdproDeck[]>>();
  dependencies.list = async (owner) =>
    owner.id === 1
      ? response.promise
      : { code: 0, message: "", data: [record("second", 2)] };
  const first = cloud.setAccount(account);
  await Promise.resolve();
  await Promise.resolve();
  await cloud.setAccount({ ...account, id: 2 });
  response.resolve({ code: 0, message: "", data: [record()] });
  await first;
  assert.equal(cloud.state.accountId, 2);
  assert.equal(cloud.state.decks[0].deckId, "second");
  assert.equal(cloud.state.loading, false);
  await assert.rejects(cloud.refresh(account), /账号已切换/);
});

test("cached content survives a refresh failure and is scoped to its account", async () => {
  const { cloud, dependencies, cache } = setup();
  cache.set(1, [
    {
      ...record(),
      content: { deckName: "one", main: [100], extra: [], side: [] },
    },
  ]);
  dependencies.list = async () => {
    throw new Error("offline");
  };
  await assert.rejects(cloud.setAccount(account), /offline/);
  assert.equal((await cloud.resolve("one")).main[0], 100);
  assert.equal(cloud.state.loading, false);
  assert.equal(cloud.state.restoring, false);
  await assert.rejects(cloud.setAccount({ ...account, id: 2 }), /offline/);
  assert.equal(cloud.state.decks.length, 0);
});

test("detail loads coalesce and save preserves remote metadata and raw YDK", async () => {
  const { cloud, dependencies } = setup();
  dependencies.list = async () => ({
    code: 0,
    message: "",
    data: [{ ...record(), deckYdk: undefined }],
  });
  const detail = deferred<MdproResp<MdproDeck>>();
  let calls = 0;
  dependencies.detail = () => {
    calls++;
    return detail.promise;
  };
  await cloud.setAccount(account);
  const first = cloud.resolve("one");
  assert.equal(cloud.resolve("one"), first);
  detail.resolve({ code: 0, message: "", data: record() });
  await first;
  const saved: MdproDeck[] = [];
  dependencies.save = async (_owner, deck) => {
    saved.push(deck);
    return { code: 0, message: "", data: "true" };
  };
  await cloud.save("one", {
    deckName: "renamed",
    main: [101],
    extra: [201],
    side: [301],
  });
  assert.equal(calls, 1);
  for (const key of [
    "deckCase",
    "deckProtector",
    "deckCoverCard1",
    "deckCoverCard2",
    "deckCoverCard3",
    "deckType",
  ] as const)
    assert.equal(saved[0][key], record()[key]);
  assert.match(saved[0].deckYdk!, /#custom metadata/);
  assert.equal(saved[0].deckName, "renamed");
  assert.deepEqual((await cloud.resolve("one")).main, [101]);
});

test("the exact save acknowledgement is required and failure preserves the baseline", async () => {
  const { cloud, dependencies } = setup();
  await cloud.setAccount(account);
  dependencies.save = async () => ({ code: 0, message: "", data: "false" });
  await assert.rejects(
    cloud.save("one", { deckName: "new", main: [999], extra: [], side: [] }),
    /未确认保存/,
  );
  assert.equal(cloud.state.decks[0].deckName, "one");
  assert.deepEqual((await cloud.resolve("one")).main, [100]);
});

test("a list started before saving cannot overwrite the saved version", async () => {
  const { cloud, dependencies, cache } = setup();
  await cloud.setAccount(account);
  const response = deferred<MdproResp<MdproDeck[]>>();
  dependencies.list = () => response.promise;
  const reading = cloud.refresh();
  await cloud.save("one", {
    deckName: "new",
    main: [999],
    extra: [],
    side: [],
  });
  response.resolve({ code: 0, message: "", data: [record()] });
  await reading;
  assert.equal(cloud.state.decks[0].deckName, "new");
  assert.equal(cache.get(1)?.[0].deckName, "new");
  assert.equal(cloud.state.loading, false);
});

test("zero processed deletions and rejected requests preserve records and cache", async () => {
  const { cloud, dependencies, cache } = setup();
  await cloud.setAccount(account);
  dependencies.delete = async () => ({ code: 0, message: "", data: 0 });
  await assert.rejects(cloud.delete("one", 1), /未确认删除/);
  dependencies.delete = async () => {
    throw new Error("offline");
  };
  await assert.rejects(cloud.delete("one", 1), /offline/);
  assert.equal(cloud.isDeleted("one"), false);
  assert.equal(cloud.state.decks.length, 1);
  assert.equal(cache.get(1)?.length, 1);
});

test("confirmed deletion coalesces and cached or late lists cannot restore it", async () => {
  const { cloud, dependencies, cache } = setup();
  await cloud.setAccount(account);
  const response = deferred<MdproResp<MdproDeck[]>>();
  dependencies.list = () => response.promise;
  const reading = cloud.refresh();
  const deletion = deferred<MdproResp<number>>();
  let calls = 0;
  dependencies.delete = () => {
    calls++;
    return deletion.promise;
  };
  const first = cloud.delete("one", 1);
  assert.equal(cloud.delete("one", 1), first);
  deletion.resolve({ code: 0, message: "", data: 1 });
  await first;
  response.resolve({ code: 0, message: "", data: [record()] });
  await reading;
  await cloud.refresh();
  assert.equal(calls, 1);
  assert.equal(cloud.isDeleted("one"), true);
  assert.equal(cloud.state.decks.length, 0);
  assert.equal(cache.get(1)?.length, 0);
});

test("deletion completing after switching accounts cleans only the original account", async () => {
  const { cloud, dependencies, cache } = setup();
  await cloud.setAccount(account);
  const response = deferred<MdproResp<number>>();
  dependencies.delete = () => response.promise;
  const deleting = cloud.delete("one", 1);
  await cloud.setAccount({ ...account, id: 2 });
  response.resolve({ code: 0, message: "", data: 1 });
  await deleting;
  assert.equal(cloud.state.decks.length, 1);
  assert.equal(cache.get(1)?.length, 0);
  assert.equal(cache.get(2)?.length, 1);
  await assert.rejects(cloud.delete("one", 1), /账号已切换/);
  await cloud.setAccount(account);
  assert.equal(cloud.state.decks.length, 0);
});

test("different entrances cannot save and delete the same deck concurrently", async () => {
  const { cloud, dependencies } = setup();
  await cloud.setAccount(account);
  const response = deferred<MdproResp<"true" | "false">>();
  dependencies.save = () => response.promise;
  const value = { deckName: "saved", main: [101], extra: [], side: [] };
  const saving = cloud.save("one", value);
  await assert.rejects(cloud.delete("one", 1), /等待保存完成/);
  await assert.rejects(cloud.save("one", value), /等待保存完成/);
  response.resolve({ code: 0, message: "", data: "true" });
  await saving;
  const deletion = deferred<MdproResp<number>>();
  dependencies.delete = () => deletion.promise;
  const deleting = cloud.delete("one", 1);
  await assert.rejects(cloud.save("one", value), /正在删除卡组/);
  deletion.resolve({ code: 0, message: "", data: 1 });
  await deleting;
  assert.equal(cloud.state.decks.length, 0);
});

test("a queued cache write cannot restore a deck after deletion is confirmed", async () => {
  const { cloud, dependencies, cache } = setup();
  await cloud.setAccount(account);
  const release = deferred<void>();
  const started = deferred<void>();
  const update = dependencies.cache.update;
  let first = true;
  dependencies.cache.update = async (id, change) => {
    if (first) {
      first = false;
      started.resolve();
      await release.promise;
    }
    await update(id, change);
  };
  const refreshing = cloud.refresh();
  await started.promise;
  await cloud.delete("one", 1);
  assert.equal(cache.get(1)?.length, 0);
  release.resolve();
  await refreshing;
  assert.equal(cache.get(1)?.length, 0);
});
