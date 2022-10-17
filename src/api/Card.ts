import axios from "axios";

export interface IDeck {
  main?: number[];
  extra?: number[];
  side?: number[];
}

export async function fetchDeck(deck: string): Promise<IDeck> {
  const res = await axios.get<IDeck>("http://localhost:3030/deck/" + deck);

  return res.data;
}
