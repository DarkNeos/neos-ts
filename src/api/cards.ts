import axios from "axios";

export interface CardMeta {
  id: number;
  data: {
    ot?: number;
    setcode?: number;
    type?: number;
    atk?: number;
    def?: number;
    level?: number;
    race?: number;
    attribute?: number;
  };
  text: {
    name?: string;
    types?: string;
    desc?: string;
  };
}

/*
 * 返回卡片元数据
 *
 * @param id - 卡片id
 * @returns 卡片数据
 *
 * */
export async function fetchCard(id: number): Promise<CardMeta> {
  const res = await axios.get<CardMeta>("https://ygocdb.com/api/v0/card/" + id);

  return res.data;
}
