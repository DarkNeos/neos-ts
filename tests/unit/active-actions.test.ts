import assert from "node:assert/strict";
import { test } from "node:test";

import {
  type ActionSource,
  type ActiveAction,
  ActiveActionProcess,
} from "../../src/stores/activeActionProcess.ts";

const action = (
  card: string,
  response: number,
  interactType = 1,
): ActiveAction<string> => ({ card, response, interactType });
function setup() {
  const process = new ActiveActionProcess<string>();
  const sent: [ActionSource, number][] = [];
  let eligible = true;
  let accepts = true;
  let chooseCard = async (cards: string[], _signal: AbortSignal) => cards[0];
  let chooseEffect = async (
    actions: ActiveAction<string>[],
    _signal: AbortSignal,
  ) => actions[0].response;
  const open = (
    actions: ActiveAction<string>[] = [action("A", 0), action("B", 1)],
    source: ActionSource = "idle",
  ) =>
    process.open(
      { source, actions, phases: { end: source === "idle" ? 7 : 3 } },
      {
        eligible: () => eligible,
        send: (source, response) => {
          if (accepts) sent.push([source, response]);
          return accepts;
        },
        chooseCard: (cards, signal) => chooseCard(cards, signal),
        chooseEffect: (actions, signal) => chooseEffect(actions, signal),
        clear: () => {},
      },
    );
  return {
    process,
    sent,
    open,
    setEligible: (value: boolean) => {
      eligible = value;
    },
    setAccepts: (value: boolean) => {
      accepts = value;
    },
    setChooseCard: (fn: typeof chooseCard) => {
      chooseCard = fn;
    },
    setChooseEffect: (fn: typeof chooseEffect) => {
      chooseEffect = fn;
    },
  };
}

test("card and phase choices share one submission for the active request", async () => {
  const { process, sent, open } = setup();
  const id = open();
  const [choice] = process.options(["A"]);
  assert.equal(await choice.choose(), true);
  assert.equal(await choice.choose(), false);
  assert.equal(process.submitPhase(id, "end"), false);
  assert.deepEqual(sent, [["idle", 0]]);
});

test("a card choice awaiting presentation cannot respond to a replacement request", async () => {
  const { process, sent, open, setChooseCard } = setup();
  let finish!: (card: string) => void;
  let signal!: AbortSignal;
  setChooseCard((_cards, active) => {
    signal = active;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  open();
  const choosing = process.options(["A", "B"])[0].choose();
  open();
  assert.equal(signal.aborted, true);
  finish("A");
  assert.equal(await choosing, false);
  assert.deepEqual(sent, []);
});

test("late multiple-effect completion is rejected even if the new request reuses response values", async () => {
  const { process, sent, open, setChooseEffect } = setup();
  let finish!: (response: number) => void;
  setChooseEffect(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  open([action("A", 0, 6), action("A", 65536, 6)]);
  const choosing = process.options(["A"])[0].choose();
  open([action("A", 65536, 6)]);
  finish(65536);
  assert.equal(await choosing, false);
  assert.deepEqual(sent, []);
});

test("reset and lost eligibility both prevent stale card and phase submissions", async () => {
  const { process, sent, open, setEligible } = setup();
  const id = open();
  const [choice] = process.options(["A"]);
  setEligible(false);
  assert.equal(await choice.choose(), false);
  assert.equal(process.submitPhase(id, "end"), false);
  setEligible(true);
  process.reset();
  assert.equal(await choice.choose(), false);
  assert.deepEqual(sent, []);
});

test("battle effects and phases preserve their response source and reject invalid phases", async () => {
  const { process, sent, open } = setup();
  const id = open([action("A", 65536, 6)], "battle");
  assert.equal(process.submitPhase(id, "battle", "battle"), false);
  assert.equal(process.submitPhase(id, "main2"), false);
  assert.equal(await process.options(["A"])[0].choose(), true);
  assert.deepEqual(sent, [["battle", 65536]]);
  const next = open([], "battle");
  assert.equal(process.submitPhase(id, "end"), false);
  assert.equal(process.submitPhase(next, "end"), true);
  assert.deepEqual(sent.at(-1), ["battle", 3]);
});

test("a failed send preserves the request for retry, then consumes it once", async () => {
  const { process, sent, open, setAccepts } = setup();
  open();
  const [choice] = process.options(["A"]);
  setAccepts(false);
  assert.equal(await choice.choose(), false);
  setAccepts(true);
  assert.equal(await choice.choose(), true);
  assert.equal(await choice.choose(), false);
  assert.deepEqual(sent, [["idle", 0]]);
});

test("effect lists do not duplicate cards and presentation cannot submit an unknown response", async () => {
  const { process, sent, open, setChooseEffect } = setup();
  open([action("A", 0, 6), action("A", 65536, 6)]);
  const [choice] = process.options(["A", "A"]);
  assert.deepEqual(choice.cards, ["A"]);
  setChooseEffect(async () => 12345);
  assert.equal(await choice.choose(), false);
  assert.deepEqual(sent, []);
});
