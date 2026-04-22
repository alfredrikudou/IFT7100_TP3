"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import type { Product } from "@/types/product";
import abi from "@/contracts/FruitMarketV1.abi.json";
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
    priceWei: bigint;
    stock: bigint;
    seller: string;
    active: boolean;
  },
): Product {
  const stockNum = Number(raw.stock);
  return {
    id: id.toString(),
    name: raw.name,
    description: "",
    priceEth: Number(formatEther(raw.priceWei)),
    stock: Number.isSafeInteger(stockNum) ? stockNum : 0,
    emoji: "📦",
    sellerLabel: shorten(raw.seller),
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

  useEffect(() => {
    let cancelled = false;
    fetch("/fruit-market-local.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<LocalDeployFile>;
      })
      .then((data) => {
        if (cancelled) return;
        setDeployInfo(data);
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

  const readContract = useCallback(() => {
    if (!contractAddress || typeof window === "undefined" || !window.ethereum) {
      return null;
    }
    const provider = new BrowserProvider(window.ethereum);
    return new Contract(contractAddress, abi, provider);
  }, [contractAddress]);

  const refreshCatalog = useCallback(async () => {
    const c = readContract();
    if (!c) return;
    setLoadingCatalog(true);
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
    } finally {
      setLoadingCatalog(false);
    }
  }, [readContract]);

  useEffect(() => {
    if (chainReady) void refreshCatalog();
  }, [chainReady, refreshCatalog]);

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
    },
    [account, contractAddress, refreshCatalog],
  );

  const sell = useCallback(
    async (name: string, priceEth: number, stock: number) => {
      if (!contractAddress || !account) return;
      const eth = window.ethereum;
      if (!eth) return;
      const provider = new BrowserProvider(eth);
      const signer = await provider.getSigner();
      const c = new Contract(contractAddress, abi, signer);
      const wei = parseEther(String(priceEth));
      setPendingTx(true);
      setTxMessage("Publication du produit…");
      const tx = await c.addProduct(name, wei, BigInt(stock));
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
    txMessage,
    connect,
    disconnect,
    refreshCatalog,
    buy,
    sell,
    shorten,
  };
}
