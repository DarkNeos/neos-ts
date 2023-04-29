import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import LazyLoad, { Loading } from "./LazyLoad";

const Login = React.lazy(() => import("./Login"));
const WaitRoom = React.lazy(() => import("./WaitRoom"));
const Mora = React.lazy(() => import("./Mora"));
const NeosDuel = React.lazy(() => import("./Duel/Main"));
const Mat = React.lazy(() => import("./Duel/PlayMat2"));

export default function () {
  return (
    <Routes>
      <Route path="/" element={<LazyLoad lazy={<Login />} />} />
      <Route
        path="/room/:player/:passWd/:ip"
        element={
          <Suspense fallback={<Loading />}>
            <WaitRoom />
          </Suspense>
        }
      />
      <Route
        path="/mora/:player/:passWd/:ip"
        element={
          <Suspense fallback={<Loading />}>
            <Mora />
          </Suspense>
        }
      />
      <Route
        path="/duel/:player/:passWd/:ip"
        element={
          <Suspense fallback={<Loading />}>
            <Mat />
          </Suspense>
        }
      />
    </Routes>
  );
}
