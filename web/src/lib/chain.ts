/** Hex chain id pour Hardhat par défaut (31337). */
export const HARDHAT_LOCAL_CHAIN_HEX = "0x7a69";

/** Sepolia testnet (11155111). */
export const SEPOLIA_CHAIN_HEX = "0xaa36a7";

export async function ensureSepoliaChain(): Promise<void> {
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!eth) throw new Error("Install MetaMask ou un portefeuille compatible EIP-1193.");

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code?: number }).code === "number"
        ? (err as { code?: number }).code
        : undefined;

    if (code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_HEX,
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          },
        ],
      });
      return;
    }
    throw err;
  }
}

export async function ensureHardhatLocalChain(): Promise<void> {
  const eth = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!eth) throw new Error("Install MetaMask ou un portefeuille compatible EIP-1193.");

  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_LOCAL_CHAIN_HEX }],
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code?: number }).code === "number"
        ? (err as { code?: number }).code
        : undefined;

    if (code === 4902) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: HARDHAT_LOCAL_CHAIN_HEX,
            chainName: "Hardhat Local",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["http://127.0.0.1:8545"],
          },
        ],
      });
      return;
    }
    throw err;
  }
}
