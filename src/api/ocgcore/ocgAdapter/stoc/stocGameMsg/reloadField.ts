import { ygopro } from "../../../idl/ocgcore";
// @ts-ignore
import { BufferReaderExt } from "../../bufferIO";
import MsgReloadField = ygopro.StocGameMessage.MsgReloadField;
import { numberToCardPosition } from "../../util";

export default (data: Uint8Array) => {
  const reader = new BufferReaderExt(data);

  const duel_rule = reader.inner.readUint8();
  const actions = [];

  for (let player = 0; player < 2; player += 1) {
    const lp = reader.inner.readUint32();

    const zone_actions = [];
    // MZONE
    for (let sequence = 0; sequence < 7; sequence += 1) {
      const flag = reader.inner.readUint8();
      if (flag) {
        const position = reader.inner.readUint8();
        const overlay_count = reader.inner.readUint8();

        zone_actions.push(
          new MsgReloadField.ZoneAction({
            zone: ygopro.CardZone.MZONE,
            sequence,
            position: numberToCardPosition(position),
            overlay_count,
          })
        );
      }
    }

    // SZONE
    for (let sequence = 0; sequence < 6; sequence += 1) {
      const flag = reader.inner.readUint8();
      if (flag) {
        const position = reader.inner.readUint8();

        zone_actions.push(
          new MsgReloadField.ZoneAction({
            zone: ygopro.CardZone.SZONE,
            sequence,
            position: numberToCardPosition(position),
          })
        );
      }
    }

    const main_size = reader.inner.readUint8();
    const hand_size = reader.inner.readUint8();
    const grace_size = reader.inner.readUint8();
    const removed_size = reader.inner.readUint8();
    const extra_size = reader.inner.readUint8();
    const extra_p_size = reader.inner.readUint8();
    const chain_size = reader.inner.readUint8();

    const chain_actions = [];
    for (let i = 0; i < chain_size; i += 1) {
      const chain_code = reader.inner.readUint32();
      const location = reader.readCardLocation();
      const triggering_controller = reader.inner.readUint8();
      const triggering_location = reader.inner.readUint8();
      const triggering_sequence = reader.inner.readUint8();
      const effect_description = reader.inner.readUint32();

      chain_actions.push(
        new MsgReloadField.ChainAction({
          chain_code,
          location,
          triggering_controller,
          triggering_location,
          triggering_sequence,
          effect_description,
        })
      );
    }

    actions.push(
      new MsgReloadField.Action({
        player,
        lp,
        zone_actions,
        main_size,
        hand_size,
        grace_size,
        removed_size,
        extra_size,
        extra_p_size,
        chain_size,
        chain_actions,
      })
    );
  }

  return new MsgReloadField({
    duel_rule,
    actions,
  });
};
