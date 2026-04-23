"use client";

import { useCallback, useState } from "react";
import { useFruitMarketLocal } from "@/hooks/useFruitMarketLocal";
import { Header } from "@/components/Header";
import { ProductCatalog } from "@/components/ProductCatalog";
import { SellProductModal } from "@/components/SellProductModal";
import { FRUIT_EMOJIS } from "@/data/emojis";
import type { NewProductInput } from "@/types/product";

export default function FruitMarket() {
  const chain = useFruitMarketLocal();
  const chainOk = chain.mode === "local_chain";

  const [sellOpen, setSellOpen] = useState(false);
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

  const handleSell = async (data: NewProductInput) => {
    try {
      const iconIdx = FRUIT_EMOJIS.indexOf(data.emoji as (typeof FRUIT_EMOJIS)[number]);
      const iconId = iconIdx >= 0 ? iconIdx : 0;
      await chain.sell(data.name, data.priceEth, data.stock, data.description, iconId);
      showToast(`Produit publié : ${data.name}`);
      setSellOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  };

  const displayAddress = chain.account ? chain.shorten(chain.account) : "—";

  const catalogEmptyMessage = !chainOk
    ? "Aucun catalogue : déployez le contrat et assurez-vous que le nœud Hardhat répond (voir les instructions ci-dessus)."
    : undefined;

  return (
    <div className="app">
      <a href="#catalogue" className="skip-link">
        Aller au catalogue
      </a>

      <div className="app-inner">
        {chain.mode === "no_deploy_file" && (
          <div
            className="hero-card"
            style={{ marginBottom: "1rem", borderColor: "var(--danger)" }}
            role="alert"
          >
            <strong>Déploiement requis</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
              {chain.deployLoadError} Ensuite : <code>npm run sync:abi</code> si tu modifies le contrat, puis
              rafraîchis cette page.
            </p>
          </div>
        )}

        {chain.mode === "wrong_chain_config" && chain.deployInfo ? (
          <div className="hero-card" style={{ marginBottom: "1rem" }} role="status">
            <strong>Configuration réseau</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
              fruit-market-local.json indique chainId {chain.deployInfo.chainId}. Attendu 31337 pour Hardhat local.
            </p>
          </div>
        ) : null}

        <Header
          walletConnected={chain.connected}
          mockAddress={displayAddress}
          onWalletToggle={() => void handleWalletToggle()}
          onOpenSell={() => setSellOpen(true)}
          networkLabel="Hardhat local (31337)"
          sellDisabled={!chainOk}
        />

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <p className="hero-kicker">IFT 7100 — TP3 · DApp Fruit Market</p>
            <h1 id="hero-title" className="hero-title">
              Achetez et vendez des fruits sur la chaîne
            </h1>
            <p className="hero-lead">
              {chainOk && chain.contractAddress ? (
                <>
                  Catalogue et transactions via le contrat déployé à{" "}
                  <code style={{ fontSize: "0.85em" }}>{chain.contractAddress}</code>. Importe les comptes Hardhat dans
                  MetaMask si besoin.
                </>
              ) : (
                <>
                  Le catalogue provient uniquement du contrat une fois{" "}
                  <code style={{ fontSize: "0.85em" }}>fruit-market-local.json</code> présent et le nœud local actif.
                </>
              )}
            </p>
          </div>
          <div className="hero-card" role="note">
            <strong>Commandes utiles (racine du repo)</strong>
            <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.6 }}>
              <li>
                Terminal 1 : <code>npx hardhat node</code>
              </li>
              <li>
                Terminal 2 : <code>npm run compile && npm run sync:abi && npm run deploy:local</code>
              </li>
              <li>
                Terminal 3 : <code>npm run web:dev</code>
              </li>
            </ol>
          </div>
        </section>

        {chainOk && chain.catalogError && (
          <div
            className="hero-card"
            style={{ marginBottom: "1rem", borderColor: "var(--danger)" }}
            role="alert"
          >
            <strong>Impossible de lire le catalogue</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
              {chain.catalogError} — Vérifie que <code>npx hardhat node</code> tourne et que{" "}
              <code>fruit-market-local.json</code> correspond au dernier déploiement (<code>npm run deploy:local</code>
              ).
            </p>
          </div>
        )}
        {chainOk && chain.txMessage && (
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{chain.txMessage}</p>
        )}
        {chainOk && chain.loadingCatalog && <p style={{ fontSize: "0.9rem" }}>Chargement du catalogue…</p>}
        {chainOk && chain.pendingTx && <p style={{ fontSize: "0.9rem" }}>Transaction en cours…</p>}

        <div id="catalogue">
          <ProductCatalog
            products={chain.products}
            walletConnected={chain.connected}
            onBuy={(id, qty) => {
              void chain.buy(id, qty).catch((e) =>
                showToast(e instanceof Error ? e.message : String(e)),
              );
            }}
            emptyMessage={catalogEmptyMessage}
          />
        </div>

        <footer className="footer">
          <p>Réseau local Hardhat — ETH de test ; données produits lues depuis le contrat.</p>
        </footer>
      </div>

      <SellProductModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        onSubmit={(data) => void handleSell(data)}
        walletConnected={chain.connected}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
