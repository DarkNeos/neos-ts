import React from "react";
import JoinRoom from "./JoinRoom";
import WaitRoom from "./WaitRoom";
import { Routes, Route } from "react-router-dom";
import Mora from "./Mora";
import Duel from "./Duel/mod";
import BabylonCanvas from "./Duel/babylon";

export default function () {
  // FIXME: 这里Mora/Duel路由应该由每个房间指定一个路径
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoom />} />
      <Route path="/mora" element={<Mora />} />
      <Route path="/duel" element={<BabylonCanvas />} />
      <Route path="/react-babylon" element={<BabylonCanvas />} />
    </Routes>
  );
}
