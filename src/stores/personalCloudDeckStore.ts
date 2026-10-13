import { createStore, get, update } from "idb-keyval";

import {
  deleteDeck,
  getPersonalList,
  mgetDeck,
  syncDeck,
} from "@/api/mdproDeck";

import { type CloudDeckRecord, PersonalCloudDecks } from "./personalCloudDecks";

const cache = createStore("personal-cloud-decks", "decks");

export const personalCloudDeckStore = new PersonalCloudDecks({
  list: (account) =>
    getPersonalList({ userID: account.id, token: account.token }),
  detail: (account, id) => mgetDeck(id, account.token),
  save: (account, deck) =>
    syncDeck(
      {
        userId: account.id,
        deckContributor: account.username,
        deck: {
          deckId: deck.deckId,
          deckName: deck.deckName,
          deckType: deck.deckType ?? "",
          deckYdk: deck.deckYdk!,
          deckCase: deck.deckCase,
          deckProtector: deck.deckProtector,
          deckCoverCard1: deck.deckCoverCard1,
          deckCoverCard2: deck.deckCoverCard2,
          deckCoverCard3: deck.deckCoverCard3,
          isDelete: false,
          timestamp: deck.deckUpdateDate!,
        },
      },
      account.token,
    ),
  delete: (account, id) =>
    deleteDeck(account.id, account.token, id, account.username),
  cache: {
    read: (userId) => get<CloudDeckRecord[]>(userId, cache),
    update: (userId, change) =>
      update<CloudDeckRecord[]>(userId, (decks) => change(decks ?? []), cache),
  },
});
