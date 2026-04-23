"use client";

import type { MyPurchaseRow } from "@/types/purchase";
import type { Product } from "@/types/product";
import styles from "./MyPurchasesPanel.module.css";

function formatEth(n: number) {
  return n.toLocaleString("fr-CA", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  });
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
          Quantités et montants issus du contrat ; votre note apparaît après la transaction{" "}
          <code className={styles.code}>rateSeller</code>.
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
                    <strong>
                      {row.myRating != null ? `${row.myRating} / 5` : "enregistrée (recharger si besoin)"}
                    </strong>
                  </p>
                ) : null}
              </div>
              {row.rated ? (
                <span className={styles.done}>Noté</span>
              ) : (
                <div className={styles.stars} role="group" aria-label={`Noter l’achat ${row.purchaseId}`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={styles.starBtn}
                      disabled={pendingTx}
                      onClick={() => onRate(row.purchaseId, n)}
                      title={`${n} / 5`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
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
