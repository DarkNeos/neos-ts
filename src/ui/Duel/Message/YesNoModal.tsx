import { Button } from "antd";
import React from "react";

import { sendSelectEffectYnResponse } from "@/api/ocgcore/ocgHelper";
import { useAppSelector } from "@/hook";
import { selectHint } from "@/reducers/duel/hintSlice";
import { setYesNoModalIsOpen } from "@/reducers/duel/mod";
import {
  selectYesNoModalIsOpen,
  selectYesNOModalMsg,
} from "@/reducers/duel/modal/mod";
import { store } from "@/store";

import { DragModal } from "./DragModal";

import { messageStore, matStore } from "@/valtioStores";
import { useSnapshot } from "valtio";

const { yesNoModal } = messageStore;

export const YesNoModal = () => {
  // const dispatch = store.dispatch;
  // const isOpen = useAppSelector(selectYesNoModalIsOpen);
  // const msg = useAppSelector(selectYesNOModalMsg);
  // const hint = useAppSelector(selectHint);

  const snapYesNoModal = useSnapshot(yesNoModal);
  const isOpen = snapYesNoModal.isOpen;
  const msg = snapYesNoModal.msg;
  const hint = useSnapshot(matStore.hint);

  const preHintMsg = hint?.esHint || "";

  return (
    <DragModal
      title={`${preHintMsg} ${msg}`}
      open={isOpen}
      closable={false}
      footer={
        <>
          <Button
            onClick={() => {
              sendSelectEffectYnResponse(true);
              // dispatch(setYesNoModalIsOpen(false));
              yesNoModal.isOpen = false;
            }}
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              sendSelectEffectYnResponse(false);
              // dispatch(setYesNoModalIsOpen(false));
              yesNoModal.isOpen = false;
            }}
          >
            No
          </Button>
        </>
      }
    />
  );
};
