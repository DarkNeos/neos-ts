import React, { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppSelector } from "../../hook";
import { selectSortCardModal } from "../../reducers/duel/modal/sortCardModalSlice";
import { sendSortCardResponse } from "../../api/ocgcore/ocgHelper";
import { store } from "../../store";
import { resetSortCardModal } from "../../reducers/duel/mod";
import DragModal from "./dragModal";
import { Button, Card } from "antd";
import { CardMeta } from "../../api/cards";
import NeosConfig from "../../../neos.config.json";

const SortCardModal = () => {
  const dispatch = store.dispatch;
  const state = useAppSelector(selectSortCardModal);
  const isOpen = state.isOpen;
  const options = state.options;
  const [items, setItems] = useState(options);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onFinish = () => {
    sendSortCardResponse(items.map((item) => item.response));
    dispatch(resetSortCardModal());
  };
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.response == active.id);
        const newIndex = items.findIndex((item) => item.response === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    setItems(options);
  }, [options]);

  return (
    <DragModal
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
    </DragModal>
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

export default SortCardModal;
