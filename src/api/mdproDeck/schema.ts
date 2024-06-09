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
  deckUploadDate?: string;
  deckUpdateDate?: string;
  /* Content of the deck. */
  deckYdk: string;
  deckCase: number;
}
