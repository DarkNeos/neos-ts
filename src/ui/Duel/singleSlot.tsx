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
import { interactTypeToString } from "./util";

const shape = CONFIG.SingleSlotShape;
export const Depth = 0.005;

const SingleSlot = (props: {
  state: CardState[];
  position: BABYLON.Vector3;
  rotation: BABYLON.Vector3;
}) => {
  const boxRef = useRef(null);
  const dispatch = store.dispatch;
  const edgeRender =
    props.state.find((item) =>
      item === undefined ? false : item.idleInteractivities.length > 0
    ) !== undefined;
  const edgesWidth = 2.0;

  useClick(
    (_event) => {
      if (props.state.length != 0) {
        dispatch(
          setCardListModalInfo(
            props.state
              .filter(
                (item) => item.occupant !== undefined && item.occupant.id !== 0
              )
              .map((item) => {
                return {
                  name: item.occupant?.text.name,
                  desc: item.occupant?.text.desc,
                  imgUrl: `https://cdn02.moecube.com:444/images/ygopro-images-zh-CN/${item.occupant?.id}.jpg`,
                  interactivies: item.idleInteractivities.map((interactivy) => {
                    return {
                      desc: interactTypeToString(interactivy.interactType),
                      response: interactivy.response,
                    };
                  }),
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
          Depth * props.state.length
        )
      }
      position={props.position}
      rotation={props.rotation}
      enableEdgesRendering
      edgesWidth={edgeRender ? edgesWidth : 0}
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
