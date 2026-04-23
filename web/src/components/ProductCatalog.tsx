import type { Product } from '../types/product'
import { ProductCard } from './ProductCard'
import styles from './ProductCatalog.module.css'

type Props = {
  products: Product[]
  walletConnected: boolean
  onBuy: (productId: string, quantity: number) => void
  /** Message si la liste est vide (sinon texte par défaut). */
  emptyMessage?: string
}

export function ProductCatalog({ products, walletConnected, onBuy, emptyMessage }: Props) {
  const empty =
    emptyMessage ??
    "Aucun produit actif sur le contrat pour le moment. Publiez une annonce via « Vendre un produit »."

  return (
    <section className={styles.section} aria-labelledby="catalog-title">
      <div className={styles.head}>
        <h2 id="catalog-title" className={styles.title}>
          Catalogue
        </h2>
        <p className={styles.sub}>Produits lus depuis le contrat déployé (Hardhat local).</p>
      </div>
      <div className={styles.grid}>
        {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              walletConnected={walletConnected}
              onBuy={onBuy}
            />
        ))}
      </div>
      {products.length === 0 && <p className={styles.empty}>{empty}</p>}
    </section>
  )
}
