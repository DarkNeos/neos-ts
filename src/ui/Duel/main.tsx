/*
 * 决斗页面
 *
 * */

import { RootState } from "../../store";
import SimpleDuelPlateImpl from "./simpleDuel/mod";
import { selectMeHands } from "../../reducers/duel/handsSlice";

export default function Duel() {
  const simpleDuelPlate = new SimpleDuelPlateImpl();

  // TODO: opHands
  const handsSelector = (state: RootState) => {
    const cards = selectMeHands(state).cards;

    return cards.map((item) => {
      return { code: item };
    });
  };

  simpleDuelPlate.registerHands(handsSelector);

  return simpleDuelPlate.render();
}
