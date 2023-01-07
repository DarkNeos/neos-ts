import React from "react";
import { useAppSelector } from "../../hook";
import { store } from "../../store";
import { Modal, Button } from "antd";
import { sendSelectEffectYnResponse } from "../../api/ocgcore/ocgHelper";
import {
  selectYesNoModalIsOpen,
  selectYesNOModalMsg,
} from "../../reducers/duel/modalSlice";
import { setYesNoModalIsOpen } from "../../reducers/duel/mod";

const YesNoModal = () => {
  const dispatch = store.dispatch;
  const isOpen = useAppSelector(selectYesNoModalIsOpen);
  const msg = useAppSelector(selectYesNOModalMsg);

  return (
    <Modal
      title={msg}
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
