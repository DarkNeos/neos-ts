/*
 * 决斗页面
 *
 * */

import SimpleDuelPlateImpl from "./simpleDuel/mod";

export default function Duel() {
  return new SimpleDuelPlateImpl().render();
}
