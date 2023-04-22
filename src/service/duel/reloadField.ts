import { ygopro } from "@/api";
import { reloadField } from "@/reducers/duel/mod";
import { AppDispatch } from "@/store";
import { type DuelFieldState, matStore } from "@/valtioStores";

type MsgReloadField = ygopro.StocGameMessage.MsgReloadField;

type ZoneActions = ygopro.StocGameMessage.MsgReloadField.ZoneAction[];

export default (field: MsgReloadField, dispatch: AppDispatch) => {
  dispatch(reloadField(field));

  const _duel_rule = field.duel_rule;

  const gamers = ["me", "op"] as const;
  gamers.forEach((gamer) => {
    matStore.banishedZones[gamer] = [];
    matStore.extraDecks[gamer] = [];
    matStore.graveyards[gamer] = [];
    matStore.hands[gamer] = [];
    matStore.monsters[gamer] = [];
    matStore.magics[gamer] = [];
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
      location: {
        controler: controller,
        location: action.zone,
        position: action.position,
      },
      idleInteractivities: [],
      counters: {},
      reload: true,
    };
  });
  matStore.getZone(cardZone).at(controller).length = 0;
  matStore
    .getZone(cardZone)
    .at(controller)
    .push(...cards);
}
