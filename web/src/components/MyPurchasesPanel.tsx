"use client";

import { useState } from "react";
import type { MyPurchaseRow } from "@/types/purchase";
import type { Product } from "@/types/product";
import styles from "./MyPurchasesPanel.module.css";

function formatEth(n: number) {
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  });
}

function RatingStarsReadonly({ value }: { value: number }) {
  return (
    <span className={styles.starReadonlyRow} aria-label={`${value} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? styles.starFilled : styles.starEmpty} aria-hidden>
          {i <= value ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

/** Étoiles vides par défaut ; se remplissent selon la position du curseur (survol). */
function StarRatingPicker({
  purchaseId,
  onPick,
  disabled,
}: {
  purchaseId: string;
  onPick: (purchaseId: string, rating: number) => void;
  disabled: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? 0;

  return (
    <div
      className={styles.stars}
      role="group"
      aria-label={`Noter l’achat ${purchaseId} sur 5 étoiles`}
      onMouseLeave={() => setHover(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHover(null);
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={styles.starBtn}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => {
            onPick(purchaseId, n);
            setHover(null);
          }}
          title={`Attribuer ${n} étoile${n > 1 ? "s" : ""}`}
        >
          <span
            className={active >= n ? styles.starGlyphFilled : styles.starGlyphEmpty}
            aria-hidden
          >
            {active >= n ? "★" : "☆"}
          </span>
          <span className={styles.visuallyHidden}>
            {n} étoile{n > 1 ? "s" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

type Props = {
  purchases: MyPurchaseRow[];
  loading: boolean;
  productsById: Record<string, Product | undefined>;
  onRate: (purchaseId: string, rating: number) => void;
  pendingTx: boolean;
};

export function MyPurchasesPanel({
  purchases,
  loading,
  productsById,
  onRate,
  pendingTx,
}: Props) {
  const unrated = purchases.filter((p) => !p.rated);

  if (loading && purchases.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="purchases-title">
        <h2 id="purchases-title" className={styles.title}>
          Mes achats & notation
        </h2>
        <p className={styles.muted}>Chargement de l’historique…</p>
      </section>
    );
  }

  if (purchases.length === 0) {
    return (
      <section className={styles.section} aria-labelledby="purchases-title">
        <h2 id="purchases-title" className={styles.title}>
          Mes achats & notation
        </h2>
        <p className={styles.muted}>
          Aucun achat enregistré pour ce portefeuille. Après un achat, vous pourrez noter le vendeur (une fois par
          achat).
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="purchases-title">
      <div className={styles.head}>
        <h2 id="purchases-title" className={styles.title}>
          Mes achats & notation
        </h2>
        <p className={styles.sub}>
          Montants et quantités enregistrés lors de l’achat. Après votre notation, elle apparaît sous l’achat concerné.
        </p>
      </div>

      <ul className={styles.list}>
        {purchases.map((row) => {
          const prod = productsById[row.productId];
          const title = prod?.name ?? `Produit #${row.productId}`;
          return (
            <li key={row.purchaseId} className={styles.row}>
              <div className={styles.rowMain}>
                <span className={styles.badge}>Achat #{row.purchaseId}</span>
                <span className={styles.prod}>{title}</span>
                <span className={styles.seller}>Vendeur : {row.sellerLabel}</span>
                <div className={styles.details}>
                  <span>
                    Quantité : <strong>{row.quantity}</strong>
                  </span>
                  <span>
                    Total payé : <strong>{formatEth(row.totalPaidEth)} ETH</strong>
                  </span>
                  <span>
                    Prix unitaire : <strong>{formatEth(row.unitPriceEth)} ETH</strong>
                  </span>
                </div>
                {row.rated ? (
                  <p className={styles.myVote}>
                    Votre note pour cet achat :{" "}
                    {row.myRating != null ? (
                      <RatingStarsReadonly value={row.myRating} />
                    ) : (
                      <strong className={styles.myVoteFallback}>en cours d’affichage</strong>
                    )}
                  </p>
                ) : null}
              </div>
              {row.rated ? (
                <span className={styles.done}>Noté</span>
              ) : (
                <StarRatingPicker
                  purchaseId={row.purchaseId}
                  onPick={onRate}
                  disabled={pendingTx}
                />
              )}
            </li>
          );
        })}
      </ul>

      {unrated.length > 0 && (
        <p className={styles.hint}>
          {unrated.length} achat{unrated.length > 1 ? "s" : ""} sans note (optionnel).
        </p>
      )}
    </section>
  );
}
