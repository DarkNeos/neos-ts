import React from "react";
import JoinRoom from "./JoinRoom";
import WaitRoomV2 from "./WaitRoom";
import { Routes, Route } from "react-router-dom";
import Mora from "./Mora";
import NeosDuel from "./Duel/main";

export default function () {
  // FIXME: 这里Mora/Duel路由应该由每个房间指定一个路径
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoomV2 />} />
      <Route path="/mora" element={<Mora />} />
      <Route path="/duel" element={<NeosDuel />} />
    </Routes>
  );
}
