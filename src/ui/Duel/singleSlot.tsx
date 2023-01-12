import * as BABYLON from "@babylonjs/core";
import * as CONFIG from "../../config/ui";
import { CardState } from "../../reducers/duel/generic";
import { store } from "../../store";
import { useClick } from "./hook";
import { useRef } from "react";
import {
  setCardListModalInfo,
  setCardListModalIsOpen,
} from "../../reducers/duel/mod";

const shape = CONFIG.SingleSlotShape;
const depth = 0.02;

const SingleSlot = (props: {
  state: CardState[];
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
            props.state.map((item) => {
              return {
                name: item.occupant?.text.name,
                desc: item.occupant?.text.desc,
                imgUrl: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${item.occupant?.id}.jpg`,
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
      name="single-slot"
      ref={boxRef}
      scaling={
        new BABYLON.Vector3(
          shape.width,
          shape.height,
          depth * props.state.length
        )
      }
      position={props.position}
      rotation={props.rotation}
    >
      <standardMaterial
        name="single-slot-mat"
        diffuseTexture={
          new BABYLON.Texture(`http://localhost:3030/images/card_back.jpg`)
        }
        alpha={props.state.length == 0 ? 0 : 1}
      />
    </box>
  );
};

export default SingleSlot;
