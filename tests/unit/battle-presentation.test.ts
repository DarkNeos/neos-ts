import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers/promises";

import { BattlePresentation } from "../../src/stores/battlePresentation.ts";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("impact releases BATTLE and its first following damage while moves wait for return", async () => {
  const battle = new BattlePresentation();
  const hit = deferred(),
    returned = deferred();
  let impacted = false;
  const playing = battle
    .play(async (_signal, impact) => {
      await hit.promise;
      impact();
      await returned.promise;
    })
    .then(() => {
      impacted = true;
    });
  await setImmediate();
  assert.equal(impacted, false);
  hit.resolve();
  await playing;
  await battle.beforeMessage(true, false); // UpdateData / UpdateCard
  await battle.beforeMessage(false, true); // Damage
  let moved = false;
  const move = battle.beforeMessage(false, false).then(() => {
    moved = true;
  });
  await setImmediate();
  assert.equal(moved, false);
  returned.resolve();
  await move;
});

test("cost, recovery and intervening messages cannot borrow the damage exception", async () => {
  for (const next of ["cost", "recover", "hint", "move"]) {
    const battle = new BattlePresentation();
    const returned = deferred();
    await battle.play(async (_signal, impact) => {
      impact();
      await returned.promise;
    });
    let passed = false;
    const other = battle.beforeMessage(false, false).then(() => {
      passed = true;
    });
    await setImmediate();
    assert.equal(passed, false, next);
    returned.resolve();
    await other;
    await battle.beforeMessage(false, true);
  }
});

test("zero-damage battles finish normally, and only one damage message passes before return", async () => {
  const battle = new BattlePresentation();
  const returned = deferred();
  await battle.play(async (_signal, impact) => {
    impact();
    await returned.promise;
  });
  await battle.beforeMessage(false, true);
  let secondPassed = false;
  const second = battle.beforeMessage(false, true).then(() => {
    secondPassed = true;
  });
  await setImmediate();
  assert.equal(secondPassed, false);
  returned.resolve();
  await second;
  await battle.play(async () => {}); // 跳过演出也必须释放命中等待。
  await battle.beforeMessage(false, false);
});

test("reset releases impact and return waits, and an old task cannot clear a new battle", async () => {
  const battle = new BattlePresentation();
  const oldDone = deferred();
  let oldSignal!: AbortSignal;
  const old = battle.play(async (signal) => {
    oldSignal = signal;
    await oldDone.promise;
  });
  await setImmediate();
  const waiting = battle.beforeMessage(false, false);
  battle.cancel();
  await Promise.all([old, waiting]);
  assert.equal(oldSignal.aborted, true);
  const newDone = deferred();
  await battle.play(async (_signal, impact) => {
    impact();
    await newDone.promise;
  });
  oldDone.resolve();
  await setImmediate();
  let passed = false;
  const move = battle.beforeMessage(false, false).then(() => {
    passed = true;
  });
  await setImmediate();
  assert.equal(passed, false);
  newDone.resolve();
  await move;
});
