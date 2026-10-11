import YGOProDeck from "ygopro-deck-encode";
import { YGOProYrp } from "ygopro-yrp-encode";

export function replayFixture({
  yrp2 = false,
  compressed = false,
  tag = false,
  responses = [Uint8Array.of(7, 0, 0, 0)],
  host = [89631139, 89631139],
  client = [46986414, 46986414],
}: {
  yrp2?: boolean;
  compressed?: boolean;
  tag?: boolean;
  responses?: Uint8Array[];
  host?: number[];
  client?: number[];
} = {}) {
  return new YGOProYrp({
    header: {
      id: yrp2 ? 0x32707279 : 0x31707279,
      version: 4962,
      flag: (compressed ? 1 : 0) | (tag ? 2 : 0) | (yrp2 ? 16 : 0),
      seed: 123,
      seedSequence: yrp2 ? [1, 2, 3, 4, 5, 6, 7, 8] : [],
    },
    hostName: "Alice",
    clientName: "Bob",
    tagHostName: tag ? "Alice tag" : null,
    tagClientName: tag ? "Bob tag" : null,
    hostDeck: new YGOProDeck({ main: host, extra: [], side: [] }),
    clientDeck: new YGOProDeck({ main: client, extra: [], side: [] }),
    tagHostDeck: tag
      ? new YGOProDeck({ main: [89631139], extra: [], side: [] })
      : null,
    tagClientDeck: tag
      ? new YGOProDeck({ main: [46986414], extra: [], side: [] })
      : null,
    startLp: 8000,
    startHand: 0,
    drawCount: 1,
    opt: 0x50010 | (tag ? 32 : 0),
    responses,
  })
    .toYrp()
    .slice().buffer as ArrayBuffer;
}
