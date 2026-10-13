import type { Browser, BrowserContext, Page } from "@playwright/test";

export type AgentMode = "headed" | "headless";
export type LlmProvider = "stub" | "openai" | "codex";
export type LlmAuthProvider = "env" | "codex-cli" | "none";

export type CliOptionValue = string | boolean;

export interface ParsedCli {
  command: string;
  positional: string[];
  options: Record<string, CliOptionValue>;
}

export interface AgentConfig {
  rootDir: string;
  command: string;
  positional: string[];
  baseURL: string;
  startPath: string;
  duelUrl: string;
  mode: AgentMode;
  slowMo: number;
  maxSteps: number;
  stepDelayMs: number;
  actionTimeoutMs: number;
  dryRun: boolean;
  storageState: string;
  storageStateExists: boolean;
  logDir: string;
  runId: string;
  llm: {
    provider: LlmProvider;
    authProvider: LlmAuthProvider;
    model: string;
    baseURL: string;
    codexHarnessUrl: string;
    codexHome: string;
    codexAuthFile?: string;
  };
  /** Local HTTP harness settings used when wrapping Codex CLI as a provider. */
  harness: {
    host: string;
    port: number;
    path: string;
    codexCommand: string;
    codexTimeoutMs: number;
  };
}

export interface AgentBrowserRuntime {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

export interface StorageStateInspection {
  exists: boolean;
  path: string;
  size?: number;
  updatedAt?: string;
}

export interface CodexAuthInspection {
  available: boolean;
  source: "codex-cache";
  path: string;
  credentialKind?: string;
  reason?: string;
}

export interface OpenAiCredential {
  source: "env";
  kind: string;
  token: string;
}

export interface RawObservedCard {
  uuid: string | null;
  code: string | null;
  controller: string | null;
  zone: string | null;
  sequence: string | null;
  position: string | null;
  selectable: boolean;
  idleActions: string[];
  visible: boolean;
}

export type VisibleModal =
  | "yesno"
  | "position"
  | "option"
  | "select_cards"
  | "announce"
  | "end";

export interface RawDuelObservation {
  url: string;
  title: string;
  phase: string;
  canChoosePhase: boolean;
  life: Record<string, number>;
  cards: RawObservedCard[];
  visibleModal?: VisibleModal;
  endResult: string;
}

export interface PlayerSemanticState {
  hand: string[] | string;
  monsters: string[];
  spellsAndTraps: string[];
  graveyard: string[];
  banished: string[];
  extraDeck: string;
}

export interface DuelObservation {
  url: string;
  isDuelPage: boolean;
  phase: string;
  life: {
    self: number;
    opponent: number;
  };
  self: PlayerSemanticState & { hand: string[] };
  opponent: PlayerSemanticState & { hand: string };
  pendingInteraction: string;
  recentHistory: string[];
  raw: RawDuelObservation;
  summary: string;
}

export interface RawActionCard {
  uuid: string | null;
  code: string | null;
  controller: string | null;
  zone: string | null;
  sequence: string | null;
  position: string | null;
  idleActions: string[];
  selectable: boolean;
}

export interface RawActionZone {
  zone: string | null;
  controller: string | null;
  sequence: string | null;
}

export interface RawActionOption {
  text: string;
  response: string | null;
}

export interface RawActionPosition {
  position: string;
}

export interface RawSelectCardOption {
  code: string | null;
  controller: string | null;
  zone: string | null;
  sequence: string | null;
}

export interface RawActionSnapshot {
  cards: RawActionCard[];
  phase: {
    visible: boolean;
    enabled: boolean;
    available: string[];
  };
  zones: RawActionZone[];
  options: RawActionOption[];
  positions: RawActionPosition[];
  selectCards: RawSelectCardOption[];
  yesVisible: boolean;
  noVisible: boolean;
}

export type AgentActionKind =
  | "card_action"
  | "phase"
  | "select_card"
  | "select_place"
  | "select_option"
  | "select_position"
  | "select_yesno"
  | "announce"
  | "wait"
  | "surrender";

export interface AgentPrivateAction {
  id: string;
  kind: AgentActionKind;
  llmDescription: string;
  observationSummary?: string;
  selector?: string;
  action?: string;
  phase?: "battle" | "main2" | "end";
  answer?: "yes" | "no";
  debug?: unknown;
}

export type NewAgentPrivateAction = Omit<
  AgentPrivateAction,
  "id" | "observationSummary"
>;

export interface LlmVisibleAction {
  id: string;
  description: string;
}

export interface LlmDecisionRequest {
  version: 1;
  duelId: string;
  stepId: number;
  instruction: string;
  gameState: {
    summary: string;
    turn: number | "unknown";
    phase: string;
    life: DuelObservation["life"];
    self: DuelObservation["self"];
    opponent: DuelObservation["opponent"];
    pendingInteraction: string;
    recentHistory: string[];
  };
  legalActions: LlmVisibleAction[];
}

export interface LlmDecisionResponse {
  version: 1;
  stepId: number;
  actionId: string;
  reason: string;
}

/** HTTP payload sent from the Agent Codex provider to a Codex harness server. */
export interface CodexHarnessDecisionRequest {
  /** Runtime discriminator; lets future harnesses reject incompatible payloads. */
  runtime: "codex";
  /** Auth profile selected by the Agent. The harness owns actual credential use. */
  authProfile: LlmAuthProvider;
  /** Optional Codex CLI model override; empty string means use CLI defaults. */
  model: string;
  /** Semantic duel state and legal actions for the model to choose from. */
  request: LlmDecisionRequest;
}

export interface LlmClient {
  decide: (
    request: LlmDecisionRequest,
    privateActions: AgentPrivateAction[],
  ) => Promise<LlmDecisionResponse>;
}

export interface ExecutionResult {
  executed: boolean;
  dryRun?: boolean;
  actionId: string;
  kind?: AgentActionKind;
  description: string;
}
