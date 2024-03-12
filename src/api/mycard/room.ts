/* 一些MC服创建/加入房间相关的通用函数 */

import { Options } from "./options";

enum RoomAction {
  CreatePublic = 1,
  CreatePrivate = 2,
  JoinPublic = 3,
  JoinPrivate = 5,
}

export interface Room {
  id?: string;
  title?: string;
  users?: { username: string; position: number; avatar?: string }[];
  options: Options;
}

// 通过房间ID和external_id加密得出房间密码
//
// 用于加入MC服房间
export function getJoinRoomPasswd(
  roomID: string,
  external_id: number,
  _private: boolean = false,
): string {
  const optionsBuffer = new Uint8Array(6);
  optionsBuffer[1] =
    (_private ? RoomAction.JoinPrivate : RoomAction.JoinPublic) << 4;

  encryptBuffer(optionsBuffer, external_id);

  const base64String = btoa(String.fromCharCode(...optionsBuffer));

  return base64String + roomID;
}

// 获取创建房间的密码
export function getCreateRoomPasswd(
  options: Options,
  roomID: string,
  external_id: number,
  _private: boolean = false,
) {
  // ref: https://docs.google.com/document/d/1rvrCGIONua2KeRaYNjKBLqyG9uybs9ZI-AmzZKNftOI/edit
  const optionsBuffer = new Uint8Array(6);
  optionsBuffer[1] =
    ((_private ? RoomAction.CreatePrivate : RoomAction.CreatePublic) << 4) |
    (options.duel_rule << 1) |
    (options.auto_death ? 0x1 : 0);

  optionsBuffer[2] =
    (options.rule << 5) |
    (options.mode << 3) |
    (options.no_check_deck ? 1 << 1 : 0) |
    (options.no_shuffle_deck ? 1 : 0);
  writeUInt16LE(optionsBuffer, 3, options.start_lp);
  optionsBuffer[5] = (options.start_hand << 4) | options.draw_count;

  encryptBuffer(optionsBuffer, external_id);
  const base64String = btoa(String.fromCharCode(...optionsBuffer));

  return base64String + roomID;
}

// 填充校验码和加密
function encryptBuffer(buffer: Uint8Array, external_id: number) {
  let checksum = 0;

  for (let i = 1; i < buffer.length; i++) {
    checksum -= buffer[i];
  }

  buffer[0] = checksum & 0xff;

  const secret = (external_id % 65535) + 1;

  for (let i = 0; i < buffer.length; i += 2) {
    const value = readUInt16LE(buffer, i);
    const xorResult = value ^ secret;
    writeUInt16LE(buffer, i, xorResult);
  }
}

// 获取私密房间ID
export function getPrivateRoomID(external_id: number): number {
  return external_id ^ 0x54321;
}

/* 一些辅助函数 */

function readUInt16LE(buffer: Uint8Array, offset: number): number {
  return (buffer[offset + 1] << 8) | buffer[offset];
}

function writeUInt16LE(buffer: Uint8Array, offset: number, value: number) {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >> 8) & 0xff;
}
