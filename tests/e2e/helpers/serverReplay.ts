import lzma from "lzma";

export function serverReplayPayload(
  compressed: boolean,
  decks = [
    { name: "Alpha", main: [46986414, 46986414, 89631139], extra: [23995346] },
    { name: "Beta", main: [15025844, 89631139, 15025844], extra: [23995346] },
  ],
) {
  const body = Buffer.alloc(
    96 +
      decks.reduce(
        (sum, deck) => sum + 8 + 4 * (deck.main.length + deck.extra.length),
        0,
      ),
  );
  decks.forEach((deck, index) =>
    body.write(deck.name, index * 40, 40, "utf16le"),
  );
  let offset = 96;
  for (const deck of decks) {
    for (const cards of [deck.main, deck.extra]) {
      body.writeUInt32LE(cards.length, offset);
      offset += 4;
      for (const code of cards) {
        body.writeUInt32LE(code, offset);
        offset += 4;
      }
    }
  }
  const header = Buffer.alloc(32);
  header.writeUInt32LE(0x31707279, 0);
  header.writeUInt32LE(compressed ? 1 : 0, 8);
  header.writeUInt32LE(body.length, 16);
  if (!compressed) return Buffer.concat([header, body]);
  const encoded = Buffer.from(lzma.compress([...body], 1));
  encoded.copy(header, 24, 0, 5);
  return Buffer.concat([header, encoded.subarray(13)]);
}
