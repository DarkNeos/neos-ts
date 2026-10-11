import assert from "node:assert/strict";
import { test } from "node:test";

import {
  type PreparedReplay,
  ReplayImportSession,
} from "../../src/stores/replayImportSession.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}
const file = (id: number) => new Uint8Array([id]).buffer;
const result = (id: number): PreparedReplay<number> => ({
  decks: [id],
  deckError: "",
  replay: file(id),
});
function session(
  prepare = async (data: ArrayBuffer) => result(new Uint8Array(data)[0]),
  startPlayback = async () => true,
) {
  const published: PreparedReplay<number>[] = [];
  const opened: number[] = [];
  const importer = new ReplayImportSession<number>({
    prepare,
    publishDecks: (value) => published.push(value),
    startPlayback: async (data) => {
      opened.push(new Uint8Array(data)[0]);
      return startPlayback();
    },
  });
  return { importer, published, opened };
}

test("the latest selected file wins even when an old read finishes later", async () => {
  const { importer, published } = session();
  const old = deferred<ArrayBuffer>();
  const reading = importer.select({ arrayBuffer: () => old.promise });
  await importer.select(file(2));
  old.resolve(file(1));
  await reading;
  assert.equal(importer.state.hasFile, true);
  assert.equal(await importer.run("extract"), true);
  assert.deepEqual(published.at(-1)?.decks, [2]);
});

test("changing files during extraction prevents the stale deck result from publishing", async () => {
  const pending = deferred<PreparedReplay<number>>();
  const { importer, published } = session(() => pending.promise);
  await importer.select(file(1));
  const extracting = importer.run("extract");
  await importer.select(file(2));
  pending.resolve(result(1));
  assert.equal(await extracting, false);
  assert.deepEqual(published.at(-1)?.decks, []);
  assert.equal(importer.state.busy, false);
});

test("cancelling preparation prevents playback and ignores late errors and progress", async () => {
  const pending = deferred<PreparedReplay<number>>();
  let progress!: (text: string) => void;
  const published: number[] = [];
  const opened: number[] = [];
  const importer = new ReplayImportSession<number>({
    prepare: (_data, _mode, options) => {
      progress = options.onProgress!;
      return pending.promise;
    },
    publishDecks: (value) => published.push(...value.decks),
    startPlayback: async () => {
      opened.push(1);
      return true;
    },
  });
  await importer.select(file(1));
  const playback = importer.run("play");
  importer.cancel();
  progress("stale progress");
  pending.reject(new Error("stale failure"));
  assert.equal(await playback, false);
  assert.deepEqual(opened, []);
  assert.deepEqual(published, []);
  assert.equal(importer.state.error, "");
  assert.equal(importer.state.progress, "");
});

test("a cancelled or superseded connection cannot mark the new file as started", async () => {
  const connection = deferred<boolean>();
  const { importer, opened } = session(undefined, () => connection.promise);
  await importer.select(file(1));
  const playback = importer.run("play");
  await Promise.resolve();
  assert.deepEqual(opened, [1]);
  await importer.select(file(2));
  connection.resolve(true);
  assert.equal(await playback, false);
  assert.equal(importer.state.started, false);
});

test("only an accepted connection starts playback; extraction never starts it", async () => {
  const { importer, opened } = session();
  await importer.select(file(1));
  assert.equal(await importer.run("extract"), true);
  assert.deepEqual(opened, []);
  assert.equal(await importer.run("play"), true);
  assert.equal(importer.state.started, true);
  assert.deepEqual(opened, [1]);
  const rejected = session(undefined, async () => false);
  await rejected.importer.select(file(1));
  assert.equal(await rejected.importer.run("play"), false);
  assert.equal(rejected.importer.state.started, false);
});

test("external abort cancels the current task and the file remains available for retry", async () => {
  const pending = deferred<PreparedReplay<number>>();
  let signal: AbortSignal | undefined;
  const importer = new ReplayImportSession<number>({
    prepare: (_data, _mode, options) => {
      signal = options.signal;
      return pending.promise;
    },
    publishDecks: () => {},
    startPlayback: async () => true,
  });
  await importer.select(file(1));
  const abort = new AbortController();
  const playback = importer.run("play", { signal: abort.signal });
  abort.abort();
  assert.equal(signal?.aborted, true);
  pending.resolve(result(1));
  assert.equal(await playback, false);
  assert.equal(importer.state.hasFile, true);
  assert.equal(importer.state.busy, false);
});

test("a failed new file read cannot fall back to the previous file", async () => {
  const { importer, opened } = session();
  await importer.select(file(1));
  await importer.select({
    arrayBuffer: async () => {
      throw new Error("read failed");
    },
  });
  assert.equal(importer.state.error, "read failed");
  assert.equal(importer.state.hasFile, false);
  assert.equal(await importer.run("play"), false);
  assert.deepEqual(opened, []);
});
