import React from "react";
import { store } from "../../store";
import { useAppSelector } from "../../hook";
import { selectEnableBp, selectEnableEp } from "../../reducers/duel/phaseSlice";
import { sendSelectIdleCmdResponse } from "../../api/ocgcore/ocgHelper";
import { setEnableBp, setEnableEp } from "../../reducers/duel/mod";
import { Button2D } from "./2d";

const Bp = () => {
  const dispatch = store.dispatch;
  const enable = useAppSelector(selectEnableBp);
  const onClick = () => {
    sendSelectIdleCmdResponse(6);
    dispatch(setEnableBp(false));
  };

  return <Button2D text="bp" left={0} enable={enable} onClick={onClick} />;
};

const Ep = () => {
  const dispatch = store.dispatch;
  const enable = useAppSelector(selectEnableEp);
  const onClick = () => {
    sendSelectIdleCmdResponse(7);
    dispatch(setEnableEp(false));
  };

  return <Button2D text="ep" left={200} enable={enable} onClick={onClick} />;
};

const Phase = () => (
  <>
    <Bp />
    <Ep />
  </>
);

export default Phase;
