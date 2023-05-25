import React from "react";

import {
  Alert,
  AnnounceModal,
  CardListModal,
  CardModal,
  CheckCounterModal,
  HintNotification,
  OptionModal,
  PositionModal,
  SelectActionsModal,
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
      <SelectActionsModal />
      <YesNoModal />
      <PositionModal />
      <OptionModal />
      <CheckCounterModal />
      <SortCardModal />
      <AnnounceModal />
    </>
  );
};

export default NeosDuel;
