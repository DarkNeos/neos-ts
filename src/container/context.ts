// Context of a Duel, containing datas and states
// that we need to interact with server and player
import {
  CardStore,
  ChatStore,
  MatStore,
  PlaceStore,
  RoomStore,
  SideStore,
} from "@/stores";

interface ContextInitInfo {
  matStore?: MatStore;
  cardStore?: CardStore;
  placeStore?: PlaceStore;
  roomStore?: RoomStore;
  chatStore?: ChatStore;
  sideStore?: SideStore;
}

export class Context {
  public matStore: MatStore;
  public cardStore: CardStore;
  public placeStore: PlaceStore;
  public roomStore: RoomStore;
  public chatStore: ChatStore;
  public sideStore: SideStore;

  constructor();
  constructor(initInfo: ContextInitInfo);
  constructor(initInfo?: ContextInitInfo) {
    const { matStore, cardStore, placeStore, roomStore, chatStore, sideStore } =
      initInfo ?? {};
    this.matStore = matStore ?? new MatStore();
    this.cardStore = cardStore ?? new CardStore();
    this.placeStore = placeStore ?? new PlaceStore();
    this.roomStore = roomStore ?? new RoomStore();
    this.chatStore = chatStore ?? new ChatStore();
    this.sideStore = sideStore ?? new SideStore();
  }
}
