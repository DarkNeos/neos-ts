# 攻击流程源码核查：MDPro3 与 NEOS

核查日期：2026-10-11。

MDPro3 本地目录：`/Users/hexzhou/Workplace/MDPro3`。核查时 HEAD 为 `72fb92ad02d173aeb5a5bb06f23603d892aec9c1`，`git status --short` 为空。NEOS 核查当前工作区，分支为 `codex/chain-attack-effects`，HEAD 为 `a3a32f7def34663792fc524c9d5c00057dcd4744`。本文前半部分保留实施前的源码核查与录像证据；攻击时序调整已在该分支实施，结果见文末。

核查依据为本地 C# 客户端源码。仓库附带 `Tools/YGO Classes/ocgcore` 的 C++ 源码用于补充说明发送侧分支，不能据此认定外部对战服务器使用相同构建。本文没有运行 Unity，也没有验证实际素材画面或外部服务器。

## MDPro3 的核心结论

攻击宣言与实际命中分开处理：`Attack` 只显示攻击线、直接攻击文字和可选终结提示，等待 0.2 秒；`Battle` 才播放蓄力、前冲、命中、归位。`DamageStepStart` 和 `DamageStepEnd` 只更新阶段文字。`Damage` 负责生命值变化，不能作为全部攻击演出的触发点。来源：[Attack 与阶段消息](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1216)、[Battle 演出](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1471)、[Damage](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1540)。

普通命中发生时，如果队列下一条有效消息是 `Damage`，MDPro3 会放行消息队列，让伤害数字与回位动画重叠。它没有等待完整回位以后才显示伤害。来源：[命中回调](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1486)、[强攻击命中回调](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1518)、[队列放行](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:1027)。

## 接收、排队与连锁询问

1. TCP 接收线程持续读取网络包并加入 `datas`；每帧处理网络包时，`GameMsg` 被交给 `RoomServant.StocMessage_GameMsg`。该方法创建 `Package`，调用 `OcgCore.AddPackage`；后者记录录像并加入 `packages`。所以收包与画面等待是不同环节。来源：[TCP 接收与每帧分派](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/TcpHelper.cs:133)、[GameMsg 包装](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/RoomServant.cs:301)、[入队](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:700)。
2. `ProcessMessage` 从 `packages[0]` 取消息，等待 `messageDispatcher.Process` 或 `NoMoreWait` 任一完成，再移除队首。每次开始处理新消息会把 `NoMoreWait` 复位。默认串行等待允许演出在指定节点提前放行，不能简单描述为所有动画均播放完后才处理下一消息。来源：[消息循环](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:992)。
3. 单个包先后经过日志、语音、决斗画面处理器，每层都被 `await`；`MessageProcessor` 对 `Attack`、`Battle`、`AttackDisabled`、阶段消息和 `SelectChain` 也都使用 `await`。来源：[处理器顺序](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/MessageDispatcher.cs:23)、[SelectChain 分派](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/MessageProcessor.cs:104)、[攻击消息分派](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/MessageProcessor.cs:269)。
4. `SelectChain` 根据消息候选、强制标记和 `chainCondition` 决定询问或自动回复。有候选时显示带当前时点文案的选卡弹窗，并等待 `dispatcher.playerResponed`；自动跳过则调用 `OnResend` 返回 -1。`SendReturnAsync` 调用响应 handler 后清选择界面，再设置 `playerResponed`。来源：[候选与强制标记](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:2799)、[询问与等待](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:2913)、[发送响应](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:727)。

因此在消息序列为 `Attack → SelectChain → … → Battle → Damage` 的情况下，画面顺序是：攻击线短暂停留 → 连锁询问与结算 → 正式攻击 → 命中时开始显示伤害 → 攻击卡继续归位。这里的省略号允许其他询问、卡片变化与效果结算；不能把实际消息固定成只出现一次连锁询问。来源：[Attack 的 0.2 秒等待](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1270)、[连锁等待](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:2928)、[Battle 的命中与归位](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1482)。

## 每个消息负责的画面

| 消息              | MDPro3 处理                                                                                                                                  | 等待与证据                                                                                                                                                                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Attack`          | 读取攻击者和目标；保存 `attackingCard`；更新攻击时点文案；显示攻击线。无目标卡时显示直接攻击文字。根据当时攻守值与 LP 判断是否显示终结提示。 | 等待 0.2 秒，不移动攻击卡。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1216)                                                                                                                                                 |
| `AttackDisabled`  | 更新无效时点文案；隐藏攻击线与终结提示。                                                                                                     | 立即完成。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1276)                                                                                                                                                                  |
| `DamageStepStart` | 阶段下方文字设为 `03`。                                                                                                                      | 立即完成，没有命中演出。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1285)                                                                                                                                                    |
| `DamageStepEnd`   | 阶段下方文字设为 `04`。                                                                                                                      | 立即完成，这里没有清攻击线。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1291)                                                                                                                                                |
| `Battle`          | 重新读取参与卡与攻守值；确定本次目标位置；隐藏宣言攻击线与终结提示；选择特殊终结演出或普通属性攻击演出。                                     | 默认等待完整 Sequence；命中时满足下一条是 `Damage` 的条件即可放行。[参与卡与目标](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1297)、[演出](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1471) |
| `Damage`          | 扣 LP；更新受到伤害时点文案；触发伤害相关场景效果；调用 `SetLP` 显示数字与 LP 计数动画。                                                     | 只等待 0.5 秒，没有等待 LP Sequence 全部结束。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1540)、[SetLP](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:1737)                                      |
| `PayLpCost`       | 复用 `GameMessage_Damage` 扣 LP 与数字；通过 `currentMessage == Damage` 判断避免生成受到伤害文案及对应场景回调。                             | 复用 0.5 秒等待；消息来源仍然保留。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1545)、[调用](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1572)                                         |
| `Recover`         | 加 LP、更新回复时点文案、调用 `SetLP`。                                                                                                      | 等待 0.5 秒。[源码](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1577)                                                                                                                                                               |

## 普通攻击演出的时间点

`Battle` 使用本条消息中的位置重新查找攻击者与被攻击卡，并用本条消息中的 Attack/Defense 更新卡片数据。后续效果变化过的攻守值和改目标，不依赖先前 `Attack` 中缓存的卡片目标。来源：[重新取卡与更新攻守](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1299)。

普通攻击按攻击者当前攻击力分两档：

| 攻击力    | 准备动作                                          | 前冲与命中                                                  | 停留与归位                     |
| --------- | ------------------------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| 小于 2000 | 上移并向后移动 0.3 秒，同时转向；完成后开启拖尾。 | 前冲 0.1 秒到目标距离的 80%，随后震屏、生成命中特效和音效。 | 停留 0.3 秒，再用 0.3 秒归位。 |
| 至少 2000 | 上移并后撤 0.5 秒，角度更大；0.4 秒开启拖尾。     | 前冲 0.15 秒，随后增强震屏、命中特效和音效。                | 停留 0.3 秒，再用 0.3 秒归位。 |

来源：[弱攻击 Sequence](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1472)、[强攻击 Sequence](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1502)。这些时长是代码的演出时长，实际墙钟时间还受 Unity 时间缩放影响。

拖尾在 `Battle` 创建，开始时隐藏，准备动作后开启，并安排 3 秒后销毁；命中特效在命中回调创建，安排 5 秒后销毁。攻击线在准备这些演出之前已经隐藏。来源：[攻击线清理](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1360)、[拖尾创建](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1461)、[命中特效与回位](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1486)、[拖尾清理与等待](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1535)。

若是特殊终结攻击，`Battle` 在普通演出之前调用专用演出，并在其完成后返回；专用演出也有在命中时检查后续 `Damage` 并设置 `NoMoreWait` 的逻辑。例如青眼演出在光束命中时放行。来源：[特殊演出分支](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1364)、[特殊攻击选择](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/BG/DuelBGManager.cs:3432)、[青眼命中节点](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/BG/DuelBGManager.cs:4064)。

`NextMessageIs` 只检查当前已入队的下一条有效消息，跳过中间的 `UpdateData` / `UpdateCard`。若伤害包尚未入队或下一条是其他消息，条件不成立，`Battle` 会等完整 Sequence。它不会等待未来某条伤害，也不会跨过任意消息寻找伤害。来源：[队列查看方法](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:839)、[命中检查](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1489)。

`Sequence.WaitAsync` 在 Sequence 完成后结束；队列通过 `NoMoreWait` 提前继续并没有取消 Battle 的 Sequence。因此 LP 消息开始处理时，原攻击的归位动作仍会继续。来源：[Sequence 等待实现](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Utility/Extension/DOTweenExtensions.cs:9)、[WhenAny 放行](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:1029)。

## 直接攻击、零伤害与中断

### 直接攻击

`Attack` 取不到目标卡时，以对方玩家位置作为攻击线端点，生成 `DuelDirectAtk00` 文字并在 1 秒后销毁。`Battle` 判断 `attackedCard == null || to.location == 0` 后使用玩家位置，选择近侧或远侧直接攻击特效和对应音效。来源：[宣言文字](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1251)、[Battle 目标](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1341)、[直攻命中特效](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1447)。

这也暴露一个不宜直接复制的边界：MDPro3 把目标实体查找失败也当作直接攻击；`Battle` 则在未校验 `attackCard` 的情况下读取其 manager。NEOS 应根据消息明确提供的直接攻击标记或空目标判定直攻，攻击者或非空目标查找失败时跳过演出，不应自行把旧攻击改成直攻。前半句为源码事实，后半句为据此提出的防错建议。来源：[取卡与后续解引用](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1299)、[无目标分支](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1341)。

### 零伤害

MDPro3 的 `Battle` 演出不依赖 `Damage` 到来。对守备力或攻击力不低于攻击者的目标，它会改用防御命中特效，但仍播放 Sequence。来源：[防御命中分支](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1432)、[无条件创建 Sequence](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1471)。

附带核心的正常战斗计算分支先写 `MSG_BATTLE`，后续只有 `battle_damage[player]` 非零才调用 `damage`。这为零伤害也有 Battle 提供发送侧补充证据，但不代表所有外部服务器构建均相同。来源：[Battle 写包](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:2963>)、[条件伤害](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:3021>)。

### 攻击无效、离场与改目标

攻击无效消息会立即隐藏攻击线及终结提示，不会播放命中。阶段变化、返回战斗指令、退出决斗也会清理攻击线。`Move` 与 `PosChange` 中没有攻击线清理，不能认为 MDPro3 对所有离场情形都立刻清除攻击标记。来源：[AttackDisabled](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1276)、[NewPhase](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:2012)、[SelectBattleCmd](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:2652)、[退出](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/BG/DuelBGManager.cs:505)、[Move / PosChange](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:725)。

附带核心区分效果导致的攻击无效和其他攻击取消：`EFFECT_ATTACK_DISABLED` 才写 `MSG_ATTACK_DISABLED`；攻击者状态失效会直接进入取消分支；伤害步骤之前对方怪兽集合变化或目标不再合法会设置 `attack_rollback`，进入是否重选目标的询问；伤害步骤内攻击者或目标离场、控制权变化等情况则设置取消状态。由此不能仅等待 `AttackDisabled` 才清理一段失效的攻击展示。来源：[攻击无效与重选](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:2729>)、[离场及目标变化检查](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:5076>)。

攻击箭头是加载时创建的单个复用对象，`ShowAttackLine` 每次重设坐标并显示。因此新的 `Attack` 会更新旧箭头，而不是新增永久箭头。附带核心的改目标函数会重新发送 `MSG_ATTACK`，正常重选目标也回到再次发送 `MSG_ATTACK` 的流程。来源：[预加载](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/BG/DuelBGManager.cs:152)、[重设箭头](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/BG/DuelBGManager.cs:3381)、[改目标写包](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/libduel.cpp:1658>)、[重选回到选目标](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:2764>)、[Attack 写包](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:2674>)。

## 可用于 NEOS 调整的原则

以下是根据上述 MDPro3 源码提出的实现建议，不表示 NEOS 当前已具备这些行为：

1. 把攻击拆成宣言与战斗演出。`Attack` 保存攻击上下文、显示攻击者至当前目标的箭头或高亮，短暂提示后继续处理消息；`Battle` 才播放蓄力、前冲和命中。不要在 `DamageStepStart` 播放完整攻击，因为该消息后仍可能出现询问、效果和中断。[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1216)、[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1285)、[附带核心的伤害步骤询问](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:2812>)。
2. 连锁询问使用服务器消息中的候选与强制标记，不由攻击动画自行决定是否弹出。宣言箭头可在询问与结算期间保留；收到新的 `Attack` 就替换攻击上下文和目标。[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:2799)、[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/BG/DuelBGManager.cs:3381)。
3. 战斗演出使用本条 `Battle` 的参与卡、目标和攻守数据。直接攻击与对怪兽攻击均由 Battle 触发，零伤害也演出；LP 改变不能成为必需条件。[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1297)、[依据](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:2963>)。
4. 给战斗演出提供命中节点。到命中后可以处理紧随其后的真正 `Damage`，让数字与归位重叠；其余消息继续保持确定的队列顺序，避免用固定延时等待任意未来伤害。保留 `Damage`、`PayLpCost`、`Recover` 的来源差别，费用不应被当成战斗命中。[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1486)、[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Servant/OcgCore.cs:839)、[依据](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1545)。
5. 设置明确的展示清理点：攻击无效、攻击者离场或无效、目标离场、阶段切换、再次进入战斗指令、决斗退出、回放跳转。目标离场先撤除旧目标标记，是否重选及是否直攻等后续服务器消息决定；收到 Battle 也先清宣言标记。这是在 MDPro3 现有清理点基础上增加边界保护的建议。[现有清理](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1276)、[现有清理](/Users/hexzhou/Workplace/MDPro3/Assets/Scripts/MDPro3/Duel/Message/DuelMessage.cs:1360)、[附带核心取消与重选](</Users/hexzhou/Workplace/MDPro3/Tools/YGO Classes/ocgcore/processor.cpp:5076>)。

## NEOS 对照

### 当前实现的差距

1. 实际网络入口使用 `decodeGame`。它注册了 `Attack(110)` 与 `AttackDisabled(112)`，没有注册 `Battle(111)`、`DamageStepStart(113)` 或 `DamageStepEnd(114)`；三者回落到 `unimplemented`，又因位于白名单中而被静默忽略。不能仅调整 `attack.ts` 的动画延迟，必须补齐正式战斗消息。[网络入口](/Users/hexzhou/Workplace/neos-ts/src/api/ocgcore/ocgAdapter/adapter.ts:18)、[Attack 映射](/Users/hexzhou/Workplace/neos-ts/src/api/ocgcore/ocgAdapter/decodeGame.ts:573)、[未实现消息回落](/Users/hexzhou/Workplace/neos-ts/src/api/ocgcore/ocgAdapter/decodeGame.ts:818)、[白名单](/Users/hexzhou/Workplace/neos-ts/src/service/duel/unimplemented.ts:4)。
2. `attack.ts` 在宣言时播放攻击音效，并等待整段卡片攻击。动画依次浮空、后撤、前冲、归位；消息队列等待 handler 完成，后面的连锁询问才有机会进入处理。正式命中发生在规则仍允许攻击宣言响应的阶段。[攻击处理](/Users/hexzhou/Workplace/neos-ts/src/service/duel/attack.ts:25)、[四段动画](/Users/hexzhou/Workplace/neos-ts/src/ui/Duel/PlayMat/Card/springs/attack.ts:50)、[协议队列](/Users/hexzhou/Workplace/neos-ts/src/service/onSocketMessage.ts:37)。
3. `select_chain` 分派没有等待整个 handler，因此不能说 NEOS 在本地一定阻塞所有消息直到玩家选择。其候选、强制效果和自动跳过策略由服务器消息与本机设置决定；在线规则推进通常由服务器等待响应控制。[分派](/Users/hexzhou/Workplace/neos-ts/src/service/duel/gameMsg.ts:163)、[询问策略](/Users/hexzhou/Workplace/neos-ts/src/service/duel/selectChain.ts:20)。
4. `Damage(91)` 与 `PayLpCost(100)` 都映射到同一种 `update_hp.DAMAGE`，后者目前已丢失费用来源；`updateHp` 对二者都会播放伤害音效、更新受到伤害时点、扣 LP 并等待数字动画。数字动画默认持续 1000ms，和攻击卡片没有命中同步点。[消息映射](/Users/hexzhou/Workplace/neos-ts/src/api/ocgcore/ocgAdapter/decodeGame.ts:548)、[更新生命值](/Users/hexzhou/Workplace/neos-ts/src/service/duel/updateHp.ts:14)、[数字动画](/Users/hexzhou/Workplace/neos-ts/src/ui/Duel/PlayMat/LifeChange/index.tsx:27)。
5. 已有辅助 `DuelEvent` 可以承载 protobuf 未定义的业务事件；现有逐卡动画队列也会等待攻击归位。这提供了增加战斗事件和命中完成点的现有接口，无需为了此改动先重建全部协议和动画系统。[辅助事件](/Users/hexzhou/Workplace/neos-ts/src/api/ocgcore/ocgAdapter/duelEvent.ts:3)、[逐卡队列](/Users/hexzhou/Workplace/neos-ts/src/ui/Duel/PlayMat/Card/index.tsx:132)、[Attack 任务](/Users/hexzhou/Workplace/neos-ts/src/ui/Duel/PlayMat/Card/index.tsx:195)。

### 真实录像与适配验证

读取仓库六份录像的 `readYrp3dPackets` 结果，按原始消息编号统计，跳过类型 231 的查询数据记录。下面的 Damage 数量是整份录像的全部伤害，不能据此认定都是战斗伤害。输入：[录像 1](/Users/hexzhou/Workplace/neos-ts/tests/e2e/fixtures/replays/1/replay.yrp3d)、[录像 2](/Users/hexzhou/Workplace/neos-ts/tests/e2e/fixtures/replays/2/replay.yrp3d)、[录像 3](/Users/hexzhou/Workplace/neos-ts/tests/e2e/fixtures/replays/3/replay.yrp3d)、[录像 4](/Users/hexzhou/Workplace/neos-ts/tests/e2e/fixtures/replays/4/replay.yrp3d)、[录像 5](/Users/hexzhou/Workplace/neos-ts/tests/e2e/fixtures/replays/5/replay.yrp3d)、[录像 6](/Users/hexzhou/Workplace/neos-ts/tests/e2e/fixtures/replays/6/replay.yrp3d)。

| 录像 | Attack 110 | Battle 111 | Damage 91 | PayLpCost 100 |
| ---- | ---------: | ---------: | --------: | ------------: |
| 1    |          8 |          8 |         6 |             0 |
| 2    |          7 |          5 |         0 |             1 |
| 3    |          0 |          0 |         2 |             0 |
| 4    |          0 |          0 |         2 |             0 |
| 5    |          7 |          7 |         6 |             0 |
| 6    |          5 |          4 |         2 |             4 |

共 27 条 Attack、24 条 Battle。录像 2 有 5 条 Battle，却没有任何 Damage，证明完整战斗演出不能以伤害消息为必要条件；录像 3、4 则有 Damage 而没有 Attack/Battle，证明伤害消息也不能直接触发怪兽冲刺。录像 1、5、6 同时包含 `Battle → Damage` 和 `Battle → Move` 等路径。以上只验证演出触发与消息关系，不用于统计在线连锁询问次数。

另外使用 esbuild 打包当前 `decodeGame`，实际解码录像 2 的四种消息，结果为：`110 → attack`、`111 → unimplemented(111)`、`113 → unimplemented(113)`、`114 → unimplemented(114)`。这与源码缺少注册的判断一致。此验证只在内存运行，没有修改运行代码或录像。

### 建议的实施顺序

以下为根据源码和录像证据提出的 NEOS 设计建议。

1. **补消息，再迁移触发点。** 在现有适配层和 `DuelEvent` 中增加 Battle 与伤害步骤事件。Battle 保留本次攻击者、目标、攻守与战斗状态；`attack.ts` 改为显示宣言箭头和约 200ms 的短提示，正式冲刺移到 Battle。进入伤害步骤、连锁结束和 LP 变化都不独立触发冲刺。
2. **分开命中完成与全部动画完成。** 攻击任务提供命中节点与归位完成节点；允许紧随本次 Battle 的 Damage 在命中处开始更新 LP 和显示数字，归位与数字重叠。逐卡动画队列仍保留归位任务，后续移卡、下一场攻击等会改变同一卡片位置的动作须等归位完成。其他协议状态保持顺序，实际伤害值始终使用服务器消息，不根据攻守差自行扣血。
3. **保留消息来源，补展示清理。** 适配层保留 Damage、PayLpCost、Recover 的区别。Damage 还可能来自效果，只有结合本次 Battle 和相邻消息顺序才可关联命中；费用扣除只显示 LP 变化。攻击无效、相关卡片离场、阶段切换、战斗指令、退出、重建场地与回放跳转时清理宣言状态；后续 Attack 替换目标，Battle 使用本条消息的最终目标。
4. **完成时点与同步后再调节动作。** 给蓄力、前冲、命中停留和归位独立配置时长，参考 MDPro3 的准备 300–500ms、前冲 100–150ms、命中停留 300ms、归位 300ms。继续使用 NEOS 现有回放倍速、后台快速完成和动画开关处理。[当前统一等待](/Users/hexzhou/Workplace/neos-ts/src/ui/Duel/PlayMat/Card/springs/utils.ts:7)、[回放时长](/Users/hexzhou/Workplace/neos-ts/src/infra/replayPresentation.ts:1)。这些是初始调节参考，最终观感应通过项目预览实测。

后续实现应覆盖：普通攻击、直接攻击、零伤害、攻击无效、相关卡片离场及重选目标、独立效果伤害、LP 费用、同包与跨包消息、动画关闭、后台切换及回放跳转。已有录像可用于验证 Battle 触发与 Damage 独立，攻击无效及在线选择需补针对性的消息序列验证。

## 已实施的流程

2026-10-11 在 `codex/chain-attack-effects` 完成以下调整：

- `ATTACK(110)` 仅保存攻击者和目标的卡片标识，显示场地箭头与直接攻击文案，短暂停留 200ms。连锁询问和伤害步骤开始保留箭头，不触发冲刺。
- `BATTLE(111)` 通过类型化扩展事件进入对局服务，按本条消息重新查卡、同步攻守并确定最终目标。普通攻击准备 300ms、冲刺 100ms；攻击力至少 2000 时准备 500ms、冲刺 150ms；命中停留和归位各 300ms，继续应用动画速度与录像倍速。
- 命中回调结束 BATTLE 的队列等待，紧随其后的首条真实 DAMAGE 可以更新 LP 与显示数字；中间的 UpdateData / UpdateCard 仍可同步。其他消息等待完整归位，逐卡动画队列也保留完整攻击任务。
- `DAMAGE_STEP_START(113)` 更新为伤害步骤，BATTLE 更新为伤害计算，`DAMAGE_STEP_END(114)` 恢复战斗步骤并清理宣言。
- 攻击无效、相关卡片移动、阶段切换、战斗指令、结束对局、重建场地与重置会清理宣言。录像定位开始便取消当前演出，重建时跳过演出等待；缺少攻击者或目标实体时跳过演出，缺少目标不会被误认为直接攻击。
- LP 费用保留 `hpSource: cost`，显示不同颜色的扣除数字，不触发伤害闪光、受伤音效和受伤时点文案。效果伤害独立按 DAMAGE 处理。

预览保留 01–53 原编号，更新 07 怪兽攻击、08 直接攻击，并追加 54 连锁响应、55 攻击无效、56 零伤害、57 更换目标。预览通过原始消息和正式服务队列驱动。

验证覆盖最终目标与攻守解码、6 份实际录像的历史消息摘要、命中与归位的等待关系、同包和跨包伤害衔接、连锁窗口、直接攻击、零伤害、无效、相关卡片离场、改目标、重置、LP 费用、动画开关、后台及录像取消与重建。真实网络对局和 Unity 素材演出未运行。
