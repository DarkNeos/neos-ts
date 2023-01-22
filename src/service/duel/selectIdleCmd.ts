import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { Interactivity, InteractType } from "../../reducers/duel/generic";
import {
  clearHandsIdleInteractivity,
  addHandsIdleInteractivity,
  addMonsterIdleInteractivities,
  addMagicIdleInteractivities,
  clearMonsterIdleInteractivities,
  clearMagicIdleInteractivities,
  setEnableBp,
  setEnableEp,
} from "../../reducers/duel/mod";
import MsgSelectIdleCmd = ygopro.StocGameMessage.MsgSelectIdleCmd;
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

export default (selectIdleCmd: MsgSelectIdleCmd, dispatch: AppDispatch) => {
  const player = selectIdleCmd.player;
  const cmds = selectIdleCmd.idle_cmds;

  // 先清掉之前的互动性
  dispatch(clearHandsIdleInteractivity(player));
  dispatch(clearMonsterIdleInteractivities(player));
  dispatch(clearMagicIdleInteractivities(player));

  const dispatcher = (
    idleData: MsgSelectIdleCmd.IdleCmd.IdleData,
    interactType: InteractType | undefined,
    actionCreator: ActionCreatorWithPayload<
      {
        player: number;
        sequence: number;
        interactivity: Interactivity<number>;
      },
      string
    >
  ) => {
    const cardInfo = idleData.card_info;
    if (interactType === InteractType.ACTIVATE) {
      // 发动效果会多一个字段
      dispatch(
        actionCreator({
          player,
          sequence: cardInfo.sequence,
          interactivity: {
            interactType,
            activateIndex: idleData.effect_description,
            response: idleData.response,
          },
        })
      );
    } else if (interactType) {
      dispatch(
        actionCreator({
          player,
          sequence: cardInfo.sequence,
          interactivity: { interactType, response: idleData.response },
        })
      );
    } else {
      console.log(`InteractType undefined`);
    }
  };

  cmds.forEach((cmd) => {
    const interactType = idleTypeToInteractType(cmd.idle_type);

    cmd.idle_datas.forEach((data) => {
      const cardInfo = data.card_info;
      switch (cardInfo.location) {
        case ygopro.CardZone.HAND: {
          dispatcher(data, interactType, addHandsIdleInteractivity);

          break;
        }
        case ygopro.CardZone.MZONE: {
          dispatcher(data, interactType, addMonsterIdleInteractivities);

          break;
        }
        case ygopro.CardZone.SZONE: {
          dispatcher(data, interactType, addMagicIdleInteractivities);

          break;
        }
        default: {
        }
      }
    });
  });

  dispatch(setEnableBp(selectIdleCmd.enable_bp));
  dispatch(setEnableEp(selectIdleCmd.enable_ep));
};

function idleTypeToInteractType(
  idleType: MsgSelectIdleCmd.IdleCmd.IdleType
): InteractType | undefined {
  switch (idleType) {
    case MsgSelectIdleCmd.IdleCmd.IdleType.SUMMON: {
      return InteractType.SUMMON;
    }
    case MsgSelectIdleCmd.IdleCmd.IdleType.SPSUMMON: {
      return InteractType.SP_SUMMON;
    }
    case MsgSelectIdleCmd.IdleCmd.IdleType.POS_CHANGE: {
      return InteractType.POS_CHANGE;
    }
    case MsgSelectIdleCmd.IdleCmd.IdleType.MSET: {
      return InteractType.MSET;
    }
    case MsgSelectIdleCmd.IdleCmd.IdleType.SSET: {
      return InteractType.SSET;
    }
    case MsgSelectIdleCmd.IdleCmd.IdleType.ACTIVATE: {
      return InteractType.ACTIVATE;
    }
    default: {
      return undefined;
    }
  }
}
