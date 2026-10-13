import assert from "node:assert/strict";
import { test } from "node:test";

import YGOProDeck from "ygopro-deck-encode";

import { updateCloudDeckYdk } from "../../src/api/mdproDeck/ydk.ts";

const cards = { main: [1000002, 1000001], extra: [], side: [1000003] };
const metadata =
  "#pickup\n#1000001\n#0\n#0\n#case\n#1082012\n#protector\n#1070008\n#field\n#1090009\n#grave\n#1100009\n#stand\n#1110001\n#mate\n#1000007\n##test-deck\n###12345";

for (const newline of ["\n", "\r\n", "\\r\\n"]) {
  test(`editing cards preserves MDPro metadata with ${JSON.stringify(
    newline,
  )} line endings`, () => {
    const original =
      `#created by MDPro3\n#main\n1000001\n#extra\n1000003\n!side\n1000002\n${metadata}`.replaceAll(
        "\n",
        newline,
      );
    const updated = updateCloudDeckYdk(original, cards);
    assert.ok(updated.startsWith("#created by MDPro3\n#main"));
    assert.ok(updated.endsWith(metadata));
    const parsed = YGOProDeck.fromYdkString(updated);
    assert.deepEqual(
      { main: parsed.main, extra: parsed.extra, side: parsed.side },
      cards,
    );
    assert.equal(updateCloudDeckYdk(updated, cards), updated);
  });
}

test("missing empty card sections can be filled without overwriting metadata", () => {
  const updated = updateCloudDeckYdk(`#main\n1000001\n${metadata}`, cards);
  assert.ok(updated.includes(metadata));
  const parsed = YGOProDeck.fromYdkString(updated);
  assert.deepEqual(
    { main: parsed.main, extra: parsed.extra, side: parsed.side },
    cards,
  );
});
