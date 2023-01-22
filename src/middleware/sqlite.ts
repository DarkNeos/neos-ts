/*
 * Sqlite中间件
 *
 * 用于获取卡牌数据
 *
 * */

import initSqlJs, { Database } from "sql.js";

export enum sqliteCmd {
  // 初始化
  INIT,
  // 读取操作
  SELECT,
}

export interface sqliteAction {
  cmd: sqliteCmd;
  // 初始化DB需要业务方传入的数据
  initInfo?: {
    dbUrl: string;
  };
  // 需要读取卡牌数据的ID
  payload?: number;
}

let YGODB: Database | null = null;
const sqlPromise = initSqlJs({
  locateFile: (file) => `/node_modules/sql.js/dist/${file}`,
});

// FIXME: 应该有个返回值，告诉业务方本次请求的结果，比如初始化DB失败
export default async function (action: sqliteAction) {
  switch (action.cmd) {
    case sqliteCmd.INIT: {
      const info = action.initInfo;
      if (info) {
        const dataPromise = fetch(info.dbUrl).then((res) => res.arrayBuffer()); // TODO: i18n

        const [SQL, buffer] = await Promise.all([sqlPromise, dataPromise]);
        YGODB = new SQL.Database(new Uint8Array(buffer));
      }

      break;
    }
    case sqliteCmd.SELECT: {
      if (YGODB) {
        // TDOO
      } else {
        console.warn("ygo db not init!");
      }

      break;
    }
    default: {
      console.warn(`Unhandled sqlite command: ${action.cmd}`);

      break;
    }
  }
}
