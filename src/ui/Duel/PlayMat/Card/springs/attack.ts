import { ygopro } from "@/api";
import { CardType } from "@/stores";

import { SpringApi } from "./types";

export const attack = async (props: {
  card: CardType;
  api: SpringApi;
  target?: ygopro.CardLocation;
  directAttack: boolean;
}) => {
  // TODO
};
