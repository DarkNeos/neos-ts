import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Card, Modal } from "antd";
import React, { useEffect, useState } from "react";
import { useSnapshot } from "valtio";

import { sendSortCardResponse } from "@/api";
import { CardMeta } from "@/api/cards";
import { useConfig } from "@/config";
import { messageStore } from "@/stores";

const NeosConfig = useConfig();

const { sortCardModal } = messageStore;

export const SortCardModal = () => {
  const snapSortCardModal = useSnapshot(sortCardModal);
  const isOpen = snapSortCardModal.isOpen;
  const options = snapSortCardModal.options;
  const [items, setItems] = useState(options);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onFinish = () => {
    sendSortCardResponse(items.map((item) => item.response));
    sortCardModal.isOpen = false;
    sortCardModal.options = [];
  };
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.response == active.id);
        const newIndex = items.findIndex((item) => item.response === over?.id);
        // @ts-ignore
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    setItems(options);
  }, [options]);

  return (
    <Modal
      title="请为下列卡牌排序"
      open={isOpen}
      closable={false}
      footer={<Button onClick={onFinish}>finish</Button>}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.response)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableItem
              key={item.response}
              id={item.response}
              meta={item.meta}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Modal>
  );
};

const SortableItem = (props: { id: number; meta: CardMeta }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        style={{ width: 100 }}
        cover={
          <img
            alt={props.meta.id.toString()}
            src={`${NeosConfig.cardImgUrl}/${props.meta.id}.jpg`}
          />
        }
      />
    </div>
  );
};
