"use client";

import { useCallback, useMemo, useState } from "react";
import { useFruitMarketLocal } from "@/hooks/useFruitMarketLocal";
import { MOCK_PRODUCTS } from "@/data/mockProducts";
import { Header } from "@/components/Header";
import { ProductCatalog } from "@/components/ProductCatalog";
import { SellProductModal } from "@/components/SellProductModal";
import type { NewProductInput, Product } from "@/types/product";

const MOCK_WALLET = "0xaB12…cD89";

export default function FruitMarket() {
  const chain = useFruitMarketLocal();
  const useChain = chain.mode === "local_chain";

  const [mockProducts, setMockProducts] = useState<Product[]>(() => [...MOCK_PRODUCTS]);
  const [mockWalletConnected, setMockWalletConnected] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 5200);
  }, []);

  const handleWalletToggle = async () => {
    if (useChain) {
      if (chain.connected) {
        chain.disconnect();
        return;
      }
      try {
        await chain.connect();
      } catch (e) {
        showToast(e instanceof Error ? e.message : String(e));
      }
      return;
    }
    setMockWalletConnected((v) => !v);
    showToast(
      !mockWalletConnected ? "Portefeuille connecté (simulation)." : "Portefeuille déconnecté.",
    );
  };

  const handleBuyMock = useCallback(
    (productId: string, quantity: number) => {
      let boughtName = "";
      setMockProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          boughtName = p.name;
          const nextStock = Math.max(0, p.stock - quantity);
          return { ...p, stock: nextStock };
        }),
      );
      showToast(`Achat simulé : ${quantity} × ${boughtName || "produit"}`);
    },
    [showToast],
  );

  const handleBuy = useChain ? chain.buy : handleBuyMock;

  const handleSellMock = (data: NewProductInput) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `p-${Date.now()}`;
    setMockProducts((prev) => [
      {
        id,
        ...data,
        sellerLabel: mockWalletConnected ? MOCK_WALLET : data.sellerLabel,
      },
      ...prev,
    ]);
    showToast(`Annonce publiée (simulation) : ${data.name}`);
  };

  const handleSellChain = async (data: NewProductInput) => {
    try {
      await chain.sell(data.name, data.priceEth, data.stock);
      showToast(`Produit publié sur la chaîne : ${data.name}`);
      setSellOpen(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSell = useChain ? handleSellChain : handleSellMock;

  const sortedMock = useMemo(
    () => [...mockProducts].sort((a, b) => a.name.localeCompare(b.name, "fr")),
    [mockProducts],
  );

  const displayProducts = useChain ? chain.products : sortedMock;
  const walletConnected = useChain ? chain.connected : mockWalletConnected;
  const displayAddress = useChain
    ? chain.account
      ? chain.shorten(chain.account)
      : "—"
    : MOCK_WALLET;

  const networkLabel = useChain ? "Hardhat local (31337)" : "Simulation";

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
            <strong>Développement local</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
              {chain.deployLoadError} Ensuite : <code>npm run sync:abi</code> si tu modifies le contrat,
              puis rafraîchis cette page.
            </p>
          </div>
        )}

        {chain.mode === "wrong_chain_config" && chain.deployInfo ? (
          <div className="hero-card" style={{ marginBottom: "1rem" }} role="status">
            <strong>Configuration inattendue</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem" }}>
              fruit-market-local.json indique chainId {chain.deployInfo.chainId}. Attendu 31337 pour Hardhat local.
            </p>
          </div>
        ) : null}

        <Header
          walletConnected={walletConnected}
          mockAddress={displayAddress}
          onWalletToggle={() => void handleWalletToggle()}
          onOpenSell={() => setSellOpen(true)}
          networkLabel={networkLabel}
        />

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-text">
            <p className="hero-kicker">IFT 7100 — TP3 · DApp Fruit Market</p>
            <h1 id="hero-title" className="hero-title">
              Achetez et vendez des fruits sur la chaîne
            </h1>
            <p className="hero-lead">
              {useChain ? (
                <>
                  Mode <strong>Hardhat local</strong> : les produits viennent du contrat déployé (
                  <code style={{ fontSize: "0.85em" }}>{chain.contractAddress}</code>
                  ). Utilise les comptes MetaMask importés avec les clés du nœud Hardhat si besoin.
                </>
              ) : (
                <>
                  Sans fichier de déploiement local, l’interface utilise des <strong>données fictives</strong>.
                  Déploie avec Hardhat pour brancher la chaîne réelle locale.
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

        {useChain && chain.catalogError && (
          <div
            className="hero-card"
            style={{ marginBottom: "1rem", borderColor: "var(--danger)" }}
            role="alert"
          >
            <strong>Catalogue introuvable sur le nœud</strong>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
              {chain.catalogError} — Vérifie que <code>npx hardhat node</code> tourne toujours et que{" "}
              <code>fruit-market-local.json</code> correspond au dernier déploiement (
              <code>npm run deploy:local</code>
              ).
            </p>
          </div>
        )}
        {useChain && chain.txMessage && (
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{chain.txMessage}</p>
        )}
        {useChain && chain.loadingCatalog && (
          <p style={{ fontSize: "0.9rem" }}>Chargement du catalogue…</p>
        )}
        {useChain && chain.pendingTx && <p style={{ fontSize: "0.9rem" }}>Transaction en cours…</p>}

        <div id="catalogue">
          <ProductCatalog
            products={displayProducts}
            walletConnected={walletConnected}
            onBuy={(id, qty) => {
              if (useChain) {
                void chain.buy(id, qty).catch((e) =>
                  showToast(e instanceof Error ? e.message : String(e)),
                );
              } else {
                handleBuyMock(id, qty);
              }
            }}
          />
        </div>

        <footer className="footer">
          <p>
            {useChain
              ? "Réseau local Hardhat — ETH de test uniquement."
              : "Sans déploiement local : démonstration hors chaîne."}
          </p>
        </footer>
      </div>

      <SellProductModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        onSubmit={(data) => {
          if (useChain) void handleSellChain(data);
          else {
            handleSellMock(data);
            setSellOpen(false);
          }
        }}
        walletConnected={walletConnected}
        chainMode={useChain}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
