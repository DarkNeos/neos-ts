import { Button, Modal } from "antd";
import { useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { ygopro } from "@/api";
import { cardStore, matStore, replayStore } from "@/stores";
import { connectionStore } from "@/stores/connectionStore";
import { registerDuelDialogReset } from "@/stores/duelDialogs";
import { fieldSelection } from "@/stores/fieldSelection";

import { cancelOnRightClick } from "../../cancelOnRightClick";
import {
  battlePhase,
  battleStep,
  damage,
  damageCalc,
  drawPhase,
  endPhase,
  mainPhase1,
  mainPhase2,
  standbyPhase,
  unknown,
} from "../labels";
import styles from "./index.module.scss";

import Phase = ygopro.StocGameMessage.MsgNewPhase.PhaseType;

const phases = [
  { id: "draw", text: "Draw", label: drawPhase },
  { id: "standby", text: "Standby", label: standbyPhase },
  { id: "main1", text: "Main1", label: mainPhase1 },
  { id: "battle", text: "Battle", label: battlePhase },
  { id: "main2", text: "Main2", label: mainPhase2 },
  { id: "end", text: "End", label: endPhase },
] as const;
type PhaseId = (typeof phases)[number]["id"];

const phaseIds: Partial<Record<Phase, PhaseId>> = {
  [Phase.DRAW]: "draw",
  [Phase.STANDBY]: "standby",
  [Phase.MAIN1]: "main1",
  [Phase.BATTLE_START]: "battle",
  [Phase.BATTLE_STEP]: "battle",
  [Phase.DAMAGE]: "battle",
  [Phase.DAMAGE_GAL]: "battle",
  [Phase.BATTLE]: "battle",
  [Phase.MAIN2]: "main2",
  [Phase.END]: "end",
};
const battleSteps: Partial<Record<Phase, string>> = {
  [Phase.BATTLE_STEP]: "01",
  [Phase.DAMAGE]: "02",
  [Phase.DAMAGE_GAL]: "03",
};
const stepLabels: Partial<Record<Phase, string>> = {
  [Phase.BATTLE_STEP]: battleStep,
  [Phase.DAMAGE]: damage,
  [Phase.DAMAGE_GAL]: damageCalc,
};

export const PhaseControl = () => {
  const { phase, turnCount, currentPlayer, selfType, duelEnd } =
    useSnapshot(matStore);
  const { isReplay } = useSnapshot(replayStore);
  const { offline } = useSnapshot(connectionStore);
  const { active: selecting } = useSnapshot(fieldSelection);
  const { inner } = useSnapshot(cardStore);
  const [open, setOpen] = useState(false);
  const currentId = phaseIds[phase.currentPhase];
  const displayedRequestId = phase.command?.id;
  const current = phases.find(({ id }) => id === currentId);
  const available = matStore.activeActions.phases(currentId);
  const ownTurn = currentPlayer >= 0 && matStore.isMe(currentPlayer);
  const active =
    !!phase.command &&
    [1, 2].includes(selfType) &&
    matStore.isMe(phase.command.player) &&
    ownTurn &&
    !duelEnd &&
    !isReplay &&
    !offline &&
    !selecting &&
    available.length > 0;
  const hint =
    active && !inner.some((card) => card.idleInteractivities.length > 0);
  const step = battleSteps[phase.currentPhase];

  useEffect(() => registerDuelDialogReset(() => setOpen(false)), []);
  useEffect(() => {
    setOpen(false);
  }, [phase.command, phase.currentPhase, active, turnCount]);

  const choose = (id: PhaseId) => {
    if (id === phaseIds[matStore.phase.currentPhase]) {
      setOpen(false);
      return;
    }
    matStore.activeActions.submitPhase(
      displayedRequestId,
      id,
      phaseIds[matStore.phase.currentPhase],
    );
    setOpen(false);
  };

  return (
    <>
      <div
        className={styles.control}
        data-owner={currentPlayer < 0 ? "none" : ownTurn ? "self" : "opponent"}
      >
        <button
          key={`${turnCount}-${currentPlayer}`}
          type="button"
          className={styles.button}
          data-testid="duel-phase-select"
          data-current-phase={current?.id ?? "unknown"}
          data-available-phases={active ? available.join(" ") : ""}
          data-hint={hint}
          data-active={active}
          aria-label={`第 ${turnCount} 回合，${
            current?.label ?? unknown
          }，选择阶段`}
          aria-haspopup="dialog"
          aria-expanded={open && active}
          title={stepLabels[phase.currentPhase] ?? current?.label ?? unknown}
          disabled={!active}
          onClick={() => {
            if (active) setOpen(true);
          }}
        >
          <span className={styles.turn} data-testid="duel-phase-turn">
            TURN {turnCount || "—"}
          </span>
          <strong>{current?.text ?? "—"}</strong>
          <span className={styles.step} data-testid="duel-phase-step">
            {step ?? ""}
          </span>
          <span className={styles.chevron} aria-hidden="true">
            ⌄
          </span>
        </button>
      </div>
      <Modal
        open={open && active}
        onCancel={() => setOpen(false)}
        wrapProps={{
          onContextMenu: cancelOnRightClick(
            open && active ? () => setOpen(false) : undefined,
          ),
        }}
        footer={null}
        closable={false}
        width="min(940px, calc(100vw - 24px))"
        className={styles.picker}
        wrapClassName={styles.wrap}
        title={<span className={styles.srOnly}>选择阶段</span>}
        destroyOnClose
      >
        <div data-testid="duel-phase-picker">
          <div className={styles.pickerTurn}>TURN {turnCount || "—"}</div>
          <div className={styles.phases}>
            {phases.map(({ id, text, label }) => {
              const selected = id === current?.id;
              const enabled = available.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  className={styles.node}
                  data-testid={`duel-phase-${id}`}
                  data-phase={id}
                  data-current={selected}
                  data-available={!!enabled && !selected}
                  aria-label={label}
                  aria-current={selected ? "step" : undefined}
                  title={label}
                  disabled={!selected && !enabled}
                  onClick={() => choose(id)}
                >
                  <span className={styles.disc}>
                    <PhaseIcon phase={id} />
                    <span>{text}</span>
                  </span>
                  <span className={styles.nodeMark} aria-hidden="true">
                    {selected ? "◆" : enabled ? "›" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <Button className={styles.cancel} onClick={() => setOpen(false)}>
            取消
          </Button>
        </div>
      </Modal>
    </>
  );
};

const paths: Record<PhaseId, string> = {
  draw: "M8 4h12v16H8zM4 8v16h12M11 9h6M11 13h6",
  standby: "M6 3h16M6 25h16M8 3v5l12 12v5M20 3v5L8 20v5M10 7h8M10 21h8",
  main1: "M7 3h14v22H7zM11 8h6M11 12h6M14 16v5",
  battle:
    "m5 3 7 4 10 15-3 3L8 10Zm18 0-7 4L6 22l3 3 11-15ZM3 18l7 7M18 25l7-7",
  main2: "M7 3h14v22H7zM11 8h6M11 12h6M12 16v5M16 16v5",
  end: "M7 25V3h15l-3 5 3 5H7M3 25h8",
};
const PhaseIcon = ({ phase }: { phase: PhaseId }) => (
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <path
      d={paths[phase]}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
