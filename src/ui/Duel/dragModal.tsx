// 经过封装的可拖拽`Modal`
import React, { useState } from "react";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import { Modal, ModalProps } from "antd";

export interface DragModalProps {
  modalProps: ModalProps;
  dragRef: React.RefObject<HTMLDivElement>;
  draggable: boolean;
  children?: React.ReactNode;
}

const DragModal = (props: DragModalProps) => {
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = props.dragRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  return (
    <Modal
      {...props.modalProps}
      modalRender={(modal) => (
        <Draggable
          disabled={!props.draggable}
          bounds={bounds}
          onStart={onStart}
        >
          <div ref={props.dragRef}>{modal}</div>
        </Draggable>
      )}
    >
      {props.children}
    </Modal>
  );
};

export default DragModal;
