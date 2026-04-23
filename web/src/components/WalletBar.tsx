import styles from './WalletBar.module.css'

type Props = {
  connected: boolean
  mockAddress: string
  onToggle: () => void
  /** Libellé du réseau (ex. Hardhat local). */
  networkLabel?: string
}

export function WalletBar({ connected, mockAddress, onToggle, networkLabel }: Props) {
  const net = networkLabel ?? 'Simulation'
  return (
    <div className={styles.wrap}>
      {connected ? (
        <>
          <span className={styles.badge} title="Réseau courant">
            Réseau : {net}
          </span>
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
