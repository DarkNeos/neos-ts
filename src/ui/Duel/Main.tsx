import React from "react";

import {
  Alert,
  CardListModal,
  CardModal,
  CheckCardModal,
  CheckCounterModal,
  HintNotification,
  OptionModal,
  PositionModal,
  SortCardModal,
  YesNoModal,
} from "./Message";
import Mat from "./PlayMat";

const NeosDuel = () => {
  return (
    <>
      <Alert />
      <Mat />
      <CardModal />
      <CardListModal />
      <HintNotification />
      <CheckCardModal />
      <YesNoModal />
      <PositionModal />
      <OptionModal />
      <CheckCounterModal />
      <SortCardModal />
    </>
  );
};

export default NeosDuel;
