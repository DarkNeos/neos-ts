// TODO: this middleware should be managed under `Container`, too.
import { isNil } from "lodash-es";
import { Database } from "sql.js";

import { CardData, CardMeta, CardText } from "@/api";

import { constructCardMeta } from ".";
const TYPE_MONSTER = 0x1;

/** 过滤条件 */
export interface FtsConditions {
  levels: number[]; // 星阶/link值
  lscales: number[]; // 左刻度
  types: number[]; // 卡片类型
  races: number[]; // 种族
  attributes: number[]; // 属性
  atk: { min: number | null; max: number | null }; // 攻击力区间
  def: { min: number | null; max: number | null }; // 防御力区间
}

export const emptySearchConditions: FtsConditions = {
  atk: { min: null, max: null },
  def: { min: null, max: null },
  levels: [],
  lscales: [],
  races: [],
  attributes: [],
  types: [],
};

export interface FtsParams {
  query: string; // 用于全文检索的query
  conditions: FtsConditions; // 过滤条件
}

export function invokeFts(db: Database, params: FtsParams): CardMeta[] {
  const { query, conditions } = params;
  const ftsMetas: CardMeta[] = [];

  const queryList = query.trim().split(" ");

  const filterConditions = getFtsCondtions(conditions);
  const stmt = db.prepare(`
    SELECT datas.*, texts.*
    FROM datas
    INNER JOIN texts ON datas.id = texts.id
    WHERE (texts.name || texts.desc) LIKE $query
    ${filterConditions ? `AND ${filterConditions}` : ""}
  `);

  stmt.bind({ $query: `%${queryList.join("%")}%` });

  while (stmt.step()) {
    const row = stmt.getAsObject() as CardData & CardText;

    ftsMetas.push(constructCardMeta(row.id!, row, row));
  }

  return ftsMetas;
}

function getFtsCondtions(conditions: FtsConditions): string {
  const { types, levels, lscales, atk, def, races, attributes } = conditions;
  const assertMonster = `(type & ${TYPE_MONSTER}) > 0`;

  const typesCondition = types
    .map((type) => `(type & ${type}) > 0`)
    .join(" OR ");
  const levelsCondition = levels
    .map((level) => `(level & 0xff) = ${level}`)
    .join(" OR ");
  const lscalesCondition = lscales
    .map((lscale) => `((level >> 0x18) & 0xff) = ${lscale}`)
    .join(" OR ");
  const atkCondition =
    atk.min !== null || atk.max !== null
      ? `atk BETWEEN ${handleFinite(atk.min, "min")} AND ${handleFinite(
          atk.max,
          "max",
        )} AND ${assertMonster}`
      : undefined;
  const defCondition =
    def.min !== null || def.max !== null
      ? `def BETWEEN ${handleFinite(def.min, "min")} AND ${handleFinite(
          def.max,
          "max",
        )} AND ${assertMonster}`
      : undefined;
  const raceCondition = races.map((race) => `race = ${race}`).join(" OR ");
  const attributeCondition = attributes
    .map((attribute) => `attribute = ${attribute}`)
    .join(" OR ");

  const merged = [
    typesCondition,
    levelsCondition,
    lscalesCondition,
    atkCondition,
    defCondition,
    raceCondition,
    attributeCondition,
  ]
    .filter((condition) => condition !== undefined && condition !== "")
    .map((condition) => `(${condition})`)
    .join(" AND ");

  return merged;
}

function handleFinite(value: number | null, type: "min" | "max"): number {
  if (isNil(value)) return type === "min" ? -2 : 9999999;
  return value;
}
