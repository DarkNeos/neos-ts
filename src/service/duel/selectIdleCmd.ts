import { ygopro } from "@/api";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  type Interactivity,
  InteractType,
  matStore,
  cardStore,
} from "@/stores";

import MsgSelectIdleCmd = ygopro.StocGameMessage.MsgSelectIdleCmd;

export default (selectIdleCmd: MsgSelectIdleCmd) => {
  const player = selectIdleCmd.player;
  const cmds = selectIdleCmd.idle_cmds;

  // 先清掉之前的互动性
  clearAllIdleInteractivities(player);
  cardStore.inner.forEach((card) => {
    card.idleInteractivities = [];
  });

  cmds.forEach((cmd) => {
    const interactType = idleTypeToInteractType(cmd.idle_type);

    cmd.idle_datas.forEach((data) => {
      const { location, sequence } = data.card_info;

      // valtio: 代码从 ./selectBattleCmd.ts 复制过来的
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
        console.log(
          "idleTypeToInteractType",
          cardStore.at(location, player)[sequence],
          {
            location: ygopro.CardZone[location],
            sequence,
          }
        );
        cardStore.at(location, player)[sequence].idleInteractivities.push({
          ...tmp,
          interactType,
          response: data.response,
        });
      } else {
        console.warn(`Undefined InteractType`);
      }
    });
  });

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
