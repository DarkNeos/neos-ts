import { MinusOutlined, UpOutlined } from "@ant-design/icons";
import { Modal, type ModalProps } from "antd";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

import { cancelOnRightClick } from "../../cancelOnRightClick";
import styles from "./index.module.scss";

export const NeosModal: React.FC<
  ModalProps & { movable?: boolean; onRightClickCancel?: () => void }
> = ({ movable = false, onRightClickCancel, ...props }) => {
  const [mini, setMini] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
  } | null>(null);

  const moveBy = (x: number, y: number) => {
    const rect = surface.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    // 弹窗超过窗口高度时，仍保持标题区域可见。
    const dx = Math.max(
      margin - rect.left,
      Math.min(x, window.innerWidth - margin - rect.right),
    );
    const dy = Math.max(
      margin - rect.top,
      Math.min(
        y,
        window.innerHeight -
          margin -
          rect.top -
          Math.min(rect.height, window.innerHeight - margin * 2),
      ),
    );
    setOffset((current) => ({ x: current.x + dx, y: current.y + dy }));
  };

  useEffect(() => {
    if (!props.open) setMini(false);
    setOffset({ x: 0, y: 0 });
    drag.current = null;
  }, [props.open]);

  useEffect(() => {
    const resetPosition = () => {
      setOffset({ x: 0, y: 0 });
      drag.current = null;
    };
    window.addEventListener("resize", resetPosition);
    return () => window.removeEventListener("resize", resetPosition);
  }, []);

  return (
    <Modal
      centered
      // 选卡时打开的详情抽屉不应挡住后续点选。
      zIndex={movable ? 1100 : undefined}
      maskClosable={!movable}
      onCancel={() => setMini(!mini)}
      closeIcon={mini ? <UpOutlined /> : <MinusOutlined />}
      style={{ padding: "10px 0" }}
      mask={!mini}
      wrapClassName={classNames({ [styles.wrap]: mini })}
      closable={true}
      {...props}
      wrapProps={{
        ...props.wrapProps,
        onContextMenu: cancelOnRightClick(
          props.open && !props.cancelButtonProps?.disabled
            ? onRightClickCancel
            : undefined,
        ),
      }}
      className={classNames(styles.modal, props.className, {
        [styles.mini]: mini,
        [styles.movable]: movable,
      })}
      maskStyle={
        movable
          ? { backgroundColor: "rgba(0, 0, 0, 0.12)", ...props.maskStyle }
          : props.maskStyle
      }
      title={
        movable ? (
          <div
            className={styles["drag-handle"]}
            data-testid="duel-selection-drag-handle"
            role="button"
            tabIndex={0}
            aria-label="移动窗口"
            title="拖动标题移动，双击复位；方向键微调"
            onDoubleClick={() => setOffset({ x: 0, y: 0 })}
            onKeyDown={(event) => {
              const steps: Record<string, [number, number]> = {
                ArrowLeft: [-16, 0],
                ArrowRight: [16, 0],
                ArrowUp: [0, -16],
                ArrowDown: [0, 16],
              };
              const step = steps[event.key];
              if (step) {
                event.preventDefault();
                moveBy(...step);
              }
            }}
            onPointerDown={(event) => {
              if (mini || event.button !== 0) return;
              drag.current = {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
              event.preventDefault();
            }}
            onPointerMove={(event) => {
              const previous = drag.current;
              if (!previous || previous.pointerId !== event.pointerId) return;
              moveBy(event.clientX - previous.x, event.clientY - previous.y);
              drag.current = {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
              };
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
          >
            <span className={styles.grip} aria-hidden="true">
              ⠿
            </span>
            <span>{props.title}</span>
          </div>
        ) : (
          props.title
        )
      }
      modalRender={
        movable
          ? (node) => (
              <div
                ref={surface}
                data-testid="duel-movable-selection"
                style={{
                  transform: `translate(${mini ? 0 : offset.x}px, ${
                    mini ? 0 : offset.y
                  }px)`,
                }}
              >
                {props.modalRender ? props.modalRender(node) : node}
              </div>
            )
          : props.modalRender
      }
      open={props.open}
    />
  );
};
