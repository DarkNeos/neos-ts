import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CardSelectionProcess,
  type SelectionResponse,
} from "../../src/stores/cardSelectionProcess.ts";
import type { CardSelectionRequest } from "../../src/stores/cardSelectionTypes.ts";

interface Card {
  code: number;
  response: number;
  selected?: boolean;
  level1?: number;
  level2?: number;
  tributeValue?: number;
}
const cards: Card[] = [0, 1, 2].map((response) => ({ code: 42, response }));
function request(overrides: Partial<CardSelectionRequest<Card>> = {}) {
  return {
    selectionKind: "count" as const,
    min: 1,
    max: 2,
    single: false,
    totalLevels: 0,
    overflow: false,
    cancelable: true,
    selectables: cards,
    mustSelects: [],
    ...overrides,
  };
}

test("same-name candidates remain distinct and a response is sent once", async () => {
  const selection = new CardSelectionProcess<Card>();
  const sent: SelectionResponse[] = [];
  const completed = selection.open(request({ min: 2 }), (result) => {
    if (result.response) sent.push(result.response);
  });
  selection.toggle(0);
  assert.equal(selection.state.valid, false);
  selection.submit();
  assert.equal(selection.state.active, true);
  selection.toggle(1);
  assert.equal(selection.canChoose(2), false);
  selection.submit();
  selection.submit();
  selection.quickSubmit(2);
  assert.deepEqual(
    (await completed).map((card) => card.response),
    [0, 1],
  );
  assert.deepEqual(sent, [{ kind: "multiple", values: [0, 1] }]);
  assert.equal(selection.state.active, false);
});

test("single-choice replacement and quick submission share the same validity", async () => {
  const selection = new CardSelectionProcess<Card>();
  const completed = selection.open(request({ max: 1 }));
  selection.toggle(0);
  selection.toggle(1);
  assert.deepEqual([...selection.state.selected], [1]);
  selection.quickSubmit(2);
  assert.equal((await completed)[0].response, 2);
});

test("tribute contributions and mandatory mixed-level sums are checked at submission", async () => {
  const selection = new CardSelectionProcess<Card>();
  const contribution = selection.open(
    request({
      selectionKind: "tribute",
      min: 2,
      selectables: [{ code: 42, response: 4, tributeValue: 2 }],
    }),
  );
  selection.toggle(0);
  assert.equal(selection.state.valid, true);
  selection.submit();
  assert.equal((await contribution)[0].response, 4);

  let sent: SelectionResponse | undefined;
  const sum = selection.open(
    request({
      selectionKind: "sum",
      min: 1,
      max: 1,
      totalLevels: 6,
      mustSelects: [{ code: 42, response: 9, level1: 2 }],
      selectables: [{ code: 42, response: 5, level1: 3, level2: 4 }],
    }),
    (result) => {
      sent = result.response;
    },
  );
  selection.toggle(0);
  assert.equal(selection.state.valid, true);
  selection.submit();
  await sum;
  assert.deepEqual(sent, { kind: "multiple", values: [9, 5] });
});

test("incremental selection submits only the clicked card, including deselection", async () => {
  const selection = new CardSelectionProcess<Card>();
  let sent: SelectionResponse | undefined;
  const completed = selection.open(
    request({
      single: true,
      min: 3,
      max: 3,
      selectables: [cards[0], { ...cards[1], selected: true }],
    }),
    (result) => {
      sent = result.response;
    },
  );
  selection.toggle(1);
  assert.equal(selection.state.valid, true);
  selection.submit();
  assert.deepEqual(
    (await completed).map((card) => card.response),
    [1],
  );
  assert.deepEqual(sent, { kind: "multiple", values: [1] });
});

test("a new request releases the previous wait without sending a response", async () => {
  const selection = new CardSelectionProcess<Card>();
  const sent: SelectionResponse[] = [];
  const old = selection.open(request(), (result) => {
    if (result.response) sent.push(result.response);
  });
  selection.toggle(0);
  const current = selection.open(request({ max: 1 }));
  assert.deepEqual(await old, []);
  assert.deepEqual([...selection.state.selected], []);
  assert.deepEqual(sent, []);
  selection.quickSubmit(1);
  assert.equal((await current)[0].response, 1);
});

test("cancel and finish respect the request flags and reset sends nothing", async () => {
  const selection = new CardSelectionProcess<Card>();
  const sent: SelectionResponse[] = [];
  const completed = selection.open(
    request({ cancelable: false, finishable: true }),
    (result) => {
      if (result.response) sent.push(result.response);
    },
  );
  selection.cancel();
  assert.equal(selection.state.active, true);
  selection.finishSelection();
  await completed;
  assert.deepEqual(sent, [{ kind: "single", value: -1 }]);
  const abandoned = selection.open(request(), (result) => {
    if (result.response) sent.push(result.response);
  });
  selection.toggle(0);
  selection.reset();
  selection.cancel();
  assert.deepEqual(await abandoned, []);
  assert.equal(sent.length, 1);
});

test("chain selection preserves the single-value protocol response", async () => {
  const selection = new CardSelectionProcess<Card>();
  let sent: SelectionResponse | undefined;
  const completed = selection.open(
    request({ isChain: true, max: 1 }),
    (result) => {
      sent = result.response;
    },
  );
  selection.quickSubmit(1);
  await completed;
  assert.deepEqual(sent, { kind: "single", value: 1 });
});
