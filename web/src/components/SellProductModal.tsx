import { useState, type FormEvent } from "react";
import { FRUIT_EMOJIS } from "@/data/emojis";
import type { NewProductInput } from "../types/product";
import styles from "./SellProductModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewProductInput) => void;
  walletConnected: boolean;
};

export function SellProductModal({ open, onClose, onSubmit, walletConnected }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [stock, setStock] = useState("");
  const [emoji, setEmoji] = useState<(typeof FRUIT_EMOJIS)[number]>(FRUIT_EMOJIS[0]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const price = parseFloat(priceEth.replace(",", "."));
    const st = parseInt(stock, 10);
    if (!name.trim() || Number.isNaN(price) || price <= 0 || Number.isNaN(st) || st <= 0) {
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      priceEth: price,
      stock: st,
      emoji,
      sellerLabel: "",
    });
    setName("");
    setDescription("");
    setPriceEth("");
    setStock("");
    setEmoji(FRUIT_EMOJIS[0]);
    onClose();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="sell-title">
      <div className={styles.panel}>
        <div className={styles.top}>
          <h2 id="sell-title" className={styles.title}>
            Mettre un produit en vente
          </h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {!walletConnected && (
          <p className={styles.warn}>Connectez votre portefeuille pour publier une annonce.</p>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Nom du produit
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Pommes Cortland"
              required
              autoComplete="off"
            />
          </label>
          <label className={styles.field}>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Origine, conditionnement, etc. (optionnel)"
              rows={3}
            />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              Prix (ETH / unité)
              <input
                type="text"
                inputMode="decimal"
                value={priceEth}
                onChange={(e) => setPriceEth(e.target.value)}
                placeholder="0.01"
                required
              />
            </label>
            <label className={styles.field}>
              Stock
              <input
                type="number"
                min={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
                required
              />
            </label>
          </div>
          <fieldset className={styles.emojiField}>
            <legend>Icône (indice envoyé au contrat)</legend>
            <div className={styles.emojiGrid}>
              {FRUIT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  className={emoji === e ? styles.emojiPickActive : styles.emojiPick}
                  onClick={() => setEmoji(e)}
                >
                  {e}
                </button>
              ))}
            </div>
          </fieldset>
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.submit} disabled={!walletConnected}>
              Publier (transaction)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
