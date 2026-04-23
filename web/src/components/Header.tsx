import type { ReactNode } from "react";
import styles from "./Header.module.css";
import { WalletBar } from "./WalletBar";

type Props = {
  walletConnected: boolean;
  mockAddress: string;
  onWalletToggle: () => void;
  onOpenSell: () => void;
  networkLabel?: string;
  /** Désactive « Vendre » si le contrat / réseau local n’est pas disponible. */
  sellDisabled?: boolean;
  /** Contenu entre le portefeuille et « Vendre » (ex. lien Mes achats). */
  navSlot?: ReactNode;
  /** Masque le bouton vendre (page dédiée achats, etc.). */
  hideSell?: boolean;
};

export function Header({
  walletConnected,
  mockAddress,
  onWalletToggle,
  onOpenSell,
  networkLabel,
  sellDisabled = false,
  navSlot,
  hideSell = false,
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          🍎
        </span>
        <div>
          <span className={styles.title}>Fruit Market</span>
          <span className={styles.tagline}>Annonces et paiements sur la blockchain</span>
        </div>
      </div>

      <nav className={styles.actions} aria-label="Actions principales">
        <WalletBar
          connected={walletConnected}
          mockAddress={mockAddress}
          onToggle={onWalletToggle}
          networkLabel={networkLabel}
        />
        {navSlot ? <div className={styles.navSlot}>{navSlot}</div> : null}
        {!hideSell ? (
          <button
            type="button"
            className={styles.sellBtn}
            onClick={onOpenSell}
            disabled={sellDisabled}
            title={sellDisabled ? "Publication indisponible pour le moment." : undefined}
          >
            Vendre un produit
          </button>
        ) : null}
      </nav>
    </header>
  );
}
