import { ygopro } from "@/api";
import { cardStore } from "@/stores";
import { callCardMove } from "@/ui/Duel/PlayMat/Card";
import MsgShuffleSetCard = ygopro.StocGameMessage.MsgShuffleSetCard;

// 后端传过来的`from_locations`的列表是切洗前场上卡的location，它们在列表里面按照切洗后的顺序排列
export default async (shuffleSetCard: MsgShuffleSetCard) => {
  const from_locations = shuffleSetCard.from_locations;
  const overlay_locations = shuffleSetCard.overlay_locations;
  if (from_locations.length == 0) {
    console.error("<ShuffleSetCard>from_locations is empty");
    return;
  }
  if (from_locations.length != overlay_locations.length) {
    console.error(
      "<ShuffleSetCard>length of from_locations and overlay_locations not matched",
    );
  }

  const count = from_locations.length;

  Promise.all(
    Array.from({ length: count }).map(async (_, i) => {
      const from = from_locations[i];
      const target = cardStore.at(from.zone, from.controller, from.sequence);
      if (target) {
        // 设置code为0，洗切后的code会由`UpdateData`指定
        target.code = 0;
        target.meta.id = 0;
        target.meta.text.id = 0;
      } else {
        console.warn(`<ShuffleSetCard>target from ${from} is null`);
      }

      // 处理超量
      const overlay_location = overlay_locations[i];
      if (overlay_location.zone > 0) {
        // 如果没有超量素材，后端会全传0
        for (const overlay of cardStore.findOverlay(
          from.zone,
          from.controller,
          from.sequence,
        )) {
          // 更新sequence
          overlay.location.sequence = overlay_location.sequence;
          // 渲染动画
          await callCardMove(overlay.uuid);
          // 这里其实有个疑惑，如果超量素材也跟着洗切的话，洗切的意义好像就没有了，感觉算是个k社没想好的设计？
        }
      }
    }),
  );
};
