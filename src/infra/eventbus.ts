import { EventEmitter } from "eventemitter3";

window.eventBus = new EventEmitter();

enum Report {
  Move = "move",
}

// @ts-ignore
window.Report = Report;
