import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import Module from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { readYrp3dPackets } from "ygopro-yrp3d-encode";

const root = fileURLToPath(new URL("../../", import.meta.url));
// 打包适配层，保留项目的路径别名与 protobuf 生成代码。
const { outputFiles } = await build({
  stdin: {
    contents: `
      export { adaptStoc } from "./src/api/ocgcore/ocgAdapter/adapter";
      export { encodeCtos } from "./src/api/ocgcore/ocgAdapter/encodeCtos";
      export { YgoProPacket } from "./src/api/ocgcore/ocgAdapter/packet";
      export { ygopro } from "./src/api/ocgcore/idl/ocgcore";
      export { replayStore } from "./src/stores/replayStore";
      export { Forbidden } from "./src/api/forbiddens";
      export { banlistStore } from "./src/stores/banlistStore";
    `,
    resolveDir: root,
    loader: "ts",
  },
  alias: { "@": path.join(root, "src") },
  plugins: [
    {
      name: "buffer-import",
      setup(builder) {
        builder.onResolve({ filter: /^@\/infra$/ }, () => ({
          path: path.join(root, "src/infra/buffer.ts"),
        }));
        // Node 测试不启动 Worker，由浏览器回归验证 Vite 生成的入口。
        builder.onResolve({ filter: /\?worker&url$/ }, ({ path }) => ({
          path,
          namespace: "worker-url",
        }));
        builder.onLoad({ filter: /.*/, namespace: "worker-url" }, () => ({
          contents: 'export default "replayYrp.worker.js";',
        }));
      },
    },
  ],
  bundle: true,
  packages: "external",
  platform: "node",
  format: "cjs",
  write: false,
});
const filename = path.join(root, ".codec-unit.cjs");
const module = new Module(filename);
module.filename = filename;
module.paths = Module._nodeModulePaths(root);
module._compile(outputFiles![0].text, filename);
const {
  adaptStoc,
  encodeCtos,
  YgoProPacket,
  ygopro,
  replayStore,
  Forbidden,
  banlistStore,
} = module.exports;

function semantic(m: any) {
  return {
    pb: m.toObject(),
    actions: m.has_update_data
      ? m.update_data.actions.map((a: any) => ({
          clear: a.clear,
          queryFlags: a.queryFlags,
          updatesPosition: a.updatesPosition,
          linkMarkers: a.linkMarkers,
          relation: a.relationUpdate && {
            kind: a.relationUpdate.kind,
            target: a.relationUpdate.target?.toObject(),
          },
        }))
      : undefined,
    deck: m.has_shuffle_deck ? m.shuffle_deck.deckOperation : undefined,
    deckTop: m.has_confirm_cards ? m.confirm_cards.is_decktop : undefined,
    forced: m.has_select_chain
      ? m.select_chain.chains.map((c: any) => c.forced)
      : undefined,
    duelEvent: m.duelEvent && {
      ...m.duelEvent,
      location: m.duelEvent.location?.toObject(),
    },
  };
}

// 原摘要将这些消息记为 unimplemented；新增字段另有精确断言，其他消息仍逐条验证原摘要。
function legacySemantic(message: any) {
  const event = message.duelEvent;
  if (!event) return semantic(message);
  const command =
    event.kind === "battle"
      ? 111
      : event.kind === "damage-step"
      ? event.start
        ? 113
        : 114
      : event.kind === "card-hint"
      ? 160
      : event.kind === "player-hint"
      ? 165
      : event.kind === "chain-stage"
      ? event.stage === "built"
        ? 71
        : 72
      : event.result === "activation"
      ? 75
      : 76;
  return semantic(
    new ygopro.StocGameMessage({
      unimplemented: new ygopro.StocGameMessage.MsgUnimplemented({ command }),
    }),
  );
}

test("decodes final battle positions, stats, direct attacks, damage steps and LP cost source", () => {
  const i32 = (value: number) => {
    const bytes = Buffer.alloc(4);
    bytes.writeInt32LE(value);
    return [...bytes];
  };
  const decode = (bytes: number[]) =>
    adaptStoc(new YgoProPacket(bytes.length + 1, 1, Uint8Array.from(bytes)))
      .stoc_game_msg;
  const message = decode([
    111,
    0,
    4,
    3,
    1,
    ...i32(3100),
    ...i32(2100),
    1,
    1,
    4,
    5,
    4,
    ...i32(1800),
    ...i32(2800),
    0,
  ]);
  assert.equal(message.duelEvent.kind, "battle");
  assert.deepEqual(message.duelEvent.attacker, {
    location: new ygopro.CardLocation({
      controller: 0,
      zone: ygopro.CardZone.MZONE,
      sequence: 3,
      is_overlay: false,
      position: ygopro.CardPosition.FACEUP_ATTACK,
    }),
    attack: 3100,
    defense: 2100,
    battleState: 1,
  });
  assert.equal(message.duelEvent.defender.location.sequence, 5);
  assert.equal(
    message.duelEvent.defender.location.position,
    ygopro.CardPosition.FACEUP_DEFENSE,
  );
  assert.equal(message.duelEvent.defender.defense, 2800);
  assert.equal(message.duelEvent.defender.battleState, 0);
  assert.equal(
    decode([
      111,
      0,
      4,
      3,
      1,
      ...i32(3100),
      ...i32(2100),
      1,
      0,
      0,
      0,
      0,
      ...i32(0),
      ...i32(0),
      0,
    ]).duelEvent.defender,
    undefined,
  );
  assert.deepEqual(decode([113]).duelEvent, {
    kind: "damage-step",
    start: true,
  });
  assert.deepEqual(decode([114]).duelEvent, {
    kind: "damage-step",
    start: false,
  });
  const cost = decode([100, 1, ...i32(800)]);
  assert.equal(cost.hpSource, "cost");
  assert.equal(cost.update_hp.player, 1);
  assert.equal(cost.update_hp.value, 800);
  assert.equal(decode([91, 1, ...i32(800)]).hpSource, undefined);
  assert.equal(
    decode([92, 1, ...i32(800)]).update_hp.type_,
    ygopro.StocGameMessage.MsgUpdateHp.ActionType.RECOVER,
  );
});

// 迁移前适配器生成的业务结果摘要，覆盖所有真实录像消息与扩展字段。
const golden = {
  "1": [
    2909,
    "039d25b42bf95d66fdac962d3bfc1f4aaaff8c99e556bff1c78e80c5dde4e151",
  ],
  "2": [
    2036,
    "abd4236ba3e532855a9392759dc9330f2aadc4a328fb149e9a9db20f723be604",
  ],
  "3": [
    1357,
    "975a3d5031c69c3f3dca7b309c75d01ace56bf673ad0cf3e4d03249a3fa31c7d",
  ],
  "4": [
    2173,
    "25caf88496e2a0834f77ff28d217e57f9a8bca47f3e2ce9a713e03e10e2ad306",
  ],
  "5": [
    2946,
    "f403e56cf0e93ee6d527e5b513b1c16c9d54470b9fa4db86050c0359742695cc",
  ],
  "6": [
    3087,
    "86b85a9667267f982130b397827cd39778719dbcf6ffa330caa94a0d2c48331d",
  ],
  "minimal-duel": [
    2,
    "a5355ed7fbf87fb2a166d5c9f8b01660429e20b33a8ff8d0eaffc4b8cd7b1918",
  ],
};
for (const [name, [expectedCount, expectedHash]] of Object.entries(golden)) {
  test(`preserves every decoded business message from replay ${name}`, () => {
    const packets = readYrp3dPackets(
      readFileSync(
        path.join(root, "tests/e2e/fixtures/replays", name, "replay.yrp3d"),
      ),
    );
    const hash = createHash("sha256");
    let count = 0;
    for (const { type, payload } of packets) {
      if (type === 231) continue;
      const bytes = Uint8Array.from([type, ...payload]);
      const message = adaptStoc(
        new YgoProPacket(bytes.length + 1, 1, bytes),
      ).stoc_game_msg;
      hash.update(JSON.stringify(legacySemantic(message)));
      hash.update("\n");
      count++;
    }
    assert.equal(count, expectedCount);
    assert.equal(hash.digest("hex"), expectedHash);
  });
}

test("preserves card hints, player hints and distinct chain results through the network adapter", () => {
  const i32 = (value: number) => {
    const bytes = Buffer.alloc(4);
    bytes.writeInt32LE(value);
    return [...bytes];
  };
  const decode = (bytes: number[]) =>
    adaptStoc(new YgoProPacket(bytes.length + 1, 1, Uint8Array.from(bytes)))
      .stoc_game_msg;
  const card = decode([160, 1, 0x84, 2, 3, 6, ...i32(16000016)]);
  assert.deepEqual(semantic(card).duelEvent, {
    kind: "card-hint",
    type: 6,
    value: 16000016,
    location: new ygopro.CardLocation({
      controller: 1,
      zone: ygopro.CardZone.MZONE,
      sequence: 2,
      is_overlay: true,
      overlay_sequence: 3,
    }).toObject(),
  });
  for (const type of [6, 7]) {
    const player = decode([165, 1, type, ...i32(38723936)]);
    assert.deepEqual(player.duelEvent, {
      kind: "player-hint",
      player: 1,
      type,
      value: 38723936,
    });
  }
  for (const [command, result] of [
    [75, "activation"],
    [76, "effect"],
  ] as const) {
    assert.deepEqual(decode([command, 2]).duelEvent, {
      kind: "chain-result",
      index: 2,
      result,
    });
  }
  for (const [command, stage] of [
    [71, "built"],
    [72, "solving"],
  ] as const) {
    assert.deepEqual(decode([command, 2]).duelEvent, {
      kind: "chain-stage",
      index: 2,
      stage,
    });
  }
  assert.equal(decode([74]).gameMsg, "chain_end");
});

test("offers Illusion in race declarations when the server allows it", () => {
  const bytes = Uint8Array.of(140, 0, 1, 0, 0, 0, 2);
  const message = adaptStoc(
    new YgoProPacket(bytes.length + 1, 1, bytes),
  ).stoc_game_msg;
  assert.equal(message.gameMsg, "announce");
  assert.deepEqual(
    message.announce.options.map((option: any) => [
      option.code,
      option.response,
    ]),
    [[25, 0x2000000]],
  );
});

test("encodes deck counts, duplicates and section order with an exact network length", () => {
  const bytes = encodeCtos(
    new ygopro.YgoCtosMsg({
      ctos_update_deck: new ygopro.CtosUpdateDeck({
        main: [10, 20, 10],
        extra: [30],
        side: [40],
      }),
    }),
  );
  assert.equal(
    new DataView(bytes.buffer, bytes.byteOffset).getUint16(0, true),
    bytes.length - 2,
  );
  assert.equal(bytes[2], 2);
  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset + 3,
    bytes.length - 3,
  );
  assert.deepEqual(
    Array.from({ length: view.byteLength / 4 }, (_, i) =>
      view.getUint32(i * 4, true),
    ),
    [4, 1, 10, 20, 10, 30, 40],
  );
});

test("preserves server hand values and unknown input", () => {
  for (const [hand, expected] of [
    [ygopro.HandType.SCISSORS, 1],
    [ygopro.HandType.ROCK, 2],
    [ygopro.HandType.PAPER, 3],
    [ygopro.HandType.UNKNOWN, 0],
  ]) {
    const bytes = encodeCtos(
      new ygopro.YgoCtosMsg({
        ctos_hand_result: new ygopro.CtosHandResult({ hand }),
      }),
    );
    assert.deepEqual([...bytes], [2, 0, 3, expected]);
  }
});

test("a saved replay contains only the written records and retains its embedded YRP", () => {
  replayStore.reset();
  const start = new YgoProPacket(
    19,
    1,
    Uint8Array.from([4, ...new Uint8Array(17)]),
  );
  const attachment = new YgoProPacket(5, 23, Uint8Array.of(1, 2, 3, 4));
  replayStore.record(start);
  replayStore.record(attachment);
  const bytes = Buffer.from(replayStore.encode()[0]);
  assert.equal(bytes.length, 5 + 17 + 5 + 4);
  assert.deepEqual(
    readYrp3dPackets(bytes).map(({ type, payload }) => [type, [...payload]]),
    [
      [4, [...new Uint8Array(17)]],
      [231, [1, 2, 3, 4]],
    ],
  );
  replayStore.reset();
});

test("parses all banlist sections, resolves aliases, and separates editor and room selection", () => {
  const lists = new Forbidden("ocg");
  lists.load("!Current\n100 0\n200 1\n!Historical\n100 2\n300 1\n");
  assert.equal(lists.items.length, 2);
  const aliasCard = { id: 999, data: { alias: 100 } };
  assert.equal(lists.get(aliasCard), 0);
  const currentHash = lists.items[0].getHash();
  lists.select(lists.key(lists.items[1]));
  assert.equal(lists.get(aliasCard), 2);
  assert.equal(lists.get(aliasCard, currentHash), 0);
  assert.equal(lists.get(aliasCard, 0), undefined);
  const another = new Forbidden("408");
  another.load("!408\n100 1\n");
  assert.equal(another.get(aliasCard), 1);
  assert.equal(lists.get(aliasCard), 2);
  banlistStore.selected.ocg = "removed-table";
  assert.equal(lists.time, "Current");
});

test("separates OCG and TCG options and preferences while keeping room hash lookup across both", () => {
  const lists = new Forbidden("ocg");
  lists.load(
    "!2026.10\n100 0\n!2026.9 TCG\n100 1\n!2026.7\n100 2\n!2026.5 TCG\n100 0\n",
  );
  const ocg = lists.itemsFor("ocg");
  const tcg = lists.itemsFor("tcg");
  assert.deepEqual(
    ocg.map((item: any) => item.name),
    ["2026.10", "2026.7"],
  );
  assert.deepEqual(
    tcg.map((item: any) => item.name),
    ["2026.9 TCG", "2026.5 TCG"],
  );
  const aliasCard = { id: 999, data: { alias: 100 } };
  banlistStore.selected.ocg = "";
  banlistStore.selected.tcg = "";
  assert.equal(lists.get(aliasCard, undefined, "ocg"), 0);
  assert.equal(lists.get(aliasCard, undefined, "tcg"), 1);
  lists.select(lists.key(ocg[1]), "ocg");
  lists.select(lists.key(tcg[1]), "tcg");
  assert.equal(lists.get(aliasCard, undefined, "ocg"), 2);
  assert.equal(lists.get(aliasCard, undefined, "tcg"), 0);
  // 错误环境的表不能覆盖已选项，服务器 hash 则仍能找到任意环境的表。
  lists.select(lists.key(tcg[0]), "ocg");
  assert.equal(lists.get(aliasCard, undefined, "ocg"), 2);
  assert.equal(lists.get(aliasCard, tcg[0].getHash()), 1);
  assert.equal(lists.get(aliasCard, ocg[0].getHash(), "tcg"), 0);
  banlistStore.selected.ocg = lists.key(tcg[0]);
  assert.equal(lists.get(aliasCard, undefined, "ocg"), 0);
});

test("does not fall back to another environment when its banlists are unavailable", () => {
  const lists = new Forbidden("ocg");
  lists.load("!2026.10\n100 0\n");
  assert.deepEqual(lists.itemsFor("tcg"), []);
  assert.equal(lists.selectedFor("tcg"), undefined);
  assert.equal(lists.get({ id: 100, data: {} }, undefined, "tcg"), undefined);
});
