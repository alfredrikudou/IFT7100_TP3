import type { SellerRatingInfo } from '@/types/purchase'
import type { Product } from '../types/product'
import { ProductCard } from './ProductCard'
import styles from './ProductCatalog.module.css'

type Props = {
  products: Product[]
  walletConnected: boolean
  onBuy: (productId: string, quantity: number) => void
  /** Message si la liste est vide (sinon texte par défaut). */
  emptyMessage?: string
  /** Clé = adresse vendeur lowercased (getSellerRating). */
  sellerRatings: Record<string, SellerRatingInfo>
}

export function ProductCatalog({ products, walletConnected, onBuy, emptyMessage, sellerRatings }: Props) {
  const empty =
    emptyMessage ??
    "Aucun produit pour le moment. Utilisez « Vendre un produit » pour publier une annonce."

  return (
    <section className={styles.section} aria-labelledby="catalog-title">
      <div className={styles.head}>
        <h2 id="catalog-title" className={styles.title}>
          Catalogue
        </h2>
        <p className={styles.sub}>
          La note affichée par vendeur regroupe tous ses produits : plusieurs annonces du même vendeur partagent la même
          réputation.
        </p>
      </div>
      <div className={styles.grid}>
        {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              walletConnected={walletConnected}
              onBuy={onBuy}
              sellerRating={
                p.sellerAddress
                  ? sellerRatings[p.sellerAddress.toLowerCase()] ?? null
                  : null
              }
            />
        ))}
      </div>
      {products.length === 0 && <p className={styles.empty}>{empty}</p>}
    </section>
  )
}
