import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import { Button } from "antd";
import { sendSelectEffectYnResponse } from "../../api/ocgcore/ocgHelper";
import {
  selectYesNoModalIsOpen,
  selectYesNOModalMsg,
} from "../../reducers/duel/modal/mod";
import { setYesNoModalIsOpen } from "../../reducers/duel/mod";
import DragModal from "./dragModal";
import { selectHint } from "../../reducers/duel/hintSlice";

const YesNoModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectYesNoModalIsOpen);
  const msg = useAppSelector(selectYesNOModalMsg);
  const hint = useAppSelector(selectHint);
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
              dispatch(setYesNoModalIsOpen(false));
            }}
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              sendSelectEffectYnResponse(false);
              dispatch(setYesNoModalIsOpen(false));
            }}
          >
            No
          </Button>
        </>
      }
    />
  );
};

export default YesNoModal;
