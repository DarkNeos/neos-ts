import { ygopro } from "@/api";
import {
  cardStore,
  type Interactivity,
  InteractType,
  matStore,
} from "@/stores";

import MsgSelectIdleCmd = ygopro.StocGameMessage.MsgSelectIdleCmd;

export default (selectIdleCmd: MsgSelectIdleCmd) => {
  const player = selectIdleCmd.player;
  const cmds = selectIdleCmd.idle_cmds;

  // 先清掉之前的互动性
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
        const target = cardStore.at(location, player, sequence);
        if (target) {
          target.idleInteractivities.push({
            ...tmp,
            interactType,
            response: data.response,
          });
        } else {
          console.warn(
            `target from zone=${location}, controller=${player}, sequence=${sequence} is null`,
          );
        }
      } else {
        console.warn(`Undefined InteractType`);
      }
    });
  });

  matStore.phase.enableBp = selectIdleCmd.enable_bp;
  matStore.phase.enableEp = selectIdleCmd.enable_ep;
};

function idleTypeToInteractType(
  idleType: MsgSelectIdleCmd.IdleCmd.IdleType,
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
