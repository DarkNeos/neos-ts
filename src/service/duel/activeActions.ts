import {
  fetchStrings,
  getStrings,
  Region,
  sendSelectBattleCmdResponse,
  sendSelectIdleCmdResponse,
  ygopro,
} from "@/api";
import type { Container } from "@/container";
import { type CardType, InteractType, replayStore } from "@/stores";
import type { ActiveAction } from "@/stores/activeActionProcess";
import { connectionStore } from "@/stores/connectionStore";
import { fieldSelection } from "@/stores/fieldSelection";
import { chooseOption, displaySimpleSelectCardsModal } from "@/ui/Duel/Message";

type Idle = ygopro.StocGameMessage.MsgSelectIdleCmd;
type Battle = ygopro.StocGameMessage.MsgSelectBattleCmd;

export function openActiveActions(
  container: Container,
  input:
    | { source: "idle"; message: Idle }
    | { source: "battle"; message: Battle },
) {
  const { matStore, cardStore } = container.context;
  const { conn } = container;
  const { player } = input.message;
  matStore.clearPhaseCommands();
  for (const card of cardStore.inner) card.idleInteractivities = [];
  const actions: ActiveAction<CardType>[] = [];
  const add = (
    interactType: InteractType | undefined,
    data: {
      card_info: { location: number; sequence: number };
      response: number;
      effect_description?: number;
      direct_attackable?: boolean;
    },
  ) => {
    if (!interactType) return;
    const card = cardStore.at(
      data.card_info.location,
      player,
      data.card_info.sequence,
    );
    if (!card) return;
    actions.push({
      card,
      interactType,
      response: data.response,
      activateIndex: data.effect_description,
      directAttackAble: data.direct_attackable,
    });
  };
  const phases: Partial<Record<string, number>> = {};
  if (input.source === "idle") {
    const types: Partial<Record<number, InteractType>> = {
      [ygopro.StocGameMessage.MsgSelectIdleCmd.IdleCmd.IdleType.SUMMON]:
        InteractType.SUMMON,
      [ygopro.StocGameMessage.MsgSelectIdleCmd.IdleCmd.IdleType.SPSUMMON]:
        InteractType.SP_SUMMON,
      [ygopro.StocGameMessage.MsgSelectIdleCmd.IdleCmd.IdleType.POS_CHANGE]:
        InteractType.POS_CHANGE,
      [ygopro.StocGameMessage.MsgSelectIdleCmd.IdleCmd.IdleType.MSET]:
        InteractType.MSET,
      [ygopro.StocGameMessage.MsgSelectIdleCmd.IdleCmd.IdleType.SSET]:
        InteractType.SSET,
      [ygopro.StocGameMessage.MsgSelectIdleCmd.IdleCmd.IdleType.ACTIVATE]:
        InteractType.ACTIVATE,
    };
    for (const cmd of input.message.idle_cmds)
      for (const data of cmd.idle_datas) add(types[cmd.idle_type], data);
    if (input.message.enable_bp) phases.battle = 6;
    if (input.message.enable_ep) phases.end = 7;
  } else {
    for (const cmd of input.message.battle_cmds)
      for (const data of cmd.battle_datas)
        add(
          cmd.battle_type ===
            ygopro.StocGameMessage.MsgSelectBattleCmd.BattleCmd.BattleType
              .ATTACK
            ? InteractType.ATTACK
            : cmd.battle_type ===
              ygopro.StocGameMessage.MsgSelectBattleCmd.BattleCmd.BattleType
                .ACTIVATE
            ? InteractType.ACTIVATE
            : undefined,
          data,
        );
    if (input.message.enable_m2) phases.main2 = 2;
    if (input.message.enable_ep) phases.end = 3;
  }
  const id = matStore.activeActions.open(
    { source: input.source, actions, phases },
    {
      eligible: () =>
        [1, 2].includes(matStore.selfType) &&
        matStore.isMe(player) &&
        matStore.isMe(matStore.currentPlayer) &&
        !matStore.duelEnd &&
        !replayStore.isReplay &&
        !fieldSelection.active &&
        !connectionStore.offline &&
        !conn.cancelled &&
        !conn.isClosed(),
      send: (source, response) =>
        source === "battle"
          ? sendSelectBattleCmdResponse(conn, response)
          : sendSelectIdleCmdResponse(conn, response),
      chooseCard: async (cards, signal) => {
        const selected = await displaySimpleSelectCardsModal({
          selectables: cards.map((card) => ({
            meta: card.meta,
            location: card.location,
            card,
          })),
          signal,
        });
        return selected[0]?.card as CardType | undefined;
      },
      chooseEffect: (choices, signal) =>
        chooseOption(
          fetchStrings(Region.System, 556),
          choices.map((choice) => ({
            info: choice.activateIndex
              ? getStrings(choice.activateIndex)
              : "[:?]",
            response: choice.response,
          })),
          signal,
        ),
      clear: () => {
        for (const card of cardStore.inner) card.idleInteractivities = [];
      },
    },
  );
  for (const { card, ...action } of actions)
    card.idleInteractivities.push({ ...action, responseSource: input.source });
  matStore.phase.command = { id, type: input.source, player };
  matStore.phase.enableBp = phases.battle !== undefined;
  matStore.phase.enableM2 = phases.main2 !== undefined;
  matStore.phase.enableEp = phases.end !== undefined;
}
