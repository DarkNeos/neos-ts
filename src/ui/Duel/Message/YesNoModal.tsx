import { Button } from "antd";
import React from "react";
import { useSnapshot } from "valtio";

import { sendSelectEffectYnResponse } from "@/api";
import { matStore, messageStore } from "@/stores";

import { DragModal } from "./DragModal";

const { yesNoModal } = messageStore;

export const YesNoModal = () => {
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
