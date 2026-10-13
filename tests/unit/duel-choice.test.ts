import assert from "node:assert/strict";
import { test } from "node:test";

import { DuelChoice } from "../../src/stores/duelChoice.ts";
import { resetDuelDialogs } from "../../src/stores/duelDialogs.ts";

test("a failed send keeps the request pending for one successful retry", async () => {
  const choice = new DuelChoice<number>(() => {});
  let accepts = false;
  let sends = 0;
  const request = choice.open({
    respond: () => {
      sends++;
      return accepts;
    },
  })!;
  let finished = false;
  void request.result.then(() => {
    finished = true;
  });
  assert.equal(choice.submit(3, request.id), false);
  await Promise.resolve();
  assert.equal(finished, false);
  accepts = true;
  assert.equal(choice.submit(3, request.id), true);
  assert.equal(await request.result, 3);
  assert.equal(choice.submit(3, request.id), false);
  assert.equal(sends, 2);
});

test("invalid or ineligible input never reaches the response adapter", async () => {
  const choice = new DuelChoice<number>(() => {});
  let eligible = false;
  const sent: number[] = [];
  const request = choice.open({
    eligible: () => eligible,
    validate: (value) => value === 7,
    respond: (value) => {
      sent.push(value);
      return true;
    },
  })!;
  assert.equal(choice.submit(7, request.id), false);
  eligible = true;
  assert.equal(choice.submit(8, request.id), false);
  assert.equal(choice.submit(7, request.id), true);
  assert.deepEqual(sent, [7]);
  assert.equal(await request.result, 7);
});

test("replacement ends the old wait and ignores its input and abort signal", async () => {
  const choice = new DuelChoice<number>(() => {});
  const controller = new AbortController();
  const first = choice.open({
    respond: () => true,
    signal: controller.signal,
  })!;
  const next = choice.open({ respond: () => true })!;
  assert.equal(await first.result, undefined);
  controller.abort();
  assert.equal(choice.submit(1, first.id), false);
  assert.equal(choice.submit(2, next.id), true);
  assert.equal(await next.result, 2);
});

test("aborting a local choice releases the wait without submitting", async () => {
  const choice = new DuelChoice<number>(() => {});
  const controller = new AbortController();
  let submitted = false;
  const request = choice.open({
    signal: controller.signal,
    respond: () => {
      submitted = true;
      return true;
    },
  })!;
  controller.abort();
  assert.equal(await request.result, undefined);
  assert.equal(choice.submit(1, request.id), false);
  assert.equal(submitted, false);
  assert.equal(
    choice.open({ signal: controller.signal, respond: () => true }),
    undefined,
  );
});

test("global duel reset closes pending choices and releases protocol waits", async () => {
  const choice = new DuelChoice<boolean>(() => {});
  const request = choice.open({ respond: () => true })!;
  resetDuelDialogs();
  assert.equal(await request.result, undefined);
  assert.equal(choice.submit(true, request.id), false);
});

test("a synchronous response cannot submit the same request twice", async () => {
  const choice = new DuelChoice<number>(() => {});
  let calls = 0;
  const request = choice.open({
    respond: (value) => {
      calls++;
      assert.equal(choice.submit(value, request.id), false);
      return true;
    },
  })!;
  assert.equal(choice.submit(4, request.id), true);
  assert.equal(await request.result, 4);
  assert.equal(calls, 1);
});

test("a response that opens another request cannot finish the replacement", async () => {
  const choice = new DuelChoice<number>(() => {});
  let next: ReturnType<typeof choice.open>;
  const first = choice.open({
    respond: () => {
      next = choice.open({ respond: () => true });
      return true;
    },
  })!;
  assert.equal(choice.submit(4, first.id), false);
  assert.equal(await first.result, undefined);
  assert.equal(choice.submit(5, next!.id), true);
  assert.equal(await next!.result, 5);
});
