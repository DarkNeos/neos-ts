import { ygopro } from "../idl/ocgcore";

// YGOPro 协议使用 1=剪刀、2=石头、3=布，内部枚举的前两项相反。
export const decodeHand = (value: number): ygopro.HandType => {
  switch (value) {
    case 1:
      return ygopro.HandType.SCISSORS;
    case 2:
      return ygopro.HandType.ROCK;
    case 3:
      return ygopro.HandType.PAPER;
    default:
      return ygopro.HandType.UNKNOWN;
  }
};
