import { fetchCard, ygopro } from "@/api";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";

import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;
import { TYPE_TOKEN } from "@/common";
import { Container } from "@/container";

export default async (container: Container, updateData: MsgUpdateData) => {
  const { player: controller, zone, actions } = updateData;
  if (controller !== undefined && zone !== undefined && actions !== undefined) {
    const field = container.context.cardStore.at(zone, controller);
    for (const action of actions) {
      const sequence = action.location?.sequence;
      if (typeof sequence !== "undefined") {
        const target = field
          .filter((card) => card.location.sequence === sequence)
          .at(0);
        if (target) {
          if (action?.code > 0 && target.code === 0) {
            // 当本地code为0且action的code大于0时，才从db加载整个meta信息
            const newMeta = fetchCard(action.code);
            target.code = action.code;
            target.meta = newMeta;
          }

          const meta = target.meta;
          if (action.location !== undefined) {
            if (target.location.position !== action.location.position) {
              // Currently only update position
              target.location.position = action.location.position;
              // animation
              await callCardMove(target.uuid);
            }
          }
          if (action?.type_ >= 0) {
            meta.data.type = action.type_;
            if (action.type_ & TYPE_TOKEN) {
              target.isToken = true;
            }
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
            `<UpdateData>target from zone=${zone}, controller=${controller}, sequence=${sequence} is null`,
          );
          console.info(field);
        }
      }
    }
  }
};
