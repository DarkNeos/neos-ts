import { ygopro } from "@/api";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

import { cardStore } from "@/stores";

export default (updateData: MsgUpdateData) => {
  const { player: controller, zone, actions } = updateData;
  if (controller !== undefined && zone !== undefined && actions !== undefined) {
    const field = cardStore.at(zone, controller);
    actions.forEach((action) => {
      const sequence = action.location?.sequence;
      if (typeof sequence !== "undefined") {
        const target = field.filter((card) => card.sequence == sequence).at(0);
        if (target) {
          const meta = target.meta;
          // 目前只更新以下字段
          if (action?.code >= 0) {
            meta.id = action.code;
            meta.text.id = action.code;
          }
          if (action.location !== undefined) {
            target.position = action.location.position;
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
        }
        if (target?.reload) {
          target.reload = false;
        }
      }
    });
  }
};
