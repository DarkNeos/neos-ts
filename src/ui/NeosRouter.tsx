import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Component, loader } from "./Layout";
import { RouteError } from "./RouteError";

const router = createBrowserRouter([
  {
    path: "/",
    Component,
    loader,
    ErrorBoundary: RouteError,
    children: [
      {
        path: "/",
        lazy: () => import("./Start"),
      },
      {
        path: "/match/*",
        lazy: () => import("./Match"),
      },
      {
        path: "/build",
        lazy: () => import("./BuildDeck"),
      },
      {
        path: "/waitroom",
        lazy: () => import("./WaitRoom"),
      },
      {
        path: "/duel",
        lazy: () => import("./Duel/Main"),
      },
      {
        path: "/side",
        lazy: () => import("./Side"),
      },
    ],
  },
]);

export const NeosRouter = () => <RouterProvider router={router} />;
