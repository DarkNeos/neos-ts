import assert from "node:assert/strict";
import { test } from "node:test";

import { DeckDraft, type DraftSource } from "../../src/stores/deckDraft.ts";
import type { IDeck } from "../../src/stores/deckStore.ts";

const deck = (name = "one", main = [1]): IDeck => ({
  deckName: name,
  main,
  extra: [],
  side: [],
});
const copy = (value: IDeck): IDeck => ({
  deckName: value.deckName,
  main: [...value.main],
  extra: [...value.extra],
  side: [...value.side],
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
function setup() {
  const current = {
    accountId: 1,
    entry: { id: "cloud:1:one", deck: deck() },
    deleted: false,
  };
  let editing = deck("empty", []);
  const dependencies = {
    current: () => current,
    editor: {
      read: () => copy(editing),
      prepare: async (value: IDeck) => copy(value),
      apply: (value: IDeck) => {
        editing = copy(value);
        dependencies.editor.edited = false;
      },
      rename: (name: string) => {
        editing.deckName = name;
      },
      edited: false,
    },
    select: async (id: string) => {
      current.entry = { id, deck: deck(id) };
      return current.entry.deck;
    },
    preview: async (_id: string): Promise<DraftSource> => ({
      id: "preview",
      deck: deck("public"),
    }),
    save: async (source: DraftSource, value: IDeck): Promise<DraftSource> => ({
      id: source.id,
      deck: value,
    }),
    copy: async (value: IDeck): Promise<DraftSource> => ({
      id: "local:copy",
      deck: { ...value, deckName: "copy" },
    }),
  };
  const draft = new DeckDraft(dependencies);
  return {
    draft,
    dependencies,
    current,
    read: () => editing,
    edit: (value: IDeck) => {
      editing = copy(value);
      dependencies.editor.edited = true;
    },
  };
}

test("selection and preview require discarding a dirty draft before replacing it", async () => {
  const { draft, edit, read } = setup();
  await draft.sync();
  edit(deck("dirty", [2]));
  assert.equal(await draft.select("local:two"), "confirm");
  assert.equal(await draft.preview("public"), "confirm");
  assert.equal(read().deckName, "dirty");
  assert.equal(await draft.preview("public", true), "selected");
  assert.equal(draft.state.entryId, "preview");
  assert.equal(read().deckName, "public");
  await draft.sync();
  assert.equal(read().deckName, "public");
});

test("background refresh preserves edits made while card metadata was loading", async () => {
  const { draft, dependencies, current, edit, read } = setup();
  await draft.sync();
  const prepared = deferred<IDeck>();
  dependencies.editor.prepare = () => prepared.promise;
  current.entry = { id: "cloud:1:one", deck: deck("remote", [9]) };
  const loading = draft.sync();
  edit(deck("dirty", [2]));
  prepared.resolve(deck("remote", [9]));
  await loading;
  assert.equal(read().deckName, "dirty");
  assert.equal(dependencies.editor.edited, true);
});

test("a late selection cannot replace a newer selection", async () => {
  const { draft, dependencies, read } = setup();
  await draft.sync();
  const old = deferred<IDeck>();
  dependencies.select = async (id) =>
    id === "old" ? old.promise : deck("new");
  const first = draft.select("old");
  assert.equal(await draft.select("new"), "selected");
  old.resolve(deck("old"));
  assert.equal(await first, "ignored");
  assert.equal(draft.state.entryId, "new");
  assert.equal(read().deckName, "new");
});

test("edits made while the selected deck is being fetched are never overwritten", async () => {
  const { draft, dependencies, edit, read } = setup();
  await draft.sync();
  const selected = deferred<IDeck>();
  dependencies.select = () => selected.promise;
  const pending = draft.select("local:next");
  edit(deck("new edits", [3]));
  selected.resolve(deck("next"));
  assert.equal(await pending, "ignored");
  assert.equal(draft.state.entryId, "cloud:1:one");
  assert.equal(read().deckName, "new edits");
  assert.equal(dependencies.editor.edited, true);
});

test("account changes invalidate pending loads and discard the old account's edits", async () => {
  const { draft, dependencies, current, edit, read } = setup();
  await draft.sync();
  const old = deferred<IDeck>();
  dependencies.select = () => old.promise;
  const first = draft.select("old");
  edit(deck("dirty"));
  current.accountId = 2;
  current.entry = { id: "cloud:2:next", deck: deck("next") };
  await draft.sync();
  old.resolve(deck("old"));
  await first;
  assert.equal(draft.state.accountId, 2);
  assert.equal(draft.state.entryId, "cloud:2:next");
  assert.equal(read().deckName, "next");
});

test("failed saves preserve identity and edits so retry updates the same deck", async () => {
  const { draft, dependencies, edit, read } = setup();
  await draft.sync();
  edit(deck("renamed", [2]));
  const targets: string[] = [];
  dependencies.save = async (source, value) => {
    targets.push(source.id);
    if (targets.length === 1) throw new Error("offline");
    return { id: source.id, deck: value };
  };
  await assert.rejects(draft.save(), /offline/);
  assert.equal(read().deckName, "renamed");
  assert.equal(dependencies.editor.edited, true);
  assert.equal(draft.state.error, "offline");
  await draft.save();
  assert.deepEqual(targets, ["cloud:1:one", "cloud:1:one"]);
  assert.equal(dependencies.editor.edited, false);
  assert.equal(draft.state.error, "");
});

test("edits made during saving stay dirty and reset uses the saved version", async () => {
  const { draft, dependencies, edit, read } = setup();
  await draft.sync();
  edit(deck("saved", [2]));
  const result = deferred<DraftSource>();
  dependencies.save = () => result.promise;
  const saving = draft.save();
  edit(deck("newer", [3]));
  assert.equal(await draft.reset(), false);
  assert.equal(await draft.select("other", true), "ignored");
  assert.equal(await draft.save(), undefined);
  result.resolve({ id: "cloud:1:one", deck: deck("saved", [2]) });
  await saving;
  assert.equal(read().deckName, "newer");
  assert.equal(dependencies.editor.edited, true);
  assert.equal(draft.state.deck.deckName, "saved");
  await draft.reset();
  assert.equal(read().deckName, "saved");
  assert.equal(dependencies.editor.edited, false);
});

test("a save completing after an account switch cannot restore the old draft", async () => {
  const { draft, dependencies, current, edit, read } = setup();
  await draft.sync();
  edit(deck("old"));
  const result = deferred<DraftSource>();
  dependencies.save = () => result.promise;
  const saving = draft.save();
  current.accountId = 2;
  current.entry = { id: "cloud:2:next", deck: deck("next") };
  await draft.sync();
  result.resolve({ id: "cloud:1:one", deck: deck("old") });
  assert.equal(await saving, undefined);
  assert.equal(draft.state.entryId, "cloud:2:next");
  assert.equal(read().deckName, "next");
  assert.equal(draft.state.saving, false);
});

test("confirmed deletion ends even a dirty draft and selects the remaining deck", async () => {
  const { draft, dependencies, current, edit, read } = setup();
  await draft.sync();
  edit(deck("dirty"));
  current.deleted = true;
  current.entry = { id: "local:remaining", deck: deck("remaining") };
  await draft.sync();
  assert.equal(draft.state.entryId, "local:remaining");
  assert.equal(read().deckName, "remaining");
  assert.equal(dependencies.editor.edited, false);
});

test("training suspends background loads and resuming retains the unsaved draft", async () => {
  const { draft, current, edit, read } = setup();
  await draft.sync();
  draft.suspend();
  current.entry = { id: "cloud:1:one", deck: deck("remote", [9]) };
  await draft.sync();
  assert.equal(read().deckName, "one");
  edit(deck("training", [3, 2, 1]));
  draft.resume();
  await draft.sync();
  assert.equal(read().deckName, "training");
  assert.deepEqual(read().main, [3, 2, 1]);
});

test("saving a local copy updates identity and its saved baseline together", async () => {
  const { draft, dependencies, edit, read } = setup();
  await draft.sync();
  edit(deck("one", [2]));
  const saved = await draft.saveLocalCopy();
  assert.equal(saved?.id, "local:copy");
  assert.equal(draft.state.entryId, "local:copy");
  assert.equal(read().deckName, "copy");
  assert.equal(dependencies.editor.edited, false);
});

test("switching accounts during training clears the previous account's draft", async () => {
  const { draft, current, edit, read } = setup();
  await draft.sync();
  edit(deck("old draft"));
  draft.suspend();
  current.accountId = 2;
  current.entry = { id: "cloud:2:next", deck: deck("next") };
  await draft.sync();
  assert.equal(read().deckName, "next");
  assert.equal(draft.state.accountId, 2);
});
