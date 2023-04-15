// Copyright (c) 2020 hooke

import "./customProps";

import { createHost } from "@react-spring/animated";
import { Globals } from "@react-spring/core";
import { createStringInterpolator } from "@react-spring/shared";
import { applyInitialPropsToInstance } from "react-babylonjs";

import { WithAnimated } from "./animated";
import { primitives } from "./primitives";

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
