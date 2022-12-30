// Copyright (c) 2020 hooke

import { intrinsicClassMap } from "react-babylonjs";

const elements = Object.keys(intrinsicClassMap);

/**
 * https://github.com/react-spring/react-spring/blob/v9/targets/three/src/primitives.ts
 */

export type Primitives = keyof JSX.IntrinsicElements;

export const primitives = ["primitive"].concat(elements) as Primitives[];
