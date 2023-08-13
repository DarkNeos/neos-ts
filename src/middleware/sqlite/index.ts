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

export interface sqliteAction {
  cmd: sqliteCmd;
  // 初始化DB需要业务方传入的数据
  initInfo?: {
    dbUrl: string;
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

let YGODB: Database | null = null;
const sqlPromise = initSqlJs({
  locateFile: (file) => `${NeosConfig.assetsPath}/${file}`,
});

// FIXME: 应该有个返回值，告诉业务方本次请求的结果，比如初始化DB失败
export default async function (action: sqliteAction): Promise<sqliteResult> {
  switch (action.cmd) {
    case sqliteCmd.INIT: {
      const info = action.initInfo;
      if (info) {
        const dataPromise = pfetch(info.dbUrl, {
          progressCallback: action.initInfo?.progressCallback,
        }).then((res) => res.arrayBuffer()); // TODO: i18n

        const [SQL, buffer] = await Promise.all([sqlPromise, dataPromise]);
        YGODB = new SQL.Database(new Uint8Array(buffer));

        console.info("YGODB inited!");
      } else {
        console.warn("init YGODB action without initInfo");
      }

      return {};
    }
    case sqliteCmd.SELECT: {
      if (YGODB && action.payload && action.payload.id) {
        const code = action.payload.id;

        const dataStmt = YGODB.prepare("SELECT * FROM datas WHERE ID = $id");
        const dataResult = dataStmt.getAsObject({ $id: code });
        const textStmt = YGODB.prepare("SELECT * FROM texts WHERE ID = $id");
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
      if (YGODB && action.payload && action.payload.ftsParams) {
        const metas = invokeFts(YGODB, action.payload.ftsParams);

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
  text: CardText
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
