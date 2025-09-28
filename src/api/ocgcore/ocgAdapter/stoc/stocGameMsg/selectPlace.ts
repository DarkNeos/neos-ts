import { BufferReader } from "@/infra";

import { ygopro } from "../../../idl/ocgcore";
import MsgSelectPlace = ygopro.StocGameMessage.MsgSelectPlace;

/*
 * Msg Select Place
 *
 * @param - see: https://code.mycard.moe/mycard/neos-protobuf/-/blob/main/idl/ocgcore.proto
 *
 * @usage - 玩家可选择的位置
 * */

export default (data: Uint8Array) => {
  const reader = new BufferReader(data);

  const player = reader.readUint8();
  let count = reader.readUint8();
  const _field = ~reader.readUint32();

  // TODO: 暂时和`ygopro2`一样不支持取消操作，后续需要再考虑加上
  if (count === 0) {
    count = 1;
  }

  const msg = new MsgSelectPlace({
    player,
    count,
    places: [],
  });

  for (let i = 0; i < 2; i++) {
    const controller = i === 0 ? player : 1 - player;
    const field = i === 0 ? _field & 0xffff : _field >> 16;

    if ((field & 0x7f) !== 0) {
      // 怪兽区
      const zone = ygopro.CardZone.MZONE;
      const filter = field & 0x7f;

      for (let sequence = 0; sequence < 7; sequence++) {
        if ((filter & (1 << sequence)) !== 0) {
          msg.places.push(
            new MsgSelectPlace.SelectAblePlace({
              controller,
              zone,
              sequence: sequence,
            }),
          );
        }
      }
    }

    if ((field & 0x1f00) !== 0) {
      // 魔法陷阱区
      const zone = ygopro.CardZone.SZONE;
      const filter = (field >> 8) & 0x1f;

      for (let sequence = 0; sequence < 5; sequence++) {
        if ((filter & (1 << sequence)) !== 0) {
          msg.places.push(
            new MsgSelectPlace.SelectAblePlace({
              controller,
              zone,
              sequence,
            }),
          );
        }
      }
    }

    if ((field & 0x2000) !== 0) {
      // 场地魔法区
      msg.places.push(
        new MsgSelectPlace.SelectAblePlace({
          controller,
          zone: ygopro.CardZone.SZONE,
          sequence: 5,
        }),
      );
    }

    if ((field & 0xc000) !== 0) {
      // 灵摆区?
      const zone = ygopro.CardZone.SZONE;
      const filter = (field >> 14) & 0x3;

      if ((filter & 0x1) !== 0) {
        msg.places.push(
          new MsgSelectPlace.SelectAblePlace({
            controller,
            zone,
            sequence: 6,
          }),
        );
      }

      if ((filter & 0x2) !== 0) {
        msg.places.push(
          new MsgSelectPlace.SelectAblePlace({
            controller,
            zone,
            sequence: 7,
          }),
        );
      }
    }
  }

  return msg;
};
