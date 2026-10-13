import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

import initSqlJs from "sql.js";

import { CardSources } from "../../src/api/ocgcore/cardSources.ts";
import { localReplayResources } from "../helpers/localReplayResources.ts";

test("display classification and core precedence remain independent when card IDs overlap", async () => {
  const resources = await localReplayResources();
  const SQL = await initSqlJs();
  const db = new SQL.Database(new Uint8Array(resources.databases.preRelease));
  db.run(
    "INSERT INTO datas VALUES (89631139, 1, 0, 0, 33, 123, 123, 4, 1, 1, 0); INSERT INTO texts VALUES (89631139, '超先行版本', '');",
  );
  resources.databases.preRelease = db.export().slice().buffer;
  db.close();
  const sources = new CardSources(SQL, resources.databases);
  try {
    assert.equal(sources.readDisplayCard(89631139, true).data.atk, 123);
    assert.equal(sources.readDisplayCard(89631139, false).data.atk, 3000);
    const require = createRequire(import.meta.url);
    const { SqljsCardReader } = require("koishipro-core.js");
    const reader = SqljsCardReader(SQL, ...sources.coreBuffers());
    assert.equal(reader.apply(89631139).attack, 3000);
    assert.equal(sources.preReleaseScriptCards().has(89631139), true);
  } finally {
    sources.close();
  }
});

test("Lua requirements include effects and normal pendulums but exclude normal monsters and tokens", async () => {
  const resources = await localReplayResources();
  const SQL = await initSqlJs();
  const db = new SQL.Database(new Uint8Array(resources.databases.preRelease));
  for (const [id, type] of [
    [1, 17],
    [2, 33],
    [3, 0x1000011],
    [4, 0x4001],
  ])
    db.run("INSERT INTO datas VALUES (?, 1, 0, 0, ?, 0, 0, 4, 1, 1, 0)", [
      id,
      type,
    ]);
  resources.databases.preRelease = db.export().slice().buffer;
  db.close();
  const sources = new CardSources(SQL, resources.databases);
  try {
    assert.deepEqual([...sources.preReleaseScriptCards()], [2, 3]);
  } finally {
    sources.close();
  }
});

test("search retains both sources and absent display cards stay absent", async () => {
  const resources = await localReplayResources();
  const SQL = await initSqlJs();
  const sources = new CardSources(SQL, resources.databases);
  try {
    assert.deepEqual(
      sources.search(
        (db) =>
          db
            .exec("SELECT id FROM datas ORDER BY id")[0]
            ?.values.map(([id]) => id) ?? [],
      ),
      [46986414, 89631139],
    );
    assert.equal(sources.readDisplayCard(89631139, true).data.atk, undefined);
    assert.equal(sources.readDisplayCard(999, false).data.atk, undefined);
  } finally {
    sources.close();
  }
});

test("a missing source cannot be exposed as ready", async () => {
  const resources = await localReplayResources();
  const SQL = await initSqlJs();
  assert.throws(
    () =>
      new CardSources(SQL, {
        ...resources.databases,
        preRelease: new ArrayBuffer(0),
      }),
    /全部加载完成/,
  );
});
