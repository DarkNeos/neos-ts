import { proxy } from "valtio";
import { playMat } from "./playMat";
import { modal } from "./modal";

export const duelStore = proxy({
  playMat,
  modal,
});
