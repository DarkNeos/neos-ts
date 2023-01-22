import {
  AsyncThunk,
  CaseReducer,
  createAsyncThunk,
  PayloadAction,
} from "@reduxjs/toolkit";
import { CardMeta } from "../../api/cards";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { fetchCard } from "../../api/cards";
import { DuelState } from "./mod";

export type DuelReducer<T> = CaseReducer<DuelState, PayloadAction<T>>;

export interface DuelFieldState {
  inner: CardState[];
}

export interface CardState {
  occupant?: CardMeta; // 占据此位置的卡牌元信息
  location: {
    controler: number;
    location?: number;
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
  // 可攻击
  ATTACK = 8,
}

export interface Interactivity<T> {
  interactType: InteractType;
  // 如果`interactType`是`ACTIVATE`，这个字段是对应的效果编号
  activateIndex?: number;
  // 如果`interactType`是`ATTACK`，这个字段表示是否可以直接攻击
  directAttackAble?: boolean;
  // 用户点击后，需要回传给服务端的`response`
  response: T;
}

export function createAsyncMetaThunk(name: string): AsyncThunk<
  { controler: number; sequence: number; meta: CardMeta },
  {
    controler: number;
    sequence: number;
    position?: ygopro.CardPosition;
    code: number;
  },
  {}
> {
  return createAsyncThunk(
    name,
    async (param: {
      controler: number;
      sequence: number;
      position?: ygopro.CardPosition;
      code: number;
    }) => {
      const code = param.code;

      const meta = await fetchCard(code, true);
      const response = {
        controler: param.controler,
        sequence: param.sequence,
        meta,
      };

      return response;
    }
  );
}

export function createAsyncRepeatedMetaThunk(
  name: string
): AsyncThunk<
  { controler: number; metas: CardMeta[] },
  { controler: number; codes: number[] },
  {}
> {
  return createAsyncThunk(
    name,
    async (param: { controler: number; codes: number[] }) => {
      const controler = param.controler;
      const Ids = param.codes;

      const metas = await Promise.all(
        Ids.map(async (id) => {
          if (id == 0) {
            return { id, data: {}, text: {} };
          } else {
            return await fetchCard(id, true);
          }
        })
      );
      const response = { controler, metas };

      return response;
    }
  );
}

export function extendState<T extends DuelFieldState>(
  state: T | undefined,
  newState: CardState
) {
  if (state) {
    state.inner.push(newState);
  }
}

export function extendOccupant<T extends DuelFieldState>(
  state: T | undefined,
  newMeta: CardMeta,
  sequence: number,
  position?: ygopro.CardPosition
) {
  if (state) {
    const target = state.inner.find((_, idx) => idx == sequence);
    if (target) {
      target.occupant = newMeta;
      if (position) {
        target.location.position = position;
      }
    }
  }
}

export function extendMeta<T extends DuelFieldState>(
  state: T | undefined,
  newMeta: CardMeta,
  sequence: number
) {
  if (state) {
    const target = state.inner.find((_, idx) => idx == sequence);
    if (target) {
      target.occupant = newMeta;
    }
  }
}

export function extendPlaceInteractivity<T extends DuelFieldState>(
  state: T | undefined,
  controler: number,
  sequence: number,
  zone: ygopro.CardZone
) {
  if (state) {
    const target = state.inner.find((_, idx) => idx == sequence);
    if (target) {
      target.placeInteractivities = {
        interactType: InteractType.PLACE_SELECTABLE,
        response: {
          controler,
          zone,
          sequence,
        },
      };
    }
  }
}

export function clearPlaceInteractivities<T extends DuelFieldState>(
  state: T | undefined
) {
  if (state) {
    for (let item of state.inner) {
      item.placeInteractivities = undefined;
    }
  }
}

export function removeCard<T extends DuelFieldState>(
  state: T | undefined,
  sequence: number
) {
  if (state) {
    state.inner = state.inner.filter((_, idx) => idx != sequence);
  }
}

export function removeOccupant<T extends DuelFieldState>(
  state: T | undefined,
  sequence: number
) {
  if (state) {
    const target = state.inner.find((_, idx) => idx == sequence);
    if (target) {
      target.occupant = undefined;
    }
  }
}

export function insertCard<T extends DuelFieldState>(
  state: T | undefined,
  sequence: number,
  card: CardState
) {
  if (state) {
    state.inner.splice(sequence, 0, card);
  }
}

export function updateCardMeta<T extends DuelFieldState>(
  state: T | undefined,
  metas: CardMeta[]
) {
  if (state) {
    state.inner.forEach((item) => {
      metas.forEach((meta) => {
        if (item.occupant?.id === meta.id) {
          item.occupant = meta;
        }
      });
    });
  }
}

export function extendIdleInteractivities<T extends DuelFieldState>(
  state: T | undefined,
  sequence: number,
  interactivity: Interactivity<number>
) {
  if (state) {
    const target = state.inner.find((_, idx) => idx == sequence);
    if (target) {
      target.idleInteractivities.push(interactivity);
    }
  }
}

export function clearIdleInteractivities<T extends DuelFieldState>(
  state: T | undefined
) {
  if (state) {
    state.inner.forEach((item) => {
      item.idleInteractivities = [];
    });
  }
}

export function setPosition<T extends DuelFieldState>(
  state: T | undefined,
  sequence: number,
  position: ygopro.CardPosition
) {
  const target = state?.inner.find((_, idx) => idx == sequence);
  if (target && target.occupant) {
    target.location.position = position;
  }
}
