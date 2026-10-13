import { sendHsReady, sendUpdateDeck, ygopro } from "@/api";
import SelfType = ygopro.StocTypeChange.SelfType;
import { Container } from "@/container";

export default function handleTypeChange(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const selfType = pb.stoc_type_change.self_type;
  const assertHost = pb.stoc_type_change.is_host;
  const context = container.context;

  context.roomStore.isHost = assertHost;
  context.roomStore.selfType = selfType;

  switch (selfType) {
    case SelfType.UNKNOWN: {
      console.warn("<HandleTypeChange>selfType is UNKNOWN");
      break;
    }
    case SelfType.OBSERVER: {
      context.roomStore.players.forEach((player) => {
        if (player) {
          player.isMe = false;
        }
      });
      break;
    }
    default: {
      const player = context.roomStore.players[selfType - 1];
      const state = ygopro.StocHsPlayerChange.State.NO_READY;
      if (player) {
        player.state = state;
        player.isMe = true;
      } else {
        context.roomStore.players[selfType - 1] = {
          name: "?",
          state,
          isMe: true,
        };
      }
      break;
    }
  }

  // 确认入房且取得玩家席位后，只上传一次编辑中卡组并自动准备。
  const training = context.trainingStore;
  if (
    training.session &&
    !training.readySent &&
    context.roomStore.joined &&
    (selfType === SelfType.PLAYER1 || selfType === SelfType.PLAYER2)
  ) {
    training.readySent = true;
    const deck = training.session.deck;
    context.sideStore.setSideDeck(deck);
    sendUpdateDeck(container.conn, deck);
    sendHsReady(container.conn);
  }
}
