import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";

import { proxy, subscribe } from "valtio";

import {
  ReplayAdvanceFlag,
  ReplayPlayback,
  type ReplayPlaybackState,
} from "../../src/stores/replayPlayback.ts";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
async function until(condition: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return;
    await tick();
  }
  assert.fail("回放状态未按预期完成转换");
}

function fixture(
  t: TestContext,
  messages = ["start", "new_turn", "draw"],
  cancelPresentation?: () => void,
) {
  const state = proxy<ReplayPlaybackState>({
    isReplay: false,
    paused: false,
    waiting: false,
    currentIndex: -1,
    total: 0,
    seeking: false,
    rebuilding: false,
    renderPending: false,
    ended: false,
    speed: 1,
    swapped: false,
    revision: 0,
    keyframes: [],
    turns: [],
  });
  const presentation = { seeking: false, speed: 1 };
  const playback = new ReplayPlayback(
    state,
    presentation,
    tick,
    cancelPresentation,
  );
  playback.begin();
  playback.setTimeline(messages);
  const events: string[] = [];
  const board: number[] = [];
  const session = playback.open(messages.length, () => {
    events.push("reset");
    board.splice(0);
  });
  t.after(() => session.close());
  const execute = (handler = async (_index: number) => {}) =>
    session.execute(async (index) => {
      await playback.handleMessage(
        messages[index],
        async () => {
          events.push(`message:${index}`);
          board.push(index);
          await handler(index);
        },
        session.isClosed,
      );
    });
  return { state, presentation, playback, session, execute, board, events };
}

test("seeking cancels an active presentation before rebuilding and keeps battle keyframes", async (t) => {
  let cancel = () => {};
  const f = fixture(t, ["start", "attack", "battle", "update_hp"], () =>
    cancel(),
  );
  assert.deepEqual([...f.state.keyframes], [0, 1, 2, 3]);
  let cancelled = false;
  const running = f.execute(async (index) => {
    if (index === 1 && !f.presentation.seeking)
      await new Promise<void>((resolve) => {
        cancel = () => {
          cancelled = true;
          resolve();
        };
      });
  });
  await until(() => f.board.includes(1));
  const seek = f.playback.seek(0);
  assert.equal(cancelled, true);
  await until(() => f.state.renderPending);
  f.playback.finishRender(f.state.revision);
  assert.equal(await seek, true);
  assert.deepEqual(f.board, [0]);
  f.session.close();
  await running;
});

test("paused advancement executes through the requested key message and then waits", async (t) => {
  const { playback, state, execute, board, session } = fixture(t, [
    "start",
    "update_data",
    "shuffle_deck",
    "update_data",
    "draw",
  ]);
  playback.pause();
  const running = execute();
  await until(() => state.waiting);
  assert.equal(state.currentIndex, -1);
  playback.advance(ReplayAdvanceFlag.DECK);
  await until(() => state.currentIndex === 2 && state.waiting);
  assert.deepEqual(board, [0, 1, 2]);
  playback.advance();
  await until(() => state.ended);
  assert.deepEqual(board, [0, 1, 2, 3, 4]);
  assert.equal(state.paused, true);
  session.close();
  await running;
});

test("seeking waits for the active handler, rebuilds inclusively, and finishes after rendering", async (t) => {
  const { playback, state, execute, board, events, presentation, session } =
    fixture(t);
  const animation = deferred();
  t.after(animation.resolve);
  playback.pause();
  playback.setSpeed(1.5);
  state.swapped = true;
  const observed: number[] = [];
  const unsubscribe = subscribe(
    state,
    () => observed.push(state.currentIndex),
    true,
  );
  t.after(unsubscribe);
  const running = execute((index) =>
    index === 1 ? animation.promise : Promise.resolve(),
  );
  await until(() => state.waiting);
  playback.advance(ReplayAdvanceFlag.NEW_TURN);
  await until(() => state.currentIndex === 1);
  const oldRevision = state.revision;
  const seeking = playback.previous();
  let settled = false;
  void seeking.then(() => {
    settled = true;
  });
  assert.equal(await playback.seek(2), false);
  await tick();
  assert.equal(events.includes("reset"), false);
  assert.equal(settled, false);
  animation.resolve();
  await until(() => state.renderPending);
  assert.deepEqual(board, [0]);
  assert.equal(state.seeking, true);
  playback.finishRender(oldRevision);
  await tick();
  assert.equal(settled, false);
  playback.finishRender(state.revision);
  assert.equal(await seeking, true);
  assert.equal(state.currentIndex, 0);
  assert.equal(state.speed, 1.5);
  assert.equal(state.swapped, true);
  assert.equal(presentation.seeking, false);
  assert.ok(observed.includes(1));
  session.close();
  await running;
});

test("closing releases a paused message without executing its handler", async (t) => {
  const { playback, state, execute, board, session } = fixture(t);
  playback.pause();
  const running = execute();
  await until(() => state.waiting);
  session.close();
  await running;
  assert.deepEqual(board, []);
  assert.equal(state.waiting, false);
});

test("closing during render confirmation cancels both the seek and execution wait", async (t) => {
  const { playback, state, execute, session, presentation } = fixture(t);
  const seeking = playback.seek(1);
  const running = execute();
  await until(() => state.renderPending);
  session.close();
  assert.equal(await seeking, false);
  await running;
  assert.equal(state.renderPending, false);
  assert.equal(state.seeking, false);
  assert.equal(presentation.seeking, false);
});

test("EOF preserves the board and still allows rewinding and continuing", async (t) => {
  const { playback, state, execute, board, session } = fixture(t);
  const running = execute();
  await until(() => state.ended);
  assert.deepEqual(board, [0, 1, 2]);
  const seeking = playback.previous();
  await until(() => state.renderPending);
  playback.finishRender(state.revision);
  assert.equal(await seeking, true);
  assert.deepEqual(board, [0, 1]);
  assert.equal(state.ended, false);
  playback.resume();
  await until(() => state.ended);
  assert.deepEqual(board, [0, 1, 2]);
  session.close();
  await running;
});

test("closing an old input session and its render acknowledgement cannot cancel a newer seek", async (t) => {
  const { playback, state, execute, session } = fixture(t);
  const first = playback.seek(1);
  const oldExecution = execute();
  await until(() => state.renderPending);
  const oldRevision = state.revision;
  playback.begin();
  assert.equal(await first, false);
  await oldExecution;
  const fresh = playback.open(2, () => {});
  t.after(() => fresh.close());
  const second = playback.seek(0);
  const freshExecution = fresh.execute(async (index) => {
    await playback.handleMessage(
      index === 0 ? "start" : "draw",
      async () => {},
      fresh.isClosed,
    );
  });
  await until(() => state.renderPending);
  const currentRevision = state.revision;
  session.close();
  playback.finishRender(oldRevision);
  await tick();
  assert.equal(state.revision, currentRevision);
  assert.equal(state.renderPending, true);
  playback.finishRender(currentRevision);
  assert.equal(await second, true);
  fresh.close();
  await freshExecution;
});

test("a handler failure releases the pending seek and closes its input session", async (t) => {
  const { playback, state, execute, session } = fixture(t);
  const seeking = playback.seek(0);
  const running = execute(async () => {
    throw new Error("handler failed");
  });
  await assert.rejects(running, /handler failed/);
  assert.equal(await seeking, false);
  assert.equal(session.isClosed(), true);
  assert.equal(state.seeking, false);
});

test("restart and turn navigation clamp targets while preserving playback speed", async (t) => {
  const { playback, state, execute, board, session } = fixture(t);
  playback.setSpeed(2);
  const running = execute();
  await until(() => state.ended);
  const restarted = playback.restart();
  await until(() => state.renderPending);
  playback.finishRender(state.revision);
  assert.equal(await restarted, true);
  assert.deepEqual(board, [0]);
  const nextTurn = playback.nextTurn();
  await until(() => state.renderPending);
  playback.finishRender(state.revision);
  assert.equal(await nextTurn, true);
  assert.equal(state.currentIndex, 1);
  const last = playback.seek(999);
  await until(() => state.renderPending);
  playback.finishRender(state.revision);
  assert.equal(await last, true);
  assert.deepEqual(board, [0, 1, 2]);
  assert.equal(state.speed, 2);
  session.close();
  await running;
});
