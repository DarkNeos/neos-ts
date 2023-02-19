import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Login = React.lazy(() => import("./Login"));
const WaitRoom = React.lazy(() => import("./WaitRoom"));
const Mora = React.lazy(() => import("./Mora"));
const NeosDuel = React.lazy(() => import("./Duel/main"));

export default function () {
  // FIXME: 这里Mora/Duel路由应该由每个房间指定一个路径
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/room/:player/:passWd/:ip"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <WaitRoom />
          </Suspense>
        }
      />
      <Route
        path="/room/:player/:passWd/:ip"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <Mora />
          </Suspense>
        }
      />
      <Route
        path="/room/:player/:passWd/:ip"
        element={
          <Suspense fallback={<div>Loading...</div>}>
            <NeosDuel />
          </Suspense>
        }
      />
    </Routes>
  );
}
