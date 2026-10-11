import { DownloadOutlined } from "@ant-design/icons";
import { Button, type ButtonProps } from "antd";
import { useSnapshot } from "valtio";

import { replayStore } from "@/stores";

export const SaveReplayButton = ({
  previous = false,
  alwaysVisible = false,
  size,
  type,
}: {
  previous?: boolean;
  alwaysVisible?: boolean;
  size?: ButtonProps["size"];
  type?: ButtonProps["type"];
}) => {
  const { recordedCount, lastReplay, isReplay } = useSnapshot(replayStore);
  const canSave = (recordedCount > 0 && !isReplay) || Boolean(lastReplay);
  if (!canSave && !alwaysVisible) return null;
  const label = previous ? "保存上一局录像" : "保存录像";
  return (
    <Button
      aria-label={label}
      data-testid="save-replay"
      icon={<DownloadOutlined />}
      size={size}
      type={type}
      disabled={!canSave}
      onClick={() => replayStore.download()}
    >
      {label}
    </Button>
  );
};
