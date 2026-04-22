import type { Product } from '../types/product'
import { ProductCard } from './ProductCard'
import styles from './ProductCatalog.module.css'

type Props = {
  products: Product[]
  walletConnected: boolean
  onBuy: (productId: string, quantity: number) => void
}

export function ProductCatalog({ products, walletConnected, onBuy }: Props) {
  return (
    <section className={styles.section} aria-labelledby="catalog-title">
      <div className={styles.head}>
        <h2 id="catalog-title" className={styles.title}>
          Catalogue
        </h2>
        <p className={styles.sub}>
          Données fictives pour caler l’interface — branchement contrat plus tard.
        </p>
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
      {products.length === 0 && (
        <p className={styles.empty}>Aucun produit pour le moment. Ajoutez-en via « Vendre ».</p>
      )}
    </section>
  )
}
