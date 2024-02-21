/*
 * Sqlite中间件
 *
 * 用于获取卡牌数据
 *
 * */

import initSqlJs, { Database } from "sql.js";

import { CardData, CardMeta, CardText } from "@/api/cards";
import { useConfig } from "@/config";
import { pfetch } from "@/infra";
import { isSuperReleaseCard } from "@/superPreRelease";

import { FtsParams, invokeFts } from "./fts";

const NeosConfig = useConfig();

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

const sqlPromise = initSqlJs({
  locateFile: (file) => `${NeosConfig.assetsPath}/${file}`,
});

export default function <T extends sqliteCmd>(
  action: sqliteAction<T>,
): T extends sqliteCmd.INIT ? Promise<void> : sqliteResult {
  return helper(action) as any;
}

// TODO: may defining a class be better?
interface YgoDbs {
  release: Database | null;
  preRelease: Database | null;
}

let YGODBS: YgoDbs = { release: null, preRelease: null };

// FIXME: 应该有个返回值，告诉业务方本次请求的结果，比如初始化DB失败
function helper<T extends sqliteCmd>(action: sqliteAction<T>) {
  switch (action.cmd) {
    case sqliteCmd.INIT: {
      const info = action.initInfo;
      if (info) {
        const releasePromise = pfetch(info.releaseDbUrl, {
          progressCallback: action.initInfo?.progressCallback,
        }).then((res) => res.arrayBuffer()); // TODO: i18n
        const preReleasePromise = pfetch(info.preReleaseDbUrl, {
          progressCallback: action.initInfo?.progressCallback,
        }).then((res) => res.arrayBuffer());

        return Promise.all([
          sqlPromise,
          releasePromise,
          preReleasePromise,
        ]).then(([SQL, releaseBuffer, preReleaseBuffer]) => {
          YGODBS.release = new SQL.Database(new Uint8Array(releaseBuffer));
          YGODBS.preRelease = new SQL.Database(
            new Uint8Array(preReleaseBuffer),
          );

          console.log("YGODB inited!");
        });
      } else {
        console.warn("init YGODB action without initInfo");
        return {};
      }
    }
    case sqliteCmd.SELECT: {
      if (
        YGODBS.release &&
        YGODBS.preRelease &&
        action.payload &&
        action.payload.id
      ) {
        const code = action.payload.id;

        const db = isSuperReleaseCard(code)
          ? YGODBS.preRelease
          : YGODBS.release;

        const dataStmt = db.prepare("SELECT * FROM datas WHERE ID = $id");
        const dataResult = dataStmt.getAsObject({ $id: code });
        const textStmt = db.prepare("SELECT * FROM texts WHERE ID = $id");
        const textResult = textStmt.getAsObject({ $id: code });

        return {
          selectResult: constructCardMeta(code, dataResult, textResult),
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
      if (
        YGODBS.release &&
        YGODBS.preRelease &&
        action.payload &&
        action.payload.ftsParams
      ) {
        const releaseMetas = invokeFts(
          YGODBS.release,
          action.payload.ftsParams,
        );
        const preReleaseMetas = invokeFts(
          YGODBS.preRelease,
          action.payload.ftsParams,
        );

        const metas = releaseMetas.concat(preReleaseMetas);

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
  data.lscale = (level >> 24) & 0xff;
  data.rscale = (level >> 16) & 0xff;

  return {
    id,
    data,
    text,
  };
}
