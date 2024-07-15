import { Container } from "./impl";

export { Context } from "./context";
export { Container } from "./impl";

// Global collection of `Container`s
export const CONTAINERS: Map<string, Container> = new Map();
