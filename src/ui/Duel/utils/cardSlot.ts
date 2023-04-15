import { Vector3 } from "@babylonjs/core";

import NeosConfig from "../../../../neos.config.json";

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
