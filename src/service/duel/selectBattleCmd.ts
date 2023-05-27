import { ygopro } from "@/api";
import {
  clearAllIdleInteractivities as clearAllIdleInteractivities,
  type Interactivity,
  InteractType,
  matStore,
  cardStore,
} from "@/stores";

import MsgSelectBattleCmd = ygopro.StocGameMessage.MsgSelectBattleCmd;

export default (selectBattleCmd: MsgSelectBattleCmd) => {
  const player = selectBattleCmd.player;
  const cmds = selectBattleCmd.battle_cmds;

  // 先清掉之前的互动性
  clearAllIdleInteractivities(player);
  cardStore.inner.forEach((card) => {
    card.idleInteractivities = [];
  });

  cmds.forEach((cmd) => {
    const interactType = battleTypeToInteracType(cmd.battle_type);

    cmd.battle_datas.forEach((data) => {
      const { location, sequence } = data.card_info;

      // valtio
      if (interactType) {
        const map: Partial<
          Record<InteractType, undefined | Partial<Interactivity<number>>>
        > = {
          [InteractType.ACTIVATE]: { activateIndex: data.effect_description },
          [InteractType.ATTACK]: { directAttackAble: data.direct_attackable },
        };
        const tmp = map[interactType]; // 添加额外信息
        matStore
          .in(location)
          .of(player)
          .addIdleInteractivity(sequence, {
            ...tmp,
            interactType,
            response: data.response,
          });
        cardStore.at(location, player, sequence).idleInteractivities.push({
          ...tmp,
          interactType,
          response: data.response,
        });
      } else {
        console.warn(`Undefined InteractType`);
      }
    });
  });
  matStore.phase.enableM2 = selectBattleCmd.enable_m2;
  matStore.phase.enableEp = selectBattleCmd.enable_ep;
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
