/*
 * Sqlite中间件
 *
 * 用于获取卡牌数据
 *
 * */

import initSqlJs, { Database } from "sql.js";
import { CardMeta, CardData, CardText } from "../api/cards";

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
  };
  // 需要读取卡牌数据的ID
  payload?: {
    id?: number;
    query?: string;
  };
}

export interface sqliteResult {
  selectResult?: CardMeta;
  ftsResult?: CardMeta[];
}

let YGODB: Database | null = null;
const sqlPromise = initSqlJs({
  locateFile: (file) => `/node_modules/sql.js/dist/${file}`,
});

// FIXME: 应该有个返回值，告诉业务方本次请求的结果，比如初始化DB失败
export default async function (action: sqliteAction): Promise<sqliteResult> {
  switch (action.cmd) {
    case sqliteCmd.INIT: {
      const info = action.initInfo;
      if (info) {
        const dataPromise = fetch(info.dbUrl).then((res) => res.arrayBuffer()); // TODO: i18n

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
        console.warn("ygo db not init or id not provied!");
      }

      return {};
    }
    case sqliteCmd.FTS: {
      if (YGODB && action.payload && action.payload.query) {
        const query = action.payload.query;
        const ftsTexts: CardText[] = [];
        const ftsMetas: CardMeta[] = [];

        const textStmt = YGODB.prepare(
          "SELECT * FROM texts WHERE name LIKE '%$query%'"
        );
        textStmt.bind({ $query: query });
        while (textStmt.step()) {
          const row = textStmt.getAsObject();
          ftsTexts.push(row);
        }

        for (const text of ftsTexts) {
          const id = text.id;

          if (id) {
            const dataStmt = YGODB.prepare(
              "SELECT * FROM datas WHERE ID = $id"
            );
            const data: CardData = dataStmt.getAsObject({ $id: id });

            ftsMetas.push({ id, data, text });
          }
        }

        return { ftsResult: ftsMetas };
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

function constructCardMeta(
  id: number,
  data: initSqlJs.ParamsObject,
  text: initSqlJs.ParamsObject
): CardMeta {
  return {
    id,
    data,
    text,
  };
}
