import axios from "axios";

interface CardMeta {
  id: number;
  data: {
    ot?: number;
    setcode?: number;
    type_?: number;
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

interface CardTransform {
  position?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
  };
}

/*
 * `Neos`中表示卡牌的通用结构
 * */
export interface Card {
  meta: CardMeta;
  transform: CardTransform;
}

/*
 * 返回卡片元数据
 *
 * @param id - 卡片id
 * @returns 卡片数据
 *
 * */
export async function fetchCard(id: number): Promise<CardMeta> {
  const res = await axios.get<CardMeta>("http://localhost:3030/cards/" + id);

  return res.data;
}
