import { fetchCard, ygopro } from "@/api";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

import { eventbus, Task } from "@/infra";
import { cardStore } from "@/stores";

export default async (updateData: MsgUpdateData) => {
  const { player: controller, zone, actions } = updateData;
  if (controller !== undefined && zone !== undefined && actions !== undefined) {
    const field = cardStore.at(zone, controller);
    for (const action of actions) {
      const sequence = action.location?.sequence;
      if (typeof sequence !== "undefined") {
        const target = field
          .filter((card) => card.location.sequence == sequence)
          .at(0);
        if (target) {
          // 目前只更新以下字段
          if (action?.code >= 0) {
            const newMeta = await fetchCard(action.code);
            target.code = action.code;
            target.meta = newMeta;
          }

          const meta = target.meta;
          if (action.location !== undefined) {
            if (target.location.position != action.location.position) {
              // Currently only update position
              target.location.position = action.location.position;
              // animation
              await eventbus.call(Task.Move, target.uuid);
            }
          }
          if (action?.type_ >= 0) {
            meta.data.type = action.type_;
          }
          if (action?.level >= 0) {
            meta.data.level = action.level;
          }
          if (action?.attribute >= 0) {
            meta.data.attribute = action.attribute;
          }
          if (action?.race >= 0) {
            meta.data.race = action.race;
          }
          if (action?.attack >= 0) {
            meta.data.atk = action.attack;
          }
          if (action?.defense >= 0) {
            meta.data.def = action.defense;
          }
          // TODO: counters
        } else {
          console.warn(
            `<UpdateData>target from zone=${zone}, controller=${controller}, sequence=${sequence} is null`
          );
          console.info(field);
        }
      }
    }
  }
};
