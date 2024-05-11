import { v4 as v4uuid } from "uuid";

import { ygopro } from "@/api";
import { cardStore, matStore } from "@/stores";

import { genCard } from "../utils";
type MsgReloadField = ygopro.StocGameMessage.MsgReloadField;

export default (field: MsgReloadField) => {
  // 重置
  cardStore.reset();

  const actions = field.actions;
  actions.forEach((action) => {
    const controller = action.player;
    // 更新生命值
    matStore.initInfo.of(controller).life = action.lp;
    // 更新卡片集合
    const cards = action.zone_actions
      .map((zoneAction) =>
        Array.from({ length: zoneAction.overlay_count + 1 }).map(
          (_, overlaySequence) =>
            genCard({
              uuid: v4uuid(),
              code: 0,
              location: new ygopro.CardLocation({
                controller,
                zone: zoneAction.zone,
                sequence: zoneAction.sequence,
                is_overlay: overlaySequence > 0,
                overlay_sequence: Math.min(overlaySequence - 1, 0),
                position: zoneAction.position,
              }),
              counters: {},
              idleInteractivities: [],
              meta: { id: 0, data: {}, text: {} },
              isToken: false,
              targeted: false,
              selectInfo: {
                selectable: false,
                selected: false,
              },
            }),
        ),
      )
      .flat();
    cardStore.inner.push(...cards);
  });
};
