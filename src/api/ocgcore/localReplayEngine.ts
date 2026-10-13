import {
  createDuelFromYrp,
  createOcgcoreWrapper,
  OcgcoreMessageType,
  type ScriptReaderFn,
  SqljsCardReader,
  ZipScriptReader,
} from "koishipro-core.js";
import ocgcoreWasmUrl from "koishipro-core-assets/libocgcore.wasm?url";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import {
  YGOProMsgResponseBase,
  YGOProMsgStart,
  YGOProMsgTagSwap,
  YGOProMsgUpdateData,
} from "ygopro-msg-encode";
import { ReplayHeader, YGOProYrp } from "ygopro-yrp-encode";
import {
  writeYrp3dPackets,
  type YGOProYrp3dRawPacket,
} from "ygopro-yrp3d-encode";

import { CardSources } from "./cardSources";
import { createPreReleaseScriptReader } from "./preReleaseScripts";
import { yrp1DuelSeed } from "./replaySeed";
import type { ReplayResources } from "./replayWorker";

function namesPacket(yrp: YGOProYrp, activeTag = [false, false]): Uint8Array {
  const host = activeTag[0] ? yrp.tagHostName ?? yrp.hostName : yrp.hostName;
  const client = yrp.isTag
    ? activeTag[1]
      ? yrp.clientName
      : yrp.tagClientName ?? yrp.clientName
    : yrp.clientName;
  const names = [
    host,
    yrp.tagHostName ?? "",
    host,
    client,
    yrp.clientName,
    client,
  ];
  const bytes = new Uint8Array(600);
  const view = new DataView(bytes.buffer);
  names.forEach((name, index) => {
    for (let i = 0; i < Math.min(name.length, 49); i++)
      view.setUint16(index * 100 + i * 2, name.charCodeAt(i), true);
  });
  return bytes;
}

/** 每个 process 批次结束后刷新场地，避免在批次中提前显示最终状态。 */
export async function renderYrp(
  yrp: YGOProYrp,
  original: ArrayBuffer,
  resources: ReplayResources,
  progress: (text: string) => void,
): Promise<ArrayBuffer> {
  const [SQL, scripts] = await Promise.all([
    initSqlJs({ wasmBinary: resources.sqlWasm }),
    ZipScriptReader(...resources.scripts),
  ]);
  const sources = new CardSources(SQL, resources.databases);
  try {
    const reader = createPreReleaseScriptReader(
      scripts,
      resources.preReleaseScriptsUrl
        ? sources.preReleaseScriptCards()
        : new Set<number>(),
      resources.preReleaseScriptsUrl,
      progress,
      resources.preReleaseVersionUrl,
    );
    // 新依赖可能在效果处理中才出现；丢弃未完成的演算，按原种子和响应重新开始。
    while (true) {
      try {
        return await renderWithScripts(
          yrp,
          original,
          progress,
          SQL,
          sources,
          reader.read,
          reader.assertReady,
        );
      } catch (error) {
        if (!(await reader.loadMissing())) throw error;
      }
    }
  } finally {
    sources.close();
  }
}

async function renderWithScripts(
  yrp: YGOProYrp,
  original: ArrayBuffer,
  progress: (text: string) => void,
  SQL: SqlJsStatic,
  sources: CardSources,
  scripts: ScriptReaderFn,
  assertScriptsReady: () => void,
): Promise<ArrayBuffer> {
  const wrapper = await createOcgcoreWrapper({
    locateFile: () => ocgcoreWasmUrl,
  });
  let scriptError = "";
  wrapper.setMessageHandler((_duel, message, type) => {
    if (type === OcgcoreMessageType.ScriptError) scriptError ||= message;
  });
  try {
    const cardReader = SqljsCardReader(SQL, ...sources.coreBuffers());
    wrapper.setCardReader(cardReader).setScriptReader(scripts);
    for (const deck of [
      yrp.hostDeck,
      yrp.tagHostDeck,
      yrp.tagClientDeck,
      yrp.clientDeck,
    ]) {
      for (const code of [...(deck?.main ?? []), ...(deck?.extra ?? [])]) {
        if (!code) throw new Error("录像含有缺失卡号，无法完整重演");
        if (!cardReader.apply(code))
          throw new Error(`卡片数据库缺少卡号 ${code}，无法重演录像`);
      }
    }
    if (yrp.singleScript && !scripts(`./single/${yrp.singleScript}`))
      throw new Error(`缺少残局脚本 ${yrp.singleScript}，无法重演录像`);
    const replay = new YGOProYrp({
      ...yrp,
      header: yrp.header
        ? Object.assign(new ReplayHeader(), yrp.header)
        : undefined,
      // YRP 的第三副卡组先出场；当前内核库的 clientDeck 参数表示先出场者。
      clientDeck: yrp.isTag ? yrp.tagClientDeck : yrp.clientDeck,
      tagClientDeck: yrp.isTag ? yrp.clientDeck : yrp.tagClientDeck,
    });
    if (replay.header?.id === 0x31707279)
      replay.header.seed = yrp1DuelSeed(replay.header.seed);
    const { duel } = createDuelFromYrp(wrapper, replay);
    try {
      assertScriptsReady();
      const records: YGOProYrp3dRawPacket[] = [];
      let outputSize = 0;
      const append = (raw: Uint8Array) => {
        if (!raw.length) return;
        outputSize += raw.length + 4;
        if (records.length >= 200_000 || outputSize > 128 * 1024 * 1024)
          throw new Error("录像消息过多，无法在浏览器中加载");
        records.push({ type: raw[0], payload: raw.slice(1) });
      };
      const start = new YGOProMsgStart();
      start.playerType = 0;
      start.duelRule = (yrp.opt >>> 16) & 0xff;
      start.startLp0 = start.startLp1 = yrp.startLp;
      start.player0 = {
        deckCount: duel.queryFieldCount({ player: 0, location: 1 }),
        extraCount: duel.queryFieldCount({ player: 0, location: 64 }),
      };
      start.player1 = {
        deckCount: duel.queryFieldCount({ player: 1, location: 1 }),
        extraCount: duel.queryFieldCount({ player: 1, location: 64 }),
      };
      append(start.toPayload());
      records.push({ type: 235, payload: namesPacket(yrp) });
      const snapshots = new Map<string, Uint8Array>();
      const activeTag = [false, false];
      const refresh = () => {
        for (const player of [0, 1])
          for (const location of [1, 2, 4, 8, 16, 32, 64]) {
            const { cards } = duel.queryFieldCard({
              player,
              location,
              queryFlag: 0xefffff,
              useCache: 0,
            });
            const update = new YGOProMsgUpdateData();
            update.player = player;
            update.location = location;
            update.cards = cards;
            // 原生四字节空位转换成显式清除，定位重建时也能清理旧卡。
            for (const card of cards)
              if (card.queryLength === 4) card.queryLength = 8;
            const raw = update.toPayload();
            const key = `${player}:${location}`;
            const previous = snapshots.get(key);
            if (
              !previous ||
              raw.length !== previous.length ||
              raw.some((byte, i) => byte !== previous[i])
            ) {
              append(raw);
              snapshots.set(key, raw);
            }
          }
      };
      refresh();
      let response = 0;
      let complete = false;
      playback: for (let batch = 0; batch < 100_000; batch++) {
        const result = duel.process();
        assertScriptsReady();
        const messages = result.messages ?? [];
        if (
          messages.reduce(
            (size, message) => size + message.toPayload().length,
            0,
          ) !== result.raw.length
        )
          throw new Error("内核生成了无法完整解析的录像消息");
        for (const message of messages) {
          if (message.identifier === 1)
            throw new Error("录像操作与当前内核或脚本不匹配，无法重演");
          append(message.toPayload());
        }
        if (scriptError)
          throw new Error(`录像脚本执行失败：${scriptError.slice(0, 240)}`);
        if (messages.some((message) => message.identifier === 161)) {
          for (const message of messages)
            if (message instanceof YGOProMsgTagSwap)
              activeTag[message.player] = !activeTag[message.player];
          append(duel.queryFieldInfo().field.toPayload());
          records.push({ type: 235, payload: namesPacket(yrp, activeTag) });
          snapshots.clear();
        }
        refresh();
        if (
          result.status === 2 ||
          messages.some((message) => message.identifier === 5)
        ) {
          if (response < yrp.responses.length)
            throw new Error("录像提前结束，操作记录与当前内核或脚本不匹配");
          complete = true;
          break;
        }
        for (const message of messages)
          if (message instanceof YGOProMsgResponseBase) {
            const value = yrp.responses[response];
            // 投降或断开时没有内核胜负消息，与原客户端一样在操作记录末尾结束。
            if (!value) {
              complete = true;
              break playback;
            }
            response++;
            duel.setResponse(value);
          }
        if (batch % 100 === 0) {
          progress(
            `正在本地重演录像：${Math.min(response, yrp.responses.length)}/${
              yrp.responses.length
            } 个操作`,
          );
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
      if (!complete) throw new Error("录像演算未正常结束");
      assertScriptsReady();
      records.push({ type: 231, payload: new Uint8Array(original) });
      return writeYrp3dPackets(records).slice().buffer as ArrayBuffer;
    } finally {
      duel.endDuel();
    }
  } finally {
    wrapper.finalize();
  }
}
