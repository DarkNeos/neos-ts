//! 透传协议

import PenetrateData from "./penetrate.json";
import { BufferReader } from "../../bufferIO";

export interface penetrateType {
  protoType: string;
  fields: {
    fieldName: string;
    fieldType: string;
  }[];
}

const PenetrateConfig = _objToMap(PenetrateData);

export function penetrate(
  msgKey: number,
  gameMsg: any,
  gameData: Uint8Array
): boolean {
  const config = PenetrateConfig.get(msgKey.toString());
  const reader = new BufferReader(gameData, true);

  if (config) {
    const protoType = config.protoType;
    const fields = config.fields;

    let obj: any = {};
    for (let field of fields) {
      obj[field.fieldName] = readField(reader, field.fieldType);
    }

    gameMsg[protoType] = obj;
  }

  return config ? true : false;
}

function _objToMap(obj: any): Map<string, penetrateType> {
  let map = new Map();

  for (let key of Object.keys(obj)) {
    map.set(key, obj[key]);
  }

  return map;
}

function readField(reader: BufferReader, fieldType: string): any {
  switch (fieldType) {
    case "uint8": {
      return reader.readUint8();
    }
    case "uint32": {
      return reader.readUint32();
    }
    case "CardLocation": {
      return reader.readCardLocation();
    }
    default: {
      return undefined;
    }
  }
}
