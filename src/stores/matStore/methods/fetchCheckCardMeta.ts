import { ygopro } from "@/api";
import { fetchCard, getCardStr } from "@/api/cards";
import { matStore, messageStore } from "@/stores";

function CardZoneToChinese(zone: ygopro.CardZone): string {
  switch (zone) {
    case ygopro.CardZone.DECK: {
      return "卡组";
    }
    case ygopro.CardZone.HAND: {
      return "手牌";
    }
    case ygopro.CardZone.EXTRA: {
      return "额外卡组";
    }
    case ygopro.CardZone.GRAVE: {
      return "墓地";
    }
    case ygopro.CardZone.FZONE: {
      return "FZONE";
    }
    case ygopro.CardZone.MZONE: {
      return "怪兽区";
    }
    case ygopro.CardZone.SZONE: {
      return "魔法陷阱区";
    }
    case ygopro.CardZone.REMOVED: {
      return "除外区";
    }
    case ygopro.CardZone.OVERLAY: {
      return "超量区";
    }
    case ygopro.CardZone.PZONE: {
      return "灵摆区";
    }
    case ygopro.CardZone.ONFIELD: {
      return "场地区";
    }
    default: {
      return "未知区域";
    }
  }
}

type Location =
  | ygopro.CardLocation
  | ReturnType<typeof ygopro.CardLocation.prototype.toObject>;

function cmpCardLocation(
  left: Location,
  right?: Location,
  strict?: boolean
): boolean {
  if (strict) {
    return JSON.stringify(left) === JSON.stringify(right);
  } else {
    return (
      left.controler === right?.controler &&
      left.location === right?.location &&
      left.sequence === right?.sequence
    );
  }
}

/**
 * 这段代码定义了一个异步函数 fetchCheckCardMeta，它的作用是获取一张卡片的元数据并将其添加到某个名为 messageStore.checkCardModal 的对象上。

  该函数的第一个参数是一个枚举值 ygopro.CardZone，表示卡片所在的区域。其余参数是一个包含卡片编号、位置、响应码和效果描述代码等信息的对象。

  首先，这个函数会根据区域类型调用 CardZoneToChinese() 函数生成一个中文名称。然后，它会调用 fetchCard() 异步函数来获取指定卡片的元数据 meta。

  接下来，函数会根据传递进来的 location 对象获取卡片所属的控制者，并根据控制者判断这张卡片是我方的还是对方的。然后，它会根据卡片的位置信息获取卡片的实际 ID，并构造一个新的选项 newOption。

  接着，函数会遍历已有的 messageStore.checkCardModal.tags，查找是否存在名为 combinedTagName 的标签。如果找到了，则将新选项 newOption 加入该标签的选项列表中并立即返回。如果找不到，则创建一个新标签，并将新选项 newOption 添加到其中。

  最后，函数会再次遍历所有标签，查找是否存在名为 combinedTagName 的标签。如果找到了，则遍历该标签中的所有选项，并查找是否存在与 location 对象中指定的卡片位置信息完全相同的选项。如果找到了，则更新该选项的元数据和效果描述等信息。
 */
export const fetchCheckCardMeta = async (
  zone: ygopro.CardZone,
  {
    code,
    location,
    response,
    effectDescCode,
  }: {
    code: number;
    location: ygopro.CardLocation;
    response: number;
    effectDescCode?: number;
  }
) => {
  const tagName = CardZoneToChinese(zone);
  const meta = await fetchCard(code);

  const controller = location.controler;

  const combinedTagName = matStore.isMe(controller)
    ? `我方的${tagName}`
    : `对方的${tagName}`;

  const newID =
    code != 0
      ? code
      : matStore.in(location.location).of(controller)[location.sequence]
          ?.occupant?.id || 0;
  const newOption = {
    meta: { id: newID, data: {}, text: {} },
    location: location.toObject(),
    effectDescCode,
    response,
  };
  for (const tag of messageStore.checkCardModal.tags) {
    if (tag.tagName === combinedTagName) {
      tag.options.push(newOption);
      return;
    }
  }

  messageStore.checkCardModal.tags.push({
    tagName: combinedTagName,
    options: [newOption],
  });

  for (const tag of messageStore.checkCardModal.tags) {
    if (tag.tagName === combinedTagName) {
      for (const old of tag.options) {
        if (meta.id == old.meta.id && cmpCardLocation(location, old.location)) {
          const cardID = old.meta.id;
          old.meta = meta;
          old.meta.id = cardID;

          const effectDescCode = old.effectDescCode;
          const effectDesc = effectDescCode
            ? getCardStr(old.meta, effectDescCode & 0xf)
            : undefined;
          old.effectDesc = effectDesc;
        }
      }
    }
  }
};
