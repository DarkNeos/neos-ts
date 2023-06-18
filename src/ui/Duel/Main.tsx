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
import { LifeBar, Mat, Menu } from "./PlayMat";
import { NewSelectActionsModal } from "./Message/NewSelectActionModal";

const NeosDuel = () => {
  return (
    <>
      <NewSelectActionsModal
        isValid
        isChain
        selecteds={[]}
        selectables={[]}
        mustSelects={[]}
      />
      <Alert />
      <Menu />
      <LifeBar />
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
