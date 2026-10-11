import { PlayCircleOutlined } from "@ant-design/icons";
import { Alert, App, Checkbox, Form, InputNumber, Modal, Radio } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  type IDeck,
  resetUniverse,
  type TrainingOptions,
  trainingStore,
} from "@/stores";
import { disconnectSession } from "@/ui/Match/util";

import {
  isTrainingHandSize,
  MAX_TRAINING_HAND_SIZE,
  MIN_TRAINING_HAND_SIZE,
  readTrainingOptions,
  saveTrainingOptions,
  startTraining,
} from "./util";

/** 输入框清空期间允许 null，提交前再转换为有效的训练设置。 */
interface TrainingFormOptions extends Omit<TrainingOptions, "handSize"> {
  handSize: number | null;
}

/** 在卡组编辑器中配置开局规则，并在点击开始时读取最新的编辑内容。 */
export const TrainingModal: React.FC<{
  open: boolean;
  onClose: () => void;
  getDeck: () => IDeck;
}> = ({ open, onClose, getDeck }) => {
  const { t } = useTranslation("BuildDeck");
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [options, setOptions] =
    useState<TrainingFormOptions>(readTrainingOptions);
  const [loading, setLoading] = useState(false);
  // 取消弹窗后使旧请求失效，避免迟到的连接结果再次跳转等待房间。
  const request = useRef(0);

  /** 只有当前请求可以更新提示和路由，防止取消或重复点击产生竞态。 */
  const start = async () => {
    if (loading) return;
    const token = ++request.current;
    setLoading(true);
    try {
      const handSize = options.handSize;
      if (!isTrainingHandSize(handSize)) {
        throw new Error(
          t("TrainingInvalidHandSize", {
            min: MIN_TRAINING_HAND_SIZE,
            max: MAX_TRAINING_HAND_SIZE,
          }),
        );
      }
      const settings = { ...options, handSize };
      saveTrainingOptions(settings);
      if (
        (await startTraining({ ...settings, deck: getDeck() })) &&
        token === request.current
      ) {
        onClose();
        navigate("/waitroom");
      }
    } catch (error) {
      if (token === request.current) {
        message.error(
          error instanceof Error ? error.message : t("TrainingFailed"),
        );
      }
    } finally {
      if (token === request.current) setLoading(false);
    }
  };

  return (
    <Modal
      title={t("TrainingSettings")}
      open={open}
      centered
      width={440}
      okText={t("StartTraining")}
      okButtonProps={{ icon: <PlayCircleOutlined />, id: "training-start" }}
      confirmLoading={loading}
      maskClosable={!loading}
      onOk={() => void start()}
      onCancel={() => {
        // 先使异步结果失效，再关闭已建立的连接和训练状态。
        request.current += 1;
        if (trainingStore.session) {
          disconnectSession();
          resetUniverse();
        }
        setLoading(false);
        onClose();
      }}
    >
      <Form layout="vertical" disabled={loading}>
        <Form.Item label={t("TrainingTurnOrder")}>
          <Radio.Group
            value={options.first}
            onChange={(event) =>
              setOptions({ ...options, first: event.target.value })
            }
          >
            <Radio value={true} data-testid="training-first">
              {t("TrainingFirst")}
            </Radio>
            <Radio value={false} data-testid="training-second">
              {t("TrainingSecond")}
            </Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          label={t("TrainingHandSize")}
          extra={t("TrainingHandSizeRange", {
            min: MIN_TRAINING_HAND_SIZE,
            max: MAX_TRAINING_HAND_SIZE,
          })}
        >
          <InputNumber
            aria-label={t("TrainingHandSize")}
            data-testid="training-hand-size"
            min={MIN_TRAINING_HAND_SIZE}
            max={MAX_TRAINING_HAND_SIZE}
            precision={0}
            value={options.handSize}
            onChange={(handSize) => setOptions({ ...options, handSize })}
          />
        </Form.Item>
        <Form.Item>
          <Checkbox
            data-testid="training-no-shuffle"
            checked={options.noShuffle}
            onChange={(event) =>
              setOptions({ ...options, noShuffle: event.target.checked })
            }
          >
            {t("TrainingNoShuffle")}
          </Checkbox>
        </Form.Item>
      </Form>
      <Alert type="info" showIcon message={t("TrainingCurrentDeck")} />
    </Modal>
  );
};
