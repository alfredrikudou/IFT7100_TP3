import styles from './WalletBar.module.css'

type Props = {
  connected: boolean
  mockAddress: string
  onToggle: () => void
  /** Libellé réseau affiché à côté du portefeuille (optionnel). */
  networkLabel?: string
}

export function WalletBar({ connected, mockAddress, onToggle, networkLabel }: Props) {
  return (
    <div className={styles.wrap}>
      {connected ? (
        <>
          {networkLabel ? (
            <span className={styles.badge} title="Réseau">
              {networkLabel}
            </span>
          ) : null}
          <span className={styles.address}>{mockAddress}</span>
          <button type="button" className={styles.btnGhost} onClick={onToggle}>
            Déconnecter
          </button>
        </>
      ) : (
        <button type="button" className={styles.btnPrimary} onClick={onToggle}>
          Connecter le portefeuille
        </button>
      )}
    </div>
  )
}
