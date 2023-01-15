import React from "react";

export const Button2D = (props: {
  text: string;
  left: number;
  enable: boolean;
  onClick: () => void;
}) => (
  <adtFullscreenUi name="ui">
    <rectangle
      name="rect"
      height="20px"
      width="60px"
      isEnabled={props.enable}
      left={props.left}
    >
      <rectangle>
        <babylon-button
          name="close-icon"
          onPointerDownObservable={props.onClick}
        >
          <textBlock
            text={props.text}
            fontFamily="FontAwesome"
            fontStyle="bold"
            fontSize={15}
            color={props.enable ? "yellow" : "white"}
          />
        </babylon-button>
      </rectangle>
    </rectangle>
  </adtFullscreenUi>
);
