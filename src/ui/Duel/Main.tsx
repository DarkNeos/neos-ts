import React from "react";

import {
  Alert,
  CardListModal,
  CardModal,
  CheckCardModal,
  CheckCardModalV2,
  CheckCardModalV3,
  CheckCounterModal,
  HintNotification,
  OptionModal,
  PositionModal,
  SortCardModal,
  YesNoModal,
} from "./Message";
import Mat from "./PlayMat2";

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
      <CheckCardModalV2 />
      <CheckCardModalV3 />
      <CheckCounterModal />
      <SortCardModal />
    </>
  );
};

export default NeosDuel;
