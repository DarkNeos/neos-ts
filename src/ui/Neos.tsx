import React from "react";
import { Routes, Route } from "react-router-dom";
import LazyLoad, { lazyImport } from "./LazyLoad";

const Login = lazyImport("./Login");
const WaitRoom = lazyImport("./WaitRoom");
const Mora = lazyImport("./Mora");
const NeosDuel = lazyImport("./Duel/main");

export default function () {
  // FIXME: 这里Mora/Duel路由应该由每个房间指定一个路径
  return (
    <Routes>
      <Route path="/" element={<LazyLoad lazy={<Login />} />} />
      <Route
        path="/room/:player/:passWd/:ip"
        element={<LazyLoad lazy={<WaitRoom />} />}
      />
      <Route
        path="/mora/:player/:passWd/:ip"
        element={<LazyLoad lazy={<Mora />} />}
      />
      <Route
        path="/duel/:player/:passWd/:ip"
        element={<LazyLoad lazy={<NeosDuel />} />}
      />
    </Routes>
  );
}
