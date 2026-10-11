import type { Database, SqlJsStatic } from "sql.js";

import type { CardData, CardText } from "../cards";

export interface CardDatabaseResources {
  release: ArrayBuffer;
  preRelease: ArrayBuffer;
}

/** 卡库来源、读取顺序与超先行脚本需求共用同一份资源。 */
export class CardSources {
  private readonly release: Database;
  private readonly preRelease: Database;
  readonly resources: CardDatabaseResources;

  constructor(SQL: SqlJsStatic, resources: CardDatabaseResources) {
    this.resources = resources;
    if (!resources.release?.byteLength || !resources.preRelease?.byteLength)
      throw new Error("正式和超先行卡库必须全部加载完成");
    this.release = new SQL.Database(new Uint8Array(resources.release));
    try {
      this.preRelease = new SQL.Database(new Uint8Array(resources.preRelease));
    } catch (error) {
      this.release.close();
      throw error;
    }
  }

  readDisplayCard(code: number, superPreRelease: boolean) {
    const db = superPreRelease ? this.preRelease : this.release;
    const read = (table: "datas" | "texts") => {
      const statement = db.prepare(`SELECT * FROM ${table} WHERE id = $id`);
      try {
        return statement.getAsObject({ $id: code });
      } finally {
        statement.free();
      }
    };
    return { data: read("datas") as CardData, text: read("texts") as CardText };
  }

  search<T>(query: (db: Database) => T[]): T[] {
    return [...query(this.release), ...query(this.preRelease)];
  }

  /** 内核按首个命中读取，保留正式卡库优先的现有规则。 */
  coreBuffers() {
    return [this.resources.release, this.resources.preRelease].map(
      (bytes) => new Uint8Array(bytes),
    );
  }

  /** 展示分类来自 JSON；Lua 需求来自卡片类型，两者独立。 */
  preReleaseScriptCards(): ReadonlySet<number> {
    const ids = new Set<number>();
    for (const [id, value] of this.preRelease.exec(
      "SELECT id, type FROM datas",
    )[0]?.values ?? []) {
      const type = Number(value);
      const normal = 0x10;
      const token = 0x4000;
      const pendulum = 0x1000000;
      if (!(type & token) && (!(type & normal) || type & pendulum))
        ids.add(Number(id));
    }
    return ids;
  }

  close() {
    this.release.close();
    this.preRelease.close();
  }
}
