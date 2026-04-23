import { useEffect, useState } from 'react'
import type { SellerRatingInfo } from '@/types/purchase'
import type { Product } from '../types/product'
import styles from './ProductCard.module.css'

type Props = {
  product: Product
  walletConnected: boolean
  onBuy: (productId: string, quantity: number) => void
  sellerRating?: SellerRatingInfo | null
}

function formatEth(n: number) {
  return n.toLocaleString('fr-CA', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 4,
  })
}

export function ProductCard({ product, walletConnected, onBuy, sellerRating }: Props) {
  const [qty, setQty] = useState(1)

  useEffect(() => {
    if (product.stock <= 0) {
      setQty(0)
      return
    }
    setQty((prev) => Math.min(Math.max(1, prev), product.stock))
  }, [product.stock])

  const maxQty = Math.max(0, product.stock)
  const totalEth = product.priceEth * qty
  const inactive = product.active === false
  const disabled =
    !walletConnected ||
    inactive ||
    product.stock <= 0 ||
    qty < 1 ||
    qty > maxQty

  const handleBuy = () => {
    if (disabled) return
    onBuy(product.id, qty)
  }

  return (
    <div role="article" className={styles.card}>
      <div className={styles.visual} aria-hidden>
        <span className={styles.emoji}>{product.emoji}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        {product.description ? (
          <p className={styles.desc}>{product.description}</p>
        ) : null}
        {inactive && (
          <p className={styles.hint}>Annonce inactive (non achetable).</p>
        )}
        <div className={styles.meta}>
          <span className={styles.price}>
            {formatEth(product.priceEth)} ETH <span className={styles.unit}>/ unité</span>
          </span>
          <span className={product.stock > 0 ? styles.stockOk : styles.stockOut}>
            {product.stock > 0 ? `${product.stock} en stock` : 'Épuisé'}
          </span>
        </div>
        <p className={styles.seller}>Vendeur : {product.sellerLabel}</p>
        <p className={styles.reputationLabel}>Réputation du vendeur</p>
        {sellerRating && sellerRating.totalRatings > BigInt(0) ? (
          <p className={styles.rating}>
            Moyenne : {(Number(sellerRating.averageScaledBy100) / 100).toFixed(1)} / 5 —{" "}
            {sellerRating.totalRatings.toString()} vote
            {Number(sellerRating.totalRatings) === 1 ? "" : "s"}
          </p>
        ) : (
          <p className={styles.ratingMuted}>Pas encore de vote pour ce vendeur</p>
        )}

        <div className={styles.buyRow}>
          <label className={styles.qtyLabel}>
            Quantité
            <input
              type="number"
              className={styles.qtyInput}
              min={1}
              max={Math.max(1, maxQty)}
              value={maxQty === 0 ? 0 : qty}
              onChange={(e) => setQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
              disabled={maxQty === 0}
            />
          </label>
          <div className={styles.total}>
            Total : <strong>{formatEth(totalEth)} ETH</strong>
          </div>
        </div>

        <button
          type="button"
          className={styles.buyBtn}
          disabled={disabled}
          onClick={handleBuy}
        >
          Acheter
        </button>
        {!walletConnected && (
          <p className={styles.hint}>Connectez votre portefeuille pour acheter.</p>
        )}
      </div>
    </div>
  )
}
