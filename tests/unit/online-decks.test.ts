import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OnlineDecks,
  type OnlineDeckTransport,
} from "../../src/stores/onlineDecks.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
const account = { id: 1, token: "test-token", username: "tester" };
const deck = (id: string) => ({
  deckId: id,
  deckName: id,
  deckContributor: "tester",
  deckCase: 1,
  userId: 1,
});
const publicResponse = (id: string) => ({
  code: 0,
  message: "",
  data: { records: [deck(id)], total: 1 },
});
const transport = (
  overrides: Partial<OnlineDeckTransport> = {},
): OnlineDeckTransport => {
  const deleted = new Set<string>();
  return {
    publicList: async () => publicResponse("public"),
    personalList: async () => ({ code: 0, message: "", data: [deck("mine")] }),
    isDeleted: (id, accountId) => deleted.has(`${accountId}:${id}`),
    ...overrides,
    delete: async (owner, id) => {
      await overrides.delete?.(owner, id);
      deleted.add(`${owner.id}:${id}`);
    },
  };
};

test("an older search in the same scope cannot replace the current query", async () => {
  const older = deferred<ReturnType<typeof publicResponse>>();
  const list = new OnlineDecks(
    transport({
      publicList: async (query) =>
        query === "old" ? older.promise : publicResponse("new"),
    }),
  );
  const first = list.search("old");
  await list.search("new");
  older.resolve(publicResponse("old"));
  await first;
  assert.equal(list.state.query, "new");
  assert.equal(list.state.decks[0].deckId, "new");
});

test("an older page cannot replace a newer page", async () => {
  const older = deferred<ReturnType<typeof publicResponse>>();
  const list = new OnlineDecks(
    transport({
      publicList: async (_query, page) =>
        page === 1 ? older.promise : publicResponse("page-2"),
    }),
  );
  const first = list.load();
  await list.setPage(2);
  older.resolve(publicResponse("page-1"));
  await first;
  assert.equal(list.state.page, 2);
  assert.equal(list.state.decks[0].deckId, "page-2");
});

test("switching accounts discards the previous account's pending personal list", async () => {
  const older = deferred<{
    code: number;
    message: string;
    data: ReturnType<typeof deck>[];
  }>();
  const list = new OnlineDecks(
    transport({
      personalList: async (user) =>
        user.id === 1
          ? older.promise
          : { code: 0, message: "", data: [deck("account-2")] },
    }),
  );
  list.setAccount(account);
  const first = list.search("", true);
  await list.setAccount({ ...account, id: 2 });
  older.resolve({ code: 0, message: "", data: [deck("account-1")] });
  await first;
  assert.equal(list.state.decks[0].deckId, "account-2");
});

test("confirmed deletion stays hidden despite cached records and switching scope", async () => {
  const list = new OnlineDecks(
    transport({ publicList: async () => publicResponse("mine") }),
  );
  list.setAccount(account);
  await list.search("", true);
  assert.equal((await list.delete("mine")).ok, true);
  assert.equal(list.state.decks.length, 0);
  await list.search("", false);
  assert.equal(list.state.decks.length, 0);
});

test("concurrent deletion shares one request and failures preserve the record", async () => {
  const pending = deferred<void>();
  let calls = 0;
  const list = new OnlineDecks(
    transport({
      delete: () => {
        calls += 1;
        return pending.promise;
      },
    }),
  );
  list.setAccount(account);
  await list.search("", true);
  const first = list.delete("mine");
  const second = list.delete("mine");
  assert.equal(first, second);
  pending.reject(new Error("未确认删除"));
  assert.equal((await first).ok, false);
  assert.equal(list.state.decks.length, 1);
  assert.equal(calls, 1);
});

test("a rejected personal list ends loading without falling back to public cards", async () => {
  const list = new OnlineDecks(
    transport({
      personalList: async () => {
        throw new Error("offline");
      },
    }),
  );
  list.setAccount(account);
  await list.load();
  await list.search("", true);
  assert.equal(list.state.loaded, true);
  assert.equal(list.state.decks.length, 0);
  assert.equal(
    list.state.error,
    "获取个人卡组列表失败，请检查网络或稍后重试。",
  );
});

test("logging in during a public request does not leave it stuck loading", async () => {
  const pending = deferred<ReturnType<typeof publicResponse>>();
  const list = new OnlineDecks(
    transport({ publicList: () => pending.promise }),
  );
  const loading = list.load();
  list.setAccount(account);
  pending.resolve(publicResponse("public"));
  await loading;
  assert.equal(list.state.loaded, true);
  assert.equal(list.state.decks[0].deckId, "public");
});

test("personal pagination adjusts after deleting the final card on a page", async () => {
  const data = Array.from({ length: 31 }, (_, index) => deck(String(index)));
  const list = new OnlineDecks(
    transport({ personalList: async () => ({ code: 0, message: "", data }) }),
  );
  list.setAccount(account);
  await list.search("", true);
  await list.setPage(2);
  assert.equal(list.state.decks.length, 1);
  await list.delete("30");
  assert.equal(list.state.page, 1);
  assert.equal(list.state.total, 30);
  assert.equal(list.state.decks.length, 30);
});

test("simultaneous loads of the same list share the pending request", async () => {
  const pending = deferred<ReturnType<typeof publicResponse>>();
  let calls = 0;
  const list = new OnlineDecks(
    transport({
      publicList: () => {
        calls += 1;
        return pending.promise;
      },
    }),
  );
  const first = list.load();
  assert.equal(list.load(), first);
  pending.resolve(publicResponse("public"));
  await first;
  assert.equal(calls, 1);
  await list.load();
  assert.equal(calls, 2);
});

test("a changed query or scope returns to the first page", async () => {
  const list = new OnlineDecks(transport());
  list.setAccount(account);
  await list.setPage(2);
  await list.search("public");
  assert.equal(list.state.page, 1);
  await list.setPage(2);
  await list.search("", true);
  assert.equal(list.state.page, 1);
  assert.equal(list.state.decks[0].deckId, "mine");
});

test("shared personal records update search and pagination without another request", async () => {
  let calls = 0;
  const list = new OnlineDecks(
    transport({
      personalList: async () => {
        calls++;
        return { code: 0, message: "", data: [deck("mine")] };
      },
    }),
  );
  list.setAccount(account);
  await list.search("mine", true);
  list.reconcileRecords(1, [deck("renamed")]);
  assert.equal(list.state.total, 0);
  list.reconcileRecords(2, [deck("mine-other-account")]);
  assert.equal(list.state.total, 0);
  list.reconcileRecords(1, [deck("mine")]);
  assert.equal(list.state.decks[0].deckId, "mine");
  list.reconcileRecords(1, []);
  assert.equal(list.state.decks.length, 0);
  assert.equal(calls, 1);
});

test("deletion completing after an account switch does not remove its current results", async () => {
  const deletion = deferred<void>();
  const list = new OnlineDecks(transport({ delete: () => deletion.promise }));
  list.setAccount(account);
  await list.search("", true);
  const pending = list.delete("mine");
  await list.setAccount({ ...account, id: 2 });
  deletion.resolve();
  assert.equal((await pending).ok, true);
  assert.equal(list.state.decks.length, 1);
  await list.load();
  assert.equal(list.state.decks.length, 1);
});
