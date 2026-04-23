/** Achat émis par le contrat (événements + getPurchase). */
export type MyPurchaseRow = {
  purchaseId: string;
  productId: string;
  seller: string;
  sellerLabel: string;
  rated: boolean;
  quantity: number;
  /** Total payé (ETH). */
  totalPaidEth: number;
  /** Prix unitaire au moment de l’achat (total / quantité). */
  unitPriceEth: number;
  /** Note 1–5 donnée pour cet achat (événement SellerRated), si déjà noté. */
  myRating?: number;
};

export type SellerRatingInfo = {
  totalScore: bigint;
  totalRatings: bigint;
  averageScaledBy100: bigint;
};
