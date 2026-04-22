import styles from './Header.module.css'
import { WalletBar } from './WalletBar'

type Props = {
  walletConnected: boolean
  mockAddress: string
  onWalletToggle: () => void
  onOpenSell: () => void
  networkLabel?: string
}

export function Header({
  walletConnected,
  mockAddress,
  onWalletToggle,
  onOpenSell,
  networkLabel,
}: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>
          🍎
        </span>
        <div>
          <span className={styles.title}>Fruit Market</span>
          <span className={styles.tagline}>Marché décentralisé — mouture UI</span>
        </div>
      </div>

      <nav className={styles.actions} aria-label="Actions principales">
        <WalletBar
          connected={walletConnected}
          mockAddress={mockAddress}
          onToggle={onWalletToggle}
          networkLabel={networkLabel}
        />
        <button type="button" className={styles.sellBtn} onClick={onOpenSell}>
          Vendre un produit
        </button>
      </nav>
    </header>
  )
}
