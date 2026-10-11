import { ygopro } from "../../../idl/ocgcore";
import { BufferReaderExt } from "../../bufferIO";

export interface RelationAction {
  relationUpdate?: {
    kind: "equip" | "unequip" | "target" | "cancel-target";
    target?: ygopro.CardLocation;
  };
}

/** 关系事件沿用 update_data 分发，额外字段与 queryFlags 一样保留在 Action 实例上。 */
export default function cardRelation(
  data: Uint8Array,
  kind: NonNullable<RelationAction["relationUpdate"]>["kind"],
) {
  const reader = new BufferReaderExt(data);
  const location = reader.readCardLocation();
  const action = new ygopro.StocGameMessage.MsgUpdateData.Action({ location });
  (action as typeof action & RelationAction).relationUpdate = {
    kind,
    target: kind === "unequip" ? undefined : reader.readCardLocation(),
  };
  return new ygopro.StocGameMessage.MsgUpdateData({
    player: location.controller,
    zone: location.zone,
    actions: [action],
  });
}
