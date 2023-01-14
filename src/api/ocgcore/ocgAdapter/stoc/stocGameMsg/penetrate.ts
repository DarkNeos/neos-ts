//! 透传协议

import PenetrateData from "./penetrate.json";
import { BufferReader } from "../../bufferIO";
import { ygopro } from "../../../idl/ocgcore";

type Constructor<T = any> = new (...args: any[]) => T;

const PenetrateConfig = _objToMap(PenetrateData);
const ReadFieldHandlerMap: Map<string, readFieldHandler> = new Map([
  ["uint8", ((reader) => reader.readUint8()) as readFieldHandler],
  ["uint16", (reader) => reader.readUint16()],
  ["uint32", (reader) => reader.readUint32()],
  ["CardLocation", (reader) => reader.readCardLocation()],
]);
const MsgConstructorMap: Map<string, Constructor> = new Map([
  ["move", ygopro.StocGameMessage.MsgMove],
]);

export interface penetrateType {
  protoType: string;
  fields: {
    fieldName: string;
    fieldType: string;
  }[];
}

interface readFieldHandler {
  (reader: BufferReader): any;
}

class PenetrateManager {
  config: Map<string, penetrateType>;
  readFieldHandlerMap: Map<string, readFieldHandler> = ReadFieldHandlerMap;
  msgConstructorMap: Map<string, Constructor> = MsgConstructorMap;

  constructor(config: any) {
    this.config = _objToMap(config);
  }

  private readField(reader: BufferReader, fieldType: string): any {
    const handler = this.readFieldHandlerMap.get(fieldType);

    if (handler) {
      return handler(reader);
    }
    return undefined;
  }

  private constructMsg(protoType: string, object: any): any {
    const constructor = this.msgConstructorMap.get(protoType);

    if (constructor) {
      return new constructor(object);
    }
    return undefined;
  }

  penetrate(msgKey: number, gameMsg: any, gameData: Uint8Array): boolean {
    const config = this.config.get(msgKey.toString());
    const reader = new BufferReader(gameData, true);

    if (config) {
      const protoType = config.protoType;
      const fields = config.fields;

      let object: any = {};
      for (let field of fields) {
        object[field.fieldName] = this.readField(reader, field.fieldType);
      }

      gameMsg[protoType] = this.constructMsg(protoType, object);
    }

    return config ? true : false;
  }
}

function _objToMap(obj: any): Map<string, penetrateType> {
  let map = new Map();

  for (let key of Object.keys(obj)) {
    map.set(key, obj[key]);
  }

  return map;
}

export default new PenetrateManager(PenetrateConfig);
