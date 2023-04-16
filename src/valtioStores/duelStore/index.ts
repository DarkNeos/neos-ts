import { proxy } from "valtio";
import { playMat } from "./playMat";

export const duelStore = proxy({
  playMat,
});
