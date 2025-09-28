import { ygopro } from "@/api/ocgcore/idl/ocgcore";
import { BufferReader } from "@/infra";
import MsgFieldDisabled = ygopro.StocGameMessage.MsgFieldDisabled;
import CardZone = ygopro.CardZone;

/*
 * Msg Field Disabled
 * @param - TODO
 *
 * @usage - 区域禁用
 * */
export default (data: Uint8Array) => {
  const reader = new BufferReader(data);
  const flag = reader.readInt32();

  const actions = [];
  let filter = 0x1;
  for (let i = 0; i < 5; i++, filter <<= 1) {
    const disabled = (flag & filter) > 0;
    actions.push(
      new MsgFieldDisabled.Action({
        controller: 0,
        zone: CardZone.MZONE,
        sequence: i,
        disabled,
      }),
    );
  }

  filter = 0x100;
  for (let i = 0; i < 8; i++, filter <<= 1) {
    const disabled = (flag & filter) > 0;
    actions.push(
      new MsgFieldDisabled.Action({
        controller: 0,
        zone: CardZone.SZONE,
        sequence: i,
        disabled,
      }),
    );
  }

  filter = 0x10000;
  for (let i = 0; i < 5; i++, filter <<= 1) {
    const disabled = (flag & filter) > 0;
    actions.push(
      new MsgFieldDisabled.Action({
        controller: 1,
        zone: CardZone.MZONE,
        sequence: i,
        disabled,
      }),
    );
  }

  filter = 0x1000000;
  for (let i = 0; i < 8; i++, filter <<= 1) {
    const disabled = (flag & filter) > 0;
    actions.push(
      new MsgFieldDisabled.Action({
        controller: 1,
        zone: CardZone.SZONE,
        sequence: i,
        disabled,
      }),
    );
  }

  return new MsgFieldDisabled({
    actions,
  });
};
