import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { Cemetery } from "../../reducers/duel/util";
import {
  selectMeCemetery,
  selectOpCemetery,
} from "../../reducers/duel/cemeretySlice";
import { store } from "../../store";
import { useAppSelector } from "../../hook";
import { useClick } from "./hook";
import { useRef } from "react";
import {
  setCardListModalInfo,
  setCardListModalIsOpen,
} from "../../reducers/duel/mod";

const shape = CONFIG.CemeterySlotShape();
const depth = 0.02;

const Cemeteries = () => {
  const meCemetery = useAppSelector(selectMeCemetery).cemetery;
  const opCemetery = useAppSelector(selectOpCemetery).cemetery;

  return (
    <>
      <CCemetery
        state={meCemetery}
        position={cemeteryPosition(0, meCemetery.length)}
        rotation={CONFIG.CardSlotRotation(false)}
      />
      <CCemetery
        state={opCemetery}
        position={cemeteryPosition(1, opCemetery.length)}
        rotation={CONFIG.CardSlotRotation(true)}
      />
    </>
  );
};

const CCemetery = (props: {
  state: Cemetery[];
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
}) => {
  const boxRef = useRef(null);
  const dispatch = store.dispatch;

  useClick(
    (_event) => {
      if (props.state.length != 0) {
        dispatch(
          setCardListModalInfo(
            props.state.map((cemetery) => {
              return {
                name: cemetery.meta.text.name,
                desc: cemetery.meta.text.desc,
                imgUrl: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${cemetery.meta.id}.jpg`,
              };
            })
          )
        );
        dispatch(setCardListModalIsOpen(true));
      }
    },
    boxRef,
    [props.state]
  );

  return (
    <box
      name="cemetery"
      width={shape.width}
      height={shape.height}
      depth={depth * props.state.length}
      position={props.position}
      rotation={props.rotation}
    >
      <standardMaterial
        name="cemetery-mat"
        diffuseTexture={
          new BABYLON.Texture(`http://localhost:3030/images/card_back.jpg`)
        }
        alpha={props.state.length == 0 ? 0 : 1}
      />
    </box>
  );
};

const cemeteryPosition = (player: number, cemeteryLength: number) => {
  const x = player == 0 ? 3.2 : -3.2;
  const y = (depth * cemeteryLength) / 2 + CONFIG.Floating;
  const z = player == 0 ? -2.0 : 2.0;

  return new BABYLON.Vector3(x, y, z);
};

export default Cemeteries;
