import type { Eip1193Provider } from "ethers";

export type MetaMaskLikeProvider = Eip1193Provider & {
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: MetaMaskLikeProvider;
  }
}
