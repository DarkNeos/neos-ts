import { ygopro } from "@/api";
import { Container } from "@/container";

export default function handleJoinGame(
  container: Container,
  pb: ygopro.YgoStocMsg,
) {
  const context = container.context;
  const training = context.trainingStore.session;
  const info = pb.stoc_join_game;
  // 以服务端回包为准检查单局、跳过卡组检查、不洗牌和起手数量。
  // 失败时不标记 joined，让连接等待流程显示规则错误并关闭连接。
  if (
    training &&
    (info.mode !== 0 ||
      !info.no_check_deck ||
      (training.noShuffle && !info.no_shuffle_deck) ||
      info.start_hand !== training.handSize)
  ) {
    const error =
      info.mode !== 0
        ? "服务器没有使用单局训练规则，请稍后重试"
        : !info.no_check_deck
        ? "服务器没有关闭卡组检查，训练未开始，请稍后重试"
        : training.noShuffle && !info.no_shuffle_deck
        ? "服务器没有启用开局不洗牌，训练未开始，请稍后重试"
        : "服务器未采用设置的起手手牌数量，训练未开始，请稍后重试";
    context.trainingStore.error = error;
    context.roomStore.errorMsg = error;
    return;
  }
  const seconds = pb.stoc_join_game.time_limit;
  context.roomStore.timeLimit = seconds >= 0 ? seconds : null;
  context.roomStore.lflist = info.lflist >>> 0;
  context.roomStore.joined = true;
}
