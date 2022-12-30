// Copyright (c) 2020 hooke

import { Globals } from "@react-spring/core";
import { createHost } from "@react-spring/animated";
import { createStringInterpolator } from "@react-spring/shared";
import { applyInitialPropsToInstance } from "react-babylonjs";
import { primitives } from "./primitives";
import { WithAnimated } from "./animated";
import "./customProps";

// todo: frameLoop can use runRenderLoop
Globals.assign({
  createStringInterpolator,
});

const host = createHost(primitives, {
  applyAnimatedValues: applyInitialPropsToInstance,
});

export const animated = host.animated as WithAnimated;
export * from "./animated";
export * from "@react-spring/core";
