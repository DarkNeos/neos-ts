/*
 * Sqlite中间件
 *
 * 用于获取卡牌数据
 *
 * */

import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

import { isSuperReleaseCard } from "@/api";
import { CardData, CardMeta, CardText } from "@/api/cards";
import { CardSources } from "@/api/ocgcore/cardSources";
import { TYPE_LINK } from "@/common";
import { pfetch } from "@/infra";
import { cachedBinary } from "@/infra/resourceCache";

import { FtsParams, invokeFts } from "./fts";

export enum sqliteCmd {
  // 初始化
  INIT,
  // 读取操作
  SELECT,
  // 全文搜索
  FTS,
}

export interface sqliteAction<T extends sqliteCmd> {
  cmd: T;
  // 初始化DB需要业务方传入的数据
  initInfo?: {
    releaseDbUrl: string;
    preReleaseDbUrl: string;
    preReleaseDbVersion?: string;
    progressCallback?: (progress: number) => void; // 用于获取读取进度
  };
  payload?: {
    id?: number; // 卡牌ID
    ftsParams?: FtsParams; // 用于全文检索的参数
  };
}

export interface sqliteResult {
  selectResult?: CardMeta;
  ftsResult?: CardMeta[];
}

let sqlPromise: ReturnType<typeof initSqlJs> | undefined;
let sqlWasm: ArrayBuffer | undefined;
let cardSources: CardSources | undefined;

export function getReplaySqlResources() {
  if (!sqlWasm || !cardSources) throw new Error("卡片数据库尚未加载完成");
  return { sqlWasm, databases: cardSources.resources };
}
// 多个初始化共用 WASM 加载，失败时清除缓存，让重新加载资源能够再次请求。
const loadSql = () => {
  if (!sqlPromise) {
    sqlPromise = pfetch(sqlWasmUrl)
      .then((response) => response.arrayBuffer())
      .then((wasmBinary) => {
        sqlWasm = wasmBinary;
        return initSqlJs({ wasmBinary });
      })
      .catch((error) => {
        sqlPromise = undefined;
        throw error;
      });
  }
  return sqlPromise;
};

export default function <T extends sqliteCmd>(
  action: sqliteAction<T>,
): T extends sqliteCmd.INIT ? Promise<void> : sqliteResult {
  return helper(action) as any;
}

//It currently only supports en-US, es-ES, ja-JP, ko-KR, zh-CN
// Function to update URLs based on the language
function updateDbUrls(info: any, language: string): void {
  const languageMap: { [key: string]: string } = {
    en: "en-US",
    br: "en-US",
    pt: "en-US",
    fr: "en-US",
    ja: "ja-JP",
    ko: "ko-KR",
    es: "es-ES",
  };

  const locale = languageMap[language] || "zh-CN";
  info.releaseDbUrl = info.releaseDbUrl.replace("zh-CN", locale);
  info.preReleaseDbUrl = info.preReleaseDbUrl.replace("zh-CN", locale);
}

// FIXME: 应该有个返回值，告诉业务方本次请求的结果，比如初始化DB失败
function helper<T extends sqliteCmd>(action: sqliteAction<T>) {
  switch (action.cmd) {
    case sqliteCmd.INIT: {
      const info = action.initInfo;
      if (info) {
        const language = localStorage.getItem("language") || "cn";
        // Update URLs based on the language
        updateDbUrls(info, language);

        const download = (url: string, version?: string) =>
          cachedBinary(url, {
            version,
            progress: action.initInfo?.progressCallback,
            validate: (bytes) => {
              if (
                new TextDecoder().decode(
                  new Uint8Array(bytes, 0, Math.min(16, bytes.byteLength)),
                ) !== "SQLite format 3\0"
              )
                throw new Error("卡片数据库格式无效，请重试");
            },
          });
        const releasePromise = download(info.releaseDbUrl);
        const preReleasePromise = download(
          info.preReleaseDbUrl,
          info.preReleaseDbVersion,
        );

        // 等 WASM 和两份数据库全部下载完成再替换，避免下载失败时只加载了其中一份。
        return Promise.all([loadSql(), releasePromise, preReleasePromise]).then(
          ([SQL, releaseBuffer, preReleaseBuffer]) => {
            const next = new CardSources(SQL, {
              release: releaseBuffer,
              preRelease: preReleaseBuffer,
            });
            const previous = cardSources;
            cardSources = next;
            previous?.close();

            console.log("YGODB inited!");
          },
        );
      } else {
        console.warn("init YGODB action without initInfo");
        return {};
      }
    }
    case sqliteCmd.SELECT: {
      if (cardSources && action.payload && action.payload.id) {
        const code = action.payload.id;

        const { data, text } = cardSources.readDisplayCard(
          code,
          isSuperReleaseCard(code),
        );

        return {
          selectResult: constructCardMeta(code, data, text),
        };
      } else {
        if (action.payload?.id !== 0) {
          // 0是无效的卡片ID，不需要报错，返回空即可
          console.warn("ygo db not init or id not provied!");
        }
      }

      return {};
    }
    case sqliteCmd.FTS: {
      if (cardSources && action.payload && action.payload.ftsParams) {
        const params = action.payload.ftsParams;
        const metas = cardSources.search((db) => invokeFts(db, params));

        return { ftsResult: metas };
      } else {
        console.warn("ygo db not init or query not provied!");
      }

      return {};
    }
    default: {
      console.warn(`Unhandled sqlite command: ${action.cmd}`);

      return {};
    }
  }
}

export function constructCardMeta(
  id: number,
  data: CardData,
  text: CardText,
): CardMeta {
  const level = data.level ?? 0;
  data.level = level & 0xff;
  if ((data.type ?? 0) & TYPE_LINK) {
    data.link = data.level;
    data.linkMarkers = data.def ?? 0;
  }
  data.lscale = (level >> 24) & 0xff;
  data.rscale = (level >> 16) & 0xff;

  return {
    id,
    data,
    text,
  };
}
