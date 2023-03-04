import { InteractType } from "../../reducers/duel/generic";
import NeosConfig from "../../../neos.config.json";
import { Vector3 } from "@babylonjs/core";

export function zip<S1, S2>(
  firstCollection: Array<S1>,
  lastCollection: Array<S2>
): Array<[S1, S2]> {
  const length = Math.min(firstCollection.length, lastCollection.length);
  const zipped: Array<[S1, S2]> = [];

  for (let index = 0; index < length; index++) {
    zipped.push([firstCollection[index], lastCollection[index]]);
  }

  return zipped;
}

export function interactTypeToString(t: InteractType): string {
  switch (t) {
    case InteractType.SUMMON: {
      return "普通召唤";
    }
    case InteractType.SP_SUMMON: {
      return "特殊召唤";
    }
    case InteractType.POS_CHANGE: {
      return "改变表示形式";
    }
    case InteractType.MSET: {
      return "前场放置";
    }
    case InteractType.SSET: {
      return "后场放置";
    }
    case InteractType.ACTIVATE: {
      return "发动效果";
    }
    case InteractType.ATTACK: {
      return "攻击";
    }
    default: {
      return "未知选项";
    }
  }
}

const cardRotation = NeosConfig.ui.card.rotation;
const cardReverseRotation = NeosConfig.ui.card.reverseRotation;
const cardDefenceRotation = NeosConfig.ui.card.defenceRotation;

export function cardSlotRotation(reverse?: boolean) {
  if (reverse) {
    return new Vector3(
      cardReverseRotation.x,
      cardReverseRotation.y,
      cardReverseRotation.z
    );
  } else {
    return new Vector3(cardRotation.x, cardRotation.y, cardRotation.z);
  }
}

export function cardSlotDefenceRotation() {
  return new Vector3(
    cardDefenceRotation.x,
    cardDefenceRotation.y,
    cardDefenceRotation.z
  );
}
