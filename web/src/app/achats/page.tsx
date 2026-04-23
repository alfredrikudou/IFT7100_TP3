"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useFruitMarketLocal } from "@/hooks/useFruitMarketLocal";
import { Header } from "@/components/Header";
import { MyPurchasesPanel } from "@/components/MyPurchasesPanel";
import headerStyles from "@/components/Header.module.css";
import "../marketplace.css";

export default function AchatsPage() {
  const chain = useFruitMarketLocal();
  const chainOk = chain.mode === "local_chain";
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 5200);
  }, []);

  const handleWalletToggle = async () => {
    if (chain.connected) {
      chain.disconnect();
      return;
    }
    try {
      await chain.connect();
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  };

  const displayAddress = chain.account ? chain.shorten(chain.account) : "—";

  const productsById = useMemo(
    () => Object.fromEntries(chain.products.map((p) => [p.id, p])),
    [chain.products],
  );

  return (
    <div className="app">
      <a href="#achats-main" className="skip-link">
        Aller au contenu
      </a>

      <div className="app-inner">
        {chain.mode === "no_deploy_file" && (
          <div
            className="hero-card"
            style={{ marginBottom: "1rem", borderColor: "var(--danger)" }}
            role="alert"
          >
            <strong>Déploiement requis</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>{chain.deployLoadError}</p>
          </div>
        )}

        <Header
          walletConnected={chain.connected}
          mockAddress={displayAddress}
          onWalletToggle={() => void handleWalletToggle()}
          onOpenSell={() => {}}
          networkLabel="Hardhat local (31337)"
          sellDisabled={!chainOk}
          hideSell
          navSlot={
            <Link href="/" className={headerStyles.navLink}>
              Catalogue
            </Link>
          }
        />

        <p style={{ margin: "0.75rem 0 1rem" }}>
          <Link href="/" style={{ fontWeight: 600 }}>
            ← Retour au catalogue
          </Link>
        </p>

        {chainOk && chain.txMessage && (
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{chain.txMessage}</p>
        )}
        {chainOk && chain.pendingTx && <p style={{ fontSize: "0.9rem" }}>Transaction en cours…</p>}

        <main id="achats-main">
          {chain.connected ? (
            <MyPurchasesPanel
              purchases={chain.myPurchases}
              loading={chain.loadingPurchases}
              productsById={productsById}
              onRate={(purchaseId, rating) =>
                void chain.rateSeller(purchaseId, rating).catch((e) =>
                  showToast(e instanceof Error ? e.message : String(e)),
                )
              }
              pendingTx={chain.pendingTx}
            />
          ) : (
            <section className="hero-card" role="status">
              <p style={{ margin: 0 }}>
                Connectez un portefeuille (bouton en haut à droite) pour voir vos achats et attribuer des notes.
              </p>
            </section>
          )}
        </main>

        <footer className="footer" style={{ marginTop: "2rem" }}>
          <p>Réseau local Hardhat — données lues depuis le contrat.</p>
        </footer>
      </div>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
