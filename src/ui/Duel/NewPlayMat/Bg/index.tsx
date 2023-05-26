import { type FC } from "react";
import classnames from "classnames";
import "./index.scss";

const BgRow: FC<{ isExtra?: boolean; isSzone?: boolean }> = ({
  isExtra = false,
  isSzone = false,
}) => (
  <div className={classnames("bg-row")}>
    {Array.from({ length: isExtra ? 2 : 5 }).map((_, i) => (
      <div
        key={i}
        className={classnames("block", { extra: isExtra }, { szone: isSzone })}
      ></div>
    ))}
  </div>
);

export const Bg: FC = () => {
  return (
    <div className="mat-bg">
      <BgRow isSzone />
      <BgRow />
      <BgRow isExtra />
      <BgRow />
      <BgRow isSzone />
    </div>
  );
};
