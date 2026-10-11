import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import JSZip from "jszip";
import initSqlJs from "sql.js";

import { yrp1DuelSeed } from "../../src/api/ocgcore/replaySeed.ts";
import { replayFixture } from "./codecFixtures.ts";

const require = createRequire(path.join(process.cwd(), "package.json"));
// 内核的 Node ESM 入口依赖 __dirname，测试使用官方 CJS 入口。
const {
  createDuelFromYrp,
  createOcgcoreWrapper,
  SqljsCardReader,
  ZipScriptReader,
} = require("koishipro-core.js") as typeof import("koishipro-core.js");
const { YGOProMsgResponseBase, YGOProMsgSelectChain, YGOProMsgSelectIdleCmd } =
  require("ygopro-msg-encode") as typeof import("ygopro-msg-encode");
const { ReplayHeader, YGOProYrp } =
  require("ygopro-yrp-encode") as typeof import("ygopro-yrp-encode");

/** 只用普通怪兽的小型对局，脚本与卡库在测试内生成。 */
export async function localReplayResources() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE datas (id INTEGER PRIMARY KEY, ot INTEGER, alias INTEGER, setcode INTEGER, type INTEGER, atk INTEGER, def INTEGER, level INTEGER, race INTEGER, attribute INTEGER, category INTEGER); CREATE TABLE texts (id INTEGER PRIMARY KEY, name TEXT, desc TEXT);",
  );
  for (const [id, name, attack, defense] of [
    [89631139, "青眼白龙", 3000, 2500],
    [46986414, "黑魔术师", 2500, 2100],
  ] as const) {
    db.run("INSERT INTO datas VALUES (?, 3, 0, 0, 17, ?, ?, 8, 8192, 16, 0)", [
      id,
      attack,
      defense,
    ]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [id, name]);
  }
  const database = db.export().slice().buffer as ArrayBuffer;
  db.run("DELETE FROM datas; DELETE FROM texts;");
  const prerelease = db.export().slice().buffer as ArrayBuffer;
  db.close();
  const zip = new JSZip();
  zip.file(
    "script/constant.lua",
    "-- normal monsters need no script constants\n",
  );
  zip.file(
    "script/utility.lua",
    "Auxiliary={PreloadUds=function() end}; aux=Auxiliary\n",
  );
  for (const file of [
    "script/patches/entry.lua",
    "script/init.lua",
    "script/special.lua",
  ])
    zip.file(file, "-- test fixture\n");
  const scripts = await zip.generateAsync({ type: "arraybuffer" });
  const wasm = await readFile(
    path.join(process.cwd(), "node_modules/sql.js/dist/sql-wasm.wasm"),
  );
  return {
    scripts: [scripts],
    databases: { release: database, preRelease: prerelease },
    sqlWasm: Uint8Array.from(wasm).buffer,
  };
}

/** 超先行效果会加载辅助脚本，并生成一张不在卡组中的效果怪兽。 */
export async function preReleaseReplayResources() {
  const resources = await localReplayResources();
  const SQL = await initSqlJs();
  const db = new SQL.Database(new Uint8Array(resources.databases.preRelease));
  for (const [id, type] of [
    [100000001, 33],
    [100000002, 33],
    [100000003, 17],
    [100000004, 33],
  ]) {
    db.run("INSERT INTO datas VALUES (?, 1, 0, 0, ?, 1000, 1000, 4, 1, 1, 0)", [
      id,
      type,
    ]);
    db.run("INSERT INTO texts VALUES (?, ?, '')", [id, `超先行测试 ${id}`]);
  }
  resources.databases.preRelease = db.export().slice().buffer as ArrayBuffer;
  db.close();
  const scriptFiles: Record<string, string> = {
    "c100000001.lua": `
function c100000001.initial_effect(c)
  Duel.LoadScript("pre-release-helper.lua")
  local e=Effect.CreateEffect(c)
  e:SetType(2050)
  e:SetRange(1)
  e:SetCode(1040)
  e:SetOperation(function()
    if not PreReleaseFixtureApplied then
      PreReleaseFixtureApplied=true
      Duel.CreateToken(0,100000002)
    end
  end)
  c:RegisterEffect(e)
end
`,
    "pre-release-helper.lua": `
function PreReleaseFixtureUpdateLP()
  Duel.SetLP(1,7999)
end
`,
    "c100000002.lua": `
function c100000002.initial_effect(c)
  PreReleaseFixtureUpdateLP()
end
`,
    "c100000004.lua": "error('unused card must not load')",
  };
  const zip = await JSZip.loadAsync(resources.scripts[0]);
  zip.file("script/c100000001.lua", "error('stale release script')");
  resources.scripts[0] = await zip.generateAsync({ type: "arraybuffer" });
  for (const [filename, script] of Object.entries(scriptFiles))
    zip.file(`script/${filename}`, script);
  const reference = {
    ...resources,
    scripts: [await zip.generateAsync({ type: "arraybuffer" })],
  };
  return { resources, scriptFiles, reference };
}

/** 由独立的内核会话记录结束回合与连锁放弃，生成能正常到达胜负的录像。 */
export async function finishedReplayFixture(
  resources: Awaited<ReturnType<typeof localReplayResources>>,
  options: Parameters<typeof replayFixture>[0] = {},
) {
  const yrp = new YGOProYrp().fromYrp(
    new Uint8Array(replayFixture({ ...options, responses: [] })),
  );
  const wrapper = await createOcgcoreWrapper();
  const SQL = await initSqlJs();
  wrapper
    .setScriptReader(await ZipScriptReader(...resources.scripts))
    .setCardReader(
      SqljsCardReader(
        SQL,
        ...[resources.databases.release, resources.databases.preRelease].map(
          (bytes) => new Uint8Array(bytes),
        ),
      ),
    );
  const engineReplay = new YGOProYrp({
    ...yrp,
    header: yrp.header
      ? Object.assign(new ReplayHeader(), yrp.header, {
          seed:
            yrp.header.id === 0x31707279
              ? yrp1DuelSeed(yrp.header.seed)
              : yrp.header.seed,
        })
      : undefined,
    clientDeck: yrp.isTag ? yrp.tagClientDeck : yrp.clientDeck,
    tagClientDeck: yrp.isTag ? yrp.clientDeck : yrp.tagClientDeck,
  });
  const { duel } = createDuelFromYrp(wrapper, engineReplay);
  try {
    for (let batch = 0; batch < 500; batch++) {
      const result = duel.process();
      if (
        result.status === 2 ||
        result.messages?.some((message) => message.identifier === 5)
      )
        return yrp.toYrp().slice().buffer as ArrayBuffer;
      for (const message of result.messages ?? []) {
        if (!(message instanceof YGOProMsgResponseBase)) continue;
        const response =
          message instanceof YGOProMsgSelectChain
            ? -1
            : message instanceof YGOProMsgSelectIdleCmd
            ? 7
            : undefined;
        if (response === undefined)
          throw new Error(`Unexpected fixture input: ${message.identifier}`);
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setInt32(0, response, true);
        yrp.responses.push(bytes);
        duel.setResponse(bytes);
      }
    }
    throw new Error("Fixture duel did not end");
  } finally {
    duel.endDuel();
    wrapper.finalize();
  }
}
