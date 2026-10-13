import { fetchCard, ygopro } from "@/api";
import type { RelationAction } from "@/api/ocgcore/ocgAdapter/stoc/stocGameMsg/cardRelation";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";
import MsgUpdateData = ygopro.StocGameMessage.MsgUpdateData;
import {
  QUERY_ATTACK,
  QUERY_COUNTERS,
  QUERY_DEFENSE,
  QUERY_EQUIP_CARD,
  QUERY_TARGET_CARD,
  TYPE_TOKEN,
} from "@/common";
import { Container } from "@/container";

type UpdateAction = MsgUpdateData.Action &
  RelationAction & {
    linkMarkers?: number;
    clear?: boolean;
    queryFlags?: number;
    updatesPosition?: boolean;
  };

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
          const updateAction = action as UpdateAction;
          const store = container.context.cardStore;
          if (updateAction.relationUpdate) {
            const { kind, target: location } = updateAction.relationUpdate;
            const related = location ? store.find(location)?.uuid : undefined;
            if (kind === "equip" || kind === "unequip")
              target.equipTarget = related;
            else if (related) {
              const previous = target.effectTargets ?? [];
              target.effectTargets =
                kind === "target"
                  ? [...new Set([...previous, related])]
                  : previous.filter((uuid) => uuid !== related);
            }
            continue;
          }
          if (updateAction.clear) {
            continue;
          }

          // code 为 0 仅表示本次查询未公开身份；是否隐藏已有卡片由移动和表示变更决定。
          if (
            action?.code > 0 &&
            (target.code !== action.code || target.meta.id === 0)
          ) {
            const newMeta = fetchCard(action.code);
            target.code = action.code;
            target.meta = newMeta;
            target.originalData = { ...newMeta.data };
          }

          if (updateAction.updatesPosition && action.location !== undefined) {
            if (target.location.position !== action.location.position) {
              // Currently only update position
              target.location.position = action.location.position;
              if (
                ![
                  ygopro.CardPosition.FACEUP,
                  ygopro.CardPosition.FACEUP_ATTACK,
                  ygopro.CardPosition.FACEUP_DEFENSE,
                ].includes(action.location.position)
              )
                store.resetFieldState(target);
              // animation
              await callCardMove(target.uuid);
            }
          }
          const meta = target.meta;
          target.originalData ??= { ...meta.data };
          // 保留原始数据后再同步实时 alias，使详情能区分异画别名和效果改名。
          if (action?.alias >= 0) meta.data.alias = action.alias;
          if (action?.type_ >= 0) {
            meta.data.type = action.type_;
            if (action.type_ & TYPE_TOKEN) {
              target.isToken = true;
            }
          }
          if (action?.level >= 0) {
            meta.data.level = action.level;
          }
          if (action?.rank >= 0) meta.data.rank = action.rank;
          if (action?.link >= 0) meta.data.link = action.link;
          if (updateAction.linkMarkers !== undefined)
            meta.data.linkMarkers = updateAction.linkMarkers;
          if (action?.lscale >= 0) meta.data.lscale = action.lscale;
          if (action?.rscale >= 0) meta.data.rscale = action.rscale;
          // 查询标志区分未提供该字段与明确清空关系，空数组也要覆盖旧对象。
          if ((updateAction.queryFlags ?? 0) & QUERY_EQUIP_CARD)
            target.equipTarget = action.equip_card
              ? store.find(action.equip_card)?.uuid
              : undefined;
          if ((updateAction.queryFlags ?? 0) & QUERY_TARGET_CARD)
            target.effectTargets = (action.target_cards ?? []).flatMap(
              (location) => {
                const found = store.find(location);
                return found ? [found.uuid] : [];
              },
            );
          if (action?.base_attack >= 0)
            target.originalData.atk = action.base_attack;
          if (action?.base_defense >= 0)
            target.originalData.def = action.base_defense;
          if (action?.attribute >= 0) {
            meta.data.attribute = action.attribute;
          }
          if (action?.race >= 0) {
            meta.data.race = action.race;
          }
          // 攻守数值可以为负；字段存在性应由查询标志判断，不能只检查非负值。
          if (
            action?.attack >= 0 ||
            (updateAction.queryFlags ?? 0) & QUERY_ATTACK
          ) {
            meta.data.atk = action.attack;
          }
          if (
            action?.defense >= 0 ||
            (updateAction.queryFlags ?? 0) & QUERY_DEFENSE
          ) {
            meta.data.def = action.defense;
          }
          if (action?.status >= 0) {
            target.status = action.status;
          }
          if ((updateAction.queryFlags ?? 0) & QUERY_COUNTERS) {
            target.counters = Object.fromEntries(action.counters ?? []);
          }
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
