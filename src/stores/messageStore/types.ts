export interface ModalState {
  // 指示器选择弹窗
  checkCounterModal: {
    isOpen: boolean;
    counterType?: number;
    min?: number;
    options: {
      code: number;
      max: number;
    }[];
  };
  // 宣言弹窗
  announceModal: {
    isOpen: boolean;
    title?: string;
    min: number;
    options: {
      info: string;
      response: number;
    }[];
  };
}
