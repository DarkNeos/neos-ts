import React from "react";
import { store } from "../../store";
import { useAppSelector } from "../../hook";
import {
  selectCurrentPhase,
  selectEnableBp,
  selectEnableEp,
  selectEnableM2,
} from "../../reducers/duel/phaseSlice";
import {
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
} from "../../api/ocgcore/ocgHelper";
import {
  clearHandsIdleInteractivity,
  clearMagicIdleInteractivities,
  clearMonsterIdleInteractivities,
  setEnableBp,
  setEnableEp,
  setEnableM2,
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

    sendSelectIdleCmdResponse(6);
    dispatch(setEnableBp(false));
  };

  return <Button2D text="bp" left={-200} enable={enable} onClick={onClick} />;
};

const M2 = () => {
  const dispatch = store.dispatch;
  const enable = useAppSelector(selectEnableM2);
  const onClick = () => {
    // 清除一堆东西的互动性
    dispatch(clearHandsIdleInteractivity(0));
    dispatch(clearHandsIdleInteractivity(1));
    dispatch(clearMonsterIdleInteractivities(0));
    dispatch(clearMonsterIdleInteractivities(1));
    dispatch(clearMagicIdleInteractivities(0));
    dispatch(clearMagicIdleInteractivities(1));

    sendSelectBattleCmdResponse(2);
    dispatch(setEnableM2(false));
  };

  return <Button2D text="m2" left={0} enable={enable} onClick={onClick} />;
};

const Ep = () => {
  const dispatch = store.dispatch;
  const enable = useAppSelector(selectEnableEp);
  const currentPhase = useAppSelector(selectCurrentPhase);

  const response =
    currentPhase === "BATTLE_START" ||
    currentPhase === "BATTLE_STEP" ||
    currentPhase === "DAMAGE" ||
    currentPhase === "DAMAGE_GAL" ||
    currentPhase === "BATTLE"
      ? 3
      : 7;

  const onClick = (response: number) => () => {
    // 清除一堆东西的互动性
    dispatch(clearHandsIdleInteractivity(0));
    dispatch(clearHandsIdleInteractivity(1));
    dispatch(clearMonsterIdleInteractivities(0));
    dispatch(clearMonsterIdleInteractivities(1));
    dispatch(clearMagicIdleInteractivities(0));
    dispatch(clearMagicIdleInteractivities(1));

    sendSelectIdleCmdResponse(response);
    dispatch(setEnableEp(false));
  };

  return (
    <Button2D
      text="ep"
      left={200}
      enable={enable}
      onClick={onClick(response)}
    />
  );
};

const Phase = () => (
  <>
    <Bp />
    <M2 />
    <Ep />
  </>
);

export default Phase;
