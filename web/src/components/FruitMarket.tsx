"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useFruitMarketLocal } from "@/hooks/useFruitMarketLocal";
import { Header } from "@/components/Header";
import headerStyles from "@/components/Header.module.css";
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
    ? "Le catalogue n’est pas disponible pour le moment."
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
            <strong>Service indisponible</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
              Le marché ne peut pas être chargé. Veuillez réessayer plus tard.
            </p>
          </div>
        )}

        {chain.mode === "wrong_chain_config" && chain.deployInfo ? (
          <div className="hero-card" style={{ marginBottom: "1rem" }} role="status">
            <strong>Réseau non pris en charge</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
              Utilisez le réseau prévu par ce site dans votre portefeuille, ou contactez le support.
            </p>
          </div>
        ) : null}

        <Header
          walletConnected={chain.connected}
          mockAddress={displayAddress}
          onWalletToggle={() => void handleWalletToggle()}
          onOpenSell={() => setSellOpen(true)}
          sellDisabled={!chainOk}
          navSlot={
            chainOk && chain.connected ? (
              <Link href="/achats" className={headerStyles.navLink}>
                Mes achats
              </Link>
            ) : null
          }
        />

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <p className="hero-kicker">Fruit Market</p>
            <h1 id="hero-title" className="hero-title">
              Achetez et vendez des fruits en toute transparence
            </h1>
            <p className="hero-lead">
              Publiez vos annonces, réglez les achats et les avis directement depuis votre portefeuille numérique.
            </p>
          </div>
        </section>

        {chainOk && chain.catalogError && (
          <div
            className="hero-card"
            style={{ marginBottom: "1rem", borderColor: "var(--danger)" }}
            role="alert"
          >
            <strong>Catalogue momentanément inaccessible</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
              {chain.catalogError} — Réessayez dans quelques instants.
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
            sellerRatings={chain.sellerRatings}
            onBuy={(id, qty) => {
              void chain.buy(id, qty).catch((e) =>
                showToast(e instanceof Error ? e.message : String(e)),
              );
            }}
            emptyMessage={catalogEmptyMessage}
          />
        </div>

        <footer className="footer">
          <p>Fruit Market — annonces et historique enregistrés sur la blockchain.</p>
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
