import { ygopro } from "../../api/ocgcore/idl/ocgcore";
import { AppDispatch } from "../../store";
import { InteractType } from "../../reducers/duel/generic";
import {
  clearHandsIdleInteractivity,
  addHandsIdleInteractivity,
} from "../../reducers/duel/mod";
import MsgSelectIdleCmd = ygopro.StocGameMessage.MsgSelectIdleCmd;

export default (selectIdleCmd: MsgSelectIdleCmd, dispatch: AppDispatch) => {
  const player = selectIdleCmd.player;
  const cmds = selectIdleCmd.idle_cmds;

  // 先清掉之前的手牌互动性
  dispatch(clearHandsIdleInteractivity(player));

  for (let cmd of cmds) {
    let interactType;
    switch (cmd.idle_type) {
      case MsgSelectIdleCmd.IdleCmd.IdleType.SUMMON: {
        interactType = InteractType.SUMMON;
        break;
      }
      case MsgSelectIdleCmd.IdleCmd.IdleType.SPSUMMON: {
        interactType = InteractType.SP_SUMMON;
        break;
      }
      case MsgSelectIdleCmd.IdleCmd.IdleType.POS_CHANGE: {
        interactType = InteractType.POS_CHANGE;
        break;
      }
      case MsgSelectIdleCmd.IdleCmd.IdleType.MSET: {
        interactType = InteractType.MSET;
        break;
      }
      case MsgSelectIdleCmd.IdleCmd.IdleType.SSET: {
        interactType = InteractType.SSET;
        break;
      }
      case MsgSelectIdleCmd.IdleCmd.IdleType.ACTIVATE: {
        interactType = InteractType.ACTIVATE;
        break;
      }
    }

    for (let data of cmd.idle_datas) {
      const card_info = data.card_info;
      if (card_info.location === 2) {
        // 目前只处理手牌场景
        if (interactType === InteractType.ACTIVATE) {
          // 发动效果会多一个字段
          dispatch(
            addHandsIdleInteractivity({
              player,
              sequence: card_info.sequence,
              interactivity: {
                interactType,
                activateIndex: data.effect_description,
                response: data.response,
              },
            })
          );
        } else if (interactType) {
          dispatch(
            addHandsIdleInteractivity({
              player,
              sequence: card_info.sequence,
              interactivity: { interactType, response: data.response },
            })
          );
        }
      }
    }
  }
};
