import React from "react";
import { store } from "../../store";
import { useAppSelector } from "../../hook";
import { selectEnableBp, selectEnableEp } from "../../reducers/duel/phaseSlice";
import { sendSelectIdleCmdResponse } from "../../api/ocgcore/ocgHelper";
import {
  clearFieldIdleInteractivities,
  clearHandsIdleInteractivity,
  clearMagicIdleInteractivities,
  clearMonsterIdleInteractivities,
  setEnableBp,
  setEnableEp,
} from "../../reducers/duel/mod";
import { Button2D } from "./2d";

const Bp = () => {
  const dispatch = store.dispatch;
  const enable = useAppSelector(selectEnableBp);
  const onClick = () => {
    // 清除一堆东西的互动性
    dispatch(clearHandsIdleInteractivity(0));
    dispatch(clearHandsIdleInteractivity(1));
    dispatch(clearMonsterIdleInteractivities(0));
    dispatch(clearMonsterIdleInteractivities(1));
    dispatch(clearMagicIdleInteractivities(0));
    dispatch(clearMagicIdleInteractivities(1));
    dispatch(clearFieldIdleInteractivities(0));
    dispatch(clearFieldIdleInteractivities(1));

    sendSelectIdleCmdResponse(6);
    dispatch(setEnableBp(false));
  };

  return <Button2D text="bp" left={0} enable={enable} onClick={onClick} />;
};

const Ep = () => {
  const dispatch = store.dispatch;
  const enable = useAppSelector(selectEnableEp);
  const onClick = () => {
    // 清除一堆东西的互动性
    dispatch(clearHandsIdleInteractivity(0));
    dispatch(clearHandsIdleInteractivity(1));
    dispatch(clearMonsterIdleInteractivities(0));
    dispatch(clearMonsterIdleInteractivities(1));
    dispatch(clearMagicIdleInteractivities(0));
    dispatch(clearMagicIdleInteractivities(1));
    dispatch(clearFieldIdleInteractivities(0));
    dispatch(clearFieldIdleInteractivities(1));

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
