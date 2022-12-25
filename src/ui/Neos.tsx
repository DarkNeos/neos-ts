import React from "react";
import JoinRoom from "./JoinRoom";
import WaitRoom from "./WaitRoom";
import ThreeJs from "./ThreeJs";
import { Routes, Route } from "react-router-dom";
import Mora from "./Mora";
import Duel from "./Duel/mod";

export default function () {
  // FIXME: 这里Mora/Duel路由应该由每个房间指定一个路径
  return (
    <Routes>
      <Route path="/" element={<JoinRoom />} />
      <Route path="/:player/:passWd/:ip" element={<WaitRoom />} />
      <Route path="/mora" element={<Mora />} />
      <Route path="/duel" element={<Duel />} />
      <Route path="/three" element={<ThreeJs />} />
    </Routes>
  );
}
