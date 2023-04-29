import { v4 as uuidv4 } from "uuid";

import { ygopro } from "@/api";
import { matStore } from "@/stores";

type MsgReloadField = ygopro.StocGameMessage.MsgReloadField;
type ZoneActions = ygopro.StocGameMessage.MsgReloadField.ZoneAction[];

export default (field: MsgReloadField) => {
  const _duel_rule = field.duel_rule; // TODO: duel_rule

  const gamers = ["me", "op"] as const;
  gamers.forEach((gamer) => {
    matStore.banishedZones[gamer].length = 0;
    matStore.extraDecks[gamer].length = 0;
    matStore.graveyards[gamer].length = 0;
    matStore.hands[gamer].length = 0;
    matStore.monsters[gamer].length = 0;
    matStore.magics[gamer].length = 0;
  });

  const { MZONE, SZONE, HAND, DECK, GRAVE, REMOVED, EXTRA } = ygopro.CardZone;
  const zones = [MZONE, SZONE, HAND, DECK, GRAVE, REMOVED, EXTRA] as const;
  field.actions.forEach(({ player, zone_actions }) => {
    zones.forEach((zone) => {
      reloadDuelField(
        zone,
        zone_actions.filter((item) => item.zone === zone),
        player
      );
    });
  });
};

/** 可以理解成reload DuelFieldState */
function reloadDuelField(
  cardZone: ygopro.CardZone,
  zoneActions: ZoneActions,
  controller: number
) {
  zoneActions.sort((a, b) => a.sequence - b.sequence);
  const cards = zoneActions.map((action) => {
    // FIXME: OVERLAY
    return {
      uuid: uuidv4(), // 因为是重连，所以这里重新申请UUID
      location: {
        controler: controller,
        zone: action.zone,
        position: action.position,
      },
      idleInteractivities: [],
      counters: {},
      reload: true,
    };
  });
  matStore.in(cardZone).of(controller).length = 0;
  matStore
    .in(cardZone)
    .of(controller)
    .push(...cards);
}
