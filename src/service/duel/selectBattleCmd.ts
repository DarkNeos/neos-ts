import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { Interactivity, InteractType } from "../../reducers/duel/generic";
import {
  addFieldIdleInteractivities,
  addHandsIdleInteractivity,
  addMagicIdleInteractivities,
  addMonsterIdleInteractivities,
  clearFieldIdleInteractivities,
  clearHandsIdleInteractivity,
  clearMagicIdleInteractivities,
  clearMonsterIdleInteractivities,
  setEnableEp,
  setEnableM2,
} from "../../reducers/duel/mod";
import { AppDispatch } from "../../store";
import MsgSelectBattleCmd = ygopro.StocGameMessage.MsgSelectBattleCmd;

export default (selectBattleCmd: MsgSelectBattleCmd, dispatch: AppDispatch) => {
  const player = selectBattleCmd.player;
  const cmds = selectBattleCmd.battle_cmds;

  // 先清掉之前的互动性
  dispatch(clearHandsIdleInteractivity(player));
  dispatch(clearMonsterIdleInteractivities(player));
  dispatch(clearMagicIdleInteractivities(player));
  dispatch(clearFieldIdleInteractivities(player));

  const dispatcher = (
    battleData: MsgSelectBattleCmd.BattleCmd.BattleData,
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
    const cardInfo = battleData.card_info;
    if (interactType === InteractType.ACTIVATE) {
      dispatch(
        actionCreator({
          player,
          sequence: cardInfo.sequence,
          interactivity: {
            interactType,
            activateIndex: battleData.effect_description,
            response: battleData.response,
          },
        })
      );
    } else if (interactType === InteractType.ATTACK) {
      dispatch(
        actionCreator({
          player,
          sequence: cardInfo.sequence,
          interactivity: {
            interactType,
            directAttackAble: battleData.direct_attackable,
            response: battleData.response,
          },
        })
      );
    } else {
      console.log(`Unhandled InteractType`);
    }
  };

  cmds.forEach((cmd) => {
    const interactType = battleTypeToInteracType(cmd.battle_type);

    cmd.battle_datas.forEach((data) => {
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
        case ygopro.CardZone.ONFIELD: {
          dispatcher(data, interactType, addFieldIdleInteractivities);

          break;
        }
        default: {
        }
      }
    });
  });

  dispatch(setEnableM2(selectBattleCmd.enable_m2));
  dispatch(setEnableEp(selectBattleCmd.enable_ep));
};

function battleTypeToInteracType(
  battleType: MsgSelectBattleCmd.BattleCmd.BattleType
): InteractType | undefined {
  switch (battleType) {
    case MsgSelectBattleCmd.BattleCmd.BattleType.ATTACK: {
      return InteractType.ATTACK;
    }
    case MsgSelectBattleCmd.BattleCmd.BattleType.ACTIVATE: {
      return InteractType.ACTIVATE;
    }
    default: {
      return undefined;
    }
  }
}
