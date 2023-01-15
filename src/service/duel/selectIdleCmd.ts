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

  cmds.forEach((cmd) => {
    const interactType = idleTypeToInteractType(cmd.idle_type);

    cmd.idle_datas.forEach((data) => {
      const cardInfo = data.card_info;
      switch (cardInfo.location) {
        case ygopro.CardZone.HAND: {
          if (interactType === InteractType.ACTIVATE) {
            // 发动效果会多一个字段
            dispatch(
              addHandsIdleInteractivity({
                player,
                sequence: cardInfo.sequence,
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
                sequence: cardInfo.sequence,
                interactivity: { interactType, response: data.response },
              })
            );
          }

          break;
        }
        default: {
        }
      }
    });
  });
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
