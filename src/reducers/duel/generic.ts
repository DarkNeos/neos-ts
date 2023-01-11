import { CardMeta } from "../../api/cards";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";

export interface CardState {
  occupant?: CardMeta; // 占据此位置的卡牌元信息
  location: {
    controler: number;
    location?: number;
    sequence: number;
    position?: ygopro.CardPosition;
    overlay_sequence?: number;
  }; // 位置信息
  idleInteractivities: Interactivity<number>[]; // IDLE状态下的互动信息
  placeInteractivities?: Interactivity<{
    controler: number;
    zone: ygopro.CardZone;
    sequence: number;
  }>; // 选择位置状态下的互动信息
}

export enum InteractType {
  // 可普通召唤
  SUMMON = 1,
  // 可特殊召唤
  SP_SUMMON = 2,
  // 可改变表示形式
  POS_CHANGE = 3,
  // 可前场放置
  MSET = 4,
  // 可后场放置
  SSET = 5,
  // 可发动效果
  ACTIVATE = 6,
  // 可作为位置选择
  PLACE_SELECTABLE = 7,
}

export interface Interactivity<T> {
  interactType: InteractType;
  // 如果`interactType`是`ACTIVATE`，这个字段是对应的效果编号
  activateIndex?: number;
  // 用户点击后，需要回传给服务端的`response`
  response: T;
}
