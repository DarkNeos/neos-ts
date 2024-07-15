// Ygo Agent with AI-Assisted function on Yu-Gi-Oh! Game

import {
  CardMeta,
  createDuel,
  fetchCard,
  PredictReq,
  sendSelectBattleCmdResponse,
  sendSelectEffectYnResponse,
  sendSelectIdleCmdResponse,
  sendSelectMultiResponse,
  sendSelectOptionResponse,
  sendSelectPlaceResponse,
  sendSelectPositionResponse,
  sendSelectSingleResponse,
  sendSortCardResponse,
  ygopro,
} from "@/api";
import { predictDuel } from "@/api/ygoAgent/predict";
import {
  Global,
  Input,
  MsgSelectSum,
  MultiSelectMsg,
} from "@/api/ygoAgent/schema";
import {
  convertActionMsg,
  convertCard,
  convertDeckCard,
  convertPhase,
  convertPositionResponse,
  parsePlayerFromMsg,
} from "@/api/ygoAgent/transaction";
import { Context } from "@/container";
import { WebSocketStream } from "@/infra";

import { argmax, computeSetDifference } from "../util";

const { DECK, HAND, MZONE, SZONE, GRAVE, REMOVED, EXTRA } = ygopro.CardZone;

export class YgoAgent {
  private context?: Context;
  private duelId: string = "";
  private agentIndex: number = 0;
  private prevActionIndex: number = 0;
  private mainDeck: number[] = [];
  private mainDeckCardMeta: Map<number, CardMeta> = new Map();

  private disable: boolean = false;

  public attachContext(context: Context) {
    this.context = context;
  }

  public async init() {
    if (this.context === undefined)
      throw Error("No context beed attached yet!!");
    const resp = await createDuel();
    if (resp) {
      const { duelId, index } = resp;

      this.duelId = duelId;
      this.agentIndex = index;
      this.mainDeck = this.context.sideStore.getSideDeck().main;
      this.mainDeckCardMeta = this.mainDeck.reduce((map, item) => {
        if (!map.has(item)) {
          map.set(item, fetchCard(item));
        }
        return map;
      }, new Map());
    } else {
      throw Error("Failed to createDuel for agent");
    }
  }

  // When the AI model met some cards which it has not met,
  // it can not work any more so we need to disable it.
  public setDisable(value: boolean) {
    this.disable = value;
  }

  public getDisable(): boolean {
    return this.disable;
  }

  private genAgentInput(msg: ygopro.StocGameMessage): Input {
    if (this.context) {
      const mat = this.context.matStore;
      const cardStore = this.context.cardStore;
      // TODO (ygo-agent): TZONE
      const zones = [DECK, HAND, MZONE, SZONE, GRAVE, REMOVED, EXTRA];
      const player = parsePlayerFromMsg(msg);
      const opponent = 1 - player;

      const cards = cardStore.inner
        .filter(
          (card) =>
            zones.includes(card.location.zone) &&
            !(
              card.location.zone === DECK && card.location.controller === player
            ),
        )
        .map((card) => convertCard(card, player));

      const cardCodesMe = cardStore.inner
        .filter(
          (card) =>
            zones.includes(card.location.zone) &&
            card.location.controller === player,
        )
        .map((card) => card.code);
      const cardCodesMeDeck = computeSetDifference(this.mainDeck, cardCodesMe);
      const mainDeckCardMeta = this.mainDeckCardMeta;
      // TODO (ygo-agent): 临时方案，有很多边界情况未考虑
      const deckCardsMe = cardCodesMeDeck.map((code) =>
        convertDeckCard(mainDeckCardMeta.get(code)!),
      );

      const turnPlayer = mat.currentPlayer;
      const global: Global = {
        is_first: player === 0,
        is_my_turn: turnPlayer === player,
        my_lp: mat.initInfo.of(player).life,
        op_lp: mat.initInfo.of(opponent).life,
        phase: convertPhase(mat.phase.currentPhase),
        turn: mat.turnCount,
      };

      const actionMsg = convertActionMsg(msg);

      return {
        global,
        cards: deckCardsMe.concat(cards),
        action_msg: actionMsg,
      };
    } else {
      throw Error("No context been attached yet!! ");
    }
  }

  private async sendRequest(req: PredictReq) {
    if (this.context) {
      const duelId = this.duelId;
      const resp = await predictDuel(duelId, req);
      if (resp !== undefined) {
        this.agentIndex = resp.index;
      } else {
        throw new Error("Failed to get predict response");
      }

      // TODO: 下面的逻辑需要封装一下，因为：
      // 1. 现在实现的功能是AI托管，UI上不需要感知AI的预测结果；
      // 2. 后面如果需要实现AI辅助功能，UI上需要感知AI的预测结果，
      // 所以需要单独提供接口能力。
      const preds = resp.predict_results.action_preds;
      const actionIdx = argmax(preds, (r) => r.prob);
      this.prevActionIndex = actionIdx;
      const pred = preds[actionIdx];
      return pred;
    } else {
      throw Error("No context been attached yet!! ");
    }
  }

  private preprocess(
    conn: WebSocketStream,
    msg: ygopro.StocGameMessage,
  ): boolean {
    if (
      msg.gameMsg === "select_option" &&
      msg.select_option.options.length === 0
    ) {
      sendSelectOptionResponse(conn, 0);
      return true;
    } else if (msg.gameMsg === "select_chain") {
      const selectChain = msg.select_chain;
      if (
        selectChain.chains.length === 0 ||
        (!selectChain.forced && selectChain.special_count === 0)
      ) {
        sendSelectSingleResponse(conn, -1);
        return true;
      }
    } else if (msg.gameMsg === "select_place" && msg.select_place.count !== 1) {
      throw Error("Unhandled case during handling MSG_SELECT_PLACE");
    } else if (msg.gameMsg === "sort_card") {
      // TODO: AI modal currently not support MSG_SORT_CARD, return default order here
      sendSortCardResponse(
        conn,
        msg.sort_card.options.map((option) => option.response),
      );
    }
    return false;
  }

  // TODO: AI模型需要一直跟踪对局，所以即使玩家关掉AI也需要给模型服务器发请求，
  // 只是不会回应ygopro服务器。后面需要将这个函数解耦出来。
  public async sendAIPredictAsResponse(
    conn: WebSocketStream,
    msg: ygopro.StocGameMessage,
    enableKuriboh: boolean,
  ) {
    if (this.disable) return;
    if (this.context === undefined)
      throw Error("No context been attached yet!!");

    // preprocess
    if (this.preprocess(conn, msg)) return;

    const input = this.genAgentInput(msg);
    const msgName = input.action_msg.data.msg_type;
    const multiSelectMsgs = ["select_card", "select_tribute", "select_sum"];

    if (multiSelectMsgs.includes(msgName)) {
      switch (msgName) {
        case "select_tribute":
        case "select_card": {
          const msg_ = input.action_msg.data as MultiSelectMsg;
          const selected = [];
          const responses = [];
          while (true) {
            msg_.selected = selected;
            const req = {
              index: this.agentIndex,
              input: input,
              prev_action_idx: this.prevActionIndex,
            };
            const response = (await this.sendRequest(req)).response;
            if (response !== -1) {
              selected.push(this.prevActionIndex);
              responses.push(response);
            }
            if (
              (response === -1 || selected.length === msg_.max) &&
              enableKuriboh
            ) {
              sendSelectMultiResponse(conn, responses);
              break;
            }
          }
          break;
        }
        case "select_sum":
          const msg_ = input.action_msg.data as MsgSelectSum;
          const selected = [];
          const responses = [];
          for (const c of msg_.must_cards) {
            responses.push(c.response);
          }
          while (true) {
            msg_.selected = selected;
            const req = {
              index: this.agentIndex,
              input: input,
              prev_action_idx: this.prevActionIndex,
            };
            const pred = await this.sendRequest(req);
            const idx = this.prevActionIndex;
            selected.push(idx);
            responses.push(pred.response);
            if (pred.can_finish && enableKuriboh) {
              sendSelectMultiResponse(conn, responses);
              break;
            }
          }
          break;
      }
    } else {
      const req = {
        index: this.agentIndex,
        input: input,
        prev_action_idx: this.prevActionIndex,
      };
      const response = (await this.sendRequest(req)).response;

      if (enableKuriboh) {
        switch (msgName) {
          case "announce_attrib":
          case "announce_number":
            sendSelectOptionResponse(conn, response);
            break;
          case "select_battlecmd":
            sendSelectBattleCmdResponse(conn, response);
            break;
          case "select_chain":
            sendSelectSingleResponse(conn, response);
            break;
          case "select_yesno":
          case "select_effectyn":
            sendSelectEffectYnResponse(conn, response === 1);
            break;
          case "select_idlecmd":
            sendSelectIdleCmdResponse(conn, response);
            break;
          case "select_option":
            sendSelectOptionResponse(conn, response);
            break;
          case "select_position":
            sendSelectPositionResponse(conn, convertPositionResponse(response));
            break;
          case "select_place": {
            const place = msg.select_place.places[response];
            sendSelectPlaceResponse(conn, {
              controller: place.controller,
              zone: place.zone,
              sequence: place.sequence,
            });
            break;
          }
          case "select_unselect_card": {
            if (response === -1) {
              sendSelectSingleResponse(conn, -1);
            } else {
              sendSelectMultiResponse(conn, [response]);
            }
            break;
          }
        }
      }
    }
  }
}
