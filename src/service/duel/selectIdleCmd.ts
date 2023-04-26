import { ActionCreatorWithPayload } from "@reduxjs/toolkit";

import { ygopro } from "@/api";
import { Interactivity, InteractType } from "@/reducers/duel/generic";
import {
  addBanishedZoneIdleInteractivities,
  addExtraDeckIdleInteractivities,
  addGraveyardIdleInteractivities,
  addHandsIdleInteractivity,
  addMagicIdleInteractivities,
  addMonsterIdleInteractivities,
  clearAllIdleInteractivities,
  setEnableBp,
  setEnableEp,
} from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import {
  clearAllIdleInteractivities as FIXME_clearAllIdleInteractivities,
  matStore,
} from "@/valtioStores";

import MsgSelectIdleCmd = ygopro.StocGameMessage.MsgSelectIdleCmd;

export default (selectIdleCmd: MsgSelectIdleCmd, dispatch: AppDispatch) => {
  const player = selectIdleCmd.player;
  const cmds = selectIdleCmd.idle_cmds;

  // 先清掉之前的互动性
  // dispatch(clearAllIdleInteractivities(player));
  FIXME_clearAllIdleInteractivities(player);

  // const dispatcher = (
  //   idleData: MsgSelectIdleCmd.IdleCmd.IdleData,
  //   interactType: InteractType | undefined,
  //   actionCreator: ActionCreatorWithPayload<
  //     {
  //       player: number;
  //       sequence: number;
  //       interactivity: Interactivity<number>;
  //     },
  //     string
  //   >
  // ) => {
  //   const cardInfo = idleData.card_info;
  //   if (interactType === InteractType.ACTIVATE) {
  //     // 发动效果会多一个字段
  //     dispatch(
  //       actionCreator({
  //         player,
  //         sequence: cardInfo.sequence,
  //         interactivity: {
  //           interactType,
  //           activateIndex: idleData.effect_description,
  //           response: idleData.response,
  //         },
  //       })
  //     );
  //   } else if (interactType) {
  //     dispatch(
  //       actionCreator({
  //         player,
  //         sequence: cardInfo.sequence,
  //         interactivity: { interactType, response: idleData.response },
  //       })
  //     );
  //   } else {
  //     console.log(`InteractType undefined`);
  //   }
  // };

  cmds.forEach((cmd) => {
    const interactType = idleTypeToInteractType(cmd.idle_type);

    cmd.idle_datas.forEach((data) => {
      const { location, sequence } = data.card_info;

      // valtio。代码从 ./selectBattleCmd.ts 复制过来的
      if (interactType) {
        const map: Partial<
          Record<InteractType, undefined | Partial<Interactivity<number>>>
        > = {
          [InteractType.ACTIVATE]: { activateIndex: data.effect_description },
        };
        const tmp = map[interactType];
        matStore
          .in(location)
          .of(player)
          .addIdleInteractivity(sequence, {
            ...tmp,
            interactType,
            response: data.response,
          });
      } else {
        console.warn(`Undefined InteractType`);
      }

      // switch (location) {
      //   case ygopro.CardZone.HAND: {
      //     dispatcher(data, interactType, addHandsIdleInteractivity);

      //     break;
      //   }
      //   case ygopro.CardZone.MZONE: {
      //     dispatcher(data, interactType, addMonsterIdleInteractivities);

      //     break;
      //   }
      //   case ygopro.CardZone.SZONE: {
      //     dispatcher(data, interactType, addMagicIdleInteractivities);

      //     break;
      //   }
      //   case ygopro.CardZone.GRAVE: {
      //     dispatcher(data, interactType, addGraveyardIdleInteractivities);

      //     break;
      //   }
      //   case ygopro.CardZone.REMOVED: {
      //     dispatcher(data, interactType, addBanishedZoneIdleInteractivities);

      //     break;
      //   }
      //   case ygopro.CardZone.EXTRA: {
      //     dispatcher(data, interactType, addExtraDeckIdleInteractivities);

      //     break;
      //   }
      //   default: {
      //     console.log(`Unhandled zone type: ${location}`);
      //   }
      // }
    });
  });

  // dispatch(setEnableBp(selectIdleCmd.enable_bp));
  // dispatch(setEnableEp(selectIdleCmd.enable_ep));

  matStore.phase.enableBp = selectIdleCmd.enable_bp;
  matStore.phase.enableEp = selectIdleCmd.enable_ep;
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
