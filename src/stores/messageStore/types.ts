export interface ModalState {
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
