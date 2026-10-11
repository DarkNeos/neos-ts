// Context of a Duel, containing datas and states
// that we need to interact with server and player
import {
  CardStore,
  ChatStore,
  HistoryStore,
  MatStore,
  PlaceStore,
  RoomStore,
  SideStore,
  TrainingStore,
} from "@/stores";

interface ContextInitInfo {
  matStore?: MatStore;
  cardStore?: CardStore;
  placeStore?: PlaceStore;
  roomStore?: RoomStore;
  chatStore?: ChatStore;
  sideStore?: SideStore;
  historyStore?: HistoryStore;
  /** UI 连接传入共享状态；独立容器未传入时创建自己的训练状态。 */
  trainingStore?: TrainingStore;
}

export class Context {
  public matStore: MatStore;
  public cardStore: CardStore;
  public placeStore: PlaceStore;
  public roomStore: RoomStore;
  public chatStore: ChatStore;
  public sideStore: SideStore;
  public historyStore: HistoryStore;
  /** 服务端消息处理所使用的训练会话和准备状态。 */
  public trainingStore: TrainingStore;

  constructor();
  constructor(initInfo: ContextInitInfo);
  constructor(initInfo?: ContextInitInfo) {
    const {
      matStore,
      cardStore,
      placeStore,
      roomStore,
      chatStore,
      sideStore,
      historyStore,
      trainingStore,
    } = initInfo ?? {};
    this.matStore = matStore ?? new MatStore();
    this.cardStore = cardStore ?? new CardStore();
    this.placeStore = placeStore ?? new PlaceStore();
    this.roomStore = roomStore ?? new RoomStore();
    this.chatStore = chatStore ?? new ChatStore();
    this.sideStore = sideStore ?? new SideStore();
    this.historyStore = historyStore ?? new HistoryStore();
    this.trainingStore = trainingStore ?? new TrainingStore();
  }
}
