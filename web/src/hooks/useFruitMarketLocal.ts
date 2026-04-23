"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  EventLog,
  formatEther,
  parseEther,
} from "ethers";
import type { Product } from "@/types/product";
import type { MyPurchaseRow, SellerRatingInfo } from "@/types/purchase";
import abi from "@/contracts/FruitMarketV2.abi.json";
import { emojiFromIconId } from "@/data/emojis";
import { ensureHardhatLocalChain } from "@/lib/chain";

type LocalDeployFile = {
  proxyAddress: string;
  chainId: number;
  rpcUrl: string;
};

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function mapProduct(
  id: bigint,
  raw: {
    id: bigint;
    name: string;
    description: string;
    iconId: bigint;
    priceWei: bigint;
    stock: bigint;
    seller: string;
    active: boolean;
  },
): Product {
  const stockNum = Number(raw.stock);
  const seller = String(raw.seller);
  return {
    id: id.toString(),
    name: raw.name,
    description: raw.description ?? "",
    priceEth: Number(formatEther(raw.priceWei)),
    stock: Number.isSafeInteger(stockNum) ? stockNum : 0,
    emoji: emojiFromIconId(Number(raw.iconId)),
    sellerAddress: seller,
    sellerLabel: shorten(seller),
    active: raw.active,
  };
}

export function useFruitMarketLocal() {
  const [deployInfo, setDeployInfo] = useState<LocalDeployFile | null>(null);
  const [deployLoadError, setDeployLoadError] = useState<string | null>(null);

  const [account, setAccount] = useState<string | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [pendingTx, setPendingTx] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [sellerRatings, setSellerRatings] = useState<Record<string, SellerRatingInfo>>({});
  const [myPurchases, setMyPurchases] = useState<MyPurchaseRow[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/fruit-market-local.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<LocalDeployFile>;
      })
      .then((raw: LocalDeployFile) => {
        if (cancelled) return;
        const cid = Number(raw.chainId);
        setDeployInfo({
          proxyAddress: raw.proxyAddress,
          chainId: Number.isFinite(cid) && cid > 0 ? cid : 31337,
          rpcUrl: raw.rpcUrl ?? "http://127.0.0.1:8545",
        });
        setDeployLoadError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setDeployInfo(null);
        setDeployLoadError(
          "Fichier fruit-market-local.json introuvable. À la racine du repo : `npx hardhat node` puis `npm run deploy:local`.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const contractAddress = deployInfo?.proxyAddress ?? null;
  const chainReady = Boolean(contractAddress && deployInfo?.chainId === 31337);

  /**
   * Lectures catalogue via proxy Next `/api/rpc` → Hardhat (évite CORS navigateur → :8545).
   * MetaMask n’est pas utilisé pour les vues ; les écritures restent via BrowserProvider.
   */
  const readOnlyContract = useCallback(() => {
    if (!contractAddress) return null;
    const rpcUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/api/rpc`
        : deployInfo?.rpcUrl ?? "http://127.0.0.1:8545";
    const provider = new JsonRpcProvider(rpcUrl);
    return new Contract(contractAddress, abi, provider);
  }, [contractAddress, deployInfo?.rpcUrl]);

  const refreshCatalog = useCallback(async () => {
    const c = readOnlyContract();
    if (!c) return;
    setLoadingCatalog(true);
    setCatalogError(null);
    try {
      const nextId = await c.nextProductId();
      const n = Number(nextId);
      const list: Product[] = [];
      for (let i = 1; i < n; i++) {
        try {
          const p = await c.getProduct(i);
          list.push(
            mapProduct(BigInt(i), {
              id: p.id,
              name: p.name,
              description: p.description,
              iconId: p.iconId,
              priceWei: p.priceWei,
              stock: p.stock,
              seller: p.seller,
              active: p.active,
            }),
          );
        } catch {
          /* slot vide */
        }
      }
      setProducts(list.sort((a, b) => a.name.localeCompare(b.name, "fr")));
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Impossible de lire le catalogue sur le nœud local.";
      setCatalogError(msg);
      setProducts([]);
    } finally {
      setLoadingCatalog(false);
    }
  }, [readOnlyContract]);

  const [ratingNonce, setRatingNonce] = useState(0);

  const refreshSellerRatings = useCallback(async () => {
    const c = readOnlyContract();
    if (!c) return;
    const sellers = [
      ...new Set(
        products.map((p) => p.sellerAddress).filter((a): a is string => Boolean(a)),
      ),
    ];
    if (sellers.length === 0) {
      setSellerRatings({});
      return;
    }
    try {
      const next: Record<string, SellerRatingInfo> = {};
      await Promise.all(
        sellers.map(async (addr) => {
          const [totalScore, totalRatings, averageScaledBy100] = await c.getSellerRating(addr);
          next[addr.toLowerCase()] = {
            totalScore: totalScore as bigint,
            totalRatings: totalRatings as bigint,
            averageScaledBy100: averageScaledBy100 as bigint,
          };
        }),
      );
      setSellerRatings(next);
    } catch {
      setSellerRatings({});
    }
  }, [readOnlyContract, products]);

  const refreshMyPurchases = useCallback(async () => {
    const c = readOnlyContract();
    if (!c || !account) {
      setMyPurchases([]);
      return;
    }
    setLoadingPurchases(true);
    try {
      const buyFilter = c.filters.ProductPurchased(null, null, account);
      const buyEvents = await c.queryFilter(buyFilter, 0, "latest");

      const ratedFilter = c.filters.SellerRated(null, null, account);
      const ratedEvents = await c.queryFilter(ratedFilter, 0, "latest");
      const myRatingByPurchase = new Map<string, number>();
      for (const ev of ratedEvents) {
        if (!(ev instanceof EventLog) || ev.args == null) continue;
        const pid = (ev.args as { purchaseId?: bigint }).purchaseId;
        const rt = (ev.args as { rating?: bigint | number }).rating;
        if (pid === undefined || rt === undefined) continue;
        myRatingByPurchase.set(pid.toString(), Number(rt));
      }

      const rows: MyPurchaseRow[] = [];
      for (const ev of buyEvents) {
        if (!(ev instanceof EventLog)) continue;
        const args = ev.args as unknown as {
          purchaseId: bigint;
          productId: bigint;
          buyer: string;
          seller: string;
          quantity: bigint;
          totalPaid: bigint;
        };
        if (args.purchaseId === undefined) continue;
        const rated = (await c.isPurchaseRated(args.purchaseId)) as boolean;
        const seller = String(args.seller);
        const qty = Number(args.quantity);
        const totalPaidWei = args.totalPaid as bigint;
        const totalPaidEth = Number(formatEther(totalPaidWei));
        const unitPriceEth = qty > 0 ? totalPaidEth / qty : totalPaidEth;
        const pidStr = args.purchaseId.toString();
        rows.push({
          purchaseId: pidStr,
          productId: args.productId.toString(),
          seller,
          sellerLabel: shorten(seller),
          rated,
          quantity: qty,
          totalPaidEth,
          unitPriceEth,
          myRating: myRatingByPurchase.get(pidStr),
        });
      }
      rows.sort((a, b) => {
        const da = BigInt(a.purchaseId);
        const db = BigInt(b.purchaseId);
        return db > da ? 1 : db < da ? -1 : 0;
      });
      setMyPurchases(rows);
    } catch {
      setMyPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  }, [readOnlyContract, account]);

  useEffect(() => {
    if (chainReady) void refreshCatalog();
  }, [chainReady, refreshCatalog]);

  useEffect(() => {
    if (!chainReady) return;
    void refreshSellerRatings();
  }, [chainReady, products, ratingNonce, refreshSellerRatings]);

  useEffect(() => {
    if (chainReady && account) void refreshMyPurchases();
  }, [chainReady, account, refreshMyPurchases]);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return;

    const onChain = () => void refreshCatalog();
    const onAccounts = (accs: unknown) => {
      const a = Array.isArray(accs) && typeof accs[0] === "string" ? accs[0] : null;
      setAccount(a);
      void refreshCatalog();
    };

    eth.on("chainChanged", onChain);
    eth.on("accountsChanged", onAccounts);
    return () => {
      eth.removeListener?.("chainChanged", onChain);
      eth.removeListener?.("accountsChanged", onAccounts);
    };
  }, [refreshCatalog]);

  const connect = useCallback(async () => {
    if (!contractAddress) return;
    await ensureHardhatLocalChain();
    const eth = window.ethereum;
    if (!eth) throw new Error("MetaMask introuvable.");
    await eth.request({ method: "eth_requestAccounts" });
    const provider = new BrowserProvider(eth);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);
    setTxMessage(null);
    await refreshCatalog();
  }, [contractAddress, refreshCatalog]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setTxMessage(null);
  }, []);

  const buy = useCallback(
    async (productId: string, quantity: number) => {
      if (!contractAddress || !account) return;
      const eth = window.ethereum;
      if (!eth) return;
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = new Contract(contractAddress, abi, signer);
      const p = await c.getProduct(BigInt(productId));
      const totalWei = (p.priceWei as bigint) * BigInt(quantity);
      setPendingTx(true);
      setTxMessage("Envoi de la transaction…");
      const tx = await c.purchaseProduct(BigInt(productId), BigInt(quantity), {
        value: totalWei,
      });
      setTxMessage(`Transaction : ${tx.hash}`);
      await tx.wait();
      setPendingTx(false);
      setTxMessage(`Confirmée : ${tx.hash}`);
      await refreshCatalog();
      await refreshMyPurchases();
    },
    [account, contractAddress, refreshCatalog, refreshMyPurchases],
  );

  const rateSeller = useCallback(
    async (purchaseId: string, rating: number) => {
      if (!contractAddress || !account) return;
      if (rating < 1 || rating > 5) return;
      const eth = window.ethereum;
      if (!eth) return;
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = new Contract(contractAddress, abi, signer);
      setPendingTx(true);
      setTxMessage("Envoi de la notation…");
      const tx = await c.rateSeller(BigInt(purchaseId), rating);
      setTxMessage(`Transaction : ${tx.hash}`);
      await tx.wait();
      setPendingTx(false);
      setTxMessage(`Notation confirmée : ${tx.hash}`);
      setRatingNonce((n) => n + 1);
      await refreshMyPurchases();
    },
    [account, contractAddress, refreshMyPurchases],
  );

  const sell = useCallback(
    async (
      name: string,
      priceEth: number,
      stock: number,
      description: string,
      iconId: number,
    ) => {
      if (!contractAddress || !account) return;
      const eth = window.ethereum;
      if (!eth) return;
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = new Contract(contractAddress, abi, signer);
      const wei = parseEther(String(priceEth));
      const idClamped = Math.min(255, Math.max(0, Math.floor(iconId)));
      setPendingTx(true);
      setTxMessage("Publication du produit…");
      const tx = await c.addProduct(name, wei, BigInt(stock), description, idClamped);
      setTxMessage(`Transaction : ${tx.hash}`);
      await tx.wait();
      setPendingTx(false);
      setTxMessage(`Confirmée : ${tx.hash}`);
      await refreshCatalog();
    },
    [account, contractAddress, refreshCatalog],
  );

  const mode = useMemo(() => {
    if (deployLoadError && !deployInfo) return "no_deploy_file" as const;
    if (deployInfo && deployInfo.chainId !== 31337) return "wrong_chain_config" as const;
    if (!chainReady) return "wrong_chain_config" as const;
    return "local_chain" as const;
  }, [deployLoadError, deployInfo, chainReady]);

  return {
    mode,
    deployLoadError,
    deployInfo,
    contractAddress,
    chainReady,
    account,
    connected: Boolean(account),
    loadingCatalog,
    pendingTx,
    products,
    catalogError,
    txMessage,
    sellerRatings,
    myPurchases,
    loadingPurchases,
    connect,
    disconnect,
    refreshCatalog,
    buy,
    sell,
    rateSeller,
    shorten,
  };
}
