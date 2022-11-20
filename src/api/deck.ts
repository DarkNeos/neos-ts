import axios from "axios";

export interface IDeck {
  main?: number[];
  extra?: number[];
  side?: number[];
}

/*
 * 返回卡组资源。
 *
 * @param deck- 卡组名称
 * @returns 卡组数据
 *
 * */
export async function fetchDeck(deck: string): Promise<IDeck> {
  const res = await axios.get<IDeck>("http://localhost:3030/deck/" + deck);

  return res.data;
}
