export interface MdproResp<T> {
  code: number;
  message: string;
  data?: T;
}

export interface MdproDeck {
  /*
   *`ID` of the online deck.
   * It is required when updating the deck, and optional
   * when adding new deck. However, for the convenience,
   * it is defined required here and it would be set to zero
   * when adding new deck.
   */
  deckId: string;
  /* Contributor of the deck. */
  deckContributor: string;
  /* Name of the deck. */
  deckName: string;
  deckRank?: number;
  deckLike?: number;
  deckUploadDate?: number; // Changed to number (13-digit timestamp)
  deckUpdateDate?: number; // Changed to number (13-digit timestamp)
  deckCoverCard1?: number; // NEW: Cover card 1 ID
  deckCoverCard2?: number; // NEW: Cover card 2 ID
  deckCoverCard3?: number; // NEW: Cover card 3 ID
  /* Content of the deck. */
  deckYdk?: string;
  deckCase: number;
  deckProtector?: number; // NEW: Card protector/sleeve
  /* User ID of MyCard Account */
  userId: number;
  isDelete?: boolean; // NEW: Whether deck is deleted
  isPublic?: boolean; // NEW: Whether deck is public
}

export interface MdproDeckLike {
  deckId: string;
  deckContributor: string;
  deckName: string;
  deckLike?: number;
  deckCoverCard1?: number; // NEW: Cover card 1 ID
  deckCoverCard2?: number; // NEW: Cover card 2 ID
  deckCoverCard3?: number; // NEW: Cover card 3 ID
  deckCase: number;
  deckProtector?: number; // NEW: Card protector/sleeve
  lastDate?: number; // Changed to number (timestamp)
}
