/** Modèle produit — UI ; aligné contrat quand lecture chaîne. */
export interface Product {
  id: string
  name: string
  description: string
  /** Prix unitaire en ETH (affichage ; contrat en wei). */
  priceEth: number
  stock: number
  emoji: string
  /** Adresse vendeur tronquée (lecture chaîne). */
  sellerLabel: string
  /** Si défini et false : annonce désactivée on-chain. */
  active?: boolean
}

export type NewProductInput = Omit<Product, 'id'>
