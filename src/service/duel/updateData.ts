import { ygopro } from "@/api";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;

import { matStore } from "@/stores";

export default (updateData: MsgUpdateData) => {
  const { player: controller, zone, actions } = updateData;
  if (controller !== undefined && zone !== undefined && actions !== undefined) {
    const field = matStore.in(zone).of(controller);
    actions.forEach((action) => {
      const sequence = action.location?.sequence;
      if (typeof sequence !== "undefined") {
        const target = field[sequence];
        if (target && (target.occupant || target.reload)) {
          if (target.occupant === undefined) {
            target.occupant = { id: action.code!, data: {}, text: {} };
          }
          const occupant = target.occupant;
          // 目前只更新以下字段
          if (action.code !== undefined && action.code >= 0) {
            occupant.id = action.code;
            occupant.text.id = action.code;
          }
          if (action.location !== undefined) {
            target.location.position = action.location.position;
          }
          if (action.type_ !== undefined && action.type_ >= 0) {
            occupant.data.type = action.type_;
          }
          if (action.level !== undefined && action.level >= 0) {
            occupant.data.level = action.level;
          }
          if (action.attribute !== undefined && action.attribute >= 0) {
            occupant.data.attribute = action.attribute;
          }
          if (action.race !== undefined && action.race >= 0) {
            occupant.data.race = action.race;
          }
          if (action.attack !== undefined && action.attack >= 0) {
            occupant.data.atk = action.attack;
          }
          if (action.defense !== undefined && action.defense >= 0) {
            occupant.data.def = action.defense;
          }
          // TODO: counters
        }
        if (target?.reload) {
          target.reload = false;
        }
      }
    });
  }
};
