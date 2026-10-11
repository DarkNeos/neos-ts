import assert from "node:assert/strict";
import { test } from "node:test";

import { yrp1DuelSeed } from "../../src/api/ocgcore/replaySeed.ts";
import { MAX_YRP_SIZE, parseYrp, yrpDecks } from "../../src/api/ocgcore/yrp.ts";
import { replayFixture } from "../helpers/codecFixtures.ts";

for (const yrp2 of [false, true])
  for (const compressed of [false, true]) {
    test(`reads ${yrp2 ? "YRP2" : "YRP1"} decks and responses (${
      compressed ? "LZMA" : "raw"
    })`, () => {
      const replay = parseYrp(replayFixture({ yrp2, compressed }));
      assert.deepEqual(replay.hostDeck?.main, [89631139, 89631139]);
      assert.equal(replay.header?.id, yrp2 ? 0x32707279 : 0x31707279);
      assert.deepEqual(replay.responses, [Uint8Array.of(7, 0, 0, 0)]);
    });
  }

test("keeps tag players in file order and marks unknown cards without inventing them", () => {
  const decks = yrpDecks(
    parseYrp(replayFixture({ tag: true, host: [89631139, 0] })),
    3,
  );
  assert.deepEqual(
    decks.map((deck) => deck.player),
    ["Alice", "Alice tag", "Bob tag", "Bob"],
  );
  assert.equal(decks[0].game, 3);
  assert.equal(decks[0].complete, false);
  assert.equal(decks[0].expectedMain, 2);
  assert.deepEqual(decks[0].main, [89631139]);
});

test("rejects negative, excessive and truncated deck counts before library parsing", () => {
  for (const count of [-1, 501, 100]) {
    const bytes = replayFixture();
    new DataView(bytes).setInt32(32 + 96, count, true);
    assert.throws(() => parseYrp(bytes), /张数无效|不完整/);
  }
});

test("rejects incomplete responses for playback while allowing deck extraction", () => {
  const bytes = replayFixture().slice(0, -1);
  new DataView(bytes).setUint32(16, bytes.byteLength - 32, true);
  assert.throws(() => parseYrp(bytes), /操作记录不完整/);
  assert.deepEqual(parseYrp(bytes, true).hostDeck?.main, [89631139, 89631139]);
});

test("checks declared and actual sizes for compressed and uncompressed input", () => {
  for (const compressed of [false, true]) {
    const bytes = replayFixture({ compressed });
    const view = new DataView(bytes);
    view.setUint32(16, MAX_YRP_SIZE + 1, true);
    assert.throws(() => parseYrp(bytes), /大小无效/);
  }
  const raw = replayFixture();
  new DataView(raw).setUint32(16, 1, true);
  assert.throws(() => parseYrp(raw), /长度不符/);
});

test("only deck extraction accepts legacy tag attachments with missing duel flags", () => {
  const bytes = replayFixture({ tag: true });
  new DataView(bytes).setUint32(32 + 160 + 12, 0, true);
  assert.throws(() => parseYrp(bytes), /tag flag mismatch/);
  assert.equal(yrpDecks(parseYrp(bytes, true), 1).length, 4);
});

test("matches the MT19937 first output used by YRP1 clients", () => {
  assert.equal(yrp1DuelSeed(5489), 3499211612);
  assert.equal(yrp1DuelSeed(0), 2357136044);
  assert.equal(yrp1DuelSeed(1), 1791095845);
});
